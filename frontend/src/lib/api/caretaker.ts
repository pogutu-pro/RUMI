import { apiClient } from './client';
import type {
  CaretakerDashboardData,
  TenantInfo,
  TenantFilters,
  RoommateGroup,
  RoommateMatchRequest,
  RoommateAssignment,
  CheckInData,
  CheckOutData,
  BookingVerification,
  RoomStatus,
  RoomAssignment,
  RoomChange,
  MaintenanceRequest,
  MaintenanceUpdate,
  MaintenanceFilters,
  VisitorLog,
  NightCheckReport,
  LateEntryLog,
  SecurityFilters,
  CaretakerConversation,
  CaretakerMessage,
} from '@/types/caretaker.types';

// ==================== Dashboard ====================

export async function getCaretakerDashboard(): Promise<CaretakerDashboardData> {
  const response = await apiClient.axios.get<CaretakerDashboardData>('/caretaker/dashboard');
  return response.data;
}

// ==================== Tenant Management ====================

export async function getTenants(filters?: TenantFilters): Promise<TenantInfo[]> {
  const response = await apiClient.axios.get<TenantInfo[]>('/caretaker/tenants', { params: filters });
  return response.data;
}

export async function getTenant(id: string): Promise<TenantInfo> {
  const response = await apiClient.axios.get<TenantInfo>(`/caretaker/tenants/${id}`);
  return response.data;
}

export async function updateTenant(id: string, data: Partial<TenantInfo>): Promise<TenantInfo> {
  const response = await apiClient.axios.patch<TenantInfo>(`/caretaker/tenants/${id}`, data);
  return response.data;
}

// ==================== Roommate Management ====================

export async function getRoommateGroups():Promise<RoommateGroup[]> {
  const response = await apiClient.axios.get<RoommateGroup[]>('/caretaker/roommates/groups');
  return response.data;
}

export async function getRoommateGroup(roomId: string): Promise<RoommateGroup> {
  const response = await apiClient.axios.get<RoommateGroup>(`/caretaker/roommates/groups/${roomId}`);
  return response.data;
}

export async function getRoommateMatchRequests(): Promise<RoommateMatchRequest[]> {
  const response = await apiClient.axios.get<RoommateMatchRequest[]>('/caretaker/roommates/match-requests');
  return response.data;
}

export async function approveRoommateMatch(requestId: string, assignment: RoommateAssignment): Promise<void> {
  await apiClient.axios.post(`/caretaker/roommates/match-requests/${requestId}/approve`, assignment);
}

export async function rejectRoommateMatch(requestId: string, reason: string): Promise<void> {
  await apiClient.axios.post(`/caretaker/roommates/match-requests/${requestId}/reject`, { reason });
}

export async function assignRoommates(assignment: RoommateAssignment): Promise<void> {
  await apiClient.axios.post('/caretaker/roommates/assign', assignment);
}

export async function updateRoommateGroup(roomId: string, updates: Partial<RoommateGroup>): Promise<RoommateGroup> {
  const response = await apiClient.axios.patch<RoommateGroup>(`/caretaker/roommates/groups/${roomId}`, updates);
  return response.data;
}

// ==================== Check-In / Check-Out ====================

export async function verifyBookingCode(code: string): Promise<BookingVerification> {
  const response = await apiClient.axios.post<BookingVerification>('/caretaker/check-in/verify', { code });
  return response.data;
}

export async function processCheckIn(data: CheckInData): Promise<void> {
  await apiClient.axios.post('/caretaker/check-in', data);
}

export async function uploadCheckInPhotos(photos: File[]): Promise<string[]> {
  const formData = new FormData();
  photos.forEach((photo) => formData.append('photos', photo));
  
  const response = await apiClient.axios.post<{ urls: string[] }>('/caretaker/check-in/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.urls;
}

export async function processCheckOut(data: CheckOutData): Promise<void> {
  await apiClient.axios.post('/caretaker/check-out', data);
}

export async function uploadCheckOutPhotos(photos: File[]): Promise<string[]> {
  const formData = new FormData();
  photos.forEach((photo) => formData.append('photos', photo));
  
  const response = await apiClient.axios.post<{ urls: string[] }>('/caretaker/check-out/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.urls;
}

// ==================== Room Management ====================

export async function getRooms(): Promise<RoomStatus[]> {
  const response = await apiClient.axios.get<RoomStatus[]>('/caretaker/rooms');
  return response.data;
}

export async function getRoom(id: string): Promise<RoomStatus> {
  const response = await apiClient.axios.get<RoomStatus>(`/caretaker/rooms/${id}`);
  return response.data;
}

export async function assignRoom(assignment: RoomAssignment): Promise<void> {
  await apiClient.axios.post('/caretaker/rooms/assign', assignment);
}

export async function requestRoomChange(change: Omit<RoomChange, 'id' | 'status' | 'requestedDate'>): Promise<RoomChange> {
  const response = await apiClient.axios.post<RoomChange>('/caretaker/rooms/change-request', change);
  return response.data;
}

export async function markRoomMaintenance(roomId: string, reason: string, expectedEndDate?: string): Promise<void> {
  await apiClient.axios.post(`/caretaker/rooms/${roomId}/maintenance`, { reason, expectedEndDate });
}

export async function clearRoomMaintenance(roomId: string): Promise<void> {
  await apiClient.axios.delete(`/caretaker/rooms/${roomId}/maintenance`);
}

export async function updateRoomNotes(roomId: string, notes: string): Promise<void> {
  await apiClient.axios.patch(`/caretaker/rooms/${roomId}`, { notes });
}

// ==================== Maintenance ====================

export async function getMaintenanceRequests(filters?: MaintenanceFilters): Promise<MaintenanceRequest[]> {
  const response = await apiClient.axios.get<MaintenanceRequest[]>('/caretaker/maintenance', { params: filters });
  return response.data;
}

export async function getMaintenanceRequest(id: string): Promise<MaintenanceRequest> {
  const response = await apiClient.axios.get<MaintenanceRequest>(`/caretaker/maintenance/${id}`);
  return response.data;
}

export async function createMaintenanceRequest(data: Omit<MaintenanceRequest, 'id' | 'createdAt' | 'updatedAt' | 'updates'>): Promise<MaintenanceRequest> {
  const response = await apiClient.axios.post<MaintenanceRequest>('/caretaker/maintenance', data);
  return response.data;
}

export async function updateMaintenanceStatus(id: string, update: Omit<MaintenanceUpdate, 'id' | 'requestId' | 'timestamp'>): Promise<MaintenanceRequest> {
  const response = await apiClient.axios.post<MaintenanceRequest>(`/caretaker/maintenance/${id}/update`, update);
  return response.data;
}

export async function uploadMaintenancePhotos(photos: File[]): Promise<string[]> {
  const formData = new FormData();
  photos.forEach((photo) => formData.append('photos', photo));
  
  const response = await apiClient.axios.post<{ urls: string[] }>('/caretaker/maintenance/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.urls;
}

export async function notifyLandlordAboutMaintenance(id: string): Promise<void> {
  await apiClient.axios.post(`/caretaker/maintenance/${id}/notify-landlord`);
}

// ==================== Security Monitoring ====================

export async function getVisitorLogs(filters?: SecurityFilters): Promise<VisitorLog[]> {
  const response = await apiClient.axios.get<VisitorLog[]>('/caretaker/security/visitors', { params: filters });
  return response.data;
}

export async function createVisitorLog(data: Omit<VisitorLog, 'id' | 'loggedBy' | 'loggedByName'>): Promise<VisitorLog> {
  const response = await apiClient.axios.post<VisitorLog>('/caretaker/security/visitors', data);
  return response.data;
}

export async function updateVisitorLogCheckOut(id: string, timeOut: string): Promise<VisitorLog> {
  const response = await apiClient.axios.patch<VisitorLog>(`/caretaker/security/visitors/${id}`, { timeOut });
  return response.data;
}

export async function getNightCheckReports(filters?: SecurityFilters): Promise<NightCheckReport[]> {
  const response = await apiClient.axios.get<NightCheckReport[]>('/caretaker/security/night-checks', { params: filters });
  return response.data;
}

export async function createNightCheckReport(data: Omit<NightCheckReport, 'id' | 'performedBy' | 'performedByName' | 'createdAt'>): Promise<NightCheckReport> {
  const response = await apiClient.axios.post<NightCheckReport>('/caretaker/security/night-checks', data);
  return response.data;
}

export async function getLateEntryLogs(filters?: SecurityFilters): Promise<LateEntryLog[]> {
  const response = await apiClient.axios.get<LateEntryLog[]>('/caretaker/security/late-entries', { params: filters });
  return response.data;
}

export async function createLateEntryLog(data: Omit<LateEntryLog, 'id' | 'loggedBy' | 'loggedByName' | 'createdAt'>): Promise<LateEntryLog> {
  const response = await apiClient.axios.post<LateEntryLog>('/caretaker/security/late-entries', data);
  return response.data;
}

// ==================== Messaging ====================

export async function getCaretakerConversations(): Promise<CaretakerConversation[]> {
  const response = await apiClient.axios.get<CaretakerConversation[]>('/caretaker/conversations');
  return response.data;
}

export async function getConversationMessages(conversationId: string): Promise<CaretakerMessage[]> {
  const response = await apiClient.axios.get<CaretakerMessage[]>(`/caretaker/conversations/${conversationId}/messages`);
  return response.data;
}

export async function sendCaretakerMessage(conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<CaretakerMessage> {
  const response = await apiClient.axios.post<CaretakerMessage>(`/caretaker/conversations/${conversationId}/messages`, {
    content,
    type,
  });
  return response.data;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  await apiClient.axios.post(`/caretaker/conversations/${conversationId}/read`);
}

export async function uploadMessageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.axios.post<{ url: string }>('/caretaker/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
}

/**
 * ================================================================================
 * README: Caretaker API Module (caretaker.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Comprehensive API for caretaker operations including tenant management,
 * roommate handling, check-in/out processes, maintenance, and security.
 *
 * BACKEND ENDPOINTS:
 * ------------------
 * ## Dashboard
 * | GET | /caretaker/dashboard | getCaretakerDashboard() |
 *
 * ## Tenant Management
 * | GET    | /caretaker/tenants      | getTenants()    |
 * | GET    | /caretaker/tenants/{id} | getTenant()     |
 * | PATCH  | /caretaker/tenants/{id} | updateTenant()  |
 *
 * ## Roommate Management
 * | GET  | /caretaker/roommates/groups         | getRoommateGroups()       |
 * | POST | /caretaker/roommates/match-requests | approveRoommateMatch()    |
 * | POST | /caretaker/roommates/assign         | assignRoommates()         |
 *
 * ## Check-In/Out
 * | POST | /caretaker/check-in/verify | verifyBookingCode()     |
 * | POST | /caretaker/check-in        | processCheckIn()        |
 * | POST | /caretaker/check-out       | processCheckOut()       |
 * | POST | /caretaker/check-in/photos | uploadCheckInPhotos()   |
 *
 * ## Room Management
 * | GET    | /caretaker/rooms        | getRooms()               |
 * | POST   | /caretaker/rooms/assign | assignRoom()             |
 * | POST   | /caretaker/rooms/{id}/maintenance | markRoomMaintenance() |
 *
 * ## Maintenance
 * | GET  | /caretaker/maintenance      | getMaintenanceRequests()   |
 * | POST | /caretaker/maintenance      | createMaintenanceRequest() |
 * | POST | /caretaker/maintenance/{id}/update | updateMaintenanceStatus() |
 *
 * ## Security
 * | GET  | /caretaker/security/visitors     | getVisitorLogs()        |
 * | POST | /caretaker/security/visitors     | createVisitorLog()      |
 * | GET  | /caretaker/security/night-checks | getNightCheckReports()  |
 * | GET  | /caretaker/security/late-entries | getLateEntryLogs()      |
 *
 * ## Messaging
 * | GET  | /caretaker/conversations | getCaretakerConversations() |
 * | POST | /caretaker/conversations/{id}/messages | sendCaretakerMessage() |
 *
 * USAGE:
 * ------
 * ```typescript
 * import { getCaretakerDashboard, processCheckIn, getTenants } from './caretaker';
 *
 * const dashboard = await getCaretakerDashboard();
 * const tenants = await getTenants({ status: 'active' });
 * await processCheckIn({ bookingId: '123', roomId: '456' });
 * ```
 *
 * ================================================================================
 */
