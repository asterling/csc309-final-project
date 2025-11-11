import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAllUsers, fetchUserProfile } from '../api';

function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ name: '', role: '', verified: '', activated: '' });
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingUserRole, setLoadingUserRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRoleAndFetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const user = await fetchUserProfile(token);
        setCurrentUserRole(user.role);

        const data = await fetchAllUsers(token, page, limit, filters);
        setUsers(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
        setLoadingUserRole(false);
      }
    };

    checkUserRoleAndFetchUsers();
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

  if (loadingUserRole) {
    return <div className="container mt-5">Loading user permissions...</div>;
  }

  // Basic authorization check: only manager or higher can access
  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  const currentUserRoleIndex = roles.indexOf(currentUserRole);
  const requiredRoleIndex = roles.indexOf('manager');

  if (currentUserRoleIndex < requiredRoleIndex) {
    return (
      <div className="container mt-5 alert alert-danger">
        You do not have permission to access this page.
      </div>
    );
  }

  if (loading) {
    return <div className="container mt-5">Loading users...</div>;
  }

  if (error) {
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
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="roleFilter" className="form-label">Role</label>
              <select
                id="roleFilter"
                name="role"
                className="form-select"
                value={filters.role}
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
                value={filters.verified} 
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
                value={filters.activated}
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

      {users.length === 0 ? (
        <div className="alert alert-info text-center">No users found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
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
                {users.map((user) => (
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

export default ManageUsersPage;