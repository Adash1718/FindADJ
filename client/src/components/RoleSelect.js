import React, { useState } from 'react';
import './RoleSelect.css';

function RoleSelect({ onSelectRole }) {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && selectedRole) {
      onSelectRole({
        id: 'user_' + Date.now(),
        name: name,
        user_type: selectedRole,
        email: `${name.toLowerCase().replace(/\s/g, '')}@temp.com`
      });
    }
  };

  return (
    <div className="role-select-container">
      <div className="role-select-card">
        <h1>🎵 Welcome to FindADJ</h1>
        <p className="subtitle">Connect DJs with Event Creators</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>What's your name?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>I am a...</label>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${selectedRole === 'dj' ? 'selected' : ''}`}
                onClick={() => setSelectedRole('dj')}
              >
                <div className="role-icon">🎧</div>
                <div className="role-title">DJ</div>
                <div className="role-desc">Find and play at events</div>
              </button>

              <button
                type="button"
                className={`role-btn ${selectedRole === 'party_thrower' ? 'selected' : ''}`}
                onClick={() => setSelectedRole('party_thrower')}
              >
                <div className="role-icon">🎉</div>
                <div className="role-title">Party Thrower</div>
                <div className="role-desc">Create events and find DJs</div>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={!name || !selectedRole}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default RoleSelect;

