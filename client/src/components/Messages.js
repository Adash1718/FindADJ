import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { messageService, eventService } from '../services/auth';

function Messages({ user }) {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const [messages, setMessages] = useState([]);
  const [event, setEvent] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [eventId, targetUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      const eventData = await eventService.getById(eventId);
      setEvent(eventData.event);

      if (targetUserId) {
        const messagesData = await messageService.getConversation(eventId, targetUserId);
        setMessages(messagesData.messages || []);
      } else {
        const messagesData = await messageService.getByEvent(eventId);
        setMessages(messagesData.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetUserId) return;

    try {
      await messageService.send(eventId, targetUserId, newMessage);
      setNewMessage('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!targetUserId) {
    return (
      <div className="container">
        <div className="card">
          <h2>Messages for: {event?.title}</h2>
          <p>Select a user from the event queue to start messaging.</p>
        </div>
      </div>
    );
  }

  const otherUser = messages.find(m => 
    m.sender_id !== user.id && m.receiver_id !== user.id
  ) || { sender_name: 'User', receiver_name: 'User' };
  const otherUserName = messages.find(m => m.sender_id === targetUserId)?.sender_name || 
                        messages.find(m => m.receiver_id === targetUserId)?.receiver_name || 
                        'User';

  return (
    <div className="container">
      <div className="card">
        <h2>Messages: {event?.title}</h2>
        <p>Conversation with: <strong>{otherUserName}</strong></p>
      </div>

      <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>No messages yet. Start the conversation!</p>
          ) : (
            messages.map(message => {
              const isOwn = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  style={{
                    marginBottom: '15px',
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '10px 15px',
                      borderRadius: '10px',
                      backgroundColor: isOwn ? '#6366f1' : '#e5e7eb',
                      color: isOwn ? 'white' : 'black'
                    }}
                  >
                    <div style={{ fontSize: '12px', marginBottom: '5px', opacity: 0.8 }}>
                      {message.sender_name}
                    </div>
                    <div>{message.content}</div>
                    <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
          />
          <button type="submit" className="btn btn-primary">Send</button>
        </form>
      </div>
    </div>
  );
}

export default Messages;

