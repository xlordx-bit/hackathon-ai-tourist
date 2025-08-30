const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('../common/middleware/errorHandler');
const logger = require('../common/utils/logger');

const path = require('path');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', routes);

// Serve React frontend static files
const frontendPath = path.join(__dirname, '../../../ai/dist');
app.use(express.static(frontendPath));

// SPA fallback: serve index.html for unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
