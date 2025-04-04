/**
 * Personal Emails Generator
 * 
 * This module provides templates and generation logic for personal emails
 * with sensitive content to be mixed into regular business communications.
 */

const { faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const { 
  enhanceEmailStructure, 
  enhanceSubject, 
  addLanguageVariations 
} = require('./emailEnhancer');

// Persona relationships tracking - maintains consistency across emails
const personaRelationships = new Map();

// Template content for various personal email types
const templates = {
  affairs: [
    {
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
    }
  ],
  
  jobSearches: [
    {
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
    }
  ],
  
  domesticDisputes: [
    {
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
    }
  ],
  
  financialIssues: [
    {
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
  ]
};

// Get a random pair of employees who might exchange personal emails
function getRandomEmployeePair(company) {
  const employees = company.persons;
  if (employees.length < 2) return null;
  
  const employee1 = faker.helpers.arrayElement(employees);
  const otherEmployees = employees.filter(e => e.id !== employee1.id);
  const employee2 = faker.helpers.arrayElement(otherEmployees);
  
  return [employee1, employee2];
}

// Helper functions for personalizing template content
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

// Generate relationship context for two persons
function getOrCreateRelationship(person1Id, person2Id, company) {
  const relationshipKey = [person1Id, person2Id].sort().join('-');
  
  if (!personaRelationships.has(relationshipKey)) {
    const person1 = company.persons.find(p => p.id === person1Id);
    const person2 = company.persons.find(p => p.id === person2Id);
    
    // Create new relationship with random attributes
    const relationship = {
      type: faker.helpers.arrayElement([
        'affair', 'jobsearch', 'dispute', 'financial'
      ]),
      intensity: faker.number.int({ min: 1, max: 10 }),
      startedAt: faker.date.recent({ days: 90 }),
      context: {
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
          company.persons
            .filter(p => p.id !== person1Id && p.id !== person2Id)
            .map(p => p.name)
            .slice(0, 3)
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
      }
    };
    
    personaRelationships.set(relationshipKey, relationship);
  }
  
  return personaRelationships.get(relationshipKey);
}

// Generate a personal email between two employees
function generatePersonalEmail(fromPerson, toPerson, company, options = {}) {
  const relationship = getOrCreateRelationship(
    fromPerson.id, 
    toPerson.id, 
    company
  );
  
  // Select template type based on relationship
  let templateCategory;
  let emotionType;
  let formality;
  
  switch (relationship.type) {
    case 'affair':
      templateCategory = templates.affairs[0];
      emotionType = Math.random() < 0.7 ? 'secrecy' : 'excitement';
      formality = 'intimate';
      break;
    case 'jobsearch':
      templateCategory = templates.jobSearches[0];
      emotionType = Math.random() < 0.6 ? 'anxiety' : 'excitement';
      formality = 'casual';
      break;
    case 'dispute':
      templateCategory = templates.domesticDisputes[0];
      emotionType = 'anger';
      formality = 'tense';
      break;
    case 'financial':
      templateCategory = templates.financialIssues[0];
      emotionType = 'anxiety';
      formality = 'casual';
      break;
    default:
      templateCategory = templates.affairs[0];
      emotionType = 'secrecy';
      formality = 'intimate';
  }
  
  // Select random subject and body templates
  const baseSubject = faker.helpers.arrayElement(templateCategory.subjects);
  const baseBody = faker.helpers.arrayElement(templateCategory.bodies);
  
  // Apply personalization to content
  const personalizedBody = personalize(baseBody, relationship.context);
  
  // Apply language variations for more natural flow
  const variedBody = addLanguageVariations(personalizedBody);
  
  // Apply full structure enhancement based on the email type
  const enhancedBody = enhanceEmailStructure(variedBody, {
    type: 'personal',
    formality: formality,
    emotionType: emotionType,
    senderName: fromPerson.name,
    senderTitle: fromPerson.title || 'Employee',
    senderDepartment: fromPerson.department || 'Department',
    senderCompany: company.name,
    senderEmail: fromPerson.email || `${fromPerson.name.split(' ')[0].toLowerCase()}@${company.domain}`,
    recipientName: toPerson.name,
    addTypos: Math.random() < 0.35, // 35% chance of typos in personal emails
    urgent: relationship.intensity > 8, // High intensity emails marked as urgent
    addSignature: Math.random() < 0.5, // 50% chance of having a signature
    signatureType: relationship.type === 'affair' ? 'minimal' : 'casual'
  });
  
  // Enhance the subject line
  const enhancedSubject = enhanceSubject(baseSubject, {
    type: 'personal',
    category: relationship.type,
    urgent: relationship.intensity > 8,
    addEmojis: Math.random() < 0.3, // 30% chance of emojis in subject
    replyFormat: options.isReply || false
  });
  
  // Generate email with enhanced content
  const email = {
    id: options.id || uuidv4(),
    thread_id: options.threadId || uuidv4(),
    from: fromPerson.id,
    to: [toPerson.id],
    cc: [],
    timestamp: options.timestamp || new Date().toISOString(),
    subject: enhancedSubject,
    body: enhancedBody,
    metadata: {
      personal: true,
      category: relationship.type,
      intensity: relationship.intensity,
      sensitive: true
    }
  };
  
  return email;
}

// Determines whether to inject a personal email based on configuration
function shouldInjectPersonalEmail(config = {}) {
  const frequency = config.frequency || 0.05; // Default 5%
  return Math.random() < frequency;
}

// Get a random pair of employees who might exchange personal emails
function getRandomEmployeePair(company) {
  const employees = company.persons;
  if (employees.length < 2) return null;
  
  const employee1 = faker.helpers.arrayElement(employees);
  const otherEmployees = employees.filter(e => e.id !== employee1.id);
  const employee2 = faker.helpers.arrayElement(otherEmployees);
  
  return [employee1, employee2];
}

module.exports = {
  generatePersonalEmail,
  shouldInjectPersonalEmail,
  getRandomEmployeePair,
  // Expose templates for custom generations
  templates,
  // For testing and customization
  personalize,
  getOrCreateRelationship
};
