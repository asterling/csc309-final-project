import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchaseTransaction, fetchAllUsers, fetchPromotions } from '../api';
import { AuthContext } from '../context/AuthContext';

function CreateTransactionPage() {
  const [selectedUtorid, setSelectedUtorid] = useState('');
  const [spent, setSpent] = useState('');
  const [selectedPromotionIds, setSelectedPromotionIds] = useState([]);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPromotionDropdown, setShowPromotionDropdown] = useState(false);

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Authorization and Data Fetching ---
  useEffect(() => {
    if (!token || !user) {
      // If not logged in or user data not loaded, redirect or wait
      navigate('/login');
      return;
    }

    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const currentUserRoleIndex = roles.indexOf(user.role);
    const requiredRoleIndex = roles.indexOf('cashier');

    if (currentUserRoleIndex < requiredRoleIndex) {
      setError("You do not have permission to access this page.");
      return;
    }

    const fetchData = async () => {
      // Fetch Users
      try {
        setLoadingUsers(true);
        const usersData = await fetchAllUsers(token, 1, 9999); // Fetch all users for dropdown
        setUsers(usersData.results);
      } catch (err) {
        setError(prev => prev + (err.message || 'Failed to fetch users. '));
      } finally {
        setLoadingUsers(false);
      }

      // Fetch Promotions
      try {
        setLoadingPromotions(true);
        const promotionsData = await fetchPromotions(token); // Fetch all promotions
        setPromotions(promotionsData.results);
      } catch (err) {
        setError(prev => prev + (err.message || 'Failed to fetch promotions. '));
      } finally {
        setLoadingPromotions(false);
      }
    };

    fetchData();
  }, [token, user, navigate]);

  // --- UTORID Dropdown Logic ---
  const filteredUsers = users.filter(u =>
    u.utorid.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleUserSelect = (utorid) => {
    setSelectedUtorid(utorid);
    setUserSearchTerm(utorid); // Display selected utorid in search box
    setShowUserDropdown(false);
  };

  // --- Promotion Multi-select Dropdown Logic ---
  const handlePromotionCheckboxChange = (promoId) => {
    setSelectedPromotionIds(prev =>
      prev.includes(promoId)
        ? prev.filter(id => id !== promoId)
        : [...prev, promoId]
    );
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('You must be logged in to create a transaction.');
      navigate('/login');
      return;
    }

    if (!selectedUtorid) {
      setError('Please select a user UTORID.');
      return;
    }

    if (isNaN(spent) || parseFloat(spent) <= 0) {
      setError('Amount spent must be a positive number.');
      return;
    }

    try {
      await createPurchaseTransaction(selectedUtorid, parseFloat(spent), selectedPromotionIds, remark, token);
      setSuccess(`Purchase transaction created successfully for ${selectedUtorid}!`);
      // Reset form fields
      setSelectedUtorid('');
      setSpent('');
      setSelectedPromotionIds([]);
      setRemark('');
      setUserSearchTerm('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during transaction creation.');
    }
  };

  // --- Render Logic ---
  if (!user || loadingUsers || loadingPromotions) {
    return <div className="container mt-5">Loading data...</div>;
  }

  const roles = ['regular', 'cashier', 'manager', 'superuser'];
  const currentUserRoleIndex = roles.indexOf(user.role);
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
              <h1 className="text-center">Create Purchase Transaction</h1>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                {/* UTORID Dropdown with Search */}
                <div className="mb-3">
                  <label htmlFor="utoridInput" className="form-label">User UTORID</label>
                  <div className="dropdown">
                    <input
                      type="text"
                      className="form-control"
                      id="utoridInput"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setSelectedUtorid(''); // Clear selection if typing
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      onBlur={() => setTimeout(() => setShowUserDropdown(false), 100)} // Hide after a short delay
                      placeholder="Search by UTORID or Name"
                      required
                    />
                    {showUserDropdown && filteredUsers.length > 0 && (
                      <ul className="dropdown-menu show w-100" aria-labelledby="utoridInput">
                        {filteredUsers.map(u => (
                          <li key={u.id}>
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => handleUserSelect(u.utorid)}
                            >
                              {u.utorid} ({u.name})
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {showUserDropdown && filteredUsers.length === 0 && userSearchTerm && (
                      <ul className="dropdown-menu show w-100">
                        <li><span className="dropdown-item-text">No users found</span></li>
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="spentInput" className="form-label">Amount Spent ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="spentInput"
                    value={spent}
                    onChange={(e) => setSpent(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>

                {/* Promotion Multi-select Dropdown */}
                <div className="mb-3">
                  <label htmlFor="promotionIdsInput" className="form-label">Promotions</label>
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                      type="button"
                      id="promotionDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded={showPromotionDropdown}
                      onClick={() => setShowPromotionDropdown(prev => !prev)}
                    >
                      {selectedPromotionIds.length === 0
                        ? 'Select Promotions'
                        : `${selectedPromotionIds.length} selected`}
                    </button>
                    <ul className={`dropdown-menu ${showPromotionDropdown ? 'show' : ''} w-100`} aria-labelledby="promotionDropdown" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {promotions.length === 0 ? (
                        <li><span className="dropdown-item-text">No promotions available</span></li>
                      ) : (
                        promotions.map(promo => (
                          <li key={promo.id}>
                            <div className="form-check px-4 py-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                value={promo.id}
                                id={`promo-${promo.id}`}
                                checked={selectedPromotionIds.includes(promo.id)}
                                onChange={() => handlePromotionCheckboxChange(promo.id)}
                              />
                              <label className="form-check-label" htmlFor={`promo-${promo.id}`}>
                                {promo.name} ({promo.type})
                              </label>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
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
                <button type="submit" className="btn btn-primary w-100">Create Transaction</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTransactionPage;