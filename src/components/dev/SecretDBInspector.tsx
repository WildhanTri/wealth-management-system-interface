import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch } from '../../store';
import { setProfile } from '../../store/slices/userSlice';
import { setAssets } from '../../store/slices/assetSlice';
import { setTransactions } from '../../store/slices/transactionSlice';
import { setSnapshots } from '../../store/slices/snapshotSlice';
import { setQuarantineState } from '../../store/slices/decisionSlice';
import { setPlans } from '../../store/slices/planSlice';
import { initializeAppState } from '../../services/appInit';
import { apiService, ApiLogItem } from '../../services/apiService';
import {
  Database,
  Table as TableIcon,
  RotateCw,
  Download,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Activity,
  FileText,
} from 'lucide-react';

interface SecretDBInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_TABLES = [
  'api_logs',
  'assets',
  'transactions',
  'planned_expenses',
  'quarantine_items',
  'asset_snapshots',
  'user_profiles',
];

export const SecretDBInspector: React.FC<SecretDBInspectorProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<'tables' | 'apiLogs' | 'tools'>('apiLogs');
  const [selectedTable, setSelectedTable] = useState<string>('api_logs');
  const [tableData, setTableData] = useState<{ columns: string[]; values: any[][] }>({
    columns: [],
    values: [],
  });
  const [tableFilter, setTableFilter] = useState('');

  // API Logs tab state
  const [apiLogs, setApiLogs] = useState<ApiLogItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<ApiLogItem | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Load data on open
  useEffect(() => {
    if (isOpen) {
      loadApiLogs();
      loadSelectedTableData(selectedTable);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedTable) {
      loadSelectedTableData(selectedTable);
    }
  }, [isOpen, selectedTable]);

  useEffect(() => {
    if (isOpen && activeTab === 'apiLogs') {
      loadApiLogs();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  async function loadApiLogs() {
    setIsLoadingLogs(true);
    try {
      const res = await apiService.getApiLogs({ limit: 50 });
      if (res.success && res.data) {
        setApiLogs(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch api logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function loadSelectedTableData(tableName: string) {
    try {
      let rawItems: any[] = [];
      if (tableName === 'api_logs') {
        const res = await apiService.getApiLogs({ limit: 100 });
        rawItems = res.data || [];
      } else if (tableName === 'assets') {
        const res = await apiService.getAssets();
        rawItems = res.data || [];
      } else if (tableName === 'transactions') {
        const res = await apiService.getTransactions();
        rawItems = res.data || [];
      } else if (tableName === 'planned_expenses') {
        const res = await apiService.getPlans();
        rawItems = res.data || [];
      } else if (tableName === 'quarantine_items') {
        const res = await apiService.getQuarantineItems();
        rawItems = res.data || [];
      } else if (tableName === 'asset_snapshots') {
        const res = await apiService.getSnapshots();
        rawItems = res.data || [];
      } else if (tableName === 'user_profiles') {
        const res = await apiService.getProfile();
        rawItems = res.data?.profile ? [res.data.profile] : [];
      }

      if (rawItems.length === 0) {
        setTableData({ columns: ['Notice'], values: [['No records found in PostgreSQL table']] });
        return;
      }

      const columns = Object.keys(rawItems[0]);
      const values = rawItems.map((item) =>
        columns.map((col) => {
          const val = item[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        })
      );

      setTableData({ columns, values });
    } catch (err) {
      console.error('Failed to load table data via API:', err);
    }
  }

  // Synchronize backend changes back to Redux so UI updates immediately
  async function handleSyncWithApp() {
    try {
      setSyncStatus('Synchronizing portfolio from PostgreSQL backend...');
      const data = await initializeAppState();
      if (data.isOnboarded && data.profile) {
        dispatch(setProfile(data.profile));
        dispatch(setTransactions(data.transactions));
        dispatch(setAssets(data.assets));
        dispatch(setSnapshots(data.snapshots || []));
        dispatch(setPlans(data.plannedExpenses || []));
        dispatch(
          setQuarantineState({
            quarantineItems: data.quarantineItems,
            savedMoneyTotal: data.savedMoneyTotal,
            preventedCount: data.preventedCount,
          })
        );
      }
      setSyncStatus('Synchronization successful!');
      setTimeout(() => setSyncStatus(null), 3000);
      loadSelectedTableData(selectedTable);
      loadApiLogs();
    } catch (e: any) {
      setSyncStatus('Sync error: ' + e.message);
    }
  }

  // Delete row via API
  async function handleDeleteRow(rowIdx: number) {
    const idIdx = tableData.columns.indexOf('id');
    if (idIdx === -1) {
      alert('Cannot delete row: no id column found');
      return;
    }

    const rowId = tableData.values[rowIdx][idIdx];
    if (!window.confirm(`Delete record with ID "${rowId}" from ${selectedTable}?`)) {
      return;
    }

    try {
      if (selectedTable === 'assets') await apiService.deleteAsset(rowId);
      else if (selectedTable === 'transactions') await apiService.deleteTransaction(rowId);
      else if (selectedTable === 'planned_expenses') await apiService.deletePlan(rowId);
      else if (selectedTable === 'quarantine_items') await apiService.deleteQuarantineItem(rowId);
      else if (selectedTable === 'asset_snapshots') await apiService.deleteSnapshot(rowId);
      else {
        alert('Deletion not supported for this table via inspector');
        return;
      }

      await handleSyncWithApp();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  }

  // Export JSON file
  async function handleExportJSON() {
    try {
      const data = await initializeAppState();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crescent_wealth_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Failed to export data: ' + e.message);
    }
  }

  // Filtered rows for explorer table
  const filteredRows = tableData.values.filter((row) => {
    if (!tableFilter) return true;
    return row.some((cell) =>
      String(cell || '').toLowerCase().includes(tableFilter.toLowerCase())
    );
  });

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 20, 15, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
        fontFamily: "'JetBrains Mono', -apple-system, monospace",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '86vh',
          backgroundColor: '#0F1713',
          border: '1px solid #1F382B',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#E0EAE3',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #1F382B',
            background: 'linear-gradient(90deg, #13221B 0%, #0F1713 100%)',
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
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
                  Crescent Studio
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    fontWeight: 700,
                  }}
                >
                  PostgreSQL &bull; Core API
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#88A393', margin: 0 }}>
                Live backend database inspector, API request logs &amp; data synchronizer
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleSyncWithApp}
              title="Synchronize live state with backend API"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#182C22',
                border: '1px solid #284736',
                color: '#34D399',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCw size={13} />
              <span>Sync with Backend</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#88A393',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sync notification pill */}
        {syncStatus && (
          <div
            style={{
              padding: '6px 16px',
              background: '#13281E',
              borderBottom: '1px solid #1F382B',
              fontSize: '11px',
              color: '#34D399',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle size={13} />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Sub-Header Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #1F382B',
            background: '#0B120F',
            padding: '0 16px',
          }}
        >
          <button
            onClick={() => setActiveTab('apiLogs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'apiLogs' ? '#34D399' : '#88A393',
              borderBottom: activeTab === 'apiLogs' ? '2px solid #34D399' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Activity size={14} />
            <span>API Request Logs ({apiLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'tables' ? '#34D399' : '#88A393',
              borderBottom: activeTab === 'tables' ? '2px solid #34D399' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <TableIcon size={14} />
            <span>PostgreSQL Tables</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'tools' ? '#34D399' : '#88A393',
              borderBottom: activeTab === 'tools' ? '2px solid #34D399' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            <Download size={14} />
            <span>Export &bull; Tools</span>
          </button>
        </div>

        {/* MAIN BODY: 1. API LOGS TAB */}
        {activeTab === 'apiLogs' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Logs List (Left 45%) */}
            <div
              style={{
                width: '45%',
                borderRight: '1px solid #1F382B',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #1F382B',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#111D16',
                }}
              >
                <span style={{ fontSize: '11px', color: '#88A393', fontWeight: 600 }}>
                  Recent HTTP Invocations ({apiLogs.length})
                </span>
                <button
                  onClick={loadApiLogs}
                  disabled={isLoadingLogs}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#34D399',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCw size={11} className={isLoadingLogs ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {apiLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
                  const isError = log.statusCode >= 400;

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #16281E',
                        cursor: 'pointer',
                        background: isSelected ? '#162C20' : 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background:
                                log.method === 'GET'
                                  ? 'rgba(52, 211, 153, 0.2)'
                                  : log.method === 'POST'
                                  ? 'rgba(96, 165, 250, 0.2)'
                                  : log.method === 'PUT'
                                  ? 'rgba(251, 191, 36, 0.2)'
                                  : 'rgba(248, 113, 113, 0.2)',
                              color:
                                log.method === 'GET'
                                  ? '#34D399'
                                  : log.method === 'POST'
                                  ? '#60A5FA'
                                  : log.method === 'PUT'
                                  ? '#FBBF24'
                                  : '#F87171',
                            }}
                          >
                            {log.method}
                          </span>
                          <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>
                            {log.endpoint}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: isSuccess ? '#34D399' : isError ? '#F87171' : '#FBBF24',
                          }}
                        >
                          {log.statusCode}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#688575' }}>
                        <span>{log.durationMs}ms</span>
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Log Details Inspector (Right 55%) */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: '#0D1411' }}>
              {selectedLog ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#34D399', margin: '0 0 4px 0' }}>
                      {selectedLog.name}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#88A393' }}>
                      HTTP {selectedLog.statusCode} &bull; Latency: {selectedLog.durationMs}ms &bull; IP: {selectedLog.ipAddress || '127.0.0.1'}
                    </span>
                  </div>

                  {selectedLog.requestBody && (
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#60A5FA' }}>
                        Request Body (Payload):
                      </span>
                      <pre
                        style={{
                          background: '#070B09',
                          padding: '10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#C6D6CD',
                          overflowX: 'auto',
                          marginTop: '4px',
                        }}
                      >
                        {JSON.stringify(selectedLog.requestBody, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.responseBody && (
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#34D399' }}>
                        Response Body:
                      </span>
                      <pre
                        style={{
                          background: '#070B09',
                          padding: '10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#C6D6CD',
                          overflowX: 'auto',
                          marginTop: '4px',
                        }}
                      >
                        {JSON.stringify(selectedLog.responseBody, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.requestHeaders && (
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#FBBF24' }}>
                        Request Headers:
                      </span>
                      <pre
                        style={{
                          background: '#070B09',
                          padding: '10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#88A393',
                          overflowX: 'auto',
                          marginTop: '4px',
                        }}
                      >
                        {JSON.stringify(selectedLog.requestHeaders, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#688575' }}>
                  <FileText size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ fontSize: '12px', margin: 0 }}>Select an API log invocation on the left to inspect headers, request payload, and response payload recorded in PostgreSQL.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN BODY: 2. POSTGRESQL TABLES TAB */}
        {activeTab === 'tables' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Table Sidebar (Left 22%) */}
            <div
              style={{
                width: '220px',
                borderRight: '1px solid #1F382B',
                background: '#0B120F',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #1F382B' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#688575' }}>
                  PostgreSQL Tables
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {AVAILABLE_TABLES.map((tName) => {
                  const isSelected = selectedTable === tName;
                  return (
                    <button
                      key={tName}
                      onClick={() => setSelectedTable(tName)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: isSelected ? '#162C20' : 'transparent',
                        color: isSelected ? '#34D399' : '#A2B8AA',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderLeft: isSelected ? '3px solid #34D399' : '3px solid transparent',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ textTransform: 'lowercase' }}>{tName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table Content (Right) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid #1F382B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#111D16',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399' }}>
                    {selectedTable}
                  </span>
                  <span style={{ fontSize: '11px', color: '#88A393' }}>
                    ({filteredRows.length} rows)
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: '#070B09',
                    border: '1px solid #1F382B',
                    color: '#fff',
                    fontSize: '11px',
                    outline: 'none',
                    width: '180px',
                  }}
                />
              </div>

              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#0D1411', borderBottom: '1px solid #1F382B' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: '#88A393', width: '40px' }}>#</th>
                      {tableData.columns.map((col) => (
                        <th key={col} style={{ padding: '6px 10px', textAlign: 'left', color: '#88A393' }}>
                          {col}
                        </th>
                      ))}
                      <th style={{ padding: '6px 10px', textAlign: 'center', color: '#88A393', width: '40px' }}>Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #14221A',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        }}
                      >
                        <td style={{ padding: '6px 10px', color: '#688575' }}>{idx + 1}</td>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: '6px 10px',
                              whiteSpace: 'nowrap',
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: cell === 'NULL' ? '#52695C' : '#E0EAE3',
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteRow(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#F87171',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY: 3. EXPORT & TOOLS TAB */}
        {activeTab === 'tools' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#34D399', margin: '0 0 6px 0' }}>
                PostgreSQL Portfolio Data Backup
              </h3>
              <p style={{ fontSize: '12px', color: '#88A393', margin: '0 0 14px 0' }}>
                Download a complete JSON export of your financial portfolio directly from the PostgreSQL backend API.
              </p>
              <button
                onClick={handleExportJSON}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Download size={15} />
                <span>Download Portfolio Backup (.json)</span>
              </button>
            </div>

            <div style={{ borderTop: '1px solid #1F382B', paddingTop: '18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#60A5FA', margin: '0 0 6px 0' }}>
                API Health &amp; Connection Status
              </h3>
              <p style={{ fontSize: '12px', color: '#88A393', margin: '0 0 10px 0' }}>
                Backend: Express.js (Port 5000) &bull; Database: PostgreSQL (Port 5432, crescent_wealth_db)
              </p>
              <button
                onClick={handleSyncWithApp}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  background: '#162C20',
                  color: '#34D399',
                  border: '1px solid #284736',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RotateCw size={14} />
                <span>Verify Connection &amp; Refresh State</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};
