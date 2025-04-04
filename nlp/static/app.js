/**
 * Make Better Decisions (MBD) - Frontend Application
 * 
 * Connects to the BERT constraint analyzer API and handles the chat interface
 * for providing task recommendations based on Theory of Constraints.
 * 
 * Enhanced with data visualization and improved recommendation filtering.
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
let constraintChart = null;

// DOM elements
const elements = {
  departmentSelect: document.getElementById('department'),
  userSelect: document.getElementById('user'),
  datasetSelect: document.getElementById('dataset'),
  analyzeBtn: document.getElementById('analyze-btn'),
  analyzeLoader: document.getElementById('analyze-loader'),
  chatMessages: document.getElementById('chat-messages'),
  userInput: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  recommendationsList: document.getElementById('recommendations-list'),
  visualizationPanel: document.getElementById('visualization-panel'),
  constraintsChart: document.getElementById('constraints-chart'),
  primaryConstraint: document.getElementById('primary-constraint').querySelector('p'),
  keyPeople: document.getElementById('key-people').querySelector('p'),
  affectedProjects: document.getElementById('affected-projects').querySelector('p'),
  filterButtons: document.querySelectorAll('.filter-btn')
};

// Hide visualization panel initially
elements.visualizationPanel.style.display = 'none';

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
  try {
    // Call the datasets API endpoint
    const response = await fetch(`${API_ENDPOINTS.health}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Simple hard-coded datasets for the hackathon demo
    // This makes the UI functional even if the API can't access the filesystem
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
    
    console.log('Datasets loaded successfully');
  } catch (error) {
    console.error('Error loading datasets:', error);
    addSystemMessage('Could not load datasets from the API. Using demo data instead.');
  }
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
    // For the demo, we'll simulate loading the dataset
    // since we may not have direct file access
    // In a real implementation, this would fetch from the actual file
    const sampleData = {
      "raw": {
        "company": {
          "name": "Acme Corp",
          "departments": [
            {"name": "Engineering", "id": "dept-1"},
            {"name": "Marketing", "id": "dept-2"},
            {"name": "Sales", "id": "dept-3"},
            {"name": "Product", "id": "dept-4"},
            {"name": "Finance", "id": "dept-5"}
          ],
          "persons": [
            {"id": "person-1", "name": "Alice Johnson", "department": "Engineering", "title": "Senior Developer"},
            {"id": "person-2", "name": "Bob Smith", "department": "Engineering", "title": "Tech Lead"},
            {"id": "person-3", "name": "Charlie Davis", "department": "Marketing", "title": "Marketing Manager"},
            {"id": "person-4", "name": "Diana Miller", "department": "Sales", "title": "Sales Director"},
            {"id": "person-5", "name": "Edward Wilson", "department": "Product", "title": "Product Manager"},
            {"id": "person-6", "name": "Fiona Rodriguez", "department": "Finance", "title": "Financial Analyst"}
          ]
        }
      }
    };
    
    // Use the sample data for the demo
    const data = sampleData;
    
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
  const departmentId = elements.departmentSelect.value;
  const userId = elements.userSelect.value;
  
  if (!datasetPath) {
    addSystemMessage('Please select a dataset to analyze.');
    return;
  }
  
  try {
    // Show loading state
    elements.analyzeBtn.disabled = true;
    elements.analyzeLoader.style.display = 'block';
    elements.analyzeBtn.querySelector('span').textContent = 'Analyzing...';
    
    addSystemMessage('Analyzing constraints in the dataset, please wait...');
    
    // Make API call to analyze the dataset
    const response = await fetch(API_ENDPOINTS.analyze, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataset_path: datasetPath,
        filter: {
          department: departmentId || null,
          user: userId || null
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    currentAnalysis = data;
    
    // Show visualization panel
    elements.visualizationPanel.style.display = 'block';
    
    // Generate initial message based on constraint analysis
    const constraintNames = Object.keys(data.constraint_scores);
    const sortedConstraints = constraintNames.sort((a, b) => {
      return data.constraint_scores[b] - data.constraint_scores[a];
    });
    
    const primaryConstraint = sortedConstraints[0];
    const primaryScore = data.constraint_scores[primaryConstraint];
    
    // Format the constraint name for display
    const formattedConstraintName = primaryConstraint
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Update key metrics
    elements.primaryConstraint.textContent = `${formattedConstraintName} (${(primaryScore * 100).toFixed(1)}%)`;
    
    // Update key people display
    if (data.key_people && Object.keys(data.key_people).length > 0) {
      const keyPeopleText = Object.entries(data.key_people)
        .map(([role, people]) => `${role}: ${people.join(', ')}`)
        .join('\n');
      elements.keyPeople.textContent = keyPeopleText;
    } else {
      elements.keyPeople.textContent = 'No key people identified';
    }
    
    // Update affected projects
    if (data.key_projects && data.key_projects.length > 0) {
      elements.affectedProjects.textContent = data.key_projects.join(', ');
    } else {
      elements.affectedProjects.textContent = 'No projects identified';
    }
    
    // Create or update the constraints chart
    createConstraintsChart(data.constraint_scores);
    
    let analysisMessage = `Based on the analysis, the primary constraint in your organization appears to be: ${formattedConstraintName} (confidence: ${(primaryScore * 100).toFixed(1)}%).\n\n`;
    
    if (data.key_people && Object.keys(data.key_people).length > 0) {
      analysisMessage += `Key people involved: `;
      Object.entries(data.key_people).forEach(([role, people], index) => {
        if (index > 0) analysisMessage += ', ';
        analysisMessage += `${role}: ${people.join(', ')}`;
      });
      analysisMessage += '.\n\n';
    }
    
    analysisMessage += `I've created a visualization of the constraint analysis and prepared personalized recommendations for you. Would you like me to explain the recommendations in more detail?`;
    
    addAssistantMessage(analysisMessage);
    
    // Display recommendations
    displayRecommendations(data.recommendations);
    
  } catch (error) {
    console.error('Analysis error:', error);
    addSystemMessage(`There was an error analyzing the dataset: ${error.message}. Please try again.`);
  } finally {
    // Reset button state
    elements.analyzeBtn.disabled = false;
    elements.analyzeLoader.style.display = 'none';
    elements.analyzeBtn.querySelector('span').textContent = 'Analyze Constraints';
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
 * Create or update the constraint visualization chart
 */
function createConstraintsChart(constraintScores) {
  // Destroy existing chart if it exists
  if (constraintChart) {
    constraintChart.destroy();
  }
  
  // Prepare data for chart
  const labels = [];
  const data = [];
  const backgroundColors = [];
  
  // Sort constraints by score
  const sortedConstraints = Object.entries(constraintScores)
    .sort((a, b) => b[1] - a[1]);
    
  // Format constraint names and prepare chart data
  sortedConstraints.forEach(([constraint, score], index) => {
    // Format the constraint name for display
    const formattedName = constraint
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    labels.push(formattedName);
    data.push(score * 100); // Convert to percentage
    
    // Use different colors for the top 3 constraints
    if (index === 0) {
      backgroundColors.push('rgba(239, 68, 68, 0.7)'); // Red for primary
    } else if (index === 1) {
      backgroundColors.push('rgba(245, 158, 11, 0.7)'); // Orange for secondary
    } else if (index === 2) {
      backgroundColors.push('rgba(249, 115, 22, 0.7)'); // Amber for tertiary
    } else {
      backgroundColors.push('rgba(100, 116, 139, 0.7)'); // Gray for others
    }
  });
  
  // Create chart
  const ctx = elements.constraintsChart.getContext('2d');
  constraintChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Constraint Impact (%)',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Impact: ${context.raw.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Impact Score (%)'
          }
        }
      }
    }
  });
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
  if (!recommendations || recommendations.length === 0) {
    elements.recommendationsList.innerHTML = '<p>No recommendations available.</p>';
    return;
  }
  
  // Clear previous recommendations
  elements.recommendationsList.innerHTML = '';
  
  // Add each recommendation to the panel
  recommendations.forEach(recommendation => {
    const recElement = document.createElement('div');
    recElement.className = 'recommendation';
    
    // Determine category for filtering
    let category = 'all';
    if (recommendation.title.toLowerCase().includes('contact') || 
        recommendation.title.toLowerCase().includes('meeting')) {
      category = 'people';
      recElement.setAttribute('data-category', 'people');
    } else if (recommendation.title.toLowerCase().includes('urgent') || 
              recommendation.title.toLowerCase().includes('immediate')) {
      category = 'immediate';
      recElement.setAttribute('data-category', 'immediate');
    } else if (recommendation.title.toLowerCase().includes('process') || 
              recommendation.title.toLowerCase().includes('workflow')) {
      category = 'processes';
      recElement.setAttribute('data-category', 'processes');
    }
    
    recElement.setAttribute('data-category', category);
    
    const title = document.createElement('h4');
    title.textContent = recommendation.title;
    recElement.appendChild(title);
    
    const description = document.createElement('p');
    description.textContent = recommendation.description;
    recElement.appendChild(description);
    
    if (recommendation.actions && recommendation.actions.length > 0) {
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'actions';
      
      const actionsTitle = document.createElement('h5');
      actionsTitle.textContent = 'Suggested Actions:';
      actionsContainer.appendChild(actionsTitle);
      
      const actionsList = document.createElement('ul');
      recommendation.actions.forEach(action => {
        const actionItem = document.createElement('li');
        actionItem.textContent = action;
        actionsList.appendChild(actionItem);
      });
      
      actionsContainer.appendChild(actionsList);
      recElement.appendChild(actionsContainer);
    }
    
    elements.recommendationsList.appendChild(recElement);
  });
}

/**
 * Initialize filter buttons for recommendations
 */
function initFilterButtons() {
  // Add event listeners to filter buttons
  elements.filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      elements.filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Get filter category
      const filterCategory = button.getAttribute('data-filter');
      
      // Filter recommendations
      const recommendations = document.querySelectorAll('.recommendation');
      recommendations.forEach(rec => {
        if (filterCategory === 'all' || rec.getAttribute('data-category') === filterCategory) {
          rec.style.display = 'block';
        } else {
          rec.style.display = 'none';
        }
      });
    });
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
document.addEventListener('DOMContentLoaded', () => {
  init();
  initFilterButtons();
});
