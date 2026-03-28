import { nanoid } from 'nanoid';
import type { ServerResponse } from 'node:http';

export interface TaskProgress {
  step: number;
  total: number;
  message: string;
}

export interface Task {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: TaskProgress;
  result?: unknown;
  error?: string;
  createdAt: number;
  listeners: Set<ServerResponse>;
}

const tasks = new Map<string, Task>();

export function createTask(type: string): Task {
  const task: Task = {
    id: nanoid(12),
    type,
    status: 'pending',
    progress: { step: 0, total: 1, message: '等待中...' },
    createdAt: Date.now(),
    listeners: new Set(),
  };
  tasks.set(task.id, task);
  return task;
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function updateTask(id: string, progress: TaskProgress): void {
  const task = tasks.get(id);
  if (!task) return;
  task.status = 'running';
  task.progress = progress;
  broadcast(task, { event: 'progress', data: progress });
}

export function completeTask(id: string, result: unknown): void {
  const task = tasks.get(id);
  if (!task) return;
  task.status = 'completed';
  task.result = result;
  broadcast(task, { event: 'complete', data: result });
  closeListeners(task);
}

export function failTask(id: string, error: string): void {
  const task = tasks.get(id);
  if (!task) return;
  task.status = 'failed';
  task.error = error;
  broadcast(task, { event: 'error', data: { message: error } });
  closeListeners(task);
}

export function addListener(id: string, res: ServerResponse): void {
  const task = tasks.get(id);
  if (!task) return;
  task.listeners.add(res);
  res.on('close', () => task.listeners.delete(res));

  // Send current state immediately
  if (task.status === 'completed') {
    sendSSE(res, 'complete', task.result);
    res.end();
  } else if (task.status === 'failed') {
    sendSSE(res, 'error', { message: task.error });
    res.end();
  } else if (task.status === 'running') {
    sendSSE(res, 'progress', task.progress);
  }
}

function broadcast(task: Task, event: { event: string; data: unknown }): void {
  for (const res of task.listeners) {
    sendSSE(res, event.event, event.data);
  }
}

function sendSSE(res: ServerResponse, event: string, data: unknown): void {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch { /* connection closed */ }
}

function closeListeners(task: Task): void {
  for (const res of task.listeners) {
    try { res.end(); } catch { /* ok */ }
  }
  task.listeners.clear();
}

// Prune old tasks every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 3600000;
  for (const [id, task] of tasks) {
    if (task.createdAt < cutoff && (task.status === 'completed' || task.status === 'failed')) {
      tasks.delete(id);
    }
  }
}, 1800000);
