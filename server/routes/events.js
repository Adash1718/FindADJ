const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const { authenticate, requireUserType } = require('../middleware/auth');

const router = express.Router();

// Create event (Party Thrower only)
router.post('/', authenticate, requireUserType('party_thrower'), [
  body('title').trim().notEmpty(),
  body('location').trim().notEmpty(),
  body('time_frame_start').isISO8601(),
  body('time_frame_end').isISO8601()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      location,
      location_private = true,
      size,
      audience,
      age_range_min,
      age_range_max,
      occupancy,
      theme,
      music_genres,
      time_frame_start,
      time_frame_end,
      provided_equipment,
      necessary_equipment,
      additional_notes
    } = req.body;

    const eventId = uuidv4();

    db.run(
      `INSERT INTO events (
        id, creator_id, title, location, location_private, size, audience,
        age_range_min, age_range_max, occupancy, theme, music_genres,
        time_frame_start, time_frame_end, provided_equipment,
        necessary_equipment, additional_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        eventId, req.user.id, title, location, location_private ? 1 : 0,
        size, audience, age_range_min, age_range_max, occupancy,
        theme, music_genres, time_frame_start, time_frame_end,
        provided_equipment, necessary_equipment, additional_notes
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create event' });
        }

        // Update party thrower's total events created count
        db.run(
          'UPDATE party_thrower_profiles SET total_events_created = total_events_created + 1 WHERE user_id = ?',
          [req.user.id]
        );

        db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ event });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all events
router.get('/', authenticate, (req, res) => {
  const query = `
    SELECT 
      e.*,
      u.name as creator_name,
      u.id as creator_user_id,
      dj.name as selected_dj_name,
      dj.id as selected_dj_user_id,
      pending_dj.name as pending_dj_name,
      pending_dj.id as pending_dj_user_id,
      (SELECT COUNT(*) FROM queue WHERE event_id = e.id) as queue_count
    FROM events e
    LEFT JOIN users u ON e.creator_id = u.id
    LEFT JOIN users dj ON e.selected_dj_id = dj.id
    LEFT JOIN users pending_dj ON e.pending_dj_id = pending_dj.id
    WHERE e.status != 'cancelled'
    ORDER BY e.created_at DESC
  `;

  db.all(query, [], (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ events });
  });
});

// Get single event
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT 
      e.*,
      u.name as creator_name,
      u.id as creator_user_id,
      dj.name as selected_dj_name,
      dj.id as selected_dj_user_id,
      pending_dj.name as pending_dj_name,
      pending_dj.id as pending_dj_user_id
    FROM events e
    LEFT JOIN users u ON e.creator_id = u.id
    LEFT JOIN users dj ON e.selected_dj_id = dj.id
    LEFT JOIN users pending_dj ON e.pending_dj_id = pending_dj.id
    WHERE e.id = ?`,
    [id],
    (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ event });
    }
  );
});

// Update event status (close queue, etc.)
router.patch('/:id/status', authenticate, requireUserType('party_thrower'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Verify event belongs to user
  db.get('SELECT creator_id FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run(
      'UPDATE events SET status = ? WHERE id = ?',
      [status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update event' });
        }
        res.json({ message: 'Event status updated' });
      }
    );
  });
});

module.exports = router;

