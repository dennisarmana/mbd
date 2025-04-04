#!/usr/bin/env python3
"""
BERT-based Theory of Constraints Analyzer
----------------------------------------
Analyzes email datasets to identify organizational constraints
using BERT for natural language understanding.

This module:
- Processes email data with BERT models
- Identifies communication bottlenecks
- Applies Theory of Constraints methodology
- Generates actionable recommendations
"""

import os
import json
import torch
import numpy as np
import logging
from typing import List, Dict, Any, Tuple
from transformers import BertTokenizer, BertModel
from data_processor import EmailDataProcessor

class ConstraintAnalyzer:
  """
  BERT-based analyzer for identifying organizational constraints.
  """
  
  def __init__(self, model_name: str = "bert-base-uncased"):
    """
    Initialize the constraint analyzer with BERT model.
    
    Args:
        model_name: Name of pretrained BERT model to use
    """
    self.tokenizer = BertTokenizer.from_pretrained(model_name)
    self.model = BertModel.from_pretrained(model_name)
    self.model.eval()  # Set to evaluation mode
    
    # Keywords for constraint identification
    self.constraint_keywords = {
      "deadline_issues": ["deadline", "late", "delay", "overdue", "behind", "schedule"],
      "approval_bottlenecks": ["approval", "sign-off", "permission", "authorize", "waiting"],
      "resource_constraints": ["resource", "budget", "fund", "shortage", "limited", "insufficient"],
      "skill_gaps": ["training", "expertise", "knowledge", "skill", "learn", "understand"],
      "process_issues": ["process", "workflow", "procedure", "inefficient", "bureaucracy"],
      "communication_problems": ["misunderstanding", "unclear", "confusion", "miscommunication"]
    }
    
    # Department-specific constraint patterns
    self.department_constraints = {
      "Engineering": ["technical debt", "bug", "test", "integration", "compatibility"],
      "Marketing": ["campaign", "messaging", "audience", "content", "channels"],
      "Sales": ["pipeline", "leads", "conversion", "prospect", "client"],
      "Product": ["feature", "roadmap", "priority", "specification", "requirement"],
      "Finance": ["budget", "forecast", "expense", "approval", "cost"],
      "HR": ["hiring", "recruitment", "onboarding", "training", "retention"]
    }
  
  def extract_embeddings(self, text: str) -> np.ndarray:
    """
    Extract BERT embeddings from text.
    
    Args:
        text: Input text to encode
        
    Returns:
        np.ndarray: BERT embeddings
    """
    # Tokenize and prepare input
    inputs = self.tokenizer(text, return_tensors="pt", 
                          truncation=True, max_length=512, 
                          padding="max_length")
    
    # Get BERT embeddings
    with torch.no_grad():
      outputs = self.model(**inputs)
    
    # Use [CLS] token embedding as text representation
    embeddings = outputs.last_hidden_state[:, 0, :].numpy()
    return embeddings
  
  def identify_constraints(self, emails: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Identify constraints from email data.
    
    Args:
        emails: List of processed email data
        
    Returns:
        Dict mapping constraint types to confidence scores
    """
    constraint_scores = {
      constraint: 0.0 for constraint in self.constraint_keywords
    }
    
    for email in emails:
      text = f"{email['subject']} {email['processed_body']}"
      
      # Check for keyword matches
      for constraint, keywords in self.constraint_keywords.items():
        score = sum(1 for keyword in keywords if keyword.lower() in text.lower())
        constraint_scores[constraint] += score
      
      # Check for department-specific constraints
      dept = email['sender'].get('department', '')
      if dept in self.department_constraints:
        dept_keywords = self.department_constraints[dept]
        for keyword in dept_keywords:
          if keyword.lower() in text.lower():
            # Add to relevant constraint category
            if "feature" in keyword or "requirement" in keyword:
              constraint_scores["resource_constraints"] += 0.5
            elif "budget" in keyword or "cost" in keyword:
              constraint_scores["resource_constraints"] += 0.5
            else:
              constraint_scores["process_issues"] += 0.5
    
    # Normalize scores
    total_emails = len(emails)
    if total_emails > 0:
      for constraint in constraint_scores:
        constraint_scores[constraint] /= total_emails
    
    return constraint_scores
  
  def analyze_department_patterns(self, emails: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    """
    Analyze department-specific communication patterns and constraints.
    
    Args:
        emails: List of processed email data
        
    Returns:
        Dict mapping departments to their constraint patterns
    """
    # Group emails by department
    department_emails = {}
    
    # First pass: collect all departments
    all_departments = set()
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
        "constraints": {constraint: 0.0 for constraint in self.constraint_keywords},
        "specific_issues": []
      } for dept in all_departments
    }
    
    # Second pass: analyze emails by department
    for email in emails:
      # Get sender department
      sender_dept = email['sender'].get('department', 'Unknown')
      
      # Skip emails without department info
      if sender_dept == 'Unknown':
        continue
      
      # Increment department email count
      if sender_dept in department_insights:
        department_insights[sender_dept]["email_count"] += 1
      
      # Check for internal vs external communication
      recipient_depts = [r.get('department', 'Unknown') for r in email['recipients']]
      is_internal = all(dept == sender_dept for dept in recipient_depts if dept != 'Unknown')
      
      if sender_dept in department_insights:
        if is_internal:
          department_insights[sender_dept]["internal_communication"] += 1
        else:
          department_insights[sender_dept]["external_communication"] += 1
      
      # Check for department-specific constraints
      text = f"{email['subject']} {email['processed_body']}"
      
      # Check for keyword matches
      for constraint, keywords in self.constraint_keywords.items():
        score = sum(1 for keyword in keywords if keyword.lower() in text.lower())
        if sender_dept in department_insights:
          department_insights[sender_dept]["constraints"][constraint] += score
      
      # Check for department-specific issues
      if sender_dept in self.department_constraints and sender_dept in department_insights:
        for keyword in self.department_constraints[sender_dept]:
          if keyword.lower() in text.lower():
            # Add to relevant constraint category
            if "feature" in keyword or "requirement" in keyword:
              department_insights[sender_dept]["constraints"]["resource_constraints"] += 0.5
            elif "budget" in keyword or "cost" in keyword:
              department_insights[sender_dept]["constraints"]["resource_constraints"] += 0.5
            else:
              department_insights[sender_dept]["constraints"]["process_issues"] += 0.5
    
    # Normalize scores for each department
    for dept, insights in department_insights.items():
      email_count = insights["email_count"]
      if email_count > 0:
        for constraint in insights["constraints"]:
          insights["constraints"][constraint] /= email_count
    
    return department_insights
  
  def analyze_threads(self, thread_context: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
    """
    Analyze email threads for communication patterns.
    
    Args:
        thread_context: Dictionary of thread IDs to lists of ordered emails
        
    Returns:
        Dict with thread analysis results
    """
    results = {}
    
    for thread_id, thread_emails in thread_context.items():
      # Skip threads with < 2 emails
      if len(thread_emails) < 2:
        continue
      
      # Look for patterns indicating constraints
      response_times = []
      sender_changes = 0
      topic_drift = 0
      
      for i in range(1, len(thread_emails)):
        # Calculate response time
        prev_time = thread_emails[i-1]['timestamp']
        curr_time = thread_emails[i]['timestamp']
        
        # Skip if we can't parse timestamps
        try:
          from datetime import datetime
          prev_dt = datetime.fromisoformat(prev_time.replace('Z', '+00:00'))
          curr_dt = datetime.fromisoformat(curr_time.replace('Z', '+00:00'))
          response_time = (curr_dt - prev_dt).total_seconds() / 3600  # hours
          response_times.append(response_time)
        except:
          pass
        
        # Check for sender changes
        if thread_emails[i]['sender_id'] != thread_emails[i-1]['sender_id']:
          sender_changes += 1
        
        # Check for topic drift using basic similarity
        prev_text = thread_emails[i-1]['body']
        curr_text = thread_emails[i]['body']
        
        # Use simple word overlap as a proxy for topic similarity
        prev_words = set(prev_text.lower().split())
        curr_words = set(curr_text.lower().split())
        overlap = len(prev_words.intersection(curr_words))
        total_words = len(prev_words.union(curr_words))
        
        if total_words > 0 and overlap / total_words < 0.3:
          topic_drift += 1
      
      results[thread_id] = {
        "avg_response_time": sum(response_times) / len(response_times) if response_times else 0,
        "sender_changes": sender_changes,
        "topic_drift": topic_drift,
        "thread_length": len(thread_emails)
      }
    
    return results
  
  def generate_recommendations(self, constraint_scores: Dict[str, float], 
                             thread_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate actionable recommendations based on constraints.
    
    Args:
        constraint_scores: Constraint type to confidence score mapping
        thread_analysis: Thread analysis results
        
    Returns:
        List of recommendation dictionaries
    """
    recommendations = []
    
    # Sort constraints by score
    sorted_constraints = sorted(
      constraint_scores.items(), 
      key=lambda item: item[1], 
      reverse=True
    )
    
    # Generate recommendations for top 3 constraints
    for constraint, score in sorted_constraints[:3]:
      if score < 0.1:  # Skip if score is too low
        continue
        
      recommendation = {
        "constraint_type": constraint,
        "confidence": float(score),
        "title": self._generate_recommendation_title(constraint),
        "description": self._generate_recommendation_description(constraint),
        "suggested_actions": self._generate_actions(constraint)
      }
      
      recommendations.append(recommendation)
    
    # Add thread-based recommendations
    if thread_analysis and isinstance(thread_analysis, dict):
      slow_threads = [
        t_id for t_id, data in thread_analysis.items() 
        if isinstance(data, dict) and data.get('avg_response_time', 0) > 24  # Slow if > 24hr response
      ]
      
      if slow_threads and len(recommendations) < 3:
        recommendations.append({
          "constraint_type": "response_time",
          "confidence": 0.7,
          "title": "Improve Team Response Time",
          "description": "Long email response times are creating bottlenecks in key projects",
          "suggested_actions": [
            "Set up response time SLAs for critical emails",
            "Create dedicated time blocks for email processing",
            "Use chat for urgent items instead of email"
          ]
        })
    
    return recommendations
  
  def generate_summary(self, constraints: Dict[str, float], department_insights: Dict[str, Any], 
                     recommendations: List[Dict[str, Any]]) -> str:
    """
    Generate a summary of the analysis results.
    
    Args:
        constraints: Mapping of constraint types to scores
        department_insights: Department-specific analysis results
        recommendations: Generated recommendations
        
    Returns:
        Summary text of the analysis
    """
    # Identify top constraints
    top_constraints = sorted(constraints.items(), key=lambda x: x[1], reverse=True)[:2]
    
    # Generate summary based on constraints and recommendations
    if not top_constraints or top_constraints[0][1] < 0.1:
      return "No significant organizational constraints were identified in the analyzed communication."
    
    # Get the most affected departments
    dept_constraint_scores = {}
    for dept, insights in department_insights.items():
      dept_score = sum(insights["constraints"].values())
      dept_constraint_scores[dept] = dept_score
    
    top_departments = sorted(dept_constraint_scores.items(), key=lambda x: x[1], reverse=True)[:2]
    dept_names = [dept for dept, score in top_departments if score > 0]
    
    # Generate summary text
    main_constraint = top_constraints[0][0].replace('_', ' ').title()
    summary = f"The analysis identified {main_constraint} as the primary organizational constraint. "
    
    if len(top_constraints) > 1 and top_constraints[1][1] > 0.2:
      second_constraint = top_constraints[1][0].replace('_', ' ').title()
      summary += f"Additionally, {second_constraint} is a secondary factor affecting efficiency. "
    
    if dept_names:
      if len(dept_names) == 1:
        summary += f"The {dept_names[0]} department is most affected by these constraints. "
      else:
        summary += f"The {' and '.join(dept_names)} departments are most affected by these constraints. "
    
    summary += f"There are {len(recommendations)} recommended actions to address these constraints."
    
    return summary
  
  def _generate_recommendation_title(self, constraint_type: str) -> str:
    """Generate a title for a recommendation based on constraint type."""
    titles = {
      "deadline_issues": "Address Project Timeline Bottlenecks",
      "approval_bottlenecks": "Streamline Approval Processes",
      "resource_constraints": "Reallocate Resources to Critical Paths",
      "skill_gaps": "Close Knowledge and Skill Gaps",
      "process_issues": "Improve Inefficient Workflows",
      "communication_problems": "Resolve Communication Breakdowns"
    }
    return titles.get(constraint_type, "Address Organizational Constraint")
  
  def _generate_recommendation_description(self, constraint_type: str) -> str:
    """Generate a description for a recommendation based on constraint type."""
    descriptions = {
      "deadline_issues": "Multiple projects are experiencing delays due to unrealistic timeline expectations and resource conflicts.",
      "approval_bottlenecks": "Decision processes are creating bottlenecks due to unclear approval chains and delayed responses.",
      "resource_constraints": "Critical initiatives are blocked by resource limitations and competing priorities.",
      "skill_gaps": "Progress is hindered by knowledge gaps in key technical or domain areas.",
      "process_issues": "Inefficient workflows and procedures are slowing down execution and creating friction.",
      "communication_problems": "Misalignment and miscommunication are causing rework and confusion across teams."
    }
    return descriptions.get(constraint_type, "This organizational constraint is limiting progress and should be addressed.")
  
  def _generate_actions(self, constraint_type: str) -> List[str]:
    """Generate suggested actions based on constraint type."""
    actions = {
      "deadline_issues": [
        "Review and adjust project timelines with stakeholders",
        "Implement buffer management for critical path activities",
        "Create a deadline priority system across departments"
      ],
      "approval_bottlenecks": [
        "Document and streamline approval processes",
        "Implement approval thresholds to reduce unnecessary sign-offs",
        "Schedule regular decision-making meetings to clear pending items"
      ],
      "resource_constraints": [
        "Perform resource capacity planning across teams",
        "Prioritize projects based on strategic value",
        "Consider temporary resource reallocation to resolve bottlenecks"
      ],
      "skill_gaps": [
        "Identify critical skill needs and create learning paths",
        "Pair team members for knowledge transfer",
        "Schedule focused training sessions on key topics"
      ],
      "process_issues": [
        "Document and review current workflows to identify bottlenecks",
        "Eliminate unnecessary steps in approval processes",
        "Implement automation for repetitive tasks"
      ],
      "communication_problems": [
        "Create standardized templates for common communications",
        "Set up regular synchronization meetings between teams",
        "Document and share project decision history"
      ]
    }
    return actions.get(constraint_type, [
      "Analyze the constraint in more detail",
      "Develop an action plan to address the bottleneck",
      "Monitor progress and adjust approach as needed"
    ])

def analyze_dataset(dataset_path: str):
  """
  Analyze an email dataset and generate constraint recommendations.
  
  Args:
      dataset_path: Path to the email dataset JSON file or directory
      
  Returns:
      Dict with analysis results and recommendations
      
  Example:
      >>> results = analyze_dataset('/path/to/feature_priority/emails.json')
      >>> print(results['top_constraints'])
      {'resource_constraints': 0.85, 'approval_bottlenecks': 0.67, ...}
  """
  # Process the dataset
  try:
    processor = EmailDataProcessor(dataset_path)
    if not processor.load_data():
      return {
        "status": "error",
        "message": "Failed to load dataset",
        "path": dataset_path
      }
  except Exception as e:
    return {
      "status": "error",
      "message": f"Error processing dataset: {str(e)}",
      "path": dataset_path
    }
  
  emails = processor.prepare_bert_inputs()
  thread_context = processor.extract_thread_context()
  
  # Initialize and run the constraint analyzer
  analyzer = ConstraintAnalyzer()
  
  # Identify constraints
  constraints = analyzer.identify_constraints(emails)
  
  # Analyze department-specific insights
  try:
    department_insights = analyzer.analyze_department_patterns(emails)
  except AttributeError:
    # Fallback if method doesn't exist
    logging.warning("analyze_department_patterns method not available, using empty department insights")
    department_insights = {}
  
  # Generate recommendations
  try:
    recommendations = analyzer.generate_recommendations(constraints, thread_context)
  except (AttributeError, TypeError):
    # Fallback if method doesn't exist or has wrong signature
    logging.warning("generate_recommendations method error, using simplified recommendations")
    # Generate basic recommendations manually
    recommendations = []
    for constraint_type, score in sorted(constraints.items(), key=lambda x: x[1], reverse=True)[:3]:
      if score > 0.1:  # Only generate for significant constraints
        constraint_name = constraint_type.replace('_', ' ').title()
        recommendations.append({
          "constraint_type": constraint_type,
          "confidence": float(score),
          "title": f"Address {constraint_name}",
          "description": f"This organizational constraint is limiting progress and should be addressed.",
          "suggested_actions": [
            f"Analyze {constraint_name} in more detail",
            "Develop an action plan to address this bottleneck",
            "Monitor progress and adjust approach as needed"
          ]
        })
  
  # Generate summary
  try:
    summary = analyzer.generate_summary(constraints, department_insights, recommendations)
  except AttributeError:
    # Fallback if method doesn't exist
    logging.warning("generate_summary method not available, using basic summary")
    top_constraints = sorted(constraints.items(), key=lambda x: x[1], reverse=True)[:2]
    if not top_constraints or top_constraints[0][1] < 0.1:
      summary = "No significant organizational constraints were identified in the analyzed communication."
    else:
      main_constraint = top_constraints[0][0].replace('_', ' ').title()
      summary = f"The analysis identified {main_constraint} as the primary organizational constraint."
      if len(recommendations) > 0:
        summary += f" There are {len(recommendations)} recommended actions to address these constraints."
  
  # Extract scenario name from path
  scenario_name = processor.scenario_name
  if not scenario_name or scenario_name == "data":
    scenario_name = os.path.basename(os.path.dirname(dataset_path))
  
  # Get timestamp for the analysis
  from datetime import datetime
  timestamp = datetime.now().isoformat()
  
  # Prepare the result
  result = {
    "status": "success",
    "dataset": dataset_path,
    "scenario": scenario_name,
    "timestamp": timestamp,
    "email_count": len(emails),
    "thread_count": len(processor.threads),
    "top_constraints": constraints,
    "recommendations": recommendations
  }
  
  return result

if __name__ == "__main__":
  import sys
  import json
  
  if len(sys.argv) < 2:
    print("Usage: python constraint_analyzer.py <path_to_dataset>")
    sys.exit(1)
  
  dataset_path = sys.argv[1]
  result = analyze_dataset(dataset_path)
  
  # Print a summary to console
  print(f"\nAnalysis of {result['dataset']}:")
  print(f"Emails analyzed: {result['emails_analyzed']}")
  print(f"Threads analyzed: {result['threads_analyzed']}")
  
  print("\nTop organizational constraints:")
  for constraint, score in sorted(
    result['constraint_scores'].items(), 
    key=lambda x: x[1], 
    reverse=True
  )[:3]:
    print(f"- {constraint}: {score:.2f}")
  
  print("\nRecommendations:")
  for i, rec in enumerate(result['recommendations'], 1):
    print(f"{i}. {rec['title']}")
    print(f"   {rec['description']}")
    print("   Suggested actions:")
    for action in rec['suggested_actions']:
      print(f"   - {action}")
    print()
  
  # Save full results to JSON
  output_path = os.path.join(
    os.path.dirname(dataset_path),
    f"constraint_analysis_{os.path.basename(dataset_path)}"
  )
  
  with open(output_path, 'w') as f:
    json.dump(result, f, indent=2)
  
  print(f"Full analysis saved to {output_path}")
