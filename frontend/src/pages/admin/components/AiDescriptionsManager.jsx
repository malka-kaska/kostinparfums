import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Loader, Play, Square, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AiDescriptionsManager = () => {
  const { lang } = useLanguage();
  const [languages, setLanguages] = useState(['bg', 'en']);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [limit, setLimit] = useState(50);
  const [starting, setStarting] = useState(false);
  const [status, setStatus] = useState(null);
  const pollRef = useRef(null);

  const txt = lang === 'bg' ? {
    title: 'AI генератор на продуктови описания',
    desc: 'Използва GPT-4o-mini за да напише богати, SEO-оптимизирани описания на продуктите. Помага на Google да разбере страниците ти по-добре и подобрява текст/HTML съотношението.',
    languages: 'Езици',
    langBg: 'Български',
    langEn: 'Английски',
    onlyMissing: 'Генерирай само липсващите (без пренаписване на съществуващи)',
    limit: 'Максимум продукти на един пуск',
    start: 'Стартирай генериране',
    stop: 'Спри',
    running: 'В момента върви...',
    processed: 'Обработени',
    total: 'Общо',
    errors: 'Грешки',
    current: 'Текущ продукт',
    done: 'Готово!',
    warningTitle: 'Внимание',
    warningText: 'Всяко генериране изразходва баланс от Emergent LLM ключа. При 100 продукта × 2 езика = ~200 API извиквания.',
  } : {
    title: 'AI Product Description Generator',
    desc: 'Uses GPT-4o-mini to write rich, SEO-friendly product descriptions. Helps Google better understand your pages and improves the text/HTML ratio.',
    languages: 'Languages',
    langBg: 'Bulgarian',
    langEn: 'English',
    onlyMissing: 'Only generate missing descriptions (do not overwrite existing)',
    limit: 'Max products per run',
    start: 'Start Generation',
    stop: 'Stop',
    running: 'In progress...',
    processed: 'Processed',
    total: 'Total',
    errors: 'Errors',
    current: 'Current product',
    done: 'Done!',
    warningTitle: 'Notice',
    warningText: 'Each generation consumes Emergent LLM key balance. 100 products × 2 languages = ~200 API calls.',
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai-descriptions/bulk/status`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Status fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleStart = async () => {
    if (!languages.length) {
      alert(lang === 'bg' ? 'Избери поне един език' : 'Select at least one language');
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-descriptions/bulk/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languages,
          only_missing: onlyMissing,
          limit,
        }),
      });
      if (res.ok) {
        fetchStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Start failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${API_URL}/api/ai-descriptions/bulk/stop`, {
        method: 'POST',
        credentials: 'include',
      });
      fetchStatus();
    } catch (err) {
      alert('Stop error: ' + err.message);
    }
  };

  const isRunning = !!status?.is_running;
  const progress = status && status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;

  return (
    <div className="ai-descriptions-manager" data-testid="ai-descriptions-manager">
      <div className="admin-section">
        <div className="admin-section-header">
          <h3><Wand2 size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> {txt.title}</h3>
        </div>
        <p className="section-description">{txt.desc}</p>

        <div className="ai-warning">
          <AlertCircle size={18} />
          <div>
            <strong>{txt.warningTitle}:</strong> {txt.warningText}
          </div>
        </div>

        <div className="ai-config">
          <div className="setting-row">
            <label>{txt.languages}</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={languages.includes('bg')}
                  onChange={(e) => {
                    setLanguages(prev => e.target.checked ? [...prev.filter(l => l !== 'bg'), 'bg'] : prev.filter(l => l !== 'bg'));
                  }}
                  disabled={isRunning}
                  data-testid="ai-lang-bg"
                />
                <span>{txt.langBg}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={languages.includes('en')}
                  onChange={(e) => {
                    setLanguages(prev => e.target.checked ? [...prev.filter(l => l !== 'en'), 'en'] : prev.filter(l => l !== 'en'));
                  }}
                  disabled={isRunning}
                  data-testid="ai-lang-en"
                />
                <span>{txt.langEn}</span>
              </label>
            </div>
          </div>

          <div className="setting-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={onlyMissing}
                onChange={(e) => setOnlyMissing(e.target.checked)}
                disabled={isRunning}
                data-testid="ai-only-missing"
              />
              <span>{txt.onlyMissing}</span>
            </label>
          </div>

          <div className="setting-row">
            <label>{txt.limit}</label>
            <input
              type="number"
              min="1"
              max="500"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10) || 50)}
              disabled={isRunning}
              data-testid="ai-limit-input"
              style={{ maxWidth: '160px' }}
            />
          </div>

          <div className="ai-actions">
            {!isRunning ? (
              <button
                className="btn-primary"
                onClick={handleStart}
                disabled={starting}
                data-testid="ai-start-btn"
              >
                {starting ? <Loader size={16} className="spinning" /> : <Play size={16} />}
                <span>{starting ? '...' : txt.start}</span>
              </button>
            ) : (
              <button
                className="btn-danger"
                onClick={handleStop}
                data-testid="ai-stop-btn"
              >
                <Square size={16} />
                <span>{txt.stop}</span>
              </button>
            )}
          </div>
        </div>

        {status && (status.processed > 0 || isRunning) && (
          <div className="ai-status" data-testid="ai-status">
            <div className="ai-status-header">
              {isRunning ? (
                <>
                  <Loader size={16} className="spinning" />
                  <span>{txt.running}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} style={{ color: '#28a745' }} />
                  <span>{txt.done}</span>
                </>
              )}
            </div>
            <div className="ai-progress-bar">
              <div className="ai-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="ai-stats">
              <div><strong>{status.processed}</strong> / <strong>{status.total}</strong> {txt.processed}</div>
              {status.errors > 0 && <div style={{ color: '#c0392b' }}>{txt.errors}: {status.errors}</div>}
              {isRunning && status.current_product && (
                <div className="ai-current">{txt.current}: <em>{status.current_product}</em></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiDescriptionsManager;
