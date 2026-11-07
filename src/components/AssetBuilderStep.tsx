import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AssetItem } from '../types';
import {
  ASSET_CATEGORIES,
  AssetCategoryDefinition,
  getCategoryById,
  getCategoryByAsset,
} from '../utils/assetCategories';
import { CurrencyInput } from './CurrencyInput';
import { CustomSelect } from './CustomSelect';
import { formatRupiah } from '../utils/financialCalculations';
import {
  Coins,
  Trash2,
  Plus,
  Layers,
  X,
} from 'lucide-react';

interface AssetBuilderStepProps {
  assets: AssetItem[];
  onChange: (assets: AssetItem[]) => void;
}

export const AssetBuilderStep: React.FC<AssetBuilderStepProps> = ({ assets, onChange }) => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_cash_buffer');
  const [instrumentType, setInstrumentType] = useState<string>('Bank Checking / Savings');
  const [assetName, setAssetName] = useState<string>('');
  const [assetValue, setAssetValue] = useState<number | ''>('');
  const [formError, setFormError] = useState<string>('');

  const currentCategory: AssetCategoryDefinition = getCategoryById(selectedCategoryId);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
        setFormError('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Switch category and update default instrument type
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const cat = getCategoryById(categoryId);
    if (cat.instruments.length > 0) {
      setInstrumentType(cat.instruments[0]);
    }
    setFormError('');
  };

  // Add asset to the list
  const handleAddAsset = () => {
    const trimmedName = assetName.trim();
    if (!trimmedName) {
      setFormError('Asset name is required (e.g., Primary Bank Account, Gold Bullion 10g)');
      return;
    }

    const numericVal = typeof assetValue === 'number' ? assetValue : 0;
    if (numericVal <= 0) {
      setFormError('Asset estimated value must be greater than 0');
      return;
    }

    const newAsset: AssetItem = {
      id: `ast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: trimmedName,
      assetClass: currentCategory.assetClass,
      type: instrumentType || currentCategory.instruments[0] || 'Asset',
      estimatedValue: numericVal,
      liquidityTier: currentCategory.liquidityTier,
      riskLevel: currentCategory.riskLevel,
    };

    onChange([...assets, newAsset]);

    // Reset input fields & close modal
    setAssetName('');
    setAssetValue('');
    setFormError('');
    setIsModalOpen(false);
  };

  // Remove asset
  const handleRemoveAsset = (id: string) => {
    onChange(assets.filter((a) => a.id !== id));
  };

  // Calculations
  const totalNetWorth = assets.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
  const totalCash = assets
    .filter((a) => a.assetClass === 'cash_equivalent')
    .reduce((sum, a) => sum + a.estimatedValue, 0);
  const totalHard = assets
    .filter((a) => a.assetClass === 'hard_asset_movable' || a.assetClass === 'hard_asset_immovable')
    .reduce((sum, a) => sum + a.estimatedValue, 0);
  const totalInvestment = assets
    .filter((a) => a.assetClass === 'investment')
    .reduce((sum, a) => sum + a.estimatedValue, 0);

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        minHeight: '100%',
      }}
    >
      {/* Live Net Worth Summary Card */}
      <div
        style={{
          padding: '16px 18px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(72,176,125,0.12) 0%, rgba(58,160,111,0.06) 100%)',
          border: '1.5px solid rgba(72,176,125,0.3)',
          boxShadow: '0 4px 14px rgba(72,176,125,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Estimated Total Net Worth
            </span>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'Outfit, sans-serif',
                marginTop: '2px',
              }}
              className="tabular-nums"
            >
              {formatRupiah(totalNetWorth)}
            </div>
          </div>
          <div
            style={{
              padding: '6px 12px',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            {assets.length} Holdings
          </div>
        </div>

        {/* Tier Subtotals */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed rgba(72,176,125,0.3)',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>🟢 Cash Buffer</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }} className="tabular-nums">
              {formatRupiah(totalCash)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>🟠 Hard Assets</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }} className="tabular-nums">
              {formatRupiah(totalHard)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>🟣 Investments</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', marginTop: '2px' }} className="tabular-nums">
              {formatRupiah(totalInvestment)}
            </div>
          </div>
        </div>
      </div>

      {/* Asset List Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} color="var(--primary)" />
            Recorded Asset Holdings ({assets.length})
          </h4>
        </div>

        {assets.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1.5px dashed var(--border-light)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Coins size={22} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Assets Added Yet
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '300px', margin: '4px auto 0', lineHeight: '1.45' }}>
                Click below to add cash accounts, gold, vehicles, property, or investment portfolios.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                marginTop: '4px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12.5px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(72,176,125,0.25)',
              }}
            >
              <Plus size={15} strokeWidth={2.8} />
              Add First Holding
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assets.map((asset) => {
              const cat = getCategoryByAsset(asset.assetClass, asset.type);
              return (
                <div
                  key={asset.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border-light)',
                    borderLeft: `4px solid ${cat.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1px 7px',
                          borderRadius: 'var(--radius-full)',
                          background: cat.bgColor,
                          color: cat.color,
                        }}
                      >
                        {cat.shortLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 7px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-chip)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {asset.type}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: 'Outfit, sans-serif',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {asset.name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        fontFamily: 'Outfit, sans-serif',
                        textAlign: 'right',
                      }}
                      className="tabular-nums"
                    >
                      {formatRupiah(asset.estimatedValue)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(asset.id)}
                      title="Remove this asset"
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--rose)';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div
        style={{
          position: 'sticky',
          bottom: '8px',
          alignSelf: 'flex-end',
          zIndex: 40,
          marginTop: 'auto',
          paddingTop: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Add New Asset Holding"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(72, 176, 125, 0.4), 0 2px 6px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(72, 176, 125, 0.5), 0 4px 8px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(72, 176, 125, 0.4), 0 2px 6px rgba(0, 0, 0, 0.06)';
          }}
        >
          <Plus size={17} strokeWidth={2.8} />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Modal Add Asset */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="animate-fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 99999,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                setFormError('');
              }
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-light)',
                  borderTopLeftRadius: 'var(--radius-xl)',
                  borderTopRightRadius: 'var(--radius-xl)',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <Plus size={18} strokeWidth={2.6} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Add Asset Holding
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Record a new holding to your balance sheet
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  overflow: 'visible',
                  position: 'relative',
                  zIndex: 20,
                }}
              >
                {/* 1. Asset Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Asset Name / Account
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => {
                      setAssetName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. Primary Checking Account, Gold Bullion 10g"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-chip)',
                      border: '1.5px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                      fontFamily: 'Outfit, sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 2. Asset Category */}
                <div>
                  <CustomSelect
                    label="Asset Category"
                    value={selectedCategoryId}
                    onChange={handleCategoryChange}
                    options={ASSET_CATEGORIES.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                  />
                </div>

                {/* 3. Instrument Type */}
                <div>
                  <CustomSelect
                    label="Instrument Classification"
                    value={instrumentType}
                    onChange={(val) => {
                      setInstrumentType(val);
                      if (formError) setFormError('');
                    }}
                    options={currentCategory.instruments.map((inst) => ({
                      value: inst,
                      label: inst,
                    }))}
                  />
                </div>

                {/* 4. Asset Value */}
                <div>
                  <CurrencyInput
                    label="Estimated Value"
                    value={assetValue}
                    onChange={(val) => {
                      setAssetValue(val);
                      if (formError) setFormError('');
                    }}
                    placeholder="0"
                    prefix="Rp"
                  />
                </div>

                {formError && (
                  <div style={{ fontSize: '12px', color: 'var(--rose)', fontWeight: 600, padding: '4px 0' }}>
                    ⚠️ {formError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border-light)',
                  borderBottomLeftRadius: 'var(--radius-xl)',
                  borderBottomRightRadius: 'var(--radius-xl)',
                  background: 'var(--bg-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError('');
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddAsset}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(72,176,125,0.25)',
                  }}
                >
                  <Plus size={16} strokeWidth={2.6} />
                  Save Holding
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
