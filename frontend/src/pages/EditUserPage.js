import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserById, updateUserById, fetchUserProfile } from '../api';

function EditUserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [suspicious, setSuspicious] = useState(false);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingUserRole, setLoadingUserRole] = useState(true);

  useEffect(() => {
    const checkUserRoleAndFetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const currentUser = await fetchUserProfile(token);
        setCurrentUserRole(currentUser.role);

        const userData = await fetchUserById(userId, token);
        setUser(userData);
        setEmail(userData.email);
        setVerified(userData.verified);
        setSuspicious(userData.suspicious);
        setRole(userData.role);
      } catch (err) {
        setError(err.message || 'Failed to fetch user data.');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
        setLoadingUserRole(false);
      }
    };
    checkUserRoleAndFetchUser();
  }, [userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to update user details.');
      navigate('/login');
      return;
    }

    const updatedData = { email, verified, suspicious, role };

    try {
      await updateUserById(userId, updatedData, token);
      setSuccess('User updated successfully!');
      // Optionally navigate back to manage users page after a delay
      setTimeout(() => {
        navigate('/manage-users');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during user update.');
    }
  };

  if (loadingUserRole) {
    return <div className="container mt-5">Loading user permissions...</div>;
  }

  // Basic authorization check: only manager or higher can access
  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  const currentUserRoleIndex = roles.indexOf(currentUserRole);
  const requiredRoleIndex = roles.indexOf('manager');

  if (currentUserRoleIndex < requiredRoleIndex) {
    return (
      <div className="container mt-5 alert alert-danger">
        You do not have permission to access this page.
      </div>
    );
  }

  if (loading) {
    return <div className="container mt-5">Loading user data...</div>;
  }

  if (!user) {
    return <div className="container mt-5">User not found.</div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Edit User: {user.utorid}</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
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
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="verifiedCheck"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="verifiedCheck">Verified</label>
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="suspiciousCheck"
                    checked={suspicious}
                    onChange={(e) => setSuspicious(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="suspiciousCheck">Suspicious</label>
                </div>
                <div className="mb-3">
                  <label htmlFor="roleSelect" className="form-label">Role</label>
                  <select
                    className="form-select"
                    id="roleSelect"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="regular">Regular</option>
                    <option value="cashier">Cashier</option>
                    {currentUserRoleIndex >= roles.indexOf('superuser') && (
                        <option value="manager">Manager</option>
                    )}
                    {currentUserRoleIndex >= roles.indexOf('superuser') && (
                        <option value="superuser">Superuser</option>
                    )}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">Update User</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditUserPage;