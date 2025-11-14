import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { profileService, ratingService } from '../services/auth';

function Profile({ user }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isDJ, setIsDJ] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      // Try to load as DJ first
      try {
        const data = await profileService.getDJ(userId);
        setProfile(data.profile);
        setIsDJ(true);
      } catch {
        // If not DJ, try Party Thrower
        const data = await profileService.getPartyThrower(userId);
        setProfile(data.profile);
        setIsDJ(false);
      }

      const ratingsData = await ratingService.getByUser(userId);
      setRatings(ratingsData.ratings || []);
      setIsOwnProfile(userId === user.id);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!profile) {
    return <div className="container">Profile not found</div>;
  }

  const averageRating = profile.average_rating || 0;
  const totalRatings = ratings.length;

  return (
    <div className="container">
      <div className="card">
        <h1>{profile.name}</h1>
        <p><strong>Type:</strong> {isDJ ? 'DJ' : 'Party Thrower'}</p>
        
        {isDJ ? (
          <>
            <p><strong>Average Rating:</strong> ⭐ {averageRating.toFixed(1)} ({totalRatings} reviews)</p>
            <p><strong>Total Events:</strong> {profile.total_events || 0}</p>
            <p><strong>Genres:</strong> {profile.genres || 'Not specified'}</p>
            <p><strong>Experience:</strong> {profile.experience_years || 'Not specified'} years</p>
            <p><strong>Bio:</strong> {profile.bio || 'No bio yet'}</p>
          </>
        ) : (
          <>
            <p><strong>Average Rating:</strong> ⭐ {averageRating.toFixed(1)} ({totalRatings} reviews)</p>
            <p><strong>Total Events Created:</strong> {profile.total_events_created || 0}</p>
            <p><strong>Bio:</strong> {profile.bio || 'No bio yet'}</p>
          </>
        )}
      </div>

      <div className="card">
        <h2>Reviews & Ratings</h2>
        {ratings.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          ratings.map(rating => (
            <div key={rating.id} style={{ 
              padding: '15px', 
              marginBottom: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '5px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <strong>{rating.rater_name}</strong>
                  <span style={{ marginLeft: '10px' }}>⭐ {rating.rating}/5</span>
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {new Date(rating.created_at).toLocaleDateString()}
                </span>
              </div>
              {rating.review && <p>{rating.review}</p>}
              {rating.event_title && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                  Event: {rating.event_title}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Profile;

