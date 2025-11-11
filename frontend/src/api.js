const API_BASE_URL = '';

export async function login(utorid, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ utorid, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data; // Contains token and expiresAt
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
}

export async function fetchUserProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user profile');
    }

    return data; // Contains user profile data
  } catch (error) {
    console.error('Fetch user profile API error:', error);
    throw error;
  }
}

export async function registerUser(utorid, name, email, role, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ utorid, name, email, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'User registration failed');
    }

    return data; // Contains new user data
  } catch (error) {
    console.error('Register user API error:', error);
    throw error;
  }
}

export async function requestPasswordReset(utorid) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ utorid }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset request failed');
    }

    return data; // Contains expiresAt and resetToken (if user exists)
  } catch (error) {
    console.error('Request password reset API error:', error);
    throw error;
  }
}

export async function resetPassword(resetToken, utorid, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/resets/${resetToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ utorid, password: newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset failed');
    }

    return data; // Contains success message
  } catch (error) {
    console.error('Reset password API error:', error);
    throw error;
  }
}

export async function updateUserProfile(profileData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data; // Contains updated user data
  } catch (error) {
    console.error('Update user profile API error:', error);
    throw error;
  }
}

export async function changePassword(oldPassword, newPassword, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ old: oldPassword, new: newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password');
    }

    return data; // Contains success message
  } catch (error) {
    console.error('Change password API error:', error);
    throw error;
  }
}

export async function transferPoints(recipientId, amount, remark, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${recipientId}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'transfer', amount, remark }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to transfer points');
    }

    return data; // Contains transaction details
  } catch (error) {
    console.error('Transfer points API error:', error);
    throw error;
  }
}

export async function requestRedemption(amount, remark, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ type: 'redemption', amount, remark }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request redemption');
    }

    return data; // Contains transaction details (including id for QR code)
  } catch (error) {
    console.error('Request redemption API error:', error);
    throw error;
  }
}

export async function fetchPromotions(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/promotions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch promotions');
    }

    return data; // Contains list of promotions
  } catch (error) {
    console.error('Fetch promotions API error:', error);
    throw error;
  }
}

export async function fetchEvents(token, page = 1, limit = 10, filters = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: page,
      limit: limit,
      published: true, // Regular users only see published events
      ...filters,
    }).toString();

    const response = await fetch(`${API_BASE_URL}/events?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch events');
    }

    return data; // Contains count and results (list of events)
  } catch (error) {
    console.error('Fetch events API error:', error);
    throw error;
  }
}

export async function fetchEventDetails(eventId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch event details');
    }

    return data; // Contains event details
  } catch (error) {
    console.error('Fetch event details API error:', error);
    throw error;
  }
}

export async function rsvpForEvent(eventId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/guests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ utorid: 'current_user_utorid' }), // Placeholder, backend should get utorid from token
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to RSVP for event');
    }

    return data; // Contains updated event details or success message
  } catch (error) {
    console.error('RSVP for event API error:', error);
    throw error;
  }
}

export async function fetchUserTransactions(token, page = 1, limit = 10, filters = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: page,
      limit: limit,
      ...filters,
    }).toString();

    // The backend API for /transactions supports filtering by 'utorid'
    // We need to get the current user's utorid to filter their transactions.
    // For now, I'll assume the utorid is available from a separate call or context.
    // A more robust solution would be to pass the current user's utorid as a filter.
    const userProfile = await fetchUserProfile(token); // Fetch current user's profile to get utorid
    const utoridFilter = { utorid: userProfile.utorid };

    const response = await fetch(`${API_BASE_URL}/transactions?${queryParams}&utorid=${utoridFilter.utorid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user transactions');
    }

    return data; // Contains count and results (list of transactions)
  } catch (error) {
    console.error('Fetch user transactions API error:', error);
    throw error;
  }
}

export async function createPurchaseTransaction(utorid, spent, promotionIds, remark, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ utorid, type: 'purchase', spent, promotionIds, remark }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create purchase transaction');
    }

    return data; // Contains transaction details
  } catch (error) {
    console.error('Create purchase transaction API error:', error);
    throw error;
  }
}

export async function processRedemption(transactionId, token) {
  try {
    // This is a placeholder. The backend API needs to be extended to support processing redemptions.
    // Assuming a PATCH endpoint like /transactions/:transactionId/process-redemption
    // or a generic PATCH /transactions/:transactionId that allows updating processedBy and redeemed.
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ processedBy: 'cashier', redeemed: true }), // Placeholder data
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process redemption');
    }

    return data; // Contains updated transaction details
  } catch (error) {
    console.error('Process redemption API error:', error);
    throw error;
  }
}

export async function fetchAllUsers(token, page = 1, limit = 10, filters = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: page,
      limit: limit,
      ...filters,
    }).toString();

    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    return data; // Contains count and results (list of users)
  } catch (error) {
    console.error('Fetch all users API error:', error);
    throw error;
  }
}

export async function fetchUserById(userId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user by ID');
    }

    return data; // Contains user details
  } catch (error) {
    console.error('Fetch user by ID API error:', error);
    throw error;
  }
}

export async function updateUserById(userId, userData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user by ID');
    }

    return data; // Contains updated user data
  } catch (error) {
    console.error('Update user by ID API error:', error);
    throw error;
  }
}

export async function fetchTransactionDetails(transactionId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch transaction details');
    }

    return data; // Contains transaction details
  } catch (error) {
    console.error('Fetch transaction details API error:', error);
    throw error;
  }
}

export async function createAdjustmentTransaction(utorid, amount, relatedId, remark, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ utorid, type: 'adjustment', amount, relatedId, remark }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create adjustment transaction');
    }

    return data; // Contains transaction details
  } catch (error) {
    console.error('Create adjustment transaction API error:', error);
    throw error;
  }
}

export async function markTransactionSuspicious(transactionId, suspiciousStatus, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}/suspicious`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ suspicious: suspiciousStatus }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark transaction suspicious');
    }

    return data; // Contains updated transaction details
  } catch (error) {
    console.error('Mark transaction suspicious API error:', error);
    throw error;
  }
}

export async function createPromotion(promotionData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/promotions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(promotionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create promotion');
    }

    return data; // Contains new promotion data
  } catch (error) {
    console.error('Create promotion API error:', error);
    throw error;
  }
}

export async function fetchPromotionDetails(promotionId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch promotion details');
    }

    return data; // Contains promotion details
  } catch (error) {
    console.error('Fetch promotion details API error:', error);
    throw error;
  }
}

export async function updatePromotion(promotionId, promotionData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(promotionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update promotion');
    }

    return data; // Contains updated promotion data
  } catch (error) {
    console.error('Update promotion API error:', error);
    throw error;
  }
}

export async function deletePromotion(promotionId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete promotion');
    }

    return { message: 'Promotion deleted successfully' };
  } catch (error) {
    console.error('Delete promotion API error:', error);
    throw error;
  }
}

export async function createEvent(eventData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create event');
    }

    return data; // Contains new event data
  } catch (error) {
    console.error('Create event API error:', error);
    throw error;
  }
}

export async function updateEvent(eventId, eventData, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update event');
    }

    return data; // Contains updated event data
  } catch (error) {
    console.error('Update event API error:', error);
    throw error;
  }
}

export async function deleteEvent(eventId, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete event');
    }

    return { message: 'Event deleted successfully' };
  } catch (error) {
    console.error('Delete event API error:', error);
    throw error;
  }
}

export async function addGuestToEvent(eventId, utorid, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/guests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ utorid }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add guest to event');
    }

    return data; // Contains updated event details or success message
  } catch (error) {
    console.error('Add guest to event API error:', error);
    throw error;
  }
}

export async function removeGuestFromEvent(eventId, utorid, token) {
  try {
    // This is a placeholder. The backend API needs to be extended to support removing guests.
    // Assuming a DELETE endpoint like /events/:eventId/guests/:utorid
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/guests/${utorid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove guest from event');
    }

    return { message: 'Guest removed successfully' };
  } catch (error) {
    console.error('Remove guest from event API error:', error);
    throw error;
  }
}

export async function awardPointsToGuest(eventId, utorid, amount, remark, token) {
  try {
    // This is a placeholder. The backend API needs to be extended to support awarding points to guests.
    // For now, it will call createAdjustmentTransaction.
    const response = await createAdjustmentTransaction(utorid, amount, eventId, remark, token);
    return response;
  } catch (error) {
    console.error('Award points to guest API error:', error);
    throw error;
  }
}

// Add other API functions here as needed

export async function fetchAllTransactions(token, page = 1, limit = 10, filters = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: page,
      limit: limit,
      ...filters,
    }).toString();

    const response = await fetch(`${API_BASE_URL}/transactions?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch all transactions');
    }

    return data;
  } catch (error) {
    console.error('Fetch all transactions API error:', error);
    throw error;
  }
}