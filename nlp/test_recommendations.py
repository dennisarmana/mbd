#!/usr/bin/env python3
"""
Test script for the enhanced recommendation generator module.
"""

import json
from pprint import pprint
from recommendations.generators import RecommendationGenerator
from utils.data_helpers import extract_key_people, extract_key_projects
from data_processor import EmailDataProcessor

def test_personalized_recommendations():
    """
    Test the personalized recommendation generation with a sample dataset.
    """
    print("Testing personalized recommendations")
    
    # Sample test data
    constraint_scores = {
        "deadline_issues": 0.2,
        "approval_bottlenecks": 0.6,
        "resource_constraints": 0.8,
        "skill_gaps": 0.3,
        "process_issues": 0.4,
        "communication_problems": 0.5
    }
    
    # Sample key people
    key_people = {
        "managers": ["Alex Johnson", "Sarah Williams"],
        "team_leads": ["Mike Chen", "Lisa Patel"],
        "approvers": ["Robert Davis", "Jennifer Lee"],
        "resource_managers": ["David Wilson", "Maria Rodriguez"],
        "process_owners": ["James Taylor", "Emma Brown"]
    }
    
    # Sample key projects
    key_projects = ["Website Redesign", "Mobile App Launch", "Data Migration", "Cloud Infrastructure"]
    
    # Sample thread analysis
    thread_analysis = {
        "thread_1": {
            "email_count": 8,
            "participants": ["Alex Johnson", "Mike Chen", "Lisa Patel"],
            "avg_response_time": 12.5,
            "topics": ["resource", "timeline", "budget"]
        },
        "thread_2": {
            "email_count": 5,
            "participants": ["Sarah Williams", "James Taylor"],
            "avg_response_time": 24.8,
            "topics": ["approval", "timeline"]
        }
    }
    
    # Initialize recommendation generator
    generator = RecommendationGenerator()
    
    # Generate recommendations
    recommendations = generator.generate_recommendations(
        constraint_scores,
        thread_analysis,
        key_people,
        key_projects
    )
    
    # Print the recommendations
    print(f"\nGenerated {len(recommendations)} recommendations:")
    for i, rec in enumerate(recommendations, 1):
        print(f"\n{i}. {rec['title']}")
        print(f"   Priority: {rec['priority']}")
        print(f"   Description: {rec['description']}")
        print("   Actions:")
        for action in rec['actions']:
            print(f"   - {action}")
        
        if 'relevant_people' in rec:
            print("   Relevant People:")
            for role, people in rec['relevant_people'].items():
                print(f"   - {role.title()}: {', '.join(people)}")
        
        if 'relevant_projects' in rec:
            print("   Relevant Projects:")
            for project in rec['relevant_projects']:
                print(f"   - {project}")

def test_with_real_dataset(dataset_path):
    """
    Test recommendation generation with a real dataset.
    
    Args:
        dataset_path: Path to a dataset file
    """
    print(f"\nTesting with real dataset: {dataset_path}")
    
    # Process the dataset
    processor = EmailDataProcessor(dataset_path)
    if not processor.load_data():
        print("Failed to load dataset")
        return
    
    # Prepare emails for analysis
    emails = processor.prepare_bert_inputs()
    print(f"Loaded {len(emails)} emails")
    
    # Extract key people and projects
    key_people = extract_key_people(emails)
    key_projects = extract_key_projects(emails)
    
    print(f"Identified {sum(len(v) for v in key_people.values())} key people across {len(key_people)} roles")
    print(f"Identified {len(key_projects)} key projects")
    
    # Sample constraint scores (would normally come from constraint analysis)
    constraint_scores = {
        "deadline_issues": 0.3,
        "approval_bottlenecks": 0.7,
        "resource_constraints": 0.6,
        "skill_gaps": 0.2,
        "process_issues": 0.4,
        "communication_problems": 0.5
    }
    
    # Create sample thread analysis
    thread_analysis = {}
    for i, thread in enumerate(processor.threads[:5]):
        thread_id = thread.get('id', f"thread_{i}")
        thread_analysis[thread_id] = {
            "email_count": len(thread.get('email_ids', [])),
            "participants": thread.get('participants', [])[:5],
            "avg_response_time": 12 + i * 4  # Sample response time
        }
    
    # Initialize recommendation generator
    generator = RecommendationGenerator()
    
    # Generate recommendations
    recommendations = generator.generate_recommendations(
        constraint_scores,
        thread_analysis,
        key_people,
        key_projects
    )
    
    # Print the recommendations
    print(f"\nGenerated {len(recommendations)} recommendations:")
    for i, rec in enumerate(recommendations, 1):
        print(f"\n{i}. {rec['title']}")
        print(f"   Priority: {rec['priority']}")
        print(f"   Description: {rec['description']}")
        print("   Actions:")
        for action in rec['actions']:
            print(f"   - {action}")
        
        if 'relevant_people' in rec:
            print("   Relevant People:")
            for role, people in rec['relevant_people'].items():
                print(f"   - {role.title()}: {', '.join(people)}")
        
        if 'relevant_projects' in rec:
            print("   Relevant Projects:")
            for project in rec['relevant_projects']:
                print(f"   - {project}")

if __name__ == "__main__":
    import sys
    import os
    
    # Run test with sample data
    test_personalized_recommendations()
    
    # Find and test with a real dataset if available
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if len(sys.argv) > 1:
        # Use provided dataset path
        test_with_real_dataset(sys.argv[1])
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
                        test_with_real_dataset(os.path.join(root, "emails.json"))
                        break
                if 'test_with_real_dataset' in locals():
                    break
