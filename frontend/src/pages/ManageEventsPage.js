import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchEvents, fetchUserProfile } from '../api';

function ManageEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ name: '', location: '', started: '', ended: '', published: '' });
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingUserRole, setLoadingUserRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRoleAndFetchEvents = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const user = await fetchUserProfile(token);
        setCurrentUserRole(user.role);

        const data = await fetchEvents(token, page, limit, { ...filters, published: filters.published === 'true' ? true : (filters.published === 'false' ? false : undefined) });
        setEvents(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch events');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
        setLoadingUserRole(false);
      }
    };

    checkUserRoleAndFetchEvents();
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
    return <div className="container mt-5">Loading events...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Manage Events</h1>

      <div className="card mb-4">
        <div className="card-header">Filters</div>
        <div className="card-body">
          <form className="row g-3">
            <div className="col-md-3">
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
            <div className="col-md-3">
              <label htmlFor="locationFilter" className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                id="locationFilter"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="publishedFilter" className="form-label">Published</label>
              <select
                id="publishedFilter"
                name="published"
                className="form-select"
                value={filters.published}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            {/* Add more filters as needed */}
          </form>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="alert alert-info text-center">No events found.</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Capacity</th>
                  <th>Points</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.id}</td>
                    <td>{event.name}</td>
                    <td>{event.location}</td>
                    <td>{new Date(event.startTime).toLocaleString()}</td>
                    <td>{new Date(event.endTime).toLocaleString()}</td>
                    <td>{event.capacity || 'Unlimited'}</td>
                    <td>{event.points}</td>
                    <td>{event.published ? 'Yes' : 'No'}</td>
                    <td>
                      <Link to={`/manage-events/${event.id}`} className="btn btn-sm btn-info">Edit</Link>
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

export default ManageEventsPage;
