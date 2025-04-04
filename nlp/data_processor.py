#!/usr/bin/env python3
"""
Email Data Processor for BERT Analysis
--------------------------------------
Extracts and processes email data from JSON format,
preparing it for analysis with BERT.

This module handles:
- Loading email datasets from the email generator
- Extracting relevant text and metadata
- Preprocessing text for BERT analysis
- Structuring data for constraint identification
"""

import json
import os
import re
import glob
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

class EmailDataProcessor:
  """Processes email datasets for BERT analysis."""
  
  def __init__(self, dataset_path: str):
    """
    Initialize the data processor with path to email dataset.
    
    Args:
        dataset_path: Path to the JSON email dataset or directory containing datasets
        
    Example:
        # Load a specific dataset
        processor = EmailDataProcessor('path/to/emails.json')
        
        # Or load from a scenario directory
        processor = EmailDataProcessor('path/to/scenario_directory')
    """
    self.dataset_path = dataset_path
    self.raw_data = None
    self.emails = []
    self.threads = []
    self.company_data = None
    self.scenario_name = os.path.basename(os.path.dirname(dataset_path))
    if self.scenario_name == 'data':
      # Handle case where path is directly to emails.json
      self.scenario_name = os.path.basename(os.path.dirname(os.path.dirname(dataset_path)))
    
  def load_data(self) -> bool:
    """
    Load and parse the email dataset. Handles both direct file paths
    and directory paths containing emails.json.
    
    Returns:
        bool: True if successful, False otherwise
    
    Example:
        >>> processor = EmailDataProcessor('path/to/emails.json')
        >>> processor.load_data()
        True
        
        >>> processor = EmailDataProcessor('path/to/marketing_interpretation/')
        >>> processor.load_data()
        True
    """
    try:
      # Determine the actual path to the emails.json file
      emails_path = self.dataset_path
      if os.path.isdir(self.dataset_path):
        emails_path = os.path.join(self.dataset_path, 'emails.json')
      elif not self.dataset_path.endswith('emails.json'):
        # Try to find emails.json in the directory
        possible_files = glob.glob(os.path.join(os.path.dirname(self.dataset_path), 
                                              'emails.json'))
        if possible_files:
          emails_path = possible_files[0]
      
      # Try to load the file
      with open(emails_path, 'r') as f:
        data = json.load(f)
      
      # Handle different JSON structures
      if isinstance(data, dict) and 'raw' in data:
        # Original format
        self.raw_data = data
        self.emails = data['raw'].get('emails', [])
        self.threads = data['raw'].get('threads', [])
        self.company_data = data['raw'].get('company', {})
      elif isinstance(data, dict) and 'emails' in data:
        # Email generator format without 'raw' wrapper
        self.raw_data = {'raw': data}
        self.emails = data.get('emails', [])
        self.threads = data.get('threads', [])
        self.company_data = data.get('company', {})
      elif isinstance(data, list):
        # Simple list of emails
        self.raw_data = {'raw': {'emails': data}}
        self.emails = data
        # Build thread structure if missing
        if not self.threads:
          thread_map = {}
          for email in data:
            thread_id = email.get('thread_id', email.get('id'))
            if thread_id not in thread_map:
              thread_map[thread_id] = {
                'id': thread_id,
                'subject': email.get('subject', ''),
                'participants': [],
                'email_ids': []
              }
            thread_map[thread_id]['email_ids'].append(email.get('id'))
            
            # Add participants
            sender = email.get('from')
            recipients = email.get('to', [])
            all_participants = [sender] + recipients
            for participant in all_participants:
              if participant not in thread_map[thread_id]['participants']:
                thread_map[thread_id]['participants'].append(participant)
          
          self.threads = list(thread_map.values())
      
      # Try to load company data from metadata.json if it exists
      if not self.company_data:
        metadata_path = os.path.join(os.path.dirname(emails_path), 'metadata.json')
        if os.path.exists(metadata_path):
          try:
            with open(metadata_path, 'r') as f:
              metadata = json.load(f)
              if isinstance(metadata, dict) and 'company' in metadata:
                self.company_data = metadata['company']
              else:
                self.company_data = metadata
          except Exception as meta_err:
            print(f"Warning: Could not load metadata file: {str(meta_err)}")
      
      print(f"Loaded {len(self.emails)} emails in {len(self.threads)} threads")
      return len(self.emails) > 0
    except Exception as e:
      print(f"Error loading data: {str(e)}")
      return False
  
  def preprocess_text(self, text: str) -> str:
    """
    Clean and prepare text for BERT analysis.
    
    Args:
        text: Raw email text
        
    Returns:
        str: Preprocessed text
    """
    # Remove email signatures
    text = re.sub(r'--\s*\n.*', '', text, flags=re.DOTALL)
    
    # Remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove HTML tags if any
    text = re.sub(r'<[^>]+>', '', text)
    
    return text.strip()
  
  def prepare_bert_inputs(self) -> List[Dict[str, Any]]:
    """
    Prepare formatted inputs for BERT analysis.
    
    Returns:
        List of dictionaries with processed email data
    """
    bert_inputs = []
    
    for email in self.emails:
      # Get sender and recipients
      sender_id = email.get('from')
      recipient_ids = email.get('to', [])
      if not isinstance(recipient_ids, list):
        recipient_ids = [recipient_ids] if recipient_ids else []
      
      # Handle different company data structures from email generator
      persons = []
      if self.company_data:
        if isinstance(self.company_data, dict):
          if 'persons' in self.company_data:
            persons = self.company_data.get('persons', [])
          elif 'employees' in self.company_data:
            persons = self.company_data.get('employees', [])
      
      # Find the corresponding person data
      sender = {}
      if persons:
        sender = next((p for p in persons if p.get('id') == sender_id), {})
      
      # If we can't find the person by ID, try by email
      if not sender and sender_id:
        sender_email = sender_id
        if '@' in sender_id:
          sender_email = sender_id.split('@')[0]
        sender = next((p for p in persons 
                      if p.get('email') == sender_id or 
                         p.get('name', '').lower().replace(' ', '.') == sender_email.lower()), 
                     {})
      
      # If still empty, create basic sender info from email
      if not sender and sender_id:
        if '@' in sender_id:
          name_part = sender_id.split('@')[0].replace('.', ' ').title()
          domain_part = sender_id.split('@')[1].split('.')[0]
          sender = {
            'id': sender_id,
            'name': name_part,
            'department': 'Unknown',
            'title': 'Employee at ' + domain_part.title() 
          }
      
      # Find recipients
      recipients = []
      for rid in recipient_ids:
        recipient = next((p for p in persons if p.get('id') == rid), {})
        if not recipient and '@' in rid:
          # Try to construct basic info
          name_part = rid.split('@')[0].replace('.', ' ').title()
          domain_part = rid.split('@')[1].split('.')[0]
          recipient = {
            'id': rid,
            'name': name_part,
            'department': 'Unknown',
            'title': 'Employee at ' + domain_part.title()
          }
        recipients.append(recipient)
      
      # Process the body text
      processed_body = self.preprocess_text(email.get('body', ''))
      
      # Extract or generate a timestamp
      timestamp = email.get('timestamp') or email.get('date')
      if not timestamp:
        timestamp = datetime.now().isoformat()
      
      # Create the BERT input structure
      bert_input = {
        'email_id': email.get('id', f"email-{len(bert_inputs)}"),
        'thread_id': email.get('thread_id', email.get('id', f"thread-{len(bert_inputs)}")),
        'subject': email.get('subject', ''),
        'processed_body': processed_body,
        'sender': {
          'id': sender.get('id', sender_id),
          'name': sender.get('name', sender_id),
          'department': sender.get('department', 'Unknown'),
          'role': sender.get('title', sender.get('role', 'Employee'))
        },
        'recipients': [{
          'id': r.get('id', rid),
          'name': r.get('name', rid),
          'department': r.get('department', 'Unknown'),
          'role': r.get('title', r.get('role', 'Employee'))
        } for r, rid in zip(recipients, recipient_ids)],
        'timestamp': timestamp,
        'metadata': email.get('metadata', {}),
        'scenario': self.scenario_name
      }
      
      bert_inputs.append(bert_input)
    
    return bert_inputs
  
  def extract_thread_context(self) -> Dict[str, List[Dict[str, Any]]]:
    """
    Extract thread context to analyze email conversations.
    
    Returns:
        Dictionary of thread IDs to lists of ordered emails
    """
    thread_context = {}
    
    for thread in self.threads:
      thread_id = thread.get('id')
      thread_emails = [e for e in self.emails if e.get('thread_id') == thread_id]
      
      # Sort emails by timestamp
      thread_emails.sort(key=lambda e: e.get('timestamp', ''))
      
      thread_context[thread_id] = [{
        'email_id': e.get('id'),
        'sender_id': e.get('from'),
        'recipient_ids': e.get('to', []),
        'subject': e.get('subject', ''),
        'body': self.preprocess_text(e.get('body', '')),
        'timestamp': e.get('timestamp'),
        'position_in_thread': idx
      } for idx, e in enumerate(thread_emails)]
    
    return thread_context

  @classmethod
  def get_available_datasets(cls, base_directory: str) -> List[Dict[str, str]]:
    """
    Find available email datasets in the given directory.
    
    Args:
        base_directory: Root directory to search for email datasets
        
    Returns:
        List of dictionaries with dataset information (path and name)
        
    Example:
        >>> datasets = EmailDataProcessor.get_available_datasets('/path/to/data')
        >>> for dataset in datasets:
        >>>     print(f"Dataset: {dataset['name']} at {dataset['path']}")
    """
    datasets = []
    
    # Look for emails.json files
    for emails_file in glob.glob(os.path.join(base_directory, '**', 'emails.json'), 
                              recursive=True):
      # Extract scenario name from path
      directory = os.path.dirname(emails_file)
      scenario_name = os.path.basename(directory)
      
      # If scenario_name is just 'data' or similar, get the parent directory
      if scenario_name in ['data', 'sample']:
        scenario_name = os.path.basename(os.path.dirname(directory))
      
      # Clean up the name for display
      display_name = scenario_name.replace('_', ' ').title()
      
      datasets.append({
        'path': emails_file,
        'name': display_name
      })
    
    return datasets


if __name__ == "__main__":
  # Test the processor on a sample dataset or list available datasets
  import sys
  
  if len(sys.argv) < 2:
    print("Usage: python data_processor.py <path_to_dataset>")
    print("   or: python data_processor.py --list <base_directory>")
    sys.exit(1)
  
  if sys.argv[1] == '--list' and len(sys.argv) > 2:
    # List available datasets
    base_dir = sys.argv[2]
    datasets = EmailDataProcessor.get_available_datasets(base_dir)
    print(f"Found {len(datasets)} datasets:")
    for idx, dataset in enumerate(datasets, 1):
      print(f"{idx}. {dataset['name']} - {dataset['path']}")
  else:
    # Process a specific dataset
    processor = EmailDataProcessor(sys.argv[1])
    if processor.load_data():
      bert_inputs = processor.prepare_bert_inputs()
      print(f"Prepared {len(bert_inputs)} emails for BERT analysis")
      
      # Preview first item
      if bert_inputs:
        preview = bert_inputs[0]
        print("\nSample BERT input:")
        print(f"Email ID: {preview['email_id']}")
        print(f"Subject: {preview['subject']}")
        print(f"Sender: {preview['sender']['name']} ({preview['sender']['role']})")
        print(f"Body preview: {preview['processed_body'][:100]}...")
