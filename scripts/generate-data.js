/**
 * Full Dataset Generator
 * 
 * Generates the complete email dataset for all scenarios
 * with volumes scaled according to complexity:
 * - Early scenarios (1-3): 150-200 emails per scenario
 * - Middle scenarios (4-6): 250-400 emails per scenario  
 * - Complex scenarios (7-10): 500-1000+ emails per scenario
 */

const path = require('path');
const fs = require('fs');
const { generateDataset, defaultScenarioConfigs } = require('../data/utils/generator');

// Create output directory
const outputDir = path.join(__dirname, '..', 'data', 'scenarios');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating full dataset for all scenarios...');
console.log('This may take some time, especially for complex scenarios...');

// Process each scenario
defaultScenarioConfigs.forEach((scenario, index) => {
  const paddedIndex = String(index + 1).padStart(2, '0');
  const scenarioDir = path.join(outputDir, `${paddedIndex}_${scenario.id}`);
  
  if (!fs.existsSync(scenarioDir)) {
    fs.mkdirSync(scenarioDir, { recursive: true });
  }
  
  console.log(`\nGenerating scenario ${index + 1}/${defaultScenarioConfigs.length}: ${scenario.name}`);
  
  // Calculate appropriate volumes based on complexity level
  let threadCount, emailsPerThreadMin, emailsPerThreadMax;
  
  if (scenario.complexity_level <= 3) {
    // Early scenarios (1-3): 150-200 emails
    threadCount = 25 + (scenario.complexity_level * 5);
    emailsPerThreadMin = 4;
    emailsPerThreadMax = 7;
  } else if (scenario.complexity_level <= 6) {
    // Middle scenarios (4-6): 250-400 emails
    threadCount = 40 + (scenario.complexity_level * 5);
    emailsPerThreadMin = 5;
    emailsPerThreadMax = 9;
  } else {
    // Complex scenarios (7-10): 500-1000+ emails
    threadCount = 50 + (scenario.complexity_level * 10);
    emailsPerThreadMin = 7;
    emailsPerThreadMax = 15;
  }
  
  // Generate dataset with appropriate scaling
  const dataset = generateDataset(scenario, {
    companyOptions: {
      departmentCount: 3 + Math.min(scenario.complexity_level, 6),
      employeesPerDepartment: {
        min: 3 + scenario.complexity_level,
        max: 5 + scenario.complexity_level * 2
      }
    },
    emailOptions: {
      threadCount: threadCount,
      emailsPerThread: {
        min: emailsPerThreadMin,
        max: emailsPerThreadMax
      },
      timeSpan: {
        start: new Date(`2025-${paddedIndex}-01`),
        end: new Date(`2025-${paddedIndex}-15`)
      }
    }
  });
  
  // Write the dataset to files
  console.log(`  Writing data for ${scenario.name} (${dataset.emails.length} emails in ${dataset.threads.length} threads)`);
  
  // Main data file
  fs.writeFileSync(
    path.join(scenarioDir, 'emails.json'),
    JSON.stringify(dataset, null, 2)
  );
  
  // Metadata about the scenario
  fs.writeFileSync(
    path.join(scenarioDir, 'metadata.json'),
    JSON.stringify({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      complexity_level: scenario.complexity_level,
      key_issues: scenario.key_issues,
      email_count: dataset.emails.length,
      thread_count: dataset.threads.length,
      department_count: dataset.company.departments.length,
      person_count: dataset.company.persons.length,
      generation_timestamp: new Date().toISOString()
    }, null, 2)
  );
  
  // Generation configuration
  fs.writeFileSync(
    path.join(scenarioDir, 'generation_config.json'),
    JSON.stringify({
      scenario_config: scenario,
      generator_options: {
        threadCount: threadCount,
        emailsPerThread: {
          min: emailsPerThreadMin,
          max: emailsPerThreadMax
        },
        departmentCount: 3 + Math.min(scenario.complexity_level, 6),
        employeesPerDepartment: {
          min: 3 + scenario.complexity_level,
          max: 5 + scenario.complexity_level * 2
        }
      }
    }, null, 2)
  );
});

// Create index file with overall summary
const scenarioDirs = fs.readdirSync(outputDir)
  .filter(dir => fs.statSync(path.join(outputDir, dir)).isDirectory());

const summary = scenarioDirs.map(dir => {
  const metadataPath = path.join(outputDir, dir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }
  return null;
}).filter(Boolean);

fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify({
    total_scenarios: summary.length,
    total_emails: summary.reduce((sum, s) => sum + s.email_count, 0),
    total_threads: summary.reduce((sum, s) => sum + s.thread_count, 0),
    scenarios: summary,
    generation_completed: new Date().toISOString()
  }, null, 2)
);

console.log('\nDataset generation complete!');
console.log('-----------------------------------');
console.log(`Total Scenarios: ${summary.length}`);
console.log(`Total Emails: ${summary.reduce((sum, s) => sum + s.email_count, 0)}`);
console.log(`Total Threads: ${summary.reduce((sum, s) => sum + s.thread_count, 0)}`);
console.log('-----------------------------------');
console.log(`Files written to: ${outputDir}`);
console.log('To view the data, check the folders in this directory.');
