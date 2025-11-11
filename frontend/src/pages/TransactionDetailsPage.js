import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTransactionDetails, createAdjustmentTransaction, markTransactionSuspicious, fetchUserProfile } from '../api';

function TransactionDetailsPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentRemark, setAdjustmentRemark] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingUserRole, setLoadingUserRole] = useState(true);

  useEffect(() => {
    const checkUserRoleAndFetchTransaction = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const currentUser = await fetchUserProfile(token);
        setCurrentUserRole(currentUser.role);

        const data = await fetchTransactionDetails(transactionId, token);
        setTransaction(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch transaction details.');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
        setLoadingUserRole(false);
      }
    };
    checkUserRoleAndFetchTransaction();
  }, [transactionId, navigate]);

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create an adjustment.');
      navigate('/login');
      return;
    }

    if (isNaN(adjustmentAmount) || parseInt(adjustmentAmount) === 0) {
      setError('Adjustment amount cannot be zero.');
      return;
    }

    try {
      await createAdjustmentTransaction(transaction.utorid, parseInt(adjustmentAmount), parseInt(transactionId), adjustmentRemark, token);
      setMessage('Adjustment transaction created successfully!');
      setAdjustmentAmount('');
      setAdjustmentRemark('');
      // Refresh transaction details to reflect changes
      const updatedTransaction = await fetchTransactionDetails(transactionId, token);
      setTransaction(updatedTransaction);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during adjustment creation.');
    }
  };

  const handleMarkSuspicious = async (isSuspicious) => {
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to mark transactions.');
      navigate('/login');
      return;
    }

    try {
      await markTransactionSuspicious(transactionId, isSuspicious, token);
      setMessage(`Transaction marked as ${isSuspicious ? 'suspicious' : 'not suspicious'} successfully!`);
      // Refresh transaction details
      const updatedTransaction = await fetchTransactionDetails(transactionId, token);
      setTransaction(updatedTransaction);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while marking transaction.');
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
    return <div className="container mt-5">Loading transaction details...</div>;
  }

  if (!transaction) {
    return <div className="container mt-5">Transaction not found.</div>;
  }

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h1 className="text-center">Transaction Details (ID: {transaction.id})</h1>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <p><strong>UTORID:</strong> {transaction.utorid}</p>
          <p><strong>Type:</strong> {transaction.type}</p>
          {transaction.type === 'purchase' && <p><strong>Spent:</strong> ${transaction.spent}</p>}
          {transaction.type === 'purchase' && <p><strong>Earned:</strong> {transaction.earned} points</p>}
          {(transaction.type === 'adjustment' || transaction.type === 'transfer') && <p><strong>Amount:</strong> {transaction.amount} points</p>}
          {transaction.type === 'redemption' && <p><strong>Redeemed:</strong> {transaction.redeemed} points</p>}
          {transaction.remark && <p><strong>Remark:</strong> {transaction.remark}</p>}
          <p><strong>Created By:</strong> {transaction.createdBy}</p>
          {transaction.relatedId && <p><strong>Related ID:</strong> {transaction.relatedId}</p>}
          <p><strong>Suspicious:</strong> {transaction.suspicious ? 'Yes' : 'No'}</p>
          <p><strong>Created At:</strong> {new Date(transaction.createdAt).toLocaleString()}</p>

          <h3 className="mt-4">Actions</h3>
          <div className="mb-3">
            <button
              className={`btn ${transaction.suspicious ? 'btn-warning' : 'btn-outline-warning'} me-2`}
              onClick={() => handleMarkSuspicious(!transaction.suspicious)}
            >
              {transaction.suspicious ? 'Unmark Suspicious' : 'Mark Suspicious'}
            </button>
          </div>

          <h4 className="mt-4">Create Adjustment Transaction</h4>
          <form onSubmit={handleCreateAdjustment}>
            <div className="mb-3">
              <label htmlFor="adjustmentAmountInput" className="form-label">Amount (points)</label>
              <input
                type="number"
                className="form-control"
                id="adjustmentAmountInput"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="adjustmentRemarkInput" className="form-label">Remark (Optional)</label>
              <input
                type="text"
                className="form-control"
                id="adjustmentRemarkInput"
                value={adjustmentRemark}
                onChange={(e) => setAdjustmentRemark(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Adjustment</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsPage;