import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CreateSwitch from './components/CreateSwitch';
import SwitchDetail from './components/SwitchDetail';
import Login from './components/Login';
import './index.css';

// Import actor declarations - make sure to use the correct paths based on your project structure
import { dead_man_switch_backend } from '../../declarations/dead_man_switch_backend';
import { dead_man_switch_bitcoin } from '../../declarations/dead_man_switch_bitcoin';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeSwitch, setActiveSwitch] = useState(null);

  useEffect(() => {
    // For development/demo: auto-login
    setAuthenticated(true);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    setAuthenticated(false);
    // Also show login screen
    window.location.reload();
  };

  const handleViewSwitch = (switchId) => {
    setActiveSwitch(switchId);
    setActiveView('detail');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {authenticated ? (
        <>
          <Header 
            activeView={activeView} 
            setActiveView={setActiveView}
            handleLogout={handleLogout}
          />
          <main className="main-content">
            {activeView === 'dashboard' && (
              <Dashboard 
                setActiveView={setActiveView}
                onViewSwitch={handleViewSwitch}
                backend={dead_man_switch_backend}
              />
            )}
            {activeView === 'create' && (
              <CreateSwitch 
                setActiveView={setActiveView}
                backend={dead_man_switch_backend}
                bitcoinCanister={dead_man_switch_bitcoin}
              />
            )}
            {activeView === 'detail' && (
              <SwitchDetail 
                switchId={activeSwitch}
                setActiveView={setActiveView}
                backend={dead_man_switch_backend}
                bitcoinCanister={dead_man_switch_bitcoin}
              />
            )}
          </main>
        </>
      ) : (
        <Login onLogin={() => setAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;
