"""
Constraint identification and analysis functionality.
"""

import numpy as np
from typing import List, Dict, Any

class ConstraintIdentifier:
    """
    Identifies organizational constraints from email data.
    """
    
    def __init__(self):
        """Initialize constraint identifier with default keyword sets."""
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
    
    def identify_constraints(self, email_texts: List[str], 
                           embeddings: List[np.ndarray] = None) -> Dict[str, float]:
        """
        Identify constraints from email texts.
        
        Args:
            email_texts: List of preprocessed email texts
            embeddings: Optional list of precomputed embeddings
            
        Returns:
            Dict mapping constraint types to confidence scores
        """
        constraint_scores = {constraint: 0.0 for constraint in self.constraint_keywords}
        
        # Count keyword occurrences
        for text in email_texts:
            text_lower = text.lower()
            
            for constraint, keywords in self.constraint_keywords.items():
                score = 0.0
                
                for keyword in keywords:
                    if keyword in text_lower:
                        # Simple keyword presence scoring
                        score += 1.0
                
                # Normalize by number of keywords to get score between 0-1
                if score > 0:
                    score = min(score / len(keywords), 1.0)
                    constraint_scores[constraint] += score
        
        # Normalize by number of emails
        num_emails = max(len(email_texts), 1)
        for constraint in constraint_scores:
            constraint_scores[constraint] = constraint_scores[constraint] / num_emails
        
        return constraint_scores
