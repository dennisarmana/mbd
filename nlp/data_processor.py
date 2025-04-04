#!/usr/bin/env python3
"""
Email Data Processor for BERT Analysis
--------------------------------------
Extracts and processes email data from JSON format,
preparing it for analysis with BERT.

This module handles:
- Loading email datasets
- Extracting relevant text and metadata
- Preprocessing text for BERT analysis
- Structuring data for constraint identification
"""

import json
import os
import re
from typing import List, Dict, Any, Tuple

class EmailDataProcessor:
  """Processes email datasets for BERT analysis."""
  
  def __init__(self, dataset_path: str):
    """
    Initialize the data processor with path to email dataset.
    
    Args:
        dataset_path: Path to the JSON email dataset
    """
    self.dataset_path = dataset_path
    self.raw_data = None
    self.emails = []
    self.threads = []
    self.company_data = None
    
  def load_data(self) -> bool:
    """
    Load and parse the email dataset.
    
    Returns:
        bool: True if successful, False otherwise
    
    Example:
        >>> processor = EmailDataProcessor('path/to/emails.json')
        >>> processor.load_data()
        True
    """
    try:
      with open(self.dataset_path, 'r') as f:
        self.raw_data = json.load(f)
      
      if 'raw' not in self.raw_data:
        print("Error: Invalid dataset format - missing 'raw' key")
        return False
      
      self.emails = self.raw_data['raw'].get('emails', [])
      self.threads = self.raw_data['raw'].get('threads', [])
      self.company_data = self.raw_data['raw'].get('company', {})
      
      print(f"Loaded {len(self.emails)} emails in {len(self.threads)} threads")
      return True
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
      
      # Find the corresponding person data
      sender = next((p for p in self.company_data.get('persons', []) 
                   if p.get('id') == sender_id), {})
      recipients = [next((p for p in self.company_data.get('persons', []) 
                        if p.get('id') == rid), {}) 
                   for rid in recipient_ids]
      
      # Process the body text
      processed_body = self.preprocess_text(email.get('body', ''))
      
      # Create the BERT input structure
      bert_input = {
        'email_id': email.get('id'),
        'thread_id': email.get('thread_id'),
        'subject': email.get('subject', ''),
        'processed_body': processed_body,
        'sender': {
          'id': sender.get('id'),
          'name': sender.get('name'),
          'department': sender.get('department'),
          'role': sender.get('title')
        },
        'recipients': [{
          'id': r.get('id'),
          'name': r.get('name'),
          'department': r.get('department'),
          'role': r.get('title')
        } for r in recipients],
        'timestamp': email.get('timestamp'),
        'metadata': email.get('metadata', {})
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

if __name__ == "__main__":
  # Test the processor on a sample dataset
  import sys
  
  if len(sys.argv) < 2:
    print("Usage: python data_processor.py <path_to_dataset>")
    sys.exit(1)
  
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
