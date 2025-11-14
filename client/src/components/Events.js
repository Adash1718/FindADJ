import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/auth';

function Events({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getAll();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>All Events</h1>
      {events.length === 0 ? (
        <div className="card">
          <p>No events available.</p>
        </div>
      ) : (
        events.map(event => (
          <div key={event.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h3>
                  <Link to={`/events/${event.id}`} style={{ color: '#6366f1', textDecoration: 'none' }}>
                    {event.title}
                  </Link>
                </h3>
                <p><strong>Created by:</strong> {event.creator_name}</p>
                <p><strong>Location:</strong> {event.location_private ? 'Private' : event.location}</p>
                <p><strong>Size:</strong> {event.size || 'N/A'}</p>
                <p><strong>Theme:</strong> {event.theme || 'N/A'}</p>
                <p><strong>Music Genres:</strong> {event.music_genres || 'N/A'}</p>
                <p><strong>Status:</strong> <span style={{ 
                  color: event.status === 'open' ? '#10b981' : event.status === 'closed' ? '#ef4444' : '#6b7280'
                }}>{event.status.toUpperCase()}</span></p>
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

export default Events;

