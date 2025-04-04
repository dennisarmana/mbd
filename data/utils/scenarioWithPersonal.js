/**
 * Scenario Generator with Personal Emails
 * 
 * An integration layer that combines the regular scenario generator
 * with the personal emails functionality.
 */

const path = require('path');
const fs = require('fs');
const { generateDataset } = require('./generator');
const personalEmails = require('./personalEmails');

/**
 * Generate a dataset with both business and personal emails
 * 
 * @param {Object} scenarioConfig - The scenario configuration
 * @param {Object} options - Generation options
 * @param {Object} personalOptions - Personal emails configuration
 * @returns {Object} The combined dataset
 */
function generateMixedDataset(scenarioConfig, options = {}, personalOptions = {}) {
  // First, generate the regular business emails dataset
  const businessDataset = generateDataset(scenarioConfig, options);
  
  // Check if personal emails are enabled
  if (!personalOptions.enabled) {
    return businessDataset;
  }
  
  // Extract the company data
  const company = businessDataset.raw.company;
  
  // Set default personal options if not provided
  const personalEmailOptions = {
    frequency: personalOptions.frequency || 0.05,  // Default 5% of total emails
    minThreads: personalOptions.minThreads || 1,
    maxThreads: personalOptions.maxThreads || 3,
    categories: personalOptions.categories || 
      ['affairs', 'jobSearches', 'disputes', 'financial'],
    ...personalOptions
  };
  
  // Create personal threads based on a percentage of business threads
  const businessThreadCount = businessDataset.raw.threads.length;
  const personalThreadCount = Math.max(
    personalEmailOptions.minThreads,
    Math.min(
      personalEmailOptions.maxThreads,
      Math.floor(businessThreadCount * personalEmailOptions.frequency)
    )
  );
  
  // Generate personal threads
  const personalThreads = [];
  const personalEmails = [];
  
  // Calculate category distribution
  const categoryCount = personalEmailOptions.categories.length;
  const threadsPerCategory = Math.ceil(personalThreadCount / categoryCount);
  
  // Generate threads for each enabled category
  personalEmailOptions.categories.forEach(category => {
    // Skip invalid categories
    if (!['affairs', 'jobSearches', 'disputes', 'financial'].includes(category)) {
      return;
    }
    
    // Generate up to threadsPerCategory for this category
    for (let i = 0; i < threadsPerCategory; i++) {
      // Stop if we've reached the maximum total threads
      if (personalThreads.length >= personalThreadCount) {
        break;
      }
      
      // Get random participants
      const employeePair = personalEmails.getRandomEmployeePair(company);
      if (!employeePair) continue;
      
      const [sender, recipient] = employeePair;
      
      // Create a thread ID
      const threadId = `thread_personal_${personalThreads.length}`;
      
      // Create relationship context
      const relationship = personalEmails.getOrCreateRelationship(
        sender.id, recipient.id, company
      );
      
      // Determine email count (1-3 emails per thread)
      const emailCount = Math.floor(Math.random() * 3) + 1;
      
      // Create thread
      const thread = {
        id: threadId,
        subject: '',  // Will be set from first email
        participants: [sender.id, recipient.id],
        start_time: null,  // Will be set from first email
        end_time: null,  // Will be set from last email
        email_ids: []
      };
      
      // Generate emails
      for (let e = 0; e < emailCount; e++) {
        // Switch sender and recipient for replies
        const currentSender = e % 2 === 0 ? sender : recipient;
        const currentRecipient = e % 2 === 0 ? recipient : sender;
        
        // Generate timestamp
        const businessEmails = businessDataset.raw.emails;
        
        // Use a timestamp that falls within the range of business emails
        const timestamps = businessEmails.map(e => new Date(e.timestamp).getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        
        // Random timestamp within range
        const timestamp = new Date(
          minTime + Math.random() * (maxTime - minTime)
        ).toISOString();
        
        // Set thread start time from first email
        if (e === 0) {
          thread.start_time = timestamp;
        }
        
        // Set thread end time from last email
        if (e === emailCount - 1) {
          thread.end_time = timestamp;
        }
        
        // Generate email
        const email = personalEmails.generatePersonalEmail(
          currentSender,
          currentRecipient,
          company,
          { threadId, timestamp }
        );
        
        // Set thread subject from first email
        if (e === 0) {
          thread.subject = email.body.split('\n')[0];
          if (thread.subject.length > 50) {
            thread.subject = thread.subject.substring(0, 47) + '...';
          }
        }
        
        // Add to personal emails array
        personalEmails.push(email);
        thread.email_ids.push(email.id);
      }
      
      personalThreads.push(thread);
    }
  });
  
  // Merge personal and business data
  const combinedDataset = {
    raw: {
      company: businessDataset.raw.company,
      emails: [...businessDataset.raw.emails, ...personalEmails],
      threads: [...businessDataset.raw.threads, ...personalThreads]
    },
    analysis: {
      scenario: businessDataset.analysis.scenario,
      stats: {
        ...businessDataset.analysis.stats,
        email_count: businessDataset.analysis.stats.email_count + personalEmails.length,
        thread_count: businessDataset.analysis.stats.thread_count + personalThreads.length,
        personal_emails: {
          count: personalEmails.length,
          percentage: Math.round(
            personalEmails.length / 
            (businessDataset.raw.emails.length + personalEmails.length) * 100
          )
        }
      }
    }
  };
  
  return combinedDataset;
}

module.exports = {
  generateMixedDataset
};
