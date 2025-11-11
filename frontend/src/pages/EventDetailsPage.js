import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventDetails, rsvpForEvent } from '../api';

function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpMessage, setRsvpMessage] = useState('');

  useEffect(() => {
    const getEventDetails = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await fetchEventDetails(eventId, token);
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch event details');
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiresAt');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getEventDetails();
  }, [eventId, navigate]);

  const handleRsvp = async () => {
    setRsvpMessage('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      await rsvpForEvent(eventId, token);
      setRsvpMessage('RSVP successful!');
      // Optionally refresh event details to show updated guest count
      const updatedEvent = await fetchEventDetails(eventId, token);
      setEvent(updatedEvent);
    } catch (err) {
      setRsvpMessage(err.message || 'Failed to RSVP for event.');
    }
  };

  if (loading) {
    return <div className="container mt-5">Loading event details...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  if (!event) {
    return <div className="container mt-5">Event not found.</div>;
  }

  // Check if the current user has already RSVP'd
  const currentUserUtorid = localStorage.getItem('utorid'); // Assuming utorid is stored in localStorage
  const hasRsvpd = event.guests.some(guest => guest.utorid === currentUserUtorid);

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h1 className="text-center">{event.name}</h1>
        </div>
        <div className="card-body">
          {rsvpMessage && (
            <div className={`alert ${rsvpMessage.includes('successful') ? 'alert-success' : 'alert-danger'}`}>
              {rsvpMessage}
            </div>
          )}
          <p><strong>Description:</strong> {event.description}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Starts:</strong> {new Date(event.startTime).toLocaleString()}</p>
          <p><strong>Ends:</strong> {new Date(event.endTime).toLocaleString()}</p>
          <p><strong>Points to Award:</strong> {event.points}</p>
          <p><strong>Capacity:</strong> {event.capacity ? `${event.numGuests}/${event.capacity}` : 'Unlimited'}</p>
          <p><strong>Organizers:</strong> {event.organizers.map(org => org.name).join(', ')}</p>
          <h5 className="mt-4">Guests:</h5>
          {event.guests.length === 0 ? (
            <p>No guests yet.</p>
          ) : (
            <ul>
              {event.guests.map(guest => (
                <li key={guest.id}>{guest.name} ({guest.utorid})</li>
              ))}
            </ul>
          )}
          {!hasRsvpd && (
            <button className="btn btn-success mt-3" onClick={handleRsvp}>RSVP for this Event</button>
          )}
          {hasRsvpd && (
            <button className="btn btn-secondary mt-3" disabled>You have already RSVP'd</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetailsPage;