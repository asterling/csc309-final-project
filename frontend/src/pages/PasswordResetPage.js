import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api';

function PasswordResetPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [utorid, setUtorid] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/)) {
      setError('Password must be 8-20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    try {
      await resetPassword(token, utorid, newPassword);
      setMessage('Password has been reset successfully. You can now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during password reset.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Reset Password</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="utoridInput" className="form-label">UTORID</label>
                  <input
                    type="text"
                    className="form-control"
                    id="utoridInput"
                    value={utorid}
                    onChange={(e) => setUtorid(e.target.value)}
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
                  <label htmlFor="confirmPasswordInput" className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPasswordInput"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Reset Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetPage;