import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserTransactions } from '../api';
import { AuthContext } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Import the debounce hook

function UserTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Use a local state for immediate input updates
  const [localFilters, setLocalFilters] = useState({ type: '', createdBy: '', suspicious: '' });
  // Debounce the filters for API calls
  const debouncedFilters = useDebounce(localFilters, 500); // 500ms debounce delay

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const observer = useRef();
  const lastTransactionElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    const getTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchUserTransactions(token, page, limit, debouncedFilters);
        setTransactions(prevTransactions => {
          return [...new Set([...prevTransactions, ...data.results].map(t => t.id))].map(id => [...prevTransactions, ...data.results].find(t => t.id === id));
        });
        setTotalCount(data.count);
        setHasMore(data.results.length > 0 && (transactions.length + data.results.length) < data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    getTransactions();
  }, [token, user, navigate, page, limit, debouncedFilters]);

  // Reset transactions and page when filters change
  useEffect(() => {
    setTransactions([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
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

  if (error && transactions.length === 0) {
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

      {transactions.length === 0 && !loading ? (
        <div className="alert alert-info text-center">No transactions found.</div>
      ) : (
        <>
          <div className="row">
            {transactions.map((transaction, index) => {
              const cardContent = (
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
              );

              if (transactions.length === index + 1) {
                return (
                  <div ref={lastTransactionElementRef} key={transaction.id} className="col-md-6 col-lg-4 mb-4">
                    {cardContent}
                  </div>
                );
              } else {
                return (
                  <div key={transaction.id} className="col-md-6 col-lg-4 mb-4">
                    {cardContent}
                  </div>
                );
              }
            })}
          </div>
          {loading && (
            <div className="text-center mt-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          {!hasMore && transactions.length > 0 && (
            <div className="text-center mt-3">
              <p>No more transactions to load.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserTransactionsPage;