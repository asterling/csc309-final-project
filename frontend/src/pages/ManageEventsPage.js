import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchEvents } from '../api';
import { AuthContext } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Import the debounce hook

function ManageEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  // Use a local state for immediate input updates
  const [localFilters, setLocalFilters] = useState({ name: '', location: '', started: '', ended: '', published: '' });
  // Debounce the filters for API calls
  const debouncedFilters = useDebounce(localFilters, 500); // 500ms debounce delay

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

    const getEvents = async () => {
      try {
        setLoading(true);
        const data = await fetchEvents(token, page, limit, { ...debouncedFilters, published: debouncedFilters.published === 'true' ? true : (debouncedFilters.published === 'false' ? false : undefined) }); // Use debounced filters
        setEvents(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    getEvents();
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
                value={localFilters.name}
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
                value={localFilters.location}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="publishedFilter" className="form-label">Published</label>
              <select
                id="publishedFilter"
                name="published"
                className="form-select"
                value={localFilters.published}
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

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="alert alert-info text-center">No events found.</div>
      ) : (
        <>
          <div>
            <table className="table table-striped table-hover table-no-scroll">
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
