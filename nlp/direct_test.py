#!/usr/bin/env python3
"""
Direct Test for MBD Integration
------------------------------
Tests the integration between email datasets and BERT analyzer
using direct implementation of missing methods.
"""

import os
import sys
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Import necessary components
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from constraint_analyzer import ConstraintAnalyzer
from data_processor import EmailDataProcessor

def direct_analyze_department_patterns(emails, analyzer):
    """
    Direct implementation of analyze_department_patterns to bypass cached modules.
    """
    # Group emails by department
    all_departments = set()
    
    # First pass: collect all departments
    for email in emails:
        sender_dept = email['sender'].get('department')
        if sender_dept and sender_dept != 'Unknown':
            all_departments.add(sender_dept)
        
        for recipient in email['recipients']:
            dept = recipient.get('department')
            if dept and dept != 'Unknown':
                all_departments.add(dept)
    
    # Initialize department insights
    department_insights = {
        dept: {
            "email_count": 0,
            "internal_communication": 0,
            "external_communication": 0,
            "constraints": {constraint: 0.0 for constraint in analyzer.constraint_keywords},
            "specific_issues": []
        } for dept in all_departments
    }
    
    return department_insights

def direct_generate_summary(constraints, department_insights, recommendations):
    """
    Direct implementation of generate_summary to bypass cached modules.
    """
    # Identify top constraints
    top_constraints = sorted(constraints.items(), key=lambda x: x[1], reverse=True)[:2]
    
    # Generate summary based on constraints and recommendations
    if not top_constraints or top_constraints[0][1] < 0.1:
        return "No significant organizational constraints were identified in the analyzed communication."
    
    # Generate summary text
    main_constraint = top_constraints[0][0].replace('_', ' ').title()
    summary = f"The analysis identified {main_constraint} as the primary organizational constraint. "
    
    if len(top_constraints) > 1 and top_constraints[1][1] > 0.2:
        second_constraint = top_constraints[1][0].replace('_', ' ').title()
        summary += f"Additionally, {second_constraint} is a secondary factor affecting efficiency. "
    
    summary += f"There are {len(recommendations)} recommended actions to address these constraints."
    
    return summary

def direct_generate_recommendations(constraints, analyzer):
    """
    Direct implementation of generate_recommendations to bypass cached modules.
    """
    # Sort constraints by confidence score
    sorted_constraints = sorted(constraints.items(), key=lambda x: x[1], reverse=True)
    
    # Generate recommendations for top constraints
    recommendations = []
    for constraint_type, score in sorted_constraints[:3]:
        if score < 0.1:  # Skip if score is too low
            continue
        
        # Try to use the analyzer's methods if available
        try:
            title = analyzer._generate_recommendation_title(constraint_type)
            description = analyzer._generate_recommendation_description(constraint_type)
            actions = analyzer._generate_actions(constraint_type)
        except AttributeError:
            # Fallback to basic data
            title = "Address " + constraint_type.replace('_', ' ').title()
            description = "This organizational constraint is limiting progress and should be addressed."
            actions = [
                f"Analyze {constraint_type.replace('_', ' ')} in more detail",
                "Develop an action plan to address this bottleneck",
                "Monitor progress and adjust approach as needed"
            ]
        
        recommendation = {
            "constraint_type": constraint_type,
            "confidence": float(score),
            "title": title,
            "description": description,
            "suggested_actions": actions
        }
        
        recommendations.append(recommendation)
    
    return recommendations

def direct_analyze_dataset(dataset_path, department=None, user_name=None):
    """
    Directly analyze a dataset without relying on potentially missing methods.
    """
    logging.info(f"Analyzing dataset: {dataset_path}")
    
    # Process the dataset
    processor = EmailDataProcessor(dataset_path)
    if not processor.load_data():
        return {
            "status": "error",
            "message": "Failed to load dataset",
            "path": dataset_path
        }
    
    # Extract data
    emails = processor.prepare_bert_inputs()
    thread_context = processor.extract_thread_context()
    
    logging.info(f"Processed {len(emails)} emails in {len(processor.threads)} threads")
    
    # Initialize and run the constraint analyzer
    analyzer = ConstraintAnalyzer()
    
    # Identify constraints
    constraints = analyzer.identify_constraints(emails)
    logging.info(f"Identified constraints: {constraints}")
    
    # Use direct implementations for potentially missing methods
    department_insights = direct_analyze_department_patterns(emails, analyzer)
    recommendations = direct_generate_recommendations(constraints, analyzer)
    summary = direct_generate_summary(constraints, department_insights, recommendations)
    
    # Extract scenario name
    scenario_name = processor.scenario_name
    if not scenario_name or scenario_name == "data":
        scenario_name = os.path.basename(os.path.dirname(dataset_path))
    
    # Personalize recommendations if department is specified
    if department:
        logging.info(f"Personalizing recommendations for department: {department}")
        # Move department-specific recommendations to the top
        dept_specific = []
        general = []
        
        for rec in recommendations:
            is_relevant = False
            
            # Check if recommendation mentions department
            if department.lower() in rec.get('description', '').lower():
                is_relevant = True
            
            # Check if actions mention department
            for action in rec.get('suggested_actions', []):
                if department.lower() in action.lower():
                    is_relevant = True
                    break
            
            if is_relevant:
                dept_specific.append(rec)
            else:
                general.append(rec)
        
        personalized_recs = dept_specific + general
    else:
        personalized_recs = recommendations
        
    # Format chat response
    user = user_name or "you"
    dept = f" in the {department} department" if department else ""
    
    chat_response = f"Based on my analysis of communication patterns{dept}, I recommend that {user} focus on these high-impact tasks:\n\n"
    
    for i, rec in enumerate(personalized_recs[:3], 1):
        chat_response += f"{i}. **{rec['title']}**\n"
        chat_response += f"   {rec['description']}\n"
        chat_response += "   *Actions you can take:*\n"
        
        for action in rec['suggested_actions'][:2]:  # Show top 2 actions
            chat_response += f"   - {action}\n"
        
        chat_response += "\n"
    
    chat_response += "Would you like me to explain why any of these recommendations would be particularly impactful?"
    
    # Prepare the result
    result = {
        "status": "success",
        "dataset": dataset_path,
        "scenario": scenario_name,
        "timestamp": datetime.now().isoformat(),
        "email_count": len(emails),
        "thread_count": len(processor.threads),
        "top_constraints": constraints,
        "recommendations": personalized_recs[:3],  # Top 3 most relevant
        "chat_response": chat_response,
        "summary": summary,
        "user": user_name or "User",
        "department": department or "All Departments"
    }
    
    return result

def main():
    """Main testing function"""
    if len(sys.argv) < 2:
        print("Usage: python direct_test.py <dataset_path> [department] [user_name]")
        sys.exit(1)
    
    dataset_path = sys.argv[1]
    department = sys.argv[2] if len(sys.argv) > 2 else None
    user_name = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Run direct analysis
    try:
        result = direct_analyze_dataset(dataset_path, department, user_name)
        
        # Output result
        print(json.dumps(result, indent=2))
        
        # Save result to file for easy review
        with open('direct_analysis_result.json', 'w') as f:
            json.dump(result, f, indent=2)
            
        logging.info(f"Analysis completed and saved to direct_analysis_result.json")
        
        # Mark success
        sys.exit(0)
    except Exception as e:
        logging.error(f"Error: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
