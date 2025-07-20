<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Alpaca Trading Bot - Copilot Instructions

## Project Overview
This is an advanced Alpaca trading bot built with Node.js that focuses on options trading using technical analysis and news sentiment. The bot is designed to:

- Trade options contracts with 8-month expiration dates
- Stay at-the-money (ATM) when possible
- Execute both call and put strategies based on market analysis
- Use multiple technical indicators for decision making
- Incorporate news sentiment analysis
- Provide a real-time web dashboard for monitoring

## Key Technologies
- **Backend**: Node.js, Express.js
- **Trading API**: Alpaca Markets API (Paper Trading)
- **Technical Analysis**: technicalindicators library
- **News Data**: Alpaca News API + NewsAPI
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Deployment**: Railway platform

## Code Style Guidelines
- Use modern JavaScript (ES6+) features
- Follow async/await patterns for API calls
- Implement proper error handling and logging
- Use environment variables for all sensitive data
- Keep functions focused and modular
- Include comprehensive comments for trading logic

## Security Considerations
- All API keys must be stored in .env file
- Never commit sensitive credentials to version control
- Use helmet.js for security headers
- Validate all user inputs
- Implement rate limiting for API endpoints

## Trading Logic Guidelines
- Always verify market hours before placing trades
- Implement position sizing based on account risk percentage
- Use stop-loss and take-profit mechanisms
- Prioritize at-the-money options for optimal liquidity
- Combine multiple technical indicators for signal confirmation
- Consider news sentiment as a secondary factor

## File Structure
- `/src/services/` - External API integrations
- `/src/bot/` - Core trading logic
- `/public/` - Frontend dashboard files
- `/server.js` - Main application entry point

## Development Notes
- Use paper trading environment for all testing
- The bot focuses on liquid, high-volume stocks
- Options expiration target is 8 months from current date
- Risk management is crucial - never risk more than 2% per trade
- The dashboard updates every 30 seconds during market hours

When modifying trading algorithms, always consider:
1. Risk management implications
2. Market impact and liquidity
3. Regulatory compliance
4. Backtesting requirements
5. Performance monitoring
