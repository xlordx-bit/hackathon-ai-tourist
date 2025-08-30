const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const locationRoutes = require('./location.routes');
const alertRoutes = require('./alert.routes');
const geofenceRoutes = require('./geofence.routes');
const healthRoutes = require('./health.routes');

router.use('/auth', authRoutes);
router.use('/location', locationRoutes);
router.use('/alerts', alertRoutes);
router.use('/geofence', geofenceRoutes);
router.use('/health', healthRoutes);

module.exports = router;
