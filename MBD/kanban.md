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
- [ ] Implement BERT model for data extraction from emails
- [ ] Develop Theory of Constraints analysis algorithm
- [ ] Create content filtering system with four-model consensus
- [ ] Design user feedback mechanism
- [ ] Document API specifications
- [ ] Set up project environment and dependencies
- [ ] Create system architecture documentation
- [ ] Define metrics collection methodology
- [ ] Design admin review interface for uncertain content
- [ ] Initial research on Theory of Constraints implementation


## Content creation todos



## Doing (WIP 2)

- [ ] Breaking down product requirements into tasks (this kanban board)
- [ ] Improve realism of generated email content:
	- [ ] Enhance natural language structure and flow
		- [ ] Add proper email greetings, closings, and signatures
		- [ ] Incorporate occasional typos and informal language
		- [ ] Vary sentence length and structure for authenticity
	- [ ] Implement richer personalization
		- [ ] Reference company-specific projects and products
		- [ ] Include more contextually relevant employee details
		- [ ] Add timeline-consistent dates and references
	- [ ] Improve emotional content authenticity
		- [ ] Make affairs more emotionally charged (tension, secrecy, guilt)
		- [ ] Add anxiety and excitement to job search emails
		- [ ] Enhance realism of personal conflicts (anger, concern)
	- [ ] Create cohesive mini-storylines across email threads
		- [ ] Add specific references to past communications
		- [ ] Develop consistent narratives within each personal thread


## Done

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