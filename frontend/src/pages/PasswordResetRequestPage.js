import React, { useState } from 'react';
import { requestPasswordReset } from '../api';

function PasswordResetRequestPage() {
  const [utorid, setUtorid] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await requestPasswordReset(utorid);
      setMessage('If an account with that UTORID exists, a password reset link has been sent.');
      setUtorid('');
    } catch (err) {
      // For security, we give a generic message even if utorid is not found
      setMessage('If an account with that UTORID exists, a password reset link has been sent.');
      setUtorid('');
      console.error('Password reset request error:', err);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Request Password Reset</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-info">{message}</div>}
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
                <button type="submit" className="btn btn-primary w-100">Request Reset Link</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetRequestPage;