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
console.log(`🔧 PORT env var: ${process.env.PORT || 'not set (using default 3000)'}`);

// Create environment with PORT explicitly set
const env = {
  ...process.env,
  PORT: PORT.toString(),
  NODE_ENV: process.env.NODE_ENV || 'production'
};

// Spawn serve process with proper PORT handling
// Use serve directly (not npx) since it's in dependencies
const serveProcess = spawn('serve', [
  '-s',
  distPath,
  '-l',
  PORT.toString(),
  '--single',
  '--no-clipboard',
  '--no-compression'
], {
  stdio: 'inherit',
  env: env,
  shell: false
});

serveProcess.on('error', (error) => {
  console.error('❌ Server failed to start:', error.message);
  console.error('   Make sure "serve" is installed: npm install serve');
  process.exit(1);
});

serveProcess.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Server exited with code ${code}`);
    if (signal) {
      console.error(`   Signal: ${signal}`);
    }
    process.exit(code);
  } else if (signal) {
    console.log(`⚠️  Server terminated by signal: ${signal}`);
  }
});

// Handle SIGTERM and SIGINT for graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  if (serveProcess && !serveProcess.killed) {
    serveProcess.kill('SIGTERM');
  }
  // Give it a moment, then force exit
  setTimeout(() => {
    console.log('⚠️  Force exiting after timeout');
    process.exit(0);
  }, 5000);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Shutting down gracefully...');
  if (serveProcess && !serveProcess.killed) {
    serveProcess.kill('SIGINT');
  }
  // Give it a moment, then force exit
  setTimeout(() => {
    console.log('⚠️  Force exiting after timeout');
    process.exit(0);
  }, 5000);
});

// Keep process alive
process.on('exit', (code) => {
  console.log(`⚠️  Process exiting with code ${code}`);
});

