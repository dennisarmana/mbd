/**
 * Email Content Enhancer
 * 
 * Improves realism of generated emails by adding natural language
 * structure, appropriate formatting, and realistic content patterns.
 */

const { faker } = require('@faker-js/faker');

// Greetings with formality variations
const greetings = {
  formal: [
    "Dear {firstName},",
    "Hello {firstName},",
    "Good morning {firstName},",
    "Good afternoon {firstName},",
    "Good evening {firstName},",
    "Dear {title} {lastName},",
    "Greetings {firstName},"
  ],
  casual: [
    "Hi {firstName},",
    "Hey {firstName},",
    "Hey there,",
    "Hi there {firstName},",
    "Morning {firstName},",
    "{firstName},"
  ],
  intimate: [
    "Hey you,",
    "Hi gorgeous,",
    "Hey sweetheart,",
    "Baby,",
    "{firstName} ❤️,"
  ],
  tense: [
    "{firstName} -",
    "{lastName} -",
    "Attention {firstName}:",
    "{firstName},"
  ]
};

// Email closings with formality variations
const closings = {
  formal: [
    "Best regards,",
    "Kind regards,",
    "Sincerely,",
    "Regards,",
    "Thank you,",
    "Respectfully,"
  ],
  casual: [
    "Thanks,",
    "Cheers,",
    "Best,",
    "Talk soon,",
    "Take care,",
    "Have a great day,"
  ],
  intimate: [
    "Miss you,",
    "Thinking of you,",
    "Can't wait to see you,",
    "XOXO,",
    "Love,"
  ],
  tense: [
    "Urgently,",
    "Please respond ASAP,",
    "Awaiting your response,",
    "-"
  ]
};

// Email signatures with different levels of detail
const signatures = {
  formal: [
    "{fullName}\n{title}\n{company}\n{email}\n{phone}",
    "{fullName}\n{title} | {department}\n{company}\n{email}",
    "{fullName}, {title}\n{company}"
  ],
  casual: [
    "{firstName}\n{email}",
    "{firstName} {lastInitial}.\n{department}",
    "{firstName}",
    "-- \n{firstName}"
  ],
  minimal: [
    "{firstInitial}",
    "",
    "Sent from my iPhone",
    "-- \n{firstName}"
  ]
};

// Common business phrases to add realism
const businessPhrases = [
  "As per our discussion",
  "Moving forward",
  "Please advise",
  "Let me know if you need anything else",
  "Per our earlier conversation",
  "Please find attached",
  "Let's circle back on this",
  "Let's touch base",
  "I'll follow up on this",
  "Just looping in {name}",
  "I wanted to keep you in the loop",
  "I'm reaching out because",
  "Do you have bandwidth for this?",
  "Let's table this discussion",
  "We need all hands on deck",
  "This is a mission-critical task",
  "Let's put this on the agenda",
  "I'll ping you later about this",
  "Let's take this offline",
  "Can we put a pin in this?",
  "Let's set up a call to discuss further",
  "Thanks for your quick response"
];

// Typo patterns to add realism
const typoPatterns = {
  common: [
    { from: "the", to: "teh" },
    { from: "with", to: "wiht" },
    { from: "your", to: "you" },
    { from: "their", to: "thier" },
    { from: "morning", to: "mornign" },
    { from: "because", to: "becuase" },
    { from: "meeting", to: "meetign" }
  ],
  punctuation: [
    { from: ".", to: "" },
    { from: " ", to: "  " },
    { from: ",", to: "" },
    { from: "!", to: "!!" }
  ]
};

// Emotional indicators to add to personal emails
const emotionalIndicators = {
  anxiety: [
    "I'm really worried about",
    "This has been keeping me up at night",
    "I'm not sure what to do about",
    "I can't stop thinking about",
    "I'm freaking out a little",
    "This is stressing me out"
  ],
  excitement: [
    "I'm so excited about",
    "This could be a great opportunity",
    "I can't believe it!",
    "This is amazing news",
    "I'm really looking forward to",
    "Fantastic news about"
  ],
  anger: [
    "I'm furious about",
    "This is completely unacceptable",
    "I can't believe you would",
    "I've had enough of",
    "This has to stop",
    "I'm at my wit's end with"
  ],
  secrecy: [
    "Please delete this email after reading",
    "Let's keep this between us",
    "I don't want anyone else to know",
    "This is strictly confidential",
    "Make sure no one sees this",
    "Don't mention this to anyone"
  ]
};

// Informal message starters (for casual emails)
const informalStarters = [
  "Just wanted to",
  "Quick update:",
  "FYI -",
  "Heads up:",
  "By the way,",
  "BTW,",
  "So,",
  "Listen,",
  "Thought you should know:",
  "Quick question:"
];

/**
 * Add natural language structure to an email
 * 
 * @param {string} content - Raw email content
 * @param {Object} options - Configuration options
 * @returns {string} Formatted email with proper structure
 */
function enhanceEmailStructure(content, options = {}) {
  const {
    type = 'business',           // business, personal
    formality = 'casual',        // formal, casual, intimate, tense
    senderName = 'John Doe',
    senderTitle = 'Employee',
    senderDepartment = 'Department',
    senderCompany = 'Company',
    senderEmail = 'email@example.com',
    senderPhone = '123-456-7890',
    recipientName = 'Jane Doe',
    addBusinessPhrases = true,
    addTypos = false,
    addSignature = true,
    signatureType = 'casual',
    emotionType = null,         // anxiety, excitement, anger, secrecy
    replyFormat = false,        // make it look like a reply
    includeQuotedText = false,  // include quoted text in replies
    quotedText = '',            // text to quote in replies  
    urgent = false              // mark as urgent
  } = options;
  
  // Extract name components
  const senderFirstName = senderName.split(' ')[0];
  const senderLastName = senderName.split(' ').slice(-1)[0];
  const senderFirstInitial = senderFirstName.charAt(0);
  const senderLastInitial = senderLastName.charAt(0);
  
  const recipientFirstName = recipientName.split(' ')[0];
  const recipientLastName = recipientName.split(' ').slice(-1)[0];
  
  // Create context for template substitution
  const context = {
    firstName: recipientFirstName,
    lastName: recipientLastName,
    fullName: senderName,
    title: senderTitle,
    department: senderDepartment,
    company: senderCompany,
    email: senderEmail,
    phone: senderPhone,
    firstInitial: senderFirstInitial,
    lastInitial: senderLastInitial
  };
  
  // Start building the enhanced email
  let enhancedContent = '';
  
  // Add greeting
  if (greetings[formality]) {
    const greeting = faker.helpers.arrayElement(greetings[formality]);
    enhancedContent += personalize(greeting, context) + '\n\n';
  }
  
  // For casual business emails, sometimes add an informal starter
  if (type === 'business' && formality === 'casual' && Math.random() < 0.4) {
    enhancedContent += faker.helpers.arrayElement(informalStarters) + ' ';
  }
  
  // For personal emails with emotional context
  if (type === 'personal' && emotionType && emotionalIndicators[emotionType]) {
    const emotionalIndicator = faker.helpers.arrayElement(emotionalIndicators[emotionType]);
    
    // Some emotional starters replace the greeting, others augment the content
    if (Math.random() < 0.3) {
      // Replace greeting with emotional indicator
      enhancedContent = emotionalIndicator + ' ';
      enhancedContent += content.charAt(0).toLowerCase() + content.slice(1);
    } else {
      // Add emotional indicator to the beginning of content
      enhancedContent += content;
      
      // Sometimes add the emotional indicator in the middle or end
      if (Math.random() < 0.5) {
        const sentences = content.split('. ');
        if (sentences.length > 1) {
          const insertPosition = Math.floor(Math.random() * sentences.length);
          sentences[insertPosition] = emotionalIndicator + ' ' + sentences[insertPosition].toLowerCase();
          enhancedContent = sentences.join('. ');
        }
      }
    }
  } else {
    // Add the main content
    enhancedContent += content;
  }
  
  // Add business phrases for more realism
  if (type === 'business' && addBusinessPhrases && Math.random() < 0.7) {
    const businessPhrase = personalize(
      faker.helpers.arrayElement(businessPhrases),
      {...context, name: faker.helpers.arrayElement([
        senderFirstName, recipientFirstName, 'the team'
      ])}
    );
    
    // Place the business phrase at beginning, middle, or end
    const placement = Math.random();
    if (placement < 0.3) {
      // At the beginning
      enhancedContent = businessPhrase + '. ' + enhancedContent;
    } else if (placement < 0.7) {
      // At the end
      enhancedContent += '\n\n' + businessPhrase + '.';
    } else {
      // In the middle - split into sentences and insert
      const sentences = enhancedContent.split('. ');
      if (sentences.length > 1) {
        const insertPos = Math.floor(sentences.length / 2);
        sentences.splice(insertPos, 0, businessPhrase);
        enhancedContent = sentences.join('. ');
      } else {
        enhancedContent += '\n\n' + businessPhrase + '.';
      }
    }
  }
  
  // Add email closing
  if (closings[formality]) {
    enhancedContent += '\n\n' + faker.helpers.arrayElement(closings[formality]) + '\n';
  }
  
  // Add signature
  if (addSignature && signatures[signatureType]) {
    const signature = personalize(
      faker.helpers.arrayElement(signatures[signatureType]), 
      context
    );
    enhancedContent += signature;
  }
  
  // Add reply formatting with quoted text
  if (replyFormat && includeQuotedText && quotedText) {
    enhancedContent += '\n\n';
    enhancedContent += '------ Original Message ------\n';
    enhancedContent += quotedText.split('\n')
      .map(line => '> ' + line)
      .join('\n');
  }
  
  // Add urgency markers
  if (urgent) {
    enhancedContent = '**URGENT** ' + enhancedContent;
  }
  
  // Add typos for realism (with a probability)
  if (addTypos && Math.random() < 0.3) {
    // Choose 1-2 typos to add
    const typoCount = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < typoCount; i++) {
      const typoType = Math.random() < 0.7 ? 'common' : 'punctuation';
      const typo = faker.helpers.arrayElement(typoPatterns[typoType]);
      
      // Only replace the first occurrence
      enhancedContent = enhancedContent.replace(typo.from, typo.to);
    }
  }
  
  return enhancedContent;
}

/**
 * Add natural language variations to enhance realism
 * 
 * @param {string} content - The content to enhance
 * @returns {string} Enhanced content with natural language variations
 */
function addLanguageVariations(content) {
  // Convert some sentences to questions
  if (Math.random() < 0.3) {
    const sentences = content.split('. ');
    if (sentences.length > 1) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      const sentence = sentences[randomIndex];
      
      if (!sentence.endsWith('?') && sentence.length > 5) {
        // Simple transformation to a question
        if (sentence.toLowerCase().includes('you')) {
          sentences[randomIndex] = sentence.replace('.', '?');
        } else {
          sentences[randomIndex] = 'Would you agree that ' + 
            sentence.charAt(0).toLowerCase() + sentence.slice(1) + '?';
        }
      }
      
      content = sentences.join('. ');
    }
  }
  
  // Add filler words occasionally
  const fillerWords = ['basically', 'literally', 'honestly', 'actually', 'just'];
  if (Math.random() < 0.4) {
    const fillerWord = faker.helpers.arrayElement(fillerWords);
    const words = content.split(' ');
    if (words.length > 5) {
      const insertPosition = Math.floor(Math.random() * (words.length - 3)) + 2;
      words.splice(insertPosition, 0, fillerWord);
      content = words.join(' ');
    }
  }
  
  // Add emphasis with capitalization
  if (Math.random() < 0.3) {
    const words = content.split(' ');
    if (words.length > 7) {
      const emphasisWord = Math.floor(Math.random() * (words.length - 2)) + 1;
      
      // Only capitalize shorter words that aren't already capitalized
      if (words[emphasisWord].length < 8 && 
          words[emphasisWord] === words[emphasisWord].toLowerCase()) {
        words[emphasisWord] = words[emphasisWord].toUpperCase();
        content = words.join(' ');
      }
    }
  }
  
  return content;
}

/**
 * Enhanced email subject generator
 * 
 * @param {string} baseSubject - Base subject to enhance
 * @param {Object} options - Configuration options
 * @returns {string} Enhanced subject line
 */
function enhanceSubject(baseSubject, options = {}) {
  const {
    type = 'business',      // business, personal
    urgent = false,         // mark as urgent 
    replyFormat = false,    // add Re: prefix
    forwardFormat = false,  // add Fwd: prefix
    addPrefixes = true,     // add prefixes like [ACTION]
    addEmojis = false       // add relevant emojis
  } = options;
  
  let subject = baseSubject;
  
  // Add business prefixes
  if (type === 'business' && addPrefixes && Math.random() < 0.3) {
    const businessPrefixes = ['[ACTION]', '[REMINDER]', '[UPDATE]', '[INFO]', '[REQUEST]'];
    subject = faker.helpers.arrayElement(businessPrefixes) + ' ' + subject;
  }
  
  // Mark as urgent
  if (urgent) {
    subject = '[URGENT] ' + subject;
  }
  
  // Add reply prefix
  if (replyFormat) {
    subject = 'Re: ' + subject;
  }
  
  // Add forward prefix
  if (forwardFormat) {
    subject = 'Fwd: ' + subject;
  }
  
  // Add emojis for personal emails
  if (type === 'personal' && addEmojis && Math.random() < 0.4) {
    const emojis = {
      'affairs': ['❤️', '😘', '😏', '🔒'],
      'jobSearches': ['💼', '🔍', '📈', '🤝'],
      'disputes': ['😠', '❗', '⚠️', '😤'],
      'financial': ['💰', '💸', '📊', '🏦']
    };
    
    // If we know the specific category, use its emojis
    if (options.category && emojis[options.category]) {
      const emoji = faker.helpers.arrayElement(emojis[options.category]);
      
      // Add emoji at beginning or end
      if (Math.random() < 0.5) {
        subject += ' ' + emoji;
      } else {
        subject = emoji + ' ' + subject;
      }
    }
  }
  
  return subject;
}

/**
 * Helper function to personalize template content
 * 
 * @param {string} template - Template with {placeholders}
 * @param {Object} context - Values to replace placeholders
 * @returns {string} Personalized content
 */
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

module.exports = {
  enhanceEmailStructure,
  enhanceSubject,
  addLanguageVariations,
  personalize
};
