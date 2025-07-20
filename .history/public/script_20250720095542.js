// Alpaca Trading Bot Dashboard JavaScript
class TradingDashboard {
    constructor() {
        this.updateInterval = 30000; // 30 seconds
        this.intervalId = null;
        this.init();
    }

    init() {
        console.log('Initializing Trading Dashboard...');
        this.setupEventListeners();
        this.loadInitialData();
        this.startAutoUpdate();
        this.showTab(null, 'dashboard'); // Show dashboard by default
    }

    setupEventListeners() {
        // Add event listeners for tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.showTab(e, tabName);
            });
        });

        // Add refresh button listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('refresh-btn')) {
                this.refreshAllData();
            }
        });
    }

    showTab(event, tabName) {
        console.log('Switching to tab:', tabName);
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
            selectedTab.style.display = 'block';
        }

        // Add active class to clicked button
        if (event && event.target) {
            event.target.classList.add('active');
        } else {
            // Find and activate the correct button
            document.querySelectorAll('.tab-button').forEach(button => {
                if (button.getAttribute('data-tab') === tabName) {
                    button.classList.add('active');
                }
            });
        }

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'dashboard':
                this.loadAccountData();
                this.loadBotStatus();
                this.loadPerformanceData();
                break;
            case 'news':
                this.loadMarketNews();
                break;
            case 'analysis':
                this.loadMarketAnalysis();
                break;
            case 'trades':
                this.loadRecentTrades();
                this.loadPositions();
                break;
            case 'settings':
                this.loadBotSettings();
                break;
        }
    }

    loadInitialData() {
        this.loadAccountData();
        this.loadBotStatus();
        this.loadPerformanceData();
    }

    startAutoUpdate() {
        this.intervalId = setInterval(() => {
            this.refreshAllData();
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    refreshAllData() {
        console.log('Refreshing all data...');
        this.loadAccountData();
        this.loadBotStatus();
        this.loadPerformanceData();
        
        // Update timestamp
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    }

    async loadAccountData() {
        try {
            const response = await fetch('/api/account');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('buyingPower').textContent = `$${Number(data.account.buying_power).toLocaleString()}`;
                document.getElementById('portfolioValue').textContent = `$${Number(data.account.portfolio_value).toLocaleString()}`;
                document.getElementById('equity').textContent = `$${Number(data.account.equity).toLocaleString()}`;
                document.getElementById('cash').textContent = `$${Number(data.account.cash).toLocaleString()}`;
                
                // Calculate and display P&L
                const dayChange = Number(data.account.unrealized_pl) || 0;
                const dayChangePercent = Number(data.account.unrealized_plpc) * 100 || 0;
                
                const plElement = document.getElementById('dayPL');
                plElement.textContent = `${dayChange >= 0 ? '+' : ''}$${dayChange.toFixed(2)} (${dayChangePercent.toFixed(2)}%)`;
                plElement.className = `metric-value ${dayChange >= 0 ? 'positive' : 'negative'}`;
            }
        } catch (error) {
            console.error('Error loading account data:', error);
            this.showError('accountData', 'Failed to load account data');
        }
    }

    async loadBotStatus() {
        try {
            const response = await fetch('/api/bot/status');
            const data = await response.json();
            
            const statusElement = document.getElementById('botStatus');
            statusElement.textContent = data.isRunning ? 'ACTIVE' : 'INACTIVE';
            statusElement.className = `status ${data.isRunning ? 'active' : 'inactive'}`;
            
            document.getElementById('botUptime').textContent = data.uptime || 'N/A';
            document.getElementById('totalTrades').textContent = data.totalTrades || '0';
            document.getElementById('successRate').textContent = `${data.successRate || 0}%`;
        } catch (error) {
            console.error('Error loading bot status:', error);
            this.showError('botStatus', 'Failed to load bot status');
        }
    }

    async loadPerformanceData() {
        try {
            const response = await fetch('/api/performance');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('totalReturn').textContent = `${data.performance.total_return || 0}%`;
                document.getElementById('weeklyReturn').textContent = `${data.performance.weekly_return || 0}%`;
                document.getElementById('monthlyReturn').textContent = `${data.performance.monthly_return || 0}%`;
                document.getElementById('sharpeRatio').textContent = data.performance.sharpe_ratio || 'N/A';
            }
        } catch (error) {
            console.error('Error loading performance data:', error);
            this.showError('performanceData', 'Failed to load performance data');
        }
    }

    async loadMarketNews() {
        try {
            const response = await fetch('/api/news?limit=10');
            const data = await response.json();
            
            let newsHTML = '';
            
            if (data.articles && data.articles.length > 0) {
                data.articles.forEach(article => {
                    const sentiment = article.sentiment || 'NEUTRAL';
                    const sentimentClass = sentiment.toLowerCase() === 'positive' ? 'positive' : 
                                         sentiment.toLowerCase() === 'negative' ? 'negative' : 'neutral';
                    
                    newsHTML += `
                        <div class="news-item">
                            <h4>${article.headline || article.title}</h4>
                            <p>${(article.summary || article.description || 'No summary available').substring(0, 200)}...</p>
                            <div class="news-meta">
                                <span class="news-time">
                                    ${new Date(article.published_at || article.publishedAt).toLocaleString()}
                                </span>
                                <div>
                                    <span class="metric-value ${sentimentClass}">${sentiment.toUpperCase()}</span>
                                    ${article.url ? `<a href="${article.url}" target="_blank" class="news-link">Read More</a>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                newsHTML = '<div class="loading">No news articles available</div>';
            }
            
            document.getElementById('newsList').innerHTML = newsHTML;
        } catch (error) {
            console.error('Error loading market news:', error);
            document.getElementById('newsList').innerHTML = '<div class="error">Failed to load market news</div>';
        }
    }

    async loadMarketAnalysis() {
        try {
            const response = await fetch('/api/analysis');
            const data = await response.json();
            
            if (data.success && data.analysis) {
                document.getElementById('marketTrend').textContent = data.analysis.trend || 'N/A';
                document.getElementById('volatility').textContent = `${data.analysis.volatility || 0}%`;
                document.getElementById('rsi').textContent = data.analysis.rsi || 'N/A';
                document.getElementById('macd').textContent = data.analysis.macd || 'N/A';
            }
        } catch (error) {
            console.error('Error loading market analysis:', error);
            this.showError('analysisData', 'Failed to load market analysis');
        }
    }

    async loadRecentTrades() {
        try {
            const response = await fetch('/api/orders');
            const data = await response.json();
            
            let tradesHTML = '';
            
            if (data.orders && data.orders.length > 0) {
                data.orders.slice(0, 10).forEach(order => {
                    const statusClass = order.status === 'filled' ? 'positive' : 
                                       order.status === 'cancelled' ? 'negative' : 'neutral';
                    
                    tradesHTML += `
                        <div class="order-item">
                            <div class="order-header">
                                <span class="order-symbol">${order.symbol}</span>
                                <span class="metric-value ${statusClass}">${order.status.toUpperCase()}</span>
                            </div>
                            <div class="order-details">
                                <div class="metric">
                                    <span class="metric-label">Side</span>
                                    <span class="metric-value">${order.side.toUpperCase()}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Qty</span>
                                    <span class="metric-value">${order.qty}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Price</span>
                                    <span class="metric-value">$${Number(order.filled_avg_price || order.limit_price || 0).toFixed(2)}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Time</span>
                                    <span class="metric-value">${new Date(order.created_at).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                tradesHTML = '<div class="loading">No recent trades</div>';
            }
            
            document.getElementById('recentTrades').innerHTML = tradesHTML;
        } catch (error) {
            console.error('Error loading recent trades:', error);
            document.getElementById('recentTrades').innerHTML = '<div class="error">Failed to load trades</div>';
        }
    }

    async loadPositions() {
        try {
            const response = await fetch('/api/positions');
            const data = await response.json();
            
            let positionsHTML = '';
            
            if (data.positions && data.positions.length > 0) {
                data.positions.forEach(position => {
                    const plClass = Number(position.unrealized_pl) >= 0 ? 'positive' : 'negative';
                    
                    positionsHTML += `
                        <div class="position-item">
                            <div class="order-header">
                                <span class="order-symbol">${position.symbol}</span>
                                <span class="metric-value ${plClass}">
                                    ${Number(position.unrealized_pl) >= 0 ? '+' : ''}$${Number(position.unrealized_pl).toFixed(2)}
                                </span>
                            </div>
                            <div class="order-details">
                                <div class="metric">
                                    <span class="metric-label">Qty</span>
                                    <span class="metric-value">${position.qty}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Avg Cost</span>
                                    <span class="metric-value">$${Number(position.avg_cost).toFixed(2)}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Market Value</span>
                                    <span class="metric-value">$${Number(position.market_value).toFixed(2)}</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">P&L %</span>
                                    <span class="metric-value ${plClass}">
                                        ${(Number(position.unrealized_plpc) * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                positionsHTML = '<div class="loading">No open positions</div>';
            }
            
            document.getElementById('currentPositions').innerHTML = positionsHTML;
        } catch (error) {
            console.error('Error loading positions:', error);
            document.getElementById('currentPositions').innerHTML = '<div class="error">Failed to load positions</div>';
        }
    }

    async loadBotSettings() {
        try {
            const response = await fetch('/api/bot/settings');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('riskPercentage').value = data.settings.riskPercentage || 2;
                document.getElementById('maxPositions').value = data.settings.maxPositions || 5;
                document.getElementById('stopLoss').value = data.settings.stopLoss || 10;
                document.getElementById('takeProfit').value = data.settings.takeProfit || 20;
            }
        } catch (error) {
            console.error('Error loading bot settings:', error);
            this.showError('settingsForm', 'Failed to load bot settings');
        }
    }

    async saveBotSettings() {
        try {
            const settings = {
                riskPercentage: document.getElementById('riskPercentage').value,
                maxPositions: document.getElementById('maxPositions').value,
                stopLoss: document.getElementById('stopLoss').value,
                takeProfit: document.getElementById('takeProfit').value
            };

            const response = await fetch('/api/bot/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Settings saved successfully!');
            } else {
                this.showError('settingsForm', 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving bot settings:', error);
            this.showError('settingsForm', 'Failed to save settings');
        }
    }

    async startBot() {
        try {
            const response = await fetch('/api/bot/start', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Bot started successfully!');
                this.loadBotStatus();
            } else {
                this.showError('botControls', 'Failed to start bot');
            }
        } catch (error) {
            console.error('Error starting bot:', error);
            this.showError('botControls', 'Failed to start bot');
        }
    }

    async stopBot() {
        try {
            const response = await fetch('/api/bot/stop', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Bot stopped successfully!');
                this.loadBotStatus();
            } else {
                this.showError('botControls', 'Failed to stop bot');
            }
        } catch (error) {
            console.error('Error stopping bot:', error);
            this.showError('botControls', 'Failed to stop bot');
        }
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    showSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ade80;
            color: #000;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 700;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new TradingDashboard();
});

// Add CSS animation for success messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
