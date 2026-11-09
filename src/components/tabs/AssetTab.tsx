import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { calculateFinancials, formatRupiah } from '../../utils/financialCalculations';
import { removeAsset, reorderAssets } from '../../store/slices/assetSlice';
import { removeSnapshot } from '../../store/slices/snapshotSlice';
import { apiService } from '../../services/apiService';
import {
  PlusCircle,
  Trash2,
  Wallet,
  Landmark,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  Calendar,
  Edit2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  PieChart,
  GripVertical,
  Filter,
  Check,
  Coins,
  LineChart,
  Search,
  X,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { AssetItem, AssetSnapshot } from '../../types';
import { AssetSnapshotModal } from '../AssetSnapshotModal';
import { AddAssetModal } from '../AddAssetModal';
import { AssetGrowthLineChart } from '../charts/AssetGrowthLineChart';

export type AssetFilterType =
  | 'cash'
  | 'hard_appreciating'
  | 'hard_depreciating'
  | 'market_stock'
  | 'market_crypto';

interface AssetTabProps {
  onOpenAddAsset: () => void;
}

export const AssetTab: React.FC<AssetTabProps> = ({ onOpenAddAsset }) => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);
  const assets = useAppSelector((state) => state.asset.items);
  const transactions = useAppSelector((state) => state.transaction.items);
  const snapshots = useAppSelector((state) => state.snapshot.items);

  const [activeView, setActiveView] = useState<'active_assets' | 'snapshots'>('active_assets');
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<AssetSnapshot | null>(null);

  // Asset editing modal state
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);

  // Drag and drop state
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [dragOverAssetId, setDragOverAssetId] = useState<string | null>(null);

  // Active filters state (all enabled by default)
  const [activeFilters, setActiveFilters] = useState<Set<AssetFilterType>>(
    new Set(['cash', 'hard_appreciating', 'hard_depreciating', 'market_stock', 'market_crypto'])
  );

  // Individual card inclusion filter for Consolidated Net Worth calculation
  // (Assets in this set are excluded from Net Worth, allocation bars, and column totals)
  const [excludedAssetIds, setExcludedAssetIds] = useState<Set<string>>(new Set());

  // Search and view filter specifically for active holdings cards
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardFilterMode, setCardFilterMode] = useState<'all' | 'included' | 'excluded'>('all');

  const toggleAssetInclusion = (id: string) => {
    setExcludedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAssetIncluded = (id: string): boolean => !excludedAssetIds.has(id);

  const toggleColumnInclusion = (colAssets: AssetItem[]) => {
    const allIncluded = colAssets.length > 0 && colAssets.every((a) => !excludedAssetIds.has(a.id));
    setExcludedAssetIds((prev) => {
      const next = new Set(prev);
      if (allIncluded) {
        colAssets.forEach((a) => next.add(a.id));
      } else {
        colAssets.forEach((a) => next.delete(a.id));
      }
      return next;
    });
  };

  const fin = calculateFinancials(profile, assets, transactions);

  // Helpers to classify hard assets and investments
  const isAssetAppreciating = (item: AssetItem): boolean => {
    const rawType = String(item.appreciationType || '').toLowerCase().trim();
    if (rawType === 'depreciating') return false;
    if (rawType === 'appreciating') return true;
    const t = (item.type || '').toLowerCase();
    const n = (item.name || '').toLowerCase();
    if (
      t.includes('vehicle') || t.includes('motor') || t.includes('mobil') ||
      t.includes('electronic') || t.includes('gadget') || t.includes('laptop') ||
      t.includes('phone') || t.includes('machin') ||
      n.includes('vehicle') || n.includes('motor') || n.includes('mobil') ||
      n.includes('electronic') || n.includes('gadget') || n.includes('laptop') ||
      n.includes('phone') || n.includes('brio') || n.includes('ally') ||
      n.includes('macbook') || n.includes('iphone') || n.includes('samsung') ||
      n.includes('pc')
    ) {
      return false;
    }
    return true;
  };

  const isAssetCrypto = (item: AssetItem): boolean => {
    const t = item.type.toLowerCase();
    return t.includes('crypto') || t.includes('bitcoin') || t.includes('ethereum') || t.includes('btc') || t.includes('eth');
  };

  // Filter toggle handlers
  const toggleFilter = (key: AssetFilterType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) {
          next.delete(key);
        } else {
          return new Set(['cash', 'hard_appreciating', 'hard_depreciating', 'market_stock', 'market_crypto']);
        }
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllFilters = () => {
    setActiveFilters(new Set(['cash', 'hard_appreciating', 'hard_depreciating', 'market_stock', 'market_crypto']));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setDraggedAssetId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverAssetId !== id) {
      setDragOverAssetId(id);
    }
  };

  const handleDrop = (targetAssetId: string) => {
    if (!draggedAssetId || draggedAssetId === targetAssetId) {
      setDraggedAssetId(null);
      setDragOverAssetId(null);
      return;
    }

    const sourceIdx = assets.findIndex((a) => a.id === draggedAssetId);
    const targetIdx = assets.findIndex((a) => a.id === targetAssetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const updated = [...assets];
      const [movedItem] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, movedItem);

      dispatch(reorderAssets(updated));
      apiService.reorderAssets(updated.map((a) => a.id)).catch(console.error);
    }

    setDraggedAssetId(null);
    setDragOverAssetId(null);
  };

  const handleDragEnd = () => {
    setDraggedAssetId(null);
    setDragOverAssetId(null);
  };

  const handleRemoveAsset = (id: string) => {
    if (window.confirm('Are you sure you want to remove this asset holding?')) {
      dispatch(removeAsset(id));
      apiService.deleteAsset(id).catch(console.error);
    }
  };

  const handleRemoveSnapshot = (id: string) => {
    if (window.confirm('Are you sure you want to delete this valuation record?')) {
      dispatch(removeSnapshot(id));
      apiService.deleteSnapshot(id).catch(console.error);
    }
  };

  const handleOpenEditSnapshot = (snap: AssetSnapshot) => {
    setEditingSnapshot(snap);
    setIsSnapshotModalOpen(true);
  };

  const handleOpenNewSnapshot = () => {
    setEditingSnapshot(null);
    setIsSnapshotModalOpen(true);
  };

  // Filter aggregations
  const allCashAssets = assets.filter((a) => a.assetClass === 'cash_equivalent');
  const allHardAppreciating = assets.filter(
    (a) => (a.assetClass === 'hard_asset_movable' || a.assetClass === 'hard_asset_immovable') && isAssetAppreciating(a)
  );
  const allHardDepreciating = assets.filter(
    (a) => (a.assetClass === 'hard_asset_movable' || a.assetClass === 'hard_asset_immovable') && !isAssetAppreciating(a)
  );
  const allMarketStock = assets.filter((a) => a.assetClass === 'investment' && !isAssetCrypto(a));
  const allMarketCrypto = assets.filter((a) => a.assetClass === 'investment' && isAssetCrypto(a));

  const totalCashVal = allCashAssets.reduce((sum, a) => sum + a.estimatedValue, 0);
  const totalHardApprVal = allHardAppreciating.reduce((sum, a) => sum + a.estimatedValue, 0);
  const totalHardDeprVal = allHardDepreciating.reduce((sum, a) => sum + a.estimatedValue, 0);
  const totalStockVal = allMarketStock.reduce((sum, a) => sum + a.estimatedValue, 0);
  const totalCryptoVal = allMarketCrypto.reduce((sum, a) => sum + a.estimatedValue, 0);

  // Subsets matching top 5-way category filters
  const displayedCashAssets = activeFilters.has('cash') ? allCashAssets : [];
  const displayedHardAssets = assets.filter((a) => {
    if (a.assetClass !== 'hard_asset_movable' && a.assetClass !== 'hard_asset_immovable') return false;
    const isAppr = isAssetAppreciating(a);
    if (isAppr && activeFilters.has('hard_appreciating')) return true;
    if (!isAppr && activeFilters.has('hard_depreciating')) return true;
    return false;
  });
  const displayedInvestmentAssets = assets.filter((a) => {
    if (a.assetClass !== 'investment') return false;
    const isCrypto = isAssetCrypto(a);
    if (isCrypto && activeFilters.has('market_crypto')) return true;
    if (!isCrypto && activeFilters.has('market_stock')) return true;
    return false;
  });

  const visibleAssetsCount =
    displayedCashAssets.length + displayedHardAssets.length + displayedInvestmentAssets.length;

  // Dynamic values based on activeFilters selection AND card-level inclusion
  const isCardCounted = (a: AssetItem): boolean => isAssetIncluded(a.id);

  const filteredCashTotal = displayedCashAssets
    .filter(isCardCounted)
    .reduce((sum, a) => sum + a.estimatedValue, 0);

  const filteredHardApprTotal = displayedHardAssets
    .filter((a) => isAssetAppreciating(a) && isCardCounted(a))
    .reduce((sum, a) => sum + a.estimatedValue, 0);

  const filteredHardDeprTotal = displayedHardAssets
    .filter((a) => !isAssetAppreciating(a) && isCardCounted(a))
    .reduce((sum, a) => sum + a.estimatedValue, 0);

  const filteredHardTotal = filteredHardApprTotal + filteredHardDeprTotal;

  const filteredStockTotal = displayedInvestmentAssets
    .filter((a) => !isAssetCrypto(a) && isCardCounted(a))
    .reduce((sum, a) => sum + a.estimatedValue, 0);

  const filteredCryptoTotal = displayedInvestmentAssets
    .filter((a) => isAssetCrypto(a) && isCardCounted(a))
    .reduce((sum, a) => sum + a.estimatedValue, 0);

  const filteredInvestmentTotal = filteredStockTotal + filteredCryptoTotal;

  // Filtered net worth reacting in real-time to active filter toggles & card selections
  const filteredNetWorth = filteredCashTotal + filteredHardTotal + filteredInvestmentTotal;

  // Count how many cards are actively contributing to the Net Worth calculation
  const totalCalculatedItems =
    displayedCashAssets.filter(isCardCounted).length +
    displayedHardAssets.filter(isCardCounted).length +
    displayedInvestmentAssets.filter(isCardCounted).length;

  const isFiltered = activeFilters.size < 5 || excludedAssetIds.size > 0;

  // Card search and mode filter for active holdings list
  const filterCardBySearchAndMode = (item: AssetItem): boolean => {
    const inc = isAssetIncluded(item.id);
    if (cardFilterMode === 'included' && !inc) return false;
    if (cardFilterMode === 'excluded' && inc) return false;

    if (!cardSearchQuery.trim()) return true;
    const q = cardSearchQuery.toLowerCase().trim();
    const nameMatch = (item.name || '').toLowerCase().includes(q);
    const typeMatch = (item.type || '').toLowerCase().includes(q);
    return nameMatch || typeMatch;
  };

  const renderedCashAssets = displayedCashAssets.filter(filterCardBySearchAndMode);
  const renderedHardAssets = displayedHardAssets.filter(filterCardBySearchAndMode);
  const renderedInvestmentAssets = displayedInvestmentAssets.filter(filterCardBySearchAndMode);

  // Percentage breakdown for stacked bar based on filtered net worth
  const totalNet = filteredNetWorth > 0 ? filteredNetWorth : 1;
  const cashPct = filteredNetWorth > 0 ? Math.round((filteredCashTotal / totalNet) * 100) : 0;
  const hardPct = filteredNetWorth > 0 ? Math.round((filteredHardTotal / totalNet) * 100) : 0;
  const invPct = filteredNetWorth > 0 ? Math.max(0, 100 - cashPct - hardPct) : 0;

  // Sort snapshots chronological descending (newest first for timeline list)
  const sortedSnapshotsDesc = [...snapshots].sort((a, b) => {
    const d = b.snapshotDate.localeCompare(a.snapshotDate);
    if (d !== 0) return d;
    return b.createdAt - a.createdAt;
  });

  // Filter snapshot valuation dynamically based on active 5-way holding filters
  const getSnapshotFilteredValue = (snap: AssetSnapshot): number => {
    if (activeFilters.size === 5) return snap.totalNetWorth;
    if (activeFilters.size === 0) return 0;

    if (Array.isArray(snap.items) && snap.items.length > 0) {
      let sum = 0;
      snap.items.forEach((item) => {
        if (item.assetClass === 'cash_equivalent' && activeFilters.has('cash')) {
          sum += Number(item.estimatedValue) || 0;
        } else if (item.assetClass === 'hard_asset_movable' || item.assetClass === 'hard_asset_immovable') {
          const isAppr = isAssetAppreciating(item);
          if (isAppr && activeFilters.has('hard_appreciating')) {
            sum += Number(item.estimatedValue) || 0;
          } else if (!isAppr && activeFilters.has('hard_depreciating')) {
            sum += Number(item.estimatedValue) || 0;
          }
        } else if (item.assetClass === 'investment') {
          const isCrypto = isAssetCrypto(item);
          if (!isCrypto && activeFilters.has('market_stock')) {
            sum += Number(item.estimatedValue) || 0;
          } else if (isCrypto && activeFilters.has('market_crypto')) {
            sum += Number(item.estimatedValue) || 0;
          }
        }
      });
      return sum;
    }

    // Fallback if snap.items is not populated:
    let sum = 0;
    if (activeFilters.has('cash')) sum += snap.totalCash || 0;
    if (activeFilters.has('hard_appreciating') || activeFilters.has('hard_depreciating')) {
      const hardCount = (activeFilters.has('hard_appreciating') ? 1 : 0) + (activeFilters.has('hard_depreciating') ? 1 : 0);
      sum += (snap.totalHard || 0) * (hardCount / 2);
    }
    if (activeFilters.has('market_stock') || activeFilters.has('market_crypto')) {
      const invCount = (activeFilters.has('market_stock') ? 1 : 0) + (activeFilters.has('market_crypto') ? 1 : 0);
      sum += (snap.totalInvestment || 0) * (invCount / 2);
    }
    return Math.round(sum);
  };

  // Construct trajectory snapshots including real-time live holding valuation as latest anchor
  const effectiveSnapshots: AssetSnapshot[] = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    const livePoint: AssetSnapshot = {
      id: 'live-current',
      snapshotDate: todayISO,
      totalNetWorth: filteredNetWorth,
      totalCash: filteredCashTotal,
      totalHard: filteredHardTotal,
      totalInvestment: filteredInvestmentTotal,
      items: assets.filter(isCardCounted),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: 'Current live portfolio valuation',
    };

    if (snapshots.length === 0) {
      return [livePoint];
    }

    const sorted = [...snapshots].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));
    const lastSnap = sorted[sorted.length - 1];
    if (lastSnap.snapshotDate < todayISO) {
      return [...sorted, livePoint];
    }
    return sorted;
  }, [snapshots, filteredNetWorth, filteredCashTotal, filteredHardTotal, filteredInvestmentTotal, assets, excludedAssetIds]);

  // Helper date formatter in English: "October 30, 2026"
  const formatDateEn = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const day = parseInt(parts[2], 10);
        const month = monthNames[parseInt(parts[1], 10) - 1] || '';
        const year = parts[0];
        return `${month} ${day}, ${year}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="tab-pane animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 800 }}>
            Net Worth &amp; Asset Holdings
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Consolidated 3-tier wealth architecture &amp; periodic valuation registry
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleOpenNewSnapshot}
            className="btn-secondary"
            style={{
              padding: '9px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <ClipboardCheck size={16} />
            Record Valuation
          </button>
          <button onClick={onOpenAddAsset} className="btn-primary" style={{ padding: '9px 15px', fontSize: '12.5px' }}>
            <PlusCircle size={16} />
            Add Asset Holding
          </button>
        </div>
      </div>

      {/* Net Worth Hero Card with Stacked Composition Bar */}
      <div
        className="glass"
        style={{
          padding: '24px 28px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7F3 100%)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Consolidated Net Worth
              </span>
              {isFiltered && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(217, 119, 6, 0.1)',
                    color: '#B45309',
                    border: '1px solid rgba(217, 119, 6, 0.25)',
                  }}
                >
                  Filtered ({visibleAssetsCount}/{assets.length} holdings)
                </span>
              )}
            </div>
            <div className="tabular-nums" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {formatRupiah(filteredNetWorth)}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isFiltered
                ? 'Filtered balance sheet dynamically calculated based on your active asset category selection'
                : 'Comprehensive balance sheet combining cash buffer, physical assets, and investment portfolios'}
            </p>
          </div>
          {snapshots.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-light)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--primary)',
              }}
            >
              <Clock size={13} />
              <span>Latest Valuation: {snapshots[snapshots.length - 1].snapshotDate}</span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Interactive 5-Way Holding Filter Bar (Placed Above Portfolio Asset Allocation) */}
        {/* ========================================================================= */}
        <div
          style={{
            marginTop: '22px',
            marginBottom: '20px',
            padding: '16px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.92)',
            border: '1px solid rgba(72, 176, 125, 0.2)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Filter size={14} color="var(--primary)" />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Portfolio Holdings Filter
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  Showing {visibleAssetsCount} of {assets.length} active holdings &bull; Toggle to dynamically calculate net worth
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={selectAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                Select All
              </button>
              <span style={{ color: 'var(--border-light)' }}>&bull;</span>
              <button
                type="button"
                onClick={() => setActiveFilters(new Set(['cash']))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                Cash Only
              </button>
            </div>
          </div>

          {/* 5 Toggle Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {/* 1. Cash & Liquid */}
            <button
              type="button"
              onClick={() => toggleFilter('cash')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeFilters.has('cash') ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg-chip)',
                border: activeFilters.has('cash') ? '1.5px solid var(--emerald)' : '1px solid var(--border-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: activeFilters.has('cash') ? 'none' : '1.5px solid var(--border-light)',
                    background: activeFilters.has('cash') ? 'var(--emerald)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeFilters.has('cash') && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: activeFilters.has('cash') ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Cash &amp; Liquid
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {allCashAssets.length} items &bull; {formatRupiah(totalCashVal)}
                  </div>
                </div>
              </div>
              <Wallet size={16} color={activeFilters.has('cash') ? 'var(--emerald)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            </button>

            {/* 2. Hard Physical Assets (Appresiatif) */}
            <button
              type="button"
              onClick={() => toggleFilter('hard_appreciating')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeFilters.has('hard_appreciating') ? 'rgba(5, 150, 105, 0.08)' : 'var(--bg-chip)',
                border: activeFilters.has('hard_appreciating') ? '1.5px solid var(--emerald)' : '1px solid var(--border-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: activeFilters.has('hard_appreciating') ? 'none' : '1.5px solid var(--border-light)',
                    background: activeFilters.has('hard_appreciating') ? 'var(--emerald)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeFilters.has('hard_appreciating') && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: activeFilters.has('hard_appreciating') ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Hard Assets (Appreciating)
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {allHardAppreciating.length} items &bull; {formatRupiah(totalHardApprVal)}
                  </div>
                </div>
              </div>
              <TrendingUp size={16} color={activeFilters.has('hard_appreciating') ? 'var(--emerald)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            </button>

            {/* 3. Hard Physical Assets (Depreciating) */}
            <button
              type="button"
              onClick={() => toggleFilter('hard_depreciating')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeFilters.has('hard_depreciating') ? 'rgba(217, 119, 6, 0.08)' : 'var(--bg-chip)',
                border: activeFilters.has('hard_depreciating') ? '1.5px solid var(--amber)' : '1px solid var(--border-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: activeFilters.has('hard_depreciating') ? 'none' : '1.5px solid var(--border-light)',
                    background: activeFilters.has('hard_depreciating') ? 'var(--amber)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeFilters.has('hard_depreciating') && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: activeFilters.has('hard_depreciating') ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Hard Assets (Depreciating)
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {allHardDepreciating.length} items &bull; {formatRupiah(totalHardDeprVal)}
                  </div>
                </div>
              </div>
              <TrendingDown size={16} color={activeFilters.has('hard_depreciating') ? 'var(--amber)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            </button>

            {/* 4. Market Investments (Stock) */}
            <button
              type="button"
              onClick={() => toggleFilter('market_stock')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeFilters.has('market_stock') ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-chip)',
                border: activeFilters.has('market_stock') ? '1.5px solid var(--secondary)' : '1px solid var(--border-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: activeFilters.has('market_stock') ? 'none' : '1.5px solid var(--border-light)',
                    background: activeFilters.has('market_stock') ? 'var(--secondary)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeFilters.has('market_stock') && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: activeFilters.has('market_stock') ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Market Investments (Stock)
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {allMarketStock.length} items &bull; {formatRupiah(totalStockVal)}
                  </div>
                </div>
              </div>
              <LineChart size={16} color={activeFilters.has('market_stock') ? 'var(--secondary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            </button>

            {/* 5. Market Investments (Crypto) */}
            <button
              type="button"
              onClick={() => toggleFilter('market_crypto')}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeFilters.has('market_crypto') ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-chip)',
                border: activeFilters.has('market_crypto') ? '1.5px solid var(--purple)' : '1px solid var(--border-light)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: activeFilters.has('market_crypto') ? 'none' : '1.5px solid var(--border-light)',
                    background: activeFilters.has('market_crypto') ? 'var(--purple)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {activeFilters.has('market_crypto') && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: activeFilters.has('market_crypto') ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Market Investments (Crypto)
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {allMarketCrypto.length} items &bull; {formatRupiah(totalCryptoVal)}
                  </div>
                </div>
              </div>
              <Coins size={16} color={activeFilters.has('market_crypto') ? 'var(--purple)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>

        {/* Stacked Composition Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
            <span>Portfolio Asset Allocation</span>
            <span>
              {filteredNetWorth > 0
                ? `Cash ${cashPct}% • Hard Assets ${hardPct}% • Investments ${invPct}%`
                : 'No categories active'}
            </span>
          </div>
          <div
            style={{
              height: '10px',
              background: '#E2ECE5',
              borderRadius: '5px',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${cashPct}%`,
                background: 'var(--emerald)',
                transition: 'width 0.4s ease',
              }}
              title={`Cash & Liquid: ${cashPct}%`}
            />
            <div
              style={{
                height: '100%',
                width: `${hardPct}%`,
                background: '#D97706',
                transition: 'width 0.4s ease',
              }}
              title={`Hard Assets: ${hardPct}%`}
            />
            <div
              style={{
                height: '100%',
                width: `${invPct}%`,
                background: 'var(--secondary)',
                transition: 'width 0.4s ease',
              }}
              title={`Investments: ${invPct}%`}
            />
          </div>
        </div>

        {/* 3 Metric Columns in Hero */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald)' }}></span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1. Cash &amp; Liquid Buffer</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--emerald)', marginTop: '4px' }}>
              {formatRupiah(filteredCashTotal)}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }}></span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2. Tangible Hard Assets</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {formatRupiah(filteredHardTotal)}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>3. Market Investments</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
              {formatRupiah(filteredInvestmentTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Segmented View Switcher */}
      <div
        style={{
          display: 'inline-flex',
          background: '#EAEFEA',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          gap: '4px',
          alignSelf: 'flex-start',
        }}
      >
        <button
          onClick={() => setActiveView('active_assets')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeView === 'active_assets' ? '#FFFFFF' : 'transparent',
            color: activeView === 'active_assets' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeView === 'active_assets' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Layers size={15} color={activeView === 'active_assets' ? 'var(--primary)' : 'currentColor'} />
          Active Holdings ({assets.length})
        </button>

        <button
          onClick={() => setActiveView('snapshots')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            background: activeView === 'snapshots' ? '#FFFFFF' : 'transparent',
            color: activeView === 'snapshots' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeView === 'snapshots' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <ClipboardCheck size={15} color={activeView === 'snapshots' ? 'var(--primary)' : 'currentColor'} />
          Valuation History ({snapshots.length})
        </button>
      </div>

      {/* VIEW 1: ACTIVE ASSETS */}
      {activeView === 'active_assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Dynamic Portfolio Valuation Trajectory Line Chart */}
          <AssetGrowthLineChart
            snapshots={effectiveSnapshots}
            getValue={getSnapshotFilteredValue}
            filterLabel={isFiltered ? `Filtered (${visibleAssetsCount} holdings)` : 'All Asset Classes'}
            title="Portfolio Valuation Trajectory"
            subtitle={
              isFiltered
                ? `Dynamic trajectory reflecting active categories: ${[
                    activeFilters.has('cash') ? 'Cash' : null,
                    activeFilters.has('hard_appreciating') ? 'Hard (Appreciating)' : null,
                    activeFilters.has('hard_depreciating') ? 'Hard (Depreciating)' : null,
                    activeFilters.has('market_stock') ? 'Stock' : null,
                    activeFilters.has('market_crypto') ? 'Crypto' : null,
                  ]
                    .filter(Boolean)
                    .join(', ')}`
                : 'Consolidated balance sheet momentum across all valuation records'
            }
            onOpenSnapshotModal={handleOpenNewSnapshot}
          />

          {/* Active Holdings Control & Quick Card Filter Bar */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px', flexWrap: 'wrap' }}>
              {/* Card search input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                  flex: 1,
                  minWidth: '200px',
                  maxWidth: '320px',
                }}
              >
                <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Filter cards by name or category..."
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
                {cardSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCardSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Card filter pills: All, Included, Excluded */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setCardFilterMode('all')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: cardFilterMode === 'all' ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                    background: cardFilterMode === 'all' ? 'var(--primary-light)' : 'transparent',
                    color: cardFilterMode === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All Cards ({visibleAssetsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCardFilterMode('included')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: cardFilterMode === 'included' ? '1px solid var(--emerald)' : '1px solid var(--border-light)',
                    background: cardFilterMode === 'included' ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                    color: cardFilterMode === 'included' ? 'var(--emerald)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Included in Net Worth ({totalCalculatedItems})
                </button>
                {excludedAssetIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setCardFilterMode('excluded')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      border: cardFilterMode === 'excluded' ? '1px solid var(--amber)' : '1px solid var(--border-light)',
                      background: cardFilterMode === 'excluded' ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                      color: cardFilterMode === 'excluded' ? 'var(--amber)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Excluded ({excludedAssetIds.size})
                  </button>
                )}
              </div>
            </div>

            {/* Bulk reset / status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Counting: <strong style={{ color: 'var(--primary)' }}>{totalCalculatedItems}</strong> of {visibleAssetsCount} cards
              </span>
              {excludedAssetIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setExcludedAssetIds(new Set())}
                  style={{
                    background: 'var(--primary-light)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--primary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Include All Cards
                </button>
              )}
            </div>
          </div>

          {/* 3-Column Parallel Tier Matrix */}
          <div className="bento-grid" style={{ alignItems: 'start' }}>
            {/* Column 1: Tier 1 Cash & Equivalents */}
            <div className="col-span-4 glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>1. Cash &amp; Liquid</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Emergency buffer &amp; liquidity</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="tabular-nums" style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--emerald)' }}>
                    {formatRupiah(filteredCashTotal)}
                  </span>
                  {displayedCashAssets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleColumnInclusion(displayedCashAssets)}
                      title={displayedCashAssets.every((a) => isAssetIncluded(a.id)) ? "Exclude all cash cards from Net Worth" : "Include all cash cards in Net Worth"}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: displayedCashAssets.every((a) => isAssetIncluded(a.id)) ? 'var(--text-muted)' : 'var(--primary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {displayedCashAssets.every((a) => isAssetIncluded(a.id)) ? 'Exclude All' : 'Include All'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!activeFilters.has('cash') ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    Filter unchecked. Enable Cash &amp; Liquid above to view holdings.
                  </div>
                ) : displayedCashAssets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    No liquid cash accounts recorded yet.
                  </div>
                ) : renderedCashAssets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    No cash holdings match current card filter.
                  </div>
                ) : (
                  renderedCashAssets.map((item) => {
                    const isIncluded = isAssetIncluded(item.id);
                    return (
                      <div
                        key={item.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={() => {
                          if (dragOverAssetId === item.id) setDragOverAssetId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDrop(item.id);
                        }}
                        onDragEnd={handleDragEnd}
                        style={{
                          background: draggedAssetId === item.id ? 'var(--bg-app)' : isIncluded ? '#FFFFFF' : '#F9FBFA',
                          border:
                            dragOverAssetId === item.id && draggedAssetId !== item.id
                              ? '2px dashed var(--primary)'
                              : isIncluded
                              ? '1px solid var(--border-light)'
                              : '1px dashed var(--border-medium)',
                          opacity: draggedAssetId === item.id ? 0.45 : isIncluded ? 1 : 0.72,
                          padding: '11px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s ease',
                          boxShadow: 'var(--shadow-xs)',
                          cursor: 'default',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div
                            style={{
                              cursor: 'grab',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px',
                              flexShrink: 0,
                            }}
                            title="Drag to change holding position"
                          >
                            <GripVertical size={14} />
                          </div>

                          {/* Individual card inclusion checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssetInclusion(item.id);
                            }}
                            title={isIncluded ? "Included in Net Worth (Click to exclude)" : "Excluded from Net Worth (Click to include)"}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: isIncluded ? 'none' : '1.5px solid var(--border-medium)',
                              background: isIncluded ? 'var(--emerald)' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: 0,
                              transition: 'all 0.15s ease',
                              boxShadow: isIncluded ? '0 1px 3px rgba(5, 150, 105, 0.25)' : 'none',
                            }}
                          >
                            {isIncluded && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </button>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: isIncluded ? 'var(--text-primary)' : 'var(--text-muted)',
                                  textDecoration: isIncluded ? 'none' : 'line-through',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.name}
                              </span>
                              {!isIncluded && (
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    background: 'rgba(217, 119, 6, 0.1)',
                                    color: '#B45309',
                                    flexShrink: 0,
                                  }}
                                >
                                  Excluded
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {item.type} &bull; Instant Liquid
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span
                            className="tabular-nums"
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: isIncluded ? 'var(--text-primary)' : 'var(--text-muted)',
                              opacity: isIncluded ? 1 : 0.65,
                            }}
                          >
                            {formatRupiah(item.estimatedValue)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAsset(item);
                            }}
                            style={{
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--primary)';
                              e.currentTarget.style.background = 'var(--primary-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Edit asset holding"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(item.id)}
                            style={{
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--rose)';
                              e.currentTarget.style.background = 'var(--rose-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Remove asset"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Tier 2 Hard Assets */}
            <div className="col-span-4 glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Landmark size={16} color="var(--amber)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>2. Hard Physical Assets</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Solvency anchors &amp; property</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="tabular-nums" style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatRupiah(filteredHardTotal)}
                  </span>
                  {displayedHardAssets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleColumnInclusion(displayedHardAssets)}
                      title={displayedHardAssets.every((a) => isAssetIncluded(a.id)) ? "Exclude all hard assets from Net Worth" : "Include all hard assets in Net Worth"}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: displayedHardAssets.every((a) => isAssetIncluded(a.id)) ? 'var(--text-muted)' : 'var(--primary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {displayedHardAssets.every((a) => isAssetIncluded(a.id)) ? 'Exclude All' : 'Include All'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!activeFilters.has('hard_appreciating') && !activeFilters.has('hard_depreciating') ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    Hard asset filters unchecked. Enable Appreciating or Depreciating above.
                  </div>
                ) : displayedHardAssets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    No matching hard physical assets found for current filter.
                  </div>
                ) : renderedHardAssets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    No hard physical assets match current card filter.
                  </div>
                ) : (
                  renderedHardAssets.map((item) => {
                    const isAppr = isAssetAppreciating(item);
                    const isIncluded = isAssetIncluded(item.id);
                    return (
                      <div
                        key={item.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={() => {
                          if (dragOverAssetId === item.id) setDragOverAssetId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDrop(item.id);
                        }}
                        onDragEnd={handleDragEnd}
                        style={{
                          background: draggedAssetId === item.id ? 'var(--bg-app)' : isIncluded ? '#FFFFFF' : '#F9FBFA',
                          border:
                            dragOverAssetId === item.id && draggedAssetId !== item.id
                              ? '2px dashed var(--primary)'
                              : isIncluded
                              ? '1px solid var(--border-light)'
                              : '1px dashed var(--border-medium)',
                          opacity: draggedAssetId === item.id ? 0.45 : isIncluded ? 1 : 0.72,
                          padding: '11px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s ease',
                          boxShadow: 'var(--shadow-xs)',
                          cursor: 'default',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div
                            style={{
                              cursor: 'grab',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px',
                              flexShrink: 0,
                            }}
                            title="Drag to change holding position"
                          >
                            <GripVertical size={14} />
                          </div>

                          {/* Individual card inclusion checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssetInclusion(item.id);
                            }}
                            title={isIncluded ? "Included in Net Worth (Click to exclude)" : "Excluded from Net Worth (Click to include)"}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: isIncluded ? 'none' : '1.5px solid var(--border-medium)',
                              background: isIncluded ? 'var(--emerald)' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: 0,
                              transition: 'all 0.15s ease',
                              boxShadow: isIncluded ? '0 1px 3px rgba(5, 150, 105, 0.25)' : 'none',
                            }}
                          >
                            {isIncluded && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </button>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: isIncluded ? 'var(--text-primary)' : 'var(--text-muted)',
                                  textDecoration: isIncluded ? 'none' : 'line-through',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.name}
                              </span>
                              {!isIncluded && (
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    background: 'rgba(217, 119, 6, 0.1)',
                                    color: '#B45309',
                                    flexShrink: 0,
                                  }}
                                >
                                  Excluded
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{item.type}</span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: isAppr ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                  color: isAppr ? 'var(--emerald)' : 'var(--amber)',
                                }}
                              >
                                {isAppr ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                <span>{isAppr ? 'Appreciating' : 'Depreciating'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span
                            className="tabular-nums"
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: isIncluded ? 'var(--text-primary)' : 'var(--text-muted)',
                              opacity: isIncluded ? 1 : 0.65,
                            }}
                          >
                            {formatRupiah(item.estimatedValue)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAsset(item);
                            }}
                            style={{
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--primary)';
                              e.currentTarget.style.background = 'var(--primary-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Edit asset holding"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(item.id)}
                            style={{
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--rose)';
                              e.currentTarget.style.background = 'var(--rose-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Remove asset"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Tier 3 Market Investments */}
            <div className="col-span-4 glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} color="var(--secondary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>3. Market Investments</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Growth assets &amp; securities</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="tabular-nums" style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--secondary)' }}>
                    {formatRupiah(filteredInvestmentTotal)}
                  </span>
                  {displayedInvestmentAssets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleColumnInclusion(displayedInvestmentAssets)}
                      title={displayedInvestmentAssets.every((a) => isAssetIncluded(a.id)) ? "Exclude all investment cards from Net Worth" : "Include all investment cards in Net Worth"}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: displayedInvestmentAssets.every((a) => isAssetIncluded(a.id)) ? 'var(--text-muted)' : 'var(--primary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {displayedInvestmentAssets.every((a) => isAssetIncluded(a.id)) ? 'Exclude All' : 'Include All'}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!activeFilters.has('market_stock') && !activeFilters.has('market_crypto') ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    Investment filters unchecked. Enable Stock or Crypto above.
                  </div>
                ) : displayedInvestmentAssets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    No matching investment holdings found for current filter.
                  </div>
                ) : renderedInvestmentAssets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-chip)', borderRadius: 'var(--radius-sm)' }}>
                    No investment holdings match current card filter.
                  </div>
                ) : (
                  renderedInvestmentAssets.map((item) => {
                    const isCrypto = isAssetCrypto(item);
                    const isIncluded = isAssetIncluded(item.id);
                    return (
                      <div
                        key={item.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={() => {
                          if (dragOverAssetId === item.id) setDragOverAssetId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDrop(item.id);
                        }}
                        onDragEnd={handleDragEnd}
                        style={{
                          background: draggedAssetId === item.id ? 'var(--bg-app)' : isIncluded ? '#FFFFFF' : '#F9FBFA',
                          border:
                            dragOverAssetId === item.id && draggedAssetId !== item.id
                              ? '2px dashed var(--primary)'
                              : isIncluded
                              ? '1px solid var(--border-light)'
                              : '1px dashed var(--border-medium)',
                          opacity: draggedAssetId === item.id ? 0.45 : isIncluded ? 1 : 0.72,
                          padding: '11px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s ease',
                          boxShadow: 'var(--shadow-xs)',
                          cursor: 'default',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div
                            style={{
                              cursor: 'grab',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2px',
                              flexShrink: 0,
                            }}
                            title="Drag to change holding position"
                          >
                            <GripVertical size={14} />
                          </div>

                          {/* Individual card inclusion checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssetInclusion(item.id);
                            }}
                            title={isIncluded ? "Included in Net Worth (Click to exclude)" : "Excluded from Net Worth (Click to include)"}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: isIncluded ? 'none' : '1.5px solid var(--border-medium)',
                              background: isIncluded ? 'var(--emerald)' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: 0,
                              transition: 'all 0.15s ease',
                              boxShadow: isIncluded ? '0 1px 3px rgba(5, 150, 105, 0.25)' : 'none',
                            }}
                          >
                            {isIncluded && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </button>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  color: isIncluded ? 'var(--text-primary)' : 'var(--text-muted)',
                                  textDecoration: isIncluded ? 'none' : 'line-through',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.name}
                              </span>
                              {!isIncluded && (
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    background: 'rgba(217, 119, 6, 0.1)',
                                    color: '#B45309',
                                    flexShrink: 0,
                                  }}
                                >
                                  Excluded
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                                {item.type}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: isCrypto ? 'rgba(124, 58, 237, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                                  color: isCrypto ? 'var(--purple)' : 'var(--secondary)',
                                }}
                              >
                                {isCrypto ? <Coins size={10} /> : <LineChart size={10} />}
                                <span>{isCrypto ? 'Crypto' : 'Stock'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span
                            className="tabular-nums"
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: isIncluded ? 'var(--text-primary)' : 'var(--text-muted)',
                              opacity: isIncluded ? 1 : 0.65,
                            }}
                          >
                            {formatRupiah(item.estimatedValue)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAsset(item);
                            }}
                            style={{
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--primary)';
                              e.currentTarget.style.background = 'var(--primary-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Edit asset holding"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(item.id)}
                            style={{
                              color: 'var(--text-muted)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--rose)';
                              e.currentTarget.style.background = 'var(--rose-light)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'transparent';
                            }}
                            title="Remove asset"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SNAPSHOTS & VALUATION HISTORY (Split View 5 + 7) */}
      {activeView === 'snapshots' && (
        <div className="bento-grid" style={{ alignItems: 'start' }}>
          {/* Left Column: Growth Chart (Sticky) */}
          <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '88px' }}>
            <AssetGrowthLineChart
              snapshots={effectiveSnapshots}
              getValue={getSnapshotFilteredValue}
              filterLabel={isFiltered ? `Filtered (${visibleAssetsCount} holdings)` : 'All Asset Classes'}
              onOpenSnapshotModal={handleOpenNewSnapshot}
            />

            <div
              className="glass"
              style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                background: '#FFFFFF',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={16} color="var(--primary)" />
                <span>Valuation Discipline Recommendation</span>
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Record portfolio valuations on a regular schedule (e.g. at month-end or paydays). This objectively captures long-term wealth momentum without emotional daily market noise.
              </p>
              <button
                onClick={handleOpenNewSnapshot}
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '9px 14px',
                  fontSize: '12px',
                }}
              >
                <PlusCircle size={15} />
                Record Valuation Now
              </button>
            </div>
          </div>

          {/* Right Column: Timeline Cards */}
          <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              className="glass"
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                background: '#FFFFFF',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Valuation Snapshot Timeline
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Historical balance sheet records over time ({sortedSnapshotsDesc.length} logs)
                </p>
              </div>
            </div>

            {sortedSnapshotsDesc.length === 0 ? (
              <div
                className="glass"
                style={{
                  padding: '40px 24px',
                  borderRadius: 'var(--radius-lg)',
                  background: '#FFFFFF',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    No Valuation Snapshots Recorded
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '320px' }}>
                    Start logging periodic asset valuations to visualize your net worth trajectory over time.
                  </p>
                </div>
                <button onClick={handleOpenNewSnapshot} className="btn-primary" style={{ marginTop: '4px' }}>
                  <PlusCircle size={15} />
                  Record First Valuation
                </button>
              </div>
            ) : (
              sortedSnapshotsDesc.map((snap, idx) => {
                const previousSnap = sortedSnapshotsDesc[idx + 1];
                let deltaAmount = 0;
                let deltaPercent = 0;
                let hasPrevious = false;

                if (previousSnap) {
                  hasPrevious = true;
                  deltaAmount = snap.totalNetWorth - previousSnap.totalNetWorth;
                  deltaPercent =
                    previousSnap.totalNetWorth > 0
                      ? (deltaAmount / previousSnap.totalNetWorth) * 100
                      : 0;
                }

                const isPositive = deltaAmount >= 0;

                return (
                  <div
                    key={snap.id}
                    className="glass"
                    style={{
                      padding: '18px 20px',
                      borderRadius: 'var(--radius-lg)',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 2px 8px rgba(24, 47, 36, 0.04)',
                    }}
                  >
                    {/* Top Row: Date, Notes & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                          }}
                        >
                          <Calendar size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {formatDateEn(snap.snapshotDate)}
                          </div>
                          {snap.notes && (
                            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <MessageSquare size={12} color="var(--text-muted)" />
                              <span>{snap.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditSnapshot(snap)}
                          title="Edit valuation entry"
                          style={{
                            background: 'var(--bg-chip)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                          }}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveSnapshot(snap.id)}
                          title="Delete valuation entry"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Net Worth & Delta */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-chip)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Recorded Net Worth
                        </span>
                        <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {formatRupiah(snap.totalNetWorth)}
                        </div>
                      </div>

                      {hasPrevious ? (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            vs Previous Valuation
                          </span>
                          <div
                            className="tabular-nums"
                            style={{
                              fontSize: '12.5px',
                              fontWeight: 800,
                              color: isPositive ? 'var(--emerald)' : 'var(--rose)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              justifyContent: 'flex-end',
                              marginTop: '2px',
                            }}
                          >
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {isPositive ? '+' : ''}{formatRupiah(deltaAmount)} ({isPositive ? '+' : ''}{deltaPercent.toFixed(1)}%)
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: '#FFFFFF',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          Baseline Record
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Breakdown Pills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
                      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', padding: '8px 10px', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Liquid Cash</span>
                        <strong className="tabular-nums" style={{ color: 'var(--emerald)' }}>{formatRupiah(snap.totalCash)}</strong>
                      </div>
                      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', padding: '8px 10px', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Hard Assets</span>
                        <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatRupiah(snap.totalHard)}</strong>
                      </div>
                      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', padding: '8px 10px', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Investments</span>
                        <strong className="tabular-nums" style={{ color: 'var(--secondary)' }}>{formatRupiah(snap.totalInvestment)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Snapshot Modal */}
      <AssetSnapshotModal
        isOpen={isSnapshotModalOpen}
        onClose={() => {
          setIsSnapshotModalOpen(false);
          setEditingSnapshot(null);
        }}
        editingSnapshot={editingSnapshot}
      />

      {/* Edit Asset Modal */}
      {editingAsset && (
        <AddAssetModal
          isOpen={Boolean(editingAsset)}
          onClose={() => setEditingAsset(null)}
          assetToEdit={editingAsset}
        />
      )}
    </div>
  );
};
