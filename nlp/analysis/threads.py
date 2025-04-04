"""
Thread analysis functionality for identifying communication patterns.
"""

from typing import List, Dict, Any
from datetime import datetime

class ThreadAnalyzer:
    """
    Analyzes email threads for communication patterns and bottlenecks.
    """
    
    def __init__(self):
        """Initialize thread analyzer."""
        pass
    
    def analyze_threads(self, threads: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Analyze email threads for communication patterns.
        
        Args:
            threads: Dictionary of thread IDs to lists of ordered emails
            
        Returns:
            Dict with thread analysis results
        """
        thread_analysis = {}
        
        for thread_id, emails in threads.items():
            # Sort emails by timestamp if available
            if all('timestamp' in email for email in emails):
                emails.sort(key=lambda x: x.get('timestamp', ''))
            
            # Skip threads with only one email
            if len(emails) <= 1:
                continue
            
            # Analyze thread
            thread_analysis[thread_id] = {
                "email_count": len(emails),
                "participants": set(),
                "response_times": [],
                "avg_response_time": 0.0,
                "topics": self._extract_topics(emails),
                "sentiment": self._analyze_sentiment(emails),
            }
            
            # Calculate response times and identify participants
            prev_timestamp = None
            
            for email in emails:
                # Get sender ID (either as string or extract from object if it's a dict)
                sender = email.get('sender_id', email.get('from'))
                if isinstance(sender, dict):
                    sender = sender.get('id', sender.get('email', str(sender)))
                
                # Get recipients (either as string list or extract IDs if they're dicts)
                recipients = email.get('recipients', email.get('to', []))
                if not isinstance(recipients, list):
                    recipients = [recipients] if recipients else []
                
                timestamp = email.get('timestamp')
                
                # Add sender to participants
                if sender:
                    thread_analysis[thread_id]["participants"].add(str(sender))
                
                # Add recipients to participants
                for recipient in recipients:
                    if recipient:
                        if isinstance(recipient, dict):
                            # Extract ID or email from recipient dict
                            recipient_id = recipient.get('id', recipient.get('email', str(recipient)))
                            thread_analysis[thread_id]["participants"].add(str(recipient_id))
                        else:
                            # Add recipient string directly
                            thread_analysis[thread_id]["participants"].add(str(recipient))
                
                # Calculate response time if this isn't the first email
                if prev_timestamp and timestamp:
                    try:
                        # Simple timestamp parsing, assuming ISO format
                        prev_time = self._parse_timestamp(prev_timestamp)
                        curr_time = self._parse_timestamp(timestamp)
                        
                        if prev_time and curr_time:
                            # Calculate hours difference
                            diff_hours = (curr_time - prev_time).total_seconds() / 3600
                            thread_analysis[thread_id]["response_times"].append(diff_hours)
                    except (ValueError, TypeError):
                        # Skip if timestamp parsing fails
                        pass
                
                prev_timestamp = timestamp
            
            # Convert participants set to list for serialization
            thread_analysis[thread_id]["participants"] = list(thread_analysis[thread_id]["participants"])
            
            # Calculate average response time
            if thread_analysis[thread_id]["response_times"]:
                avg_time = sum(thread_analysis[thread_id]["response_times"]) / len(thread_analysis[thread_id]["response_times"])
                thread_analysis[thread_id]["avg_response_time"] = avg_time
        
        return thread_analysis
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """
        Parse timestamp string to datetime object.
        
        Args:
            timestamp_str: Timestamp string
            
        Returns:
            datetime: Parsed datetime object or None if parsing fails
        """
        try:
            # Try common formats
            for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y/%m/%d %H:%M:%S"]:
                try:
                    return datetime.strptime(timestamp_str, fmt)
                except ValueError:
                    continue
            
            # Fallback to more flexible parsing
            import dateutil.parser
            return dateutil.parser.parse(timestamp_str)
        except:
            return None
    
    def _extract_topics(self, emails: List[Dict[str, Any]]) -> List[str]:
        """
        Extract main topics from email thread.
        
        Args:
            emails: List of emails in thread
            
        Returns:
            List of topic keywords
        """
        # Simple topic extraction from subject lines
        topics = []
        subjects = [email.get('subject', '') for email in emails if email.get('subject')]
        
        if subjects:
            # Use most common words in subjects as topics
            # This is a simple placeholder - real implementation would use NLP
            all_words = ' '.join(subjects).lower().split()
            stopwords = {'re:', 'fwd:', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by'}
            
            # Count word frequency
            word_counts = {}
            for word in all_words:
                if word not in stopwords and len(word) > 3:
                    word_counts[word] = word_counts.get(word, 0) + 1
            
            # Get top 3 words as topics
            topics = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:3]
            topics = [word for word, count in topics]
        
        return topics
    
    def _analyze_sentiment(self, emails: List[Dict[str, Any]]) -> str:
        """
        Perform basic sentiment analysis on emails.
        
        Args:
            emails: List of emails in thread
            
        Returns:
            String indicating sentiment (positive, negative, neutral)
        """
        # Simplified sentiment analysis (placeholder)
        # Real implementation would use a proper sentiment analysis model
        positive_words = {'great', 'good', 'excellent', 'thanks', 'appreciate', 'happy', 'resolved'}
        negative_words = {'issue', 'problem', 'error', 'delay', 'concerned', 'urgent', 'failed'}
        
        positive_count = 0
        negative_count = 0
        
        for email in emails:
            body = email.get('body', '').lower()
            for word in positive_words:
                if word in body:
                    positive_count += 1
            for word in negative_words:
                if word in body:
                    negative_count += 1
        
        if positive_count > negative_count * 1.5:
            return "positive"
        elif negative_count > positive_count * 1.5:
            return "negative"
        else:
            return "neutral"
