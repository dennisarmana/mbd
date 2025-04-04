# Make Better Decisions (MBD) - Product Requirements Document

## 1. Executive Summary
Make Better Decisions (MBD) is a productivity tool designed to help employees identify and focus on their most impactful tasks through a simple chat interface. Using the Theory of Constraints methodology, MBD analyzes organizational data to identify bottlenecks and recommend high-impact next actions, helping teams achieve faster progress and better business outcomes.

## 2. Problem Statement
Organizations frequently suffer from misallocated effort, with employees working on tasks that don't address critical bottlenecks. This results in:
- Wasted resources on non-impactful work
- Project delays and missed deadlines
- Reduced organizational velocity
- Financial losses due to inefficient resource allocation

Research shows that employees spend up to 60% of their time on work that doesn't meaningfully contribute to organizational goals or address key constraints. This creates a significant opportunity cost for businesses.

## 3. Target Users
- All individuals within a team or company, regardless of role or position

## 4. Solution Overview
MBD provides an advisory system through a conversational interface that reasons about and recommends the most impactful next tasks for employees. By analyzing organizational data through the lens of the Theory of Constraints, MBD helps users understand bottlenecks, align with priorities, and focus on work that will unblock critical paths and accelerate progress.

## 5. User Journey
1. User accesses the MBD chat interface
2. User selects their department and name from dropdown menus
3. User asks MBD what they should work on next
4. MBD suggests the most impactful task based on organizational constraints
5. User and MBD engage in a dialogue to refine the suggestion if needed
6. User rates the suggestion quality (1-5 stars)
7. User proceeds to work on the suggested task

## 6. Key Features

### 6.1 Chat Interface (Alpha)
- Simple, clean text-based interface
- Department and name selection dropdowns
- No authentication required for alpha (to be added later)
- Support for natural language queries about task prioritization
- Ability to refine suggestions through conversation

### 6.2 Task Recommendation Engine
- Suggests highest-impact tasks based on Theory of Constraints
- Considers role-specific responsibilities
- Allows for user pushback and refinement
- Explains the reasoning behind recommendations
- Learns from user feedback ratings

### 6.3 Data Ingestion & Analysis
- Initial data source: Mock email chains
- BERT-based analysis to extract structured company data:
  - Projects and their statuses
  - Dependencies between tasks
  - Team member responsibilities
  - Communication patterns
  - Critical deadlines

### 6.4 Privacy & Content Filtering
- LLM-based sentiment analysis to flag personal content
- Four-model consensus approach to identify sensitive content
- Automatic filtering of personal communications (e.g., HR issues, personal matters)
- Admin review interface for uncertain content
- Feedback loop to train the filtering models

## 7. Technical Architecture

### 7.1 Frontend
- Web-based chat interface
- Responsive design for desktop and mobile
- Simple dropdown selectors for department and user

### 7.2 Backend
- Email ingestion system
- BERT model for structured data extraction
- A single LLM powering the chat interface and task recommendation engine based on Theory of Constraints
- Simple database for storing essential data (optimized for hackathon implementation)
- User feedback storage and analysis

### 7.3 Data Sources
- Alpha: Mock email chains only
- Future: Google Drive integration, CRM systems, project management tools

## 8. Privacy & Security
- Four separate LLMs for content filtering and sentiment analysis
- Automatic filtering of personal communications like HR issues or personal matters
- Human review process for edge cases through admin interface
- Feedback loop to train the filtering models
- Data storage compliant with relevant regulations
- Clear user consent process for data analysis

## 9. Success Metrics

### 9.1 User Satisfaction
- 95% of chat suggestions rated 4 or higher by users
- User retention and engagement metrics

### 9.2 System Performance
- 95% accuracy in automatically filtering sensitive emails
- Response time under 2 seconds for recommendations

### 9.3 Business Impact
- Reduction in project delays
- Improvement in team velocity
- Positive ROI based on time saved

## 10. Implementation Considerations
- Focus on simplicity for hackathon implementation
- Prioritize core recommendation functionality
- Minimize dependencies where possible
- Use straightforward data structures
- Consider using mock data for initial testing

## 11. Open Questions & Risks
- How will we measure the actual impact of task recommendations?
- How will we handle conflicting priorities across departments?
- What is the minimum data required for meaningful recommendations?
- How will we address potential resistance to task prioritization?

## 12. Appendix
- Theory of Constraints primer
- Email filtering technical specifications
- User research findings