import React, { useState, useCallback } from 'react';
import { Image, Film, Upload, Send, Loader2, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CampaignsManager = ({ products = [] }) => {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [flows, setFlows] = useState([]);
  const [productId, setProductId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [campaignType, setCampaignType] = useState('static_ad');
  const [saveToCloudinary, setSaveToCloudinary] = useState(true);
  const [lastError, setLastError] = useState('');

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setLastError('');
    try {
      const res = await fetch(`${API_URL}/api/campaigns/assets?limit=50`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to load campaign assets', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    setLastError('');
    try {
      const res = await fetch(`${API_URL}/api/campaigns/flows?limit=50`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFlows(data.flows || []);
      }
    } catch (err) {
      console.error('Failed to load MakeUGC flows', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateImage = useCallback(async () => {
    setLastError('');
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/huggingface/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          aspect_ratio: aspectRatio,
          campaign_type: campaignType,
          product_id: productId || undefined,
          save_to_cloudinary: saveToCloudinary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Generation failed');
      setAssets((prev) => [data, ...prev]);
      setPrompt('');
    } catch (err) {
      setLastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [prompt, aspectRatio, campaignType, productId, saveToCloudinary]);

  const createUgcScript = useCallback(async () => {
    setLastError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/makeugc/flows/scripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId || undefined,
          language: 'bg',
          hook: 'This feels like opening a luxury gift.',
          cta: 'Открий своя аромат в KOSTIN.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Script generation failed');
      setFlows((prev) => [data, ...prev]);
    } catch (err) {
      setLastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  return (
    <div className="admin-section" data-testid="campaigns-manager">
      <div className="admin-toolbar">
        <h2 className="heading-2">HuggingFace + MakeUGC campaigns</h2>
        <div className="admin-actions">
          <button onClick={loadAssets} className="admin-secondary-button" disabled={loading}>
            Refresh assets
          </button>
          <button onClick={loadFlows} className="admin-secondary-button" disabled={loading}>
            Refresh flows
          </button>
        </div>
      </div>

      <div className="campaigns-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <Sparkles size={18} />
            <h3>Static / video prompt</h3>
          </div>
          <div className="form-grid">
            <label>
              Product
              <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">None</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} — {product.brand}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Aspect ratio
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                <option value="1:1">1:1</option>
                <option value="4:5">4:5</option>
                <option value="9:16">9:16</option>
                <option value="16:9">16:9</option>
              </select>
            </label>
            <label>
              Campaign type
              <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
                <option value="static_ad">Static ad</option>
                <option value="video_script">Video script</option>
                <option value="ugc_concept">UGC concept</option>
              </select>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={saveToCloudinary}
                onChange={(e) => setSaveToCloudinary(e.target.checked)}
              />
              Save to Cloudinary
            </label>
            <label className="full-width">
              Prompt
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Luxury KOSTIN Parfums Meta ad creative..."
              />
            </label>
            <div className="full-width admin-actions">
              <button onClick={generateImage} disabled={loading || !prompt.trim()} className="admin-primary-button">
                <Image size={16} />
                {loading ? 'Generating...' : 'Generate image'}
              </button>
              <button onClick={createUgcScript} disabled={loading || !productId} className="admin-secondary-button">
                <Film size={16} />
                Generate MakeUGC script
              </button>
            </div>
          </div>
          {lastError && <p className="admin-error">{lastError}</p>}
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <Upload size={18} />
            <h3>Recent assets</h3>
          </div>
          {assets.length === 0 && <p className="admin-muted">No campaign assets yet.</p>}
          <div className="asset-grid">
            {assets.slice(0, 12).map((asset) => (
              <div key={asset.id} className="asset-card">
                {asset.thumbnail_url || asset.asset_url ? (
                  <img src={asset.thumbnail_url || asset.asset_url} alt={asset.prompt || 'Campaign asset'} />
                ) : (
                  <div className="asset-placeholder">No preview</div>
                )}
                <div className="asset-meta">
                  <span>{asset.campaign_type}</span>
                  <span>{asset.aspect_ratio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <Send size={18} />
            <h3>MakeUGC flows / scripts</h3>
          </div>
          {flows.length === 0 && <p className="admin-muted">No MakeUGC flows yet.</p>}
          <div className="flows-list">
            {flows.slice(0, 12).map((item) => (
              <div key={item.id || item.asset_id} className="flow-card">
                <pre>{JSON.stringify(item.script || item, null, 2).slice(0, 420)}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export { CampaignsManager };
