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
    total = sum(constraint_scores.values()) or 1  # Avoid division by zero
    for constraint in constraint_scores:
      constraint_scores[constraint] /= total
    
    return constraint_scores
  
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
    if thread_analysis:
      slow_threads = [
        t_id for t_id, data in thread_analysis.items() 
        if data.get('avg_response_time', 0) > 24  # Slow if > 24hr response
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

def analyze_dataset(dataset_path: str) -> Dict[str, Any]:
  """
  Analyze an email dataset and generate constraint recommendations.
  
  Args:
      dataset_path: Path to the email dataset JSON file
      
  Returns:
      Dict with analysis results and recommendations
  """
  # Process the email data
  processor = EmailDataProcessor(dataset_path)
  if not processor.load_data():
    return {"error": "Failed to load dataset"}
  
  bert_inputs = processor.prepare_bert_inputs()
  thread_context = processor.extract_thread_context()
  
  # Initialize and run the constraint analyzer
  analyzer = ConstraintAnalyzer()
  
  # Identify constraints
  constraint_scores = analyzer.identify_constraints(bert_inputs)
  
  # Analyze thread patterns
  thread_analysis = analyzer.analyze_threads(thread_context)
  
  # Generate recommendations
  recommendations = analyzer.generate_recommendations(
    constraint_scores, thread_analysis
  )
  
  # Prepare the result
  result = {
    "dataset": os.path.basename(dataset_path),
    "emails_analyzed": len(bert_inputs),
    "threads_analyzed": len(thread_context),
    "constraint_scores": constraint_scores,
    "recommendations": recommendations,
    "company_info": {
      "name": processor.company_data.get("name", ""),
      "departments": [
        d.get("name", "") for d in processor.company_data.get("departments", [])
      ]
    }
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
