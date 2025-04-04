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

# Import the refactored implementation
import constraint_analyzer_refactored as analyzer

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
      logging.info(f"Running analysis with refactored implementation for dataset: {dataset_path}")
      # Use our refactored implementation
      department = data.get('department')
      user_name = data.get('user_name')
      
      # Run analysis with refactored code
      result = analyzer.analyze_dataset(dataset_path)
      
      # Add department/user filters if provided
      if department or user_name:
          # Apply filters to recommendations if available
          if 'recommendations' in result and result['recommendations']:
              # Simple filtering logic - could be made more sophisticated
              filtered_recommendations = []
              for rec in result['recommendations']:
                  # Filter by department if specified
                  if department and 'relevant_people' in rec:
                      # Check if any people in this department are relevant
                      department_match = any(role for role, people in rec['relevant_people'].items() 
                                          if department.lower() in role.lower())
                      if not department_match:
                          continue
                  # Filter by username if specified
                  if user_name and 'relevant_people' in rec:
                      # Check if this user is mentioned
                      user_match = any(user_name in person for role, people in rec['relevant_people'].items()
                                       for person in people)
                      if not user_match:
                          continue
                  filtered_recommendations.append(rec)
              
              # Replace with filtered recommendations
              result['recommendations'] = filtered_recommendations
      
      analysis_cache[dataset_path] = result
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
