import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService, profileService } from '../services/auth';

function Dashboard({ user }) {
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, notificationsData] = await Promise.all([
        eventService.getAll(),
        profileService.getNotifications()
      ]);
      setEvents(eventsData.events || []);
      setNotifications(notificationsData.notifications || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await profileService.markNotificationRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: 1 } : n
      ));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      {unreadNotifications.length > 0 && (
        <div className="card" style={{ backgroundColor: '#fef3c7', marginBottom: '20px' }}>
          <h3>Notifications ({unreadNotifications.length})</h3>
          {unreadNotifications.slice(0, 5).map(notification => (
            <div key={notification.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              <p>{notification.message}</p>
              {notification.event_title && (
                <Link to={`/events/${notification.event_id}`} style={{ fontSize: '14px', color: '#6366f1' }}>
                  View Event: {notification.event_title}
                </Link>
              )}
              <button 
                onClick={() => handleMarkRead(notification.id)}
                className="btn btn-secondary"
                style={{ marginTop: '5px', padding: '5px 10px', fontSize: '14px' }}
              >
                Mark as Read
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Recent Events</h2>
        {user.user_type === 'party_thrower' && (
          <Link to="/create-event" className="btn btn-primary">Create Event</Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="card">
          <p>No events yet. {user.user_type === 'party_thrower' && 'Create one to get started!'}</p>
        </div>
      ) : (
        events.slice(0, 10).map(event => (
          <div key={event.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>
                  <Link to={`/events/${event.id}`} style={{ color: '#6366f1', textDecoration: 'none' }}>
                    {event.title}
                  </Link>
                </h3>
                <p><strong>Created by:</strong> {event.creator_name}</p>
                <p><strong>Location:</strong> {event.location_private ? 'Private' : event.location}</p>
                <p><strong>Theme:</strong> {event.theme || 'N/A'}</p>
                <p><strong>Status:</strong> {event.status}</p>
                {event.selected_dj_name && (
                  <p><strong>Selected DJ:</strong> {event.selected_dj_name}</p>
                )}
                {event.queue_count > 0 && (
                  <p><strong>DJs in Queue:</strong> {event.queue_count}</p>
                )}
              </div>
              <Link to={`/events/${event.id}`} className="btn btn-primary">View Details</Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;

