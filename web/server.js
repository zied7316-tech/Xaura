import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

console.log(`🚀 Starting server on port ${PORT}`);
console.log(`📁 Serving from: ${distPath}`);

// Spawn serve process with proper PORT handling
const serveProcess = spawn('npx', [
  'serve',
  '-s',
  distPath,
  '-l',
  PORT.toString(),
  '--single'
], {
  stdio: 'inherit',
  env: { ...process.env, PORT: PORT.toString() }
});

serveProcess.on('error', (error) => {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
});

serveProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle SIGTERM and SIGINT for graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  serveProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Shutting down gracefully...');
  serveProcess.kill('SIGINT');
});

