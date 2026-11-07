import React, { useState } from 'react';
import { TransactionItem } from '../../types';
import { formatRupiah } from '../../utils/financialCalculations';
import { BarChart3, TrendingDown, ArrowUpRight } from 'lucide-react';

interface ExpenseBarChartProps {
  transactions: TransactionItem[];
}

export const ExpenseBarChart: React.FC<ExpenseBarChartProps> = ({ transactions }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate the last 7 days (including today)
  const daysCount = 7;
  const now = new Date();
  const dayBuckets: { dateStr: string; label: string; dayName: string; total: number }[] = [];

  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isYesterday = i === 1;

    let dayLabel = `${monthNamesEn[d.getMonth()]} ${d.getDate()}`;
    if (isToday) dayLabel = 'Today';
    else if (isYesterday) dayLabel = 'Yesterday';

    dayBuckets.push({
      dateStr,
      label: dayLabel,
      dayName: dayNamesEn[d.getDay()],
      total: 0,
    });
  }

  // Populate totals from transactions (outflows only)
  transactions.forEach((tx) => {
    if (tx.type === 'income') return;
    const bucket = dayBuckets.find((b) => b.dateStr === tx.date);
    if (bucket) {
      bucket.total += tx.amount;
    }
  });

  const totalSpent7Days = dayBuckets.reduce((sum, b) => sum + b.total, 0);
  const avgDaily = Math.round(totalSpent7Days / daysCount);
  const maxSpend = Math.max(...dayBuckets.map((b) => b.total), 50000); // minimum scale Rp 50.000

  // Chart dimensions in SVG viewBox coordinate space
  const chartWidth = 320;
  const chartHeight = 130;
  const topPadding = 18;
  const bottomPadding = 26;
  const availableHeight = chartHeight - topPadding - bottomPadding;
  const colWidth = chartWidth / daysCount;
  const barWidth = 24;

  const activeBucket = hoveredIndex !== null ? dayBuckets[hoveredIndex] : null;

  return (
    <div
      className="glass"
      style={{
        padding: '18px 20px',
        borderRadius: 'var(--radius-lg)',
        background: '#FFFFFF',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <BarChart3 size={15} />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Expense Outflow Trend
            </h3>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Activity over the past 7 days
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-nums">
            {activeBucket ? formatRupiah(activeBucket.total) : formatRupiah(totalSpent7Days)}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {activeBucket ? activeBucket.label : `Daily Average: ${formatRupiah(avgDaily)}/day`}
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div style={{ width: '100%', position: 'relative', marginTop: '4px' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
        >
          <defs>
            <linearGradient id="expenseBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#48B07D" />
              <stop offset="100%" stopColor="#378C62" />
            </linearGradient>
            <linearGradient id="expenseBarHover" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2BB875" />
              <stop offset="100%" stopColor="#1E7A4A" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal grid lines */}
          <line
            x1="0"
            y1={topPadding}
            x2={chartWidth}
            y2={topPadding}
            stroke="#F0F4F1"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={topPadding + availableHeight / 2}
            x2={chartWidth}
            y2={topPadding + availableHeight / 2}
            stroke="#F0F4F1"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={topPadding + availableHeight}
            x2={chartWidth}
            y2={topPadding + availableHeight}
            stroke="#E2ECE5"
            strokeWidth="1"
          />

          {/* Render Bars */}
          {dayBuckets.map((bucket, idx) => {
            const x = idx * colWidth + (colWidth - barWidth) / 2;
            const barHeight =
              bucket.total > 0
                ? Math.max(6, (bucket.total / maxSpend) * availableHeight)
                : 3;
            const y = topPadding + availableHeight - barHeight;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={bucket.dateStr}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hover target area for easy touch/mouse */}
                <rect
                  x={idx * colWidth}
                  y={0}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Column background hover highlight */}
                {isHovered && (
                  <rect
                    x={idx * colWidth + 2}
                    y={topPadding - 4}
                    width={colWidth - 4}
                    height={availableHeight + 8}
                    rx="6"
                    fill="rgba(72, 176, 125, 0.08)"
                  />
                )}

                {/* The Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={bucket.total > 0 ? 5 : 2}
                  fill={
                    bucket.total === 0
                      ? '#E2ECE5'
                      : isHovered
                      ? 'url(#expenseBarHover)'
                      : 'url(#expenseBarGradient)'
                  }
                  style={{
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    filter: isHovered && bucket.total > 0 ? 'drop-shadow(0 2px 6px rgba(72, 176, 125, 0.4))' : 'none',
                  }}
                />

                {/* Value on top of bar if active or prominent */}
                {isHovered && bucket.total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={Math.max(12, y - 5)}
                    textAnchor="middle"
                    fill="var(--primary)"
                    fontSize="9"
                    fontWeight="800"
                  >
                    {bucket.total >= 1000000
                      ? `${(bucket.total / 1000000).toFixed(1)}M`
                      : bucket.total >= 1000
                      ? `${Math.round(bucket.total / 1000)}k`
                      : bucket.total}
                  </text>
                )}

                {/* Day name label below */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--primary)' : 'var(--text-muted)'}
                  fontSize="9.5"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {bucket.dayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {totalSpent7Days === 0 && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            padding: '4px',
          }}
        >
          No expenses recorded in the past 7 days.
        </div>
      )}
    </div>
  );
};
