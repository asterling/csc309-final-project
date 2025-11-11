import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAllTransactions } from '../api';
import { AuthContext } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Import the debounce hook

function ManageTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Use a local state for immediate input updates
  const [localFilters, setLocalFilters] = useState({ name: '', createdBy: '', suspicious: '', promotionId: '', type: '', relatedId: '', amount: '', operator: '' });
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

    // Basic authorization check: only manager or higher can access
    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const currentUserRoleIndex = roles.indexOf(user.role);
    const requiredRoleIndex = roles.indexOf('manager');

    if (currentUserRoleIndex < requiredRoleIndex) {
      setError("You do not have permission to access this page.");
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAllTransactions(token, page, limit, debouncedFilters);
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

    fetchTransactions();
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

  if (error && transactions.length === 0) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Manage Transactions</h1>

      <div className="card mb-4">
        <div className="card-header">Filters</div>
        <div className="card-body">
          <form className="row g-3">
            <div className="col-md-3">
              <label htmlFor="nameFilter" className="form-label">User Name/UTORID</label>
              <input
                type="text"
                className="form-control"
                id="nameFilter"
                name="name"
                value={localFilters.name}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
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
            <div className="col-md-3">
              <label htmlFor="createdByFilter" className="form-label">Created By</label>
              <input
                type="text"
                className="form-control"
                id="createdByFilter"
                name="createdBy"
                value={localFilters.createdBy}
                onChange={handleFilterChange}
              />
            </div>
            {/* Add more filters as needed */}
          </form>
        </div>
      </div>

      {transactions.length === 0 && !loading ? (
        <div className="alert alert-info text-center">No transactions found.</div>
      ) : (
        <>
          <div>
            <table className="table table-striped table-hover table-no-scroll">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>UTORID</th>
                  <th>Type</th>
                  <th>Amount/Spent</th>
                  <th>Earned/Redeemed</th>
                  <th>Created By</th>
                  <th>Suspicious</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => {
                  if (transactions.length === index + 1) {
                    return (
                      <tr ref={lastTransactionElementRef} key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{transaction.utorid}</td>
                        <td className="text-capitalize">{transaction.type}</td>
                        <td>
                          {transaction.type === 'purchase' && `${transaction.spent}`}
                          {transaction.type === 'adjustment' && `${transaction.amount} pts`}
                          {transaction.type === 'transfer' && `${transaction.amount} pts`}
                          {transaction.type === 'redemption' && `${transaction.redeemed} pts`}
                        </td>
                        <td>
                          {transaction.type === 'purchase' && `${transaction.earned} pts`}
                          {transaction.type === 'redemption' && `${transaction.redeemed} pts`}
                        </td>
                        <td>{transaction.createdBy}</td>
                        <td>{transaction.suspicious ? 'Yes' : 'No'}</td>
                        <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                        <td>
                          <Link to={`/manage-transactions/${transaction.id}`} className="btn btn-sm btn-info">View/Edit</Link>
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>{transaction.utorid}</td>
                        <td className="text-capitalize">{transaction.type}</td>
                        <td>
                          {transaction.type === 'purchase' && `${transaction.spent}`}
                          {transaction.type === 'adjustment' && `${transaction.amount} pts`}
                          {transaction.type === 'transfer' && `${transaction.amount} pts`}
                          {transaction.type === 'redemption' && `${transaction.redeemed} pts`}
                        </td>
                        <td>
                          {transaction.type === 'purchase' && `${transaction.earned} pts`}
                          {transaction.type === 'redemption' && `${transaction.redeemed} pts`}
                        </td>
                        <td>{transaction.createdBy}</td>
                        <td>{transaction.suspicious ? 'Yes' : 'No'}</td>
                        <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                        <td>
                          <Link to={`/manage-transactions/${transaction.id}`} className="btn btn-sm btn-info">View/Edit</Link>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
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

export default ManageTransactionsPage;
