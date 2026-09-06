const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { frontendOrigin, nodeEnv } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
if (nodeEnv !== 'test') app.use(morgan('dev'));

// Health check — useful for confirming Phase 1 wiring before any real routes exist.
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running', data: { uptime: process.uptime() } });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
