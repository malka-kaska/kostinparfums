import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, RefreshCw, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ScentMigrationManager = ({ token }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/scent-migration/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch migration status:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
    // Poll status every 3 seconds if migration is running
    const interval = setInterval(() => {
      if (status?.is_running) {
        fetchStatus();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus, status?.is_running]);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/scent-migration/start`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchStatus();
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to start migration');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/scent-migration/stop`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchStatus();
      }
    } catch (err) {
      setError('Failed to stop migration');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = status?.total_to_process > 0 
    ? Math.round((status.processed / status.total_to_process) * 100) 
    : 0;

  return (
    <div className="scent-migration-manager">
      <div className="section-header">
        <h3>Анализ на ароматни профили</h3>
        <button className="refresh-btn" onClick={fetchStatus} title="Refresh status">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="migration-info">
        <p className="info-text">
          Този инструмент използва AI за анализ на описанията на <strong>видимите продукти</strong> и автоматично присвоява ароматни профили 
          (сладки, свежи, цитрусови, дървесни и др.). Скритите продукти се пропускат.
        </p>
      </div>

      {status && (
        <div className="migration-stats">
          <div className="stat-card">
            <span className="stat-label">Видими продукти</span>
            <span className="stat-value">{status.db_stats?.total_visible || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">С профили</span>
            <span className="stat-value highlight">{status.db_stats?.with_profiles || 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Процент</span>
            <span className="stat-value">{status.db_stats?.percentage || 0}%</span>
          </div>
        </div>
      )}

      {status?.is_running && (
        <div className="migration-progress">
          <div className="progress-header">
            <span className="progress-label">
              <Loader size={16} className="spin" />
              Миграцията работи...
            </span>
            <span className="progress-count">
              {status.processed} / {status.total_to_process}
            </span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {status.last_product && (
            <div className="last-processed">
              <span className="last-label">Последен:</span>
              <span className="last-value">{status.last_product}</span>
            </div>
          )}
          {status.errors > 0 && (
            <div className="error-count">
              <AlertCircle size={14} />
              <span>{status.errors} грешки</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="migration-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="migration-actions">
        {!status?.is_running ? (
          <button 
            className="btn-primary start-btn"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? <Loader size={16} className="spin" /> : <Play size={16} />}
            <span>Стартирай анализ</span>
          </button>
        ) : (
          <button 
            className="btn-secondary stop-btn"
            onClick={handleStop}
            disabled={loading}
          >
            {loading ? <Loader size={16} className="spin" /> : <Square size={16} />}
            <span>Спри</span>
          </button>
        )}
      </div>

      {status?.db_stats?.percentage === 100 && (
        <div className="migration-complete">
          <CheckCircle size={20} />
          <span>Всички продукти са анализирани!</span>
        </div>
      )}

      <style>{`
        .scent-migration-manager {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 24px;
          margin-top: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .refresh-btn {
          background: none;
          border: 1px solid var(--border-light);
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .migration-info {
          margin-bottom: 20px;
        }

        .info-text {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .migration-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: var(--bg-primary);
          padding: 16px;
          border-radius: 6px;
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-value.highlight {
          color: var(--accent-gold, #c9a86c);
        }

        .migration-progress {
          background: var(--bg-primary);
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .progress-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--text-primary);
        }

        .progress-count {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .progress-bar-container {
          height: 8px;
          background: var(--border-light);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--accent-gold, #c9a86c);
          transition: width 0.3s ease;
        }

        .last-processed {
          margin-top: 12px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .last-label {
          margin-right: 8px;
        }

        .last-value {
          color: var(--text-primary);
        }

        .error-count {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 12px;
          color: #ef4444;
        }

        .migration-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #ef4444;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .migration-actions {
          display: flex;
          gap: 12px;
        }

        .start-btn, .stop-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .start-btn {
          background: var(--accent-gold, #c9a86c);
          color: white;
          border: none;
        }

        .start-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .stop-btn {
          background: none;
          border: 1px solid var(--border-light);
          color: var(--text-primary);
        }

        .stop-btn:hover:not(:disabled) {
          background: var(--bg-primary);
        }

        .start-btn:disabled, .stop-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .migration-complete {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 12px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 6px;
          color: #22c55e;
          font-size: 14px;
          font-weight: 500;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .migration-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ScentMigrationManager;
