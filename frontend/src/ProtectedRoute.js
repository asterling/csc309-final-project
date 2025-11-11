import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    // You can add a loading spinner here
    return <div>Loading...</div>;
  }

  if (!token) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
