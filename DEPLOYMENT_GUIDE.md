# Trading Bot Deployment Guide

## Overview
The trading bot has been fixed and is ready for deployment. Here's what's been done:

1. Fixed the corrupted `server.js` file which was causing deployment failures
2. Created a `.env.template` file with all the required environment variables
3. Ensured proper initialization and structure of the bot

## Local Setup

1. Copy the `.env.template` file to a new file named `.env`:
   ```
   copy .env.template .env
   ```

2. Edit the `.env` file with your actual API keys and configuration:
   - Fill in your Alpaca API credentials
   - Add News API key if you have one (optional)
   - Configure email settings if you want notifications

3. Start the trading bot:
   ```
   npm start
   ```

## Railway Deployment

1. Make sure you've committed the fixed code to your repository

2. In the Railway dashboard, add the following environment variables:
   - `ALPACA_API_KEY` - Your Alpaca API key
   - `ALPACA_SECRET_KEY` - Your Alpaca API secret 
   - `ALPACA_BASE_URL` - Set to https://paper-api.alpaca.markets/v2
   - `ALPACA_DATA_URL` - Set to https://data.alpaca.markets/v2
   - `NODE_ENV` - Set to "production"
   - Email configuration (if you want email notifications):
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_TO`

3. Deploy your application in Railway

## Key Features

- **Automated Trading**: The bot automatically identifies trade opportunities based on technical analysis and news sentiment
- **Email Notifications**: When a trade opportunity is identified, it will send you an email with details about the contract it will purchase
- **Profit Target**: The bot will automatically exit positions when they reach a 15% profit
- **Dashboard**: Access real-time trading status at http://your-railway-url or locally at http://localhost:3000

## Troubleshooting

If you encounter any issues:

1. Check that all required environment variables are properly set
2. Review the logs for any error messages
3. Ensure your Alpaca API key has the necessary permissions
4. Make sure your email settings are correct if you're using email notifications

## Security Reminder

- Never commit your `.env` file or any file containing actual API keys to version control
- Use Railway's environment variable system for all secrets when deploying
- Consider using app-specific passwords for email accounts
- Rotate your API keys periodically for enhanced security
