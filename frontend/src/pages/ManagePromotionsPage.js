import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchPromotions } from '../api';
import { AuthContext } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Import the debounce hook

function ManagePromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Use a local state for immediate input updates
  const [localFilters, setLocalFilters] = useState({ name: '', type: '' });
  // Debounce the filters for API calls
  const debouncedFilters = useDebounce(localFilters, 500); // 500ms debounce delay

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const observer = useRef();
  const lastPromotionElementRef = useCallback(node => {
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

    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const currentUserRoleIndex = roles.indexOf(user.role);
    const requiredRoleIndex = roles.indexOf('manager');

    if (currentUserRoleIndex < requiredRoleIndex) {
      setError("You do not have permission to access this page.");
      setLoading(false);
      return;
    }

    const getPromotions = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPromotions(token, page, limit, debouncedFilters);
        setPromotions(prevPromotions => {
          return [...new Set([...prevPromotions, ...data.results].map(p => p.id))].map(id => [...prevPromotions, ...data.results].find(p => p.id === id));
        });
        setTotalCount(data.count);
        setHasMore(data.results.length > 0 && (promotions.length + data.results.length) < data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch promotions');
      } finally {
        setLoading(false);
      }
    };

    getPromotions();
  }, [token, user, navigate, page, limit, debouncedFilters]);

  // Reset promotions and page when filters change
  useEffect(() => {
    setPromotions([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  if (error && promotions.length === 0) {
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
                value={localFilters.name}
                onChange={handleFilterChange}
              />
            </div>
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
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
                <option value="one-time">One-Time</option>
              </select>
            </div>
            {/* Add more filters as needed */}
          </form>
        </div>
      </div>

      {promotions.length === 0 && !loading ? (
        <div className="alert alert-info text-center">No promotions found.</div>
      ) : (
        <>
          <div>
            <table className="table table-striped table-hover table-no-scroll">
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
                {promotions.map((promo, index) => {
                  if (promotions.length === index + 1) {
                    return (
                      <tr ref={lastPromotionElementRef} key={promo.id}>
                        <td>{promo.id}</td>
                        <td>{promo.name}</td>
                        <td>{promo.type}</td>
                        <td>{promo.minSpending || 'N/A'}</td>
                        <td>{promo.rate ? `${(promo.rate * 100).toFixed(2)}%` : 'N/A'}</td>
                        <td>{promo.points || 'N/A'}</td>
                        <td>{new Date(promo.startTime).toLocaleString()}</td>
                        <td>{new Date(promo.endTime).toLocaleString()}</td>
                        <td>
                          <Link to={`/manage-promotions/${promo.id}`} className="btn btn-sm btn-info">Edit</Link>
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={promo.id}>
                        <td>{promo.id}</td>
                        <td>{promo.name}</td>
                        <td>{promo.type}</td>
                        <td>{promo.minSpending || 'N/A'}</td>
                        <td>{promo.rate ? `${(promo.rate * 100).toFixed(2)}%` : 'N/A'}</td>
                        <td>{promo.points || 'N/A'}</td>
                        <td>{new Date(promo.startTime).toLocaleString()}</td>
                        <td>{new Date(promo.endTime).toLocaleString()}</td>
                        <td>
                          <Link to={`/manage-promotions/${promo.id}`} className="btn btn-sm btn-info">Edit</Link>
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
          {!hasMore && promotions.length > 0 && (
            <div className="text-center mt-3">
              <p>No more promotions to load.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManagePromotionsPage;