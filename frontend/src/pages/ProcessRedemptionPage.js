import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { processRedemption, fetchUserProfile } from '../api';

function ProcessRedemptionPage() {
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingUserRole, setLoadingUserRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const user = await fetchUserProfile(token);
        setCurrentUserRole(user.role);
      } catch (err) {
        console.error('Failed to fetch current user role:', err);
        navigate('/login'); // Redirect if token is invalid
      } finally {
        setLoadingUserRole(false);
      }
    };
    checkUserRole();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to process redemption requests.');
      navigate('/login');
      return;
    }

    if (isNaN(transactionId) || parseInt(transactionId) <= 0) {
      setError('Transaction ID must be a positive number.');
      return;
    }

    try {
      await processRedemption(parseInt(transactionId), token);
      setSuccess(`Redemption request ${transactionId} processed successfully!`);
      setTransactionId('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during processing redemption.');
    }
  };

  if (loadingUserRole) {
    return <div className="container mt-5">Loading user permissions...</div>;
  }

  // Basic authorization check: only cashier or higher can access
  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  const currentUserRoleIndex = roles.indexOf(currentUserRole);
  const requiredRoleIndex = roles.indexOf('cashier');

  if (currentUserRoleIndex < requiredRoleIndex) {
    return (
      <div className="container mt-5 alert alert-danger">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Process Redemption Request</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="transactionIdInput" className="form-label">Redemption Transaction ID</label>
                  <input
                    type="number"
                    className="form-control"
                    id="transactionIdInput"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Process Redemption</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessRedemptionPage;