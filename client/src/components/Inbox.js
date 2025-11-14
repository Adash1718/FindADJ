import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { messageService } from '../services/auth';
import './Inbox.css';

function Inbox({ user }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="inbox-container">
        <h1 className="inbox-title">Messages</h1>
        
        {conversations.length === 0 ? (
          <div className="inbox-empty">
            <div className="empty-icon">💬</div>
            <h2>No Messages Yet</h2>
            <p>When you message DJs or event creators, your conversations will appear here.</p>
            <Link to="/events" className="btn btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map((conv) => (
              <Link
                key={`${conv.event_id}-${conv.other_user_id}`}
                to={`/messages/${conv.event_id}?userId=${conv.other_user_id}`}
                className="conversation-item"
              >
                <div className="conversation-avatar">
                  {conv.other_user_name.charAt(0).toUpperCase()}
                </div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <h3 className="conversation-name">{conv.other_user_name}</h3>
                    <span className="conversation-time">{formatTime(conv.last_message_time)}</span>
                  </div>
                  <div className="conversation-footer">
                    <p className={`conversation-preview ${conv.unread_count > 0 ? 'unread' : ''}`}>
                      {conv.last_message || 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="unread-dot"></span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;

