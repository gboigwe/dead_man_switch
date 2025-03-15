import React, { useState, useEffect } from 'react';

function SwitchDetail({ switchId, setActiveView, backend }) {
  const [deadManSwitch, setDeadManSwitch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  useEffect(() => {
    fetchSwitchDetails();
  }, [switchId]);

  const fetchSwitchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For hackathon demo, use mock data
      if (switchId === 1) {
        setDeadManSwitch({
          id: 1,
          name: "Family Inheritance",
          description: "Transfer Bitcoin to my family if I don't check in",
          sourceAddress: "bc1q9h5ys3zf82cz5klm0kv8d3azjrwypwsm97tlrx",
          active: true,
          lastCheckIn: Date.now() * 1000000 - 5 * 24 * 60 * 60 * 1000000000,
          checkInInterval: 30 * 24 * 60 * 60 * 1000000000,
          recipients: [
            { name: "Alice", bitcoinAddress: "bc1q9h5ys3zf82cz5klm0kv8d3azjrwypwsm97tlrx", amount: 5000000 },
            { name: "Bob", bitcoinAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", amount: 5000000 }
          ],
          created: Date.now() * 1000000 - 60 * 24 * 60 * 60 * 1000000000
        });
      } else if (switchId === 2) {
        setDeadManSwitch({
          id: 2,
          name: "Emergency Fund",
          description: "Access to emergency Bitcoin funds",
          sourceAddress: "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h",
          active: true,
          lastCheckIn: Date.now() * 1000000 - 1 * 24 * 60 * 60 * 1000000000,
          checkInInterval: 15 * 24 * 60 * 60 * 1000000000,
          recipients: [
            { name: "Trusted Friend", bitcoinAddress: "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h", amount: 2000000 }
          ],
          created: Date.now() * 1000000 - 30 * 24 * 60 * 60 * 1000000000
        });
      } else {
        // If we don't have mock data for this ID, try the backend
        if (backend) {
          try {
            const result = await backend.getSwitch(Number(switchId));
            if ('ok' in result) {
              setDeadManSwitch(result.ok);
            } else {
              throw new Error("Switch not found");
            }
          } catch (err) {
            console.error("Error fetching from backend:", err);
            setError("Failed to load switch details");
          }
        } else {
          setError("Switch not found");
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      
      // Update local state for immediate feedback
      setDeadManSwitch({
        ...deadManSwitch,
        lastCheckIn: Date.now() * 1000000
      });
      
      // Try backend in background
      if (backend) {
        try {
          await backend.checkIn(Number(switchId));
        } catch (err) {
          console.warn("Backend check-in failed:", err);
        }
      }
    } catch (err) {
      console.error("Error checking in:", err);
      alert("Failed to check in. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleTriggerSwitch = async () => {
    try {
      setTriggering(true);
      
      // For the demo, simulate success
      setTimeout(() => {
        setTransactionId("f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16");
        setTriggering(false);
      }, 1500);
      
      // Try backend in background but don't block UI
      if (backend) {
        try {
          const result = await backend.triggerSwitch(Number(switchId));
          if ('ok' in result) {
            setTransactionId(result.ok);
          }
        } catch (err) {
          console.warn("Backend trigger failed:", err);
        }
      }
    } catch (err) {
      console.error("Error triggering switch:", err);
      alert("Failed to trigger switch. Please try again.");
      setTriggering(false);
    }
  };

  // Calculate time remaining until next check-in is required
  const calculateTimeRemaining = () => {
    if (!deadManSwitch) return { days: 0, hours: 0, minutes: 0, status: 'normal' };
    
    const lastCheckInTime = Number(deadManSwitch.lastCheckIn);
    const interval = Number(deadManSwitch.checkInInterval);
    const deadline = lastCheckInTime + interval;
    const now = Date.now() * 1000000; // Convert to nanoseconds
    
    const remaining = deadline - now;
    
    if (remaining <= 0) {
      return { days: 0, hours: 0, minutes: 0, status: 'expired' };
    }
    
    // Convert nanoseconds to days, hours, minutes
    const days = Math.floor(remaining / (1000000000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000000000 * 60 * 60 * 24)) / (1000000000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000000000 * 60 * 60)) / (1000000000 * 60));
    
    let status = 'normal';
    if (days < 2) status = 'warning';
    if (days === 0 && hours < 12) status = 'danger';
    
    return { days, hours, minutes, status };
  };

  // Format date to readable string
  const formatDate = (nanoseconds) => {
    const date = new Date(Number(nanoseconds) / 1000000);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format interval to days
  const formatInterval = (nanoseconds) => {
    const days = Math.floor(Number(nanoseconds) / (1000000000 * 60 * 60 * 24));
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
        <p className="text-center">Loading switch details...</p>
      </div>
    );
  }

  if (error && !deadManSwitch) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div>
          <h3 className="font-bold">Error</h3>
          <div className="text-sm">{error}</div>
        </div>
        <button 
          className="btn btn-sm ml-auto"
          onClick={() => setActiveView('dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!deadManSwitch) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p>Switch not found</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => setActiveView('dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = calculateTimeRemaining();

  return (
    <div>
      <div className="card-header">
        <div className="flex items-center">
          <button 
            className="btn btn-outline btn-sm mr-2"
            onClick={() => setActiveView('dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <div>
            <h1 className="card-title">{deadManSwitch.name}</h1>
            <p className="card-subtitle">
              Dead Man Switch Details
            </p>
          </div>
        </div>
      </div>

      {/* Primary action buttons */}
      <div className="card mb-5">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col justify-center">
            <div className="mb-1 font-semibold">Time until activation:</div>
            <div className={`countdown ${timeRemaining.status === 'warning' ? 'warning' : timeRemaining.status === 'danger' ? 'danger' : ''}`}>
              {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={handleCheckIn}
              disabled={checkingIn}
            >
              {checkingIn ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px' }}></div>
                  Checking In...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Check In Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Switch details */}
      <div className="card mb-5">
        <h2 className="text-xl font-semibold mb-4">Switch Information</h2>
        
        <div className="rounded-box mb-4">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Status:</span>
            <span className={`status-badge ${deadManSwitch.active ? 'status-active' : 'status-inactive'}`}>
              {deadManSwitch.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span className="font-medium">Created:</span>
            <span>{formatDate(deadManSwitch.created)}</span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span className="font-medium">Last Check-in:</span>
            <span>{formatDate(deadManSwitch.lastCheckIn)}</span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span className="font-medium">Check-in Interval:</span>
            <span>{formatInterval(deadManSwitch.checkInInterval)}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium mb-2">Description:</h3>
          <p className="rounded-box">{deadManSwitch.description}</p>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Source Address:</h3>
          <div className="rounded-box">
            <code className="bitcoin-address">{deadManSwitch.sourceAddress}</code>
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="card mb-5">
        <h2 className="text-xl font-semibold mb-4">Recipients</h2>
        
        {deadManSwitch.recipients.length === 0 ? (
          <p className="text-center py-4">No recipients configured</p>
        ) : (
          <div>
            {deadManSwitch.recipients.map((recipient, index) => (
              <div key={index} className="recipient-card mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{recipient.name}</h3>
                  <span className="font-mono bg-white px-2 py-1 rounded text-sm">
                    {typeof recipient.amount === 'bigint' 
                      ? recipient.amount.toString()
                      : recipient.amount.toString()} satoshis
                  </span>
                </div>
                <code className="bitcoin-address">{recipient.bitcoinAddress}</code>
              </div>
            ))}
            
            <div className="rounded-box mt-4">
              <div className="flex justify-between text-sm">
                <span>Total Recipients:</span>
                <span>{deadManSwitch.recipients.length}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>
                  {deadManSwitch.recipients.reduce((sum, r) => {
                    const amount = typeof r.amount === 'bigint' ? Number(r.amount) : Number(r.amount);
                    return sum + amount;
                  }, 0).toLocaleString()} satoshis
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* For hackathon demo: Manual trigger section */}
      <div className="card mb-5">
        <h2 className="text-xl font-semibold mb-4">Demo Actions</h2>
        <p className="mb-4 text-gray">
          This section allows you to manually trigger the switch for demonstration purposes.
          In a real-world scenario, the switch would be triggered automatically if you don't check in.
        </p>
        
        <button 
          className="btn btn-danger"
          onClick={handleTriggerSwitch}
          disabled={triggering || !deadManSwitch.active}
        >
          {triggering ? (
            <>
              <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px' }}></div>
              Triggering...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
              Manually Trigger Switch
            </>
          )}
        </button>
        
        {!deadManSwitch.active && (
          <p className="mt-2 text-sm text-danger">
            Switch must be active to trigger it.
          </p>
        )}
        
        {transactionId && (
          <div className="alert alert-success mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <div>
              <h3 className="font-bold">Switch Triggered Successfully!</h3>
              <div className="text-sm">
                Bitcoin transaction initiated with ID:
                <div className="mt-1">
                  <code className="bitcoin-address text-xs">{transactionId}</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SwitchDetail;
