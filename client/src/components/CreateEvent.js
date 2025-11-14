import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/auth';

function CreateEvent({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    location_private: true,
    size: '',
    audience: '',
    age_range_min: '',
    age_range_max: '',
    occupancy: '',
    theme: '',
    music_genres: '',
    time_frame_start: '',
    time_frame_end: '',
    provided_equipment: '',
    necessary_equipment: '',
    additional_notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = await eventService.create(formData);
      setSuccess('Event created successfully!');
      setTimeout(() => {
        navigate(`/events/${data.event.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '20px auto' }}>
        <h2>Create Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="location_private"
                checked={formData.location_private}
                onChange={handleChange}
              />
              Keep location private
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Size</label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="Expected attendees"
              />
            </div>

            <div className="form-group">
              <label>Occupancy</label>
              <input
                type="number"
                name="occupancy"
                value={formData.occupancy}
                onChange={handleChange}
                placeholder="Venue capacity"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Audience</label>
            <input
              type="text"
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              placeholder="e.g., College students, Professionals, etc."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Age Range (Min)</label>
              <input
                type="number"
                name="age_range_min"
                value={formData.age_range_min}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Age Range (Max)</label>
              <input
                type="number"
                name="age_range_max"
                value={formData.age_range_max}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Theme</label>
            <input
              type="text"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              placeholder="e.g., Rave, Wedding, Corporate, etc."
            />
          </div>

          <div className="form-group">
            <label>Music Genres</label>
            <input
              type="text"
              name="music_genres"
              value={formData.music_genres}
              onChange={handleChange}
              placeholder="e.g., House, EDM, Hip-Hop, etc."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="datetime-local"
                name="time_frame_start"
                value={formData.time_frame_start}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>
              <input
                type="datetime-local"
                name="time_frame_end"
                value={formData.time_frame_end}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Provided Equipment</label>
            <textarea
              name="provided_equipment"
              value={formData.provided_equipment}
              onChange={handleChange}
              placeholder="List equipment you will provide"
            />
          </div>

          <div className="form-group">
            <label>Necessary Equipment</label>
            <textarea
              name="necessary_equipment"
              value={formData.necessary_equipment}
              onChange={handleChange}
              placeholder="List equipment the DJ needs to bring"
            />
          </div>

          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              name="additional_notes"
              value={formData.additional_notes}
              onChange={handleChange}
              placeholder="Any special requests (e.g., Sober DJ, 21+ DJ, dress code, etc.)"
            />
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;

