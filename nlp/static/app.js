/**
 * Make Better Decisions (MBD) - Frontend Application
 * 
 * Connects to the BERT constraint analyzer API and handles the chat interface
 * for providing task recommendations based on Theory of Constraints.
 */

// API configuration
const API_BASE_URL = 'http://localhost:5001';
const API_ENDPOINTS = {
  analyze: `${API_BASE_URL}/analyze`,
  recommendations: `${API_BASE_URL}/recommendations`,
  health: `${API_BASE_URL}/health`
};

// Data storage
let availableDatasets = [];
let companyData = null;
let currentAnalysis = null;

// DOM elements
const elements = {
  departmentSelect: document.getElementById('department'),
  userSelect: document.getElementById('user'),
  datasetSelect: document.getElementById('dataset'),
  analyzeBtn: document.getElementById('analyze-btn'),
  chatMessages: document.getElementById('chat-messages'),
  userInput: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  recommendationsList: document.getElementById('recommendations-list')
};

/**
 * Initialize the application
 */
async function init() {
  try {
    // Check if API is available
    const healthResponse = await fetch(API_ENDPOINTS.health);
    
    if (!healthResponse.ok) {
      addSystemMessage('API is not available. Please check if the server is running.');
      console.error('API health check failed');
      return;
    }
    
    // Find available datasets
    await findAvailableDatasets();
    
    // Set up event listeners
    elements.datasetSelect.addEventListener('change', handleDatasetChange);
    elements.analyzeBtn.addEventListener('click', handleAnalyzeClick);
    elements.sendBtn.addEventListener('click', handleSendMessage);
    elements.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });
    
    // Add welcome message
    addSystemMessage(
      'I can help you identify your highest-impact tasks based on ' +
      'organizational constraints. Select a dataset and your details to begin.'
    );
  } catch (error) {
    console.error('Initialization error:', error);
    addSystemMessage(
      'There was an error initializing the application. ' +
      'Please check if the server is running.'
    );
  }
}

/**
 * Find available datasets in the data directory
 */
async function findAvailableDatasets() {
  // For the hackathon demo, we'll use hardcoded datasets
  // In a real implementation, this would be an API call
  const datasets = [
    {
      path: '/Users/dennishettema/Documents/Armana/Hackathon/MBD/data/mixed-scenarios/feature_priority/emails.json',
      name: 'Feature Priority Misalignment'
    },
    {
      path: '/Users/dennishettema/Documents/Armana/Hackathon/MBD/data/mixed-scenarios/marketing_interpretation/emails.json',
      name: 'Marketing Campaign Interpretation'
    },
    {
      path: '/Users/dennishettema/Documents/Armana/Hackathon/MBD/data/mixed-scenarios/roles_responsibilities/emails.json',
      name: 'Roles & Responsibilities Confusion'
    }
  ];
  
  availableDatasets = datasets;
  
  // Populate datasets dropdown
  datasets.forEach(dataset => {
    const option = document.createElement('option');
    option.value = dataset.path;
    option.textContent = dataset.name;
    elements.datasetSelect.appendChild(option);
  });
}

/**
 * Handle dataset selection change
 */
async function handleDatasetChange() {
  const datasetPath = elements.datasetSelect.value;
  
  if (!datasetPath) {
    resetCompanyData();
    return;
  }
  
  try {
    // Load the dataset to get company structure
    const response = await fetch(datasetPath);
    const data = await response.json();
    
    if (!data || !data.raw || !data.raw.company) {
      throw new Error('Invalid dataset format');
    }
    
    companyData = data.raw.company;
    
    // Populate departments dropdown
    populateDepartments();
    
    addSystemMessage(`Loaded ${getDatasetName(datasetPath)} dataset. Please select your department and name.`);
  } catch (error) {
    console.error('Error loading dataset:', error);
    addSystemMessage('Error loading the selected dataset. Please try another one.');
    resetCompanyData();
  }
}

/**
 * Reset company data and dependent dropdowns
 */
function resetCompanyData() {
  companyData = null;
  elements.departmentSelect.innerHTML = '<option value="">Select a department</option>';
  elements.userSelect.innerHTML = '<option value="">Select your name</option>';
}

/**
 * Populate departments dropdown from company data
 */
function populateDepartments() {
  if (!companyData || !companyData.departments) return;
  
  elements.departmentSelect.innerHTML = '<option value="">Select a department</option>';
  
  companyData.departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.name;
    option.textContent = dept.name;
    elements.departmentSelect.appendChild(option);
  });
  
  // Set up event listener for department changes
  elements.departmentSelect.addEventListener('change', populateUsers);
}

/**
 * Populate users dropdown based on selected department
 */
function populateUsers() {
  const selectedDept = elements.departmentSelect.value;
  
  elements.userSelect.innerHTML = '<option value="">Select your name</option>';
  
  if (!companyData || !companyData.persons) return;
  
  const filteredUsers = selectedDept 
    ? companyData.persons.filter(p => p.department === selectedDept)
    : companyData.persons;
  
  filteredUsers.forEach(person => {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = person.name;
    elements.userSelect.appendChild(option);
  });
}

/**
 * Handle analyze button click
 */
async function handleAnalyzeClick() {
  const datasetPath = elements.datasetSelect.value;
  const department = elements.departmentSelect.value;
  const userId = elements.userSelect.value;
  
  if (!datasetPath) {
    addSystemMessage('Please select a dataset to analyze.');
    return;
  }
  
  // Find the selected user's name
  const userName = userId ? findUserName(userId) : '';
  
  addUserMessage('What should I work on next?');
  
  // Show loading message
  const loadingMsgId = addSystemMessage('Analyzing organizational constraints...');
  
  try {
    // Call the API to get recommendations
    const response = await fetch(API_ENDPOINTS.recommendations, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataset_path: datasetPath,
        department,
        user_name: userName
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const result = await response.json();
    currentAnalysis = result;
    
    // Remove loading message
    removeMessage(loadingMsgId);
    
    // Add assistant response
    addAssistantMessage(result.chat_response);
    
    // Display recommendations in the panel
    displayRecommendations(result.recommendations);
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Remove loading message
    removeMessage(loadingMsgId);
    
    addSystemMessage(
      'There was an error analyzing the dataset. ' +
      'Please try again or select a different dataset.'
    );
  }
}

/**
 * Handle send message button click
 */
function handleSendMessage() {
  const message = elements.userInput.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addUserMessage(message);
  
  // Clear input
  elements.userInput.value = '';
  
  // Process the message and respond
  processUserMessage(message);
}

/**
 * Process user message and generate response
 */
function processUserMessage(message) {
  // Prepare some responses based on keywords
  const lowerMessage = message.toLowerCase();
  
  // If we haven't analyzed anything yet
  if (!currentAnalysis) {
    if (lowerMessage.includes('work on') || lowerMessage.includes('should i')) {
      addAssistantMessage(
        "I'll need to analyze your organization's constraints first. " +
        "Please select a dataset, your department, and name, then click " +
        "'Analyze Constraints'."
      );
    } else if (lowerMessage.includes('constraint') || lowerMessage.includes('bottleneck')) {
      addAssistantMessage(
        "The Theory of Constraints focuses on identifying the key bottlenecks " +
        "that limit overall system performance. I can analyze your organization's " +
        "communication patterns to identify these constraints and suggest high-impact " +
        "tasks you could work on to address them."
      );
    } else {
      addAssistantMessage(
        "I'm here to help you identify your highest-impact tasks based on " +
        "organizational constraints. To get started, please select a dataset, " +
        "your department, and name, then click 'Analyze Constraints'."
      );
    }
    return;
  }
  
  // If we have analysis results
  if (lowerMessage.includes('explain') || lowerMessage.includes('why')) {
    // Explain the first recommendation in more detail
    if (currentAnalysis.recommendations && currentAnalysis.recommendations[0]) {
      const rec = currentAnalysis.recommendations[0];
      addAssistantMessage(
        `I recommended "${rec.title}" because our BERT analysis identified a pattern of ` +
        `communication where this constraint is blocking progress in multiple projects. ` +
        `\n\nIn the Theory of Constraints, we focus on the single most limiting factor. ` +
        `By addressing this specific constraint, you'll have a much greater impact on ` +
        `overall organizational velocity than working on non-bottleneck activities.`
      );
    }
  } else if (lowerMessage.includes('how') && lowerMessage.includes('implement')) {
    // Provide implementation advice
    addAssistantMessage(
      "Implementation depends on your role and authority within the organization. " +
      "I'd suggest starting with the specific action items I recommended, and " +
      "working with key stakeholders to address the constraint systematically. " +
      "Remember that in Theory of Constraints, we follow five steps: identify the " +
      "constraint, exploit it, subordinate everything else to the constraint, " +
      "elevate the constraint, and then repeat the process for the next constraint."
    );
  } else if (lowerMessage.includes('thank')) {
    addAssistantMessage(
      "You're welcome! Let me know if you need any other insights about " +
      "organizational constraints or high-impact tasks. I'm here to help " +
      "you make better decisions."
    );
  } else {
    // Default response referencing the recommendations
    addAssistantMessage(
      "Based on our constraint analysis, I still believe the recommendations " +
      "I provided would be your highest-impact focus areas. Would you like " +
      "me to explain any specific recommendation in more detail, or provide " +
      "guidance on implementation strategies?"
    );
  }
}

/**
 * Add a system message to the chat
 */
function addSystemMessage(text) {
  const messageId = 'msg-' + Date.now();
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = 'message system';
  messageDiv.innerHTML = `<p>${text}</p>`;
  
  elements.chatMessages.appendChild(messageDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  
  return messageId;
}

/**
 * Add a user message to the chat
 */
function addUserMessage(text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.innerHTML = `<p>${text}</p>`;
  
  elements.chatMessages.appendChild(messageDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * Add an assistant message to the chat
 */
function addAssistantMessage(text) {
  // Replace markdown bold with HTML bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace markdown lists with HTML lists
  text = text.replace(/\n\s*-\s+(.*)/g, '\n<li>$1</li>');
  text = text.replace(/<li>.*?<\/li>/gs, (match) => `<ul>${match}</ul>`);
  
  // Replace newlines with breaks
  text = text.replace(/\n/g, '<br>');
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  messageDiv.innerHTML = `<p>${text}</p>`;
  
  elements.chatMessages.appendChild(messageDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * Remove a message by ID
 */
function removeMessage(messageId) {
  const message = document.getElementById(messageId);
  if (message) message.remove();
}

/**
 * Display recommendations in the panel
 */
function displayRecommendations(recommendations) {
  elements.recommendationsList.innerHTML = '';
  
  if (!recommendations || recommendations.length === 0) {
    elements.recommendationsList.innerHTML = 
      '<p>No recommendations available. Try analyzing another dataset.</p>';
    return;
  }
  
  recommendations.forEach(rec => {
    const div = document.createElement('div');
    div.className = 'recommendation';
    
    div.innerHTML = `
      <h4>${rec.title}</h4>
      <p>${rec.description}</p>
      <div class="actions">
        <h5>Suggested Actions:</h5>
        <ul>
          ${rec.suggested_actions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
    `;
    
    elements.recommendationsList.appendChild(div);
  });
}

/**
 * Find dataset name by path
 */
function getDatasetName(path) {
  const dataset = availableDatasets.find(d => d.path === path);
  return dataset ? dataset.name : 'Unknown';
}

/**
 * Find user name by ID
 */
function findUserName(userId) {
  if (!companyData || !companyData.persons) return '';
  
  const person = companyData.persons.find(p => p.id === userId);
  return person ? person.name : '';
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
