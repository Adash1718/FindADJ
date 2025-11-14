import React, { useState } from 'react';
import './RoleSelect.css';

function ProfileSetup({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    user_type: '',
    bio: '',
    genres: '',
    experience_years: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, user_type: role });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Save profile metadata to Clerk
      const profileData = {
        ...formData,
        email: user.email // Pass email to backend
      };
      
      console.log('Submitting profile:', profileData);
      
      const response = await fetch('http://localhost:5001/api/auth/complete-profile-clerk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile setup failed');
      }

      // Force page reload to fetch updated Clerk metadata
      console.log('Profile completed, reloading page to fetch Clerk metadata...');
      window.location.href = '/';
    } catch (err) {
      alert(err.message);
    }
  };

  if (step === 1) {
    return (
      <div className="role-select-container">
        <div className="role-select-card">
          <h1>👋 Hi {user.username}!</h1>
          <p className="subtitle">Let's set up your profile</p>

          <div className="form-group">
            <label>What should we call you?</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your display name"
              required
            />
          </div>

          <div className="form-group">
            <label>I am a...</label>
            <div className="role-buttons">
              <button
                type="button"
                className="role-btn"
                onClick={() => handleRoleSelect('dj')}
                disabled={!formData.name}
              >
                <div className="role-icon">🎧</div>
                <div className="role-title">DJ</div>
                <div className="role-desc">Find and play at events</div>
              </button>

              <button
                type="button"
                className="role-btn"
                onClick={() => handleRoleSelect('party_thrower')}
                disabled={!formData.name}
              >
                <div className="role-icon">🎉</div>
                <div className="role-title">Party Thrower</div>
                <div className="role-desc">Create events and find DJs</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-select-container">
      <div className="role-select-card">
        <h1>✨ Complete Your Profile</h1>
        <p className="subtitle">
          {formData.user_type === 'dj' ? '🎧 DJ Profile' : '🎉 Party Thrower Profile'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows="4"
              required
            />
          </div>

          {formData.user_type === 'dj' && (
            <>
              <div className="form-group">
                <label>Music Genres</label>
                <input
                  type="text"
                  name="genres"
                  value={formData.genres}
                  onChange={handleChange}
                  placeholder="e.g., House, EDM, Hip-Hop"
                  required
                />
              </div>

              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-large">
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;

