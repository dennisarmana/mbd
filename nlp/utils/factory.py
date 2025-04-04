"""
Factory pattern implementation for BERT constraint analyzer components.

This module provides factory classes to create and configure analyzer components,
promoting loose coupling and easier testing.
"""

from typing import Dict, Any, Optional, Type

from ..bert.analyzer import BaseAnalyzer
from ..bert.models import BERTModelWrapper
from ..analysis.constraints import ConstraintIdentifier
from ..analysis.departments import DepartmentAnalyzer
from ..analysis.threads import ThreadAnalyzer
from ..recommendations.generators import RecommendationGenerator
from ..constraint_analyzer_new import ConstraintAnalyzer

class AnalyzerFactory:
  """
  Factory for creating and configuring analyzer components.
  
  This factory simplifies the creation and configuration of the constraint
  analyzer and its components, making it easier to customize behavior.
  """
  
  @staticmethod
  def create_analyzer(model_name: str = "bert-base-uncased",
                      config: Optional[Dict[str, Any]] = None) -> ConstraintAnalyzer:
    """
    Create a fully configured constraint analyzer.
    
    Args:
        model_name: Name of pretrained BERT model to use
        config: Optional configuration dictionary
        
    Returns:
        Configured ConstraintAnalyzer instance
    """
    # Create analyzer with specified model
    analyzer = ConstraintAnalyzer(model_name)
    
    # Apply any custom configuration
    if config:
      AnalyzerFactory._configure_analyzer(analyzer, config)
    
    return analyzer
  
  @staticmethod
  def _configure_analyzer(analyzer: ConstraintAnalyzer, 
                         config: Dict[str, Any]) -> None:
    """
    Apply custom configuration to analyzer components.
    
    Args:
        analyzer: ConstraintAnalyzer to configure
        config: Configuration dictionary
    """
    # Configure constraint identifier if needed
    if "constraint_keywords" in config:
      analyzer.constraint_identifier = ConstraintIdentifier()
      analyzer.constraint_identifier.constraint_keywords = config["constraint_keywords"]
    
    # Configure department analyzer if needed
    if "department_constraints" in config:
      analyzer.department_analyzer = DepartmentAnalyzer(
        department_constraints=config["department_constraints"]
      )
    
    # Additional configuration can be added here as needed
