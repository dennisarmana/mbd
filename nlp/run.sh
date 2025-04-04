#!/bin/bash
# Make Better Decisions (MBD) - Launcher Script
# Starts the BERT-based constraint analyzer application

# Activate virtual environment
source venv/bin/activate

# Check if we're in the right directory
if [ ! -f "run_app.py" ]; then
  echo "Error: run_app.py not found. Please run this script from the nlp directory."
  exit 1
fi

# Make sure the static directory exists
if [ ! -d "static" ]; then
  echo "Error: static directory not found."
  exit 1
fi

# Start the application
echo "Starting Make Better Decisions (MBD) application..."
python run_app.py

# Handle exit
echo "Application terminated."
