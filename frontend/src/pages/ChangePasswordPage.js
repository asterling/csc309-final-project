import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api';

function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/)) {
      setError('Password must be 8-20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to change your password.');
      navigate('/login');
      return;
    }

    try {
      await changePassword(oldPassword, newPassword, token);
      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      // Optionally navigate to profile or home page after a delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during password change.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Change Password</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="oldPasswordInput" className="form-label">Old Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="oldPasswordInput"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPasswordInput" className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPasswordInput"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmNewPasswordInput" className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmNewPasswordInput"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Change Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;