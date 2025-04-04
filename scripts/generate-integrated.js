/**
 * Integrated Email Dataset Generator
 * 
 * Generates email datasets with both business communications
 * and personal emails with sensitive content.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');
const { generateDataset } = require('../data/utils/generator');

// Import the personal emails template data directly
const personalTemplates = {
  affairs: {
    subjects: [
      "Tonight?", 
      "Can we meet later?",
      "Missing you",
      "Last night",
      "Need to see you"
    ],
    bodies: [
      "I can't stop thinking about {time}. When can I see you again? " +
      "I know we need to be careful around {colleague}.",
      
      "I miss you. It's getting harder to pretend nothing's happening when " +
      "we're in meetings together. {time} was amazing though.",
      
      "Are you free tonight? I told {household_member} I have to work late " +
      "on the {project} project. We could meet at {location}.",
      
      "We need to be more careful. I think {colleague} suspects something. " +
      "Maybe we should cool things off for a while? This is getting risky."
    ]
  },
  
  jobSearches: {
    subjects: [
      "Re: Your application",
      "Interview scheduled",
      "CV received",
      "Follow-up on your interest",
      "Next steps in the process"
    ],
    bodies: [
      "Thank you for your application to {company}. Your background in " +
      "{skill} is impressive. Are you available for an interview on {date}?",
      
      "I've reviewed your resume and would like to schedule a call to " +
      "discuss the {role} position at {company}. Your experience at " +
      "{current_company} sounds relevant.",
      
      "Just following up on our conversation about the {role} role. " +
      "The salary range would be {salary_range}, which I hope addresses " +
      "your concerns about your current compensation.",
      
      "I need to discreetly update my resume. Could you review it when you " +
      "have a moment? I'm particularly interested in highlighting my work " +
      "on {project} before I send it out."
    ]
  },
  
  disputes: {
    subjects: [
      "We need to talk",
      "About last night",
      "This isn't working",
      "Please call me",
      "Can't believe you said that"
    ],
    bodies: [
      "I can't believe you embarrassed me in front of {person} last night. " +
      "We need to talk about this when I get home.",
      
      "The kids were asking why you didn't come home again. I don't know " +
      "what to tell them anymore. This is affecting everyone.",
      
      "I spoke with {lawyer} today. I don't want to do this, but you're " +
      "not giving me much choice here. Please think about what's at stake.",
      
      "I've been looking at our {finances} and I'm really concerned. " +
      "We can't keep spending like this. We need to sit down and make a " +
      "budget that works."
    ]
  },
  
  financial: {
    subjects: [
      "Overdue payment notice",
      "Your account status",
      "Urgent: Financial matter",
      "Loan application status",
      "Payment arrangement"
    ],
    bodies: [
      "This is your final notice for the outstanding balance of ${amount}. " +
      "Please make payment within 5 days to avoid further action.",
      
      "Your mortgage payment of ${amount} is now {days} days late. " +
      "Please contact us immediately to discuss payment options.",
      
      "I've been looking into consolidating our debts. With the " +
      "{expense} and {expense2}, we're paying too much in interest. " +
      "I think we should consider using our {asset} to pay this down.",
      
      "I'm worried about making ends meet this month. The unexpected " +
      "{expense} has really set us back, and I don't think I can cover " +
      "both that and the {bill} bill."
    ]
  }
};

// Helper function to personalize template content
function personalize(template, context) {
  let text = template;
  
  // Replace all placeholders with context values
  Object.keys(context).forEach(key => {
    const placeholder = `{${key}}`;
    while (text.includes(placeholder)) {
      text = text.replace(placeholder, context[key]);
    }
  });
  
  return text;
}

// Generate context for personal emails
function generateContext(company) {
  return {
    time: faker.helpers.arrayElement([
      'yesterday', 'last night', 'our last meeting', 'Tuesday'
    ]),
    location: faker.helpers.arrayElement([
      'the usual place', 'my place', 'that hotel downtown', 
      'the conference room after hours'
    ]),
    project: faker.helpers.arrayElement([
      'Q2 Marketing', 'Website Redesign', 'Product Launch', 'Annual Report'
    ]),
    household_member: faker.helpers.arrayElement([
      'my spouse', 'my partner', 'my roommate', 'my family'
    ]),
    colleague: faker.helpers.arrayElement(
      company.persons.slice(0, 5).map(p => p.name)
    ),
    company: faker.company.name(),
    role: faker.person.jobTitle(),
    current_company: company.name,
    skill: faker.helpers.arrayElement([
      'marketing', 'development', 'leadership', 'project management'
    ]),
    date: faker.date.future().toLocaleDateString(),
    salary_range: `$${faker.number.int({min: 8, max: 20})}0,000-$${faker.number.int({min: 10, max: 25})}0,000`,
    person: faker.person.fullName(),
    lawyer: `${faker.person.lastName()}, Esq.`,
    finances: faker.helpers.arrayElement([
      'credit card debt', 'monthly expenses', 'mortgage payments', 'investments'
    ]),
    amount: faker.number.int({ min: 1000, max: 9999 }),
    days: faker.number.int({ min: 15, max: 90 }),
    expense: faker.helpers.arrayElement([
      'car repair', 'medical bill', 'home renovation', 'travel expenses'
    ]),
    expense2: faker.helpers.arrayElement([
      'student loans', 'credit cards', 'mortgage', 'personal loan'
    ]),
    asset: faker.helpers.arrayElement([
      'savings', '401k', 'home equity', 'investment portfolio'
    ]),
    bill: faker.helpers.arrayElement([
      'utility', 'car', 'insurance', 'tuition'
    ])
  };
}

// Generate a personal email
function generatePersonalEmail(category, sender, recipient, context, options = {}) {
  const template = personalTemplates[category];
  if (!template) return null;
  
  const subject = faker.helpers.arrayElement(template.subjects);
  const body = personalize(
    faker.helpers.arrayElement(template.bodies),
    context
  );
  
  return {
    id: options.id || uuidv4(),
    thread_id: options.threadId || uuidv4(),
    from: sender.id,
    to: [recipient.id],
    cc: [],
    timestamp: options.timestamp || new Date().toISOString(),
    subject: subject,
    body: body,
    metadata: {
      personal: true,
      category: category,
      sensitive: true
    }
  };
}

// Main function to generate a mixed dataset
function generateMixedDataset(scenario, options, personalOptions) {
  // First, generate a standard dataset
  const standardDataset = generateDataset(scenario, options);
  
  // If personal emails are not enabled, return the standard dataset
  if (!personalOptions.enabled) {
    return standardDataset;
  }
  
  const company = standardDataset.raw.company;
  const businessEmails = standardDataset.raw.emails;
  const businessThreads = standardDataset.raw.threads;
  
  // Calculate number of personal emails to create
  const personalThreadCount = Math.min(
    personalOptions.maxThreads || 5,
    Math.max(
      personalOptions.minThreads || 1,
      Math.floor(businessThreads.length * personalOptions.frequency)
    )
  );
  
  console.log(`Adding ${personalThreadCount} personal email threads`);
  
  // Generate personal threads and emails
  const personalThreads = [];
  const personalEmails = [];
  
  // Determine how many of each category to create
  const categoryTypes = personalOptions.categories || 
    ['affairs', 'jobSearches', 'disputes', 'financial'];
  
  // Distribute threads across categories
  for (let i = 0; i < personalThreadCount; i++) {
    const category = categoryTypes[i % categoryTypes.length];
    
    // Select random participants
    const employees = company.persons;
    if (employees.length < 2) continue;
    
    const sender = faker.helpers.arrayElement(employees);
    const recipients = employees.filter(e => e.id !== sender.id);
    const recipient = faker.helpers.arrayElement(recipients);
    
    // Create a personal thread
    const threadId = `personal_thread_${i}`;
    const threadContext = generateContext(company);
    
    // Generate 1-3 emails in this thread
    const emailCount = faker.number.int({ min: 1, max: 3 });
    
    // Create thread object
    const thread = {
      id: threadId,
      subject: '', // Will be set from first email
      participants: [sender.id, recipient.id],
      start_time: null, // Will be set from first email
      end_time: null, // Will be set from last email
      email_ids: []
    };
    
    // Get appropriate time range for the emails
    const timestamps = businessEmails.map(e => new Date(e.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime;
    
    // Generate emails for this thread
    for (let e = 0; e < emailCount; e++) {
      // Alternate sender and recipient for replies
      const currentSender = e % 2 === 0 ? sender : recipient;
      const currentRecipient = e % 2 === 0 ? recipient : sender;
      
      // Calculate timestamp
      const emailTime = new Date(
        minTime + Math.random() * timeRange
      ).toISOString();
      
      // Set thread start time from first email
      if (e === 0) {
        thread.start_time = emailTime;
      }
      
      // Set thread end time from last email
      if (e === emailCount - 1) {
        thread.end_time = emailTime;
      }
      
      // Generate email
      const email = generatePersonalEmail(
        category,
        currentSender,
        currentRecipient,
        threadContext,
        {
          threadId: threadId,
          timestamp: emailTime
        }
      );
      
      // Set thread subject from first email
      if (e === 0) {
        thread.subject = email.subject;
      }
      
      // Add to collections
      personalEmails.push(email);
      thread.email_ids.push(email.id);
    }
    
    // Add thread to collection
    personalThreads.push(thread);
  }
  
  // Combine standard and personal datasets
  const combinedDataset = {
    raw: {
      company: company,
      emails: [...businessEmails, ...personalEmails],
      threads: [...businessThreads, ...personalThreads]
    },
    analysis: {
      scenario: standardDataset.analysis?.scenario || scenario,
      stats: {
        company_name: company.name,
        departments: company.departments.length,
        employees: company.persons.length,
        email_count: businessEmails.length + personalEmails.length,
        thread_count: businessThreads.length + personalThreads.length,
        personal_emails: {
          count: personalEmails.length,
          percentage: Math.round(
            personalEmails.length / (businessEmails.length + personalEmails.length) * 100
          )
        }
      }
    }
  };
  
  return combinedDataset;
}

// Scenario configurations
const scenarios = [
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
    description: 'Marketing and product teams have different understandings of launch dates',
    complexity_level: 2,
    key_issues: [
      'Misaligned expectations on feature completion',
      'Unclear communication about dependencies',
      'Different interpretations of "ready to launch"'
    ]
  },
  {
    id: 'feature_priority',
    name: 'Feature Priority Misalignment',
    description: 'Product and marketing teams disagree on which features to prioritize',
    complexity_level: 3,
    key_issues: [
      'Different understanding of user needs',
      'Conflicting departmental goals',
      'Lack of clear prioritization framework'
    ]
  }
];

// Get scenario ID from command line if provided
const scenarioId = process.argv[2] || 'marketing_campaign_interpretation';
const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0];

// Set personal email options (configurable "realism slider")
const personalOptions = {
  enabled: true,
  frequency: 0.10, // 10% personal emails
  minThreads: 2,
  maxThreads: 5,
  categories: ['affairs', 'jobSearches', 'disputes', 'financial']
};

console.log(`Generating mixed dataset for scenario: ${scenario.name}`);
console.log(`Including ${Math.round(personalOptions.frequency * 100)}% personal emails`);

// Generate the mixed dataset
const dataset = generateMixedDataset(
  scenario,
  {
    companyOptions: {
      name: `Acme${scenario.complexity_level}Corp`,
      domain: `acme${scenario.complexity_level}.com`,
      departmentCount: 4 + scenario.complexity_level,
      employeesPerDepartment: {
        min: 3 + scenario.complexity_level,
        max: 5 + scenario.complexity_level * 2
      }
    },
    emailOptions: {
      threadCount: 15 + scenario.complexity_level * 5,
      emailsPerThread: {
        min: 3,
        max: 5 + scenario.complexity_level
      },
      timeSpan: {
        start: new Date(`2025-0${scenario.complexity_level}-01`),
        end: new Date(`2025-0${scenario.complexity_level+2}-01`)
      }
    }
  },
  personalOptions
);

// Create output directory
const outputDir = path.join(
  __dirname,
  '..',
  'data',
  'mixed-scenarios',
  scenarioId
);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save dataset files
const files = [
  {
    name: 'emails.json',
    content: JSON.stringify(dataset, null, 2)
  },
  {
    name: 'metadata.json',
    content: JSON.stringify({
      scenario: scenario,
      generation_date: new Date().toISOString(),
      stats: dataset.analysis.stats,
      personal_emails: {
        enabled: personalOptions.enabled,
        frequency: personalOptions.frequency,
        categories: personalOptions.categories
      }
    }, null, 2)
  },
  {
    name: 'generation_config.json',
    content: JSON.stringify({
      scenario_id: scenario.id,
      complexity_level: scenario.complexity_level,
      personal_emails: personalOptions
    }, null, 2)
  }
];

// Write files
files.forEach(file => {
  fs.writeFileSync(
    path.join(outputDir, file.name),
    file.content
  );
  console.log(`Generated ${file.name}`);
});

// Extract statistics
const stats = dataset.analysis.stats;
const businessEmails = dataset.raw.emails.filter(
  e => !e.metadata || !e.metadata.personal
);
const personalEmails = dataset.raw.emails.filter(
  e => e.metadata && e.metadata.personal
);

// Print dataset statistics
console.log('\nDataset Statistics:');
console.log(`Total Emails: ${dataset.raw.emails.length}`);
console.log(`Business Emails: ${businessEmails.length}`);
console.log(`Personal Emails: ${personalEmails.length} (${
  Math.round(personalEmails.length / dataset.raw.emails.length * 100)
}%)`);
console.log(`Total Threads: ${dataset.raw.threads.length}`);
console.log(`Company: ${stats.company_name}`);
console.log(`Departments: ${stats.departments}`);
console.log(`Employees: ${stats.employees}`);

// Categorize personal emails by type
if (personalEmails.length > 0) {
  const categories = personalEmails.reduce((acc, email) => {
    const category = email.metadata.category || 'unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nPersonal Email Categories:');
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`- ${category}: ${count} emails`);
  });
  
  // Store reference to company for sample display
  const companyRef = dataset.raw.company;
  
  // Show a sample of each category
  console.log('\nSample Personal Emails:');
  
  ['affairs', 'jobSearches', 'disputes', 'financial'].forEach(category => {
    const sample = personalEmails.find(e => 
      e.metadata && e.metadata.category === category
    );
    
    if (sample) {
      const sender = companyRef.persons.find(p => p.id === sample.from);
      const recipient = companyRef.persons.find(p => 
        sample.to && sample.to.length > 0 && p.id === sample.to[0]
      );
      
      console.log(`\n[${category.toUpperCase()}]`);
      console.log(`From: ${sender ? sender.name : 'Unknown'}`);
      console.log(`To: ${recipient ? recipient.name : 'Unknown'}`);
      console.log(`Subject: ${sample.subject}`);
      console.log(`Preview: ${sample.body.substring(0, 100)}...`);
    }
  });
}

console.log('\nDataset generated successfully!');
console.log(`Files saved to: ${outputDir}`);
