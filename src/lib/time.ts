const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ordinal = (day: number): string => {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
};

const clockTime = (d: Date, withSeconds: boolean): string => {
  const hours24 = d.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}${withSeconds ? `:${seconds}` : ''} ${suffix}`;
};

/** "23rd June, 2023. 10:00 PM" -- the row format used in the designs. */
export const formatTransactionDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}. ${clockTime(d, false)}`;
};

/** "1st November, 2024 1:20:22 PM" -- the receipt header format. */
export const formatReceiptDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]}, ${d.getFullYear()} ${clockTime(d, true)}`;
};

/**
 * Drives the "Last Updated" line. Fed from the query's last *successful* fetch, so a
 * failed refresh leaves the displayed age frozen rather than resetting it.
 */
export const formatRelativeTime = (timestamp: number, now: number = Date.now()): string => {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const greetingForHour = (hour: number): string => {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
