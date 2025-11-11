import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserTransactions } from '../api';

function UserTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ type: '', createdBy: '', suspicious: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const getTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await fetchUserTransactions(token, page, limit, filters);
        setTransactions(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch transactions');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getTransactions();
  }, [navigate, page, limit, filters]);

  const totalPages = Math.ceil(totalCount / limit);

  const handlePreviousPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const getTransactionCardClass = (type) => {
    switch (type) {
      case 'purchase':
        return 'border-primary';
      case 'adjustment':
        return 'border-info';
      case 'transfer':
        return 'border-success';
      case 'redemption':
        return 'border-warning';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading transactions...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">My Transactions</h1>

      <div className="card mb-4">
        <div className="card-header">Filters</div>
        <div className="card-body">
          <form className="row g-3">
            <div className="col-md-4">
              <label htmlFor="typeFilter" className="form-label">Type</label>
              <select
                id="typeFilter"
                name="type"
                className="form-select"
                value={filters.type}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="purchase">Purchase</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer">Transfer</option>
                <option value="redemption">Redemption</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="suspiciousFilter" className="form-label">Suspicious</label>
              <select
                id="suspiciousFilter"
                name="suspicious"
                className="form-select"
                value={filters.suspicious}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            {/* Add more filters as needed, e.g., createdBy, date range */}
          </form>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="alert alert-info text-center">No transactions found.</div>
      ) : (
        <>
          <div className="row">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="col-md-6 col-lg-4 mb-4">
                <div className={`card h-100 ${getTransactionCardClass(transaction.type)}`}>
                  <div className="card-body">
                    <h5 className="card-title text-capitalize">{transaction.type}</h5>
                    <p className="card-text"><strong>ID:</strong> {transaction.id}</p>
                    <p className="card-text"><strong>Date:</strong> {new Date(transaction.createdAt).toLocaleString()}</p>
                    {transaction.type === 'purchase' && (
                      <>
                        <p className="card-text"><strong>Spent:</strong> ${transaction.spent}</p>
                        <p className="card-text"><strong>Earned:</strong> {transaction.earned} points</p>
                      </>
                    )}
                    {transaction.type === 'adjustment' && (
                      <p className="card-text"><strong>Amount:</strong> {transaction.amount} points</p>
                    )}
                    {transaction.type === 'transfer' && (
                      <>
                        <p className="card-text"><strong>Amount:</strong> {transaction.amount} points</p>
                        <p className="card-text"><strong>Related User:</strong> {transaction.relatedId}</p> {/* This would ideally be utorid */}
                      </>
                    )}
                    {transaction.type === 'redemption' && (
                      <p className="card-text"><strong>Redeemed:</strong> {transaction.redeemed} points</p>
                    )}
                    {transaction.remark && <p className="card-text"><strong>Remark:</strong> {transaction.remark}</p>}
                    <p className="card-text"><strong>Created By:</strong> {transaction.createdBy}</p>
                    <p className="card-text"><strong>Suspicious:</strong> {transaction.suspicious ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <nav aria-label="Page navigation" className="mt-4">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={handlePreviousPage}>Previous</button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={handleNextPage}>Next</button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}

export default UserTransactionsPage;