const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate, requireUserType } = require('../middleware/auth');

const router = express.Router();

// Join queue (DJ only)
router.post('/:eventId/join', authenticate, requireUserType('dj'), (req, res) => {
  const { eventId } = req.params;

  // Check if event exists and is open
  db.get('SELECT status, selected_dj_id, creator_id FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.status !== 'open' || event.selected_dj_id) {
      return res.status(400).json({ error: 'Event queue is closed' });
    }

    // Check if already in queue
    db.get('SELECT id FROM queue WHERE event_id = ? AND dj_id = ?', [eventId, req.user.id], (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existing) {
        return res.status(400).json({ error: 'Already in queue' });
      }

      // Add to queue
      const queueId = uuidv4();
      db.run(
        'INSERT INTO queue (id, event_id, dj_id) VALUES (?, ?, ?)',
        [queueId, eventId, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to join queue' });
          }

          // Create notification for event creator
          const notificationId = uuidv4();
          db.run(
            'INSERT INTO notifications (id, user_id, type, message, event_id) VALUES (?, ?, ?, ?, ?)',
            [notificationId, event.creator_id, 'queue_join', `A new DJ joined the queue for your event`, eventId]
          );

          res.status(201).json({ message: 'Joined queue successfully' });
        }
      );
    });
  });
});

// Leave queue (DJ only)
router.delete('/:eventId/leave', authenticate, requireUserType('dj'), (req, res) => {
  const { eventId } = req.params;

  db.run('DELETE FROM queue WHERE event_id = ? AND dj_id = ?', [eventId, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Not in queue' });
    }
    res.json({ message: 'Left queue successfully' });
  });
});

// Get queue for an event
router.get('/:eventId', authenticate, (req, res) => {
  const { eventId } = req.params;

  const query = `
    SELECT 
      q.id,
      q.joined_at,
      u.id as dj_id,
      u.name as dj_name,
      dp.average_rating,
      dp.genres,
      dp.total_events
    FROM queue q
    JOIN users u ON q.dj_id = u.id
    LEFT JOIN dj_profiles dp ON u.id = dp.user_id
    WHERE q.event_id = ?
    ORDER BY q.joined_at ASC
  `;

  db.all(query, [eventId], (err, queue) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ queue });
  });
});

// Send invitation to DJ (Party Thrower only)
router.post('/:eventId/invite/:djId', authenticate, requireUserType('party_thrower'), (req, res) => {
  const { eventId, djId } = req.params;

  // Verify event belongs to user
  db.get('SELECT creator_id, status, pending_dj_id, selected_dj_id FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (event.selected_dj_id) {
      return res.status(400).json({ error: 'Event already has a selected DJ' });
    }
    if (event.pending_dj_id) {
      return res.status(400).json({ error: 'An invitation is already pending' });
    }

    // Verify DJ is in queue
    db.get('SELECT id FROM queue WHERE event_id = ? AND dj_id = ?', [eventId, djId], (err, queueEntry) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!queueEntry) {
        return res.status(400).json({ error: 'DJ not in queue' });
      }

      // Set pending DJ (invitation sent, waiting for response)
      db.run(
        'UPDATE events SET pending_dj_id = ? WHERE id = ?',
        [djId, eventId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to send invitation' });
          }

          // Notify the DJ about the invitation
          const notificationId = uuidv4();
          db.run(
            'INSERT INTO notifications (id, user_id, type, message, event_id) VALUES (?, ?, ?, ?, ?)',
            [notificationId, djId, 'invitation', 'You have received an invitation to play at an event!', eventId]
          );

          console.log('Invitation sent to DJ:', djId, 'for event:', eventId);
          res.json({ message: 'Invitation sent successfully' });
        }
      );
    });
  });
});

// DJ accepts invitation
router.post('/:eventId/accept', authenticate, requireUserType('dj'), (req, res) => {
  const { eventId } = req.params;

  db.get('SELECT pending_dj_id, selected_dj_id, status FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.pending_dj_id !== req.user.id) {
      return res.status(403).json({ error: 'No pending invitation for you' });
    }
    if (event.selected_dj_id) {
      return res.status(400).json({ error: 'Event already has a DJ' });
    }

    // Accept invitation - become the official DJ and close queue
    db.run(
      'UPDATE events SET selected_dj_id = ?, pending_dj_id = NULL, status = ? WHERE id = ?',
      [req.user.id, 'closed', eventId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to accept invitation' });
        }

        // Update DJ's total events count
        db.run(
          'UPDATE dj_profiles SET total_events = total_events + 1 WHERE user_id = ?',
          [req.user.id]
        );

        // Notify all DJs in queue that the event is closed
        db.all('SELECT dj_id FROM queue WHERE event_id = ?', [eventId], (err, queueMembers) => {
          if (!err && queueMembers) {
            queueMembers.forEach(member => {
              const notificationId = uuidv4();
              const message = member.dj_id === req.user.id
                ? 'You accepted the invitation! You are now the official DJ.'
                : 'The event queue has been closed. A DJ has been selected.';
              db.run(
                'INSERT INTO notifications (id, user_id, type, message, event_id) VALUES (?, ?, ?, ?, ?)',
                [notificationId, member.dj_id, 'queue_closed', message, eventId]
              );
            });
          }
        });

        console.log('DJ accepted invitation:', req.user.id, 'Event:', eventId);
        res.json({ message: 'Invitation accepted! You are now the official DJ.' });
      }
    );
  });
});

// DJ declines invitation
router.post('/:eventId/decline', authenticate, requireUserType('dj'), (req, res) => {
  const { eventId } = req.params;

  db.get('SELECT pending_dj_id, creator_id FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.pending_dj_id !== req.user.id) {
      return res.status(403).json({ error: 'No pending invitation for you' });
    }

    // Decline invitation - clear pending DJ
    db.run(
      'UPDATE events SET pending_dj_id = NULL WHERE id = ?',
      [eventId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to decline invitation' });
        }

        // Notify event creator
        const notificationId = uuidv4();
        db.run(
          'INSERT INTO notifications (id, user_id, type, message, event_id) VALUES (?, ?, ?, ?, ?)',
          [notificationId, event.creator_id, 'invitation_declined', 'A DJ declined your invitation.', eventId]
        );

        console.log('DJ declined invitation:', req.user.id, 'Event:', eventId);
        res.json({ message: 'Invitation declined.' });
      }
    );
  });
});

// DJ opts out (reopens queue)
router.post('/:eventId/opt-out', authenticate, requireUserType('dj'), (req, res) => {
  const { eventId } = req.params;

  // Verify DJ is selected for this event
  db.get('SELECT selected_dj_id, creator_id FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.selected_dj_id !== req.user.id) {
      return res.status(403).json({ error: 'Not the selected DJ for this event' });
    }

    // Reopen queue
    db.run(
      'UPDATE events SET selected_dj_id = NULL, status = ? WHERE id = ?',
      ['open', eventId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to reopen queue' });
        }

        // Notify previous queue members
        db.all('SELECT dj_id FROM queue WHERE event_id = ?', [eventId], (err, queueMembers) => {
          if (!err && queueMembers) {
            queueMembers.forEach(member => {
              const notificationId = uuidv4();
              db.run(
                'INSERT INTO notifications (id, user_id, type, message, event_id) VALUES (?, ?, ?, ?, ?)',
                [notificationId, member.dj_id, 'queue_reopened', 'The event queue has reopened', eventId]
              );
            });
          }
        });

        // Notify event creator
        const notificationId = uuidv4();
        db.run(
          'INSERT INTO notifications (id, user_id, type, message, event_id) VALUES (?, ?, ?, ?, ?)',
          [notificationId, event.creator_id, 'dj_opted_out', 'The selected DJ has opted out. Queue reopened.', eventId]
        );

        res.json({ message: 'Opted out successfully. Queue reopened.' });
      }
    );
  });
});

module.exports = router;

