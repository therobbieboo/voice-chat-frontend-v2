const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CSP header to allow OpenAI API and WebSocket
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "media-src 'self' data: https: blob:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://voice-chat-backend-production.up.railway.app wss://voice-chat-backend-production.up.railway.app https://api.openai.com wss://api.openai.com https://*.openai.com https://openai.com; " +
    "img-src 'self' data: blob:; " +
    "object-src 'self' blob:; " +
    "frame-src 'self' blob:;");
  next();
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Voice Chat Frontend v2 (OpenAI Realtime A2A) running on port ${PORT}`);
});
