import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../api'; // Import and rename the login function
import { AuthContext } from '../context/AuthContext';

function LoginPage() {
  const [utorid, setUtorid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const from = location.state?.from?.pathname || "/profile";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const data = await apiLogin(utorid, password);
      login(data.token, data.expiresAt); // Use login from context
      navigate(from, { replace: true }); // Redirect to the page the user was trying to access
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h1 className="text-center">Login</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
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
                  <label htmlFor="passwordInput" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="passwordInput"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Login</button>
              </form>
              <div className="mt-3 text-center">
                <p>
                  <a href="/request-password-reset">Forgot Password?</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;