/**
 * Format a date string for display.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date with time.
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Relative time (e.g., "2 hours ago").
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
}

/**
 * Get status display config.
 */
export function getStatusConfig(status) {
  const configs = {
    pending: { label: 'Pending', color: 'pending', icon: '⏳' },
    under_review: { label: 'Under Review', color: 'under_review', icon: '🔍' },
    approved: { label: 'Approved', color: 'approved', icon: '✅' },
    released: { label: 'Released', color: 'released', icon: '📦' },
    rejected: { label: 'Rejected', color: 'rejected', icon: '❌' },
  };
  return configs[status] || { label: status, color: 'pending', icon: '❓' };
}

/**
 * Get priority display config.
 */
export function getPriorityConfig(level) {
  const configs = {
    1: { label: 'HIGH', color: 'priority-1' },
    2: { label: 'MEDIUM', color: 'priority-2' },
    3: { label: 'NORMAL', color: 'priority-3' },
  };
  return configs[level] || configs[3];
}

/**
 * Get month name from number.
 */
export function getMonthName(monthNum) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthNum - 1] || '';
}

/**
 * Get user initials for avatar.
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Mask an email address (e.g., j***e@example.com).
 */
export function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  if (local.length <= 2) {
    return local.charAt(0) + '***@' + domain;
  }
  
  return local.charAt(0) + '***' + local.charAt(local.length - 1) + '@' + domain;
}
