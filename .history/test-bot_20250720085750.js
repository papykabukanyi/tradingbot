const TradingBot = require('./src/bot/TradingBot');

async function testBot() {
    console.log('Testing Trading Bot...');
    
    try {
        const bot = new TradingBot();
        console.log('✅ Trading bot created successfully');
        
        console.log('🔍 Testing trending stock detection...');
        await bot.initializeWatchlist();
        
        console.log('📊 Watchlist:', bot.watchlist.slice(0, 5));
        console.log('🔥 Trending stocks:', Array.from(bot.trendingStocks));
        
        console.log('✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBot();
