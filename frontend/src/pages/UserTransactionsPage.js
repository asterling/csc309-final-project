import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserTransactions } from '../api';
import { AuthContext } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Import the debounce hook

function UserTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  // Use a local state for immediate input updates
  const [localFilters, setLocalFilters] = useState({ type: '', createdBy: '', suspicious: '' });
  // Debounce the filters for API calls
  const debouncedFilters = useDebounce(localFilters, 500); // 500ms debounce delay

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    const getTransactions = async () => {
      try {
        setLoading(true);
        const data = await fetchUserTransactions(token, page, limit, debouncedFilters); // Use debounced filters
        setTransactions(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    getTransactions();
  }, [token, user, navigate, page, limit, debouncedFilters]); // Depend on debounced filters

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  const totalPages = Math.ceil(totalCount / limit);

  const handlePreviousPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    // setPage(1) is now handled by a separate useEffect when debouncedFilters change
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
                value={localFilters.type}
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
                value={localFilters.suspicious}
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

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
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
