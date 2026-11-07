import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  TrendingUp,
  Plus,
  Search,
  Briefcase,
  Sparkles,
  Coins,
  Edit2,
  Trash2,
  Power,
  Layers,
  ArrowUpRight,
  GripVertical,
} from 'lucide-react';
import { RevenueStreamItem, RevenueCategory } from '../../../types';
import { formatRupiah } from '../../../utils/financialCalculations';
import { apiService } from '../../../services/apiService';
import {
  removeRevenueStream,
  reorderRevenueStreams,
  toggleRevenueStreamStatusInState,
} from '../../../store/slices/planningSlice';
import { AddRevenueStreamModal } from '../../planning/AddRevenueStreamModal';

const CATEGORY_META: Record<
  RevenueCategory,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  main_job: {
    label: 'Main Job',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    icon: <Briefcase size={14} />,
  },
  side_hustle: {
    label: 'Side Hustle',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.12)',
    icon: <Sparkles size={14} />,
  },
  passive_income: {
    label: 'Passive Income',
    color: '#0284C7',
    bg: 'rgba(2, 132, 199, 0.12)',
    icon: <Coins size={14} />,
  },
  other: {
    label: 'Other Inflow',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    icon: <Layers size={14} />,
  },
};

export const RevenueStreamView: React.FC = () => {
  const dispatch = useAppDispatch();
  const streams = useAppSelector((state) => state.planning.revenueStreams);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | RevenueCategory>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [streamToEdit, setStreamToEdit] = useState<RevenueStreamItem | null>(null);

  // Drag and drop state
  const [draggedStreamId, setDraggedStreamId] = useState<string | null>(null);
  const [dragOverStreamId, setDragOverStreamId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedStreamId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStreamId !== id) {
      setDragOverStreamId(id);
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggedStreamId || draggedStreamId === targetId) {
      setDraggedStreamId(null);
      setDragOverStreamId(null);
      return;
    }

    const sourceIdx = streams.findIndex((s) => s.id === draggedStreamId);
    const targetIdx = streams.findIndex((s) => s.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const updated = [...streams];
      const [movedItem] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, movedItem);

      dispatch(reorderRevenueStreams(updated));
      apiService.reorderRevenueStreams(updated.map((s) => s.id)).catch(console.error);
    }

    setDraggedStreamId(null);
    setDragOverStreamId(null);
  };

  const handleDragEnd = () => {
    setDraggedStreamId(null);
    setDragOverStreamId(null);
  };

  // Aggregated Calculations
  const activeStreams = streams.filter((s) => s.status === 'active');
  const totalMonthlyInflow = activeStreams.reduce((acc, s) => acc + s.amount, 0);

  const mainJobTotal = activeStreams
    .filter((s) => s.category === 'main_job')
    .reduce((acc, s) => acc + s.amount, 0);

  const sideHustleTotal = activeStreams
    .filter((s) => s.category === 'side_hustle')
    .reduce((acc, s) => acc + s.amount, 0);

  const passiveTotal = activeStreams
    .filter((s) => s.category === 'passive_income')
    .reduce((acc, s) => acc + s.amount, 0);

  const mainJobPct = totalMonthlyInflow > 0 ? Math.round((mainJobTotal / totalMonthlyInflow) * 100) : 0;
  const sideHustlePct = totalMonthlyInflow > 0 ? Math.round((sideHustleTotal / totalMonthlyInflow) * 100) : 0;
  const passivePct = totalMonthlyInflow > 0 ? Math.max(0, 100 - mainJobPct - sideHustlePct) : 0;

  // Filtered Streams
  const filteredStreams = streams.filter((s) => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = s.name.toLowerCase().includes(q);
      const notesMatch = (s.notes || '').toLowerCase().includes(q);
      return nameMatch || notesMatch;
    }
    return true;
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove revenue stream "${name}"?`)) {
      try {
        await apiService.deleteRevenueStream(id);
        dispatch(removeRevenueStream(id));
      } catch (err) {
        console.error('Failed to delete revenue stream:', err);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await apiService.toggleRevenueStreamStatus(id);
      dispatch(toggleRevenueStreamStatusInState(id));
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const openCreateModal = () => {
    setStreamToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (stream: RevenueStreamItem) => {
    setStreamToEdit(stream);
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Hero Revenue Inflow Analytics Bento */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 250, 0.95) 100%)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--primary)',
                  background: 'var(--primary-light)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Inflow Engine
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {activeStreams.length} Active Channels
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Consolidated Monthly Revenue
            </div>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.8px',
                marginTop: '4px',
              }}
              className="tabular-nums"
            >
              {formatRupiah(totalMonthlyInflow)}
              <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '6px' }}>
                / month
              </span>
            </h1>
          </div>

          <button onClick={openCreateModal} className="btn-primary" style={{ padding: '10px 18px' }}>
            <Plus size={16} />
            <span>Add Revenue Stream</span>
          </button>
        </div>

        {/* Breakdown Metric Chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginTop: '22px',
          }}
        >
          {/* Main Job */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Main Job</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#059669',
                  background: 'rgba(5, 150, 105, 0.1)',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {mainJobPct}%
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }} className="tabular-nums">
              {formatRupiah(mainJobTotal)}
            </div>
          </div>

          {/* Side Hustle */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Side Hustle & Freelance</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#7C3AED',
                  background: 'rgba(124, 58, 237, 0.1)',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {sideHustlePct}%
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }} className="tabular-nums">
              {formatRupiah(sideHustleTotal)}
            </div>
          </div>

          {/* Passive & Investment */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Passive & Dividends</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#0284C7',
                  background: 'rgba(2, 132, 199, 0.1)',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {passivePct}%
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }} className="tabular-nums">
              {formatRupiah(passiveTotal)}
            </div>
          </div>
        </div>

        {/* Stacked Proportional Bar */}
        {totalMonthlyInflow > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                height: '7px',
                borderRadius: '999px',
                background: 'var(--bg-app)',
                overflow: 'hidden',
                display: 'flex',
                gap: '2px',
              }}
            >
              <div style={{ width: `${mainJobPct}%`, background: '#059669', height: '100%' }} title={`Main Job: ${mainJobPct}%`} />
              <div style={{ width: `${sideHustlePct}%`, background: '#7C3AED', height: '100%' }} title={`Side Hustle: ${sideHustlePct}%`} />
              <div style={{ width: `${passivePct}%`, background: '#0284C7', height: '100%' }} title={`Passive: ${passivePct}%`} />
            </div>
          </div>
        )}
      </div>

      {/* 2. Control Toolbar (Search & Filter Tabs) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Streams (${streams.length})` },
            { id: 'main_job', label: 'Main Job' },
            { id: 'side_hustle', label: 'Side Hustle' },
            { id: 'passive_income', label: 'Passive Income' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className="btn-neutral"
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                background: selectedCategory === cat.id ? 'var(--primary)' : '#FFFFFF',
                color: selectedCategory === cat.id ? '#FFFFFF' : 'var(--text-secondary)',
                borderColor: selectedCategory === cat.id ? 'var(--primary)' : 'var(--border-light)',
                boxShadow: selectedCategory === cat.id ? '0 2px 8px rgba(72, 176, 125, 0.3)' : 'none',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1.5px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px',
            height: '38px',
            width: '260px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <Search size={14} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search stream..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* 3. Revenue Stream Cards Grid */}
      {filteredStreams.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <GripVertical size={13} />
            <span>Drag cards to reorder</span>
          </span>
        </div>
      )}

      {filteredStreams.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'var(--primary-light)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '14px',
            }}
          >
            <TrendingUp size={24} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Revenue Streams Found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '380px', marginInline: 'auto' }}>
            {searchQuery
              ? `No revenue channels matched "${searchQuery}". Try adjusting your search query.`
              : 'Add your primary job salary, freelance projects, business profits, or investment dividends to unlock comprehensive cash flow planning.'}
          </p>
          <button
            onClick={openCreateModal}
            className="btn-primary"
            style={{ marginTop: '16px', display: 'inline-flex' }}
          >
            <Plus size={15} />
            <span>Add First Revenue Stream</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredStreams.map((stream) => {
            const meta = CATEGORY_META[stream.category] || CATEGORY_META.other;
            const isInactive = stream.status === 'inactive';
            const isBeingDragged = draggedStreamId === stream.id;
            const isOver = dragOverStreamId === stream.id && !isBeingDragged;

            return (
              <div
                key={stream.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, stream.id)}
                onDragOver={(e) => handleDragOver(e, stream.id)}
                onDragLeave={() => {
                  if (dragOverStreamId === stream.id) setDragOverStreamId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(stream.id);
                }}
                onDragEnd={handleDragEnd}
                className="glass"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  background: isBeingDragged ? 'var(--bg-app)' : isInactive ? '#FAFCFB' : '#FFFFFF',
                  border: isOver
                    ? '2px dashed var(--primary)'
                    : isInactive
                    ? '1px dashed var(--border-light)'
                    : '1px solid var(--border-light)',
                  boxShadow: isOver ? '0 0 0 4px var(--primary-light)' : isInactive ? 'none' : 'var(--shadow-xs)',
                  opacity: isBeingDragged ? 0.45 : isInactive ? 0.68 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'grab',
                }}
              >
                <div>
                  {/* Category & Status Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--text-muted)',
                          cursor: 'grab',
                          padding: '2px',
                        }}
                        title="Drag to reorder"
                      >
                        <GripVertical size={15} />
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: meta.color,
                          background: meta.bg,
                        }}
                      >
                        {meta.icon}
                        <span>{meta.label}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.4px',
                          color: isInactive ? 'var(--text-muted)' : 'var(--primary)',
                        }}
                      >
                        {stream.frequency}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(stream.id)}
                        title={isInactive ? 'Activate Stream' : 'Pause Stream'}
                        style={{
                          background: isInactive ? 'rgba(0,0,0,0.05)' : 'var(--primary-light)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px',
                          color: isInactive ? 'var(--text-muted)' : 'var(--primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Power size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: isInactive ? 'var(--text-secondary)' : 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {stream.name}
                  </h3>

                  {stream.notes && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                      {stream.notes}
                    </p>
                  )}
                </div>

                {/* Amount & Actions Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: '18px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Monthly Estimated Inflow
                    </span>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: isInactive ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}
                      className="tabular-nums"
                    >
                      {formatRupiah(stream.amount)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openEditModal(stream)}
                      className="btn-neutral"
                      style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)' }}
                      title="Edit Stream"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(stream.id, stream.name)}
                      className="btn-danger-ghost"
                      style={{ padding: '6px 8px' }}
                      title="Delete Stream"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddRevenueStreamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        streamToEdit={streamToEdit}
      />
    </div>
  );
};

