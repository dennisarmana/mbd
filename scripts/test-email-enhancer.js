/**
 * Test script for email enhancer
 * 
 * This script helps verify that our email realism improvements
 * are working properly with direct examples.
 */

const { faker } = require('@faker-js/faker');
const { enhanceEmailStructure, enhanceSubject, addLanguageVariations } = require('../data/utils/emailEnhancer');

// Sample company data
const company = {
  name: "TechCorp",
  domain: "techcorp.com",
  persons: [
    {
      id: "person_1",
      name: "John Smith",
      title: "Marketing Director",
      department: "Marketing",
      email: "john@techcorp.com"
    },
    {
      id: "person_2",
      name: "Sarah Johnson",
      title: "Product Manager",
      department: "Product",
      email: "sarah@techcorp.com"
    }
  ]
};

// Test personal email enhancement directly
console.log("\n===== TESTING PERSONAL EMAIL ENHANCEMENT =====\n");

const personalEmailTemplates = {
  affairs: {
    subjects: [
      "Need to see you",
      "Missing you",
      "Tonight?",
      "Delete after reading",
      "Our little secret"
    ],
    bodies: [
      "I can't stop thinking about our last meeting. When can I see you again?",
      "We need to be more careful. I think someone suspects something.",
      "Last night was amazing. I wish I could wake up next to you every day.",
      "I hate having to pretend we're just colleagues during meetings."
    ],
    emotionType: 'secrecy',
    formality: 'intimate'
  },
  jobSearches: {
    subjects: [
      "Your application",
      "Next steps in the process",
      "Confidential: Job opportunity",
      "Follow-up on your interest",
      "Interview scheduling"
    ],
    bodies: [
      "I've reviewed your resume and would like to schedule a call to discuss the position.",
      "Thank you for your application. Your background is impressive. Are you available for an interview?",
      "Just following up on our conversation about the role. The salary range would be quite an improvement over your current position.",
      "I've been considering your offer, but I'm concerned about the commute. Can we discuss remote work options?"
    ],
    emotionType: 'anxiety',
    formality: 'formal'
  },
  disputes: {
    subjects: [
      "We need to talk",
      "This has to stop",
      "Please call me",
      "Regarding our agreement",
      "Last warning"
    ],
    bodies: [
      "I've been looking at our expenses and I'm really concerned. We can't keep spending like this.",
      "You promised you would handle this situation, but nothing has changed.",
      "I'm tired of having the same argument. This isn't working anymore.",
      "I've spoken with a lawyer about our situation. We need to discuss next steps."
    ],
    emotionType: 'anger',
    formality: 'tense'
  },
  financial: {
    subjects: [
      "Outstanding balance",
      "Financial concerns",
      "Our debt situation",
      "Loan application status",
      "Payment arrangement"
    ],
    bodies: [
      "This is your final notice for the outstanding balance. Please make payment within 5 days.",
      "Your mortgage payment is now 30 days late. Please contact us immediately.",
      "I've been looking into consolidating our debts. We're paying too much in interest.",
      "I'm worried about making ends meet this month. The unexpected car repair has really set us back."
    ],
    emotionType: 'anxiety',
    formality: 'casual'
  }
};

const categories = Object.keys(personalEmailTemplates);

for (const category of categories) {
  console.log(`\n----- ${category.toUpperCase()} EMAIL EXAMPLE -----\n`);
  
  // Get template info
  const template = personalEmailTemplates[category];
  const subject = faker.helpers.arrayElement(template.subjects);
  const body = faker.helpers.arrayElement(template.bodies);
  
  // Get the first person as sender and second as recipient
  const [sender, recipient] = [company.persons[0], company.persons[1]];
  
  // Apply language variations for more natural flow
  const variedBody = addLanguageVariations(body);
  
  // Apply full structure enhancement based on the email type
  const enhancedBody = enhanceEmailStructure(variedBody, {
    type: 'personal',
    formality: template.formality,
    emotionType: template.emotionType,
    senderName: sender.name,
    senderTitle: sender.title || 'Employee',
    senderDepartment: sender.department || 'Department',
    senderCompany: company.name,
    senderEmail: sender.email || `${sender.name.split(' ')[0].toLowerCase()}@${company.domain}`,
    recipientName: recipient.name,
    addTypos: Math.random() < 0.3, // 30% chance of typos in personal emails
    urgent: Math.random() < 0.2, // 20% chance of urgent markers
    addSignature: Math.random() < 0.5 // 50% chance of having a signature
  });
  
  // Enhance the subject line
  const enhancedSubject = enhanceSubject(subject, {
    type: 'personal',
    category: category,
    urgent: Math.random() < 0.2,
    addEmojis: Math.random() < 0.3, // 30% chance of emojis in subject
    replyFormat: Math.random() < 0.3 // 30% chance of reply format
  });
  
  console.log(`FROM: ${sender.name} (${sender.title})`);
  console.log(`TO: ${recipient.name} (${recipient.title})`);
  console.log(`SUBJECT: ${enhancedSubject}`);
  console.log("\nBODY:");
  console.log("-----------------------------------");
  console.log(enhancedBody);
  console.log("-----------------------------------\n");
}

// Test business email enhancement
console.log("\n===== TESTING BUSINESS EMAIL ENHANCEMENT =====\n");

const businessEmailTemplates = [
  {
    subject: "Quarterly Marketing Strategy",
    body: "We need to review our Q3 marketing strategy. The current performance metrics show we're 15% below target. Let's schedule a meeting to discuss how we can improve conversion rates and engagement."
  },
  {
    subject: "Project Timeline Update",
    body: "I'm writing to inform you that there will be a two-week delay in the project timeline. The development team encountered technical issues that need to be resolved before proceeding to the next phase."
  }
];

const formalities = ['formal', 'casual', 'tense'];

for (const template of businessEmailTemplates) {
  for (const formality of formalities) {
    console.log(`\n----- BUSINESS EMAIL - ${formality.toUpperCase()} -----\n`);
    
    // Enhance the subject
    const enhancedSubject = enhanceSubject(template.subject, {
      type: 'business',
      urgent: formality === 'tense',
      replyFormat: Math.random() > 0.5,
      addPrefixes: true
    });
    
    // Enhance the body
    const enhancedBody = enhanceEmailStructure(template.body, {
      type: 'business',
      formality: formality,
      emotionType: formality === 'tense' ? 'anxiety' : null,
      senderName: company.persons[0].name,
      senderTitle: company.persons[0].title,
      senderDepartment: company.persons[0].department,
      senderCompany: company.name,
      senderEmail: company.persons[0].email,
      recipientName: company.persons[1].name,
      addBusinessPhrases: true,
      addTypos: false,
      urgent: formality === 'tense',
      addSignature: true
    });
    
    console.log(`FROM: ${company.persons[0].name} (${company.persons[0].title})`);
    console.log(`TO: ${company.persons[1].name} (${company.persons[1].title})`);
    console.log(`SUBJECT: ${enhancedSubject}`);
    console.log("\nBODY:");
    console.log("-----------------------------------");
    console.log(enhancedBody);
    console.log("-----------------------------------\n");
  }
}

console.log("Email enhancer test complete!");
