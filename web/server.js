const { execSync } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

console.log(`🚀 Starting server on port ${PORT}`);
console.log(`📁 Serving from: ${distPath}`);

// Use serve CLI with proper PORT handling
const command = `npx serve -s "${distPath}" -l ${PORT} --single`;

console.log(`📝 Running: ${command}`);

try {
  execSync(command, {
    stdio: 'inherit',
    env: { ...process.env, PORT: PORT.toString() }
  });
} catch (error) {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
}

