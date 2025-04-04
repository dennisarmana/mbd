"""
BERT model wrapper and embedding functionality.
"""

import torch
import numpy as np
from typing import List, Dict, Any
from transformers import BertTokenizer, BertModel

class BERTModelWrapper:
    """
    Wrapper for BERT model with convenient embedding extraction.
    """
    
    def __init__(self, model_name: str = "bert-base-uncased"):
        """
        Initialize BERT model and tokenizer.
        
        Args:
            model_name: Name of pretrained BERT model to use
        """
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.model = BertModel.from_pretrained(model_name)
        self.model.eval()  # Set to evaluation mode
    
    def extract_embeddings(self, text: str) -> np.ndarray:
        """
        Extract BERT embeddings from text.
        
        Args:
            text: Input text to encode
            
        Returns:
            np.ndarray: BERT embeddings
        """
        # Tokenize input text
        inputs = self.tokenizer(
            text, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=512
        )
        
        # Extract embeddings from BERT model
        with torch.no_grad():
            outputs = self.model(**inputs)
            
        # Use [CLS] token embedding as text representation
        embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        return embeddings[0]  # Return single embedding vector
    
    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for BERT embedding extraction.
        
        Args:
            text: Raw input text
            
        Returns:
            str: Preprocessed text
        """
        # Simple preprocessing for now - can be expanded
        if not text:
            return ""
            
        # Limit to 512 tokens (BERT limit)
        tokens = self.tokenizer.tokenize(text)
        if len(tokens) > 512:
            tokens = tokens[:512]
            text = self.tokenizer.convert_tokens_to_string(tokens)
            
        return text
