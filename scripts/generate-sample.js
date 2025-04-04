/**
 * Sample Data Generator Script
 * 
 * This script generates a sample dataset for one scenario
 * to test the generator functionality.
 */

const path = require('path');
const fs = require('fs');
const { generateDataset, defaultScenarioConfigs } = require('../data/utils/generator');

// Create scripts directory if it doesn't exist
const scriptsDir = path.dirname(__filename);
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

// Create output directory
const outputDir = path.join(__dirname, '..', 'data', 'sample');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating sample dataset...');

// Select the first scenario (Marketing Campaign Interpretation)
const sampleScenario = defaultScenarioConfigs[0];

// Generate a small dataset for testing
const dataset = generateDataset(sampleScenario, {
  companyOptions: {
    name: 'TechCorp',
    domain: 'techcorp.com',
    departmentCount: 4,
    employeesPerDepartment: { min: 3, max: 5 }
  },
  emailOptions: {
    threadCount: 5,          // Only generate 5 threads for the sample
    emailsPerThread: { min: 3, max: 7 }, // Fewer emails per thread for the sample
    timeSpan: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-15')
    }
  }
});

// Write the sample dataset to files
console.log(`Writing sample dataset to ${outputDir}`);

// Raw email data (what the AI will analyze)
fs.writeFileSync(
  path.join(outputDir, 'emails.json'),
  JSON.stringify(dataset.raw, null, 2)
);

// Ground truth with full analysis metadata (for evaluation)
fs.writeFileSync(
  path.join(outputDir, 'ground_truth.json'),
  JSON.stringify(dataset.analysis, null, 2)
);

// Metadata about the scenario (without giving away answers)
fs.writeFileSync(
  path.join(outputDir, 'metadata.json'),
  JSON.stringify({
    id: sampleScenario.id,
    name: sampleScenario.name,
    description: sampleScenario.description,
    email_count: dataset.raw.emails.length,
    thread_count: dataset.raw.threads.length,
    department_count: dataset.raw.company.departments.length,
    person_count: dataset.raw.company.persons.length,
    sample: true,
    time_period: {
      start: dataset.analysis.scenario.time_span.start_date,
      end: dataset.analysis.scenario.time_span.end_date
    }
  }, null, 2)
);

// Summary output
console.log('Sample dataset generated!');
console.log('-----------------------------------');
console.log(`Scenario: ${sampleScenario.name}`);
console.log(`Email Count: ${dataset.raw.emails.length}`);
console.log(`Thread Count: ${dataset.raw.threads.length}`);
console.log(`Department Count: ${dataset.raw.company.departments.length}`);
console.log(`Person Count: ${dataset.raw.company.persons.length}`);
console.log('-----------------------------------');
console.log(`Files written to: ${outputDir}`);
console.log('Raw data is in emails.json - this is what the AI will see');
console.log('Ground truth is in ground_truth.json - this contains the evaluation data');
