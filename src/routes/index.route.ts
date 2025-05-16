import express from 'express';
import products from './products.route'

const router = express.Router();

router.use('/api/v1/products', products);

router.get('/health', (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    res.send(JSON.stringify(healthcheck));
});

export default router;