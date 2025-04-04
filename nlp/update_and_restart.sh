#!/bin/bash
# Update and Restart Script for MBD Integration
# This script stops all running Flask servers, updates the API and 
# ConstraintAnalyzer implementations, and then restarts the server cleanly.

echo "===== MBD Integration Update and Restart ====="
echo "Stopping all running Flask servers..."

# Kill all running Python processes related to our app
pkill -f "python run_app.py"
pkill -f "python -m http.server" 
pkill -f "python bridge.py"

echo "Waiting for processes to terminate..."
sleep 2

# Activate the virtual environment
source venv/bin/activate

echo "Starting the application with updated code..."
python run_app.py
