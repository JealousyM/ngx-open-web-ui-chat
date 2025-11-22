import { Translation } from '../i18n/translations';

/**
 * Formats a timestamp as a relative time string (e.g., "2 hours ago")
 * with locale support using translation strings
 */
export function formatRelativeTime(timestamp: number, translations: Translation): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Calculate time differences
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);
  const diffMonths = Math.floor(diffMs / 2592000000); // Approximate: 30 days
  const diffYears = Math.floor(diffMs / 31536000000); // Approximate: 365 days

  // Just now (less than 1 minute)
  if (diffSeconds < 60) {
    return translations.justNow || 'Just now';
  }
  
  // Minutes ago
  if (diffMinutes < 60) {
    if (diffMinutes === 1) {
      return translations.minuteAgo || '1 minute ago';
    }
    return (translations.minutesAgo || '{count} minutes ago').replace('{count}', diffMinutes.toString());
  }
  
  // Hours ago
  if (diffHours < 24) {
    if (diffHours === 1) {
      return translations.hourAgo || '1 hour ago';
    }
    return (translations.hoursAgo || '{count} hours ago').replace('{count}', diffHours.toString());
  }
  
  // Days ago
  if (diffDays < 7) {
    if (diffDays === 1) {
      return translations.dayAgo || '1 day ago';
    }
    return (translations.daysAgo || '{count} days ago').replace('{count}', diffDays.toString());
  }
  
  // Weeks ago
  if (diffWeeks < 4) {
    if (diffWeeks === 1) {
      return translations.weekAgo || '1 week ago';
    }
    return (translations.weeksAgo || '{count} weeks ago').replace('{count}', diffWeeks.toString());
  }
  
  // Months ago
  if (diffMonths < 12) {
    if (diffMonths === 1) {
      return translations.monthAgo || '1 month ago';
    }
    return (translations.monthsAgo || '{count} months ago').replace('{count}', diffMonths.toString());
  }
  
  // Years ago
  if (diffYears === 1) {
    return translations.yearAgo || '1 year ago';
  }
  return (translations.yearsAgo || '{count} years ago').replace('{count}', diffYears.toString());
}

/**
 * Formats a timestamp as a localized date string
 * Falls back to browser's locale if not specified
 */
export function formatLocalizedDate(timestamp: number, locale?: string): string {
  const date = new Date(timestamp * 1000);
  
  try {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return date.toLocaleDateString();
  }
}

/**
 * Formats a timestamp as a localized date and time string
 * Falls back to browser's locale if not specified
 */
export function formatLocalizedDateTime(timestamp: number, locale?: string): string {
  const date = new Date(timestamp * 1000);
  
  try {
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return date.toLocaleString();
  }
}
