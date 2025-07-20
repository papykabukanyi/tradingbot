const alpacaService = require('../services/alpacaService');
const newsService = require('../services/newsService');
const TechnicalAnalysis = require('../services/technicalAnalysis');
const moment = require('moment');

class TradingBot {
    constructor() {
        this.isRunning = false;
        this.lastUpdate = null;
        this.totalTrades = 0;
        this.profitLoss = 0;
        this.watchlist = [];
        this.technicalAnalysis = new TechnicalAnalysis();
        this.positions = new Map();
        this.maxPositionSize = parseFloat(process.env.MAX_POSITION_SIZE) || 1000;
        this.riskPercentage = parseFloat(process.env.RISK_PERCENTAGE) || 0.02;
        this.minVolume = parseFloat(process.env.MIN_VOLUME) || 10000;
        
        // Popular stocks for options trading with high volume and trending potential
        this.defaultWatchlist = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX',
            'SPY', 'QQQ', 'IWM', 'DIA', 'AMD', 'BABA', 'CRM', 'PYPL',
            'JPM', 'BAC', 'XOM', 'JNJ', 'PG', 'KO', 'DIS', 'V',
            'MA', 'HD', 'WMT', 'UNH', 'PFE', 'INTC', 'CSCO', 'VZ'
        ];
        
        // Trending stocks tracker
        this.trendingStocks = new Set();
        this.volumeThreshold = 1.5; // 150% of average volume
    }

    async initialize() {
        try {
            console.log('Initializing trading bot...');
            
            // Check account status
            const account = await alpacaService.getAccount();
            console.log(`Account Status: ${account.status}`);
            console.log(`Buying Power: $${parseFloat(account.buying_power).toFixed(2)}`);
            
            // Initialize watchlist
            await this.initializeWatchlist();
            
            // Load existing positions
            await this.loadPositions();
            
            console.log('Trading bot initialized successfully');
        } catch (error) {
            console.error('Error initializing trading bot:', error);
            throw error;
        }
    }

    async initializeWatchlist() {
        try {
            // Use default watchlist for now
            this.watchlist = [...this.defaultWatchlist];
            console.log(`Watchlist initialized with ${this.watchlist.length} symbols`);
        } catch (error) {
            console.error('Error initializing watchlist:', error);
            this.watchlist = this.defaultWatchlist;
        }
    }

    async loadPositions() {
        try {
            const positions = await alpacaService.getPositions();
            this.positions.clear();
            
            positions.forEach(position => {
                this.positions.set(position.symbol, position);
            });
            
            console.log(`Loaded ${positions.length} existing positions`);
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    }

    start() {
        this.isRunning = true;
        console.log('Trading bot started');
    }

    stop() {
        this.isRunning = false;
        console.log('Trading bot stopped');
    }

    async executeTradingStrategy() {
        if (!this.isRunning || !alpacaService.isMarketOpen()) {
            return;
        }

        try {
            console.log('Executing trading strategy...');
            
            // Analyze all watchlist stocks
            const analyses = await this.analyzeWatchlist();
            
            // Get news sentiment for watchlist
            const newsImpact = await newsService.getNewsImpact(this.watchlist);
            
            // Find trading opportunities
            const opportunities = this.findTradingOpportunities(analyses, newsImpact);
            
            // Execute trades
            await this.executeTrades(opportunities);
            
            this.lastUpdate = new Date();
            
        } catch (error) {
            console.error('Error executing trading strategy:', error);
        }
    }

    async analyzeWatchlist() {
        const analyses = [];
        
        for (const symbol of this.watchlist) {
            try {
                const priceData = await alpacaService.getStockBars(symbol, '1Day', 100);
                if (priceData.length < 50) continue;
                
                const analysis = await this.technicalAnalysis.analyzeStock(symbol, priceData);
                analyses.push(analysis);
                
            } catch (error) {
                console.error(`Error analyzing ${symbol}:`, error);
            }
        }
        
        return analyses;
    }

    findTradingOpportunities(analyses, newsImpact) {
        const opportunities = [];
        
        for (const analysis of analyses) {
            const { symbol, signals, currentPrice } = analysis;
            const news = newsImpact[symbol] || { sentiment: 'neutral', score: 0 };
            
            // Combine technical and fundamental analysis
            const opportunity = this.evaluateOpportunity(analysis, news);
            
            if (opportunity.action !== 'hold') {
                opportunities.push(opportunity);
            }
        }
        
        // Sort by confidence score
        return opportunities.sort((a, b) => b.confidence - a.confidence);
    }

    evaluateOpportunity(analysis, news) {
        const { symbol, signals, currentPrice, indicators } = analysis;
        
        let confidence = 0;
        let action = 'hold';
        let optionType = null;
        
        // Technical score
        let techScore = signals.strength / 100;
        
        // News sentiment score
        let newsScore = 0;
        if (news.sentiment === 'positive') newsScore = 0.3;
        else if (news.sentiment === 'negative') newsScore = -0.3;
        
        // Combined score
        const combinedScore = techScore + newsScore;
        confidence = Math.abs(combinedScore);
        
        // Determine action and option type
        if (combinedScore > 0.4) {
            action = 'buy';
            optionType = 'call';
        } else if (combinedScore < -0.4) {
            action = 'sell';
            optionType = 'put';
        }
        
        // Check if we already have a position
        const existingPosition = this.positions.get(symbol);
        if (existingPosition) {
            // Modify action based on existing position
            if (existingPosition.side === 'long' && action === 'sell') {
                action = 'close_long';
            } else if (existingPosition.side === 'short' && action === 'buy') {
                action = 'close_short';
            }
        }
        
        return {
            symbol,
            action,
            optionType,
            confidence,
            currentPrice,
            technicalScore: techScore,
            newsScore,
            combinedScore,
            signals: signals.recommendation,
            rsi: indicators.rsi,
            volume: analysis.volume || 'normal'
        };
    }

    async executeTrades(opportunities) {
        for (const opportunity of opportunities.slice(0, 3)) { // Limit to top 3 opportunities
            try {
                if (opportunity.confidence < 0.5) continue; // Skip low confidence trades
                
                await this.executeOptionTrade(opportunity);
                
            } catch (error) {
                console.error(`Error executing trade for ${opportunity.symbol}:`, error);
            }
        }
    }

    async executeOptionTrade(opportunity) {
        const { symbol, action, optionType, currentPrice, confidence } = opportunity;
        
        try {
            // Get option chain
            const optionChain = await alpacaService.getOptionChain(symbol);
            if (optionChain.length === 0) {
                console.log(`No options available for ${symbol}`);
                return;
            }
            
            // Find expiration date (8 months out)
            const targetExpiration = moment().add(8, 'months').format('YYYY-MM-DD');
            const nearestExpiration = this.findNearestExpiration(optionChain, targetExpiration);
            
            // Find at-the-money options
            const atmOptions = this.technicalAnalysis.findATMOptions(
                optionChain, 
                currentPrice, 
                nearestExpiration
            );
            
            if (atmOptions.length === 0) {
                console.log(`No ATM options found for ${symbol} at expiration ${nearestExpiration}`);
                return;
            }
            
            // Select appropriate option (call or put)
            const selectedOption = atmOptions.find(opt => 
                opt.type.toLowerCase() === optionType.toLowerCase()
            );
            
            if (!selectedOption) {
                console.log(`No ${optionType} options found for ${symbol}`);
                return;
            }
            
            // Calculate position size based on confidence and risk management
            const account = await alpacaService.getAccount();
            const buyingPower = parseFloat(account.buying_power);
            const maxRisk = buyingPower * this.riskPercentage;
            
            // Estimate option premium (simplified)
            const estimatedPremium = currentPrice * 0.05; // 5% of stock price as rough estimate
            const maxContracts = Math.floor(maxRisk / (estimatedPremium * 100));
            const contracts = Math.min(maxContracts, 5); // Max 5 contracts per trade
            
            if (contracts <= 0) {
                console.log(`Insufficient buying power for ${symbol} option trade`);
                return;
            }
            
            // Place option order
            console.log(`Placing ${optionType} option order for ${symbol}: ${contracts} contracts`);
            
            const orderResult = await alpacaService.placeOptionOrder(
                selectedOption.symbol,
                contracts,
                action === 'buy' ? 'buy' : 'sell'
            );
            
            console.log(`Order placed successfully for ${symbol}:`, orderResult.id);
            this.totalTrades++;
            
        } catch (error) {
            console.error(`Error executing option trade for ${symbol}:`, error);
        }
    }

    findNearestExpiration(optionChain, targetDate) {
        const target = moment(targetDate);
        let nearest = null;
        let minDiff = Infinity;
        
        for (const option of optionChain) {
            const expiration = moment(option.expiration_date);
            const diff = Math.abs(expiration.diff(target, 'days'));
            
            if (diff < minDiff) {
                minDiff = diff;
                nearest = option.expiration_date;
            }
        }
        
        return nearest;
    }

    async getWatchlist() {
        const watchlistData = [];
        
        for (const symbol of this.watchlist) {
            try {
                const quote = await alpacaService.getQuote(symbol);
                const news = await newsService.getStockNews(symbol, 2);
                
                watchlistData.push({
                    symbol,
                    price: quote?.bp || 0,
                    change: quote ? ((quote.bp - quote.ap) / quote.ap * 100).toFixed(2) : 0,
                    volume: quote?.bs || 0,
                    news: news.slice(0, 1)
                });
            } catch (error) {
                console.error(`Error getting data for ${symbol}:`, error);
                watchlistData.push({
                    symbol,
                    price: 0,
                    change: 0,
                    volume: 0,
                    news: []
                });
            }
        }
        
        return watchlistData;
    }

    async calculatePerformance() {
        try {
            const account = await alpacaService.getAccount();
            const portfolioHistory = await alpacaService.getPortfolioHistory('1D');
            
            if (portfolioHistory.equity && portfolioHistory.equity.length > 1) {
                const currentEquity = portfolioHistory.equity[portfolioHistory.equity.length - 1];
                const previousEquity = portfolioHistory.equity[portfolioHistory.equity.length - 2];
                this.profitLoss = currentEquity - previousEquity;
            }
            
            return {
                totalEquity: parseFloat(account.equity),
                dayChange: this.profitLoss,
                totalTrades: this.totalTrades,
                buyingPower: parseFloat(account.buying_power)
            };
        } catch (error) {
            console.error('Error calculating performance:', error);
            return {
                totalEquity: 0,
                dayChange: 0,
                totalTrades: this.totalTrades,
                buyingPower: 0
            };
        }
    }
}

module.exports = TradingBot;
