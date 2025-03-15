import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Timer "mo:base/Timer";

actor DmsBackend {
  // Types
  public type SwitchId = Nat;
  public type DeadManSwitch = {
    id: SwitchId;
    owner: Principal;
    name: Text;
    description: Text;
    checkInInterval: Int; // in nanoseconds
    lastCheckIn: Int; // Time.Time is Int
    sourceAddress: Text; // Bitcoin address to send from
    recipients: [Recipient];
    active: Bool;
    created: Int; // Time.Time is Int
  };

  public type Recipient = {
    name: Text;
    bitcoinAddress: Text;
    amount: Nat64; // Satoshis
  };

  public type SwitchError = {
    #NotFound;
    #NotAuthorized;
    #AlreadyExists;
    #InvalidInput;
    #CanisterError;
  };

  public type BitcoinCanister = actor {
    validateBitcoinAddress : (address: Text) -> async Bool;
    executeDeadManSwitch : (network: {#Mainnet; #Testnet}, fromAddress: Text, recipients: [(Text, Nat64)]) -> async Result.Result<Text, {#InvalidAddress; #InsufficientFunds; #TransactionFailed; #NetworkError}>;
  };

  // State
  private stable var nextSwitchId: SwitchId = 0;
  private stable var switchesEntries : [(SwitchId, DeadManSwitch)] = [];
  private var switches = HashMap.fromIter<SwitchId, DeadManSwitch>(switchesEntries.vals(), 10, Nat.equal, Hash.hash);
  private stable var lastHeartbeatLog: Int = 0; // To track last time we logged

  // Bitcoin canister ID - would be updated based on your actual deployment
  let bitcoinCanisterId = Principal.fromText("cuj6u-c4aaa-aaaaa-qaajq-cai");
  let bitcoinCanister : BitcoinCanister = actor(Principal.toText(bitcoinCanisterId));

  system func preupgrade() {
    switchesEntries := Iter.toArray(switches.entries());
  };

  system func postupgrade() {
    switchesEntries := [];
  };

  // Create a new Dead Man Switch
  public shared(msg) func createSwitch(
    name: Text,
    description: Text,
    checkInIntervalDays: Nat,
    sourceAddress: Text,
    recipients: [Recipient]
  ) : async Result.Result<SwitchId, SwitchError> {
    let caller = msg.caller;

    if (Principal.isAnonymous(caller)) {
      return #err(#NotAuthorized);
    };

    if (Text.size(name) == 0) {
      return #err(#InvalidInput);
    };

    if (recipients.size() == 0) {
      return #err(#InvalidInput);
    };

    // Validate Bitcoin addresses
    try {
      let sourceValid = await bitcoinCanister.validateBitcoinAddress(sourceAddress);
      if (not sourceValid) {
        return #err(#InvalidInput);
      };

      for (recipient in recipients.vals()) {
        let isValid = await bitcoinCanister.validateBitcoinAddress(recipient.bitcoinAddress);
        if (not isValid) {
          return #err(#InvalidInput);
        };
      };
    } catch (e) {
      Debug.print("Error validating Bitcoin addresses");
      return #err(#CanisterError);
    };

    let id = nextSwitchId;
    nextSwitchId += 1;

    // Convert days to nanoseconds
    let checkInInterval : Int = (checkInIntervalDays * 24 * 60 * 60 * 1_000_000_000);
    let now = Time.now();

    let newSwitch: DeadManSwitch = {
      id = id;
      owner = caller;
      name = name;
      description = description;
      checkInInterval = checkInInterval;
      lastCheckIn = now;
      sourceAddress = sourceAddress;
      recipients = recipients;
      active = true;
      created = now;
    };

    switches.put(id, newSwitch);
    return #ok(id);
  };

  // Get a switch by ID
  public query func getSwitch(id: SwitchId) : async Result.Result<DeadManSwitch, SwitchError> {
    switch (switches.get(id)) {
      case null { #err(#NotFound) };
      case (?deadManSwitch) { #ok(deadManSwitch) };
    };
  };

  // Get all switches owned by the caller
  public shared query(msg) func getMySwitches() : async [DeadManSwitch] {
    let caller = msg.caller;
    
    if (Principal.isAnonymous(caller)) {
      return [];
    };

    let mySwitches = Array.mapFilter<(SwitchId, DeadManSwitch), DeadManSwitch>(
      Iter.toArray(switches.entries()),
      func((_, dms)) {
        if (Principal.equal(dms.owner, caller)) {
          ?dms
        } else {
          null
        }
      }
    );

    return mySwitches;
  };

  // Check in to reset the timer for a switch
  public shared(msg) func checkIn(id: SwitchId) : async Result.Result<(), SwitchError> {
    let caller = msg.caller;

    switch (switches.get(id)) {
      case null { 
        return #err(#NotFound);
      };
      case (?deadManSwitch) {
        if (not Principal.equal(deadManSwitch.owner, caller)) {
          return #err(#NotAuthorized);
        };

        let updatedSwitch = {
          deadManSwitch with
          lastCheckIn = Time.now()
        };

        switches.put(id, updatedSwitch);
        return #ok();
      };
    };
  };

  // Activate or deactivate a switch
  public shared(msg) func toggleSwitch(id: SwitchId, active: Bool) : async Result.Result<(), SwitchError> {
    let caller = msg.caller;

    switch (switches.get(id)) {
      case null { 
        return #err(#NotFound);
      };
      case (?deadManSwitch) {
        if (not Principal.equal(deadManSwitch.owner, caller)) {
          return #err(#NotAuthorized);
        };

        let updatedSwitch = {
          deadManSwitch with
          active = active
        };

        switches.put(id, updatedSwitch);
        return #ok();
      };
    };
  };

  // Delete a switch
  public shared(msg) func deleteSwitch(id: SwitchId) : async Result.Result<(), SwitchError> {
    let caller = msg.caller;

    switch (switches.get(id)) {
      case null { 
        return #err(#NotFound);
      };
      case (?deadManSwitch) {
        if (not Principal.equal(deadManSwitch.owner, caller)) {
          return #err(#NotAuthorized);
        };

        switches.delete(id);
        return #ok();
      };
    };
  };

  // Manually trigger a switch (for demo purposes)
  public shared(msg) func triggerSwitch(id: SwitchId) : async Result.Result<Text, SwitchError> {
    let caller = msg.caller;

    switch (switches.get(id)) {
      case null { 
        return #err(#NotFound);
      };
      case (?deadManSwitch) {
        if (not Principal.equal(deadManSwitch.owner, caller)) {
          return #err(#NotAuthorized);
        };
        
        if (not deadManSwitch.active) {
          return #err(#InvalidInput);
        };

        try {
          // Format recipients for Bitcoin transfer
          let formattedRecipients = Array.map<Recipient, (Text, Nat64)>(
            deadManSwitch.recipients,
            func(r) { (r.bitcoinAddress, r.amount) }
          );

          // Execute Bitcoin transfer
          let result = await bitcoinCanister.executeDeadManSwitch(
            #Testnet, // Use Testnet for demo
            deadManSwitch.sourceAddress,
            formattedRecipients
          );

          switch (result) {
            case (#ok(txId)) { 
              return #ok(txId);
            };
            case (#err(_)) {
              return #err(#CanisterError);
            };
          };
        } catch (e) {
          Debug.print("Error triggering switch");
          return #err(#CanisterError);
        };
      };
    };
  };

  // Timer function - This would check all switches and execute if needed
  system func heartbeat() : async () {
    let now = Time.now();
    
    // Only log every 5 minutes to reduce console spam
    let logInterval = 5 * 60 * 1_000_000_000; // 5 minutes in nanoseconds
    if (now - lastHeartbeatLog > logInterval) {
      Debug.print("Heartbeat check at " # Int.toText(now));
      lastHeartbeatLog := now;
    };
    
    for ((id, dms) in switches.entries()) {
      if (dms.active) {
        let deadline = dms.lastCheckIn + dms.checkInInterval;
        
        if (now > deadline) {
          Debug.print("Switch " # Nat.toText(id) # " has expired! Executing...");
          
          // This would actually trigger the Bitcoin transfer in a production system
          // For the MVP, we just log it
          for (recipient in dms.recipients.vals()) {
            Debug.print("Would send " # Nat64.toText(recipient.amount) # " satoshis to " # recipient.bitcoinAddress);
          };
        };
      };
    };
  };
}
