@echo off
echo Creating .env file from template...

if exist .env (
  echo .env file already exists. Creating backup...
  copy .env .env.bak
  echo Backup created as .env.bak
)

echo Copying template to .env...
copy .env.template .env

echo.
echo .env file created successfully!
echo.
echo NEXT STEPS:
echo 1. Edit the .env file with your actual API keys
echo 2. Run 'npm start' to start the trading bot
echo.
echo NOTE: You need to replace the placeholder values in the .env file
echo with your actual Alpaca API keys for the bot to work.
