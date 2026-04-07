import React, { useEffect, useState } from 'react';
import { get, put } from '../api';

const PROVIDER_MODELS: Record<string, { label: string; value: string }[]> = {
  gemini: [
    { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  ],
  openai: [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
    { label: 'GPT-4.1', value: 'gpt-4.1' },
    { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
  ],
  anthropic: [
    { label: 'Claude Sonnet 4', value: 'claude-sonnet-4-20250514' },
    { label: 'Claude Haiku 3.5', value: 'claude-3-5-haiku-20241022' },
  ],
  siliconflow: [
    { label: 'MiniMax M2.5', value: 'Pro/MiniMaxAI/MiniMax-M2.5' },
    { label: 'DeepSeek V3.2', value: 'Pro/deepseek-ai/DeepSeek-V3.2' },
    { label: 'DeepSeek V3', value: 'Pro/deepseek-ai/DeepSeek-V3' },
    { label: 'GLM-5', value: 'Pro/zai-org/GLM-5' },
    { label: 'GLM-4.7', value: 'Pro/zai-org/GLM-4.7' },
    { label: 'Kimi K2.5', value: 'Pro/moonshotai/Kimi-K2.5' },
    { label: 'DeepSeek R1', value: 'Pro/deepseek-ai/DeepSeek-R1' },
  ],
};

export default function Settings() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customModel, setCustomModel] = useState(false);

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

  // Check if current model is in the preset list
  const provider = config?.llm?.provider || 'gemini';
  const models = PROVIDER_MODELS[provider] || [];
  const currentModel = config?.llm?.model || '';
  const isPreset = !currentModel || models.some((m) => m.value === currentModel);

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
            <select
              value={provider}
              onChange={(e) => {
                update('llm', 'provider', e.target.value);
                update('llm', 'model', '');
                setCustomModel(false);
              }}
              className="input"
            >
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="siliconflow">硅基流动 (SiliconFlow)</option>
            </select>
          </Field>
          <Field label="模型">
            {!customModel && isPreset ? (
              <div className="flex gap-2 items-center">
                <select
                  value={currentModel}
                  onChange={(e) => update('llm', 'model', e.target.value)}
                  className="input"
                >
                  <option value="">默认</option>
                  {models.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setCustomModel(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-500 whitespace-nowrap"
                >
                  自定义
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  value={currentModel}
                  onChange={(e) => update('llm', 'model', e.target.value)}
                  placeholder="输入模型名称"
                  className="input"
                />
                <button
                  onClick={() => setCustomModel(false)}
                  className="text-xs text-indigo-600 hover:text-indigo-500 whitespace-nowrap"
                >
                  选择
                </button>
              </div>
            )}
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
