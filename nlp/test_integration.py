#!/usr/bin/env python3
"""
BERT Integration Test Script
---------------------------
Tests the connection between email datasets and BERT analysis
by directly attempting to analyze a sample dataset and logging
each step of the process.
"""

import os
import json
import logging
import sys
from data_processor import EmailDataProcessor
from constraint_analyzer import ConstraintAnalyzer, analyze_dataset

# Set up detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("integration_test.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

def test_dataset_loading(dataset_path):
    """Test loading a dataset with the EmailDataProcessor."""
    logging.info(f"===== Testing dataset loading for: {dataset_path} =====")
    
    # Try to process the dataset
    processor = EmailDataProcessor(dataset_path)
    success = processor.load_data()
    
    if success:
        logging.info(f"✅ Successfully loaded dataset with {len(processor.emails)} emails")
        logging.info(f"First few emails: {json.dumps(processor.emails[:2], indent=2)[:500]}...")
        
        # Check company data
        if processor.company_data:
            logging.info(f"Company data found: {json.dumps(processor.company_data, indent=2)[:500]}...")
        else:
            logging.warning("❌ No company data found in dataset")
            
        return processor
    else:
        logging.error("❌ Failed to load dataset")
        return None

def test_bert_analysis(processor):
    """Test BERT analysis on the loaded dataset."""
    logging.info("===== Testing BERT analysis =====")
    
    if not processor:
        logging.error("❌ No processor provided, skipping analysis")
        return None
    
    # Prepare BERT inputs
    logging.info("Preparing BERT inputs...")
    bert_inputs = processor.prepare_bert_inputs()
    logging.info(f"✅ Prepared {len(bert_inputs)} inputs for BERT")
    logging.info(f"Sample input: {json.dumps(bert_inputs[0], indent=2)}")
    
    # Initialize analyzer
    logging.info("Initializing BERT analyzer...")
    analyzer = ConstraintAnalyzer()
    
    # Analyze constraints
    logging.info("Identifying constraints...")
    constraints = analyzer.identify_constraints(bert_inputs)
    logging.info(f"✅ Identified constraints: {constraints}")
    
    # Analyze department patterns
    logging.info("Analyzing department patterns...")
    department_insights = analyzer.analyze_department_patterns(bert_inputs)
    logging.info(f"✅ Department insights: {department_insights}")
    
    # Generate recommendations
    logging.info("Generating recommendations...")
    recommendations = analyzer.generate_recommendations(constraints, department_insights)
    logging.info(f"✅ Generated {len(recommendations)} recommendations")
    
    return {
        "constraints": constraints,
        "department_insights": department_insights,
        "recommendations": recommendations
    }

def test_full_analysis_pipeline(dataset_path):
    """Test the complete analysis pipeline as used by the API."""
    logging.info(f"===== Testing complete analysis pipeline for: {dataset_path} =====")
    
    try:
        # This is the same function used by the API
        result = analyze_dataset(dataset_path)
        logging.info(f"✅ Full analysis completed: {json.dumps(result, indent=2)}")
        return result
    except Exception as e:
        logging.error(f"❌ Error in analysis pipeline: {str(e)}", exc_info=True)
        return None

if __name__ == "__main__":
    # Get dataset path from command line or use default
    if len(sys.argv) > 1:
        dataset_path = sys.argv[1]
    else:
        # Default to the feature priority dataset
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(base_dir, 'data', 'mixed-scenarios', 'feature_priority', 'emails.json')
    
    logging.info(f"Starting integration test with dataset: {dataset_path}")
    
    # Test dataset loading
    processor = test_dataset_loading(dataset_path)
    
    # Test BERT analysis if dataset loaded successfully
    if processor:
        analysis_result = test_bert_analysis(processor)
    
    # Test the full pipeline as used by the API
    pipeline_result = test_full_analysis_pipeline(dataset_path)
    
    logging.info("Integration test completed")
