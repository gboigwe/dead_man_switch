import React, { useState, useEffect } from 'react';

function Dashboard({ setActiveView, onViewSwitch, backend }) {
  const [switches, setSwitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingIn, setCheckingIn] = useState(null);

  useEffect(() => {
    fetchSwitches();
  }, []);

  const fetchSwitches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For the hackathon demo, use mock data
      const mockSwitches = [
        {
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
        },
        {
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
        }
      ];
      
      setSwitches(mockSwitches);
      
      // Try to fetch from backend in background, but don't break flow if it fails
      if (backend) {
        try {
          const result = await backend.getMySwitches();
          if (result && result.length > 0) {
            setSwitches(result);
          }
        } catch (err) {
          console.warn("Backend call failed, using mock data:", err);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      setCheckingIn(id);
      
      // Update the local state for immediate feedback
      setSwitches(switches.map(s => 
        s.id === id ? {...s, lastCheckIn: Date.now() * 1000000} : s
      ));
      
      // Try to check in with backend, but don't break flow if it fails
      if (backend) {
        try {
          await backend.checkIn(id);
        } catch (err) {
          console.warn("Backend check-in failed:", err);
        }
      }
    } catch (err) {
      console.error("Error checking in:", err);
      alert("Failed to check in. Please try again.");
    } finally {
      setCheckingIn(null);
    }
  };

  // Calculate time remaining until next check-in is required
  const calculateTimeRemaining = (lastCheckIn, interval) => {
    const lastCheckInTime = Number(lastCheckIn);
    const deadline = lastCheckInTime + Number(interval);
    const now = Date.now() * 1000000; // Convert to nanoseconds
    
    const remaining = deadline - now;
    
    if (remaining <= 0) return { text: "OVERDUE", status: "expired" };
    
    // Convert nanoseconds to days
    const days = Math.floor(remaining / (1000000000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000000000 * 60 * 60 * 24)) / (1000000000 * 60 * 60));
    
    let status = "normal";
    if (days < 2) status = "warning";
    if (days === 0 && hours < 12) status = "expired";
    
    if (days > 0) {
      return { text: `${days}d ${hours}h`, status };
    } else {
      return { text: `${hours}h`, status };
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
        <p className="text-center">Loading your switches...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header">
        <div>
          <h1 className="card-title">Your Dead Man Switches</h1>
          <p className="card-subtitle">
            Manage your Bitcoin inheritance and emergency access solutions
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveView('create')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New Switch
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error!</strong> {error}
          <button 
            className="btn btn-sm btn-danger ml-auto"
            onClick={fetchSwitches}
          >
            Retry
          </button>
        </div>
      )}

      {switches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h2 className="empty-state-title">No switches found</h2>
          <p className="empty-state-description">
            You don't have any dead man switches yet. Create your first switch to secure your Bitcoin inheritance.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveView('create')}
          >
            Create Your First Switch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm-grid-cols-2 lg-grid-cols-3">
          {switches.map((dms) => {
            const timeRemaining = calculateTimeRemaining(dms.lastCheckIn, dms.checkInInterval);
            
            return (
              <div key={dms.id} className="switch-card">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">{dms.name}</h2>
                  <span className={`status-badge ${dms.active ? 'status-active' : 'status-inactive'}`}>
                    {dms.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="switch-description">{dms.description}</p>
                
                <div className="switch-info-row">
                  <span className="switch-info-label">Next check-in:</span>
                  <span className={`switch-info-value font-medium ${timeRemaining.status === 'warning' ? 'text-warning' : timeRemaining.status === 'expired' ? 'text-danger' : ''}`}>
                    {timeRemaining.text}
                  </span>
                </div>
                
                <div className="switch-info-row">
                  <span className="switch-info-label">Last checked in:</span>
                  <span className="switch-info-value">
                    {formatDate(dms.lastCheckIn)}
                  </span>
                </div>
                
                <div className="switch-info-row mb-4">
                  <span className="switch-info-label">Recipients:</span>
                  <span className="switch-info-value">
                    {dms.recipients.length}
                  </span>
                </div>
                
                <div className="switch-actions">
                  <button 
                    className="btn btn-primary w-full"
                    onClick={() => handleCheckIn(dms.id)}
                    disabled={checkingIn === dms.id}
                  >
                    {checkingIn === dms.id ? (
                      <>
                        <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px' }}></div>
                        Checking In...
                      </>
                    ) : 'Check In'}
                  </button>
                  <button 
                    className="btn btn-outline w-full"
                    onClick={() => onViewSwitch(dms.id)}
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
