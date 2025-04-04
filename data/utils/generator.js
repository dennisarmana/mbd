/**
 * Email Dataset Generator
 * 
 * Generates mock email datasets for miscommunication scenarios
 * according to the defined schema.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');
const { 
  enhanceEmailStructure, 
  enhanceSubject, 
  addLanguageVariations 
} = require('./emailEnhancer');
const personalEmails = require('./personalEmails');

/**
 * Generate a company with departments and employees
 * @param {Object} options - Configuration options
 * @returns {Object} Company structure with departments and persons
 */
function generateCompany(options = {}) {
  const {
    name = 'Acme Corporation',
    domain = 'acmecorp.com',
    departmentCount = 6,
    employeesPerDepartment = { min: 5, max: 15 }
  } = options;
  
  const departments = [];
  const persons = [];
  
  // Create departments
  const deptNames = [
    'Executive', 'Marketing', 'Product', 'Engineering', 
    'Design', 'Sales', 'Finance', 'HR', 'Support'
  ];
  
  for (let i = 0; i < Math.min(departmentCount, deptNames.length); i++) {
    departments.push({
      id: `dept_${i}`,
      name: deptNames[i],
      parent_department: i === 0 ? null : (Math.random() > 0.7 ? 'dept_0' : null)
    });
  }
  
  // Create persons for each department
  departments.forEach(dept => {
    const deptSize = faker.number.int({
      min: employeesPerDepartment.min,
      max: employeesPerDepartment.max
    });
    
    // Create a department head
    const headId = `person_${persons.length}`;
    persons.push({
      id: headId,
      name: faker.person.fullName(),
      email: faker.internet.email({ 
        firstName: faker.person.firstName(), 
        lastName: faker.person.lastName(), 
        provider: domain 
      }),
      department_id: dept.id,
      role: `${dept.name} Director`,
      boss_id: dept.parent_department ? `person_0` : null,
      communication_style: faker.helpers.arrayElement([
        'formal', 'casual', 'direct', 'verbose', 'technical', 'diplomatic'
      ])
    });
    
    // Create department employees
    for (let i = 1; i < deptSize; i++) {
      const roles = {
        'Marketing': ['Marketing Specialist', 'Campaign Manager', 'Content Creator'],
        'Product': ['Product Manager', 'Product Owner', 'Business Analyst'],
        'Engineering': ['Software Engineer', 'QA Engineer', 'DevOps Engineer'],
        'Design': ['UI Designer', 'UX Researcher', 'Visual Designer'],
        'Sales': ['Sales Representative', 'Account Manager', 'Sales Analyst'],
        'Finance': ['Financial Analyst', 'Accountant', 'Budget Manager'],
        'HR': ['HR Specialist', 'Recruiter', 'Benefits Administrator'],
        'Support': ['Support Specialist', 'Customer Success Manager', 'Help Desk']
      };
      
      const deptRoles = roles[dept.name] || ['Specialist', 'Analyst', 'Manager'];
      
      persons.push({
        id: `person_${persons.length}`,
        name: faker.person.fullName(),
        email: faker.internet.email({ 
          firstName: faker.person.firstName(), 
          lastName: faker.person.lastName(), 
          provider: domain 
        }),
        department_id: dept.id,
        role: faker.helpers.arrayElement(deptRoles),
        boss_id: headId,
        communication_style: faker.helpers.arrayElement([
          'formal', 'casual', 'direct', 'verbose', 'technical', 'diplomatic'
        ])
      });
    }
  });
  
  return {
    name,
    domain,
    departments,
    persons
  };
}

/**
 * Generate email threads based on a scenario and company data
 * @param {Object} scenario - Scenario configuration
 * @param {Object} company - Company data with persons
 * @param {Object} options - Generation options
 * @returns {Object} Generated emails and threads
 */
function generateEmails(scenario, company, options = {}) {
  const {
    threadCount = 15,
    emailsPerThread = { min: 3, max: 12 },
    timeSpan = {
      start: new Date('2025-01-01'),
      end: new Date('2025-02-01')
    },
    chanceOfCC = 0.4,
    maxCCRecipients = 3,
    personalEmailOptions = {
      enabled: false,
      frequency: 0.05,  // 5% of emails will be personal by default
      categories: ['affairs', 'jobSearches', 'domesticDisputes', 'financialIssues']
    }
  } = options;
  
  const emails = [];
  const threads = [];
  
  // Helper to get random person from a department
  const getPersonFromDept = (deptName) => {
    const dept = company.departments.find(d => d.name === deptName);
    if (!dept) return getRandomPerson();
    
    const deptPersons = company.persons.filter(p => p.department_id === dept.id);
    return deptPersons[Math.floor(Math.random() * deptPersons.length)];
  };
  
  // Helper to get a random person
  const getRandomPerson = () => {
    return company.persons[Math.floor(Math.random() * company.persons.length)];
  };
  
  // Create dedicated personal email threads (if enabled)
  if (personalEmailOptions.enabled) {
    const personalThreadCount = Math.floor(threadCount * personalEmailOptions.frequency);
    
    for (let pt = 0; pt < personalThreadCount; pt++) {
      const threadStartTime = new Date(
        timeSpan.start.getTime() + Math.random() * 
        (timeSpan.end.getTime() - timeSpan.start.getTime())
      );
      
      // Get two random employees for personal exchange
      const employeePair = personalEmails.getRandomEmployeePair(company);
      if (!employeePair) continue;
      
      const [sender, recipient] = employeePair;
      const participants = [sender, recipient];
      
      // Create a personal thread
      const threadId = `thread_personal_${pt}`;
      const personalEmailCount = faker.number.int({
        min: 1,
        max: 3 // Personal threads are typically shorter
      });
      
      const thread = {
        id: threadId,
        subject: '', // Will be filled with the first email's subject
        participants: participants.map(p => p.id),
        start_time: threadStartTime.toISOString(),
        end_time: null, // Will be set after emails are generated
        email_ids: [],
        summary: 'Personal communication',
        metadata: {
          personal: true
        }
      };
      
      // Generate personal emails for this thread
      let lastEmailTime = threadStartTime;
      let lastEmailId = null;
      
      for (let e = 0; e < personalEmailCount; e++) {
        // Switch sender and recipient for replies
        const currentSender = e % 2 === 0 ? sender : recipient;
        const currentRecipient = e % 2 === 0 ? recipient : sender;
        
        // Calculate time increment
        const timeIncrement = Math.floor(
          (24 * 60 * 60 * 1000) * (0.5 + Math.random() * 2) // 0.5 to 2.5 days
        );
        
        lastEmailTime = new Date(lastEmailTime.getTime() + timeIncrement);
        
        // Generate personal email
        const personalEmail = personalEmails.generatePersonalEmail(
          currentSender,
          currentRecipient,
          company,
          {
            threadId,
            timestamp: lastEmailTime.toISOString()
          }
        );
        
        // Update thread subject with the first email's subject
        if (e === 0) {
          thread.subject = personalEmail.body.split('\n')[0];
          if (thread.subject.length > 50) {
            thread.subject = thread.subject.substring(0, 47) + '...';
          }
        }
        
        // Add metadata
        personalEmail.metadata = {
          ...personalEmail.metadata,
          sentiment: faker.helpers.arrayElement([
            'confidential', 'urgent', 'personal', 'sensitive'
          ]),
          importance: faker.number.int({ min: 3, max: 5 })
        };
        
        emails.push(personalEmail);
        thread.email_ids.push(personalEmail.id);
        lastEmailId = personalEmail.id;
      }
      
      // Set thread end time
      thread.end_time = lastEmailTime.toISOString();
      threads.push(thread);
    }
  }
  
  // Create regular business threads
  for (let t = 0; t < threadCount; t++) {
    const threadStartTime = new Date(
      timeSpan.start.getTime() + Math.random() * 
      (timeSpan.end.getTime() - timeSpan.start.getTime())
    );
    
    // Get participants based on scenario requirements
    let participants = [];
    
    if (scenario.complexity_level <= 3) {
      // For simpler scenarios, fewer departments involved
      if (scenario.id === 'marketing_campaign_interpretation') {
        participants = [
          getPersonFromDept('Marketing'),
          getPersonFromDept('Marketing'),
          getPersonFromDept('Marketing')
        ];
      } else if (scenario.id === 'product_launch_timeline') {
        participants = [
          getPersonFromDept('Marketing'),
          getPersonFromDept('Marketing'),
          getPersonFromDept('Product'),
          getPersonFromDept('Product')
        ];
      } else {
        participants = [
          getPersonFromDept('Product'),
          getPersonFromDept('Marketing'),
          getPersonFromDept('Engineering')
        ];
      }
    } else if (scenario.complexity_level <= 6) {
      // Mid-complexity scenarios involve more departments
      participants = [
        getPersonFromDept('Marketing'),
        getPersonFromDept('Product'),
        getPersonFromDept('Finance'),
        getPersonFromDept('Design'),
        getPersonFromDept('Engineering')
      ];
    } else {
      // Complex scenarios involve many departments and executives
      participants = [
        getPersonFromDept('Executive'),
        getPersonFromDept('Marketing'),
        getPersonFromDept('Product'),
        getPersonFromDept('Finance'),
        getPersonFromDept('Design'),
        getPersonFromDept('Engineering'),
        getPersonFromDept('Sales')
      ];
    }
    
    // Deduplicate participants
    participants = [...new Map(participants.map(p => [p.id, p])).values()];
    
    // Create a thread
    const threadId = `thread_${t}`;
    const subjectPrefixes = {
      'marketing_campaign_interpretation': ['Campaign ', 'Marketing ', 'Launch '],
      'product_launch_timeline': ['Product launch ', 'Release ', 'Launch timeline '],
      'feature_priority': ['Feature ', 'Priority for ', 'Requirements for '],
      'resource_allocation': ['Resource ', 'Budget ', 'Allocation for '],
      'design_feasibility': ['Design ', 'UI for ', 'Implementation of '],
      'cross_department_messaging': ['Messaging for ', 'Communication about ', 'Alignment on '],
      'budget_allocation': ['Budget for ', 'Q1 finances ', 'Approval for '],
      'technical_language': ['Technical ', 'Specs for ', 'Requirements doc '],
      'global_campaign': ['Global ', 'Regional ', 'International '],
      'long_term_strategy': ['Strategy ', 'Roadmap ', 'Vision for ']
    };
    
    const prefixes = subjectPrefixes[scenario.id] || ['Discussion: ', 'RE: ', 'Update: '];
    const subject = `${faker.helpers.arrayElement(prefixes)}${faker.company.buzzNoun()} ${faker.company.buzzAdjective()}`;
    
    // Calculate thread duration based on complexity and email count
    const emailCount = faker.number.int({
      min: emailsPerThread.min,
      max: emailsPerThread.max
    });
    
    const threadDuration = Math.floor(
      (timeSpan.end.getTime() - threadStartTime.getTime()) * 0.8
    );
    
    const threadEndTime = new Date(
      threadStartTime.getTime() + threadDuration
    );
    
    const thread = {
      id: threadId,
      subject,
      participants: participants.map(p => p.id),
      start_time: threadStartTime.toISOString(),
      end_time: threadEndTime.toISOString(),
      email_ids: [],
      summary: `Discussion about ${subject.toLowerCase()}`
    };
    
    // Generate emails for this thread
    let lastEmailTime = threadStartTime;
    let lastEmailId = null;
    
    for (let e = 0; e < emailCount; e++) {
      // Determine sender (first email from initiator, later ones from participants)
      const senderIndex = e === 0 ? 0 : Math.floor(Math.random() * participants.length);
      const sender = participants[senderIndex];
      
      // Calculate time for this email (ensures chronological order)
      const timeIncrement = Math.floor(
        threadDuration / (emailCount + 1) * (0.5 + Math.random())
      );
      
      lastEmailTime = new Date(lastEmailTime.getTime() + timeIncrement);
      
      // Determine recipients (everyone except sender)
      const primaryRecipients = participants
        .filter(p => p.id !== sender.id)
        .slice(0, 2)
        .map(p => p.id);
      
      // Randomly add CC recipients
      let ccRecipients = [];
      if (Math.random() < chanceOfCC) {
        ccRecipients = participants
          .filter(p => p.id !== sender.id && !primaryRecipients.includes(p.id))
          .slice(0, Math.floor(Math.random() * maxCCRecipients))
          .map(p => p.id);
      }
      
      // Generate body content based on the scenario and communication style
      const bodyContent = generateEmailBody({
        sender,
        scenario,
        isFirstEmail: e === 0,
        threadSubject: subject,
        participants,
        emailIndex: e,
        totalEmails: emailCount
      });
      
      // Randomly inject personal emails into business threads (if enabled)
      let email;
      if (personalEmailOptions.enabled && 
          personalEmails.shouldInjectPersonalEmail(personalEmailOptions) && 
          e > 0) { // Only inject in reply emails, not thread starters
          
        // Choose a random recipient to have a personal exchange with the sender
        const personalRecipient = participants.find(p => p.id !== sender.id);
        if (personalRecipient) {
          // Generate personal email
          email = personalEmails.generatePersonalEmail(
            sender,
            personalRecipient,
            company,
            {
              threadId,
              timestamp: lastEmailTime.toISOString()
            }
          );
          
          // Add business email metadata
          email.metadata = {
            ...email.metadata,
            sentiment: 'confidential',
            importance: faker.number.int({ min: 3, max: 5 }),
            accidentally_sent: true, // Flag that this was meant to be private
            key_points: [],
            follow_up_expected: e < emailCount - 1
          };
        }
      }
      
      // Create a regular business email if we didn't create a personal one
      if (!email) {
        const emailId = `email_${emails.length}`;
        
        // Get sender and recipient details
        const senderPerson = sender;
        const recipientPerson = company.persons.find(p => p.id === primaryRecipients[0]) || {
          name: 'Team Member',
          title: 'Employee'
        };
        
        // Determine formality based on organizational hierarchy
        let formality = 'casual';
        if (e === 0) {
          // First emails are more formal
          formality = 'formal';
        } else if (sender.level < 3) {
          // Executives tend to be more formal
          formality = Math.random() < 0.7 ? 'formal' : 'casual';
        }
        
        // Determine sentiment based on email metadata
        const sentiment = faker.helpers.arrayElement([
          'neutral', 'positive', 'negative', 'urgent', 'confused', 'frustrated'
        ]);
        
        let emotionType = null;
        switch (sentiment) {
          case 'positive':
            emotionType = 'excitement';
            break;
          case 'negative':
          case 'frustrated':
            emotionType = 'anger';
            break;
          case 'urgent':
            emotionType = 'anxiety';
            break;
          case 'confused':
            emotionType = 'anxiety';
            break;
        }
        
        // Enhance the body content with realistic structure
        const enhancedBody = enhanceEmailStructure(bodyContent, {
          type: 'business',
          formality: formality,
          emotionType: emotionType,
          senderName: senderPerson.name,
          senderTitle: senderPerson.title || 'Employee',
          senderDepartment: senderPerson.department || 'Department',
          senderCompany: company.name,
          senderEmail: senderPerson.email || `${senderPerson.name.split(' ')[0].toLowerCase()}@${company.domain}`,
          recipientName: recipientPerson.name,
          addBusinessPhrases: true,
          addTypos: Math.random() < 0.15, // 15% chance of typos in business emails
          urgent: sentiment === 'urgent',
          replyFormat: e > 0, // Replies after the first email
          addSignature: Math.random() < 0.8 // 80% chance of having signature in business email
        });
        
        // Enhance the subject with business context
        const baseSubject = e === 0 ? subject : `RE: ${subject}`;
        const enhancedSubject = enhanceSubject(baseSubject, {
          type: 'business',
          urgent: sentiment === 'urgent',
          replyFormat: e > 0,
          addPrefixes: e === 0 && Math.random() < 0.5
        });
        
        // Create enhanced email object
        email = {
          id: emailId,
          thread_id: threadId,
          from: sender.id,
          to: primaryRecipients,
          cc: ccRecipients,
          reply_to: e === 0 ? null : lastEmailId,
          timestamp: lastEmailTime.toISOString(),
          subject: enhancedSubject,
          body: enhancedBody,
          attachments: [],
          metadata: {
            sentiment: sentiment,
            key_points: generateKeyPoints(scenario, e),
            miscommunication_elements: e > 0 ? generateMiscommunicationElements(scenario) : [],
            follow_up_expected: e < emailCount - 1,
            importance: faker.number.int({ min: 1, max: 5 })
          }
        };
      }
      
      emails.push(email);
      thread.email_ids.push(email.id);
      lastEmailId = email.id;
    }
    
    threads.push(thread);
  }
  
  return { emails, threads };
}

/**
 * Generate email body content based on scenario and context
 * @param {Object} options - Configuration options
 * @returns {String} Generated email body
 */
function generateEmailBody(options) {
  const {
    sender,
    scenario,
    isFirstEmail,
    threadSubject,
    participants,
    emailIndex,
    totalEmails
  } = options;
  
  let body = '';
  
  // Add greeting
  const recipient = participants.find(p => p.id !== sender.id);
  body += `Hi ${recipient ? recipient.name.split(' ')[0] : 'team'},\n\n`;
  
  // First email introduces the topic
  if (isFirstEmail) {
    body += generateInitialEmailContent(scenario, threadSubject);
  } else {
    // Reply emails either clarify, question, or misinterpret
    const responseTypes = ['clarification', 'question', 'misinterpretation', 'agreement'];
    const responseType = faker.helpers.arrayElement(responseTypes);
    
    body += generateResponseEmailContent(scenario, responseType, emailIndex, totalEmails);
  }
  
  // Add signature based on communication style
  body += '\n\n';
  
  const signatures = {
    'formal': `Best regards,\n${sender.name}\n${sender.role}\n${sender.email}`,
    'casual': `Cheers,\n${sender.name}`,
    'direct': `Thanks,\n${sender.name}`,
    'verbose': `Thank you for your attention to this matter,\n${sender.name}\n${sender.role}\n${sender.email}`,
    'technical': `Regards,\n${sender.name}\n${sender.role}`,
    'diplomatic': `Kind regards,\n${sender.name}\n${sender.role}`
  };
  
  body += signatures[sender.communication_style] || `Thanks,\n${sender.name}`;
  
  return body;
}

/**
 * Generate initial email content for starting a thread
 * @param {Object} scenario - Scenario data
 * @param {String} subject - Email subject
 * @returns {String} Email body content
 */
function generateInitialEmailContent(scenario, subject) {
  const templates = {
    'marketing_campaign_interpretation': [
      `I wanted to discuss our upcoming ${subject.split(' ').pop()} campaign. I think we should focus on social media and content marketing. Let me know your thoughts on this approach.`,
      `We need to finalize our marketing strategy for the ${subject.split(' ').pop()} campaign. My understanding is that we're prioritizing digital channels. Can we align on the key messages?`
    ],
    'product_launch_timeline': [
      `I'm planning the communications for our product launch. We should be ready to announce on the 15th. Does that timeline work for the product team?`,
      `Based on our roadmap, I've scheduled the product launch for next month. Can you confirm that the development will be completed by then?`
    ]
    // Add more templates for other scenarios as needed
  };
  
  const defaultTemplates = [
    `I wanted to bring up ${subject} for discussion. We need to make some decisions soon. What are your thoughts on this?`,
    `Can we discuss ${subject} in more detail? I think there are some aspects we need to clarify before moving forward.`
  ];
  
  const contentTemplates = templates[scenario.id] || defaultTemplates;
  return faker.helpers.arrayElement(contentTemplates);
}

/**
 * Generate response email content based on type and scenario
 * @param {Object} scenario - Scenario data
 * @param {String} responseType - Type of response
 * @param {Number} emailIndex - Index of email in thread
 * @param {Number} totalEmails - Total emails in thread
 * @returns {String} Email body content
 */
function generateResponseEmailContent(scenario, responseType, emailIndex, totalEmails) {
  // Create different responses based on type and progress in thread
  if (responseType === 'clarification') {
    return `I think I need to clarify a few points from our previous discussion:\n\n` +
      `1. When I mentioned the timeline, I was referring to the initial phase only.\n` +
      `2. We still need approval from the leadership team.\n` +
      `3. The budget allocation isn't finalized yet.\n\n` +
      `Let me know if this helps clear things up.`;
  } else if (responseType === 'question') {
    return `I have a few questions about what you mentioned:\n\n` +
      `- What exactly do you mean by "ready to launch"?\n` +
      `- Who is responsible for the final approval?\n` +
      `- Have we considered the impact on other departments?\n\n` +
      `I think we need more clarity on these points before proceeding.`;
  } else if (responseType === 'misinterpretation') {
    return `Based on what you said, I've already started working on the implementation. ` +
      `I've allocated resources based on a June launch date and informed the team. ` +
      `The design team is prioritizing this work as we discussed, and I've requested ` +
      `budget approval based on our conversation.`;
  } else {
    return `I agree with the direction. Let's proceed as discussed and touch base next week ` +
      `to ensure we're on track. I'll update the relevant stakeholders on our progress.`;
  }
}

/**
 * Generate key points for an email
 * @param {Object} scenario - Scenario data
 * @param {Number} emailIndex - Index of email in thread
 * @returns {Array} Array of key points
 */
function generateKeyPoints(scenario, emailIndex) {
  const baseKeyPoints = {
    'marketing_campaign_interpretation': [
      'Campaign objectives', 'Target audience', 'Marketing channels',
      'Budget allocation', 'Success metrics', 'Timeline'
    ],
    'product_launch_timeline': [
      'Launch date', 'Feature completion', 'Marketing preparation',
      'Customer communication', 'Press release', 'Internal training'
    ]
    // Add more for other scenarios
  };
  
  const points = baseKeyPoints[scenario.id] || [
    'Project timeline', 'Resource allocation', 'Stakeholder communication',
    'Success criteria', 'Risk assessment', 'Decision authority'
  ];
  
  // Select 2-3 random points
  const count = 2 + Math.floor(Math.random() * 2);
  const selectedPoints = [];
  
  while (selectedPoints.length < count && points.length > 0) {
    const index = Math.floor(Math.random() * points.length);
    selectedPoints.push(points[index]);
    points.splice(index, 1);
  }
  
  return selectedPoints;
}

/**
 * Generate miscommunication elements specific to the scenario
 * @param {Object} scenario - Scenario data
 * @returns {Array} Array of miscommunication elements
 */
function generateMiscommunicationElements(scenario) {
  const miscommunicationTypes = {
    'marketing_campaign_interpretation': [
      'Different understanding of target audience',
      'Conflicting campaign objectives',
      'Misaligned success metrics',
      'Different interpretation of messaging strategy'
    ],
    'product_launch_timeline': [
      'Different understanding of "ready to launch"',
      'Miscommunication about dependencies',
      'Unstated assumptions about approval process',
      'Different expectations about feature completeness'
    ]
    // Add more for other scenarios
  };
  
  const elements = miscommunicationTypes[scenario.id] || [
    'Ambiguous language',
    'Unstated assumptions',
    'Missing context',
    'Conflicting priorities',
    'Technical vs. business perspective'
  ];
  
  // Select 1-2 random elements
  const count = 1 + Math.floor(Math.random() * 2);
  const selected = [];
  
  while (selected.length < count && elements.length > 0) {
    const index = Math.floor(Math.random() * elements.length);
    selected.push(elements[index]);
    elements.splice(index, 1);
  }
  
  return selected;
}

/**
 * Generate a complete dataset for a scenario
 * @param {Object} scenarioConfig - Configuration for the scenario
 * @param {Object} options - Additional generation options
 * @returns {Object} Complete dataset with separate raw and analysis data
 */
function generateDataset(scenarioConfig, options = {}) {
  const {
    id,
    name, 
    description,
    complexity_level,
    key_issues = []
  } = scenarioConfig;
  
  const {
    companyOptions = {},
    emailOptions = {}
  } = options;
  
  // Create scenario metadata
  const scenario = {
    id,
    name,
    description,
    complexity_level,
    key_issues,
    time_span: {
      start_date: emailOptions.timeSpan?.start.toISOString() || 
        new Date('2025-01-01').toISOString(),
      end_date: emailOptions.timeSpan?.end.toISOString() || 
        new Date('2025-02-01').toISOString()
    }
  };
  
  // Generate company structure
  const company = generateCompany(options.companyOptions || {});
  
  // Generate emails for this scenario
  const { emails, threads } = generateEmails(scenarioConfig, company, options.emailOptions || {});
  
  // Calculate stats
  const stats = {
    company_name: company.name,
    departments: company.departments.length,
    employees: company.persons.length,
    email_count: emails.length,
    thread_count: threads.length,
    time_span: {
      start_date: emailOptions.timeSpan?.start.toISOString() || 
        new Date('2025-01-01').toISOString(),
      end_date: emailOptions.timeSpan?.end.toISOString() || 
        new Date('2025-02-01').toISOString()
    }
  };
  
  // Create a separate "raw" version of the data without analytical metadata
  const rawEmails = emails.map(email => ({
    id: email.id,
    thread_id: email.thread_id,
    from: email.from,
    to: email.to,
    cc: email.cc || [],
    reply_to: email.reply_to,
    timestamp: email.timestamp,
    subject: email.subject,
    body: email.body,
    attachments: email.attachments || []
  }));
  
  const rawThreads = threads.map(thread => ({
    id: thread.id,
    subject: thread.subject,
    participants: thread.participants,
    start_time: thread.start_time,
    end_time: thread.end_time,
    email_ids: thread.email_ids
  }));
  
  // Full dataset with both raw data and analysis metadata
  return {
    // Data for analysis (raw emails only)
    raw: {
      company: {
        name: company.name,
        domain: company.domain,
        departments: company.departments,
        persons: company.persons
      },
      emails: rawEmails,
      threads: rawThreads
    },
    
    // Ground truth with metadata for evaluation
    analysis: {
      scenario,
      company,
      emails,
      threads,
      miscommunication_analysis: {
        scenario_complexity: complexity_level,
        key_issues: key_issues,
        affected_departments: [...new Set(emails
          .filter(e => e.metadata?.miscommunication_elements?.length > 0)
          .flatMap(e => {
            const person = company.persons.find(p => p.id === e.from);
            return person ? [person.department_id] : [];
          }))]
          .map(deptId => company.departments.find(d => d.id === deptId)?.name)
          .filter(Boolean)
      }
    }
  };
}

/**
 * Main function to generate all scenarios
 * @param {Object} options - Generation options
 */
function generateAllScenarios(options = {}) {
  const {
    outputDir = path.join(__dirname, '..', 'scenarios'),
    scenarioConfigs = defaultScenarioConfigs
  } = options;
  
  // Make sure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Generate each scenario
  scenarioConfigs.forEach((config, index) => {
    const paddedIndex = String(index + 1).padStart(2, '0');
    const scenarioDir = path.join(outputDir, `${paddedIndex}_${config.id}`);
    
    fs.mkdirSync(scenarioDir, { recursive: true });
    
    // Generate data for this scenario
    const dataset = generateDataset(config, {
      companyOptions: {
        departmentCount: 3 + Math.min(config.complexity_level, 6),
        employeesPerDepartment: {
          min: 3 + config.complexity_level,
          max: 5 + config.complexity_level * 2
        }
      },
      emailOptions: {
        timeSpan: {
          start: new Date(`2025-${index + 1}-01`),
          end: new Date(`2025-${index + 1}-15`)
        }
      }
    });
    
    // Write raw email data (what the AI will analyze)
    fs.writeFileSync(
      path.join(scenarioDir, 'emails.json'),
      JSON.stringify(dataset.raw, null, 2)
    );
    
    // Write ground truth with full analysis metadata (for evaluation)
    fs.writeFileSync(
      path.join(scenarioDir, 'ground_truth.json'),
      JSON.stringify(dataset.analysis, null, 2)
    );
    
    // Generate a metadata file with scenario description
    // Only include basic info, not the answers
    fs.writeFileSync(
      path.join(scenarioDir, 'metadata.json'),
      JSON.stringify({
        id: config.id,
        name: config.name,
        description: config.description,
        email_count: dataset.raw.emails.length,
        thread_count: dataset.raw.threads.length,
        department_count: dataset.raw.company.departments.length,
        person_count: dataset.raw.company.persons.length,
        time_period: {
          start: dataset.analysis.scenario.time_span.start_date,
          end: dataset.analysis.scenario.time_span.end_date
        }
      }, null, 2)
    );
    
    // Generate configuration used
    fs.writeFileSync(
      path.join(scenarioDir, 'generation_config.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        scenario_config: {
          id: config.id,
          name: config.name,
          description: config.description
          // Omit complexity_level and key_issues
        },
        generator_options: {
          company: {
            departmentCount: 3 + Math.min(config.complexity_level, 6),
            employeesPerDepartment: {
              min: 3 + config.complexity_level,
              max: 5 + config.complexity_level * 2
            }
          },
          emails: {
            threadCount: 10 * config.complexity_level,
            emailsPerThread: {
              min: 3 + config.complexity_level,
              max: 5 + (config.complexity_level * 2)
            }
          }
        }
      }, null, 2)
    );
  });
}

// Default scenario configurations
const defaultScenarioConfigs = [
  {
    id: 'marketing_campaign_interpretation',
    name: 'Marketing Campaign Interpretation',
    description: 'Different team members have varied understandings of campaign goals',
    complexity_level: 1,
    key_issues: [
      'Ambiguous campaign objectives',
      'Unclear success metrics',
      'Different interpretations of target audience'
    ]
  },
  {
    id: 'product_launch_timeline',
    name: 'Product Launch Timeline',
    description: 'Marketing and product teams disagree on the launch date',
    complexity_level: 2,
    key_issues: [
      'Different understanding of "ready to launch"',
      'Dependency tracking issues',
      'Miscommunication about approval processes'
    ]
  },
  {
    id: 'feature_priority',
    name: 'Feature Priority Misalignment',
    description: 'Product team sees a feature as optional, marketing sees it as crucial',
    complexity_level: 3,
    key_issues: [
      'Different interpretations of market requirements',
      'Conflicting priorities between departments',
      'Miscommunication about feature importance'
    ]
  },
  {
    id: 'resource_allocation',
    name: 'Resource Allocation Conflict',
    description: 'Marketing, product, and finance have different resource priorities',
    complexity_level: 4,
    key_issues: [
      'Budget allocation conflicts',
      'Staffing priority disagreements',
      'Timeline constraints interpretation'
    ]
  },
  {
    id: 'design_feasibility',
    name: 'Design Feasibility Issues',
    description: 'Design team creates visuals that engineering can\'t implement',
    complexity_level: 5,
    key_issues: [
      'Technical constraint misunderstandings',
      'Different interpretations of feasibility',
      'Communication barriers between creative and technical teams'
    ]
  },
  {
    id: 'cross_department_messaging',
    name: 'Cross-Departmental Messaging',
    description: 'Marketing, sales, and support have inconsistent product messaging',
    complexity_level: 6,
    key_issues: [
      'Inconsistent product descriptions',
      'Different value propositions communicated',
      'Technical details inconsistency'
    ]
  },
  {
    id: 'budget_allocation',
    name: 'Budget Allocation Dispute',
    description: 'Marketing plans a campaign assuming budget approval, finance disagrees',
    complexity_level: 7,
    key_issues: [
      'Approval process miscommunication',
      'Budget requirement misunderstandings',
      'ROI calculation disagreements'
    ]
  },
  {
    id: 'technical_language',
    name: 'Technical Language Barrier',
    description: 'Marketing and engineering struggle to communicate due to technical jargon',
    complexity_level: 8,
    key_issues: [
      'Technical jargon misunderstandings',
      'Requirement specification issues',
      'Different interpretations of technical limitations'
    ]
  },
  {
    id: 'global_campaign',
    name: 'Global Campaign Misinterpretation',
    description: 'Different regional teams interpret the campaign strategy differently',
    complexity_level: 9,
    key_issues: [
      'Cultural interpretation differences',
      'Regional market priority conflicts',
      'Global vs local strategy misalignment'
    ]
  },
  {
    id: 'long_term_strategy',
    name: 'Long-Term Strategy Alignment',
    description: 'Executives, marketing, product, and finance teams disagreement on strategy',
    complexity_level: 10,
    key_issues: [
      'Vision misalignment between departments',
      'Different interpretations of company direction',
      'Strategic priority conflicts',
      'Resource allocation for long-term initiatives'
    ]
  }
];

module.exports = {
  generateCompany,
  generateEmails,
  generateDataset,
  generateAllScenarios,
  defaultScenarioConfigs
};
