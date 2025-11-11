import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, fetchUserProfile } from '../api'; // Import API functions

function RegisterPage() {
  const [utorid, setUtorid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('regular'); // Default role
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
      setError('You must be logged in to register a user.');
      navigate('/login');
      return;
    }

    try {
      await registerUser(utorid, name, email, role, token);
      setSuccess('User registered successfully!');
      setUtorid('');
      setName('');
      setEmail('');
      setRole('regular');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  if (loadingUserRole) {
    return <div className="container mt-5">Loading user permissions...</div>;
  }

  // Basic authorization check: only cashier or higher can access
  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  const currentUserRoleIndex = roles.indexOf(currentUserRole);
  const requiredRoleIndex = roles.indexOf('cashier');

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
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Register New User</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="utoridInput" className="form-label">UTORID</label>
                  <input
                    type="text"
                    className="form-control"
                    id="utoridInput"
                    value={utorid}
                    onChange={(e) => setUtorid(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="nameInput" className="form-label">Name</label>
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
                  <label htmlFor="emailInput" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="roleSelect" className="form-label">Role</label>
                  <select
                    className="form-select"
                    id="roleSelect"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="regular">Regular</option>
                    {currentUserRoleIndex >= roles.indexOf('manager') && (
                        <option value="cashier">Cashier</option>
                    )}
                    {currentUserRoleIndex >= roles.indexOf('superuser') && (
                        <option value="manager">Manager</option>
                    )}
                    {currentUserRoleIndex >= roles.indexOf('superuser') && (
                        <option value="superuser">Superuser</option>
                    )}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary w-100">Register User</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;