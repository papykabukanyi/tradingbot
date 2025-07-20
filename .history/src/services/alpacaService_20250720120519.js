const Alpaca = require('@alpacahq/alpaca-trade-api');
const axios = require('axios');
const { config } = require('../config');

class AlpacaService {
    constructor() {
        this.alpaca = new Alpaca({
            keyId: config.alpaca.apiKey,
            secretKey: config.alpaca.secretKey,
            paper: true, // Using paper trading
            usePolygon: false
        });
        
        this.baseURL = config.alpaca.baseUrl;
        this.dataURL = config.alpaca.dataUrl;
    }

    async getAccount() {
        try {
            return await this.alpaca.getAccount();
        } catch (error) {
            console.error('Error getting account:', error);
            throw error;
        }
    }

    async getPositions() {
        try {
            return await this.alpaca.getPositions();
        } catch (error) {
            console.error('Error getting positions:', error);
            throw error;
        }
    }

    async getOrders(status = 'all') {
        try {
            return await this.alpaca.getOrders({ status });
        } catch (error) {
            console.error('Error getting orders:', error);
            throw error;
        }
    }

    async getPortfolioHistory(period = '1M') {
        try {
            return await this.alpaca.getPortfolioHistory({ period });
        } catch (error) {
            console.error('Error getting portfolio history:', error);
            throw error;
        }
    }

    async getStockBars(symbol, timeframe = '1Day', limit = 100) {
        try {
            const response = await axios.get(`${this.dataURL}/stocks/${symbol}/bars`, {
                params: {
                    timeframe,
                    limit,
                    asof: new Date().toISOString().split('T')[0]
                },
                headers: {
                    'APCA-API-KEY-ID': config.alpaca.apiKey,
                    'APCA-API-SECRET-KEY': config.alpaca.secretKey
                }
            });
            return response.data.bars || [];
        } catch (error) {
            console.error(`Error getting bars for ${symbol}:`, error);
            throw error;
        }
    }

    async getOptionChain(symbol) {
        try {
            const response = await axios.get(`${this.baseURL}/options/contracts`, {
                params: {
                    underlying_symbol: symbol,
                    status: 'active',
                    expiration_date_gte: this.getExpirationDate(),
                    expiration_date_lte: this.getMaxExpirationDate()
                },
                headers: {
                    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
                    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
                }
            });
            return response.data.option_contracts || [];
        } catch (error) {
            console.error(`Error getting option chain for ${symbol}:`, error);
            throw error;
        }
    }

    async placeOrder(orderData) {
        try {
            return await this.alpaca.createOrder(orderData);
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    }

    async placeOptionOrder(symbol, qty, side, type = 'market', timeInForce = 'day') {
        try {
            const orderData = {
                symbol,
                qty,
                side,
                type,
                time_in_force: timeInForce,
                class: 'option'
            };
            return await this.placeOrder(orderData);
        } catch (error) {
            console.error('Error placing option order:', error);
            throw error;
        }
    }

    async getQuote(symbol) {
        try {
            const response = await axios.get(`${this.dataURL}/stocks/${symbol}/quotes/latest`, {
                headers: {
                    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
                    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
                }
            });
            return response.data.quote;
        } catch (error) {
            console.error(`Error getting quote for ${symbol}:`, error);
            throw error;
        }
    }

    async cancelOrder(orderId) {
        try {
            return await this.alpaca.cancelOrder(orderId);
        } catch (error) {
            console.error('Error canceling order:', error);
            throw error;
        }
    }

    async getAssets() {
        try {
            return await this.alpaca.getAssets({ status: 'active', asset_class: 'us_equity' });
        } catch (error) {
            console.error('Error getting assets:', error);
            throw error;
        }
    }

    getExpirationDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + parseInt(process.env.OPTION_EXPIRY_MONTHS || 8));
        return date.toISOString().split('T')[0];
    }

    getMaxExpirationDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + parseInt(process.env.OPTION_EXPIRY_MONTHS || 8) + 1);
        return date.toISOString().split('T')[0];
    }

    isMarketOpen() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        
        // Market hours: Monday-Friday, 9:30 AM - 4:00 PM ET
        return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
    }
}

module.exports = new AlpacaService();
