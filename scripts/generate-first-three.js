/**
 * First Three Scenarios Generator Script
 * 
 * This script generates datasets for the first three scenarios:
 * 1. Marketing Campaign Interpretation
 * 2. Product Launch Timeline
 * 3. Feature Priority Misalignment
 */

const path = require('path');
const fs = require('fs');
const { generateDataset, defaultScenarioConfigs } = require('../data/utils/generator');

// Create output directory structure
const dataDir = path.join(__dirname, '..', 'data', 'scenarios');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Generating datasets for the first three scenarios...');

// Generate each of the first three scenarios
for (let i = 0; i < 3; i++) {
  const scenario = defaultScenarioConfigs[i];
  console.log(`\nGenerating Scenario ${i+1}: ${scenario.name}`);
  
  // Create scenario directory
  const scenarioDir = path.join(dataDir, scenario.id);
  if (!fs.existsSync(scenarioDir)) {
    fs.mkdirSync(scenarioDir, { recursive: true });
  }
  
  // Customize generation options based on complexity
  const complexity = scenario.complexity_level;
  
  // Generate a dataset with appropriate size for this complexity level
  const dataset = generateDataset(scenario, {
    companyOptions: {
      name: `Acme${complexity}Corp`,
      domain: `acme${complexity}.com`,
      departmentCount: 4 + complexity,
      employeesPerDepartment: { min: 3 + complexity, max: 5 + complexity * 2 }
    },
    emailOptions: {
      threadCount: 10 + complexity * 5,            // Increase threads with complexity
      emailsPerThread: { min: 3, max: 5 + complexity }, // Increase emails per thread with complexity
      timeSpan: {
        start: new Date(`2025-0${complexity}-01`), // Different month for each scenario
        end: new Date(`2025-0${complexity+1}-01`)
      }
    }
  });

  // Write the dataset files
  console.log(`Writing dataset to ${scenarioDir}`);

  // Write the raw emails.json file
  fs.writeFileSync(
    path.join(scenarioDir, 'emails.json'),
    JSON.stringify(dataset, null, 2)
  );

  // First inspect the dataset structure to handle it properly
  console.log('Dataset structure received - inspecting...');
  
  // Extract key components of the dataset
  const company = dataset.company || {};
  const emails = dataset.emails || [];
  
  // Calculate stats
  const emailCount = emails.length;
  const threadIds = emails.map(e => e.threadId || '').filter(id => id !== '');
  const threadCount = [...new Set(threadIds)].length;
  
  // Calculate time span if we have emails
  let timeSpan = { start: null, end: null };
  if (emailCount > 0) {
    const timestamps = emails.map(e => new Date(e.timestamp).getTime());
    timeSpan = {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString()
    };
  }
  
  // Write the metadata.json file
  fs.writeFileSync(
    path.join(scenarioDir, 'metadata.json'),
    JSON.stringify({
      scenario: scenario,
      generation_date: new Date().toISOString(),
      stats: {
        company_name: company.name || `Acme${complexity}Corp`,
        departments: (company.departments || []).length,
        employees: (company.persons || []).length,
        email_count: emailCount,
        thread_count: threadCount,
        time_span: timeSpan
      }
    }, null, 2)
  );

  // Write the generation_config.json file
  fs.writeFileSync(
    path.join(scenarioDir, 'generation_config.json'),
    JSON.stringify({
      scenario: scenario,
      options: {
        company: {
          name: `Acme${complexity}Corp`,
          domain: `acme${complexity}.com`,
          departmentCount: 4 + complexity,
          employeesPerDepartment: { min: 3 + complexity, max: 5 + complexity * 2 }
        },
        emails: {
          threadCount: 10 + complexity * 5,
          emailsPerThread: { min: 3, max: 5 + complexity },
          timeSpan: {
            start: `2025-0${complexity}-01`,
            end: `2025-0${complexity+1}-01`
          }
        }
      }
    }, null, 2)
  );
}

console.log('\nDataset generation complete!');
console.log('Generated datasets for:');
for (let i = 0; i < 3; i++) {
  console.log(`- ${defaultScenarioConfigs[i].name} (${defaultScenarioConfigs[i].id})`);
}
console.log(`\nDatasets are located in: ${dataDir}`);
