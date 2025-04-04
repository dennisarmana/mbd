---

kanban-plugin: board

---

## Backlog

- [ ] Implement Google Drive integration
- [ ] Add CRM system integration
- [ ] Integrate with project management tools
- [ ] Develop mobile app version
- [ ] Create visualization of organizational constraints
- [ ] Implement user authentication system
- [ ] Build admin dashboard for system monitoring
- [ ] Develop analytics for measuring impact of recommendations
- [ ] Create onboarding tutorial
- [ ] Add team-level view of constraints and tasks
- [ ] Implement export functionality for reports
- [ ] Develop API for third-party integrations
- [ ] Create notification system for urgent tasks
- [ ] Add calendar integration for scheduling recommended tasks
- [ ] Implement automated follow-up for task completion
- [ ] Add email.txt files first (from, to, cc, timestamp, subject and body), then slowly increase complexity by adding meeting.txt files, mock crm.txt, files etc.


## Dev todos

- [ ] Design database schema for storing organizational data
- [x] Create mock email dataset for initial development
- [ ] Design responsive UI for chat interface
- [ ] Create department and user selection dropdowns
- [ ] ~~Implement BERT model for data extraction from emails~~
- [ ] Develop Theory of Constraints analysis algorithm
- [ ] Create content filtering system with four-model consensus
- [ ] Design user feedback mechanism
- [ ] Document API specifications
- [ ] Set up project environment and dependencies
- [ ] Create system architecture documentation
- [ ] Define metrics collection methodology
- [ ] Design admin review interface for uncertain content
- [ ] Initial research on BERT implementation for Theory of Constraints


## Dennis todos

- [ ] Make analysis results more actionable:
	  - [ ] Extract key individuals from email datasets
	  - [ ] Identify specific projects/initiatives mentioned in bottleneck threads
	  - [ ] Connect constraints to specific people and projects
	  - [ ] Generate natural language recommendations with specific next steps
- [ ] Enhance BERT constraint identification:
	  - [ ] Train BERT model with sample email threads for better context understanding
	  - [ ] Improve keyword extraction for organizational bottlenecks
	  - [ ] Add weighting factors for communication patterns
	  - [ ] Refine recommendation generation based on identified constraints
- [ ] Fix dataset compatibility issues:
	  - [ ] Add logging to track dataset loading and processing
	  - [ ] Implement structure validation for datasets
	  - [ ] Create dataset normalization for different formats
	  - [ ] Add error handling for malformed datasets
- [ ] Generate additional scenario datasets:
	  - [ ] Interface with email generator from Python
	  - [ ] Create scenario definition system
	  - [ ] Generate cross-department miscommunication scenario
	  - [ ] Generate resource allocation conflict scenario
	  - [ ] Develop validation suite for new scenarios


## Doing (WIP 2)


## Done

- [x] Refactor constraint_analyzer.py into modular architecture:
	  - [x] Roll back to last working version of constraint_analyzer.py
	  - [x] Create module structure (bert/, analysis/, recommendations/, utils/)
	  - [x] Extract analysis logic to dedicated modules (~50-75 lines each)
	  - [x] Move recommendation generation to separate modules
	  - [x] Implement factory pattern for cleaner initialization
	  - [x] Reduce main file to ~150-200 lines using composition
	  - [x] Reapply "make analysis results more actionable" changes to refactored code

- [x] Integrate Email Generator with BERT Analyzer (MVP Integration Plan):
	  - [x] Fix dataset loading in BERT API to properly read email JSON files
	  - [x] Create data mapping layer to standardize email format for analysis
	  - [x] Add proper error handling for file access issues
	  - [x] Implement direct filesystem paths to access real datasets
- [ ] System Architecture Understanding:
	  - [x] Email Generator: React/Node.js app at /web/email-generator-ui
	  - [x] Email Datasets: JSON files in /data directory with mixed-scenarios
	  - [x] BERT Analyzer: Python implementation in /nlp directory
	  - [x] Web Interface: Simple Flask-served frontend in /nlp/static
- [x] Fix UI/UX issues in web interface:
	  - [x] Resolve dropdown population with real departments/users
	  - [x] Implement functional chat responses using BERT analysis
	  - [x] Add visualization of constraint analysis results
	  - [x] Create seamless connection between UI and backend API
- [x] Connect Email Generator with BERT for constraint identification:
	  - [x] Investigation: Located existing email datasets in data/mixed-scenarios and data/scenarios
	  - [x] Identified integration challenges: datasets are gitignored and need custom access
	  - [x] Update BERT data processor to handle email generator JSON structure
	  - [x] Map company structure from datasets to BERT constraint analyzer
	  - [x] Create data flow pipeline: Email Generator → JSON Files → BERT Analyzer → UI
	  - [x] Extract constraints and generate actionable recommendations
- [x] Breaking down product requirements into tasks (this kanban board)
- [x] Create a BERT-based Theory of Constraints analyzer (60-min MVP Plan):
	  - [x] Set up Python environment with BERT dependencies
	  - [x] Create data processor to prepare emails for BERT model
	  - [x] Implement BERT model for constraint extraction
	  - [x] Build simple API to connect BERT analysis to web interface
	  - [x] Generate actionable recommendations from BERT insights
- [x] Improve realism of generated email content:
	- [x] Enhance natural language structure and flow
		- [x] Add proper email greetings, closings, and signatures
		- [x] Incorporate occasional typos and informal language
		- [x] Vary sentence length and structure for authenticity
	- [x] Implement richer personalization
		- [x] Reference company-specific projects and products
		- [x] Include more contextually relevant employee details
		- [x] Add timeline-consistent dates and references
	- [x] Improve emotional content authenticity
		- [x] Make affairs more emotionally charged (tension, secrecy, guilt)
		- [x] Add anxiety and excitement to job search emails
		- [x] Enhance realism of personal conflicts (anger, concern)
	- [x] Create cohesive mini-storylines across email threads
		- [x] Add specific references to past communications
		- [x] Develop consistent narratives within each personal thread
- [x] Add personal emails with sensitive content:
	- [x] Implement generator patterns for personal/non-work emails
	- [x] Create templates for various sensitive topics:
		- [x] Illicit affairs and personal relationships
		- [x] Job searches and applications to other companies
		- [x] Personal conflicts and domestic disputes
		- [x] Financial concerns and debt issues
	- [x] Add detection logic to randomly inject these emails into generated datasets
	- [x] Implement configurable "realism slider" to control sensitive content amount
	- [x] Create personas with recurring personal issues across email threads
	- [x] Integrate personal emails into main scenario generator
- [ ] Create a web form for email scenario generation:
	- [x] Set up React-based single-page application with clean UI
	- [x] Create configuration panels for scenario parameters
	- [x] Implement auto-generation of company structure (no manual entry needed)
	- [x] Add dataset volume controls with presets for different complexity levels
	- [x] Build real-time preview of sample emails before full generation
	- [x] Fix bugs and implement missing features:
		- [x] Enhance preview with realistic subject and body text reflecting scenario context
		- [x] Add dataset browser with pagination for reviewing generated data
		- [x] Implement working download functionality for generated datasets
	- [ ] Connect frontend to existing Node.js generator backend
	- [x] Fix TypeScript errors and bugs in UI components
- [ ] Generate email scenarios in increasing complexity to test the system
- [ ] Created PRD document
- [ ] Setting up the project repository
- [ ] Created GitHub repository
- [ ] Initialized development environment
- [x] Create mock email chains in JSON format with massive volumes:
	- Use 10 scenarios of increasing complexity (from team to company-wide misalignment)
	- Structure: JSON format with thread IDs, metadata, and full email fields
	- Volume: 150-200 emails for early scenarios, 250-400 for middle scenarios, 500-1000+ for complex scenarios
	- Generate programmatically with templates and variations
	- File structure: Each scenario in its own folder with emails.json, metadata.json, and generation_config.json
	- Separation of raw data (for AI analysis) from ground truth (for evaluation)




%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[false,false,false]}
```
%%