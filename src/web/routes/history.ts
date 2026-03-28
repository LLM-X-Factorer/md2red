import { route, json } from '../router.js';
import { loadHistory, clearHistory } from '../../tracker/index.js';

route('GET', '/api/history', async (_req, res) => {
  const records = await loadHistory();
  json(res, records);
});

route('DELETE', '/api/history', async (_req, res) => {
  await clearHistory();
  json(res, { ok: true });
});
