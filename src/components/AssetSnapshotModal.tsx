import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { addSnapshot, updateSnapshot } from '../store/slices/snapshotSlice';
import { setAssets } from '../store/slices/assetSlice';
import { apiService } from '../services/apiService';
import { X, Calendar, ClipboardCheck, Plus, Trash2, Check, Sparkles, TrendingUp, Wallet, Landmark, HelpCircle } from 'lucide-react';
import { AssetItem, AssetSnapshot, AssetClass } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { formatRupiah } from '../utils/financialCalculations';
import { ASSET_CATEGORIES } from '../utils/assetCategories';

interface AssetSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSnapshot?: AssetSnapshot | null;
}

export const AssetSnapshotModal: React.FC<AssetSnapshotModalProps> = ({
  isOpen,
  onClose,
  editingSnapshot,
}) => {
  const dispatch = useAppDispatch();
  const currentAssets = useAppSelector((state) => state.asset.items);

  const [snapshotDate, setSnapshotDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<AssetItem[]>([]);
  const [syncWithLive, setSyncWithLive] = useState<boolean>(true);

  // New item quick drawer state
  const [showAddNewItem, setShowAddNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemClass, setNewItemClass] = useState<AssetClass>('cash_equivalent');
  const [newItemType, setNewItemType] = useState('Bank Savings');
  const [newItemValue, setNewItemValue] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      if (editingSnapshot) {
        setSnapshotDate(editingSnapshot.snapshotDate);
        setNotes(editingSnapshot.notes || '');
        setItems(editingSnapshot.items.map((i) => ({ ...i })));
        setSyncWithLive(false); // default unchecked for historical edits
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setSnapshotDate(todayStr);
        setNotes('');
        // Clone current live assets as default template for this check-in
        setItems(currentAssets.map((a) => ({ ...a })));
        setSyncWithLive(true);
      }
      setShowAddNewItem(false);
    }
  }, [isOpen, editingSnapshot, currentAssets]);

  if (!isOpen) return null;

  // Real-time calculations for snapshot
  let totalCash = 0;
  let totalHard = 0;
  let totalInvestment = 0;

  items.forEach((item) => {
    const val = item.estimatedValue || 0;
    if (item.assetClass === 'cash_equivalent') {
      totalCash += val;
    } else if (
      item.assetClass === 'hard_asset_movable' ||
      item.assetClass === 'hard_asset_immovable'
    ) {
      totalHard += val;
    } else if (item.assetClass === 'investment') {
      totalInvestment += val;
    }
  });

  const totalNetWorth = totalCash + totalHard + totalInvestment;

  const handleItemValueChange = (id: string, newVal: number | '') => {
    const num = typeof newVal === 'number' ? newVal : 0;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, estimatedValue: num } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim() || typeof newItemValue !== 'number' || newItemValue < 0) return;

    const newItem: AssetItem = {
      id: `ast-snp-${Date.now()}`,
      name: newItemName.trim(),
      assetClass: newItemClass,
      type: newItemType,
      estimatedValue: newItemValue,
      liquidityTier:
        newItemClass === 'cash_equivalent'
          ? 'instant_liquid'
          : newItemClass === 'investment'
          ? 'marketable_semi_liquid'
          : 'illiquid',
      riskLevel: newItemClass === 'investment' ? 'medium' : 'very_low',
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemValue('');
    setShowAddNewItem(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotDate) return;

    const snapshot: AssetSnapshot = {
      id: editingSnapshot ? editingSnapshot.id : `snp-${Date.now()}`,
      snapshotDate,
      totalNetWorth,
      totalCash,
      totalHard,
      totalInvestment,
      notes: notes.trim() || undefined,
      items,
      createdAt: editingSnapshot ? editingSnapshot.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    if (editingSnapshot) {
      dispatch(updateSnapshot(snapshot));
      apiService
        .updateSnapshot(editingSnapshot.id, {
          snapshotDate,
          totalNetWorth,
          totalCash,
          totalHard,
          totalInvestment,
          notes: notes.trim() || undefined,
          itemsSnapshot: items,
        })
        .catch(console.warn);
    } else {
      apiService
        .createSnapshot({
          snapshotDate,
          totalNetWorth,
          totalCash,
          totalHard,
          totalInvestment,
          notes: notes.trim() || undefined,
          itemsSnapshot: items,
          syncWithLiveAssets: syncWithLive,
        })
        .then((res) => {
          if (res.success && res.data) {
            dispatch(addSnapshot({
              ...snapshot,
              id: res.data.id,
            }));
          } else {
            dispatch(addSnapshot(snapshot));
          }
        })
        .catch((err) => {
          console.error('Failed to create snapshot via API:', err);
          dispatch(addSnapshot(snapshot));
        });
    }

    // Optionally synchronize with live active assets
    if (syncWithLive && items.length > 0) {
      dispatch(setAssets(items));
    }

    onClose();
  };

  // Quick date presets
  const setQuickDate = (type: 'today' | 'yesterday' | 'month_end') => {
    const now = new Date();
    if (type === 'today') {
      setSnapshotDate(now.toISOString().split('T')[0]);
    } else if (type === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      setSnapshotDate(yesterday.toISOString().split('T')[0]);
    } else if (type === 'month_end') {
      // Last day of previous month
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setSnapshotDate(lastMonthEnd.toISOString().split('T')[0]);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(24, 47, 36, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 22px 16px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F5FAF7 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {editingSnapshot ? 'Edit Valuation Record' : 'Record Valuation Snapshot'}
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Record portfolio net worth on a specific date to track growth trajectories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px 22px',
            gap: '18px',
          }}
        >
          {/* Tanggal & Preset */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} color="var(--primary)" />
                Valuation Date
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setQuickDate('today')}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-chip)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('yesterday')}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-chip)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('month_end')}
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-chip)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Last Month End
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={snapshotDate}
              onChange={(e) => setSnapshotDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13.5px',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                background: '#FFFFFF',
                outline: 'none',
              }}
            />
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Event Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Payday & gold DCA, End-of-month review, Bonus payout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13px',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          {/* Live Summary Card */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #F0F7F3 0%, #E8F4ED 100%)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Total Net Worth at This Valuation
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {items.length} Recorded Assets
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {formatRupiah(totalNetWorth)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(72, 176, 125, 0.2)' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Liquid Cash</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--emerald)', marginTop: '1px' }}>
                  {formatRupiah(totalCash)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Hard Assets</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                  {formatRupiah(totalHard)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Investments</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary)', marginTop: '1px' }}>
                  {formatRupiah(totalInvestment)}
                </div>
              </div>
            </div>
          </div>

          {/* Asset Items Breakdown / Inputs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Update Individual Asset Values
                </label>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Adjust current market or balance values for each instrument
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNewItem(!showAddNewItem)}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--border-subtle)',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                Add Asset
              </button>
            </div>

            {/* Quick Add New Item Form if toggled */}
            {showAddNewItem && (
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-chip)',
                  border: '1px dashed var(--primary)',
                  marginBottom: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                  Add New Asset Row to This Valuation
                </span>
                <input
                  type="text"
                  placeholder="Asset Name (e.g., Bank Savings, Physical Gold 10g)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    fontSize: '12.5px',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    value={newItemClass}
                    onChange={(e) => {
                      const cls = e.target.value as AssetClass;
                      setNewItemClass(cls);
                      setNewItemType(
                        cls === 'cash_equivalent'
                          ? 'Bank Savings'
                          : cls === 'investment'
                          ? 'Mutual Funds / Stocks'
                          : 'Physical Assets'
                      );
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      background: '#FFF',
                    }}
                  >
                    <option value="cash_equivalent">1. Cash &amp; Cash Equivalents</option>
                    <option value="hard_asset_movable">2. Physical Hard Assets</option>
                    <option value="investment">3. Investment Portfolio</option>
                  </select>

                  <CurrencyInput
                    placeholder="Asset Value (Rp)"
                    value={newItemValue}
                    onChange={(val) => setNewItemValue(val)}
                    inputStyle={{ padding: '8px 12px', fontSize: '12.5px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddNewItem(false)}
                    style={{
                      fontSize: '11px',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--primary)',
                      color: '#FFF',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Add Row
                  </button>
                </div>
              </div>
            )}

            {/* List of current assets with editable CurrencyInputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    background: 'var(--bg-chip)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  No assets listed yet. Click "Add Asset" to start recording.
                </div>
              ) : (
                items.map((item, idx) => {
                  const isCash = item.assetClass === 'cash_equivalent';
                  const isHard =
                    item.assetClass === 'hard_asset_movable' ||
                    item.assetClass === 'hard_asset_immovable';
                  const badgeColor = isCash
                    ? 'var(--emerald)'
                    : isHard
                    ? 'var(--amber)'
                    : 'var(--secondary)';
                  const badgeBg = isCash
                    ? 'var(--emerald-light)'
                    : isHard
                    ? 'var(--amber-light)'
                    : 'var(--secondary-light)';
                  const badgeText = isCash ? 'Cash' : isHard ? 'Hard Asset' : 'Investment';

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        background: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: badgeBg,
                              color: badgeColor,
                              textTransform: 'uppercase',
                            }}
                          >
                            {badgeText}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove asset from this valuation"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <CurrencyInput
                            value={item.estimatedValue}
                            onChange={(val) => handleItemValueChange(item.id, val)}
                            placeholder="Current Value (Rp)"
                            inputStyle={{
                              fontSize: '13px',
                              padding: '8px 12px',
                              fontWeight: 700,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sync Option Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-chip)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={syncWithLive}
              onChange={(e) => setSyncWithLive(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              <strong>Sync with active asset balances</strong>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Update figures in the Wealth &amp; Assets tab based on this valuation data
              </div>
            </div>
          </label>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              paddingTop: '6px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                background: '#FFFFFF',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!snapshotDate || items.length === 0}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background:
                  !snapshotDate || items.length === 0
                    ? '#CCCCCC'
                    : 'var(--primary-gradient)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: !snapshotDate || items.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow:
                  !snapshotDate || items.length === 0
                    ? 'none'
                    : '0 4px 14px rgba(72, 176, 125, 0.35)',
              }}
            >
              <Check size={16} />
              {editingSnapshot ? 'Save Valuation Changes' : 'Save Asset Valuation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
