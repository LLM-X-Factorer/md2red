import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { get, put } from '../api';

interface ImageData { name: string; base64: string; }
interface Strategy { titles: string[]; summary: string; tags: string[]; }

export default function Preview() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageData[]>([]);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [current, setCurrent] = useState(0);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get<{ images: ImageData[]; strategy: Strategy }>(`/api/preview/${taskId}`).then((data) => {
      setImages(data.images);
      setImageOrder(data.images.map((i) => i.name));
      if (data.strategy) {
        setStrategy(data.strategy);
        setTitle(data.strategy.titles?.[0] || '');
        setSummary(data.strategy.summary || '');
        setTags(data.strategy.tags || []);
      }
    });
  }, [taskId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(imageOrder.length - 1, c + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [imageOrder.length]);

  const removeCard = (idx: number) => {
    const newOrder = imageOrder.filter((_, i) => i !== idx);
    setImageOrder(newOrder);
    if (current >= newOrder.length) setCurrent(newOrder.length - 1);
  };

  const addTag = () => {
    const v = tagInput.trim().replace(/^#/, '');
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      await put(`/api/preview/${taskId}`, { title, summary, tags, imageOrder });
      navigate(`/publish/${taskId}`);
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentImg = images.find((i) => i.name === imageOrder[current]);

  if (images.length === 0) return <p className="text-gray-500">加载中...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">预览编辑</h2>
        <button onClick={savePlan} disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors">
          {saving ? '保存中...' : '确认并发布 →'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left: Card viewer */}
        <div className="flex-1 flex flex-col items-center">
          {currentImg && (
            <img src={currentImg.base64} alt={currentImg.name} className="max-h-[600px] rounded-lg shadow-2xl" />
          )}
          <div className="flex items-center gap-4 mt-4">
            <button onClick={() => setCurrent(Math.max(0, current - 1))} className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700 text-lg">‹</button>
            <span className="text-sm text-gray-500">{current + 1} / {imageOrder.length}</span>
            <button onClick={() => setCurrent(Math.min(imageOrder.length - 1, current + 1))} className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700 text-lg">›</button>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="w-80 space-y-5">
          <section className="rounded-lg bg-gray-900 border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">标题</h3>
            {strategy?.titles?.map((t, i) => (
              <label key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-800/50 cursor-pointer text-sm">
                <input type="radio" name="title" checked={title === t} onChange={() => setTitle(t)} className="mt-0.5" />
                <span>{t}</span>
              </label>
            ))}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="自定义标题"
              className="w-full mt-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm"
            />
          </section>

          <section className="rounded-lg bg-gray-900 border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">摘要</h3>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full h-28 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs leading-relaxed resize-y"
            />
          </section>

          <section className="rounded-lg bg-gray-900 border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">标签</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-full text-xs">
                  #{t}
                  <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="opacity-50 hover:opacity-100">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="添加标签"
                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs"
              />
              <button onClick={addTag} className="px-2 py-1 bg-gray-800 rounded text-xs hover:bg-gray-700">+</button>
            </div>
          </section>

          <section className="rounded-lg bg-gray-900 border border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2">卡片 ({imageOrder.length})</h3>
            <div className="flex flex-wrap gap-1.5">
              {imageOrder.map((name, i) => {
                const img = images.find((x) => x.name === name);
                return (
                  <div key={name} className={`relative cursor-pointer group ${i === current ? 'ring-2 ring-indigo-500 rounded' : ''}`} onClick={() => setCurrent(i)}>
                    <img src={img?.base64} alt={name} className="w-12 h-16 object-cover rounded" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeCard(i); }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >&times;</button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
