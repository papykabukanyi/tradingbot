const { SMA, EMA, RSI, MACD, BollingerBands, Stochastic } = require('technicalindicators');

class TechnicalAnalysis {
    constructor() {
        this.indicators = {};
    }

    calculateSMA(prices, period = 20) {
        return SMA.calculate({ period, values: prices });
    }

    calculateEMA(prices, period = 20) {
        return EMA.calculate({ period, values: prices });
    }

    calculateRSI(prices, period = 14) {
        return RSI.calculate({ period, values: prices });
    }

    calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        return MACD.calculate({
            values: prices,
            fastPeriod,
            slowPeriod,
            signalPeriod,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        });
    }

    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        return BollingerBands.calculate({
            period,
            values: prices,
            stdDev
        });
    }

    calculateStochastic(high, low, close, kPeriod = 14, dPeriod = 3) {
        return Stochastic.calculate({
            high,
            low,
            close,
            kPeriod,
            dPeriod
        });
    }

    async analyzeStock(symbol, priceData) {
        try {
            const closes = priceData.map(bar => parseFloat(bar.c));
            const highs = priceData.map(bar => parseFloat(bar.h));
            const lows = priceData.map(bar => parseFloat(bar.l));
            const volumes = priceData.map(bar => parseFloat(bar.v));

            if (closes.length < 50) {
                throw new Error(`Insufficient data for ${symbol}: ${closes.length} bars`);
            }

            // Calculate various indicators
            const sma20 = this.calculateSMA(closes, 20);
            const sma50 = this.calculateSMA(closes, 50);
            const ema12 = this.calculateEMA(closes, 12);
            const ema26 = this.calculateEMA(closes, 26);
            const rsi = this.calculateRSI(closes);
            const macd = this.calculateMACD(closes);
            const bb = this.calculateBollingerBands(closes);
            const stoch = this.calculateStochastic(highs, lows, closes);

            const currentPrice = closes[closes.length - 1];
            const currentSMA20 = sma20[sma20.length - 1];
            const currentSMA50 = sma50[sma50.length - 1];
            const currentRSI = rsi[rsi.length - 1];
            const currentMACD = macd[macd.length - 1];
            const currentBB = bb[bb.length - 1];
            const currentStoch = stoch[stoch.length - 1];

            // Calculate signals
            const signals = this.generateSignals({
                symbol,
                currentPrice,
                sma20: currentSMA20,
                sma50: currentSMA50,
                rsi: currentRSI,
                macd: currentMACD,
                bb: currentBB,
                stoch: currentStoch,
                volume: volumes[volumes.length - 1],
                avgVolume: volumes.slice(-20).reduce((a, b) => a + b) / 20
            });

            return {
                symbol,
                currentPrice,
                indicators: {
                    sma20: currentSMA20,
                    sma50: currentSMA50,
                    rsi: currentRSI,
                    macd: currentMACD,
                    bollingerBands: currentBB,
                    stochastic: currentStoch
                },
                signals,
                analysis: this.getAnalysis(signals),
                lastUpdate: new Date()
            };
        } catch (error) {
            console.error(`Error analyzing ${symbol}:`, error);
            throw error;
        }
    }

    generateSignals(data) {
        const signals = {
            trend: 'neutral',
            momentum: 'neutral',
            volatility: 'normal',
            volume: 'normal',
            overall: 'neutral',
            strength: 0,
            recommendation: 'hold'
        };

        let bullishSignals = 0;
        let bearishSignals = 0;

        // Trend Analysis
        if (data.currentPrice > data.sma20 && data.sma20 > data.sma50) {
            signals.trend = 'bullish';
            bullishSignals += 2;
        } else if (data.currentPrice < data.sma20 && data.sma20 < data.sma50) {
            signals.trend = 'bearish';
            bearishSignals += 2;
        }

        // RSI Analysis
        if (data.rsi < 30) {
            signals.momentum = 'oversold';
            bullishSignals += 1;
        } else if (data.rsi > 70) {
            signals.momentum = 'overbought';
            bearishSignals += 1;
        } else if (data.rsi > 50) {
            bullishSignals += 0.5;
        } else {
            bearishSignals += 0.5;
        }

        // MACD Analysis
        if (data.macd && data.macd.MACD > data.macd.signal) {
            bullishSignals += 1;
        } else if (data.macd && data.macd.MACD < data.macd.signal) {
            bearishSignals += 1;
        }

        // Bollinger Bands Analysis
        if (data.bb) {
            if (data.currentPrice < data.bb.lower) {
                signals.volatility = 'oversold';
                bullishSignals += 1;
            } else if (data.currentPrice > data.bb.upper) {
                signals.volatility = 'overbought';
                bearishSignals += 1;
            }
        }

        // Volume Analysis
        if (data.volume > data.avgVolume * 1.5) {
            signals.volume = 'high';
            if (bullishSignals > bearishSignals) {
                bullishSignals += 0.5;
            } else {
                bearishSignals += 0.5;
            }
        } else if (data.volume < data.avgVolume * 0.5) {
            signals.volume = 'low';
        }

        // Stochastic Analysis
        if (data.stoch) {
            if (data.stoch.k < 20 && data.stoch.d < 20) {
                bullishSignals += 0.5;
            } else if (data.stoch.k > 80 && data.stoch.d > 80) {
                bearishSignals += 0.5;
            }
        }

        // Overall signal
        const totalSignals = bullishSignals + bearishSignals;
        if (totalSignals > 0) {
            signals.strength = Math.round((bullishSignals - bearishSignals) / totalSignals * 100);
            
            if (signals.strength > 30) {
                signals.overall = 'bullish';
                signals.recommendation = 'buy';
            } else if (signals.strength < -30) {
                signals.overall = 'bearish';
                signals.recommendation = 'sell';
            }
        }

        return signals;
    }

    getAnalysis(signals) {
        const analysis = [];

        if (signals.trend === 'bullish') {
            analysis.push('Stock is in an uptrend with price above moving averages');
        } else if (signals.trend === 'bearish') {
            analysis.push('Stock is in a downtrend with price below moving averages');
        }

        if (signals.momentum === 'oversold') {
            analysis.push('RSI indicates oversold conditions - potential bounce');
        } else if (signals.momentum === 'overbought') {
            analysis.push('RSI indicates overbought conditions - potential pullback');
        }

        if (signals.volatility === 'oversold') {
            analysis.push('Price at lower Bollinger Band - potential support');
        } else if (signals.volatility === 'overbought') {
            analysis.push('Price at upper Bollinger Band - potential resistance');
        }

        if (signals.volume === 'high') {
            analysis.push('Above average volume confirms the move');
        } else if (signals.volume === 'low') {
            analysis.push('Below average volume suggests weak conviction');
        }

        return analysis;
    }

    isAtTheMoney(stockPrice, strikePrice, tolerance = 0.02) {
        const diff = Math.abs(stockPrice - strikePrice) / stockPrice;
        return diff <= tolerance;
    }

    findATMOptions(optionChain, stockPrice, expiration) {
        return optionChain.filter(option => {
            const isCorrectExpiration = option.expiration_date === expiration;
            const isATM = this.isAtTheMoney(stockPrice, option.strike_price);
            return isCorrectExpiration && isATM;
        });
    }

    calculateVolatility(prices, period = 20) {
        if (prices.length < period) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance * 252); // Annualized volatility
    }
}

module.exports = TechnicalAnalysis;
