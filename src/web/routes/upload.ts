import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import Busboy from 'busboy';
import { route, json } from '../router.js';
import { parseMarkdown } from '../../parser/index.js';

const UPLOAD_DIR = process.env.MD2RED_DATA_DIR
  ? join(process.env.MD2RED_DATA_DIR, 'uploads')
  : join(process.cwd(), 'uploads');

route('POST', '/api/upload', async (req, res) => {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const { filePath, fileName } = await parseUpload(req);
    const doc = await parseMarkdown(filePath);

    json(res, {
      filePath,
      fileName,
      parsed: {
        title: doc.title,
        wordCount: doc.metadata.wordCount,
        blockCount: doc.contentBlocks.length,
        hasCodeBlocks: doc.metadata.hasCodeBlocks,
        imageCount: doc.images.length,
        estimatedCards: doc.metadata.estimatedCards,
      },
    });
  } catch (err) {
    json(res, { error: (err as Error).message }, 500);
  }
});

function parseUpload(req: import('node:http').IncomingMessage): Promise<{ filePath: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    let savedPath = '';
    let savedName = '';

    busboy.on('file', (_fieldname, stream, info) => {
      const fileName = info.filename || `upload-${Date.now()}.md`;
      savedName = fileName;
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', async () => {
        const filePath = join(UPLOAD_DIR, `${Date.now()}-${fileName}`);
        await writeFile(filePath, Buffer.concat(chunks));
        savedPath = filePath;
      });
    });

    busboy.on('finish', () => {
      if (savedPath) resolve({ filePath: savedPath, fileName: savedName });
      else reject(new Error('No file uploaded'));
    });
    busboy.on('error', reject);
    req.pipe(busboy);
  });
}
