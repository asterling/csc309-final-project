import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventDetails, addGuestToEvent, removeGuestFromEvent, fetchUserProfile } from '../api';

function ManageEventGuestsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [newGuestUtorid, setNewGuestUtorid] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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

  const handleAddGuest = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to add guests.');
      navigate('/login');
      return;
    }

    try {
      await addGuestToEvent(eventId, newGuestUtorid, token);
      setMessage(`Guest ${newGuestUtorid} added successfully!`);
      setNewGuestUtorid('');
      // Refresh event details to show updated guest list
      const updatedEvent = await fetchEventDetails(eventId, token);
      setEvent(updatedEvent);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while adding guest.');
    }
  };

  const handleRemoveGuest = async (utoridToRemove) => {
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to remove guests.');
      navigate('/login');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${utoridToRemove} from this event?`)) {
      try {
        await removeGuestFromEvent(eventId, utoridToRemove, token);
        setMessage(`Guest ${utoridToRemove} removed successfully!`);
        // Refresh event details to show updated guest list
        const updatedEvent = await fetchEventDetails(eventId, token);
        setEvent(updatedEvent);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred while removing guest.');
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
              <h1 className="text-center">Manage Guests for: {event.name}</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <h4 className="mt-4">Add New Guest</h4>
              <form onSubmit={handleAddGuest}>
                <div className="mb-3">
                  <label htmlFor="newGuestUtoridInput" className="form-label">Guest UTORID</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newGuestUtoridInput"
                    value={newGuestUtorid}
                    onChange={(e) => setNewGuestUtorid(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Add Guest</button>
              </form>

              <h4 className="mt-4">Current Guests ({event.guests.length})</h4>
              {event.guests.length === 0 ? (
                <p>No guests have RSVP'd yet.</p>
              ) : (
                <ul className="list-group">
                  {event.guests.map(guest => (
                    <li key={guest.id} className="list-group-item d-flex justify-content-between align-items-center">
                      {guest.name} ({guest.utorid})
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveGuest(guest.utorid)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageEventGuestsPage;