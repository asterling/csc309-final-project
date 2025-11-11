import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventDetails, awardPointsToGuest, fetchUserProfile } from '../api';

function AwardPointsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [guestUtorid, setGuestUtorid] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  const [remark, setRemark] = useState('');
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

  const handleAwardSingleGuest = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to award points.');
      navigate('/login');
      return;
    }

    if (isNaN(pointsAmount) || parseInt(pointsAmount) <= 0) {
      setError('Points amount must be a positive number.');
      return;
    }

    try {
      await awardPointsToGuest(eventId, guestUtorid, parseInt(pointsAmount), remark, token);
      setMessage(`Successfully awarded ${pointsAmount} points to ${guestUtorid}!`);
      setGuestUtorid('');
      setPointsAmount('');
      setRemark('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while awarding points.');
    }
  };

  const handleAwardAllGuests = async () => {
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to award points.');
      navigate('/login');
      return;
    }

    if (isNaN(pointsAmount) || parseInt(pointsAmount) <= 0) {
      setError('Points amount must be a positive number.');
      return;
    }

    if (window.confirm(`Are you sure you want to award ${pointsAmount} points to all ${event.guests.length} RSVP'd guests?`)) {
      try {
        // Award points to each guest individually
        for (const guest of event.guests) {
          await awardPointsToGuest(eventId, guest.utorid, parseInt(pointsAmount), `Event: ${event.name}`, token);
        }
        setMessage(`Successfully awarded ${pointsAmount} points to all ${event.guests.length} guests!`);
        setPointsAmount('');
        setRemark('');
      } catch (err) {
        setError(err.message || 'An unexpected error occurred while awarding points to all guests.');
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
              <h1 className="text-center">Award Points for: {event.name}</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}

              <h4 className="mt-4">Award Points to Single Guest</h4>
              <form onSubmit={handleAwardSingleGuest}>
                <div className="mb-3">
                  <label htmlFor="guestUtoridInput" className="form-label">Guest UTORID</label>
                  <input
                    type="text"
                    className="form-control"
                    id="guestUtoridInput"
                    value={guestUtorid}
                    onChange={(e) => setGuestUtorid(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="pointsAmountInput" className="form-label">Points Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="pointsAmountInput"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="remarkInput" className="form-label">Remark (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="remarkInput"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Award Points to Guest</button>
              </form>

              <h4 className="mt-4">Award Points to All RSVP'd Guests</h4>
              <div className="mb-3">
                <label htmlFor="allGuestsPointsAmountInput" className="form-label">Points Amount for All Guests</label>
                <input
                  type="number"
                  className="form-control"
                  id="allGuestsPointsAmountInput"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <button className="btn btn-success" onClick={handleAwardAllGuests}>Award Points to All {event.guests.length} Guests</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AwardPointsPage;