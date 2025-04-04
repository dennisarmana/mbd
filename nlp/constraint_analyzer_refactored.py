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
import logging
from typing import List, Dict, Any, Optional, Set, Tuple

# Import our refactored modules
from bert.models import BERTModelWrapper
from bert.analyzer import BaseAnalyzer
from analysis.constraints import ConstraintIdentifier
from analysis.departments import DepartmentAnalyzer
from analysis.threads import ThreadAnalyzer
from recommendations.generators import RecommendationGenerator
from utils.data_helpers import extract_key_people, extract_key_projects, create_email_threads
from data_processor import EmailDataProcessor

class ConstraintAnalyzer(BaseAnalyzer):
  """
  BERT-based analyzer for identifying organizational constraints.
  """
  
  def __init__(self, model_name: str = "bert-base-uncased"):
    """
    Initialize the constraint analyzer with BERT model.
    
    Args:
        model_name: Name of pretrained BERT model to use
    """
    super().__init__(model_name)
    
    # Initialize component modules
    self.constraint_identifier = ConstraintIdentifier()
    self.department_analyzer = DepartmentAnalyzer()
    self.thread_analyzer = ThreadAnalyzer()
    self.recommendation_generator = RecommendationGenerator()
    # data_processor will be created when needed with a specific dataset_path
    
    # Logging
    self.logger.info("Initialized BERT-based Constraint Analyzer")
  
  def analyze_dataset(self, 
                     emails: List[Dict[str, Any]], 
                     company_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Analyze a dataset of emails to identify organizational constraints.
    
    Args:
        emails: List of email dictionaries
        company_data: Optional company structure data
        
    Returns:
        Dict with constraint analysis results
    """
    self.logger.info(f"Analyzing dataset with {len(emails)} emails")
    
    # Extract text content from emails
    email_texts = []
    for email in emails:
      # Extract subject and body text
      # Handle different possible formats
      subject = email.get('subject', '')
      
      # Try different possible keys for body content
      body = ''
      for key in ['processed_body', 'body', 'content']:
        if key in email and email[key]:
          body = email[key]
          break
      
      # Combine subject and body
      text = ""
      if subject:
        text += subject + " "
      if body:
        text += body
      
      # Apply preprocessing
      if text:
        text = self.preprocess_text(text)
        email_texts.append(text)
        
    self.logger.info(f"Extracted {len(email_texts)} text samples from {len(emails)} emails")
    
    # Identify constraints
    self.logger.info("Identifying constraints...")
    constraint_scores = self.constraint_identifier.identify_constraints(email_texts)
    
    # Build sender-department mappings
    self.logger.info("Building department mappings...")
    sender_dept_map = {}
    for email in emails:
      sender = email.get('from')
      dept = email.get('department')
      if sender and dept:
        sender_dept_map[sender] = dept
    
    # Analyze department patterns
    self.logger.info("Analyzing department communication patterns...")
    department_insights = self.department_analyzer.analyze_department_patterns(
      emails, sender_dept_map
    )
    
    # Organize emails into threads
    self.logger.info("Organizing emails into threads...")
    threads = create_email_threads(emails)
    
    # Analyze thread communication patterns
    self.logger.info("Analyzing thread patterns...")
    thread_analysis = self.thread_analyzer.analyze_threads(threads)
    
    # Extract key people and projects for personalized recommendations
    self.logger.info("Identifying key people and projects...")
    key_people = extract_key_people(emails)
    key_projects = extract_key_projects(emails)
    
    # Generate recommendations
    self.logger.info("Generating recommendations...")
    recommendations = self.recommendation_generator.generate_recommendations(
      constraint_scores,
      thread_analysis,
      key_people,
      key_projects
    )
    
    # Generate summary
    summary = self._generate_summary(constraint_scores, recommendations)
    
    self.logger.info("Analysis complete")
    return {
      "constraints": constraint_scores,
      "department_insights": department_insights,
      "thread_analysis": thread_analysis,
      "recommendations": recommendations,
      "summary": summary,
      "key_people": key_people,
      "key_projects": key_projects
    }
  
  def _generate_summary(self, constraint_scores: Dict[str, float], 
                       recommendations: List[Dict[str, Any]]) -> str:
    """
    Generate a text summary of the analysis results.
    
    Args:
        constraint_scores: Mapping of constraint types to scores
        recommendations: List of generated recommendations
        
    Returns:
        String summary of analysis
    """
    # Sort constraints by score
    sorted_constraints = sorted(
      constraint_scores.items(), 
      key=lambda x: x[1], 
      reverse=True
    )
    
    # Generate summary text
    summary = "Constraint Analysis Summary:\n\n"
    
    # Top constraints
    summary += "Top Constraints:\n"
    for constraint, score in sorted_constraints[:3]:
      summary += f"- {constraint}: {score:.2f}\n"
    
    # Recommendations
    summary += "\nKey Recommendations:\n"
    for i, rec in enumerate(recommendations[:3], 1):
      summary += f"{i}. {rec['title']}\n"
      summary += f"   Priority: {rec['priority']}\n"
    
    return summary
  
  def analyze_dataset_from_file(self, dataset_path: str) -> Dict[str, Any]:
    """
    Analyze an email dataset from a file or directory.
    
    Args:
        dataset_path: Path to the email dataset JSON file or directory
        
    Returns:
        Dict with analysis results
    """
    # Load email data
    self.logger.info(f"Loading data from {dataset_path}")
    
    # Initialize data processor with the dataset path
    data_processor = EmailDataProcessor(dataset_path)
    if not data_processor.load_data():
      return {
        "status": "error",
        "message": "Failed to load dataset",
        "path": dataset_path
      }
    
    # Get emails
    emails = data_processor.prepare_bert_inputs()
    
    # Process the dataset
    return self.analyze_dataset(emails)


# Create a compatible API function that matches the original analyze_dataset function signature
def analyze_dataset(dataset_path: str) -> Dict[str, Any]:
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
  # Setup logging
  logging.basicConfig(level=logging.INFO, 
                     format='%(asctime)s - %(levelname)s - %(message)s')
  logger = logging.getLogger(__name__)
  logger.info(f"Analyzing dataset: {dataset_path}")
  
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
    logger.error(f"Error processing dataset: {str(e)}")
    return {
      "status": "error",
      "message": f"Error processing dataset: {str(e)}",
      "path": dataset_path
    }
  
  emails = processor.prepare_bert_inputs()
  thread_context = processor.extract_thread_context()
  
  # Initialize and run the constraint analyzer
  analyzer = ConstraintAnalyzer()
  
  try:
    # Use the new refactored architecture to perform analysis
    analysis_result = analyzer.analyze_dataset(emails)
    
    # Convert the result to match the original API format
    result = {
      "status": "success",
      "dataset": dataset_path,
      "scenario": processor.scenario_name,
      "timestamp": analysis_result.get("timestamp", ""),
      "email_count": len(emails),
      "thread_count": len(processor.threads),
      "top_constraints": analysis_result.get("constraints", {}),
      "department_insights": analysis_result.get("department_insights", {}),
      "recommendations": analysis_result.get("recommendations", []),
      "summary": analysis_result.get("summary", ""),
      "key_people": analysis_result.get("key_people", {}),
      "key_projects": analysis_result.get("key_projects", [])
    }
    
    # Log success
    logger.info(f"Analysis completed successfully with {len(result['recommendations'])} recommendations")
    return result
    
  except Exception as e:
    logger.error(f"Error during analysis: {str(e)}")
    import traceback
    logger.error(traceback.format_exc())
    return {
      "status": "error",
      "message": f"Analysis failed: {str(e)}",
      "path": dataset_path
    }

# Standalone execution
if __name__ == "__main__":
  import sys
  import json
  
  if len(sys.argv) < 2:
    print("Usage: python constraint_analyzer_new.py <dataset_path> [output_file]")
    sys.exit(1)
  
  dataset_path = sys.argv[1]
  
  # Create analyzer
  analyzer = ConstraintAnalyzer()
  
  # Run analysis
  results = analyzer.analyze_dataset_from_file(dataset_path)
  
  # Output results
  if len(sys.argv) > 2:
    output_file = sys.argv[2]
    print(f"Writing results to {output_file}")
    with open(output_file, 'w') as f:
      json.dump(results, f, indent=2)
  else:
    print(json.dumps(results, indent=2))
