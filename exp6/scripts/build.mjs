import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(root, 'client');
const vite = path.join(client, 'node_modules', 'vite', 'bin', 'vite.js');

const child = spawn(process.execPath, [vite, 'build'], {
  cwd: client,
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' },
});
child.on('exit', (code) => process.exit(code ?? 0));
