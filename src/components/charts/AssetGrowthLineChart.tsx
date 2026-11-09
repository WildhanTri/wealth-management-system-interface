import React, { useState } from 'react';
import { AssetSnapshot } from '../../types';
import { formatRupiah } from '../../utils/financialCalculations';
import { TrendingUp, TrendingDown, PlusCircle, Calendar } from 'lucide-react';
import { ChartTimeframe, formatCompactMetric } from './chartUtils';
import { TimeframeSelector } from './TimeframeSelector';

interface AssetGrowthLineChartProps {
  snapshots: AssetSnapshot[];
  onOpenSnapshotModal?: () => void;
  getValue?: (snapshot: AssetSnapshot) => number;
  filterLabel?: string;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

export const AssetGrowthLineChart: React.FC<AssetGrowthLineChartProps> = ({
  snapshots,
  onOpenSnapshotModal,
  getValue,
  filterLabel,
  title = 'Asset Growth Trajectory',
  subtitle,
  style,
}) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('ALL');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort snapshots chronologically
  const sortedSnapshots = [...snapshots].sort((a, b) => {
    const d = a.snapshotDate.localeCompare(b.snapshotDate);
    if (d !== 0) return d;
    return a.createdAt - b.createdAt;
  });

  // Filter snapshots based on selected timeframe
  const now = new Date();
  const getFilteredSnapshots = () => {
    if (sortedSnapshots.length === 0 || timeframe === 'ALL') return sortedSnapshots;

    let cutoffDate = new Date();
    if (timeframe === '7D') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (timeframe === '1M') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    } else if (timeframe === 'YTD') {
      cutoffDate = new Date(now.getFullYear(), 0, 1);
    } else if (timeframe === '1Y') {
      cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else if (timeframe === '5Y') {
      cutoffDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    }

    const cutoffISO = cutoffDate.toISOString().split('T')[0];
    const inRange = sortedSnapshots.filter((s) => s.snapshotDate >= cutoffISO);

    // If fewer than 2 snapshots exist in range, try to bring the latest prior snapshot as baseline anchor
    if (inRange.length < 2) {
      const prior = sortedSnapshots.filter((s) => s.snapshotDate < cutoffISO);
      if (prior.length > 0) {
        return [prior[prior.length - 1], ...inRange];
      }
    }

    return inRange;
  };

  const activeSnapshots = getFilteredSnapshots();
  const count = activeSnapshots.length;

  const getVal = (s: AssetSnapshot) => (getValue ? getValue(s) : s.totalNetWorth);

  const firstSnap = count > 0 ? activeSnapshots[0] : null;
  const latestSnap = count > 0 ? activeSnapshots[count - 1] : null;

  const initialWorth = firstSnap ? getVal(firstSnap) : 0;
  const currentWorth = latestSnap ? getVal(latestSnap) : 0;
  const growthAmount = currentWorth - initialWorth;
  const growthPercent = initialWorth > 0 ? (growthAmount / initialWorth) * 100 : 0;
  const isPositiveGrowth = growthAmount >= 0;

  // Chart coordinate parameters
  const chartWidth = 360;
  const chartHeight = 140;
  const paddingLeft = 18;
  const paddingRight = 52;
  const paddingTop = 22;
  const paddingBottom = 30;
  const availableWidth = chartWidth - paddingLeft - paddingRight;
  const availableHeight = chartHeight - paddingTop - paddingBottom;

  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatShortDate = (isoStr: string) => {
    try {
      const parts = isoStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        return `${monthNamesEn[monthIdx] || ''} ${day}`;
      }
      return isoStr;
    } catch {
      return isoStr;
    }
  };

  // Empty state if no snapshots exist anywhere
  if (sortedSnapshots.length === 0) {
    return (
      <div
        className="glass"
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          background: '#FFFFFF',
          border: '1px solid var(--border-light)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <TrendingUp size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Asset Growth Trajectory
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '240px', marginInline: 'auto' }}>
            No valuation records found. Update valuations periodically to track portfolio momentum over time.
          </p>
        </div>
        {onOpenSnapshotModal && (
          <button
            onClick={onOpenSnapshotModal}
            style={{
              marginTop: '4px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '11.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <PlusCircle size={14} />
            Record First Valuation
          </button>
        )}
      </div>
    );
  }

  // Calculate SVG coordinates
  const values = activeSnapshots.map(getVal);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  if (minVal === maxVal) {
    minVal = Math.max(0, minVal * 0.9);
    maxVal = maxVal * 1.1 || 1000000;
  } else {
    const range = maxVal - minVal;
    minVal = Math.max(0, minVal - range * 0.1);
    maxVal = maxVal + range * 0.1;
  }

  const valRange = maxVal - minVal || 1;

  const points = activeSnapshots.map((s, idx) => {
    const x =
      count === 1
        ? paddingLeft + availableWidth / 2
        : paddingLeft + (idx / (count - 1)) * availableWidth;
    const y = paddingTop + availableHeight - ((getVal(s) - minVal) / valRange) * availableHeight;
    return { x, y, snapshot: s, index: idx };
  });

  // Construct SVG Path
  let linePath = '';
  let areaPath = '';

  if (points.length === 1) {
    linePath = `M ${points[0].x - 30},${points[0].y} L ${points[0].x + 30},${points[0].y}`;
  } else if (points.length > 1) {
    linePath = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, '');

    const firstPt = points[0];
    const lastPt = points[points.length - 1];
    const bottomY = paddingTop + availableHeight;
    areaPath = `${linePath} L ${lastPt.x},${bottomY} L ${firstPt.x},${bottomY} Z`;
  }

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : points[points.length - 1];

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
              <TrendingUp size={15} />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            {filterLabel && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {filterLabel}
              </span>
            )}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
            {subtitle || `${count} valuation points in ${timeframe}`}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} size="sm" />
          <div style={{ textAlign: 'right', marginTop: '2px' }}>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }} className="tabular-nums">
              {activePoint ? formatRupiah(getVal(activePoint.snapshot)) : formatRupiah(currentWorth)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '1px' }}>
              {count > 1 ? (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isPositiveGrowth ? 'var(--emerald)' : 'var(--rose)',
                    background: isPositiveGrowth ? 'var(--emerald-light)' : 'var(--rose-light)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  {isPositiveGrowth ? '+' : ''}
                  {growthPercent.toFixed(1)}% ({isPositiveGrowth ? '+' : ''}{formatRupiah(growthAmount)})
                </span>
              ) : (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Baseline valuation
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div style={{ width: '100%', position: 'relative', marginTop: '4px' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
        >
          <defs>
            <linearGradient id="growthAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#48B07D" stopOpacity="0.32" />
              <stop offset="85%" stopColor="#48B07D" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#48B07D" stopOpacity="0.0" />
            </linearGradient>
            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#48B07D" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Horizontal grid lines with right-aligned metric values */}
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
            {formatCompactMetric(maxVal)}
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
            {formatCompactMetric((maxVal + minVal) / 2)}
          </text>

          <line
            x1={paddingLeft}
            y1={paddingTop + availableHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + availableHeight}
            stroke="#E2ECE5"
            strokeWidth="1"
          />
          <text
            x={chartWidth - 4}
            y={paddingTop + availableHeight + 3.5}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize="8.5"
            fontWeight="600"
          >
            {formatCompactMetric(minVal)}
          </text>

          {/* Gradient Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#growthAreaGradient)"
              style={{ transition: 'd 0.3s ease' }}
            />
          )}

          {/* Main Growth Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#48B07D"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'd 0.3s ease' }}
            />
          )}

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            const isLatest = idx === points.length - 1;

            return (
              <g
                key={pt.snapshot.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Touch/mouse hover hit area */}
                <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                {/* Vertical guideline on hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + availableHeight}
                    stroke="var(--primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}

                {/* Outer ring on hover / latest */}
                {(isHovered || isLatest) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 9 : 7}
                    fill="rgba(72, 176, 125, 0.18)"
                    style={{ transition: 'all 0.2s ease' }}
                  />
                )}

                {/* The Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 4.5}
                  fill="#FFFFFF"
                  stroke="#48B07D"
                  strokeWidth="2.8"
                  filter="url(#pointShadow)"
                  style={{ transition: 'all 0.2s ease' }}
                />

                {/* Date Label on X Axis */}
                <text
                  x={pt.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--primary)' : 'var(--text-muted)'}
                  fontSize="9.5"
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {formatShortDate(pt.snapshot.snapshotDate)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active Point Note or Tip */}
      {activePoint && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-chip)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <Calendar size={13} color="var(--primary)" />
            <span style={{ fontWeight: 600 }}>{activePoint.snapshot.snapshotDate}:</span>
            <span style={{ color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {activePoint.snapshot.notes || 'Portfolio valuation'}
            </span>
          </div>
          {onOpenSnapshotModal && (
            <button
              onClick={onOpenSnapshotModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '10.5px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginLeft: '8px',
              }}
            >
              + Update Valuation
            </button>
          )}
        </div>
      )}
    </div>
  );
};
