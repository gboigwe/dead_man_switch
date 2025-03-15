import React from 'react';

function Header({ activeView, setActiveView, handleLogout }) {
  return (
    <header className="header">
      <div className="header-container">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}>
          <span className="bitcoin-icon">₿</span>
          <h1>Bitcoin Dead Man Switch</h1>
        </a>
        
        <nav className="nav">
          <a 
            href="#" 
            className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`} 
            onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
          >
            Dashboard
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeView === 'create' ? 'active' : ''}`} 
            onClick={(e) => { e.preventDefault(); setActiveView('create'); }}
          >
            Create Switch
          </a>
          
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
