import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, fetchUserProfile } from '../api';

function CreateEventPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loadingUserRole, setLoadingUserRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const user = await fetchUserProfile(token);
        setCurrentUserRole(user.role);
      } catch (err) {
        console.error('Failed to fetch current user role:', err);
        navigate('/login'); // Redirect if token is invalid
      } finally {
        setLoadingUserRole(false);
      }
    };
    checkUserRole();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create an event.');
      navigate('/login');
      return;
    }

    const eventData = {
      name,
      description,
      location,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      capacity: capacity ? parseInt(capacity) : null,
      points: parseInt(points),
    };

    try {
      await createEvent(eventData, token);
      setSuccess('Event created successfully!');
      setName('');
      setDescription('');
      setLocation('');
      setStartTime('');
      setEndTime('');
      setCapacity('');
      setPoints('');
      // Optionally navigate to manage events page after a delay
      setTimeout(() => {
        navigate('/manage-events'); // Assuming a manage events page exists
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during event creation.');
    }
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

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Create New Event</h1>
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
                <button type="submit" className="btn btn-primary w-100">Create Event</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateEventPage;