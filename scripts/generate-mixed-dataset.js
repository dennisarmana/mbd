/**
 * Mixed Dataset Generator
 * 
 * This script generates a scenario dataset that includes both
 * business communications and personal emails with sensitive content.
 */

const fs = require('fs');
const path = require('path');
const { generateMixedDataset } = require('../data/utils/scenarioWithPersonal');

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

// Set personal email options (can be adjusted for "realism slider")
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

// Categorize personal emails
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
}

console.log('\nDataset generated successfully!');
console.log(`Files saved to: ${outputDir}`);
