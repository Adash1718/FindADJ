const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', (req, res) => {
  const stats = {};

  // Get user counts
  db.get('SELECT COUNT(*) as total FROM users', [], (err, result) => {
    stats.totalUsers = result?.total || 0;

    db.get('SELECT COUNT(*) as total FROM users WHERE user_type = "dj"', [], (err, result) => {
      stats.totalDJs = result?.total || 0;

      db.get('SELECT COUNT(*) as total FROM users WHERE user_type = "party_thrower"', [], (err, result) => {
        stats.totalPartyThrowers = result?.total || 0;

        // Get event counts
        db.get('SELECT COUNT(*) as total FROM events', [], (err, result) => {
          stats.totalEvents = result?.total || 0;

          db.get('SELECT COUNT(*) as total FROM events WHERE status = "open"', [], (err, result) => {
            stats.openEvents = result?.total || 0;

            db.get('SELECT COUNT(*) as total FROM events WHERE status = "closed"', [], (err, result) => {
              stats.closedEvents = result?.total || 0;

              // Get message count
              db.get('SELECT COUNT(*) as total FROM messages', [], (err, result) => {
                stats.totalMessages = result?.total || 0;

                // Get rating count
                db.get('SELECT COUNT(*) as total FROM ratings', [], (err, result) => {
                  stats.totalRatings = result?.total || 0;

                  res.json(stats);
                });
              });
            });
          });
        });
      });
    });
  });
});

// Get all users
router.get('/users', (req, res) => {
  const query = `
    SELECT 
      u.*,
      CASE 
        WHEN u.user_type = 'dj' THEN dp.average_rating
        ELSE pt.average_rating
      END as rating,
      CASE 
        WHEN u.user_type = 'dj' THEN dp.total_events
        ELSE pt.total_events_created
      END as total_events
    FROM users u
    LEFT JOIN dj_profiles dp ON u.id = dp.user_id
    LEFT JOIN party_thrower_profiles pt ON u.id = pt.user_id
    ORDER BY u.created_at DESC
  `;

  db.all(query, [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ users });
  });
});

// Get all events with details
router.get('/events', (req, res) => {
  const query = `
    SELECT 
      e.*,
      u.name as creator_name,
      dj.name as selected_dj_name,
      (SELECT COUNT(*) FROM queue WHERE event_id = e.id) as queue_count
    FROM events e
    LEFT JOIN users u ON e.creator_id = u.id
    LEFT JOIN users dj ON e.selected_dj_id = dj.id
    ORDER BY e.created_at DESC
  `;

  db.all(query, [], (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ events });
  });
});

// Get all messages
router.get('/messages', (req, res) => {
  const query = `
    SELECT 
      m.*,
      sender.name as sender_name,
      receiver.name as receiver_name,
      e.title as event_title
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    JOIN users receiver ON m.receiver_id = receiver.id
    JOIN events e ON m.event_id = e.id
    ORDER BY m.created_at DESC
    LIMIT 100
  `;

  db.all(query, [], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ messages });
  });
});

// Get all ratings
router.get('/ratings', (req, res) => {
  const query = `
    SELECT 
      r.*,
      rated.name as rated_user_name,
      rater.name as rater_user_name,
      e.title as event_title
    FROM ratings r
    JOIN users rated ON r.rated_user_id = rated.id
    JOIN users rater ON r.rater_user_id = rater.id
    JOIN events e ON r.event_id = e.id
    ORDER BY r.created_at DESC
    LIMIT 100
  `;

  db.all(query, [], (err, ratings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ ratings });
  });
});

// Get recent activity
router.get('/activity', (req, res) => {
  const activities = [];
  
  // Get recent users
  db.all('SELECT name, user_type, created_at FROM users ORDER BY created_at DESC LIMIT 10', [], (err, users) => {
    users.forEach(u => {
      activities.push({
        type: 'user_registered',
        description: `${u.name} registered as ${u.user_type}`,
        timestamp: u.created_at
      });
    });

    // Get recent events
    db.all('SELECT e.title, u.name as creator, e.created_at FROM events e JOIN users u ON e.creator_id = u.id ORDER BY e.created_at DESC LIMIT 10', [], (err, events) => {
      events.forEach(e => {
        activities.push({
          type: 'event_created',
          description: `${e.creator} created event: ${e.title}`,
          timestamp: e.created_at
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      res.json({ activities: activities.slice(0, 20) });
    });
  });
});

module.exports = router;

