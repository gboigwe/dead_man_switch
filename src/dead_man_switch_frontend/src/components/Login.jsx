import React from 'react';

function Login({ onLogin }) {
  const handleLogin = () => {
    onLogin();
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Bitcoin Dead Man Switch</h1>
      
      <p className="login-description">
        Secure your Bitcoin assets with our Dead Man Switch solution built on the Internet Computer.
      </p>
      
      <div className="feature-list">
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          Set up automatic transfers if you don't check in
        </div>
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          No third-party custody of your Bitcoin
        </div>
        <div className="feature-item">
          <span className="feature-icon">✓</span>
          Powered by ICP's secure chain-key cryptography
        </div>
      </div>
      
      <button className="icp-login-btn" onClick={handleLogin}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 200 200" fill="none" style={{marginRight: '8px'}}>
          <path d="M100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0Z" fill="#3B00B9"/>
          <path d="M156.672 73.3594V126.641H149.859V87.7469L123.44 126.641H119.992L92.5781 86.875V126.641H85.7656V73.3594H91.7969L121.793 116.602L150.82 73.3594H156.672Z" fill="white"/>
          <path d="M78.2735 73.3594V80.1719H50.6251V96.4453H75.6251V103.258H50.6251V119.828H78.2735V126.641H43.8126V73.3594H78.2735Z" fill="white"/>
        </svg>
        Demo Login (Hackathon Only)
      </button>
    </div>
  );
}

export default Login;
