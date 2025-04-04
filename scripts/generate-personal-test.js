/**
 * Personal Emails Test Generator
 * 
 * This script generates a test dataset with personal emails
 * to demonstrate the new sensitive content feature.
 */

const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const { generateDataset } = require('../data/utils/generator');

// Get the first scenario as base
const scenarioConfig = {
  id: 'marketing_campaign_interpretation',
  name: 'Marketing Campaign Interpretation',
  description: 'Different team members have varied understandings of campaign goals',
  complexity_level: 1,
  key_issues: [
    'Ambiguous campaign objectives',
    'Unclear success metrics',
    'Different interpretations of target audience'
  ]
};

// Generate the dataset with personal emails enabled
const datasetWithPersonal = generateDataset(scenarioConfig, {
  companyOptions: {
    name: 'AcmeCorp',
    domain: 'acme.com',
    departmentCount: 5,
    employeesPerDepartment: { min: 4, max: 8 }
  },
  emailOptions: {
    threadCount: 15,
    emailsPerThread: { min: 3, max: 7 },
    timeSpan: {
      start: new Date('2025-01-01'),
      end: new Date('2025-03-01')
    }
  },
  personalEmails: {
    enabled: true,
    frequency: 0.15, // Higher frequency for testing (15%)
    categories: ['affairs', 'jobSearches', 'domesticDisputes', 'financialIssues']
  }
});

// Create output directory
const outputDir = path.join(__dirname, '..', 'data', 'test-personal');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save the dataset
const outputFiles = [
  {
    name: 'emails.json',
    content: JSON.stringify(datasetWithPersonal, null, 2)
  },
  {
    name: 'metadata.json',
    content: JSON.stringify({
      scenario: scenarioConfig,
      generation_date: new Date().toISOString(),
      stats: datasetWithPersonal.analysis.stats,
      personal_emails_enabled: true,
      personal_emails_frequency: 0.15
    }, null, 2)
  }
];

outputFiles.forEach(file => {
  fs.writeFileSync(
    path.join(outputDir, file.name),
    file.content
  );
  console.log(`Saved ${file.name}`);
});

// Analyze personal email content
const rawEmails = datasetWithPersonal.raw.emails;
const personalEmails = rawEmails.filter(email => email.metadata?.personal);

console.log('\nPersonal Email Analysis:');
console.log(`Total emails: ${rawEmails.length}`);
console.log(`Personal emails: ${personalEmails.length} (${Math.round(personalEmails.length / rawEmails.length * 100)}%)`);

if (personalEmails.length > 0) {
  // Categorize personal emails
  const categoryCounts = personalEmails.reduce((counts, email) => {
    const category = email.metadata?.category || 'unknown';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  
  console.log('\nPersonal Email Categories:');
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`- ${category}: ${count} emails`);
  });
  
  // Show samples of each type
  console.log('\nSample Personal Emails:');
  ['affair', 'jobsearch', 'dispute', 'financial'].forEach(category => {
    const sample = personalEmails.find(email => email.metadata?.category === category);
    if (sample) {
      const fromPerson = datasetWithPersonal.raw.company.persons.find(p => p.id === sample.from);
      const toPerson = datasetWithPersonal.raw.company.persons.find(p => p.id === sample.to[0]);
      
      console.log(`\n[${category.toUpperCase()}]`);
      console.log(`From: ${fromPerson?.name} (${fromPerson?.role})`);
      console.log(`To: ${toPerson?.name} (${toPerson?.role})`);
      console.log(`Body: ${sample.body.substring(0, 100)}...`);
    }
  });
}

console.log('\nDone! Dataset with personal emails generated successfully.');
console.log(`Output directory: ${outputDir}`);
