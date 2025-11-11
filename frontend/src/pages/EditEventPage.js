import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import Link
import { fetchEventDetails, updateEvent, deleteEvent, fetchUserProfile } from '../api';

function EditEventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingUserRole, setLoadingUserRole] = useState(true);

  useEffect(() => {
    const checkUserRoleAndFetchEvent = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const currentUser = await fetchUserProfile(token);
        setCurrentUserRole(currentUser.role);

        const eventData = await fetchEventDetails(eventId, token);
        setEvent(eventData);
        setName(eventData.name);
        setDescription(eventData.description);
        setLocation(eventData.location);
        setStartTime(eventData.startTime ? new Date(eventData.startTime).toISOString().slice(0, 16) : '');
        setEndTime(eventData.endTime ? new Date(eventData.endTime).toISOString().slice(0, 16) : '');
        setCapacity(eventData.capacity || '');
        setPoints(eventData.points || '');
        setPublished(eventData.published);
      } catch (err) {
        setError(err.message || 'Failed to fetch event details.');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
        setLoadingUserRole(false);
      }
    };
    checkUserRoleAndFetchEvent();
  }, [eventId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to update event details.');
      navigate('/login');
      return;
    }

    const updatedData = {
      name,
      description,
      location,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      capacity: capacity ? parseInt(capacity) : null,
      points: parseInt(points),
      published,
    };

    try {
      await updateEvent(eventId, updatedData, token);
      setSuccess('Event updated successfully!');
      // Optionally navigate back to manage events page after a delay
      setTimeout(() => {
        navigate('/manage-events');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during event update.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to delete events.');
        navigate('/login');
        return;
      }

      try {
        await deleteEvent(eventId, token);
        setSuccess('Event deleted successfully!');
        setTimeout(() => {
          navigate('/manage-events');
        }, 1500);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred during event deletion.');
      }
    }
  };

  if (loadingUserRole) {
    return <div className="container mt-5">Loading user permissions...</div>;
  }

  // Basic authorization check: only manager or higher or event organizer can access
  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  const currentUserRoleIndex = roles.indexOf(currentUserRole);
  const requiredRoleIndex = roles.indexOf('manager');
  // For a more robust check, we'd need to know the current user's ID and compare it to event.organizers
  // For now, relying on backend authz for organizer check.

  if (currentUserRoleIndex < requiredRoleIndex) { // Simplified check for now
    return (
      <div className="container mt-5 alert alert-danger">
        You do not have permission to access this page.
      </div>
    );
  }

  if (loading) {
    return <div className="container mt-5">Loading event data...</div>;
  }

  if (!event) {
    return <div className="container mt-5">Event not found.</div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Edit Event: {event.name}</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="nameInput" className="form-label">Event Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nameInput"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="descriptionInput" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="descriptionInput"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    required
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="locationInput" className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    id="locationInput"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="startTimeInput" className="form-label">Start Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="startTimeInput"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="endTimeInput" className="form-label">End Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="endTimeInput"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="capacityInput" className="form-label">Capacity (Optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="capacityInput"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="pointsInput" className="form-label">Points to Award</label>
                  <input
                    type="number"
                    className="form-control"
                    id="pointsInput"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="publishedCheck"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="publishedCheck">Published</label>
                </div>
                <button type="submit" className="btn btn-primary w-100">Update Event</button>
              </form>
              <div className="d-flex justify-content-between mt-3">
                <Link to={`/manage-events/${eventId}/guests`} className="btn btn-secondary">Manage Guests</Link>
                <Link to={`/manage-events/${eventId}/award-points`} className="btn btn-secondary">Award Points</Link>
                <button className="btn btn-danger" onClick={handleDelete}>Delete Event</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditEventPage;