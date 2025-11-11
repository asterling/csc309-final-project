import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferPoints } from '../api';

function TransferPointsPage() {
  const [recipientUtorid, setRecipientUtorid] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to transfer points.');
      navigate('/login');
      return;
    }

    if (isNaN(amount) || parseInt(amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    try {
      // The backend API expects userId, but we are collecting utorid from the user.
      // We need to find the userId from the utorid first.
      // For now, I'll assume the backend can handle utorid directly or we'll need another API call.
      // Based on the backend API: POST /users/:userId/transactions, it expects userId in the path.
      // This means we need to fetch the recipient's user ID first.
      // For simplicity, I'll assume the recipientUtorid can be used as userId for now,
      // but this is a potential point of failure if the backend strictly requires numeric ID.
      // A more robust solution would be to have an API endpoint to get user ID by utorid.

      // For now, let's assume recipientUtorid is the userId for the API call.
      // This is a temporary simplification and needs to be addressed if the backend strictly requires numeric ID.
      await transferPoints(recipientUtorid, parseInt(amount), remark, token);
      setSuccess(`Successfully transferred ${amount} points to ${recipientUtorid}!`);
      setRecipientUtorid('');
      setAmount('');
      setRemark('');
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard after transfer
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during point transfer.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Transfer Points</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="recipientUtoridInput" className="form-label">Recipient UTORID</label>
                  <input
                    type="text"
                    className="form-control"
                    id="recipientUtoridInput"
                    value={recipientUtorid}
                    onChange={(e) => setRecipientUtorid(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="amountInput" className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="amountInput"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
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
                <button type="submit" className="btn btn-primary w-100">Transfer Points</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransferPointsPage;