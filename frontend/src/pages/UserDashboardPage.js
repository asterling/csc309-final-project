import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { fetchUserProfile } from '../api';

function UserDashboardPage() {
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
        setError(err.message || 'Failed to fetch user profile');
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
    return <div className="container mt-5">Loading dashboard...</div>;
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
          <h1 className="text-center">User Dashboard</h1>
        </div>
        <div className="card-body text-center">
          <p><strong>Current Points:</strong> {user.points}</p>
          <h3 className="mt-4">Your UTORID QR Code</h3>
          {user.utorid && (
            <div className="d-flex justify-content-center mt-3">
              <QRCodeSVG value={user.utorid} size={256} level="H" />
            </div>
          )}
          <p className="mt-3">Scan this QR code to initiate transactions.</p>
        </div>
      </div>
    </div>
  );
}

export default UserDashboardPage;