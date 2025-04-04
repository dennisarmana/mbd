"""
Department-specific analysis functionality.
"""

from typing import List, Dict, Any

class DepartmentAnalyzer:
    """
    Analyzes department communication patterns and constraints.
    """
    
    def __init__(self, department_constraints: Dict[str, List[str]] = None):
        """
        Initialize department analyzer.
        
        Args:
            department_constraints: Optional mapping of departments to constraint keywords
        """
        self.department_constraints = department_constraints or {
            "Engineering": ["technical debt", "bug", "test", "integration", "compatibility"],
            "Marketing": ["campaign", "messaging", "audience", "content", "channels"],
            "Sales": ["pipeline", "leads", "conversion", "prospect", "client"],
            "Product": ["feature", "roadmap", "priority", "specification", "requirement"],
            "Finance": ["budget", "forecast", "expense", "approval", "cost"],
            "HR": ["hiring", "recruitment", "onboarding", "training", "retention"]
        }
    
    def analyze_department_patterns(self, emails: List[Dict[str, Any]], 
                                   sender_dept_map: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Analyze department-specific communication patterns and constraints.
        
        Args:
            emails: List of processed email data
            sender_dept_map: Optional mapping of sender IDs to departments
            
        Returns:
            Dict mapping departments to their constraint patterns
        """
        # Ensure we have a department mapping
        sender_dept_map = sender_dept_map or {}
        
        # Initialize department data
        departments = set(sender_dept_map.values())
        if not departments:
            departments = set(self.department_constraints.keys())
        
        dept_insights = {}
        for dept in departments:
            dept_insights[dept] = {
                "email_count": 0,
                "constraints": {constraint: 0.0 for constraint in [
                    "deadline_issues", "approval_bottlenecks", "resource_constraints",
                    "skill_gaps", "process_issues", "communication_problems"
                ]},
                "communication_patterns": {
                    "internal_comm_ratio": 0.0,
                    "response_time_avg": 0.0,
                    "cross_dept_ratio": {},
                }
            }
        
        # Count emails by department and analyze constraint indicators
        for email in emails:
            sender_id = email.get('from')
            sender_dept = sender_dept_map.get(sender_id)
            
            if sender_dept and sender_dept in dept_insights:
                dept_insights[sender_dept]["email_count"] += 1
                
                # Analyze email text for department-specific constraint keywords
                text = (email.get('subject', '') + ' ' + email.get('body', '')).lower()
                
                # Check general constraints
                for constraint in dept_insights[sender_dept]["constraints"]:
                    # For simplicity, we'll just check a few keywords per constraint
                    if constraint == "deadline_issues" and any(word in text for word in ["deadline", "late", "delay"]):
                        dept_insights[sender_dept]["constraints"][constraint] += 1
                    elif constraint == "approval_bottlenecks" and any(word in text for word in ["approval", "waiting", "sign-off"]):
                        dept_insights[sender_dept]["constraints"][constraint] += 1
                    elif constraint == "resource_constraints" and any(word in text for word in ["resource", "budget", "shortage"]):
                        dept_insights[sender_dept]["constraints"][constraint] += 1
                    elif constraint == "skill_gaps" and any(word in text for word in ["training", "skill", "knowledge"]):
                        dept_insights[sender_dept]["constraints"][constraint] += 1
                    elif constraint == "process_issues" and any(word in text for word in ["process", "workflow", "inefficient"]):
                        dept_insights[sender_dept]["constraints"][constraint] += 1
                    elif constraint == "communication_problems" and any(word in text for word in ["unclear", "confusion", "misunderstanding"]):
                        dept_insights[sender_dept]["constraints"][constraint] += 1
                
                # Check department-specific keywords
                specific_keywords = self.department_constraints.get(sender_dept, [])
                for keyword in specific_keywords:
                    if keyword in text:
                        # Consider these as process issues for simplicity
                        dept_insights[sender_dept]["constraints"]["process_issues"] += 0.5
        
        # Normalize constraint scores by email count
        for dept, data in dept_insights.items():
            email_count = max(data["email_count"], 1)  # Avoid division by zero
            for constraint in data["constraints"]:
                data["constraints"][constraint] /= email_count
        
        return dept_insights
