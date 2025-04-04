#!/usr/bin/env python3
"""
Bridge Script for MBD Integration
--------------------------------
A simple Flask API that uses our direct implementation
to bypass the module caching issues in the main API.
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from direct_test import direct_analyze_dataset

# Configure detailed logging
logging.basicConfig(
  level=logging.DEBUG,
  format='%(asctime)s - %(levelname)s - %(message)s'
)

# Create app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store analysis results in memory to avoid recomputing
analysis_cache = {}

@app.route('/health', methods=['GET'])
def health_check():
  """Simple health check endpoint"""
  return jsonify({
    'status': 'healthy',
    'message': 'The bridge API is operating correctly.'
  })

@app.route('/analyze_direct', methods=['POST'])
def analyze_direct():
  """
  Analyze a dataset using our direct implementation.
  """
  data = request.json
  if not data or 'dataset_path' not in data:
    return jsonify({'error': 'Missing dataset_path in request'}), 400
    
  dataset_path = data['dataset_path']
  logging.info(f"Direct analysis requested for dataset: {dataset_path}")
  
  # Get or compute analysis
  if dataset_path not in analysis_cache:
    try:
      logging.info(f"Running direct analysis for dataset: {dataset_path}")
      # Use our direct test function
      department = data.get('department')
      user_name = data.get('user_name')
      analysis_cache[dataset_path] = direct_analyze_dataset(dataset_path, department, user_name)
      logging.info(f"Direct analysis completed successfully")
    except Exception as e:
      import traceback
      error_msg = f"Direct analysis failed: {str(e)}"
      logging.error(f"{error_msg}\n{traceback.format_exc()}")
      return jsonify({
        'error': error_msg,
        'details': traceback.format_exc()
      }), 500
  
  analysis = analysis_cache[dataset_path]
  return jsonify(analysis)

if __name__ == '__main__':
  # Run on a different port to avoid conflict
  app.run(debug=True, port=5002)
