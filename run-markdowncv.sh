#!/bin/bash

# Print header
echo -e "\033[1;34m========================================\033[0m"
echo -e "\033[1;34m  Markdown CV Generator - WSL Wrapper   \033[0m"
echo -e "\033[1;34m========================================\033[0m"

# Ensure the CLI script is executable
chmod +x "$(pwd)/src/cli.js"

# Check if running in WSL
if grep -q Microsoft /proc/version; then
  echo -e "\033[1;33mRunning in WSL environment\033[0m"
  
  # Check Ubuntu version
  if grep -q "Ubuntu 24.04" /etc/os-release; then
    echo -e "\033[0;36mUbuntu 24.04 detected. If you encounter Chrome/Puppeteer errors, try:"
    echo -e "  1. Run with --html-only flag: ./run-markdowncv.sh -build --default --html-only"
    echo -e "  2. Install Chrome dependencies with:"
    echo -e "     sudo apt update && sudo apt install -y ca-certificates fonts-liberation libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libcairo2 libcups2t64 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libglib2.0-0t64 libgtk-3-0t64 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 xdg-utils\033[0m"
  else
    echo -e "\033[0;36mIf you encounter Chrome/Puppeteer errors, try:"
    echo -e "  1. Run with --html-only flag: ./run-markdowncv.sh -build --default --html-only"
    echo -e "  2. Install Chrome dependencies with:"
    echo -e "     sudo apt update && sudo apt install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 xdg-utils\033[0m"
  fi
  echo
fi

echo -e "\033[0;36mExample commands:\033[0m"
echo -e "  ./run-markdowncv.sh -build --default           # Generate PDF with default theme"
echo -e "  ./run-markdowncv.sh -build --default-dark      # Generate PDF with dark theme"
echo -e "  ./run-markdowncv.sh -build --light             # Generate PDF with light theme"
echo -e "  ./run-markdowncv.sh -build --default --html-only  # Generate HTML only\n"

# Run the CLI script directly with Node.js
node "$(pwd)/src/cli.js" "$@" 