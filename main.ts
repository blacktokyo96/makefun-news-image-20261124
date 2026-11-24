import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

try {
  const source = join(dirname(fileURLToPath(import.meta.url)), 'entry.png');
  const bytes = await readFile(source).catch((error) => {
    if (error.code === 'ENOENT') throw new Error(`Source entry.png is missing: ${source}`);
    throw error;
  });
  if (!bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    throw new Error('Source entry.png is not a JPEG: expected FF D8 FF magic bytes');
  }
  const sourceHash = sha256(bytes);
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  await mkdir(outputDir, { recursive: true });
  const destination = join(outputDir, 'entry.png');
  await writeFile(destination, bytes);
  const written = await readFile(destination);
  if (sha256(written) !== sourceHash) {
    throw new Error('Written entry.png SHA-256 does not match source');
  }
  console.log(`Wrote ${written.length} bytes to ${destination}; SHA-256 ${sourceHash}`);
} catch (error) {
  console.error(`Failed to write entry.png: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
