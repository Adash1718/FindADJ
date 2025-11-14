import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService, queueService, messageService, profileService } from '../services/auth';
import { invitationService } from '../services/invitations';

function EventDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [isSelectedDJ, setIsSelectedDJ] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const [eventData, queueData] = await Promise.all([
        eventService.getById(id),
        queueService.getQueue(id)
      ]);
      setEvent(eventData.event);
      setQueue(queueData.queue || []);
      setInQueue(queueData.queue?.some(q => q.dj_id === user.id) || false);
      setIsSelectedDJ(eventData.event?.selected_dj_id === user.id);
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    try {
      await queueService.join(id);
      setInQueue(true);
      loadEvent();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join queue');
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await queueService.leave(id);
      setInQueue(false);
      loadEvent();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave queue');
    }
  };

  const handleInviteDJ = async (djId) => {
    try {
      await invitationService.sendInvitation(id, djId);
      alert('Invitation sent! Waiting for DJ to accept.');
      loadEvent();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send invitation');
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      await invitationService.acceptInvitation(id);
      alert('You accepted the invitation! You are now the official DJ.');
      loadEvent();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async () => {
    if (window.confirm('Are you sure you want to decline this invitation?')) {
      try {
        await invitationService.declineInvitation(id);
        alert('You declined the invitation.');
        loadEvent();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to decline invitation');
      }
    }
  };

  const handleOptOut = async () => {
    if (window.confirm('Are you sure you want to opt out? This will reopen the queue.')) {
      try {
        await queueService.optOut(id);
        setIsSelectedDJ(false);
        loadEvent();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to opt out');
      }
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!event) {
    return <div className="container">Event not found</div>;
  }

  const isCreator = event.creator_id === user.id;
  const canJoinQueue = user.user_type === 'dj' && event.status === 'open' && !event.selected_dj_id;
  const hasPendingInvitation = event.pending_dj_id === user.id;

  return (
    <div className="container">
      <div className="card">
        <h1>{event.title}</h1>
        <p><strong>Created by:</strong> <Link to={`/profile/${event.creator_id}`}>{event.creator_name}</Link></p>
        <p><strong>Location:</strong> {event.location_private ? 'Private' : event.location}</p>
        <p><strong>Size:</strong> {event.size || 'N/A'}</p>
        <p><strong>Audience:</strong> {event.audience || 'N/A'}</p>
        {event.age_range_min && event.age_range_max && (
          <p><strong>Age Range:</strong> {event.age_range_min}-{event.age_range_max}</p>
        )}
        <p><strong>Occupancy:</strong> {event.occupancy || 'N/A'}</p>
        <p><strong>Theme:</strong> {event.theme || 'N/A'}</p>
        <p><strong>Music Genres:</strong> {event.music_genres || 'N/A'}</p>
        <p><strong>Start Time:</strong> {new Date(event.time_frame_start).toLocaleString()}</p>
        <p><strong>End Time:</strong> {new Date(event.time_frame_end).toLocaleString()}</p>
        <p><strong>Provided Equipment:</strong> {event.provided_equipment || 'N/A'}</p>
        <p><strong>Necessary Equipment:</strong> {event.necessary_equipment || 'N/A'}</p>
        <p><strong>Additional Notes:</strong> {event.additional_notes || 'N/A'}</p>
        <p><strong>Status:</strong> <span style={{ 
          color: event.status === 'open' ? '#10b981' : event.status === 'closed' ? '#ef4444' : '#6b7280'
        }}>{event.status.toUpperCase()}</span></p>

        {hasPendingInvitation && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#dbeafe', borderRadius: '5px' }}>
            <h3>🎉 You have an invitation!</h3>
            <p>The event creator has invited you to play at this event.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleAcceptInvitation} className="btn btn-primary">Accept Invitation</button>
              <button onClick={handleDeclineInvitation} className="btn btn-secondary">Decline</button>
            </div>
          </div>
        )}

        {isSelectedDJ && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#dcfce7', borderRadius: '5px' }}>
            <p><strong>✅ You are the official DJ for this event!</strong></p>
            <button onClick={handleOptOut} className="btn btn-danger">Opt Out</button>
          </div>
        )}

        {canJoinQueue && !inQueue && (
          <button onClick={handleJoinQueue} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Join Queue
          </button>
        )}

        {inQueue && !isSelectedDJ && (
          <div style={{ marginTop: '20px' }}>
            <p className="success">You are in the queue!</p>
            <button onClick={handleLeaveQueue} className="btn btn-secondary">Leave Queue</button>
          </div>
        )}
      </div>

      {event.selected_dj_id && (
        <div className="card">
          <h2>Selected DJ</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/profile/${event.selected_dj_id}`} className="btn btn-primary">
              View {event.selected_dj_name}'s Profile
            </Link>
            {isCreator && (
              <Link to={`/messages/${id}?userId=${event.selected_dj_id}`} className="btn btn-secondary">
                Message {event.selected_dj_name}
              </Link>
            )}
          </div>
        </div>
      )}

      {event.pending_dj_name && (
        <div className="card" style={{ backgroundColor: '#fef3c7' }}>
          <h2>⏳ Invitation Pending</h2>
          <p>Waiting for <strong>{event.pending_dj_name}</strong> to respond to your invitation.</p>
        </div>
      )}

      {isCreator && event.status === 'open' && !event.pending_dj_id && (
        <div className="card">
          <h2>DJ Queue ({queue.length})</h2>
          {queue.length === 0 ? (
            <p>No DJs in queue yet.</p>
          ) : (
            <div>
              {queue.map((dj, index) => (
                <div key={dj.id} style={{ 
                  padding: '15px', 
                  marginBottom: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3>
                      <Link to={`/profile/${dj.dj_id}`} style={{ color: '#6366f1', textDecoration: 'none' }}>
                        {dj.dj_name}
                      </Link>
                    </h3>
                    <p>⭐ {dj.average_rating?.toFixed(1) || 'N/A'} | {dj.genres || 'N/A'} | {dj.total_events || 0} events</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Joined: {new Date(dj.joined_at).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to={`/messages/${id}?userId=${dj.dj_id}`} className="btn btn-secondary">
                      Message
                    </Link>
                    <button onClick={() => handleInviteDJ(dj.dj_id)} className="btn btn-primary">
                      Send Invitation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isCreator && inQueue && (
        <div className="card">
          <Link to={`/messages/${id}?userId=${event.creator_id}`} className="btn btn-primary">
            Message Event Creator
          </Link>
        </div>
      )}
    </div>
  );
}

export default EventDetail;

