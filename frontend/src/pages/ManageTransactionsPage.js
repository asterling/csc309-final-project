import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAllTransactions } from '../api';
import { AuthContext } from '../context/AuthContext';

function ManageTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ name: '', createdBy: '', suspicious: '', promotionId: '', type: '', relatedId: '', amount: '', operator: '' });
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

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
      try {
        setLoading(true);
        const data = await fetchAllTransactions(token, page, limit, filters);
        setTransactions(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token, user, navigate, page, limit, filters]);

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
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
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
            <div className="col-md-3">
              <label htmlFor="createdByFilter" className="form-label">Created By</label>
              <input
                type="text"
                className="form-control"
                id="createdByFilter"
                name="createdBy"
                value={filters.createdBy}
                onChange={handleFilterChange}
              />
            </div>
            {/* Add more filters as needed */}
          </form>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="alert alert-info text-center">No transactions found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
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
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>
                    <td>{transaction.utorid}</td>
                    <td className="text-capitalize">{transaction.type}</td>
                    <td>
                      {transaction.type === 'purchase' && `$${transaction.spent}`}
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
                ))}
              </tbody>
            </table>
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
                <button className className="page-link" onClick={handleNextPage}>Next</button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}

export default ManageTransactionsPage;