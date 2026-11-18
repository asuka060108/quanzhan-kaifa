import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = path.join(root, 'client');
const vite = path.join(client, 'node_modules', 'vite', 'bin', 'vite.js');
const server = path.join(root, 'server', 'src', 'index.js');

const children = [];

function start(command, args, cwd) {
  const child = spawn(process.execPath, [command, ...args], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  children.push(child);
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`process exited with code ${code}: ${command}`);
      shutdown(code);
    }
  });
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start(server, [], root);
start(vite, ['--host', '127.0.0.1'], client);
