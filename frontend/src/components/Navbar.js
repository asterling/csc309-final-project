import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const { token, user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user ? user.role : null;
  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  const userRoleIndex = roles.indexOf(userRole);

  // Permission checks
  const isCashierOrHigher = userRoleIndex >= roles.indexOf('cashier');
  const isManagerOrHigher = userRoleIndex >= roles.indexOf('manager');

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">LoyaltyApp</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          {/* Left-aligned items */}
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            {token && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="communityDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Community
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="communityDropdown">
                    <li><Link className="dropdown-item" to="/events">Events</Link></li>
                    <li><Link className="dropdown-item" to="/promotions">Promotions</Link></li>
                  </ul>
                </li>

                {/* Cashier-specific Menu */}
                {isCashierOrHigher && !isManagerOrHigher && (
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" id="cashierDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Cashier Tasks
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="cashierDropdown">
                      <li><Link className="dropdown-item" to="/register">Register User</Link></li>
                      <li><Link className="dropdown-item" to="/create-transaction">Create Transaction</Link></li>
                      <li><Link className="dropdown-item" to="/process-redemption">Process Redemption</Link></li>
                    </ul>
                  </li>
                )}

                {/* Manager/Superuser-specific Menu */}
                {isManagerOrHigher && (
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Admin
                    </a>
                    <ul className="dropdown-menu" aria-labelledby="adminDropdown">
                      <li><h6 className="dropdown-header">User Management</h6></li>
                      <li><Link className="dropdown-item" to="/manage-users">Manage Users</Link></li>
                      <li><Link className="dropdown-item" to="/register">Register User</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><h6 className="dropdown-header">Transaction Management</h6></li>
                      <li><Link className="dropdown-item" to="/manage-transactions">Manage Transactions</Link></li>
                      <li><Link className="dropdown-item" to="/create-transaction">Create Transaction</Link></li>
                      <li><Link className="dropdown-item" to="/process-redemption">Process Redemption</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><h6 className="dropdown-header">Promotion Management</h6></li>
                      <li><Link className="dropdown-item" to="/manage-promotions">Manage Promotions</Link></li>
                      <li><Link className="dropdown-item" to="/create-promotion">Create Promotion</Link></li>
                      <li><hr className="dropdown-divider" /></li>
                      <li><h6 className="dropdown-header">Event Management</h6></li>
                      <li><Link className="dropdown-item" to="/manage-events">Manage Events</Link></li>
                      <li><Link className="dropdown-item" to="/create-event">Create Event</Link></li>
                    </ul>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* Right-aligned items */}
          <ul className="navbar-nav">
            {token ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {user ? user.name : 'Profile'}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><Link className="dropdown-item" to="/edit-profile">Edit Profile</Link></li>
                  <li><Link className="dropdown-item" to="/my-transactions">My Transactions</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/transfer-points">Transfer Points</Link></li>
                  <li><Link className="dropdown-item" to="/redeem-points">Redeem Points</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

