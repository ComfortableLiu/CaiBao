import { useEffect, useMemo, useState } from 'react';
import type { DashScopeRegion, ProviderMode, ThemeMode } from '@shared/types';
import {
  DASHSCOPE_REGION_LABELS,
  getActiveProfile,
  resolveProviderConfig,
} from '@shared/provider-config';
import { useSettingsStore } from '../stores/settings-store';
import { EnabledModelsBar } from '../components/EnabledModelsBar';
import { applyTheme } from '../utils/theme';
import { isValidBaseUrl, syncModels } from '../services/llm/provider-service';
import '../styles/settings.css';

export function SettingsPage() {
  const settings = useSettingsStore();
  const save = useSettingsStore((s) => s.save);

  const activeProfile = useMemo(() => getActiveProfile(settings), [settings]);

  const [dashscopeApiKey, setDashscopeApiKey] = useState('');
  const [dashscopeRegion, setDashscopeRegion] = useState<DashScopeRegion>('cn-beijing');
  const [openaiBaseURL, setOpenaiBaseURL] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [urlError, setUrlError] = useState('');
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return activeProfile.availableModels;
    return activeProfile.availableModels.filter((id) => id.toLowerCase().includes(q));
  }, [activeProfile.availableModels, modelSearch]);

  useEffect(() => {
    if (!settings.loaded) return;
    setDashscopeApiKey(settings.dashscope.apiKey);
    setDashscopeRegion(settings.dashscope.region);
    setOpenaiBaseURL(settings.openaiCompatible.baseURL);
    setOpenaiApiKey(settings.openaiCompatible.apiKey);
  }, [
    settings.loaded,
    settings.providerMode,
    settings.dashscope.apiKey,
    settings.dashscope.region,
    settings.openaiCompatible.baseURL,
    settings.openaiCompatible.apiKey,
  ]);

  const switchProviderMode = async (mode: ProviderMode) => {
    if (mode === settings.providerMode) return;
    setUrlError('');
    setStatus(null);
    await save({ providerMode: mode });
  };

  const handleSaveDashscope = async () => {
    setUrlError('');
    if (!dashscopeApiKey.trim()) {
      setStatus({ type: 'error', text: 'API Key 不能为空' });
      return;
    }
    try {
      await save({
        dashscope: { region: dashscopeRegion, apiKey: dashscopeApiKey },
      });
      setStatus({ type: 'ok', text: 'DashScope 设置已保存' });
    } catch (e) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : '保存失败',
      });
    }
  };

  const handleSyncDashscope = async () => {
    if (!dashscopeApiKey.trim()) {
      setStatus({ type: 'error', text: '请先填写 API Key' });
      return;
    }
    setSyncing(true);
    setStatus(null);
    try {
      const { baseURL } = resolveProviderConfig({
        ...settings,
        providerMode: 'dashscope',
        dashscope: { ...settings.dashscope, region: dashscopeRegion, apiKey: dashscopeApiKey },
      });
      const models = await syncModels(baseURL, dashscopeApiKey);
      const prevEnabled = settings.dashscope.enabledModelIds;
      await save({
        dashscope: {
          region: dashscopeRegion,
          apiKey: dashscopeApiKey,
          availableModels: models,
          enabledModelIds:
            prevEnabled.length > 0
              ? prevEnabled.filter((id) => models.includes(id))
              : models.slice(0, 1),
        },
      });
      setStatus({ type: 'ok', text: `已同步 ${models.length} 个模型` });
    } catch (e) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : '同步失败',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveOpenAI = async () => {
    setUrlError('');
    if (!isValidBaseUrl(openaiBaseURL)) {
      setUrlError('请输入有效的 http(s) URL');
      return;
    }
    if (!openaiApiKey.trim()) {
      setStatus({ type: 'error', text: 'API Key 不能为空' });
      return;
    }
    try {
      await save({
        openaiCompatible: {
          baseURL: openaiBaseURL.replace(/\/$/, ''),
          apiKey: openaiApiKey,
        },
      });
      setStatus({ type: 'ok', text: 'OpenAI 兼容设置已保存' });
    } catch (e) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : '保存失败',
      });
    }
  };

  const handleSyncOpenAI = async () => {
    setUrlError('');
    if (!isValidBaseUrl(openaiBaseURL)) {
      setUrlError('请先填写有效的 Base URL');
      return;
    }
    if (!openaiApiKey.trim()) {
      setStatus({ type: 'error', text: '请先填写 API Key' });
      return;
    }
    setSyncing(true);
    setStatus(null);
    try {
      const baseURL = openaiBaseURL.replace(/\/$/, '');
      const models = await syncModels(baseURL, openaiApiKey);
      const prevEnabled = settings.openaiCompatible.enabledModelIds;
      await save({
        openaiCompatible: {
          baseURL,
          apiKey: openaiApiKey,
          availableModels: models,
          enabledModelIds:
            prevEnabled.length > 0
              ? prevEnabled.filter((id) => models.includes(id))
              : models.slice(0, 1),
        },
      });
      setStatus({ type: 'ok', text: `已同步 ${models.length} 个模型` });
    } catch (e) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : '同步失败',
      });
    } finally {
      setSyncing(false);
    }
  };

  const toggleModel = async (id: string) => {
    if (settings.providerMode === 'dashscope') {
      const enabled = settings.dashscope.enabledModelIds;
      const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id];
      await save({ dashscope: { enabledModelIds: next } });
    } else {
      const enabled = settings.openaiCompatible.enabledModelIds;
      const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id];
      await save({ openaiCompatible: { enabledModelIds: next } });
    }
  };

  const reorderModels = async (ids: string[]) => {
    if (settings.providerMode === 'dashscope') {
      await save({ dashscope: { enabledModelIds: ids } });
    } else {
      await save({ openaiCompatible: { enabledModelIds: ids } });
    }
  };

  const removeModel = async (id: string) => {
    if (settings.providerMode === 'dashscope') {
      await save({
        dashscope: {
          enabledModelIds: settings.dashscope.enabledModelIds.filter((x) => x !== id),
        },
      });
    } else {
      await save({
        openaiCompatible: {
          enabledModelIds: settings.openaiCompatible.enabledModelIds.filter((x) => x !== id),
        },
      });
    }
  };

  const setTheme = async (theme: ThemeMode) => {
    await save({ theme });
    applyTheme(theme);
  };

  const isDashscope = settings.providerMode === 'dashscope';

  return (
    <div className="settings-page">
      <h2>模型 Provider 设置</h2>

      <section className="provider-mode-section">
        <h3>协议模式</h3>
        <p className="provider-mode-hint">两种协议互斥，仅当前选中的模式用于聊天与模型同步。</p>
        <div className="provider-mode-switch" role="radiogroup" aria-label="协议模式">
          <button
            type="button"
            className={`provider-mode-btn ${isDashscope ? 'active' : ''}`}
            onClick={() => void switchProviderMode('dashscope')}
          >
            <span className="provider-mode-label">DashScope</span>
            <span className="provider-mode-badge">推荐</span>
          </button>
          <button
            type="button"
            className={`provider-mode-btn ${!isDashscope ? 'active' : ''}`}
            onClick={() => void switchProviderMode('openai-compatible')}
          >
            <span className="provider-mode-label">OpenAI 兼容</span>
          </button>
        </div>
      </section>

      <div className="settings-form">
        {isDashscope ? (
          <>
            <div className="field">
              <label htmlFor="dashscope-region">地域</label>
              <select
                id="dashscope-region"
                value={dashscopeRegion}
                onChange={(e) => setDashscopeRegion(e.target.value as DashScopeRegion)}
              >
                {(Object.entries(DASHSCOPE_REGION_LABELS) as [DashScopeRegion, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <p className="provider-mode-hint">
              聊天走 DashScope 原生 HTTP（Generation），支持联网搜索来源、深度思考等；模型列表仍通过兼容接口同步。
            </p>
            <div className="field">
              <label htmlFor="dashscope-apiKey">DashScope API Key</label>
              <input
                id="dashscope-apiKey"
                type="password"
                value={dashscopeApiKey}
                onChange={(e) => setDashscopeApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="primary" onClick={() => void handleSaveDashscope()}>
                保存设置
              </button>
              <button
                type="button"
                className="secondary"
                disabled={syncing}
                onClick={() => void handleSyncDashscope()}
              >
                {syncing ? '同步中…' : '同步模型列表'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="openai-baseURL">Base URL（OpenAI 兼容，含 /v1）</label>
              <input
                id="openai-baseURL"
                value={openaiBaseURL}
                onChange={(e) => setOpenaiBaseURL(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              {urlError && <div className="error">{urlError}</div>}
            </div>
            <div className="field">
              <label htmlFor="openai-apiKey">API Key</label>
              <input
                id="openai-apiKey"
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="primary" onClick={() => void handleSaveOpenAI()}>
                保存设置
              </button>
              <button
                type="button"
                className="secondary"
                disabled={syncing}
                onClick={() => void handleSyncOpenAI()}
              >
                {syncing ? '同步中…' : '同步模型列表'}
              </button>
            </div>
          </>
        )}
        {status && (
          <p className={`status-msg ${status.type === 'error' ? 'error' : ''}`}>{status.text}</p>
        )}
      </div>

      <section className="appearance-section">
        <h3>外观</h3>
        <div className="theme-options">
          {(
            [
              ['light', '白天模式'],
              ['dark', '黑暗模式'],
              ['system', '跟随系统'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="theme-option">
              <input
                type="radio"
                name="theme"
                value={value}
                checked={settings.theme === value}
                onChange={() => void setTheme(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      {activeProfile.availableModels.length > 0 && (
        <section className="models-section">
          <h3>
            启用模型（{isDashscope ? 'DashScope' : 'OpenAI 兼容'} · 勾选后可在聊天页使用）
          </h3>
          <div className="enabled-models-section">
            <h4>已选模型（拖动排序）</h4>
            <EnabledModelsBar
              modelIds={activeProfile.enabledModelIds}
              onReorder={(ids) => void reorderModels(ids)}
              onRemove={(id) => void removeModel(id)}
              hint="拖动左侧 ⋮⋮ 调整聊天页模型顺序；点击 × 取消启用"
            />
          </div>
          <div className="models-panel">
            <div className="models-search-row">
              <label className="models-search-label" htmlFor="model-search">
                搜索筛选
              </label>
              <div className="models-toolbar">
                <input
                  id="model-search"
                  type="text"
                  className="models-search"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="输入模型名过滤，如 gpt、qwen…"
                />
                {modelSearch && (
                  <button
                    type="button"
                    className="models-search-clear"
                    onClick={() => setModelSearch('')}
                    title="清空"
                  >
                    清空
                  </button>
                )}
              </div>
              <span className="models-count">
                显示 {filteredModels.length} / 共 {activeProfile.availableModels.length} 个
                {activeProfile.enabledModelIds.length > 0 &&
                  ` · 已启用 ${activeProfile.enabledModelIds.length} 个`}
              </span>
            </div>
            <div className="models-list">
              {filteredModels.length === 0 ? (
                <p className="models-empty">没有匹配的模型，请修改搜索词</p>
              ) : (
                filteredModels.map((id) => (
                  <label key={id} className="model-item">
                    <input
                      type="checkbox"
                      checked={activeProfile.enabledModelIds.includes(id)}
                      onChange={() => void toggleModel(id)}
                    />
                    <span>{id}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
