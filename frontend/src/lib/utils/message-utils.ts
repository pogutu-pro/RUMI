import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import type { UserRole } from '@/types/auth.types';

/**
 * Format timestamp for message display
 * Examples: "2m ago", "12:30 PM", "Yesterday", "Dec 3"
 */
export function formatTimestamp(dateString: string, short: boolean = false): string {
  const date = new Date(dateString);
  const now = new Date();

  // Less than 1 hour ago: "2m ago", "45m ago"
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  if (date > hourAgo) {
    return formatDistanceToNow(date, { addSuffix: true })
      .replace('about ', '')
      .replace('less than a minute', 'just now')
      .replace(' minutes', 'm')
      .replace(' minute', 'm')
      .replace(' hours', 'h')
      .replace(' hour', 'h');
  }

  // Today: "12:30 PM"
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }

  // Yesterday: "Yesterday" or "Yesterday 12:30 PM"
  if (isYesterday(date)) {
    return short ? 'Yesterday' : `Yesterday ${format(date, 'h:mm a')}`;
  }

  // This week: "Monday" or "Monday 12:30 PM"
  if (isThisWeek(date)) {
    return short ? format(date, 'EEEE') : format(date, 'EEEE h:mm a');
  }

  // Older: "Dec 3" or "Dec 3, 2024"
  const isThisYear = date.getFullYear() === now.getFullYear();
  return short
    ? format(date, isThisYear ? 'MMM d' : 'MMM d, yyyy')
    : format(date, isThisYear ? 'MMM d, h:mm a' : 'MMM d, yyyy h:mm a');
}

/**
 * Format message preview text (truncate with ellipsis)
 */
export function formatMessagePreview(content: string, maxLength: number = 60): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
}

/**
 * Get role-specific color
 */
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'landlord':
      return 'text-emerald-600'; // Green
    case 'caretaker':
      return 'text-blue-600'; // Blue
    case 'student':
      return 'text-purple-600'; // Purple
    case 'tech_support_admin':
      return 'text-orange-600'; // Orange
    case 'super_admin':
      return 'text-red-600'; // Red
    default:
      return 'text-gray-600';
  }
}

/**
 * Get role-specific background color
 */
export function getRoleBgColor(role: UserRole): string {
  switch (role) {
    case 'landlord':
      return 'bg-emerald-100';
    case 'caretaker':
      return 'bg-blue-100';
    case 'student':
      return 'bg-purple-100';
    case 'tech_support_admin':
      return 'bg-orange-100';
    case 'super_admin':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'landlord':
      return 'Landlord';
    case 'caretaker':
      return 'Caretaker';
    case 'student':
      return 'Student';
    case 'tech_support_admin':
      return 'Tech Support';
    case 'super_admin':
      return 'Admin';
    default:
      return role;
  }
}

/**
 * Get user initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: any[]): Record<string, any[]> {
  return messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    let key: string;

    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else {
      key = format(date, 'MMMM d, yyyy');
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);

    return groups;
  }, {} as Record<string, any[]>);
}
