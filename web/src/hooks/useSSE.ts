import { useState, useEffect, useCallback } from 'react';

interface TaskProgress {
  step: number;
  total: number;
  message: string;
}

interface UseSSEResult {
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: TaskProgress | null;
  result: unknown;
  error: string | null;
  connect: (taskId: string) => void;
}

export function useSSE(): UseSSEResult {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback((taskId: string) => {
    setStatus('running');
    setProgress(null);
    setResult(null);
    setError(null);

    const es = new EventSource(`/api/tasks/${taskId}/events`);

    es.addEventListener('progress', (e) => {
      setProgress(JSON.parse(e.data));
    });

    es.addEventListener('complete', (e) => {
      setStatus('completed');
      setResult(JSON.parse(e.data));
      es.close();
    });

    es.addEventListener('error', (e) => {
      if (e instanceof MessageEvent) {
        const data = JSON.parse(e.data);
        setError(data.message);
      } else {
        setError('连接中断');
      }
      setStatus('failed');
      es.close();
    });

    return () => es.close();
  }, []);

  return { status, progress, result, error, connect };
}
