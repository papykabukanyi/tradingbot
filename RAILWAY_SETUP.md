## Railway Configuration Guide for Trading Bot

### Environment Variables

When deploying to Railway, you should set all environment variables in the Railway dashboard instead of relying on the .env file. This keeps your secrets secure and out of version control.

#### Required Environment Variables:

1. **Alpaca API Credentials:**
   - `ALPACA_API_KEY` - Your Alpaca API key
   - `ALPACA_SECRET_KEY` - Your Alpaca API secret
   - `ALPACA_BASE_URL` - Set to https://paper-api.alpaca.markets/v2
   - `ALPACA_DATA_URL` - Set to https://data.alpaca.markets/v2

2. **News API (Optional but recommended):**
   - `NEWS_API_KEY` - Your News API key

3. **Email Notifications:**
   - `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
   - `SMTP_PORT` - SMTP port (typically 587)
   - `SMTP_USER` - Email username
   - `SMTP_PASS` - Email password or app password
   - `EMAIL_FROM` - Sender email address

4. **Bot Configuration:**
   - `PORT` - Web server port (Railway will set this automatically)
   - `NODE_ENV` - Set to "production"
   - `MAX_POSITION_SIZE` - Maximum position size in USD
   - `RISK_PERCENTAGE` - Risk percentage per trade (e.g., 0.02 for 2%)
   - `MIN_VOLUME` - Minimum volume for stock consideration

### Setup Instructions

1. Create a new project in Railway
2. Connect your GitHub repository
3. Add all environment variables in the Railway dashboard
4. Deploy the project

### Security Notes

- Never commit `.env` files with real credentials to your repository
- Use Railway's environment variable system for all secrets
- Consider using app-specific passwords for email accounts
- Rotate your API keys periodically for enhanced security
