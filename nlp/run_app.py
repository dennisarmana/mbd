#!/usr/bin/env python3
"""
Make Better Decisions (MBD) Application Runner
---------------------------------------------
Starts the BERT-based constraint analyzer API and serves the web UI.

Usage:
  python run_app.py

The application will be available at:
  - API: http://localhost:5000
  - Web UI: http://localhost:8000
"""

import os
import sys
import subprocess
import threading
import webbrowser
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler

def run_api_server():
    """Run the Flask API server."""
    print("Starting BERT Constraint Analyzer API server...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run the Flask app
    try:
        from api import app
        app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
    except Exception as e:
        print(f"Error starting API server: {e}")
        sys.exit(1)

def run_web_server():
    """Run a simple HTTP server for the web UI."""
    print("Starting web UI server...")
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static'))
    
    # Start HTTP server
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print("Web UI server started at http://localhost:8080")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Web server stopped.")
    except Exception as e:
        print(f"Error in web server: {e}")

if __name__ == "__main__":
    # Start API server in a separate thread
    api_thread = threading.Thread(target=run_api_server)
    api_thread.daemon = True
    api_thread.start()
    
    # Start web server in a separate thread
    web_thread = threading.Thread(target=run_web_server)
    web_thread.daemon = True
    web_thread.start()
    
    # Wait for servers to initialize
    time.sleep(1)
    
    # Open web UI in browser
    print("Opening web UI in browser...")
    webbrowser.open('http://localhost:8080')
    
    print("\nMake Better Decisions (MBD) application is running!")
    print("API server: http://localhost:5001")
    print("Web UI: http://localhost:8080")
    print("\nPress Ctrl+C to exit.")
    
    try:
        # Keep the main thread running to keep daemon threads alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping servers...")
        sys.exit(0)
