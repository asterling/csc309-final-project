import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchEvents } from '../api';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Items per page
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const getEvents = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await fetchEvents(token, page, limit);
        setEvents(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(err.message || 'Failed to fetch events');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, [navigate, page, limit]);

  const totalPages = Math.ceil(totalCount / limit);

  const handlePreviousPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  if (loading) {
    return <div className="container mt-5">Loading events...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Available Events</h1>
      {events.length === 0 ? (
        <div className="alert alert-info text-center">No events available at the moment.</div>
      ) : (
        <>
          <div className="row">
            {events.map((event) => (
              <div key={event.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{event.name}</h5>
                    <p className="card-text">{event.description}</p>
                    <p className="card-text"><strong>Location:</strong> {event.location}</p>
                    <p className="card-text"><strong>Starts:</strong> {new Date(event.startTime).toLocaleString()}</p>
                    <p className="card-text"><strong>Ends:</strong> {new Date(event.endTime).toLocaleString()}</p>
                    <p className="card-text"><strong>Points:</strong> {event.points}</p>
                    <p className="card-text"><strong>Capacity:</strong> {event.capacity ? `${event.numGuests}/${event.capacity}` : 'Unlimited'}</p>
                    <Link to={`/events/${event.id}`} className="btn btn-primary">View Details</Link>
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

export default EventsPage;