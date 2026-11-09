import React, { useState } from 'react';
import { TransactionItem, TransactionType } from '../../types';
import { formatRupiah } from '../../utils/financialCalculations';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpDown,
  PlusCircle,
} from 'lucide-react';
import {
  ChartTimeframe,
  generateBucketsForTimeframe,
  normalizeDateToISO,
  isDateInBucket,
  formatCompactMetric,
} from './chartUtils';
import { TimeframeSelector } from './TimeframeSelector';

interface CashFlowTrendChartProps {
  transactions: TransactionItem[];
  onOpenAddTx?: (type?: TransactionType) => void;
  style?: React.CSSProperties;
}

export const CashFlowTrendChart: React.FC<CashFlowTrendChartProps> = ({
  transactions,
  onOpenAddTx,
  style,
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7D');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate buckets for selected timeframe
  const allTxDates = transactions.map((t) => t.date);
  const buckets = generateBucketsForTimeframe(timeframe, allTxDates);

  // Populate inflow, outflow, and net per bucket
  const bucketData = buckets.map((bucket) => {
    let inflow = 0;
    let outflow = 0;
    let count = 0;

    transactions.forEach((tx) => {
      const iso = normalizeDateToISO(tx.date);
      if (isDateInBucket(iso, bucket.key)) {
        count++;
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
          inflow += amt;
        } else {
          outflow += amt;
        }
      }
    });

    return {
      ...bucket,
      inflow,
      outflow,
      net: inflow - outflow,
      count,
    };
  });

  // Calculate totals for active period
  const totalInflow = bucketData.reduce((sum, b) => sum + b.inflow, 0);
  const totalOutflow = bucketData.reduce((sum, b) => sum + b.outflow, 0);
  const totalNet = totalInflow - totalOutflow;
  const isSurplus = totalNet >= 0;

  // Max value for scaling
  const maxSpend = Math.max(
    ...bucketData.map((b) => Math.max(b.inflow, b.outflow)),
    50000 // minimum 50k scale
  );

  // SVG coordinate parameters
  const chartWidth = 560;
  const chartHeight = 150;
  const paddingLeft = 14;
  const paddingRight = 54;
  const paddingTop = 22;
  const paddingBottom = 28;
  const availableWidth = chartWidth - paddingLeft - paddingRight;
  const availableHeight = chartHeight - paddingTop - paddingBottom;
  const bucketCount = bucketData.length;
  const colWidth = availableWidth / bucketCount;

  // Dynamic bar width based on count
  const maxBarWidth = bucketCount <= 7 ? 16 : bucketCount <= 14 ? 12 : bucketCount <= 31 ? 6 : 4;
  const barGap = bucketCount <= 7 ? 4 : 2;
  const barWidth = Math.max(2.5, Math.min(Math.floor((colWidth - barGap - 2) / 2), maxBarWidth));

  const activeBucket = hoveredIndex !== null ? bucketData[hoveredIndex] : null;

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
        ...style,
      }}
    >
      {/* Top Header: Title, Description, and Timeframe Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <BarChart3 size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Cash Flow Dynamics
              </h3>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: isSurplus ? 'rgba(5, 150, 105, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  color: isSurplus ? 'var(--emerald)' : 'var(--rose)',
                }}
              >
                {isSurplus ? 'Net Surplus' : 'Net Deficit'}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Daily inflow vs outflow comparison across {timeframe}
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <TimeframeSelector value={timeframe} onChange={setTimeframe} size="sm" />
      </div>

      {/* KPI Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          background: 'var(--bg-chip)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
            {activeBucket ? `${activeBucket.label} Inflow` : 'Period Inflow'}
          </span>
          <div
            className="tabular-nums"
            style={{ fontSize: '14px', fontWeight: 800, color: 'var(--emerald)', marginTop: '1px' }}
          >
            +{formatRupiah(activeBucket ? activeBucket.inflow : totalInflow)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
            {activeBucket ? `${activeBucket.label} Outflow` : 'Period Outflow'}
          </span>
          <div
            className="tabular-nums"
            style={{ fontSize: '14px', fontWeight: 800, color: 'var(--rose)', marginTop: '1px' }}
          >
            -{formatRupiah(activeBucket ? activeBucket.outflow : totalOutflow)}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
            {activeBucket ? `${activeBucket.label} Net` : 'Period Net'}
          </span>
          <div
            className="tabular-nums"
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: (activeBucket ? activeBucket.net : totalNet) >= 0 ? 'var(--emerald)' : 'var(--rose)',
              marginTop: '1px',
            }}
          >
            {(activeBucket ? activeBucket.net : totalNet) >= 0 ? '+' : ''}
            {formatRupiah(activeBucket ? activeBucket.net : totalNet)}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', fontSize: '10.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Inflow (Income)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F43F5E', display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Outflow (Expense)</span>
          </div>
        </div>
      </div>

      {/* SVG Dual-Bar Chart */}
      <div style={{ width: '100%', position: 'relative', marginTop: '2px' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
        >
          <defs>
            <linearGradient id="cfInflowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="cfOutflowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
            <linearGradient id="cfInflowHover" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="cfOutflowHover" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
          </defs>

          {/* Grid lines with right-aligned metric values */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={chartWidth - paddingRight}
            y2={paddingTop}
            stroke="#F0F4F1"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={chartWidth - 4}
            y={paddingTop + 3.5}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="8.5"
            fontWeight="600"
          >
            {formatCompactMetric(maxSpend)}
          </text>

          <line
            x1={paddingLeft}
            y1={paddingTop + availableHeight / 2}
            x2={chartWidth - paddingRight}
            y2={paddingTop + availableHeight / 2}
            stroke="#F0F4F1"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={chartWidth - 4}
            y={paddingTop + availableHeight / 2 + 3.5}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="8.5"
            fontWeight="600"
          >
            {formatCompactMetric(maxSpend / 2)}
          </text>

          <line
            x1={paddingLeft}
            y1={paddingTop + availableHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + availableHeight}
            stroke="#E2ECE5"
            strokeWidth="1.2"
          />
          <text
            x={chartWidth - 4}
            y={paddingTop + availableHeight + 3.5}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="8.5"
            fontWeight="600"
          >
            0
          </text>

          {/* Render Bars per Bucket */}
          {bucketData.map((b, idx) => {
            const colX = paddingLeft + idx * colWidth;
            const isHovered = hoveredIndex === idx;

            // Compute heights
            const inflowHeight = b.inflow > 0
              ? Math.max(5, (b.inflow / maxSpend) * availableHeight)
              : 2;
            const outflowHeight = b.outflow > 0
              ? Math.max(5, (b.outflow / maxSpend) * availableHeight)
              : 2;

            const inflowY = paddingTop + availableHeight - inflowHeight;
            const outflowY = paddingTop + availableHeight - outflowHeight;

            // Dual bar positioning inside the column
            const totalGroupWidth = barWidth * 2 + barGap;
            const startX = colX + (colWidth - totalGroupWidth) / 2;
            const inflowX = startX;
            const outflowX = startX + barWidth + barGap;

            return (
              <g
                key={b.key}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hover trigger column rect */}
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
                    y={paddingTop - 6}
                    width={colWidth - 2}
                    height={availableHeight + 12}
                    rx="6"
                    fill="rgba(72, 176, 125, 0.08)"
                  />
                )}

                {/* Inflow Bar (Green) */}
                <rect
                  x={inflowX}
                  y={inflowY}
                  width={barWidth}
                  height={inflowHeight}
                  rx={b.inflow > 0 ? 3 : 1}
                  fill={b.inflow === 0 ? '#E2ECE5' : isHovered ? 'url(#cfInflowHover)' : 'url(#cfInflowGrad)'}
                  style={{
                    transition: 'all 0.2s ease',
                    filter: isHovered && b.inflow > 0 ? 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))' : 'none',
                  }}
                />

                {/* Outflow Bar (Rose) */}
                <rect
                  x={outflowX}
                  y={outflowY}
                  width={barWidth}
                  height={outflowHeight}
                  rx={b.outflow > 0 ? 3 : 1}
                  fill={b.outflow === 0 ? '#E2ECE5' : isHovered ? 'url(#cfOutflowHover)' : 'url(#cfOutflowGrad)'}
                  style={{
                    transition: 'all 0.2s ease',
                    filter: isHovered && b.outflow > 0 ? 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.4))' : 'none',
                  }}
                />

                {/* X Axis Label */}
                {b.showLabelOnAxis && (
                  <text
                    x={colX + colWidth / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fill={isHovered ? 'var(--primary)' : 'var(--text-muted)'}
                    fontSize="9.5"
                    fontWeight={isHovered ? '800' : '500'}
                  >
                    {b.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating or Footer Active Details */}
      {activeBucket && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(72, 176, 125, 0.06)',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            border: '1px solid rgba(72, 176, 125, 0.2)',
          }}
        >
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {activeBucket.fullLabel} ({activeBucket.count} transactions):
          </span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
              +{formatRupiah(activeBucket.inflow)}
            </span>
            <span style={{ color: 'var(--rose)', fontWeight: 700 }}>
              -{formatRupiah(activeBucket.outflow)}
            </span>
            <span
              style={{
                fontWeight: 800,
                color: activeBucket.net >= 0 ? 'var(--emerald)' : 'var(--rose)',
              }}
            >
              Net: {activeBucket.net >= 0 ? `+${formatRupiah(activeBucket.net)}` : `-${formatRupiah(Math.abs(activeBucket.net))}`}
            </span>
          </div>
        </div>
      )}

      {totalInflow === 0 && totalOutflow === 0 && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            padding: '8px',
          }}
        >
          No cash flow records found in this timeframe ({timeframe}).
        </div>
      )}
    </div>
  );
};

