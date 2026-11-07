import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch } from '../store';
import { addAsset, updateAsset } from '../store/slices/assetSlice';
import { X, Layers, Check, TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { AssetClass, AssetItem, LiquidityTier } from '../types';
import { apiService } from '../services/apiService';
import { CustomSelect } from './CustomSelect';
import { CurrencyInput } from './CurrencyInput';
import { ASSET_CATEGORIES, getCategoryById, getCategoryByAsset } from '../utils/assetCategories';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: AssetItem | null;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, assetToEdit }) => {
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('cat_cash_buffer');
  const [assetClass, setAssetClass] = useState<AssetClass>('cash_equivalent');
  const [type, setType] = useState('Bank Checking / Savings');
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('');
  const [liquidityTier, setLiquidityTier] = useState<LiquidityTier>('instant_liquid');
  const [riskLevel, setRiskLevel] = useState<'very_low' | 'low' | 'medium' | 'high'>('very_low');
  const [appreciationType, setAppreciationType] = useState<'appreciating' | 'depreciating'>('appreciating');

  useEffect(() => {
    if (assetToEdit) {
      setName(assetToEdit.name);
      setAssetClass(assetToEdit.assetClass);
      setType(assetToEdit.type);
      setEstimatedValue(assetToEdit.estimatedValue);
      setLiquidityTier(assetToEdit.liquidityTier);
      setRiskLevel(assetToEdit.riskLevel);
      const rawAppType = String(assetToEdit.appreciationType || '').toLowerCase().trim();
      setAppreciationType(
        rawAppType === 'depreciating'
          ? 'depreciating'
          : rawAppType === 'appreciating'
          ? 'appreciating'
          : assetToEdit.type.toLowerCase().includes('vehicle') ||
            assetToEdit.type.toLowerCase().includes('motor') ||
            assetToEdit.name.toLowerCase().includes('mobil') ||
            assetToEdit.name.toLowerCase().includes('brio') ||
            assetToEdit.name.toLowerCase().includes('laptop') ||
            assetToEdit.name.toLowerCase().includes('pc') ||
            assetToEdit.name.toLowerCase().includes('ally') ||
            assetToEdit.name.toLowerCase().includes('iphone') ||
            assetToEdit.name.toLowerCase().includes('samsung')
          ? 'depreciating'
          : 'appreciating'
      );
      const cat = getCategoryByAsset(assetToEdit.assetClass, assetToEdit.type);
      setCategory(cat.id);
    } else {
      setName('');
      setCategory('cat_cash_buffer');
      setAssetClass('cash_equivalent');
      setType('Bank Checking / Savings');
      setEstimatedValue('');
      setLiquidityTier('instant_liquid');
      setRiskLevel('very_low');
      setAppreciationType('appreciating');
    }
  }, [assetToEdit, isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const numericValue = typeof estimatedValue === 'number' ? estimatedValue : 0;
  const isEditing = Boolean(assetToEdit);
  const isHardAsset = assetClass === 'hard_asset_movable' || assetClass === 'hard_asset_immovable';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numericValue <= 0) return;

    if (isEditing && assetToEdit) {
      const updatedItem: AssetItem = {
        ...assetToEdit,
        name: name.trim(),
        assetClass,
        type,
        estimatedValue: numericValue,
        liquidityTier,
        riskLevel,
        appreciationType: isHardAsset ? appreciationType : undefined,
      };

      dispatch(updateAsset(updatedItem));

      apiService
        .updateAsset(assetToEdit.id, {
          name: updatedItem.name,
          assetClass: updatedItem.assetClass,
          type: updatedItem.type,
          estimatedValue: updatedItem.estimatedValue,
          liquidityTier: updatedItem.liquidityTier,
          riskLevel: updatedItem.riskLevel,
          appreciationType: updatedItem.appreciationType,
        })
        .then((res) => {
          if (res.success && res.data) {
            const returnedItem: AssetItem = {
              ...updatedItem,
              ...res.data,
              estimatedValue: Number(res.data.estimatedValue) || updatedItem.estimatedValue,
              appreciationType: res.data.appreciationType || updatedItem.appreciationType,
            };
            dispatch(updateAsset(returnedItem));
          }
        })
        .catch((err) => {
          console.error('Failed to update asset via API:', err);
        });

      onClose();
      return;
    }

    // Creating new asset
    const newAsset: AssetItem = {
      id: `ast-${Date.now()}`,
      name: name.trim(),
      assetClass,
      type,
      estimatedValue: numericValue,
      liquidityTier,
      riskLevel,
      appreciationType: isHardAsset ? appreciationType : undefined,
    };

    apiService
      .createAsset({
        name: newAsset.name,
        assetClass: newAsset.assetClass,
        type: newAsset.type,
        estimatedValue: newAsset.estimatedValue,
        liquidityTier: newAsset.liquidityTier,
        riskLevel: newAsset.riskLevel,
        appreciationType: newAsset.appreciationType,
      })
      .then((res) => {
        if (res.success && res.data) {
          dispatch(addAsset(res.data));
        } else {
          dispatch(addAsset(newAsset));
        }
      })
      .catch((err) => {
        console.error('Failed to create asset via API:', err);
        dispatch(addAsset(newAsset));
      });

    // Reset and close
    setName('');
    setEstimatedValue('');
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 29, 22, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 48px rgba(24, 47, 36, 0.16)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                background: isEditing ? 'rgba(72, 176, 125, 0.14)' : 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isEditing ? <Edit3 size={17} color="var(--primary)" /> : <Layers size={17} color="var(--primary)" />}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isEditing ? 'Edit Asset Holding' : 'Add Asset Holding'}
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isEditing ? 'Update valuation and asset classification' : 'Record a new holding in your balance sheet'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">
              <span>Asset Name / Account Title</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Primary Checking Account, Gold Bullion 10g, BBRI Shares"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div>
            <CustomSelect
              label="Asset Category (5 Liquidity & Risk Tiers)"
              value={category}
              onChange={(catId) => {
                const cat = getCategoryById(catId);
                setCategory(catId);
                setAssetClass(cat.assetClass);
                setLiquidityTier(cat.liquidityTier);
                setRiskLevel(cat.riskLevel);
                if (cat.instruments.length > 0) {
                  setType(cat.instruments[0]);
                  if (cat.assetClass === 'hard_asset_movable' || cat.assetClass === 'hard_asset_immovable') {
                    setAppreciationType(
                      cat.instruments[0].toLowerCase().includes('vehicle') ? 'depreciating' : 'appreciating'
                    );
                  }
                }
              }}
              options={ASSET_CATEGORIES.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </div>

          <div>
            <CustomSelect
              label="Instrument Type"
              value={type}
              onChange={(val) => {
                setType(val);
                if (isHardAsset) {
                  if (val.toLowerCase().includes('vehicle') || val.toLowerCase().includes('motor')) {
                    setAppreciationType('depreciating');
                  } else {
                    setAppreciationType('appreciating');
                  }
                }
              }}
              options={getCategoryById(category).instruments.map((inst) => ({
                value: inst,
                label: inst,
              }))}
            />
          </div>

          {/* Hard Physical Asset Sub-Category: Appreciating vs Depreciating */}
          {isHardAsset && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Physical Asset Sub-Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setAppreciationType('appreciating')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: appreciationType === 'appreciating' ? '2px solid var(--emerald)' : '1px solid var(--border-light)',
                    background: appreciationType === 'appreciating' ? 'var(--emerald-light)' : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: appreciationType === 'appreciating' ? 'var(--emerald)' : 'var(--text-primary)' }}>
                    <TrendingUp size={15} color={appreciationType === 'appreciating' ? 'var(--emerald)' : 'var(--text-muted)'} />
                    <span>Appreciating</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    Real Estate, Land, Gold Bullion, Rare Collectibles
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppreciationType('depreciating')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: appreciationType === 'depreciating' ? '2px solid var(--amber)' : '1px solid var(--border-light)',
                    background: appreciationType === 'depreciating' ? 'var(--amber-light)' : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: appreciationType === 'depreciating' ? 'var(--amber)' : 'var(--text-primary)' }}>
                    <TrendingDown size={15} color={appreciationType === 'depreciating' ? 'var(--amber)' : 'var(--text-muted)'} />
                    <span>Depreciating</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                    Motor Vehicles, Gadgets, Machinery &amp; Equipment
                  </span>
                </button>
              </div>
            </div>
          )}

          <div>
            <CurrencyInput
              label="Estimated Market Value"
              placeholder="0"
              min={0}
              value={estimatedValue}
              onChange={(val) => setEstimatedValue(val)}
              prefix="Rp"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div>
              <CustomSelect<LiquidityTier>
                label="Liquidity Classification"
                value={liquidityTier}
                onChange={(val) => setLiquidityTier(val)}
                options={[
                  { value: 'instant_liquid', label: 'Cash / Instant Liquid' },
                  { value: 'marketable_semi_liquid', label: 'Marketable / Semi-Liquid' },
                  { value: 'illiquid', label: 'Illiquid (Physical / Real Estate)' },
                ]}
              />
            </div>

            <div>
              <CustomSelect<'very_low' | 'low' | 'medium' | 'high'>
                label="Risk Profile"
                value={riskLevel}
                onChange={(val) => setRiskLevel(val)}
                options={[
                  { value: 'very_low', label: 'Very Low' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Moderate' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            style={{
              padding: '13px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <Check size={18} />
            <span>{isEditing ? 'Save Changes' : 'Save Holding to Portfolio'}</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
