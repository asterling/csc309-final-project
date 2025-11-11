import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestRedemption } from '../api';

function RedemptionRequestPage() {
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
      setError('You must be logged in to request redemption.');
      navigate('/login');
      return;
    }

    if (isNaN(amount) || parseInt(amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    try {
      const response = await requestRedemption(parseInt(amount), remark, token);
      setSuccess(`Redemption request for ${amount} points submitted successfully!`);
      setAmount('');
      setRemark('');
      // Redirect to a page displaying the QR code for this redemption request
      navigate(`/redemption-qr/${response.id}`);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during redemption request.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Request Point Redemption</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="amountInput" className="form-label">Amount to Redeem</label>
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
                <button type="submit" className="btn btn-primary w-100">Submit Redemption Request</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RedemptionRequestPage;