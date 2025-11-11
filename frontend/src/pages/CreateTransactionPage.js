import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchaseTransaction, fetchUserProfile } from '../api';

function CreateTransactionPage() {
  const [utorid, setUtorid] = useState('');
  const [spent, setSpent] = useState('');
  const [promotionIds, setPromotionIds] = useState(''); // Comma-separated string
  const [remark, setRemark] = useState('');
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
      setError('You must be logged in to create a transaction.');
      navigate('/login');
      return;
    }

    if (isNaN(spent) || parseFloat(spent) <= 0) {
      setError('Spent amount must be a positive number.');
      return;
    }

    const promoIdsArray = promotionIds.split(',').map(id => id.trim()).filter(id => id !== '');

    try {
      await createPurchaseTransaction(utorid, parseFloat(spent), promoIdsArray, remark, token);
      setSuccess(`Purchase transaction created successfully for ${utorid}!`);
      setUtorid('');
      setSpent('');
      setPromotionIds('');
      setRemark('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during transaction creation.');
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
              <h1 className="text-center">Create Purchase Transaction</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="utoridInput" className="form-label">User UTORID</label>
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
                  <label htmlFor="spentInput" className="form-label">Amount Spent ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="spentInput"
                    value={spent}
                    onChange={(e) => setSpent(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="promotionIdsInput" className="form-label">Promotion IDs (comma-separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="promotionIdsInput"
                    value={promotionIds}
                    onChange={(e) => setPromotionIds(e.target.value)}
                    placeholder="e.g., 1, 5, 10"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="remarkInput" className="form-label">Remark (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="remarkInput"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Create Transaction</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTransactionPage;