#!/usr/bin/env python3
"""
API for BERT Constraint Analyzer
-------------------------------
Flask-based API that exposes constraint analysis functionality
through a simple REST interface for frontend integration.

Endpoints:
- /analyze: Analyze a specific dataset
- /recommendations: Get recommendations for a user/department
- /health: API health check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import time
from constraint_analyzer import analyze_dataset

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Cache for analysis results to avoid recomputation
analysis_cache = {}

@app.route('/health', methods=['GET'])
def health_check():
  """Health check endpoint."""
  return jsonify({
    'status': 'ok',
    'version': '0.1.0'
  })

@app.route('/analyze', methods=['POST'])
def analyze():
  """
  Analyze a dataset and return constraints and recommendations.
  
  Expected POST body:
  {
    "dataset_path": "/path/to/dataset.json"
  }
  """
  data = request.json
  
  if not data or 'dataset_path' not in data:
    return jsonify({
      'error': 'Missing dataset_path in request'
    }), 400
  
  dataset_path = data['dataset_path']
  
  # Check if path exists
  if not os.path.exists(dataset_path):
    return jsonify({
      'error': f'Dataset not found at {dataset_path}'
    }), 404
  
  # Use cached result if available
  if dataset_path in analysis_cache:
    return jsonify(analysis_cache[dataset_path])
  
  try:
    # Perform analysis (may take time)
    result = analyze_dataset(dataset_path)
    
    # Cache the result
    analysis_cache[dataset_path] = result
    
    return jsonify(result)
  except Exception as e:
    return jsonify({
      'error': f'Analysis failed: {str(e)}'
    }), 500

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
  """
  Get personalized recommendations for a user/department.
  
  Expected POST body:
  {
    "dataset_path": "/path/to/dataset.json",
    "department": "Engineering",
    "user_name": "John Doe"
  }
  """
  data = request.json
  
  if not data or 'dataset_path' not in data:
    return jsonify({
      'error': 'Missing dataset_path in request'
    }), 400
  
  dataset_path = data['dataset_path']
  department = data.get('department', '')
  user_name = data.get('user_name', '')
  
  # Check if path exists
  if not os.path.exists(dataset_path):
    return jsonify({
      'error': f'Dataset not found at {dataset_path}'
    }), 404
  
  # Get or compute analysis
  if dataset_path not in analysis_cache:
    try:
      analysis_cache[dataset_path] = analyze_dataset(dataset_path)
    except Exception as e:
      return jsonify({
        'error': f'Analysis failed: {str(e)}'
      }), 500
  
  analysis = analysis_cache[dataset_path]
  
  # Extract recommendations
  recommendations = analysis.get('recommendations', [])
  
  # Filter or prioritize based on department/user if needed
  if department:
    # Move department-specific recommendations to the top
    dept_specific = []
    general = []
    
    for rec in recommendations:
      is_relevant = False
      
      # Check if recommendation mentions department
      if department.lower() in rec.get('description', '').lower():
        is_relevant = True
      
      # Check if actions mention department
      for action in rec.get('suggested_actions', []):
        if department.lower() in action.lower():
          is_relevant = True
          break
      
      if is_relevant:
        dept_specific.append(rec)
      else:
        general.append(rec)
    
    personalized_recs = dept_specific + general
  else:
    personalized_recs = recommendations
  
  # Format response for the chat interface
  response = {
    'user': user_name or 'User',
    'department': department or 'All Departments',
    'recommendations': personalized_recs[:3],  # Top 3 most relevant
    'chat_response': _format_chat_response(personalized_recs[:3], user_name, department),
    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
  }
  
  return jsonify(response)

def _format_chat_response(recommendations, user_name, department):
  """Format recommendations as a conversational response."""
  if not recommendations:
    return "Based on my analysis, I don't see any significant constraints affecting your work right now. This could mean either everything is running smoothly, or we need more data to identify bottlenecks."
  
  user = user_name or "you"
  dept = f" in the {department} department" if department else ""
  
  response = f"Based on my analysis of communication patterns{dept}, I recommend that {user} focus on these high-impact tasks:\n\n"
  
  for i, rec in enumerate(recommendations, 1):
    response += f"{i}. **{rec['title']}**\n"
    response += f"   {rec['description']}\n"
    response += "   *Actions you can take:*\n"
    
    for action in rec['suggested_actions'][:2]:  # Show top 2 actions
      response += f"   - {action}\n"
    
    response += "\n"
  
  response += "Would you like me to explain why any of these recommendations would be particularly impactful?"
  
  return response

if __name__ == '__main__':
  port = int(os.environ.get('PORT', 5000))
  app.run(host='0.0.0.0', port=port, debug=True)
