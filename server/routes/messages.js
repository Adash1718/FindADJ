const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all conversations for a user (inbox view)
router.get('/conversations', authenticate, (req, res) => {
  const userId = req.user.id;

  // Simpler query that gets conversations grouped by event and other user
  const query = `
    SELECT 
      conversation_data.*,
      (SELECT content FROM messages m2 
       WHERE m2.event_id = conversation_data.event_id 
       AND ((m2.sender_id = ? AND m2.receiver_id = conversation_data.other_user_id) 
            OR (m2.sender_id = conversation_data.other_user_id AND m2.receiver_id = ?))
       ORDER BY m2.created_at DESC LIMIT 1) as last_message,
      (SELECT COUNT(*) FROM messages m3 
       WHERE m3.receiver_id = ? 
       AND m3.sender_id = conversation_data.other_user_id 
       AND m3.event_id = conversation_data.event_id 
       AND m3.read = 0) as unread_count
    FROM (
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id,
        CASE 
          WHEN m.sender_id = ? THEN receiver.name 
          ELSE sender.name 
        END as other_user_name,
        e.id as event_id,
        e.title as event_title,
        MAX(m.created_at) as last_message_time
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      JOIN events e ON m.event_id = e.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY 
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END,
        e.id
    ) as conversation_data
    ORDER BY conversation_data.last_message_time DESC
  `;

  console.log('Fetching conversations for user:', userId);

  db.all(query, [userId, userId, userId, userId, userId, userId, userId, userId], (err, conversations) => {
    if (err) {
      console.error('Error fetching conversations:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('Found conversations:', conversations.length);
    console.log('Conversations:', JSON.stringify(conversations, null, 2));
    res.json({ conversations });
  });
});

// Get total unread message count
router.get('/unread-count', authenticate, (req, res) => {
  db.get(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0',
    [req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ count: result.count });
    }
  );
});

// Send message
router.post('/', authenticate, [
  body('event_id').notEmpty(),
  body('receiver_id').notEmpty(),
  body('content').trim().notEmpty()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event_id, receiver_id, content } = req.body;

    // Verify event exists
    db.get('SELECT id FROM events WHERE id = ?', [event_id], (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const messageId = uuidv4();
      db.run(
        'INSERT INTO messages (id, event_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?, ?)',
        [messageId, event_id, req.user.id, receiver_id, content],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to send message' });
          }

          // Create notification for receiver
          const notificationId = uuidv4();
          db.get('SELECT name FROM users WHERE id = ?', [req.user.id], (err, sender) => {
            db.run(
              'INSERT INTO notifications (id, user_id, type, message, event_id) VALUES (?, ?, ?, ?, ?)',
              [notificationId, receiver_id, 'message', `${sender?.name || 'Someone'} sent you a message`, event_id]
            );
          });

          db.get('SELECT * FROM messages WHERE id = ?', [messageId], (err, message) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for an event
router.get('/event/:eventId', authenticate, (req, res) => {
  const { eventId } = req.params;

  const query = `
    SELECT 
      m.*,
      sender.name as sender_name,
      receiver.name as receiver_name
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    JOIN users receiver ON m.receiver_id = receiver.id
    WHERE m.event_id = ? AND (m.sender_id = ? OR m.receiver_id = ?)
    ORDER BY m.created_at ASC
  `;

  db.all(query, [eventId, req.user.id, req.user.id], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ messages });
  });
});

// Get conversation between two users for an event
router.get('/event/:eventId/user/:userId', authenticate, (req, res) => {
  const { eventId, userId } = req.params;

  const query = `
    SELECT 
      m.*,
      sender.name as sender_name,
      receiver.name as receiver_name
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    JOIN users receiver ON m.receiver_id = receiver.id
    WHERE m.event_id = ? 
      AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
    ORDER BY m.created_at ASC
  `;

  db.all(query, [eventId, req.user.id, userId, userId, req.user.id], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Mark messages as read
    db.run(
      'UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ? AND event_id = ?',
      [req.user.id, userId, eventId]
    );

    res.json({ messages });
  });
});

module.exports = router;

