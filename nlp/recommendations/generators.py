"""
Recommendation generators for constraint analysis.
"""

from typing import List, Dict, Any, Optional, Set

class RecommendationGenerator:
  """
  Generates actionable recommendations based on constraint analysis.
  """
  
  def __init__(self):
    """Initialize recommendation generator."""
    # Map of constraint types to recommendation templates
    self.recommendation_templates = {
      "deadline_issues": {
        "title": "Implement Deadline Management Process",
        "description": "Create a structured deadline management process with clear buffer times.",
        "actions": [
          "Document all project deadlines in a shared calendar",
          "Implement a 20% buffer time policy for all deadlines",
          "Create a weekly deadline review process"
        ]
      },
      "approval_bottlenecks": {
        "title": "Streamline Approval Processes",
        "description": "Reduce the complexity and time required for approvals.",
        "actions": [
          "Create approval thresholds to eliminate unnecessary approvals",
          "Implement parallel approval workflows",
          "Delegate approval authority to appropriate levels"
        ]
      },
      "resource_constraints": {
        "title": "Optimize Resource Allocation",
        "description": "Improve how resources are allocated across projects and teams.",
        "actions": [
          "Conduct a resource capacity analysis",
          "Create a prioritization framework for resource allocation",
          "Implement a resource request process with lead time requirements"
        ]
      },
      "skill_gaps": {
        "title": "Address Skill Development Needs",
        "description": "Build critical skills that are currently constraining progress.",
        "actions": [
          "Create a skills inventory across teams",
          "Develop targeted training programs for high-priority skills",
          "Implement knowledge-sharing sessions for critical competencies"
        ]
      },
      "process_issues": {
        "title": "Streamline Inefficient Processes",
        "description": "Identify and improve processes that are creating constraints.",
        "actions": [
          "Map key processes to identify bottlenecks",
          "Eliminate unnecessary steps in critical workflows",
          "Create process documentation for consistency"
        ]
      },
      "communication_problems": {
        "title": "Enhance Communication Channels",
        "description": "Improve how information flows across the organization.",
        "actions": [
          "Define communication protocols for different types of information",
          "Implement regular cross-functional meetings",
          "Create a central knowledge repository"
        ]
      }
    }
  
  def generate_recommendations(self, 
                               constraint_scores: Dict[str, float],
                               thread_analysis: Dict[str, Any],
                               key_people: Optional[Dict[str, List[str]]] = None,
                               key_projects: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    Generate actionable recommendations based on constraint analysis.
    
    Args:
        constraint_scores: Mapping of constraint types to scores
        thread_analysis: Results of thread analysis
        key_people: Optional mapping of roles to people names
        key_projects: Optional list of key project names
        
    Returns:
        List of recommendation dictionaries
    """
    recommendations = []
    
    # Sort constraints by score (highest first)
    sorted_constraints = sorted(
      constraint_scores.items(), 
      key=lambda x: x[1], 
      reverse=True
    )
    
    # Generate recommendations for top constraints
    for constraint_type, score in sorted_constraints:
      # Only recommend for constraints with significant scores
      if score < 0.1:
        continue
        
      # Get template for this constraint type
      template = self.recommendation_templates.get(constraint_type)
      if not template:
        continue
        
      # Create recommendation based on template
      recommendation = {
        "constraint_type": constraint_type,
        "score": score,
        "title": template["title"],
        "description": template["description"],
        "actions": template["actions"][:],  # Copy to avoid modifying template
        "priority": self._calculate_priority(score)
      }
      
      # Add personalized elements if available
      if key_people or key_projects:
        recommendation = self._personalize_recommendation(
          recommendation, 
          constraint_type, 
          key_people or {}, 
          key_projects or []
        )
      
      recommendations.append(recommendation)
      
      # Limit to top 5 recommendations
      if len(recommendations) >= 5:
        break
        
    return recommendations
  
  def _calculate_priority(self, score: float) -> str:
    """
    Calculate priority level based on constraint score.
    
    Args:
        score: Constraint score between 0 and 1
        
    Returns:
        String priority level (high, medium, low)
    """
    if score >= 0.7:
      return "high"
    elif score >= 0.4:
      return "medium"
    else:
      return "low"
  
  def _personalize_recommendation(self, 
                                 recommendation: Dict[str, Any],
                                 constraint_type: str,
                                 key_people: Dict[str, List[str]],
                                 key_projects: List[str]) -> Dict[str, Any]:
    """
    Add personalized elements to a recommendation.
    
    Args:
        recommendation: Base recommendation to personalize
        constraint_type: Type of constraint
        key_people: Mapping of roles to people names
        key_projects: List of key project names
        
    Returns:
        Personalized recommendation
    """
    # Add relevant people
    relevant_people = self._get_relevant_people_for_constraint(constraint_type, key_people)
    if relevant_people:
      recommendation["relevant_people"] = relevant_people
      
      # Add personalized actions based on identified people
      people_actions = self._generate_personalized_actions(constraint_type, relevant_people)
      if people_actions:
        recommendation["actions"].extend(people_actions)
      
      # Update the recommendation title and description to be more specific
      if "managers" in relevant_people and relevant_people["managers"]:
        manager_name = relevant_people["managers"][0]
        recommendation["title"] = self._generate_recommendation_title(
          constraint_type, manager_name
        )
        recommendation["description"] = self._generate_recommendation_description(
          constraint_type, relevant_people
        )
    
    # Add relevant projects
    relevant_projects = self._get_relevant_projects_for_constraint(
      constraint_type, 
      key_projects
    )
    if relevant_projects:
      recommendation["relevant_projects"] = relevant_projects
      
      # Add project-specific action if appropriate
      if relevant_projects:
        project = relevant_projects[0]
        recommendation["actions"].append(
          f"Perform a constraint analysis workshop for the {project} project"
        )
    
    return recommendation
  
  def _get_relevant_people_for_constraint(self, 
                                         constraint_type: str,
                                         key_people: Dict[str, List[str]]) -> Optional[Dict[str, List[str]]]:
    """
    Identify people relevant to a specific constraint.
    
    Args:
        constraint_type: Type of constraint
        key_people: Mapping of roles to people names
        
    Returns:
        Dict mapping roles to relevant people names
    """
    relevant_people = {}
    
    if "managers" in key_people and key_people["managers"]:
      # Managers are relevant for most constraints
      relevant_people["managers"] = key_people["managers"][:2]  # Limit to 2
      
    # Add role-specific people based on constraint type
    if constraint_type == "resource_constraints" and "resource_managers" in key_people:
      relevant_people["resource_managers"] = key_people["resource_managers"]
    elif constraint_type == "approval_bottlenecks" and "approvers" in key_people:
      relevant_people["approvers"] = key_people["approvers"]
    elif constraint_type == "skill_gaps" and "trainers" in key_people:
      relevant_people["trainers"] = key_people["trainers"]
    elif constraint_type == "process_issues" and "process_owners" in key_people:
      relevant_people["process_owners"] = key_people["process_owners"]
    elif constraint_type == "communication_problems" and "team_leads" in key_people:
      relevant_people["team_leads"] = key_people["team_leads"]
    
    return relevant_people if relevant_people else None
  
  def _get_relevant_projects_for_constraint(self, 
                                           constraint_type: str,
                                           key_projects: List[str]) -> List[str]:
    """
    Identify projects relevant to a specific constraint.
    
    Args:
        constraint_type: Type of constraint
        key_projects: List of key project names
        
    Returns:
        List of relevant project names
    """
    # For now, return the top 2 projects for any constraint
    # In a real implementation, we would filter based on project metadata
    return key_projects[:2] if key_projects else []
  
  def _generate_personalized_actions(self,
                                     constraint_type: str,
                                     relevant_people: Dict[str, List[str]]) -> List[str]:
    """
    Generate personalized action items based on people identified for a constraint.
    
    Args:
        constraint_type: Type of constraint
        relevant_people: Dict mapping roles to people names
        
    Returns:
        List of personalized action items
    """
    actions = []
    
    # Add manager-related actions
    if "managers" in relevant_people and relevant_people["managers"]:
      manager = relevant_people["managers"][0]
      actions.append(f"Schedule a constraint review meeting with {manager}")
      actions.append(f"Work with {manager} to prioritize constraint resolution")
    
    # Add role-specific actions
    if constraint_type == "resource_constraints" and "resource_managers" in relevant_people:
      for person in relevant_people["resource_managers"][:1]:
        actions.append(f"Request resource allocation review from {person}")
        actions.append(f"Develop resource proposal with {person}'s input")
        
    elif constraint_type == "approval_bottlenecks" and "approvers" in relevant_people:
      for person in relevant_people["approvers"][:1]:
        actions.append(f"Discuss approval process improvements with {person}")
        actions.append(f"Request expedited approval channel from {person} for urgent items")
        
    elif constraint_type == "skill_gaps" and "team_leads" in relevant_people:
      for person in relevant_people["team_leads"][:1]:
        actions.append(f"Work with {person} to identify specific skill development needs")
        actions.append(f"Schedule knowledge transfer sessions facilitated by {person}")
        
    elif constraint_type == "process_issues" and "process_owners" in relevant_people:
      for person in relevant_people["process_owners"][:1]:
        actions.append(f"Schedule process review workshop with {person}")
        actions.append(f"Request process documentation update from {person}")
        
    elif constraint_type == "communication_problems" and "team_leads" in relevant_people:
      for person in relevant_people["team_leads"][:1]:
        actions.append(f"Establish regular sync meetings facilitated by {person}")
        actions.append(f"Create communication plan with {person}'s input")
    
    # Limit to 3 personalized actions
    return actions[:3]
  
  def _generate_recommendation_title(self,
                                    constraint_type: str,
                                    manager_name: str) -> str:
    """
    Generate a personalized recommendation title.
    
    Args:
        constraint_type: Type of constraint
        manager_name: Name of the manager involved
        
    Returns:
        Personalized recommendation title
    """
    base_title = self.recommendation_templates[constraint_type]["title"]
    
    # Create more specific titles based on constraint type
    if constraint_type == "resource_constraints":
      return f"Work with {manager_name} to {base_title}"
    elif constraint_type == "approval_bottlenecks":
      return f"Collaborate with {manager_name} to {base_title}"
    elif constraint_type == "process_issues":
      return f"Partner with {manager_name} to {base_title}"
    else:
      return f"{base_title} with {manager_name}'s Team"
  
  def _generate_recommendation_description(self,
                                         constraint_type: str,
                                         relevant_people: Dict[str, List[str]]) -> str:
    """
    Generate a personalized recommendation description.
    
    Args:
        constraint_type: Type of constraint
        relevant_people: Dict mapping roles to people names
        
    Returns:
        Personalized recommendation description
    """
    base_description = self.recommendation_templates[constraint_type]["description"]
    
    # Build a more detailed description
    if "managers" in relevant_people and relevant_people["managers"]:
      manager_name = relevant_people["managers"][0]
      
      if constraint_type == "resource_constraints":
        return f"{base_description} Coordinate with {manager_name} to identify specific resource bottlenecks and prioritize critical needs."
      elif constraint_type == "approval_bottlenecks":
        return f"{base_description} {manager_name}'s team has been identified as a key stakeholder in improving the approval workflow."
      elif constraint_type == "skill_gaps":
        return f"{base_description} {manager_name}'s team has specialized knowledge that could be leveraged to address current skill gaps."
      elif constraint_type == "process_issues":
        return f"{base_description} {manager_name} can provide valuable insight into process optimization opportunities."
      elif constraint_type == "communication_problems":
        return f"{base_description} Improving communication with {manager_name}'s team will help reduce misalignment."
    
    return base_description
