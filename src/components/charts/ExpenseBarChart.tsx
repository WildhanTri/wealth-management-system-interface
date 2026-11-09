import React, { useState } from 'react';
import { TransactionItem } from '../../types';
import { formatRupiah } from '../../utils/financialCalculations';
import { BarChart3 } from 'lucide-react';
import {
  ChartTimeframe,
  generateBucketsForTimeframe,
  normalizeDateToISO,
  isDateInBucket,
  formatCompactMetric,
} from './chartUtils';
import { TimeframeSelector } from './TimeframeSelector';

interface ExpenseBarChartProps {
  transactions: TransactionItem[];
}

export const ExpenseBarChart: React.FC<ExpenseBarChartProps> = ({ transactions }) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7D');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const allTxDates = transactions.map((t) => t.date);
  const buckets = generateBucketsForTimeframe(timeframe, allTxDates);

  // Populate totals from transactions (outflows only)
  const dayBuckets = buckets.map((bucket) => {
    let total = 0;
    let count = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'income') return;
      const iso = normalizeDateToISO(tx.date);
      if (isDateInBucket(iso, bucket.key)) {
        total += Number(tx.amount) || 0;
        count++;
      }
    });

    return {
      ...bucket,
      total,
      count,
    };
  });

  const totalSpentPeriod = dayBuckets.reduce((sum, b) => sum + b.total, 0);
  const bucketCount = dayBuckets.length;
  const avgPerBucket = bucketCount > 0 ? Math.round(totalSpentPeriod / bucketCount) : 0;
  const maxSpend = Math.max(...dayBuckets.map((b) => b.total), 50000); // minimum scale Rp 50.000

  // Chart dimensions in SVG viewBox coordinate space
  const chartWidth = 360;
  const chartHeight = 135;
  const topPadding = 18;
  const bottomPadding = 26;
  const paddingLeft = 10;
  const paddingRight = 50;
  const availableWidth = chartWidth - paddingLeft - paddingRight;
  const availableHeight = chartHeight - topPadding - bottomPadding;
  const colWidth = availableWidth / bucketCount;

  // Dynamic bar width
  const calculatedBarWidth = bucketCount <= 7 ? 22 : bucketCount <= 12 ? 14 : bucketCount <= 20 ? 8 : 5;
  const barWidth = Math.max(3, Math.min(colWidth - 2, calculatedBarWidth));

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
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
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Expense Outflow Trend
            </h3>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
            Daily expense activity over {timeframe}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} size="sm" />
          <div style={{ textAlign: 'right', marginTop: '2px' }}>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--rose)' }} className="tabular-nums">
              -{formatRupiah(activeBucket ? activeBucket.total : totalSpentPeriod)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {activeBucket ? activeBucket.fullLabel : `Average: ${formatRupiah(avgPerBucket)}/interval`}
            </div>
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

          {/* Horizontal grid lines with right-aligned metric values */}
          <line
            x1={paddingLeft}
            y1={topPadding}
            x2={chartWidth - paddingRight}
            y2={topPadding}
            stroke="#F0F4F1"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={chartWidth - 4}
            y={topPadding + 3.5}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="8.5"
            fontWeight="600"
          >
            {formatCompactMetric(maxSpend)}
          </text>

          <line
            x1={paddingLeft}
            y1={topPadding + availableHeight / 2}
            x2={chartWidth - paddingRight}
            y2={topPadding + availableHeight / 2}
            stroke="#F0F4F1"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={chartWidth - 4}
            y={topPadding + availableHeight / 2 + 3.5}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="8.5"
            fontWeight="600"
          >
            {formatCompactMetric(maxSpend / 2)}
          </text>

          <line
            x1={paddingLeft}
            y1={topPadding + availableHeight}
            x2={chartWidth - paddingRight}
            y2={topPadding + availableHeight}
            stroke="#E2ECE5"
            strokeWidth="1"
          />
          <text
            x={chartWidth - 4}
            y={topPadding + availableHeight + 3.5}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="8.5"
            fontWeight="600"
          >
            0
          </text>

          {/* Render Bars */}
          {dayBuckets.map((bucket, idx) => {
            const colX = paddingLeft + idx * colWidth;
            const x = colX + (colWidth - barWidth) / 2;
            const barHeight =
              bucket.total > 0
                ? Math.max(6, (bucket.total / maxSpend) * availableHeight)
                : 3;
            const y = topPadding + availableHeight - barHeight;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={bucket.key}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hover target area for easy touch/mouse */}
                <rect
                  x={colX}
                  y={0}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Column background hover highlight */}
                {isHovered && (
                  <rect
                    x={colX + 1}
                    y={topPadding - 4}
                    width={colWidth - 2}
                    height={availableHeight + 8}
                    rx="5"
                    fill="rgba(72, 176, 125, 0.08)"
                  />
                )}

                {/* The Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={bucket.total > 0 ? 4 : 1.5}
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

                {/* Value on top of bar if active */}
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

                {/* Label below */}
                {bucket.showLabelOnAxis && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fill={isHovered ? 'var(--primary)' : 'var(--text-muted)'}
                    fontSize="9"
                    fontWeight={isHovered ? '800' : '500'}
                  >
                    {bucket.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {totalSpentPeriod === 0 && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-muted)',
            padding: '4px',
          }}
        >
          No expenses recorded in {timeframe}.
        </div>
      )}
    </div>
  );
};
