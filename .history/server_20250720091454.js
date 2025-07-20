require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cron = require('node-cron');

const TradingBot = require('./src/bot/TradingBot');
const alpacaService = require('./src/services/alpacaService');
const newsService = require('./src/services/newsService');
const emailService = require('./src/services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize trading bot
const tradingBot = new TradingBot();

// API Routes
app.get('/api/account', async (req, res) => {
    try {
        const account = await alpacaService.getAccount();
        res.json(account);
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ error: 'Failed to fetch account data' });
    }
});

app.get('/api/positions', async (req, res) => {
    try {
        const positions = await alpacaService.getPositions();
        res.json(positions);
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: 'Failed to fetch positions' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await alpacaService.getOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.get('/api/portfolio-history', async (req, res) => {
    try {
        const history = await alpacaService.getPortfolioHistory();
        res.json(history);
    } catch (error) {
        console.error('Error fetching portfolio history:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio history' });
    }
});

app.get('/api/watchlist', async (req, res) => {
    try {
        const watchlist = await tradingBot.getWatchlist();
        res.json(watchlist);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

app.get('/api/trending', async (req, res) => {
    try {
        const trending = await tradingBot.getTrendingStocks();
        res.json(trending);
    } catch (error) {
        console.error('Error fetching trending stocks:', error);
        res.status(500).json({ error: 'Failed to fetch trending stocks' });
    }
});

app.get('/api/bot/status', (req, res) => {
    res.json({
        status: tradingBot.isRunning ? 'running' : 'stopped',
        lastUpdate: tradingBot.lastUpdate,
        totalTrades: tradingBot.totalTrades,
        profitLoss: tradingBot.profitLoss,
        uptime: process.uptime()
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle any other non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Schedule trading bot to run every minute during market hours
cron.schedule('* 9-16 * * 1-5', () => {
    if (tradingBot.isRunning) {
        tradingBot.executeTradingStrategy();
    }
}, {
    timezone: "America/New_York"
});

// Start server
app.listen(PORT, () => {
    console.log(`Trading bot server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    
    // Initialize bot
    tradingBot.initialize().catch(console.error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    tradingBot.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    tradingBot.stop();
    process.exit(0);
});
