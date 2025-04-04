/**
 * Fix Metadata Script
 * 
 * This script fixes the metadata.json files for the three generated scenarios
 * and creates a clean dataset version for each scenario.
 */

const path = require('path');
const fs = require('fs');

// Define scenario IDs
const scenarioIds = [
  'marketing_campaign_interpretation',
  'product_launch_timeline',
  'feature_priority'
];

// Process each scenario
scenarioIds.forEach(scenarioId => {
  console.log(`\nProcessing scenario: ${scenarioId}`);
  
  const scenarioDir = path.join(__dirname, '..', 'data', 'scenarios', scenarioId);
  const outputDir = path.join(__dirname, '..', 'data', 'datasets');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Read the emails.json file
  const emailsPath = path.join(scenarioDir, 'emails.json');
  if (!fs.existsSync(emailsPath)) {
    console.error(`ERROR: emails.json not found for ${scenarioId}`);
    return;
  }
  
  try {
    // Read and parse the data
    const rawData = fs.readFileSync(emailsPath, 'utf8');
    const dataset = JSON.parse(rawData);
    
    // Extract the raw data
    const raw = dataset.raw || {};
    const analysis = dataset.analysis || {};
    
    // Get company, emails, and threads
    const company = raw.company || {};
    const emails = raw.emails || [];
    const threads = raw.threads || [];
    
    // Create clean dataset with flattened structure for easier use
    const cleanData = {
      scenario: analysis.scenario || {},
      company: company,
      emails: emails.map(email => {
        // Convert person IDs to actual email addresses for easier use
        const fromPerson = company.persons.find(p => p.id === email.from);
        const toPeople = email.to.map(personId => 
          company.persons.find(p => p.id === personId)
        ).filter(Boolean);
        
        return {
          id: email.id,
          threadId: email.thread_id,
          subject: threads.find(t => t.id === email.thread_id)?.subject || '',
          from: fromPerson ? fromPerson.email : '',
          fromName: fromPerson ? fromPerson.name : '',
          fromRole: fromPerson ? fromPerson.role : '',
          fromDepartment: fromPerson ? 
            company.departments.find(d => d.id === fromPerson.department_id)?.name : '',
          to: toPeople.map(p => p.email),
          toNames: toPeople.map(p => p.name),
          cc: email.cc ? email.cc.map(personId => {
            const person = company.persons.find(p => p.id === personId);
            return person ? person.email : '';
          }).filter(Boolean) : [],
          timestamp: email.timestamp,
          body: email.body
        };
      }),
      threads: threads.map(thread => {
        return {
          id: thread.id,
          subject: thread.subject,
          participants: thread.participants.map(personId => {
            const person = company.persons.find(p => p.id === personId);
            return person ? {
              id: person.id,
              name: person.name,
              email: person.email,
              role: person.role,
              department: company.departments.find(d => d.id === person.department_id)?.name || ''
            } : null;
          }).filter(Boolean)
        };
      })
    };
    
    // Calculate stats
    const emailCount = emails.length;
    const threadCount = threads.length;
    const departmentCount = company.departments?.length || 0;
    const personCount = company.persons?.length || 0;
    
    // Calculate time span
    let timeSpan = { start: null, end: null };
    if (emailCount > 0) {
      const timestamps = emails.map(e => new Date(e.timestamp).getTime());
      timeSpan = {
        start: new Date(Math.min(...timestamps)).toISOString(),
        end: new Date(Math.max(...timestamps)).toISOString()
      };
    }
    
    // Fix metadata.json
    const metadata = {
      scenario: analysis.scenario || {},
      generation_date: new Date().toISOString(),
      stats: {
        company_name: company.name || '',
        departments: departmentCount,
        employees: personCount,
        email_count: emailCount,
        thread_count: threadCount,
        time_span: timeSpan
      }
    };
    
    // Write fixed metadata.json
    fs.writeFileSync(
      path.join(scenarioDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    console.log(`✓ Updated metadata.json for ${scenarioId}`);
    
    // Write clean dataset file
    const outputPath = path.join(outputDir, `${scenarioId}.json`);
    fs.writeFileSync(
      outputPath,
      JSON.stringify(cleanData, null, 2)
    );
    console.log(`✓ Created clean dataset at ${outputPath}`);
    
  } catch (error) {
    console.error(`ERROR processing ${scenarioId}:`, error);
  }
});

console.log('\nAll datasets processed. The clean datasets are ready for your colleagues.')
