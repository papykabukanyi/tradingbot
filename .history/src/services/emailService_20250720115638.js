const nodemailer = require('nodemailer');
const { config } = require('../config');

class EmailService {
    constructor() {
        // Only create transporter if email is configured
        if (config.email.enabled) {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: config.email.port === 465, // true for 465, false for other ports
                auth: {
                    user: config.email.user,
                    pass: config.email.pass
                }
            });
        } else {
            console.log('Email service not configured. Email notifications will be disabled.');
            this.transporter = null;
        }
    }

    async sendEmergencyAlert(subject, message, error = null) {
        // Skip if email is not configured
        if (!this.transporter || !config.email.enabled) {
            console.log(`Email notification skipped (not configured): ${subject}`);
            return;
        }
        
        try {
            const emailContent = `
🚨 TRADING BOT EMERGENCY ALERT 🚨

${message}

Time: ${new Date().toLocaleString()}
Server: ${config.server.environment}

${error ? `Error Details: ${error.message}\nStack: ${error.stack}` : ''}

Please check the trading bot immediately.

---
Alpaca Trading Bot Alert System
            `.trim();

            const mailOptions = {
                from: config.email.from,
                to: config.email.user, // Send to same email
                subject: `🚨 URGENT: ${subject}`,
                text: emailContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log('Emergency email sent successfully');
        } catch (error) {
            console.error('Failed to send emergency email:', error);
        }
    }

    async sendTradingAlert(subject, message, trades = []) {
        try {
            let tradesText = '';
            if (trades.length > 0) {
                tradesText = '\n\nTrade Details:\n' + trades.map(trade => 
                    `- ${trade.symbol}: ${trade.action} ${trade.quantity} @ ${trade.price}`
                ).join('\n');
            }

            const emailContent = `
📈 TRADING BOT NOTIFICATION

${message}${tradesText}

Time: ${new Date().toLocaleString()}
Server: ${process.env.NODE_ENV || 'development'}

---
Alpaca Trading Bot Alert System
            `.trim();

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: process.env.SMTP_USER,
                subject: `📈 ${subject}`,
                text: emailContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log('Trading alert email sent successfully');
        } catch (error) {
            console.error('Failed to send trading alert email:', error);
        }
    }

    async sendDailyReport(performance, trades, errors) {
        try {
            const emailContent = `
📊 DAILY TRADING BOT REPORT

Performance Summary:
- Total Equity: $${performance.totalEquity?.toFixed(2) || '0.00'}
- Day P&L: $${performance.dayChange?.toFixed(2) || '0.00'}
- Total Trades: ${performance.totalTrades || 0}
- Buying Power: $${performance.buyingPower?.toFixed(2) || '0.00'}

Recent Trades: ${trades.length}
Errors Today: ${errors.length}

${errors.length > 0 ? '\nErrors:\n' + errors.map(err => `- ${err}`).join('\n') : ''}

Date: ${new Date().toLocaleDateString()}

---
Alpaca Trading Bot Daily Report
            `.trim();

            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: process.env.SMTP_USER,
                subject: `📊 Daily Trading Report - ${new Date().toLocaleDateString()}`,
                text: emailContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log('Daily report email sent successfully');
        } catch (error) {
            console.error('Failed to send daily report email:', error);
        }
    }
}

module.exports = new EmailService();
