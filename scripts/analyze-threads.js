/**
 * Email Thread Analysis
 * 
 * This script analyzes the generated email threads to assess their realism,
 * coherence, and alignment with real-world business communications.
 */

const fs = require('fs');
const path = require('path');

// Load the dataset
const datasetPath = process.argv[2] || 
  path.join(__dirname, '../data/mixed-scenarios/feature_priority/emails.json');

console.log(`Analyzing dataset: ${datasetPath}\n`);

// Read and parse the data
const rawData = fs.readFileSync(datasetPath, 'utf8');
const data = JSON.parse(rawData);

// Extract key components
const {company, emails, threads} = data.raw;

// Basic dataset statistics
console.log('DATASET OVERVIEW:');
console.log('----------------');
console.log(`Company: ${company.name}`);
console.log(`Total emails: ${emails.length}`);
console.log(`Total threads: ${threads.length}`);
console.log(`Departments: ${company.departments.length}`);
console.log(`Employees: ${company.persons.length}`);

// Analyze email types
const personalEmails = emails.filter(e => e.metadata && e.metadata.personal);
const businessEmails = emails.filter(e => !e.metadata || !e.metadata.personal);

console.log(`\nEmail Types:`);
console.log(`  Business emails: ${businessEmails.length} (${Math.round(businessEmails.length/emails.length*100)}%)`);
console.log(`  Personal emails: ${personalEmails.length} (${Math.round(personalEmails.length/emails.length*100)}%)`);

// Categorize personal emails
if (personalEmails.length > 0) {
  const categories = personalEmails.reduce((acc, e) => {
    const cat = e.metadata.category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nPersonal Email Categories:');
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} emails (${Math.round(count/personalEmails.length*100)}%)`);
  });
}

// Thread analysis
console.log('\nTHREAD ANALYSIS:');
console.log('---------------');

// Thread sizes
const threadSizes = threads.map(t => {
  const threadEmails = emails.filter(e => e.thread_id === t.id);
  return threadEmails.length;
});

const avgThreadSize = threadSizes.reduce((sum, size) => sum + size, 0) / threadSizes.length;
const maxThreadSize = Math.max(...threadSizes);
const minThreadSize = Math.min(...threadSizes);

console.log(`Average emails per thread: ${avgThreadSize.toFixed(2)}`);
console.log(`Thread size range: ${minThreadSize} to ${maxThreadSize} emails`);

// Thread participant analysis
const participantsPerThread = threads.map(t => t.participants.length);
const avgParticipants = participantsPerThread.reduce((sum, count) => sum + count, 0) / threads.length;

console.log(`Average participants per thread: ${avgParticipants.toFixed(2)}`);

// Analyze email thread examples
console.log('\nTHREAD EXAMPLES:');
console.log('---------------');

// Select a few threads to analyze in detail
const threadsToAnalyze = 2;
const threadSample = threads.slice(0, threadsToAnalyze);

threadSample.forEach((thread, index) => {
  const threadEmails = emails.filter(e => e.thread_id === thread.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  console.log(`\nThread ${index + 1}: ${thread.subject}`);
  console.log(`Participants: ${thread.participants.length}`);
  console.log(`Emails: ${threadEmails.length}`);
  console.log('Timeline: ' + new Date(thread.start_time).toLocaleDateString() + ' to ' + 
    new Date(thread.end_time).toLocaleDateString());
  
  // Show abbreviated conversation flow
  console.log('\nConversation Flow:');
  threadEmails.forEach((email, i) => {
    const sender = company.persons.find(p => p.id === email.from);
    const recipients = email.to.map(id => company.persons.find(p => p.id === id).name).join(', ');
    
    console.log(`\n--- EMAIL ${i+1} ---`);
    console.log(`From: ${sender.name} (${sender.title || 'Employee'})`);
    console.log(`To: ${recipients}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Timestamp: ${new Date(email.timestamp).toLocaleString()}`);
    
    // Show first 150 chars of body with ellipsis if longer
    const previewLength = 150;
    const bodyPreview = email.body.length > previewLength ? 
      email.body.substring(0, previewLength) + '...' : 
      email.body;
    
    console.log(`Body Preview: ${bodyPreview}`);
    
    // If it has metadata, show it
    if (email.metadata) {
      const metaStr = Object.entries(email.metadata)
        .filter(([k, v]) => typeof v !== 'object' && k !== 'key_points' && k !== 'miscommunication_elements')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      
      console.log(`Metadata: ${metaStr}`);
    }
  });
});

// Analyze communication patterns
console.log('\nCOMMUNICATION PATTERNS:');
console.log('----------------------');

// Look at metadata sentiment distribution
const sentiments = businessEmails
  .filter(e => e.metadata && e.metadata.sentiment)
  .reduce((acc, e) => {
    const sentiment = e.metadata.sentiment;
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {});

console.log('Email Sentiments:');
Object.entries(sentiments).forEach(([sentiment, count]) => {
  console.log(`  ${sentiment}: ${count} emails (${Math.round(count/businessEmails.length*100)}%)`);
});

// Assess realism
const emailFormats = emails.map(email => {
  // Check for greeting/salutation
  const hasGreeting = /^(Hi|Hello|Hey|Dear|Good|Greetings)/m.test(email.body);
  
  // Check for signature
  const hasSignature = /(\r?\n\r?\n(Regards|Sincerely|Thanks|Cheers|Best|Take care),?\r?\n|-- \r?\n)/m.test(email.body);
  
  // Check for business phrases
  const hasBusinessPhrases = /(touch base|circle back|moving forward|as per|please advise|as discussed)/i.test(email.body);
  
  return { hasGreeting, hasSignature, hasBusinessPhrases };
});

const formatStats = emailFormats.reduce((stats, email) => {
  stats.greetings += email.hasGreeting ? 1 : 0;
  stats.signatures += email.hasSignature ? 1 : 0;
  stats.businessPhrases += email.hasBusinessPhrases ? 1 : 0;
  return stats;
}, { greetings: 0, signatures: 0, businessPhrases: 0 });

console.log('\nEmail Format Analysis:');
console.log(`  Emails with greetings: ${formatStats.greetings} (${Math.round(formatStats.greetings/emails.length*100)}%)`);
console.log(`  Emails with signatures: ${formatStats.signatures} (${Math.round(formatStats.signatures/emails.length*100)}%)`);
console.log(`  Emails with business phrases: ${formatStats.businessPhrases} (${Math.round(formatStats.businessPhrases/emails.length*100)}%)`);

console.log('\nREALISM ASSESSMENT:');
console.log('------------------');

// Calculate overall realism score based on various factors
const realismScore = (
  (formatStats.greetings / emails.length) * 30 +
  (formatStats.signatures / emails.length) * 25 +
  (formatStats.businessPhrases / emails.length) * 15 +
  (Object.keys(sentiments).length / 6) * 15 +
  (Math.min(personalEmails.length / emails.length / 0.1, 1)) * 15
) * 100;

console.log(`Overall Realism Score: ${Math.round(realismScore)}/100`);

// Provide qualitative assessment
let assessment = '';
if (realismScore >= 85) {
  assessment = 'The dataset exhibits excellent realism with proper email formatting, varied sentiments, ' +
    'and appropriate mix of personal and business content.';
} else if (realismScore >= 70) {
  assessment = 'The dataset demonstrates good realism with most emails containing real-world communication patterns ' +
    'though some areas could be further enhanced.';
} else if (realismScore >= 50) {
  assessment = 'The dataset shows moderate realism but lacks consistency in formatting or natural language patterns.';
} else {
  assessment = 'The dataset requires significant improvement in email formatting, varied sentiment, and natural language.';
}

console.log(`\nQualitative Assessment: ${assessment}`);
