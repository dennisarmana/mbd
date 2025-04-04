#!/usr/bin/env python3
"""
API for BERT Constraint Analyzer
-------------------------------
Flask-based API that exposes constraint analysis functionality
through a simple REST interface for frontend integration.

Endpoints:
- /analyze: Analyze a specific dataset
- /recommendations: Get recommendations for a user/department
- /datasets: List available email datasets
- /health: API health check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import time
import glob
import logging
import traceback
# Import the refactored modules
import constraint_analyzer_refactored as analyzer 
from data_processor import EmailDataProcessor

# Use the refactored analyze_dataset function
analyze_dataset = analyzer.analyze_dataset

# Configure detailed logging
logging.basicConfig(
  level=logging.DEBUG,
  format='%(asctime)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes with any origin

# Cache for analysis results to avoid recomputation
analysis_cache = {}

@app.route('/health', methods=['GET'])
def health_check():
  """Health check endpoint."""
  return jsonify({
    'status': 'ok',
    'version': '0.1.0'
  })

@app.route('/datasets', methods=['GET'])
def list_datasets():
  """List available datasets for analysis."""
  try:
    # Get base data directory (one level above the API)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data')
    
    # Use the improved EmailDataProcessor to find datasets
    datasets = EmailDataProcessor.get_available_datasets(data_path)
    
    return jsonify({
      'status': 'success',
      'datasets': datasets
    })
  except Exception as e:
    return jsonify({
      'status': 'error',
      'message': f"Error listing datasets: {str(e)}"
    }), 500

@app.route('/analyze', methods=['POST'])
def analyze():
  """
  Analyze a dataset and return constraints and recommendations.
  
  Expected POST body:
  {
    "dataset_path": "/path/to/dataset.json",
    "filter": {
      "department": "department_id",  # Optional
      "user": "user_id"  # Optional
    }
  }
  """
  data = request.json
  
  if not data or 'dataset_path' not in data:
    return jsonify({
      'error': 'Missing dataset_path in request'
    }), 400
  
  dataset_path = data['dataset_path']
  
  # Extract filter parameters if present
  filter_params = {}
  if 'filter' in data and data['filter']:
    filter_params = data['filter']
  
  # Try to find the dataset if the exact path doesn't exist
  if not os.path.exists(dataset_path):
    # Check if it's a relative path or just a scenario name
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    possible_paths = [
      # Original path
      dataset_path,
      # Path relative to the data directory
      os.path.join(base_dir, 'data', dataset_path),
      # Check if it's in mixed-scenarios
      os.path.join(base_dir, 'data', 'mixed-scenarios', dataset_path, 'emails.json'),
      # Check if it's in scenarios
      os.path.join(base_dir, 'data', 'scenarios', dataset_path, 'emails.json')
    ]
    
    # Look for dataset matching the name
    found = False
    for path in possible_paths:
      if os.path.exists(path):
        dataset_path = path
        found = True
        break
    
    if not found:
      return jsonify({
        'status': 'error',
        'message': f'Dataset not found at {dataset_path}'
      }), 404
  
  # Create cache key that includes filters
  cache_key = f"{dataset_path}_{filter_params.get('department', '')}_{filter_params.get('user', '')}"
  
  # Use cached result if available
  if cache_key in analysis_cache:
    return jsonify(analysis_cache[cache_key])
  
  try:
    # Perform analysis (may take time)
    logging.debug(f"Starting analysis for dataset: {dataset_path}")
    logging.debug(f"Using filter parameters: {filter_params}")
    
    # Call with filter parameters if present
    result = analyze_dataset(
      dataset_path, 
      department_filter=filter_params.get('department'),
      user_filter=filter_params.get('user')
    )
    logging.debug(f"Analysis result: {result}")
    
    # Create cache key that includes filters
    cache_key = f"{dataset_path}_{filter_params.get('department', '')}_{filter_params.get('user', '')}"
    analysis_cache[cache_key] = result
    
    return jsonify(result)
  except Exception as e:
    return jsonify({
      'error': f'Analysis failed: {str(e)}'
    }), 500

# Direct implementation of analyze_department_patterns to avoid module caching issues
def direct_analyze_department_patterns(emails, analyzer):
  """
  Implement analyze_department_patterns directly in the API to avoid dependency on
  potentially missing method in the cached ConstraintAnalyzer class.
  """
  # Group emails by department
  all_departments = set()
  
  # First pass: collect all departments
  for email in emails:
    sender_dept = email['sender'].get('department')
    if sender_dept and sender_dept != 'Unknown':
      all_departments.add(sender_dept)
    
    for recipient in email['recipients']:
      dept = recipient.get('department')
      if dept and dept != 'Unknown':
        all_departments.add(dept)
  
  # Initialize department insights
  department_insights = {
    dept: {
      "email_count": 0,
      "internal_communication": 0,
      "external_communication": 0,
      "constraints": {constraint: 0.0 for constraint in analyzer.constraint_keywords},
      "specific_issues": []
    } for dept in all_departments
  }
  
  return department_insights

# Direct implementation of generate_summary to avoid module caching issues
def direct_generate_summary(constraints, department_insights, recommendations):
  """
  Implement generate_summary directly in the API to avoid dependency on
  potentially missing method in the cached ConstraintAnalyzer class.
  """
  # Identify top constraints
  top_constraints = sorted(constraints.items(), key=lambda x: x[1], reverse=True)[:2]
  
  # Generate summary based on constraints and recommendations
  if not top_constraints or top_constraints[0][1] < 0.1:
    return "No significant organizational constraints were identified in the analyzed communication."
  
  # Generate summary text
  main_constraint = top_constraints[0][0].replace('_', ' ').title()
  summary = f"The analysis identified {main_constraint} as the primary organizational constraint. "
  
  if len(top_constraints) > 1 and top_constraints[1][1] > 0.2:
    second_constraint = top_constraints[1][0].replace('_', ' ').title()
    summary += f"Additionally, {second_constraint} is a secondary factor affecting efficiency. "
  
  summary += f"There are {len(recommendations)} recommended actions to address these constraints."
  
  return summary

# Direct implementation of generate_recommendations to avoid module caching issues
def direct_generate_recommendations(constraints, thread_context=None):
  """
  Implement generate_recommendations directly in the API to avoid dependency on
  potentially missing method in the cached ConstraintAnalyzer class.
  """
  # Sort constraints by confidence score
  sorted_constraints = sorted(constraints.items(), key=lambda x: x[1], reverse=True)
  
  # Generate recommendations for top constraints
  recommendations = []
  for constraint_type, score in sorted_constraints[:3]:
    if score < 0.1:  # Skip if score is too low
      continue
    
    # Recommendation templates  
    templates = {
      'deadline_issues': {
        'title': 'Improve Deadline Management',
        'description': 'Projects are consistently missing deadlines due to unrealistic timeframes or lack of proper scheduling.',
        'actions': [
          'Implement buffer time in project schedules',
          'Break down large deliverables into smaller milestones',
          'Establish early warning systems for at-risk deadlines'
        ]
      },
      'approval_bottlenecks': {
        'title': 'Streamline Approval Processes',
        'description': 'Decision processes are creating bottlenecks due to unclear approval chains and delayed responses.',
        'actions': [
          'Document and streamline approval processes',
          'Implement approval thresholds to reduce unnecessary sign-offs',
          'Schedule regular decision-making meetings to clear pending items'
        ]
      },
      'resource_constraints': {
        'title': 'Reallocate Resources to Critical Paths',
        'description': 'Critical initiatives are blocked by resource limitations and competing priorities.',
        'actions': [
          'Perform resource capacity planning across teams',
          'Prioritize projects based on strategic value',
          'Consider temporary resource reallocation to resolve bottlenecks'
        ]
      },
      'skill_gaps': {
        'title': 'Address Skill Gaps Through Training',
        'description': 'Team members lack necessary skills or expertise to efficiently complete certain tasks.',
        'actions': [
          'Identify specific skill gaps through task analysis',
          'Develop targeted training programs',
          'Consider knowledge sharing sessions or mentorship programs'
        ]
      },
      'process_issues': {
        'title': 'Optimize Core Business Processes',
        'description': 'Inefficient or overly complex processes are creating unnecessary work and delays.',
        'actions': [
          'Map and audit key processes to identify inefficiencies',
          'Eliminate redundant steps and streamline workflows',
          'Implement process automation where beneficial'
        ]
      },
      'communication_problems': {
        'title': 'Enhance Cross-Department Communication',
        'description': 'Information silos and communication gaps are causing misalignment and rework.',
        'actions': [
          'Establish clear communication channels and protocols',
          'Implement regular cross-functional meetings',
          'Create shared documentation repositories'
        ]
      }
    }
    
    # Use template if available
    if constraint_type in templates:
      title = templates[constraint_type]['title']
      description = templates[constraint_type]['description']
      actions = templates[constraint_type]['actions']
    else:
      title = "Address " + constraint_type.replace('_', ' ').title()
      description = "This organizational constraint is limiting progress and should be addressed."
      actions = [
        f"Analyze {constraint_type.replace('_', ' ')} in more detail",
        "Develop an action plan to address this bottleneck",
        "Monitor progress and adjust approach as needed"
      ]
    
    recommendation = {
      "constraint_type": constraint_type,
      "confidence": float(score),
      "title": title,
      "description": description,
      "suggested_actions": actions
    }
    
    recommendations.append(recommendation)
  
  return recommendations

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
  logging.debug("=== Recommendations endpoint called ===")
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
  
  # Try to find the dataset if the exact path doesn't exist
  if not os.path.exists(dataset_path):
    # Check if it's a relative path or just a scenario name
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    possible_paths = [
      # Original path
      dataset_path,
      # Path relative to the data directory
      os.path.join(base_dir, 'data', dataset_path),
      # Check if it's in mixed-scenarios
      os.path.join(base_dir, 'data', 'mixed-scenarios', dataset_path, 'emails.json'),
      # Check if it's in scenarios
      os.path.join(base_dir, 'data', 'scenarios', dataset_path, 'emails.json')
    ]
    
    # Look for dataset matching the name
    found = False
    for path in possible_paths:
      if os.path.exists(path):
        dataset_path = path
        found = True
        break
    
    if not found:
      return jsonify({
        'status': 'error',
        'message': f'Dataset not found at {dataset_path}'
      }), 404
  
  # Get or compute analysis
  if dataset_path not in analysis_cache:
    try:
      logging.info(f"Running analysis for dataset: {dataset_path}")
      # Attempt standard analysis with fallback
      try:
        analysis_cache[dataset_path] = analyze_dataset(dataset_path)
        logging.info(f"Analysis completed successfully using standard flow")
      except Exception as ae:
        # Log detailed error for debugging
        logging.warning(f"Standard analysis failed: {str(ae)}\n{traceback.format_exc()}")
        logging.warning(f"Using direct API implementation as fallback")
        
        # Initialize data processor
        processor = EmailDataProcessor(dataset_path)
        if not processor.load_data():
          return jsonify({
            'status': 'error',
            'message': 'Failed to load dataset',
            'path': dataset_path
          }), 400
          
        # Process emails
        emails = processor.prepare_bert_inputs()
        thread_context = processor.extract_thread_context()
        
        # Initialize analyzer
        from constraint_analyzer import ConstraintAnalyzer
        analyzer = ConstraintAnalyzer()
        
        # Get constraints
        constraints = analyzer.identify_constraints(emails)
        
        # Try to use built-in methods with fallback to direct implementations
        try:
          department_insights = analyzer.analyze_department_patterns(emails)
        except (AttributeError, TypeError):
          logging.warning("Falling back to direct analyze_department_patterns implementation")
          department_insights = direct_analyze_department_patterns(emails, analyzer)
        
        try:
          recommendations = analyzer.generate_recommendations(constraints, thread_context)
        except (AttributeError, TypeError):
          logging.warning("Falling back to direct generate_recommendations implementation")
          recommendations = direct_generate_recommendations(constraints, thread_context)
        
        try:
          summary = analyzer.generate_summary(constraints, department_insights, recommendations)
        except (AttributeError, TypeError):
          logging.warning("Falling back to direct generate_summary implementation")
          summary = direct_generate_summary(constraints, department_insights, recommendations)
        
        # Create result
        scenario_name = processor.scenario_name
        if not scenario_name or scenario_name == "data":
          scenario_name = os.path.basename(os.path.dirname(dataset_path))
          
        from datetime import datetime
        timestamp = datetime.now().isoformat()
        
        analysis_cache[dataset_path] = {
          "status": "success",
          "dataset": dataset_path,
          "scenario": scenario_name,
          "timestamp": timestamp,
          "email_count": len(emails),
          "thread_count": len(processor.threads),
          "top_constraints": constraints,
          "recommendations": recommendations,
          "summary": summary
        }
        
        logging.info(f"Analysis completed successfully using direct implementation")
    except Exception as e:
      error_msg = f"Analysis failed: {str(e)}"
      logging.error(f"{error_msg}\n{traceback.format_exc()}")
      return jsonify({
        'error': error_msg,
        'details': traceback.format_exc()
      }), 500
  
  analysis = analysis_cache[dataset_path]
  
  # Extract recommendations
  recommendations = analysis.get('recommendations', [])
  
  # Fix field name inconsistencies for UI compatibility
  for rec in recommendations:
    # Ensure the actions field name matches what the UI expects
    if 'actions' in rec and 'suggested_actions' not in rec:
      rec['suggested_actions'] = rec['actions']
    elif 'actions' not in rec and 'suggested_actions' in rec:
      rec['actions'] = rec['suggested_actions']
  
  # Log the recommendations for debugging
  logging.debug(f"Processed recommendations: {recommendations}")
  
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
    'status': 'success',
    'user': user_name or 'User',
    'department': department or 'All Departments',
    'recommendations': personalized_recs[:3],  # Top 3 most relevant
    'chat_response': _format_chat_response(personalized_recs[:3], user_name, department),
    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
  }
  
  # Log the response for debugging
  logging.debug(f"Sending response: {response}")
  
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
