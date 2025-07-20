#!/usr/bin/env node

// Script to verify environment variables before starting the bot
require('dotenv').config();
const chalk = require('chalk');

// Essential environment variables
const requiredVars = [
  'ALPACA_API_KEY',
  'ALPACA_SECRET_KEY',
  'ALPACA_BASE_URL',
  'ALPACA_DATA_URL'
];

// Optional but recommended variables
const recommendedVars = [
  'NEWS_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM'
];

// Check for missing required variables
const missingRequired = requiredVars.filter(varName => !process.env[varName]);

if (missingRequired.length > 0) {
  console.error(chalk.red.bold('❌ ERROR: Missing required environment variables:'));
  missingRequired.forEach(varName => {
    console.error(chalk.red(` - ${varName}`));
  });
  console.error(chalk.yellow('\nMake sure you have an .env file with all required variables or set them in your environment.'));
  process.exit(1);
}

// Check for missing recommended variables
const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);

if (missingRecommended.length > 0) {
  console.warn(chalk.yellow('⚠️  WARNING: Missing recommended environment variables:'));
  missingRecommended.forEach(varName => {
    console.warn(chalk.yellow(` - ${varName}`));
  });
  console.warn(chalk.yellow('\nThese are not required but recommended for full functionality.'));
}

// All required variables present
console.log(chalk.green.bold('✅ Environment variables validated successfully!'));

// Display configuration
console.log(chalk.cyan('\n📋 Configuration:'));
console.log(chalk.cyan(' - Environment:'), process.env.NODE_ENV || 'development');
console.log(chalk.cyan(' - API Keys:'), 'Configured correctly');
console.log(chalk.cyan(' - Email Notifications:'), process.env.SMTP_HOST ? 'Enabled' : 'Disabled');
console.log(chalk.cyan(' - News API:'), process.env.NEWS_API_KEY ? 'Configured' : 'Not configured');

console.log(chalk.green.bold('\n🚀 Ready to start trading bot!'));
