import type { RoomStatus, TenantInfo, MaintenanceRequest } from '@/types/caretaker.types';

/**
 * Format room number for display
 */
export function formatRoomNumber(roomNumber: string): string {
  // Format as "Room 101" or just return the number if already formatted
  if (roomNumber.toLowerCase().startsWith('room')) {
    return roomNumber;
  }
  return `Room ${roomNumber}`;
}

/**
 * Calculate occupancy percentage for a room
 */
export function calculateOccupancyRate(room: RoomStatus): number {
  if (room.capacity === 0) return 0;
  return Math.round((room.currentOccupancy / room.capacity) * 100);
}

/**
 * Calculate total occupancy percentage for all rooms
 */
export function calculateTotalOccupancy(rooms: RoomStatus[]): number {
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalOccupied = rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);
  
  if (totalCapacity === 0) return 0;
  return Math.round((totalOccupied / totalCapacity) * 100);
}

/**
 * Generate check-in summary text
 */
export function generateCheckInSummary(tenantName: string, roomNumber: string, date: string): string {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return `${tenantName} checked into ${formatRoomNumber(roomNumber)} on ${formattedDate}`;
}

/**
 * Generate check-out summary text
 */
export function generateCheckOutSummary(
  tenantName: string,
  roomNumber: string,
  date: string,
  reason: string
): string {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedReason = reason.replace(/_/g, ' ').toLowerCase();
  return `${tenantName} checked out of ${formatRoomNumber(roomNumber)} on ${formattedDate} (Reason: ${formattedReason})`;
}

/**
 * Get room status badge color
 */
export function getRoomStatusColor(status: RoomStatus['status']): string {
  const colorMap: Record<RoomStatus['status'], string> = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    occupied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    full: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    reserved: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };
  return colorMap[status] || colorMap.available;
}

/**
 * Get payment status badge color
 */
export function getPaymentStatusColor(status: 'paid' | 'pending' | 'overdue'): string {
  const colorMap = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return colorMap[status];
}

/**
 * Get maintenance priority color
 */
export function getMaintenancePriorityColor(priority: MaintenanceRequest['priority']): string {
  const colorMap = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return colorMap[priority];
}

/**
 * Get maintenance status color
 */
export function getMaintenanceStatusColor(status: MaintenanceRequest['status']): string {
  const colorMap = {
    received: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };
  return colorMap[status];
}

/**
 * Filter tenants based on search query
 */
export function filterTenants(tenants: TenantInfo[], searchQuery: string): TenantInfo[] {
  if (!searchQuery) return tenants;
  
  const query = searchQuery.toLowerCase();
  return tenants.filter(
    (tenant) =>
      tenant.firstName.toLowerCase().includes(query) ||
      tenant.lastName.toLowerCase().includes(query) ||
      tenant.email.toLowerCase().includes(query) ||
      tenant.roomNumber.toLowerCase().includes(query) ||
      tenant.guardianName.toLowerCase().includes(query) ||
      tenant.studentId.toLowerCase().includes(query)
  );
}

/**
 * Filter rooms based on status
 */
export function filterRoomsByStatus(
  rooms: RoomStatus[],
  status: RoomStatus['status'] | 'all'
): RoomStatus[] {
  if (status === 'all') return rooms;
  return rooms.filter((room) => room.status === status);
}

/**
 * Sort tenants by various criteria
 */
export function sortTenants(
  tenants: TenantInfo[],
  sortBy: 'name' | 'room' | 'checkIn' | 'payment'
): TenantInfo[] {
  const sorted = [...tenants];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.lastName.localeCompare(b.lastName));
    case 'room':
      return sorted.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
    case 'checkIn':
      return sorted.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
    case 'payment':
      const paymentOrder = { overdue: 0, pending: 1, paid: 2 };
      return sorted.sort((a, b) => paymentOrder[a.paymentStatus] - paymentOrder[b.paymentStatus]);
    default:
      return sorted;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days until/since date
 */
export function calculateDaysUntil(date: string): number {
  const today = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Simple formatting for Kenyan numbers
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  return phone;
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Group items by date
 */
export function groupByDate<T extends { createdAt: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const date = new Date(item.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
