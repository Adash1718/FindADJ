import React, { useState } from 'react';
import { ratingService } from '../services/auth';

function RatingForm({ eventId, ratedUserId, raterUserId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await ratingService.create(eventId, ratedUserId, rating, review);
      if (onSuccess) onSuccess();
      setReview('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginTop: '20px' }}>
      <h3>Rate this user</h3>
      <div className="form-group">
        <label>Rating (1-5 stars)</label>
        <select
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
          required
        >
          <option value={1}>1 ⭐</option>
          <option value={2}>2 ⭐⭐</option>
          <option value={3}>3 ⭐⭐⭐</option>
          <option value={4}>4 ⭐⭐⭐⭐</option>
          <option value={5}>5 ⭐⭐⭐⭐⭐</option>
        </select>
      </div>
      <div className="form-group">
        <label>Review (optional)</label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write a review..."
          rows="4"
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}

export default RatingForm;

