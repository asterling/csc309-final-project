import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchPromotions } from '../api';
import { AuthContext } from '../context/AuthContext';

function ManagePromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ name: '', type: '' }); // Example filters
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      return;
    }

    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const currentUserRoleIndex = roles.indexOf(user.role);
    const requiredRoleIndex = roles.indexOf('manager');

    if (currentUserRoleIndex < requiredRoleIndex) {
      setError("You do not have permission to access this page.");
      setLoading(false);
      return;
    }

    const getPromotions = async () => {
      try {
        setLoading(true);
        // The fetchPromotions API currently doesn't support pagination or filters directly
        // It returns all promotions. For a real implementation, this would need to be updated.
        const data = await fetchPromotions(token); // Assuming fetchPromotions returns { count, results }
        setPromotions(data.results); // Correctly set the results array
        setTotalCount(data.count); // Correctly set the total count
      } catch (err) {
        setError(err.message || 'Failed to fetch promotions');
      } finally {
        setLoading(false);
      }
    };

    getPromotions();
  }, [token, user, navigate, page, limit, filters]); // Re-run effect on page/filter change

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

  if (loading) {
    return <div className="container mt-5">Loading promotions...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Manage Promotions</h1>

      <div className="card mb-4">
        <div className="card-header">Filters</div>
        <div className="card-body">
          <form className="row g-3">
            <div className="col-md-4">
              <label htmlFor="nameFilter" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="nameFilter"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>
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
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
                <option value="one-time">One-Time</option>
              </select>
            </div>
            {/* Add more filters as needed */}
          </form>
        </div>
      </div>

      {promotions.length === 0 ? (
        <div className="alert alert-info text-center">No promotions found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Min Spending</th>
                  <th>Rate</th>
                  <th>Points</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr key={promo.id}>
                    <td>{promo.id}</td>
                    <td>{promo.name}</td>
                    <td>{promo.type}</td>
                    <td>{promo.minSpending || 'N/A'}</td>
                    <td>{promo.rate ? `${promo.rate * 100}%` : 'N/A'}</td>
                    <td>{promo.points || 'N/A'}</td>
                    <td>{new Date(promo.startTime).toLocaleString()}</td>
                    <td>{new Date(promo.endTime).toLocaleString()}</td>
                    <td>
                      <Link to={`/manage-promotions/${promo.id}`} className="btn btn-sm btn-info">Edit</Link>
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
                <button className="page-link" onClick={handleNextPage}>Next</button>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}

export default ManagePromotionsPage;
