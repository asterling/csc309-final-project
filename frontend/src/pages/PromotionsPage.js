import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPromotions } from '../api';
import { AuthContext } from '../context/AuthContext';

function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const getPromotions = async () => {
      try {
        setLoading(true);
        const data = await fetchPromotions(token);
        setPromotions(data.results); // Correctly set the results array
      } catch (err) {
        setError(err.message || 'Failed to fetch promotions');
      } finally {
        setLoading(false);
      }
    };

    getPromotions();
  }, [token, navigate]);

  if (loading) {
    return <div className="container mt-5">Loading promotions...</div>;
  }

  if (error) {
    return <div className="container mt-5 alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Available Promotions</h1>
      {promotions.length === 0 ? (
        <div className="alert alert-info text-center">No promotions available at the moment.</div>
      ) : (
        <div className="row">
          {promotions.map((promo) => (
            <div key={promo.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{promo.name}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">{promo.type}</h6>
                  <p className="card-text">{promo.description}</p>
                  {promo.minSpending && <p className="card-text">Min Spending: ${promo.minSpending}</p>}
                  {promo.rate && <p className="card-text">Rate: {promo.rate * 100}% extra points</p>}
                  {promo.points && <p className="card-text">Bonus Points: {promo.points}</p>}
                  <p className="card-text"><small className="text-muted">Starts: {new Date(promo.startTime).toLocaleDateString()}</small></p>
                  <p className="card-text"><small className="text-muted">Ends: {new Date(promo.endTime).toLocaleDateString()}</small></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PromotionsPage;