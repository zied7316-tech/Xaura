import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get PORT from environment - Railway sets this dynamically
// IMPORTANT: Railway sets PORT env var, use it directly
const PORT = parseInt(process.env.PORT || '3000', 10);
const distPath = resolve(__dirname, 'dist');
const indexPath = join(distPath, 'index.html');

// Log all environment variables related to port for debugging
console.log('🔍 Port Configuration:');
console.log(`   PORT env var: ${process.env.PORT || 'NOT SET - using default 3000'}`);
console.log(`   Using port: ${PORT}`);
console.log(`   ⚠️  IMPORTANT: Railway Networking Target Port must match this port (${PORT})`);

// CRITICAL: Validate dist folder exists BEFORE starting server
console.log('🔍 Validating build files...');
if (!existsSync(distPath)) {
  console.error(`❌ CRITICAL ERROR: dist folder does not exist at ${distPath}`);
  console.error('   The build step may have failed. Check Railway build logs.');
  console.error('   Expected build command: npm run build');
  process.exit(1);
}

if (!existsSync(indexPath)) {
  console.error(`❌ CRITICAL ERROR: index.html not found in dist folder`);
  console.error(`   Path checked: ${indexPath}`);
  console.error('   The build step may have failed. Check Railway build logs.');
  process.exit(1);
}

console.log(`✅ dist folder exists: ${distPath}`);
console.log(`✅ index.html found`);
console.log(`🚀 Starting server on port ${PORT}`);
console.log(`📁 Serving from: ${distPath}`);
console.log(`🔧 PORT env var: ${process.env.PORT || 'not set (using default 3000)'}`);

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
  try {
    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);
    if (!stats.isFile()) {
      return false;
    }

    const content = readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': content.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(content);
    return true;
  } catch (error) {
    console.error(`Error serving file ${filePath}:`, error.message);
    return false;
  }
}

const server = createServer((req, res) => {
  // Log all incoming requests for debugging (especially health checks)
  const urlPath = req.url?.split('?')[0] || '';
  const isHealthCheck = urlPath === '/health' || urlPath === '/healthcheck' || urlPath === '/';
  
  if (isHealthCheck) {
    console.log(`[HEALTH] ${req.method} ${urlPath} - User-Agent: ${req.headers['user-agent'] || 'unknown'}`);
    console.log(`[HEALTH] Headers: ${JSON.stringify({ host: req.headers.host, connection: req.headers.connection })}`);
  }
  
  // Health check endpoint - respond immediately (used by Railway)
  if (urlPath === '/health' || urlPath === '/healthcheck') {
    // Respond immediately without any delay
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Health-Check': 'ok'
    });
    const response = JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      port: PORT
    });
    res.end(response);
    console.log(`[HEALTH] ✅ Responded with 200 OK`);
    return;
  }
  
  // Also handle root path as health check if it's from Railway
  if (urlPath === '/' && req.headers['user-agent']?.includes('Railway')) {
    console.log(`[HEALTH] Root path health check from Railway`);
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'xaura-web',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query string
  filePath = filePath.split('?')[0];
  
  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Try to serve the file
  const fullPath = join(distPath, filePath);
  
  if (serveFile(fullPath, res)) {
    return;
  }

  // If file not found and it's not a root request, try index.html (SPA routing)
  if (filePath !== '/index.html') {
    if (serveFile(indexPath, res)) {
      return;
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start server with error handling
let serverStarted = false;

try {
  server.listen(PORT, '0.0.0.0', () => {
    serverStarted = true;
    console.log(`✅ Server listening on http://0.0.0.0:${PORT}`);
    console.log(`✅ Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`✅ Main page: http://0.0.0.0:${PORT}/`);
    console.log(`✅ Ready to serve requests!`);
    console.log(`✅ Server will stay alive and handle requests`);
    
    // Test that server is actually listening
    server.getConnections((err, count) => {
      if (err) {
        console.error('❌ Error checking server connections:', err.message);
      } else {
        console.log(`✅ Server is ready to accept connections (max: ${server.maxConnections || 'unlimited'})`);
      }
    });
  });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Handle graceful shutdown
let shuttingDown = false;

function gracefulShutdown(signal) {
  if (shuttingDown) {
    console.log(`⚠️  ${signal} received again, forcing exit...`);
    process.exit(0);
    return;
  }
  shuttingDown = true;
  
  console.log(`⚠️  ${signal} received. Shutting down gracefully...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error closing server:', err.message);
      process.exit(1);
    }
    console.log('✅ HTTP server closed gracefully');
    process.exit(0);
  });
  
  // Force exit after 5 seconds (Railway gives 10 seconds, but we'll be faster)
  setTimeout(() => {
    console.log('⚠️  Force exiting after timeout');
    process.exit(0);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep process alive and log that we're ready
process.on('exit', (code) => {
  if (code === 0) {
    console.log(`✅ Process exiting cleanly`);
  } else {
    console.log(`⚠️  Process exiting with code ${code}`);
  }
});

// Prevent the process from exiting unexpectedly
// Keep the event loop alive
const keepAlive = setInterval(() => {
  if (serverStarted) {
    // Server is running, just log periodically to show we're alive
    // This interval keeps the process alive
  }
}, 30000); // Every 30 seconds

// Log that we're keeping the process alive
console.log('🔄 Process keep-alive initialized');

// Handle server close events
server.on('close', () => {
  console.log('⚠️  Server closed event received');
  clearInterval(keepAlive);
});

server.on('listening', () => {
  console.log('✅ Server is now listening and ready for connections');
});

