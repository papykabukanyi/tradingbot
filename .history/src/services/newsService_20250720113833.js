const axios = require('axios');

class NewsService {
    constructor() {
        this.newsApiKey = process.env.NEWS_API_KEY;
        this.alpacaNewsUrl = 'https://data.alpaca.markets/v1beta1/news';
        this.tradingBotWatchlist = null; // Will be set by the trading bot
    }
    
    // Allow the trading bot to share its watchlist with the news service
    setWatchlist(watchlist) {
        if (Array.isArray(watchlist)) {
            this.tradingBotWatchlist = watchlist;
            console.log(`News service updated with ${watchlist.length} watchlist symbols`);
        }
    }

    async getFinancialNews(symbols = [], limit = 10) {
        try {
            const params = {
                limit,
                sort: 'desc'
            };
            
            if (symbols.length > 0) {
                params.symbols = symbols.join(',');
            }

            const response = await axios.get(this.alpacaNewsUrl, {
                params,
                headers: {
                    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
                    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
                }
            });

            return response.data.news || [];
        } catch (error) {
            console.error('Error fetching Alpaca news:', error);
            return [];
        }
    }

    async getMarketNews(limit = 20) {
        try {
            if (!this.newsApiKey) {
                console.warn('News API key not configured, using Alpaca news only');
                return await this.getFinancialNews([], limit);
            }

            const response = await axios.get('https://newsapi.org/v2/top-headlines', {
                params: {
                    category: 'business',
                    country: 'us',
                    pageSize: limit,
                    apiKey: this.newsApiKey
                }
            });

            return response.data.articles || [];
        } catch (error) {
            console.error('Error fetching market news:', error);
            // Fallback to Alpaca news
            return await this.getFinancialNews([], limit);
        }
    }

    async analyzeNewsSentiment(articles) {
        // Handle empty arrays or undefined inputs
        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            console.warn('No articles to analyze, returning empty array');
            return [];
        }
        
        // Simple sentiment analysis based on keywords
        const positiveKeywords = [
            'growth', 'profit', 'gain', 'rise', 'increase', 'success', 'positive',
            'bullish', 'upgrade', 'beat', 'exceed', 'strong', 'boom', 'rally',
            'outperform', 'buy', 'overweight', 'target', 'higher', 'optimistic'
        ];
        
        const negativeKeywords = [
            'loss', 'decline', 'fall', 'drop', 'negative', 'bearish', 'downgrade',
            'miss', 'weak', 'crash', 'recession', 'concern', 'risk', 'uncertainty',
            'underperform', 'sell', 'underweight', 'downgrade', 'lower', 'pessimistic'
        ];

        return articles.map(article => {
            const fullText = `${article.headline || article.title || ''} ${article.summary || article.description || ''}`;
            const text = fullText.toLowerCase();
            
            // Detect stock symbols in the article
            const detectedSymbols = this.detectStockSymbols(fullText);
            
            let positiveScore = 0;
            let negativeScore = 0;

            positiveKeywords.forEach(keyword => {
                const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
                positiveScore += matches;
            });

            negativeKeywords.forEach(keyword => {
                const matches = (text.match(new RegExp(keyword, 'g')) || []).length;
                negativeScore += matches;
            });

            // Give a slight boost to more detailed articles
            const contentLength = text.length;
            if (contentLength > 500) positiveScore += 0.5;
            
            // Check if detected symbols are in the watchlist (higher relevance)
            let relevanceBoost = 0;
            if (this.tradingBotWatchlist && detectedSymbols.length > 0) {
                for (const symbol of detectedSymbols) {
                    if (this.tradingBotWatchlist.includes(symbol)) {
                        relevanceBoost += 0.5; // Add a small boost for each watchlist symbol found
                    }
                }
            }

            let sentiment = 'neutral';
            if (positiveScore > negativeScore) {
                sentiment = 'positive';
            } else if (negativeScore > positiveScore) {
                sentiment = 'negative';
            }
            
            // Calculate sentiment score with relevance boost
            const sentimentScore = (positiveScore - negativeScore) + relevanceBoost;

            return {
                ...article,
                sentiment,
                sentimentScore,
                detectedSymbols: detectedSymbols
            };
        });
    }

    async getStockNews(symbol, limit = 5) {
        try {
            return await this.getFinancialNews([symbol], limit);
        } catch (error) {
            console.error(`Error fetching news for ${symbol}:`, error);
            return [];
        }
    }

    async getNewsImpact(symbols) {
        try {
            const newsPromises = symbols.map(symbol => this.getStockNews(symbol, 3));
            const allNews = await Promise.all(newsPromises);
            
            const newsImpact = {};
            
            symbols.forEach((symbol, index) => {
                const stockNews = allNews[index];
                const analyzedNews = this.analyzeNewsSentiment(stockNews);
                
                // Ensure analyzedNews is always an array
                const newsArray = Array.isArray(analyzedNews) ? analyzedNews : [];
                
                const totalSentiment = newsArray.reduce((sum, article) => sum + (article.sentimentScore || 0), 0);
                const avgSentiment = newsArray.length > 0 ? totalSentiment / newsArray.length : 0;
                
                newsImpact[symbol] = {
                    sentiment: avgSentiment > 0 ? 'positive' : avgSentiment < 0 ? 'negative' : 'neutral',
                    score: avgSentiment,
                    articles: analyzedNews.length,
                    recentNews: analyzedNews.slice(0, 2)
                };
            });
            
            return newsImpact;
        } catch (error) {
            console.error('Error analyzing news impact:', error);
            return {};
        }
    }

    filterRelevantNews(articles, keywords = []) {
        if (keywords.length === 0) return articles;
        
        return articles.filter(article => {
            const text = `${article.headline || article.title || ''} ${article.summary || article.description || ''}`.toLowerCase();
            return keywords.some(keyword => text.includes(keyword.toLowerCase()));
        });
    }
    
    detectStockSymbols(text) {
        // Common stock symbols pattern - generally 1-5 uppercase letters
        const symbolRegex = /\b([A-Z]{1,5})\b/g;
        
        // Extended common stock market tickers from major exchanges (added more popular symbols)
        const commonTickers = new Set([
            'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'NVDA', 'JPM', 
            'BAC', 'WMT', 'DIS', 'NFLX', 'INTC', 'AMD', 'IBM', 'CSCO', 'ORCL', 'CRM',
            'V', 'MA', 'PG', 'JNJ', 'KO', 'PEP', 'MCD', 'NKE', 'SBUX', 'GS', 'MS',
            'SPY', 'QQQ', 'IWM', 'DIA', 'XLF', 'XLE', 'XLK', 'XLV', 'PYPL', 'BABA',
            'UBER', 'LYFT', 'PLTR', 'COIN', 'ZM', 'SHOP', 'SQ', 'ROKU', 'TTD', 'SNAP',
            'TWTR', 'PINS', 'ETSY', 'DASH', 'ABNB', 'RBLX', 'GME', 'AMC', 'BB', 'NOK'
        ]);
        
        // Words that might match pattern but aren't stocks (extended list)
        const notStocks = new Set([
            'CEO', 'CFO', 'CTO', 'COO', 'FBI', 'SEC', 'FED', 'GDP', 'IPO', 'USA',
            'NYSE', 'AI', 'ML', 'AR', 'VR', 'IoT', 'SaaS', 'API', 'EPS', 'ETF',
            'ESG', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CPI', 'PPI',
            'PMI', 'FAQ', 'CES', 'CSS', 'HTML', 'JSON', 'REST', 'SQL', 'AWS', 'GCP',
            'UK', 'EU', 'UN', 'WHO', 'IMF', 'ECB', 'WTO', 'CDC', 'FDA', 'EMA'
        ]);
        
        // First check the watchlist symbols explicitly - these have priority
        const detectedSymbols = new Set();
        
        // If the class has a reference to the trading bot's watchlist, use it for higher accuracy
        try {
            // First check for watchlist symbols - these are known to be valid
            if (this.tradingBotWatchlist) {
                for (const symbol of this.tradingBotWatchlist) {
                    // Only add if the symbol appears in the text as a word
                    if (new RegExp('\\b' + symbol + '\\b', 'i').test(text)) {
                        detectedSymbols.add(symbol);
                    }
                }
            }
        } catch (error) {
            console.warn('Error checking watchlist symbols:', error);
        }
        
        // Then find all regex matches
        const matches = [...text.matchAll(symbolRegex)];
        
        matches.forEach(match => {
            const symbol = match[1];
            // Add if it's a common ticker or longer than 1 letter and not in notStocks
            if (commonTickers.has(symbol) || (symbol.length > 1 && !notStocks.has(symbol))) {
                detectedSymbols.add(symbol);
            }
        });
        
        return Array.from(detectedSymbols);
    }
    
    async analyzeNewsWithSymbols(articles) {
        // First, analyze sentiment
        const analyzedArticles = await this.analyzeNewsSentiment(articles);
        
        // Then detect stock symbols in each article
        return analyzedArticles.map(article => {
            const text = `${article.headline || article.title || ''} ${article.summary || article.description || ''}`;
            const detectedSymbols = this.detectStockSymbols(text);
            
            // Calculate trading impact based on sentiment score
            const tradingImpact = article.sentimentScore > 1.5 ? 'Strong Bullish' : 
                                 article.sentimentScore > 0.5 ? 'Mildly Bullish' :
                                 article.sentimentScore < -1.5 ? 'Strong Bearish' :
                                 article.sentimentScore < -0.5 ? 'Mildly Bearish' : 'Neutral';
            
            return {
                ...article,
                detectedSymbols,
                tradingImpact
            };
        });
    }
}

module.exports = new NewsService();
