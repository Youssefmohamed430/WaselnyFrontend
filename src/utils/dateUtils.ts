/**
 * Utility functions for date and time handling
 * Specifically for Egypt timezone (UTC+2)
 */

/**
 * Convert UTC date to Egypt timezone (UTC+2)
 */
export function convertToEgyptTime(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const egyptOffset = 2 * 60; // Egypt is UTC+2 (in minutes)
  const localOffset = date.getTimezoneOffset();
  const egyptTime = new Date(date.getTime() + (egyptOffset + localOffset) * 60000);
  return egyptTime;
}

/**
 * Format date to Egypt timezone string
 */
export function formatEgyptTime(date: string | Date, includeTime = true): string {
  const egyptDate = convertToEgyptTime(date);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return egyptDate.toLocaleString('en-US', options);
}

/**
 * Check if a schedule is happening now (same date and hour)
 */
export function isScheduledNow(departureDateTime: string | Date): boolean {
  const now = new Date();
  const departure = convertToEgyptTime(departureDateTime);
  
  // Check if same date and same hour
  return (
    departure.getDate() === now.getDate() &&
    departure.getMonth() === now.getMonth() &&
    departure.getFullYear() === now.getFullYear() &&
    departure.getHours() === now.getHours()
  );
}

/**
 * Check if a schedule is in the past
 */
export function isPastSchedule(departureDateTime: string | Date): boolean {
  const now = new Date();
  const departure = convertToEgyptTime(departureDateTime);
  return departure < now;
}

/**
 * Check if a schedule is in the future
 */
export function isFutureSchedule(departureDateTime: string | Date): boolean {
  const now = new Date();
  const departure = convertToEgyptTime(departureDateTime);
  return departure > now;
}

/**
 * Get time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatEgyptTime(past, false);
}

/**
 * Get current Egypt time
 */
export function getCurrentEgyptTime(): Date {
  return convertToEgyptTime(new Date());
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: string | Date): string {
  const egyptDate = convertToEgyptTime(date);
  return egyptDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

