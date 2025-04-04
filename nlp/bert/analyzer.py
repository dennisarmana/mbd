"""
Core constraint analyzer functionality using BERT embeddings.
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np

from .models import BERTModelWrapper

class BaseAnalyzer:
    """
    Base class for BERT-based constraint analysis.
    """
    
    def __init__(self, model_name: str = "bert-base-uncased"):
        """
        Initialize base analyzer with BERT model.
        
        Args:
            model_name: Name of pretrained BERT model to use
        """
        self.logger = self._setup_logger()
        self.bert_model = BERTModelWrapper(model_name)
        
        # Initialize caches and mappings
        self.department_map = {}
        self.person_role_map = {}
        
    def _setup_logger(self) -> logging.Logger:
        """
        Setup logging for the analyzer.
        
        Returns:
            logging.Logger: Configured logger
        """
        logger = logging.getLogger("constraint_analyzer")
        logger.setLevel(logging.INFO)
        
        # Create console handler if no handlers exist
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
    
    def extract_embeddings(self, text: str) -> np.ndarray:
        """
        Extract BERT embeddings from text.
        
        Args:
            text: Input text to encode
            
        Returns:
            np.ndarray: BERT embeddings
        """
        return self.bert_model.extract_embeddings(text)
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for analysis.
        
        Args:
            text: Raw input text
            
        Returns:
            str: Preprocessed text
        """
        return self.bert_model.preprocess_text(text)
    
    def analyze_dataset(self, emails: List[Dict[str, Any]], 
                        company_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze a dataset of emails to identify organizational constraints.
        
        Args:
            emails: List of email dictionaries
            company_data: Optional company structure data
            
        Returns:
            Dict with constraint analysis results
        """
        # This method should be implemented by subclasses
        raise NotImplementedError("Subclasses must implement analyze_dataset method")
