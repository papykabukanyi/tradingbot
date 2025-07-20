#!/bin/bash

echo "Creating .env file from template..."

if [ -f .env ]; then
  echo ".env file already exists. Creating backup..."
  cp .env .env.bak
  echo "Backup created as .env.bak"
fi

echo "Copying template to .env..."
cp .env.template .env

echo
echo ".env file created successfully!"
echo
echo "NEXT STEPS:"
echo "1. Edit the .env file with your actual API keys"
echo "2. Run 'npm start' to start the trading bot"
echo
echo "NOTE: You need to replace the placeholder values in the .env file"
echo "with your actual Alpaca API keys for the bot to work."
