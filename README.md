# Bitcoin Dead Man Switch

A trustless Bitcoin inheritance solution built on the Internet Computer Protocol. This application allows users to create "dead man switches" that automatically transfer Bitcoin to designated recipients if the user fails to check in within a specified timeframe.

## Problem & Solution

Bitcoin holders face a critical challenge: how to ensure their assets can be accessed by loved ones in case of emergency, without giving up custody to third parties.

Our Dead Man Switch provides a trustless inheritance solution by leveraging ICP's unique capabilities:
- Users create switches with Bitcoin addresses, recipients, and check-in intervals
- If users don't check in, funds are automatically transferred to designated recipients
- The entire process is trustless - no third party ever holds the private keys

## Key Features

- **Trustless Inheritance**: No third party holds the private keys
- **Configurable Timing**: Users set their own schedule for required check-ins
- **Multiple Recipients**: Support for multiple beneficiaries with different amounts 
- **Bitcoin Integration**: Uses ICP's direct Bitcoin integration without bridges
- **Chain-Key Cryptography**: Leverages ICP's threshold ECDSA signatures for secure Bitcoin transactions

## ICP-Specific Features Used

This project demonstrates several unique ICP capabilities:

1. **Bitcoin Integration API**: Direct access to Bitcoin UTXO set and transaction creation
2. **Threshold ECDSA Signatures**: For secure Bitcoin transaction signing without custody
3. **Canister Timers**: Periodic checking of switches through the heartbeat function
4. **On-Chain Frontend**: Frontend code hosted directly on the blockchain

## Architecture

The application consists of three main components:

1. **Backend Canister**: Manages switches, check-in logic, and timing
2. **Bitcoin Canister**: Handles Bitcoin address validation and transaction signing
3. **Frontend**: User interface for creating and managing switches

## Live Demo

The application is deployed on the IC mainnet:
For access to the Live demo, please contact the project maintainers:

## Local Development

### Prerequisites
- Node.js (v16+)
- DFX (v0.15.0+)
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/gboigwe/dead_man_switch.git
cd dead_man_switch

# Install dependencies
npm install

# Start the local replica
dfx start --clean --background

# Deploy the canisters
dfx deploy
```

## How It Works

1. **Setup**: Users create a switch by specifying:
- - Check-in interval
- - Source Bitcoin address
- - Recipient Bitcoin addresses and amounts
2. **Regular Check-ins**: Users must periodically confirm they're still in control
3. **Automatic Execution**: If a user fails to check in before their specified deadline, the switch is automatically triggered
4. **Secure Transfers**: The system uses ICP's chain-key cryptography to sign Bitcoin transactions

## Future Enhancements

- Email notifications for upcoming check-in deadlines
- Multi-signature requirements for triggering switches
- Support for additional cryptocurrencies through ICP's chain fusion
- Advanced scheduling options

## License
MIT License - see LICENSE file for details

## Acknowledgments

ICP/DFINITY for providing the Bitcoin integration capabilities
The Stacks Foundation for hosting the BUIDL Battle hackathon
