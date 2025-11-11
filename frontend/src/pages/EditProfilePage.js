import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, updateUserProfile } from '../api';

function EditProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const userData = await fetchUserProfile(token);
        setName(userData.name);
        setEmail(userData.email);
        setBirthday(userData.birthday ? userData.birthday.split('T')[0] : ''); // Format for input type="date"
        setAvatarUrl(userData.avatarUrl || '');
      } catch (err) {
        setError(err.message || 'Failed to load profile data.');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to update your profile.');
      navigate('/login');
      return;
    }

    const profileData = { name, email, birthday, avatar: avatarUrl };

    try {
      await updateUserProfile(profileData, token);
      setSuccess('Profile updated successfully!');
      // Optionally navigate back to profile page after a delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during profile update.');
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading profile data...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Edit Profile</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="nameInput" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nameInput"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="birthdayInput" className="form-label">Birthday</label>
                  <input
                    type="date"
                    className="form-control"
                    id="birthdayInput"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="avatarUrlInput" className="form-label">Avatar URL</label>
                  <input
                    type="text"
                    className="form-control"
                    id="avatarUrlInput"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Update Profile</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;