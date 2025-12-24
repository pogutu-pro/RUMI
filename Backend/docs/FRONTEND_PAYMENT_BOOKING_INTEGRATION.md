# Frontend Payment & Booking Integration Requirements

## Overview

This document outlines the changes required for the frontend to properly integrate with the backend's payment and booking system, specifically for the 3-minute room lock countdown functionality.

## Current Issues

1. **Frontend Timer**: Uses `paymentTimerStartedAt` from local store with 15-minute hardcoded timer
2. **Backend Reservation**: Uses `RoomReservation` with `expiry_time` from backend
3. **No Synchronization**: Frontend and backend timers are not synchronized, causing potential timing conflicts

## Backend Changes Made

### 1. Updated Room Reservation Endpoint
**Endpoint**: `POST /api/v1/hostels/<room_id>/reserve/`

**New Response Fields**:
```json
{
  "reservation_id": 123,
  "booking_id": 456,
  "room_id": 789,
  "expires_at": "2025-12-20T14:50:34.803Z",  // ISO format timestamp
  "expires_in_seconds": 900,                  // 15 minutes in seconds
  "reservation_token": "uuid-token-string",
  "status": "reserved",
  "countdown_started_at": "2025-12-20T14:35:34.803Z"
}
```

### 2. New Reservation Status Endpoint
**Endpoint**: `GET /api/v1/reservations/<reservation_id>/status/`

**Response**:
```json
{
  "reservation_id": 123,
  "status": "active",  // or "expired"
  "expires_at": "2025-12-20T14:50:34.803Z",
  "expires_in_seconds": 450,  // Remaining seconds
  "countdown_started_at": "2025-12-20T14:35:34.803Z",
  "booking": {
    "id": 456,
    "booking_reference": "RUMI-BK-2025-ABC123",
    "status": "reserved"
  },
  "room": {
    "id": 789,
    "room_number": "101",
    "hostel_name": "Sunshine Hostel"
  }
}
```

## Frontend Integration Requirements

### 1. Update Booking Store

**Current Issue**: The `useBookingStore` uses `paymentTimerStartedAt` as a local timestamp.

**Required Changes**:

```typescript
// Add to BookingState interface
interface BookingState {
  //
  reservationId: string | null;
  reservationExpiryTime: string | null;  // ISO timestamp from backend
  reservationExpiresInSeconds: number | null;  // Remaining seconds
}

// Add new actions
setReservationExpiryTime: (expiry ... existing fieldsTime: string, expiresInSeconds: number) => void;
setReservationId: (reservationId: string) => void;
updateReservationStatus: () => Promise<void>;
}
```

### 2. Modify Reservation Flow

**Current Flow**: 
1. User clicks "Book This Room" → `startPaymentTimer()` sets local timestamp
2. Show countdown based on local timestamp + 15 minutes

**Required Flow**:
1. User clicks "Book This Room" → Call `POST /api/v1/hostels/<room_id>/reserve/`
2. Store `expires_at` and `reservation_id` from response
3. Start countdown using backend's `expires_at` timestamp
4. Optionally poll `GET /api/v1/reservations/<reservation_id>/status/` for real-time updates

### 3. Update Countdown Timer Logic

**Current Implementation** (in `hostel-booking-widget.tsx`):
```typescript
useEffect(() => {
  if (currentStep === 'payment' && paymentTimerStartedAt) {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = differenceInSeconds(addMinutes(paymentTimerStartedAt, 15), now);
      // ... rest of logic
    }, 1000);
  }
}, [currentStep, paymentTimerStartedAt]);
```

**Required Implementation**:
```typescript
useEffect(() => {
  if (currentStep === 'payment' && reservationExpiryTime) {
    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(reservationExpiryTime);
      const diff = differenceInSeconds(expiry, now);
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        toast.error('Payment session expired. Please start again.');
        // Handle expired reservation
        handleReservationExpired();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
  }
}, [currentStep, reservationExpiryTime]);
```

### 4. Add API Integration

**Add to `frontend/src/features/bookings/api/bookings.ts`**:

```typescript
// Create room reservation
export const createRoomReservation = async (data: {
  roomId: string;
  moveInDate: Date;
  paymentPlan?: string;
}): Promise<{
  reservation_id: number;
  booking_id: number;
  expires_at: string;
  expires_in_seconds: number;
  reservation_token: string;
  status: string;
}> => {
  const response = await api.axios.post(
    `/hostels/${data.roomId}/reserve/`,
    {
      move_in_date: data.moveInDate.toISOString(),
      payment_plan: data.paymentPlan || 'monthly'
    }
  );
  return response.data.data;
};

// Check reservation status
export const getReservationStatus = async (reservationId: string): Promise<{
  reservation_id: number;
  status: 'active' | 'expired';
  expires_at: string;
  expires_in_seconds: number;
  booking: any;
  room: any;
}> => {
  const response = await api.axios.get(`/reservations/${reservationId}/status/`);
  return response.data.data;
};
```

### 5. Update Hostel Booking Widget

**In `hostel-booking-widget.tsx`**:

**Replace**:
```typescript
const createBookingMutation = useMutation({
  mutationFn: async () => {
    // ... existing logic
    return createBookingWithValidation({
      hostelId: hostel.id,
      roomId: selectedRoom.id,
      moveInDate: safeMoveInDate,
      durationMonths,
    });
  },
  onSuccess: async (data) => {
    setCurrentBookingId(data.id);
    setStep('payment');
    startPaymentTimer();  // ❌ Remove this
    // ... rest
  }
});
```

**With**:
```typescript
const createBookingMutation = useMutation({
  mutationFn: async () => {
    // Create reservation first
    const reservation = await createRoomReservation({
      roomId: selectedRoom.id,
      moveInDate: safeMoveInDate,
      paymentPlan: 'monthly'
    });
    
    // Then create booking with reservation token
    const booking = await createBookingWithValidation({
      hostelId: hostel.id,
      roomId: selectedRoom.id,
      moveInDate: safeMoveInDate,
      durationMonths,
      reservationToken: reservation.reservation_token
    });
    
    return { ...booking, reservation };
  },
  onSuccess: async (data) => {
    setCurrentBookingId(data.id);
    setReservationId(data.reservation.reservation_id.toString());
    setReservationExpiryTime(
      data.reservation.expires_at, 
      data.reservation.expires_in_seconds
    );
    setStep('payment');
    // startPaymentTimer(); ❌ Remove this
  }
});
```

### 6. Add Reservation Expiry Handler

**Add to booking store**:
```typescript
const handleReservationExpired = async () => {
  if (reservationId) {
    try {
      const status = await getReservationStatus(reservationId);
      if (status.status === 'expired') {
        toast.error('Your reservation has expired. Please select a room again.');
        resetBooking();
        // Optionally redirect to room selection
      }
    } catch (error) {
      console.error('Failed to check reservation status:', error);
    }
  }
};
```

### 7. Update Timer Display

**In PaymentView component**:
```typescript
// Replace hardcoded 15-minute message with dynamic time
<div>
  <h4 className="font-bold text-amber-900 text-sm">
    Complete payment in {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
  </h4>
  <p className="text-xs text-amber-700 mt-1">
    Your slot in {selectedRoom?.name} is held until {new Date(reservationExpiryTime).toLocaleTimeString()}.
  </p>
</div>
```

### 8. Add Real-time Status Updates (Optional Enhancement)

**For better synchronization, consider polling reservation status**:
```typescript
useEffect(() => {
  if (currentStep === 'payment' && reservationId) {
    const interval = setInterval(async () => {
      try {
        const status = await getReservationStatus(reservationId);
        if (status.status === 'expired') {
          toast.error('Reservation expired');
          resetBooking();
        } else {
          // Update remaining time from backend
          setTimeLeft(status.expires_in_seconds);
        }
      } catch (error) {
        console.error('Failed to check reservation status:', error);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }
}, [currentStep, reservationId]);
```

## Summary of Required Changes

1. **Update Booking Store**: Add reservation fields and new actions
2. **Modify API Layer**: Add reservation creation and status check endpoints
3. **Update Booking Flow**: Use backend reservation instead of local timer
4. **Fix Countdown Logic**: Use backend expiry time instead of local calculation
5. **Add Error Handling**: Handle reservation expiry scenarios
6. **Update UI Messages**: Show actual expiry time and reservation details

## Testing Requirements

1. Test reservation creation and expiry handling
2. Test countdown synchronization between frontend and backend
3. Test payment flow with expired reservations
4. Test real-time status updates (if implemented)
5. Test network interruptions during payment process

## Benefits of This Integration

1. **Accurate Timing**: Countdown based on server time, preventing client-side clock issues
2. **Consistent State**: Frontend always knows the true reservation status
3. **Better UX**: Real-time updates and proper error handling
4. **Scalability**: Backend controls the authoritative timing
5. **Reliability**: No dependency on client-side timer accuracy

## Migration Path

1. **Phase 1**: Update API layer and add new endpoints
2. **Phase 2**: Update booking store and flow logic
3. **Phase 3**: Update UI components and timer display
4. **Phase 4**: Add real-time status updates (optional)
5. **Phase 5**: Remove old timer logic and clean up code

This integration ensures that the frontend and backend are perfectly synchronized for the payment-booking countdown functionality.