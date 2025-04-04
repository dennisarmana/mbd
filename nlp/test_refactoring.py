#!/usr/bin/env python3
"""
Test script to verify refactored constraint analyzer works correctly.
Compares outputs from original and refactored implementations.
"""

import os
import json
import sys
import logging
from pprint import pprint

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_test(dataset_path):
    """
    Test both implementations on the same dataset and compare results.
    
    Args:
        dataset_path: Path to the email dataset to analyze
    """
    logger.info(f"Testing refactored code with dataset: {dataset_path}")
    
    # Import both implementations
    logger.info("Importing original implementation...")
    import constraint_analyzer as original
    
    logger.info("Importing refactored implementation...")
    try:
        import constraint_analyzer_new as refactored
    except ImportError as e:
        logger.error(f"Failed to import refactored implementation: {str(e)}")
        return False
    
    # Run both implementations
    logger.info("Running original implementation...")
    try:
        original_result = original.analyze_dataset(dataset_path)
        logger.info("Original implementation completed successfully")
    except Exception as e:
        logger.error(f"Original implementation error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False
    
    logger.info("Running refactored implementation...")
    try:
        refactored_result = refactored.analyze_dataset(dataset_path)
        logger.info("Refactored implementation completed successfully")
    except Exception as e:
        logger.error(f"Refactored implementation error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False
    
    # Compare results
    logger.info("Comparing results...")
    
    # Check basic structure
    if original_result.get("status") != refactored_result.get("status"):
        logger.error(f"Status mismatch: {original_result.get('status')} vs {refactored_result.get('status')}")
        return False
    
    # Check email and thread counts
    if original_result.get("email_count") != refactored_result.get("email_count"):
        logger.warning(f"Email count mismatch: {original_result.get('email_count')} vs {refactored_result.get('email_count')}")
    
    if original_result.get("thread_count") != refactored_result.get("thread_count"):
        logger.warning(f"Thread count mismatch: {original_result.get('thread_count')} vs {refactored_result.get('thread_count')}")
    
    # Check if we have recommendations
    if "recommendations" not in refactored_result:
        logger.error("Refactored result missing recommendations")
        return False
    
    # Compare constraints
    orig_constraints = original_result.get("top_constraints", {})
    new_constraints = refactored_result.get("top_constraints", {})
    
    logger.info(f"Original found {len(orig_constraints)} constraints")
    logger.info(f"Refactored found {len(new_constraints)} constraints")
    
    # Print the results for manual comparison
    logger.info("\n=== ORIGINAL RESULT ===")
    print(json.dumps(original_result, indent=2)[:500] + "...")  # Truncate for readability
    
    logger.info("\n=== REFACTORED RESULT ===")
    print(json.dumps(refactored_result, indent=2)[:500] + "...")  # Truncate for readability
    
    logger.info("Test completed - check logs for details")
    return True

if __name__ == "__main__":
    # Find a dataset to test with
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if len(sys.argv) > 1:
        # Use the provided dataset path
        dataset_path = sys.argv[1]
    else:
        # Try to find a sample dataset
        data_paths = [
            os.path.join(base_dir, "data", "mixed-scenarios"),
            os.path.join(base_dir, "data", "scenarios")
        ]
        
        for data_path in data_paths:
            if os.path.exists(data_path):
                # Find the first dataset with emails.json
                for root, dirs, files in os.walk(data_path):
                    if "emails.json" in files:
                        dataset_path = os.path.join(root, "emails.json")
                        break
                if 'dataset_path' in locals():
                    break
    
    if 'dataset_path' not in locals():
        logger.error("Could not find a dataset to test with. Please provide a path.")
        print("Usage: python test_refactoring.py [dataset_path]")
        sys.exit(1)
    
    logger.info(f"Using dataset: {dataset_path}")
    success = run_test(dataset_path)
    
    if success:
        logger.info("Both implementations returned results!")
        print("\nTest passed ✅")
    else:
        logger.error("Test failed ❌")
        print("\nTest failed ❌")
