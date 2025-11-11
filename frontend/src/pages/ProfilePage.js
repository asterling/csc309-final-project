import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile } from '../api';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userData = await fetchUserProfile(token);
        setUser(userData);
      } catch (err) {
        setError(err.message || 'Failed to fetch profile');
        // Optionally clear token and redirect to login if token is invalid
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();
  }, [navigate]);

  if (loading) {
    return <div className="container mt-5">Loading profile...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  if (!user) {
    return <div className="container mt-5">No user data found. Please log in.</div>;
  }

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h1 className="text-center">User Profile</h1>
        </div>
        <div className="card-body">
          <p><strong>UTORID:</strong> {user.utorid}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Points:</strong> {user.points}</p>
          <p><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</p>
          {user.birthday && <p><strong>Birthday:</strong> {new Date(user.birthday).toLocaleDateString()}</p>}
          {user.lastLogin && <p><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>}
          {/* Add more profile details as needed */}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;