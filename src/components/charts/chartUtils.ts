export type ChartTimeframe = '7D' | '1M' | 'YTD' | '1Y' | '5Y' | 'ALL';

export const TIMEFRAME_OPTIONS: { label: string; value: ChartTimeframe; title: string }[] = [
  { label: '7D', value: '7D', title: 'Last 7 Days' },
  { label: '1M', value: '1M', title: 'Last 1 Month' },
  { label: 'YTD', value: 'YTD', title: 'Year to Date' },
  { label: '1Y', value: '1Y', title: 'Last 1 Year' },
  { label: '5Y', value: '5Y', title: 'Last 5 Years' },
  { label: 'ALL', value: 'ALL', title: 'All Time' },
];

export interface DateBucket {
  key: string; // "YYYY-MM-DD" or "YYYY-MM" or "YYYY"
  label: string; // Label displayed on x-axis
  fullLabel: string; // Tooltip / full date label
  showLabelOnAxis?: boolean; // Whether to print text on x-axis (avoids collision)
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Formats numeric currency values into compact readable metric labels (e.g. "Rp 82k", "Rp 461.8M", "0")
 */
export function formatCompactMetric(val: number): string {
  if (val === 0 || !val) return '0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000_000) {
    const formatted = (abs / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}Rp ${formatted}T`;
  }
  if (abs >= 1_000_000_000) {
    const formatted = (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}Rp ${formatted}B`;
  }
  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}Rp ${formatted}M`;
  }
  if (abs >= 1_000) {
    const formatted = (abs / 1_000).toFixed(0);
    return `${sign}Rp ${formatted}k`;
  }
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

/**
 * Normalizes any transaction date string to YYYY-MM-DD
 */
export function normalizeDateToISO(val?: string): string {
  if (!val) return new Date().toISOString().split('T')[0];
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  const today = new Date();
  if (lower === 'today') {
    return today.toISOString().split('T')[0];
  }
  if (lower === 'yesterday') {
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    return yest.toISOString().split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed;
}

/**
 * Generates daily date buckets for the selected timeframe.
 * Every bucket represents a specific day (YYYY-MM-DD), ensuring daily resolution
 * even for 5Y, 1Y, YTD, and ALL timeframes.
 */
export function generateBucketsForTimeframe(timeframe: ChartTimeframe, allDates: string[] = []): DateBucket[] {
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];

  const createDayBucket = (d: Date, showLabel = true): DateBucket => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;

    const isToday = key === todayISO;
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yestISO = yest.toISOString().split('T')[0];
    const isYesterday = key === yestISO;

    const isCurrentYear = d.getFullYear() === now.getFullYear();
    const label = isCurrentYear
      ? `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()}`
      : `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]} '${String(yyyy).slice(2)}`;

    const fullLabel = isToday
      ? `Today - ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`
      : isYesterday
      ? `Yesterday - ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    return {
      key,
      label,
      fullLabel,
      showLabelOnAxis: showLabel,
    };
  };

  // Determine timeframe cutoff date
  let cutoffDate = new Date(now);
  if (timeframe === '7D') {
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  } else if (timeframe === '1M') {
    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  } else if (timeframe === 'YTD') {
    cutoffDate = new Date(now.getFullYear(), 0, 1);
  } else if (timeframe === '1Y') {
    cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else if (timeframe === '5Y') {
    cutoffDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  } else if (timeframe === 'ALL') {
    cutoffDate = new Date(1970, 0, 1);
  }

  const cutoffISO = cutoffDate.toISOString().split('T')[0];

  // 1. For '7D': strictly the last 7 calendar days
  if (timeframe === '7D') {
    const buckets: DateBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const b = createDayBucket(d, true);
      b.label = DAY_NAMES_SHORT[d.getDay()];
      buckets.push(b);
    }
    return buckets;
  }

  // 2. For '1M': strictly the last 30 calendar days
  if (timeframe === '1M') {
    const buckets: DateBucket[] = [];
    const daysCount = 30;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const showLabel = i % 5 === 0 || i === daysCount - 1;
      buckets.push(createDayBucket(d, showLabel));
    }
    return buckets;
  }

  // 3. For 'YTD', '1Y', '5Y', 'ALL':
  // Always per-day granularity!
  // Filter all known transaction dates within the cutoff window
  const validDates = allDates
    .map(normalizeDateToISO)
    .filter((dt) => dt && dt >= cutoffISO && dt <= todayISO);

  const uniqueDateSet = new Set<string>(validDates);

  // Ensure recent continuous days (last 7 days) are included so user sees recent daily momentum
  const recentDaysToEnsure = 7;
  for (let i = recentDaysToEnsure - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    if (iso >= cutoffISO) {
      uniqueDateSet.add(iso);
    }
  }

  const sortedDates = Array.from(uniqueDateSet).sort();

  // If the total span of dates is small (e.g. <= 31 days between first and last date):
  // Fill all continuous days in between so there are no gaps
  if (sortedDates.length > 0) {
    const firstDateParts = sortedDates[0].split('-').map(Number);
    const lastDateParts = sortedDates[sortedDates.length - 1].split('-').map(Number);
    const firstD = new Date(firstDateParts[0], firstDateParts[1] - 1, firstDateParts[2]);
    const lastD = new Date(lastDateParts[0], lastDateParts[1] - 1, lastDateParts[2]);
    const daySpan = Math.round((lastD.getTime() - firstD.getTime()) / 86400000) + 1;

    if (daySpan <= 31) {
      const buckets: DateBucket[] = [];
      for (let i = 0; i < daySpan; i++) {
        const d = new Date(firstD.getFullYear(), firstD.getMonth(), firstD.getDate() + i);
        const showLabel = daySpan <= 10 || i % Math.ceil(daySpan / 7) === 0 || i === daySpan - 1;
        buckets.push(createDayBucket(d, showLabel));
      }
      return buckets;
    }
  }

  // If dates are scattered across months/years:
  const totalCount = sortedDates.length;
  const labelInterval = Math.max(1, Math.ceil(totalCount / 10));

  return sortedDates.map((dateStr, idx) => {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const showLabel = idx % labelInterval === 0 || idx === totalCount - 1;
    return createDayBucket(d, showLabel);
  });
}

/**
 * Checks if a transaction date belongs to a bucket.
 */
export function isDateInBucket(txDateISO: string, bucketKey: string): boolean {
  return txDateISO.startsWith(bucketKey);
}

