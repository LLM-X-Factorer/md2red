import React, { useEffect, useState } from 'react';
import { get, put } from '../api';

export default function Settings() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    get<any>('/api/config').then(setConfig);
  }, []);

  const update = (section: string, key: string, value: any) => {
    setConfig((c: any) => ({
      ...c,
      [section]: { ...c[section], [key]: value },
    }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await put('/api/config', config);
      setSaved(true);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">设置</h2>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
        >
          {saving ? '保存中...' : saved ? '已保存 ✓' : '保存配置'}
        </button>
      </div>

      <div className="space-y-6">
        <Section title="LLM 设置">
          <Field label="Provider">
            <select value={config.llm?.provider} onChange={(e) => update('llm', 'provider', e.target.value)} className="input">
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="siliconflow">硅基流动 (SiliconFlow)</option>
            </select>
          </Field>
          <Field label="API Key">
            <input
              type="password"
              value={config.llm?.apiKey || ''}
              onChange={(e) => update('llm', 'apiKey', e.target.value)}
              placeholder="设置 API Key"
              className="input"
            />
          </Field>
          <Field label="Temperature">
            <input type="number" step="0.1" min="0" max="2" value={config.llm?.temperature ?? 0.7} onChange={(e) => update('llm', 'temperature', parseFloat(e.target.value))} className="input w-24" />
          </Field>
        </Section>

        <Section title="图片设置">
          <Field label="主题">
            <select value={config.images?.theme} onChange={(e) => update('images', 'theme', e.target.value)} className="input">
              <option value="dark">暗色</option>
              <option value="light">亮色</option>
            </select>
          </Field>
          <Field label="品牌色">
            <input type="color" value={config.images?.brandColor || '#6366f1'} onChange={(e) => update('images', 'brandColor', e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
          </Field>
        </Section>

        <Section title="内容设置">
          <Field label="最大卡片数">
            <input type="number" min="3" max="18" value={config.content?.maxCards ?? 9} onChange={(e) => update('content', 'maxCards', parseInt(e.target.value))} className="input w-24" />
          </Field>
          <Field label="目标受众">
            <input value={config.content?.targetAudience || ''} onChange={(e) => update('content', 'targetAudience', e.target.value)} className="input" />
          </Field>
          <Field label="风格">
            <select value={config.content?.style} onChange={(e) => update('content', 'style', e.target.value)} className="input">
              <option value="technical">技术干货</option>
              <option value="casual">轻松随意</option>
              <option value="mixed">混合</option>
            </select>
          </Field>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-500 shrink-0">{label}</label>
      {children}
    </div>
  );
}
