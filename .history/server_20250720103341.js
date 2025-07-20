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
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"],
            scriptSrcAttr: ["'unsafe-inline'"]
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
cron.schedule('* 9-16 * * 1-5', async () => {
    if (tradingBot.isRunning) {
        try {
            await tradingBot.executeTradingStrategy();
        } catch (error) {
            console.error('Error in scheduled trading execution:', error);
            await emailService.sendEmergencyAlert(
                'Trading Strategy Execution Failed',
                'The trading bot encountered an error during scheduled execution.',
                error
            );
        }
    }
}, {
    timezone: "America/New_York"
});

// Send daily report at market close
cron.schedule('0 16 * * 1-5', async () => {
    try {
        const performance = await tradingBot.calculatePerformance();
        await emailService.sendDailyReport(performance, [], []);
    } catch (error) {
        console.error('Error sending daily report:', error);
    }
}, {
    timezone: "America/New_York"
});

// Start server
app.listen(PORT, async () => {
    console.log(`Trading bot server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
    
    try {
        // Initialize and auto-start bot
        await tradingBot.initialize();
        tradingBot.start();
        console.log('🤖 Trading bot auto-started successfully');
        
        // Send startup notification
        await emailService.sendTradingAlert(
            'Trading Bot Started',
            'The Alpaca trading bot has been started successfully and is now monitoring the markets.'
        );
    } catch (error) {
        console.error('Failed to initialize trading bot:', error);
        await emailService.sendEmergencyAlert(
            'Bot Initialization Failed',
            'The trading bot failed to initialize on startup.',
            error
        );
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    tradingBot.stop();
    await emailService.sendEmergencyAlert(
        'Trading Bot Stopped - SIGTERM',
        'The trading bot has been stopped due to SIGTERM signal.'
    );
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    tradingBot.stop();
    await emailService.sendEmergencyAlert(
        'Trading Bot Stopped - Manual Interrupt',
        'The trading bot has been manually stopped.'
    );
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await emailService.sendEmergencyAlert(
        'Critical Error - Uncaught Exception',
        'The trading bot encountered an uncaught exception and may be unstable.',
        error
    );
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await emailService.sendEmergencyAlert(
        'Critical Error - Unhandled Promise Rejection',
        'The trading bot encountered an unhandled promise rejection.',
        new Error(reason)
    );
});
