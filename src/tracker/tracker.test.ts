import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileHash } from '../utils/hash.js';

describe('fileHash', () => {
  const tmpDir = join(tmpdir(), 'md2red-test-' + Date.now());
  const testFile = join(tmpDir, 'test.md');

  beforeEach(async () => {
    await mkdir(tmpDir, { recursive: true });
  });

  it('returns consistent hash for same content', async () => {
    await writeFile(testFile, '# Hello World');
    const hash1 = await fileHash(testFile);
    const hash2 = await fileHash(testFile);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64); // SHA256 hex
  });

  it('returns different hash for different content', async () => {
    await writeFile(testFile, 'content A');
    const hashA = await fileHash(testFile);
    await writeFile(testFile, 'content B');
    const hashB = await fileHash(testFile);
    assert.notEqual(hashA, hashB);
  });

  it('throws for nonexistent file', async () => {
    await assert.rejects(() => fileHash('/nonexistent/file.md'));
  });

  // Cleanup
  it('cleanup', async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });
});
