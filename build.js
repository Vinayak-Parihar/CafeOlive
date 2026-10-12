#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, 'frontend');
const rootDist = path.resolve(__dirname, 'dist');
const frontendDist = path.resolve(frontendDir, 'dist');

console.log('=== Starting Cafe Olive Build ===');
console.log(`Frontend directory: ${frontendDir}`);

// 1. Ensure frontend dependencies are installed
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
}

// 2. Build frontend using Vite
console.log('Building frontend production bundle...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

// 3. Mirror frontend/dist to root/dist so both output directory settings work in Cloudflare
try {
  if (fs.existsSync(frontendDist)) {
    console.log('Syncing dist to root dist directory...');
    fs.cpSync(frontendDist, rootDist, { recursive: true, force: true });
    console.log('Build completed successfully!');
  }
} catch (err) {
  console.warn('Warning syncing dist directory:', err.message);
}
