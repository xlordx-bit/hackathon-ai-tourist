const express = require('express');
const axios = require('axios');
const router = express.Router();

const services = [
    {
        name: 'AI Service',
        url: process.env.AI_SERVICE_URL || 'http://localhost:5000/health'
    },
    {
        name: 'Geo Service',
        url: process.env.GEO_SERVICE_URL || 'http://localhost:5001/health'
    },
    {
        name: 'Alert Service',
        url: process.env.ALERT_SERVICE_URL || 'http://localhost:5002/health'
    }
];

router.get('/', async (req, res) => {
    try {
        const healthChecks = await Promise.all(
            services.map(async (service) => {
                try {
                    const response = await axios.get(service.url);
                    return {
                        service: service.name,
                        status: 'healthy',
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    return {
                        service: service.name,
                        status: 'unhealthy',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    };
                }
            })
        );

        const allHealthy = healthChecks.every(check => check.status === 'healthy');
        res.status(allHealthy ? 200 : 503).json({
            status: allHealthy ? 'healthy' : 'degraded',
            services: healthChecks
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
