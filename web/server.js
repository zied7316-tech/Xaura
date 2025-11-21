const serve = require('serve');
const path = require('path');

const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');

console.log(`🚀 Starting server on port ${PORT}`);
console.log(`📁 Serving from: ${distPath}`);

serve(distPath, {
  port: PORT,
  single: true,
  cors: true,
  silent: false
});

