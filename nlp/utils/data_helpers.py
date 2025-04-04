"""
Data processing utilities for constraint analysis.
"""

from typing import List, Dict, Any, Optional, Tuple
import re

def extract_key_people(emails: List[Dict[str, Any]]) -> Dict[str, List[str]]:
  """
  Extract key people from email dataset and categorize by role.
  
  Args:
    emails: List of email dictionaries
    
  Returns:
    Dict mapping roles to lists of people names
  """
  # Track email counts for each person
  person_email_count = {}
  person_response_times = {}
  person_dept_map = {}
  
  # Track replies and mentions to identify key people
  replies_to = {}
  mentions = {}
  
  for email in emails:
    sender = email.get('from')
    recipients = email.get('to', [])
    cc = email.get('cc', [])
    body = email.get('body', '')
    subject = email.get('subject', '')
    dept = email.get('department')
    
    # Count emails sent
    if sender:
      person_email_count[sender] = person_email_count.get(sender, 0) + 1
      if dept:
        person_dept_map[sender] = dept
    
    # Count recipients
    for recipient in recipients + cc:
      if recipient:
        # Track replies
        if "Re:" in subject:
          replies_to[recipient] = replies_to.get(recipient, 0) + 1
    
    # Find @mentions in body (simplified)
    if body:
      # Look for patterns like @name or @Name.Surname
      mention_pattern = r'@([A-Za-z.]+)'
      found_mentions = re.findall(mention_pattern, body)
      
      for mention in found_mentions:
        mentions[mention] = mentions.get(mention, 0) + 1
  
  # Identify key people by role
  result = {
    "managers": [],
    "team_leads": [],
    "approvers": [],
    "resource_managers": [],
    "process_owners": []
  }
  
  # Identify managers and team leads (people who get many replies)
  sorted_by_replies = sorted(replies_to.items(), key=lambda x: x[1], reverse=True)
  for person, count in sorted_by_replies[:3]:
    result["managers"].append(person)
  
  for person, count in sorted_by_replies[3:6]:
    result["team_leads"].append(person)
  
  # Identify approvers (people who receive many emails)
  sorted_recipients = sorted(person_email_count.items(), key=lambda x: x[1], 
                             reverse=True)
  for person, count in sorted_recipients[:3]:
    if person not in result["managers"]:
      result["approvers"].append(person)
  
  # Identify resource managers and process owners (by department if available)
  for person, dept in person_dept_map.items():
    if dept == "Resource Management" and person not in result["resource_managers"]:
      result["resource_managers"].append(person)
    elif dept == "Operations" and person not in result["process_owners"]:
      result["process_owners"].append(person)
  
  # Remove any empty categories
  return {role: people for role, people in result.items() if people}

def extract_key_projects(emails: List[Dict[str, Any]]) -> List[str]:
  """
  Extract key project names from email dataset.
  
  Args:
    emails: List of email dictionaries
    
  Returns:
    List of project names
  """
  # Extract project names from subject lines and bodies
  project_mentions = {}
  
  # Common project name patterns
  project_pattern = r'(?:Project|PROJ|project):?\s*([A-Za-z][A-Za-z0-9_\- ]+)'
  bracket_pattern = r'\[([A-Za-z][A-Za-z0-9_\- ]+)\]'
  
  for email in emails:
    subject = email.get('subject', '')
    body = email.get('body', '')
    
    # Search for project names in subject
    for pattern in [project_pattern, bracket_pattern]:
      matches = re.findall(pattern, subject)
      for match in matches:
        project_name = match.strip()
        if 3 <= len(project_name) <= 30:  # Reasonable project name length
          project_mentions[project_name] = project_mentions.get(project_name, 0) + 2
    
    # Search in body (with lower weight)
    for pattern in [project_pattern, bracket_pattern]:
      matches = re.findall(pattern, body)
      for match in matches:
        project_name = match.strip()
        if 3 <= len(project_name) <= 30:
          project_mentions[project_name] = project_mentions.get(project_name, 0) + 1
  
  # Sort projects by mention count
  sorted_projects = sorted(project_mentions.items(), key=lambda x: x[1], reverse=True)
  
  # Return top projects
  return [project for project, count in sorted_projects[:5]]

def create_email_threads(emails: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
  """
  Organize emails into conversation threads.
  
  Args:
    emails: List of email dictionaries
    
  Returns:
    Dict mapping thread IDs to lists of emails
  """
  threads = {}
  
  # First pass: identify threads by subject
  subject_to_thread = {}
  thread_id_counter = 1
  
  for email in emails:
    subject = email.get('subject', '')
    thread_id = None
    
    # Clean subject for thread matching
    clean_subject = re.sub(r'^(Re|Fwd|FW|FWD):\s*', '', subject, flags=re.IGNORECASE)
    
    # Check if this belongs to existing thread
    if clean_subject in subject_to_thread:
      thread_id = subject_to_thread[clean_subject]
    else:
      # Create new thread
      thread_id = f"thread_{thread_id_counter}"
      thread_id_counter += 1
      subject_to_thread[clean_subject] = thread_id
    
    # Add to thread
    if thread_id not in threads:
      threads[thread_id] = []
    
    threads[thread_id].append(email)
  
  # Second pass: sort emails in each thread by timestamp if available
  for thread_id, thread_emails in threads.items():
    if all('timestamp' in email for email in thread_emails):
      threads[thread_id] = sorted(thread_emails, 
                                 key=lambda x: x.get('timestamp', ''))
  
  return threads
