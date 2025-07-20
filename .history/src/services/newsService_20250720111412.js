const axios = require('axios');

class NewsService {
    constructor() {
        this.newsApiKey = process.env.NEWS_API_KEY;
        this.alpacaNewsUrl = 'https://data.alpaca.markets/v1beta1/news';
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
        // Simple sentiment analysis based on keywords
        const positiveKeywords = [
            'growth', 'profit', 'gain', 'rise', 'increase', 'success', 'positive',
            'bullish', 'upgrade', 'beat', 'exceed', 'strong', 'boom', 'rally'
        ];
        
        const negativeKeywords = [
            'loss', 'decline', 'fall', 'drop', 'negative', 'bearish', 'downgrade',
            'miss', 'weak', 'crash', 'recession', 'concern', 'risk', 'uncertainty'
        ];

        return articles.map(article => {
            const text = `${article.headline || article.title || ''} ${article.summary || article.description || ''}`.toLowerCase();
            
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

            let sentiment = 'neutral';
            if (positiveScore > negativeScore) {
                sentiment = 'positive';
            } else if (negativeScore > positiveScore) {
                sentiment = 'negative';
            }

            return {
                ...article,
                sentiment,
                sentimentScore: positiveScore - negativeScore
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
                
                const totalSentiment = analyzedNews.reduce((sum, article) => sum + article.sentimentScore, 0);
                const avgSentiment = analyzedNews.length > 0 ? totalSentiment / analyzedNews.length : 0;
                
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
        
        // Common stock market tickers from major exchanges
        const commonTickers = new Set([
            'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'NVDA', 'JPM', 
            'BAC', 'WMT', 'DIS', 'NFLX', 'INTC', 'AMD', 'IBM', 'CSCO', 'ORCL', 'CRM',
            'V', 'MA', 'PG', 'JNJ', 'KO', 'PEP', 'MCD', 'NKE', 'SBUX', 'GS', 'MS'
        ]);
        
        // Words that might match pattern but aren't stocks (like FBI, CEO, etc.)
        const notStocks = new Set([
            'CEO', 'CFO', 'CTO', 'COO', 'FBI', 'SEC', 'FED', 'GDP', 'IPO', 'USA',
            'NYSE', 'AI', 'ML', 'AR', 'VR', 'IoT', 'SaaS', 'API'
        ]);
        
        // Find all matches
        const matches = [...text.matchAll(symbolRegex)];
        const detectedSymbols = new Set();
        
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
