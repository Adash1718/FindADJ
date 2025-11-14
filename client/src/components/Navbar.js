import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { messageService } from '../services/auth';
import './Navbar.css';

function Navbar({ user }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const data = await messageService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            🎵 FindADJ
          </Link>
          <div className="navbar-links">
            <Link to="/inbox" className="nav-link-with-badge">
              Messages
              {unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
            </Link>
            <Link to="/events">Events</Link>
            {user.user_type === 'party_thrower' && (
              <Link to="/create-event">Create Event</Link>
            )}
            <span className="navbar-user">
              {user.user_type === 'dj' ? '🎧' : '🎉'} {user.name}
            </span>
            <UserButton 
              afterSignOutUrl="/"
              afterSignOutAllUrl="/"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

