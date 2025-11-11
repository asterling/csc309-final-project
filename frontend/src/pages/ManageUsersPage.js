import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAllUsers } from '../api';
import { AuthContext } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Import the debounce hook

function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Use a local state for immediate input updates
  const [localFilters, setLocalFilters] = useState({ name: '', role: '', verified: '', activated: '' });
  // Debounce the filters for API calls
  const debouncedFilters = useDebounce(localFilters, 500); // 500ms debounce delay

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const observer = useRef();
  const lastUserElementRef = useCallback(node => {
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

    const getUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAllUsers(token, page, limit, debouncedFilters);
        setUsers(prevUsers => {
          return [...new Set([...prevUsers, ...data.results].map(u => u.id))].map(id => [...prevUsers, ...data.results].find(u => u.id === id));
        });
        setTotalCount(data.count);
        setHasMore(data.results.length > 0 && (users.length + data.results.length) < data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, [token, user, navigate, page, limit, debouncedFilters]);

  // Reset users and page when filters change
  useEffect(() => {
    setUsers([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  if (error && users.length === 0) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Manage Users</h1>

      <div className="card mb-4">
        <div className="card-header">Filters</div>
        <div className="card-body">
          <form className="row g-3">
            <div className="col-md-3">
              <label htmlFor="nameFilter" className="form-label">Name/UTORID</label>
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
              <label htmlFor="roleFilter" className="form-label">Role</label>
              <select
                id="roleFilter"
                name="role"
                className="form-select"
                value={localFilters.role}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="regular">Regular</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="superuser">Superuser</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="verifiedFilter" className="form-label">Verified</label>
              <select
                id="verifiedFilter"
                name="verified"
                className="form-select"
                value={localFilters.verified}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="activatedFilter" className="form-label">Activated</label>
              <select
                id="activatedFilter"
                name="activated"
                className="form-select"
                value={localFilters.activated}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </form>
        </div>
      </div>

      {users.length === 0 && !loading ? (
        <div className="alert alert-info text-center">No users found.</div>
      ) : (
        <>
          <div>
            <table className="table table-striped table-hover table-no-scroll">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>UTORID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Suspicious</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  if (users.length === index + 1) {
                    return (
                      <tr ref={lastUserElementRef} key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.utorid}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.verified ? 'Yes' : 'No'}</td>
                        <td>{user.suspicious ? 'Yes' : 'No'}</td>
                        <td>{user.points}</td>
                        <td>
                          <Link to={`/manage-users/${user.id}`} className="btn btn-sm btn-info">Edit</Link>
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.utorid}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.verified ? 'Yes' : 'No'}</td>
                        <td>{user.suspicious ? 'Yes' : 'No'}</td>
                        <td>{user.points}</td>
                        <td>
                          <Link to={`/manage-users/${user.id}`} className="btn btn-sm btn-info">Edit</Link>
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
          {!hasMore && users.length > 0 && (
            <div className="text-center mt-3">
              <p>No more users to load.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManageUsersPage;
