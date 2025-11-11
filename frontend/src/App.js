import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetPage from './pages/PasswordResetPage';
import EditProfilePage from './pages/EditProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import UserDashboardPage from './pages/UserDashboardPage';
import TransferPointsPage from './pages/TransferPointsPage';
import RedemptionRequestPage from './pages/RedemptionRequestPage';
import RedemptionQRCodePage from './pages/RedemptionQRCodePage';
import PromotionsPage from './pages/PromotionsPage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import UserTransactionsPage from './pages/UserTransactionsPage';
import CreateTransactionPage from './pages/CreateTransactionPage';
import ProcessRedemptionPage from './pages/ProcessRedemptionPage';
import ManageUsersPage from './pages/ManageUsersPage';
import EditUserPage from './pages/EditUserPage';
import ManageTransactionsPage from './pages/ManageTransactionsPage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';
import CreatePromotionPage from './pages/CreatePromotionPage';
import ManagePromotionsPage from './pages/ManagePromotionsPage';
import EditPromotionPage from './pages/EditPromotionPage';
import CreateEventPage from './pages/CreateEventPage';
import ManageEventsPage from './pages/ManageEventsPage';
import ManageEventGuestsPage from './pages/ManageEventGuestsPage';
import AwardPointsPage from './pages/AwardPointsPage'; // New import
import Navbar from './components/Navbar';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-password-reset" element={<PasswordResetRequestPage />} />
          <Route path="/reset-password/:token" element={<PasswordResetPage />} />

          {/* Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
          <Route path="/transfer-points" element={<ProtectedRoute><TransferPointsPage /></ProtectedRoute>} />
          <Route path="/redeem-points" element={<ProtectedRoute><RedemptionRequestPage /></ProtectedRoute>} />
          <Route path="/redemption-qr/:transactionId" element={<ProtectedRoute><RedemptionQRCodePage /></ProtectedRoute>} />
          <Route path="/promotions" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetailsPage /></ProtectedRoute>} />
          <Route path="/my-transactions" element={<ProtectedRoute><UserTransactionsPage /></ProtectedRoute>} />
          <Route path="/create-transaction" element={<ProtectedRoute><CreateTransactionPage /></ProtectedRoute>} />
          <Route path="/process-redemption" element={<ProtectedRoute><ProcessRedemptionPage /></ProtectedRoute>} />
          <Route path="/manage-users" element={<ProtectedRoute><ManageUsersPage /></ProtectedRoute>} />
          <Route path="/manage-users/:userId" element={<ProtectedRoute><EditUserPage /></ProtectedRoute>} />
          <Route path="/manage-transactions" element={<ProtectedRoute><ManageTransactionsPage /></ProtectedRoute>} />
          <Route path="/manage-transactions/:transactionId" element={<ProtectedRoute><TransactionDetailsPage /></ProtectedRoute>} />
          <Route path="/create-promotion" element={<ProtectedRoute><CreatePromotionPage /></ProtectedRoute>} />
          <Route path="/manage-promotions" element={<ProtectedRoute><ManagePromotionsPage /></ProtectedRoute>} />
          <Route path="/manage-promotions/:promotionId" element={<ProtectedRoute><EditPromotionPage /></ProtectedRoute>} />
          <Route path="/create-event" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
          <Route path="/manage-events" element={<ProtectedRoute><ManageEventsPage /></ProtectedRoute>} />
          <Route path="/manage-events/:eventId/guests" element={<ProtectedRoute><ManageEventGuestsPage /></ProtectedRoute>} />
          <Route path="/manage-events/:eventId/award-points" element={<ProtectedRoute><AwardPointsPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;