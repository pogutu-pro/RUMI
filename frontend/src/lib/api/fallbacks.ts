/**
 * Graceful Fallback Handlers for Missing Endpoints
 * 
 * Provides default data and error handling for the 5 endpoints
 * that don't exist yet in the backend, allowing frontend to work
 * in production while backend implements them.
 */

/**
 * 1. Unread Message Count Fallback
 * MISSING: GET /messages/unread-count/
 * FALLBACK: Return 0 until backend implements
 */
export async function getUnreadMessageCount(): Promise<number> {
  try {
    const response = await fetch('/accounts/chat/unread-count/');
    if (!response.ok) throw new Error('Endpoint not implemented');
    const data = await response.json();
    return data.data?.count || 0;
  } catch (error) {
    // Graceful fallback - backend hasn't implemented yet
    console.warn('Unread message count endpoint not available, using fallback');
    return 0; // Show no unread messages rather than breaking UI
  }
}

/**
 * 2. Roommate Match Request Fallbacks
 * MISSING: POST /caretaker/roommates/match-requests/{id}/approve/
 * MISSING: POST /caretaker/roommates/match-requests/{id}/reject/
 */
export async function approveRoommateMatch(requestId: string, data: any) {
  try {
    const response = await fetch(
      `/api/v1/caretaker/roommates/match-requests/${requestId}/approve/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Not implemented');
    return await response.json();
  } catch (error) {
    // Temporary fallback - show message to user
    return {
      success: false,
      message: 'Roommate approval feature coming soon. Please contact admin manually.',
      fallback: true,
    };
  }
}

export async function rejectRoommateMatch(requestId: string, reason: string) {
  try {
    const response = await fetch(
      `/api/v1/caretaker/roommates/match-requests/${requestId}/reject/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }
    );
    if (!response.ok) throw new Error('Not implemented');
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Roommate rejection feature coming soon. Please contact admin manually.',
      fallback: true,
    };
  }
}

/**
 * 3. Student Late Entries Fallback
 * MISSING: GET /student/security/late-entries/
 */
export async function getMyLateEntries() {
  try {
    const response = await fetch('/api/v1/student/security/late-entries/');
    if (!response.ok) throw new Error('Not implemented');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.warn('Late entries endpoint not available');
    return []; // Return empty array - no late entries to show
  }
}

/**
 * 4. Student Visitor Invitation Fallback
 * MISSING: POST /student/security/visitor-invitations/
 */
export async function createVisitorInvitation(data: any) {
  try {
    const response = await fetch('/api/v1/student/security/visitor-invitations/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Not implemented');
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Visitor invitation feature coming soon. Please contact your caretaker directly.',
      fallback: true,
    };
  }
}

/**
 * 5. My Visitor Invitations Fallback
 * MISSING: GET /student/security/visitor-invitations/
 */
export async function getMyVisitorInvitations() {
  try {
    const response = await fetch('/api/v1/student/security/visitor-invitations/');
    if (!response.ok) throw new Error('Not implemented');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.warn('Visitor invitations endpoint not available');
    return []; // Return empty array
  }
}

/**
 * Error Handler Wrapper
 * Wraps API calls with consistent error handling
 */
export async function withFallback<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (errorMessage) {
      console.warn(errorMessage, error);
    }
    return fallbackValue;
  }
}

/**
 * Example Usage:
 * 
 * const unreadCount = await withFallback(
 *   () => getUnreadMessageCount(),
 *   0,
 *   'Unread count unavailable'
 * );
 */
