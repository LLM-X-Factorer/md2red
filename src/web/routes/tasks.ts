import { route, json } from '../router.js';
import { getTask, addListener } from '../task-manager.js';

// SSE endpoint
route('GET', '/api/tasks/:id/events', (req, res, params) => {
  const task = getTask(params.id);
  if (!task) {
    json(res, { error: 'Task not found' }, 404);
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  addListener(params.id, res);
});

// Polling fallback
route('GET', '/api/tasks/:id', (_req, res, params) => {
  const task = getTask(params.id);
  if (!task) {
    json(res, { error: 'Task not found' }, 404);
    return;
  }

  json(res, {
    id: task.id,
    type: task.type,
    status: task.status,
    progress: task.progress,
    result: task.result,
    error: task.error,
  });
});
