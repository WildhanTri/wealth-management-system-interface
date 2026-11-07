import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { calculateFinancials, formatRupiah } from '../../utils/financialCalculations';
import { addToQuarantine, cancelImpulseItem, confirmPurchaseItem } from '../../store/slices/decisionSlice';
import { addTransaction } from '../../store/slices/transactionSlice';
import { apiService } from '../../services/apiService';
import confetti from 'canvas-confetti';
import { Sparkles, Clock, AlertCircle, CheckCircle2, HelpCircle, ArrowRight, Check } from 'lucide-react';
import { QuarantineItem, TransactionItem } from '../../types';
import { CustomSelect } from '../CustomSelect';
import { CurrencyInput } from '../CurrencyInput';

export const SmartBuddyTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.user.profile);
  const assets = useAppSelector((state) => state.asset.items);
  const transactions = useAppSelector((state) => state.transaction.items);
  const quarantineItems = useAppSelector((state) => state.decision.quarantineItems);
  const savedMoneyTotal = useAppSelector((state) => state.decision.savedMoneyTotal);
  const preventedCount = useAppSelector((state) => state.decision.preventedCount);

  const fin = calculateFinancials(profile, assets, transactions);

  // Form State
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemCategory, setItemCategory] = useState('Fashion');
  const [urgency, setUrgency] = useState<'wants' | 'productive' | 'emergency'>('wants');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const priceNum = typeof itemPrice === 'number' ? itemPrice : 0;
  const workHoursCost = priceNum > 0 ? Number((priceNum / fin.hourlyWage).toFixed(1)) : 0;
  const dailyImpact = priceNum > 0 ? Math.round(priceNum / 20) : 0;

  // Decision Status calculation
  let decisionStatus: 'safe' | 'caution' | 'danger' = 'safe';
  let decisionTitle = 'Safe to Buy (Affordable)';
  let decisionDesc = 'Your cash flow and emergency reserves remain secure. This purchase will not jeopardize essentials.';

  if (priceNum > fin.safeToSpendDaily * 10 || priceNum > fin.totalLiquidCash * 0.2) {
    decisionStatus = 'danger';
    decisionTitle = 'High Impulse Risk (Excessive Outflow)';
    decisionDesc = `This item represents a substantial portion of your liquid cash (${formatRupiah(fin.totalLiquidCash)}). A 48-hour cooling quarantine is strongly recommended.`;
  } else if (priceNum > fin.safeToSpendDaily * 3) {
    decisionStatus = 'caution';
    decisionTitle = 'Caution (Stretch Budget)';
    decisionDesc = `Affordable, but it will reduce your daily Safe-to-Spend allowance by ${formatRupiah(dailyImpact)}/day through month-end.`;
  }

  // Trigger celebration on cancel
  const handleCancelImpulse = (id: string, name: string, price: number) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    dispatch(cancelImpulseItem({ id, savedAmount: price }));
    apiService.resolveQuarantineItem(id, 'prevented').catch(console.warn);

    setSuccessMessage(`Awesome! You successfully safeguarded ${formatRupiah(price)} by skipping "${name}"!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleInstantRejectFromForm = () => {
    if (!itemName || !priceNum) return;
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });
    const fakeId = `calc-${Date.now()}`;
    dispatch(cancelImpulseItem({ id: fakeId, savedAmount: priceNum }));

    setSuccessMessage(`Great job! You decided against buying "${itemName}" and preserved ${formatRupiah(priceNum)} to your Saved Wealth Jar! 🎉`);
    setItemName('');
    setItemPrice('');
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  const handleAddToQuarantine = () => {
    if (!itemName || !priceNum) return;
    const newItem: QuarantineItem = {
      id: `qr-${Date.now()}`,
      name: itemName,
      price: priceNum,
      category: itemCategory,
      createdAt: Date.now(),
      quarantineUntil: Date.now() + 48 * 3600 * 1000,
      workHoursCost,
      dailyS2SImpact: dailyImpact,
      urgency,
    };

    apiService
      .createQuarantineItem({
        name: itemName,
        price: priceNum,
        category: itemCategory,
        urgency,
      })
      .then((res) => {
        if (res.success && res.data) {
          dispatch(addToQuarantine({ ...newItem, id: res.data.id }));
        } else {
          dispatch(addToQuarantine(newItem));
        }
      })
      .catch((err) => {
        console.error('Failed to add quarantine via API:', err);
        dispatch(addToQuarantine(newItem));
      });

    setSuccessMessage(`"${itemName}" has been placed in 48-Hour Cooling Quarantine. Allow dopamine levels to stabilize before deciding!`);
    setItemName('');
    setItemPrice('');
    setTimeout(() => setSuccessMessage(null), 4500);
  };

  const handleConfirmPurchase = (item: QuarantineItem) => {
    dispatch(confirmPurchaseItem(item.id));
    apiService.resolveQuarantineItem(item.id, 'purchased').catch(console.warn);

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      title: item.name,
      amount: item.price,
      category: item.category,
      date: new Date().toISOString().split('T')[0],
      emotionalTrigger: 'Need',
      isImpulse: false,
    };
    dispatch(addTransaction(newTx));

    setSuccessMessage(`"${item.name}" has been confirmed and logged into your cash flow ledger.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="tab-pane animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header Banner */}
      <div
        className="glass"
        style={{
          padding: '24px 28px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF8F3 100%)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '20px',
                letterSpacing: '0.5px',
              }}
            >
              PRE-PURCHASE DECISION ENGINE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Affordability &amp; Life Energy Valuation
            </span>
          </div>
          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 800 }}>
            SmartBuddy: Should I Buy?
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
            Evaluate affordability before checkout. The engine translates purchase costs into{' '}
            <strong style={{ color: 'var(--text-primary)' }}>real working hours</strong> and calculates their direct impact on your daily safe spending limit.
          </p>
        </div>

        <div
          style={{
            background: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'right',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Your Hourly Life Energy Rate:</span>
          <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
            {formatRupiah(fin.hourlyWage)}/hr
          </div>
          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
            Safe-to-Spend: <strong className="tabular-nums">{formatRupiah(fin.safeToSpendDaily)}/day</strong>
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          className="animate-scale-in"
          style={{
            padding: '14px 18px',
            background: 'var(--primary-light)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Sparkles size={20} color="var(--primary)" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Two-Column Workbench (5 + 7) */}
      <div className="bento-grid" style={{ alignItems: 'start' }}>
        {/* Left Column: Form & Live Preview (Sticky) */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '88px' }}>
          <div
            className="glass"
            style={{
              padding: '22px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💡</span>
              <span>Evaluate Purchase Feasibility</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Item / Planned Purchase Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Designer Sneakers, Wireless Earbuds, Viral Coffee Machine..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--bg-chip)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <CurrencyInput
                  label="Estimated Price"
                  placeholder="e.g. 750,000"
                  value={itemPrice}
                  onChange={(val) => setItemPrice(val)}
                  prefix="Rp"
                />

                <div>
                  <CustomSelect
                    label="Category"
                    value={itemCategory}
                    onChange={(val) => setItemCategory(val)}
                    options={[
                      { value: 'Fashion', label: 'Fashion & Apparel', badge: 'Style' },
                      { value: 'Gadget', label: 'Gadgets & Tech', badge: 'Tech' },
                      { value: 'F&B', label: 'F&B & Dining', badge: 'Dining' },
                      { value: 'Hobi', label: 'Hobbies & Gaming', badge: 'Play' },
                      { value: 'Kebutuhan Rumah', label: 'Home & Living', badge: 'Living' },
                      { value: 'Lainnya', label: 'Other Purchases', badge: 'General' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Urgency Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setUrgency('wants')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      border: `1px solid ${urgency === 'wants' ? 'var(--rose)' : 'var(--border-light)'}`,
                      background: urgency === 'wants' ? 'var(--rose-light)' : 'var(--bg-chip)',
                      color: urgency === 'wants' ? 'var(--rose)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Discretionary / Want
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('productive')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      border: `1px solid ${urgency === 'productive' ? 'var(--primary)' : 'var(--border-light)'}`,
                      background: urgency === 'productive' ? 'var(--primary-light)' : 'var(--bg-chip)',
                      color: urgency === 'productive' ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Productive
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('emergency')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      border: `1px solid ${urgency === 'emergency' ? 'var(--amber)' : 'var(--border-light)'}`,
                      background: urgency === 'emergency' ? 'var(--amber-light)' : 'var(--bg-chip)',
                      color: urgency === 'emergency' ? 'var(--amber)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Urgent
                  </button>
                </div>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            {priceNum > 0 && (
              <div
                className="animate-scale-in"
                style={{
                  marginTop: '18px',
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background:
                    decisionStatus === 'danger'
                      ? 'rgba(244, 63, 94, 0.08)'
                      : decisionStatus === 'caution'
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${
                    decisionStatus === 'danger'
                      ? 'rgba(244, 63, 94, 0.25)'
                      : decisionStatus === 'caution'
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'rgba(16, 185, 129, 0.25)'
                  }`,
                }}
              >
                {/* Status Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {decisionStatus === 'danger' && <AlertCircle size={18} color="var(--rose)" />}
                  {decisionStatus === 'caution' && <HelpCircle size={18} color="var(--amber)" />}
                  {decisionStatus === 'safe' && <CheckCircle2 size={18} color="var(--emerald)" />}
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color:
                        decisionStatus === 'danger'
                          ? 'var(--rose)'
                          : decisionStatus === 'caution'
                          ? 'var(--amber)'
                          : 'var(--emerald)',
                    }}
                  >
                    {decisionTitle}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                  {decisionDesc}
                </p>

                {/* Metrics Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Sweat Working Hours:</span>
                    <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      ⏳ {workHoursCost} Work Hours
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Equates to ~{(workHoursCost / 8).toFixed(1)} full workdays
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Daily Allowance Impact:</span>
                    <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--rose)', marginTop: '2px' }}>
                      -{formatRupiah(dailyImpact)} /day
                    </div>
                    <span className="tabular-nums" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Remaining: {formatRupiah(Math.max(0, fin.safeToSpendDaily - dailyImpact))}
                    </span>
                  </div>
                </div>

                {/* Action Buttons for this item */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                  <button
                    onClick={handleAddToQuarantine}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--primary-light)',
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Clock size={14} color="var(--primary)" />
                    48-Hour Quarantine
                  </button>

                  <button
                    onClick={handleInstantRejectFromForm}
                    className="btn-primary"
                    style={{
                      padding: '10px 12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={14} />
                    Skip It! (+Saved Jar)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 48-Hour Cooling Wishlist Board */}
        <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="glass"
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Clock size={18} color="var(--primary)" />
                  48-Hour Cooling Quarantine ({quarantineItems.length})
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Pause impulse dopamine spikes for 48 hours to make conscious, rational spending choices.
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                }}
              >
                {quarantineItems.length} Awaiting Decision
              </span>
            </div>

            {quarantineItems.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '44px 20px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--bg-chip)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-medium)',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Clock size={20} />
                </div>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  No items in cooling quarantine
                </h4>
                <p style={{ fontSize: '12px', maxWidth: '340px', lineHeight: 1.5 }}>
                  Use the evaluation form on the left whenever you feel tempted to purchase non-essential goods to test their feasibility.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quarantineItems.map((item) => {
                  const remainingMs = Math.max(0, item.quarantineUntil - Date.now());
                  const remainingHours = Math.floor(remainingMs / (3600 * 1000));
                  const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));

                  return (
                    <div
                      key={item.id}
                      className="glass"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {item.name}
                            </h4>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'var(--bg-chip)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-light)',
                              }}
                            >
                              {item.category}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Working hours cost: <strong style={{ color: 'var(--text-primary)' }}>{item.workHoursCost} hours of life energy</strong>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {formatRupiah(item.price)}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--amber)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: '2px',
                              fontWeight: 700,
                              background: 'var(--amber-light)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            <Clock size={11} />
                            Left: {remainingHours}h {remainingMins}m
                          </div>
                        </div>
                      </div>

                      {/* Actions for this quarantined item */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid var(--border-light)',
                        }}
                      >
                        <button
                          onClick={() => handleCancelImpulse(item.id, item.name, item.price)}
                          style={{
                            padding: '8px 14px',
                            background: 'var(--primary-light)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Sparkles size={13} />
                          Skip Purchase (+Saved Wealth)
                        </button>

                        <button
                          onClick={() => handleConfirmPurchase(item)}
                          style={{
                            padding: '8px 14px',
                            background: '#FFFFFF',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Proceed to Buy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
