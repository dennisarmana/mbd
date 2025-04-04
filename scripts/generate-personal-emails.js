/**
 * Personal Emails Generator Script
 * 
 * Generates email datasets with personal/sensitive content including:
 * - Illicit affairs
 * - Job applications to other companies
 * - Personal conflicts and domestic disputes
 * - Financial problems
 * 
 * This script creates a standalone dataset that can be used independently
 * or merged with existing scenario datasets.
 */

const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const { generateCompany } = require('../data/utils/generator');

// Template content for various personal email types
const templates = {
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

// Generate personalization context
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

// Generate a personal email
function generatePersonalEmail(category, sender, recipient, context, options = {}) {
  const template = templates[category];
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

// Generate personal email threads
function generatePersonalThreads(company, options = {}) {
  const {
    affairCount = 3,
    jobSearchCount = 2,
    disputeCount = 2,
    financialCount = 3,
    timeSpan = {
      start: new Date('2025-01-01'),
      end: new Date('2025-03-01')
    }
  } = options;
  
  const threads = [];
  const emails = [];
  
  // Helper function to generate a thread of personal emails
  function createPersonalThread(category, count) {
    const threadId = uuidv4();
    
    // Select random people for this thread
    const allEmployees = company.persons.slice();
    const sender = faker.helpers.arrayElement(allEmployees);
    
    // Remove sender from potential recipients
    const recipientPool = allEmployees.filter(p => p.id !== sender.id);
    const recipient = faker.helpers.arrayElement(recipientPool);
    
    // Generate context for personalization
    const threadContext = generateContext(company);
    
    // Create thread metadata
    const thread = {
      id: threadId,
      subject: faker.helpers.arrayElement(templates[category].subjects),
      participants: [sender.id, recipient.id],
      emails: []
    };
    
    // Generate emails for this thread
    let lastEmailTime = new Date(
      timeSpan.start.getTime() + Math.random() * 
      (timeSpan.end.getTime() - timeSpan.start.getTime())
    );
    
    // Generate 1-3 emails in this thread
    const emailCount = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < emailCount; i++) {
      // Alternate sender and recipient for replies
      const currentSender = i % 2 === 0 ? sender : recipient;
      const currentRecipient = i % 2 === 0 ? recipient : sender;
      
      // Add some time between emails
      if (i > 0) {
        lastEmailTime = new Date(
          lastEmailTime.getTime() + 
          faker.number.int({ min: 1, max: 48 }) * 60 * 60 * 1000
        );
      }
      
      // Generate the email
      const email = generatePersonalEmail(
        category,
        currentSender,
        currentRecipient,
        threadContext,
        {
          threadId: threadId,
          timestamp: lastEmailTime.toISOString()
        }
      );
      
      emails.push(email);
      thread.emails.push(email.id);
    }
    
    threads.push(thread);
  }
  
  // Generate threads for each type of personal email
  for (let i = 0; i < affairCount; i++) {
    createPersonalThread('affairs', faker.number.int({ min: 1, max: 3 }));
  }
  
  for (let i = 0; i < jobSearchCount; i++) {
    createPersonalThread('jobSearches', faker.number.int({ min: 1, max: 2 }));
  }
  
  for (let i = 0; i < disputeCount; i++) {
    createPersonalThread('disputes', faker.number.int({ min: 1, max: 3 }));
  }
  
  for (let i = 0; i < financialCount; i++) {
    createPersonalThread('financial', faker.number.int({ min: 1, max: 2 }));
  }
  
  return { threads, emails };
}

// Generate personal email dataset
function generatePersonalEmailDataset() {
  // Create a company with employees
  const company = generateCompany({
    name: 'AcmeCorp',
    domain: 'acme.com',
    departmentCount: 5,
    employeesPerDepartment: { min: 4, max: 8 }
  });
  
  // Generate personal email threads
  const { threads, emails } = generatePersonalThreads(company);
  
  // Format the dataset
  return {
    raw: {
      company: company,
      emails: emails,
      threads: threads
    },
    metadata: {
      dataset_name: 'Personal Emails Dataset',
      generation_date: new Date().toISOString(),
      stats: {
        company_name: company.name,
        departments: company.departments.length,
        employees: company.persons.length,
        email_count: emails.length,
        thread_count: threads.length,
        personal_categories: {
          affairs: emails.filter(e => e.metadata.category === 'affairs').length,
          job_searches: emails.filter(e => e.metadata.category === 'jobSearches').length,
          disputes: emails.filter(e => e.metadata.category === 'disputes').length,
          financial: emails.filter(e => e.metadata.category === 'financial').length
        }
      }
    }
  };
}

// Generate and save the dataset
function main() {
  const dataset = generatePersonalEmailDataset();
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'data', 'personal-emails');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save the dataset files
  const files = [
    {
      name: 'dataset.json',
      content: JSON.stringify(dataset, null, 2)
    },
    {
      name: 'emails.json',
      content: JSON.stringify(dataset.raw.emails, null, 2)
    },
    {
      name: 'metadata.json',
      content: JSON.stringify(dataset.metadata, null, 2)
    }
  ];
  
  files.forEach(file => {
    fs.writeFileSync(
      path.join(outputDir, file.name),
      file.content
    );
    console.log(`Generated ${file.name}`);
  });
  
  // Print statistics
  console.log('\nPersonal Email Dataset Statistics:');
  console.log(`Total Emails: ${dataset.raw.emails.length}`);
  console.log(`Total Threads: ${dataset.raw.threads.length}`);
  console.log('\nEmail Categories:');
  
  const categories = dataset.metadata.stats.personal_categories;
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`- ${category}: ${count} emails`);
  });
  
  console.log('\nDataset generated successfully!');
  console.log(`Files saved to: ${outputDir}`);
}

// Run the generator
main();
