import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { getApi } from '../../services/api';

export function ObjectStorageSettingsPanel() {
  const settings = useSettingsStore();
  const save = useSettingsStore((s) => s.save);

  const [enabled, setEnabled] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [region, setRegion] = useState('');
  const [bucket, setBucket] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [forcePathStyle, setForcePathStyle] = useState(true);
  const [publicBaseUrl, setPublicBaseUrl] = useState('');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [usePresignedUrls, setUsePresignedUrls] = useState(false);
  const [presignedExpiry, setPresignedExpiry] = useState(86400);
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!settings.loaded) return;
    const os = settings.objectStorage;
    setEnabled(os.enabled);
    setEndpoint(os.endpoint);
    setRegion(os.region);
    setBucket(os.bucket);
    setAccessKeyId(os.accessKeyId);
    setSecretAccessKey('');
    setForcePathStyle(os.forcePathStyle);
    setPublicBaseUrl(os.publicBaseUrl);
    setKeyPrefix(os.keyPrefix);
    setUsePresignedUrls(os.usePresignedUrls);
    setPresignedExpiry(os.presignedUrlExpirySeconds);
  }, [settings.loaded, settings.objectStorage]);

  const buildSaveInput = () => ({
    enabled,
    endpoint: endpoint.trim(),
    region: region.trim(),
    bucket: bucket.trim(),
    accessKeyId: accessKeyId.trim(),
    ...(secretAccessKey.trim() ? { secretAccessKey: secretAccessKey.trim() } : {}),
    forcePathStyle,
    publicBaseUrl: publicBaseUrl.trim(),
    keyPrefix: keyPrefix.trim(),
    usePresignedUrls,
    presignedUrlExpirySeconds: presignedExpiry,
  });

  const handleSave = async () => {
    setStatus(null);
    if (enabled && (!endpoint.trim() || !bucket.trim() || !accessKeyId.trim())) {
      setStatus({ type: 'error', text: '启用时请填写 Endpoint、Bucket 与 Access Key' });
      return;
    }
    if (enabled && !secretAccessKey.trim() && !settings.objectStorage.secretAccessKey) {
      setStatus({ type: 'error', text: '请填写 Secret Key' });
      return;
    }
    try {
      await save({ objectStorage: buildSaveInput() });
      setSecretAccessKey('');
      setStatus({ type: 'ok', text: '对象存储设置已保存' });
    } catch (e) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : '保存失败',
      });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await getApi().objectStorage.testConnection({
        endpoint: endpoint.trim(),
        region: region.trim(),
        bucket: bucket.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim() || undefined,
        forcePathStyle,
      });
      setStatus({ type: 'ok', text: '连接测试成功' });
    } catch (e) {
      setStatus({
        type: 'error',
        text: e instanceof Error ? e.message : '连接测试失败',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="settings-panel">
      <h2>对象存储 (S3 兼容)</h2>
      <p className="provider-mode-hint">
        用于聊天图片上传，兼容 MinIO、AWS S3 等。配置仅保存在本机设置中，不使用环境变量。
      </p>
      <label className="pref-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>启用对象存储</span>
      </label>
      <div className="settings-form">
        <div className="field">
          <label htmlFor="os-endpoint">S3 API Endpoint</label>
          <input
            id="os-endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://s3.example.com"
          />
        </div>
        <div className="field">
          <label htmlFor="os-region">Region</label>
          <input id="os-region" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="os-bucket">Bucket</label>
          <input id="os-bucket" value={bucket} onChange={(e) => setBucket(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="os-ak">Access Key ID</label>
          <input
            id="os-ak"
            type="password"
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="os-sk">Secret Access Key</label>
          <input
            id="os-sk"
            type="password"
            value={secretAccessKey}
            onChange={(e) => setSecretAccessKey(e.target.value)}
            placeholder={settings.objectStorage.secretAccessKey ? '留空则保留已保存' : ''}
            autoComplete="off"
          />
        </div>
        <label className="pref-toggle">
          <input
            type="checkbox"
            checked={forcePathStyle}
            onChange={(e) => setForcePathStyle(e.target.checked)}
          />
          <span>Path-style 寻址（MinIO 通常需开启）</span>
        </label>
        <div className="field">
          <label htmlFor="os-public">对外访问地址（发给模型用）</label>
          <input
            id="os-public"
            value={publicBaseUrl}
            onChange={(e) => setPublicBaseUrl(e.target.value)}
            placeholder="公网可访问的 HTTPS 地址，勿填 localhost / 内网"
          />
          <p className="field-hint">
            百炼多模态会从阿里云服务器拉取图片，Endpoint 若是 localhost 或内网，请在此填写公网域名；私有桶可勾选预签名
            URL。
          </p>
        </div>
        <div className="field">
          <label htmlFor="os-prefix">对象键前缀</label>
          <input id="os-prefix" value={keyPrefix} onChange={(e) => setKeyPrefix(e.target.value)} />
        </div>
        <label className="pref-toggle">
          <input
            type="checkbox"
            checked={usePresignedUrls}
            onChange={(e) => setUsePresignedUrls(e.target.checked)}
          />
          <span>使用预签名 URL（私有桶）</span>
        </label>
        {usePresignedUrls && (
          <div className="field">
            <label htmlFor="os-expiry">预签名有效期（秒）</label>
            <input
              id="os-expiry"
              type="number"
              min={60}
              value={presignedExpiry}
              onChange={(e) => setPresignedExpiry(Number(e.target.value))}
            />
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="primary" onClick={() => void handleSave()}>
            保存设置
          </button>
          <button
            type="button"
            className="secondary"
            disabled={testing}
            onClick={() => void handleTest()}
          >
            {testing ? '测试中…' : '测试连接'}
          </button>
        </div>
        {status && (
          <p className={`status-msg ${status.type === 'error' ? 'error' : ''}`}>{status.text}</p>
        )}
      </div>
    </div>
  );
}
