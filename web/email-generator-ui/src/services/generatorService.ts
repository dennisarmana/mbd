/**
 * Generator Service - Communicates with the backend generator
 */
import axios from 'axios';
import { ScenarioFormData, PreviewData, GenerationStatus } from '../types';

/**
 * Base configuration for API requests
 */
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Generate a preview of emails based on form configuration
 * @param formData The scenario configuration data
 * @returns A preview of generated emails and statistics
 */
export const generatePreview = async (
  formData: ScenarioFormData
): Promise<PreviewData> => {
  // This is for demonstration purposes
  // In production, replace with actual API call to backend
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Extract values with defaults to handle undefined values
  const threadCount = Math.min(formData.generation.emailOptions.threadCount || 15, 2); // Limit to 2 threads for preview
  const emailsPerThread = 3;
  const emailsPerThreadMin = formData.generation.emailOptions.emailsPerThread?.min || 3;
  const emailsPerThreadMax = formData.generation.emailOptions.emailsPerThread?.max || 7;
  const departmentCount = Math.min(formData.generation.companyOptions.departmentCount || 5, 5);
  const employeesPerDeptMin = formData.generation.companyOptions.employeesPerDepartment?.min || 5;
  const employeesPerDeptMax = formData.generation.companyOptions.employeesPerDepartment?.max || 15;
  
  const emails = [];
  
  // Company and department generation
  const companyName = formData.generation.companyOptions.name || 'TechCorp';
  const fromDomain = formData.generation.companyOptions.domain || 'company.com';
  const departments = ['Marketing', 'Product', 'Engineering', 'Sales', 'Executive'];
  const activeDepartments = departments.slice(0, departmentCount);
  
  // Generate employee names
  const generatePersonName = () => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Riley', 'Quinn', 'Avery', 'Jamie'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Miller', 'Davis', 'Garcia', 'Wilson', 'Martinez', 'Lee'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };
  
  // Generate job titles
  const getJobTitle = (department: string) => {
    const titles: {[key: string]: string[]} = {
      'Marketing': ['Marketing Manager', 'Content Specialist', 'Brand Strategist', 'Marketing Director'],
      'Product': ['Product Manager', 'Product Owner', 'UX Researcher', 'Product Director'],
      'Engineering': ['Software Engineer', 'DevOps Specialist', 'Engineering Lead', 'CTO'],
      'Sales': ['Sales Representative', 'Account Manager', 'Sales Director', 'Business Development'],
      'Executive': ['CEO', 'CFO', 'COO', 'President']
    };
    const departmentTitles = titles[department] || ['Manager', 'Specialist', 'Director'];
    return departmentTitles[Math.floor(Math.random() * departmentTitles.length)];
  };
  
  // Generate employees
  const employees: {id: string; name: string; email: string; department: string; title: string;}[] = [];
  activeDepartments.forEach((dept, deptIndex) => {
    const employeeCount = Math.floor(Math.random() * 3) + 2; // 2-4 employees per department
    for (let i = 0; i < employeeCount; i++) {
      const name = generatePersonName();
      const email = `${name.split(' ')[0].toLowerCase()}.${name.split(' ')[1].toLowerCase()}@${fromDomain}`;
      employees.push({
        id: `person_${employees.length}`,
        name,
        email,
        department: dept,
        title: getJobTitle(dept)
      });
    }
  });
  
  // Subject line templates based on scenario complexity
  const getSubjectForScenario = (scenarioName: string, complexity: number) => {
    const lowComplexitySubjects = [
      `Project ${scenarioName} Timeline Updates`,
      `${scenarioName} Initiative - Next Steps`,
      `Clarification needed on ${scenarioName}`,
      `Quick Question about ${scenarioName} Requirements`,
      `${scenarioName} Status Update`
    ];
    
    const midComplexitySubjects = [
      `Strategy Alignment: ${scenarioName} Rollout`,
      `Cross-department Coordination for ${scenarioName}`,
      `Budget Concerns - ${scenarioName} Implementation`,
      `Resource Allocation for ${scenarioName}`,
      `${scenarioName} Project Risks Assessment`
    ];
    
    const highComplexitySubjects = [
      `Company-wide Impact Analysis: ${scenarioName}`,
      `Strategic Roadmap Revision - ${scenarioName}`,
      `${scenarioName} Integration with Current Systems`,
      `Long-term Implications of ${scenarioName} Decision`,
      `${scenarioName} Rollout: Multi-department Concerns`
    ];
    
    if (complexity <= 3) {
      return lowComplexitySubjects[Math.floor(Math.random() * lowComplexitySubjects.length)];
    } else if (complexity <= 7) {
      return midComplexitySubjects[Math.floor(Math.random() * midComplexitySubjects.length)];
    } else {
      return highComplexitySubjects[Math.floor(Math.random() * highComplexitySubjects.length)];
    }
  };
  
  // Generate realistic thread subjects
  const threadSubjects = [];
  for (let i = 0; i < threadCount; i++) {
    threadSubjects.push(getSubjectForScenario(formData.scenario.name, formData.scenario.complexity_level));
  }
  
  // Sample dates for threads
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-01-15');
  
  // Create emails organized into threads
  for (let threadIndex = 0; threadIndex < threadCount; threadIndex++) {
    const threadId = `thread_${threadIndex}`;
    const subject = threadSubjects[threadIndex];
    const threadParticipants = employees.slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 participants
    
    // Create emails within this thread
    let previousEmailId: string | null = null;
    for (let emailIndex = 0; emailIndex < emailsPerThread; emailIndex++) {
      // Determine sender and recipients
      const senderIndex = emailIndex % threadParticipants.length;
      const sender = threadParticipants[senderIndex];
      const recipients = threadParticipants.filter((_, i) => i !== senderIndex);
      
      // Calculate timestamp for this email in thread
      const threadDuration = endDate.getTime() - startDate.getTime();
      const threadStartTime = startDate.getTime() + (threadIndex / threadCount) * threadDuration;
      const emailTimeOffset = (emailIndex / emailsPerThread) * (threadDuration / threadCount);
      const emailTimestamp = new Date(threadStartTime + emailTimeOffset);
      
      // Generate contextual email content based on scenario
      const emailId: string = `preview_${emails.length}`;
      const emailSubject = emailIndex === 0 ? subject : `RE: ${subject}`;
      
      // Generate body text relevant to the scenario
      let body = '';
      if (emailIndex === 0) {
        // Initial email in thread
        body = `Hi team,\n\nI wanted to discuss the ${formData.scenario.name} initiative. Based on our last meeting, I believe we need to address the following points:\n\n`;
        
        // Add key issues from scenario or generate placeholder ones
        const issues = formData.scenario.key_issues && formData.scenario.key_issues.length > 0 ?
          formData.scenario.key_issues :
          ['Timeline concerns', 'Resource allocation', 'Success metrics', 'Stakeholder expectations'];
        
        issues.forEach((issue, i) => {
          body += `${i+1}. ${issue}\n`;
        });
        
        body += `\nPlease share your thoughts on these items.\n\nBest regards,\n${sender.name}\n${sender.title}\n${sender.department} Department`;
      } else {
        // Response to previous email - introduce some miscommunication
        const miscommunications = [
          `I think there's a misunderstanding about the ${formData.scenario.name} requirements. From my perspective, we need to focus more on...`,
          `I interpreted our discussion differently. When you mentioned the timeline, I assumed we were targeting...`,
          `I'm confused about the priorities here. Are we saying that ${formData.scenario.key_issues?.[0] || 'the main issue'} is more important than the other concerns?`,
          `I don't recall agreeing to this approach. My understanding was that we would first...`,
          `There seems to be some confusion about responsibilities. I thought the ${sender.department} team was only responsible for...`
        ];
        
        const selectedMiscommunication = miscommunications[Math.floor(Math.random() * miscommunications.length)];
        
        body = `Hi ${emailIndex === 1 ? 'team' : threadParticipants[(senderIndex + 1) % threadParticipants.length].name.split(' ')[0]},\n\n${selectedMiscommunication}\n\nCan we clarify this point before proceeding?\n\nRegards,\n${sender.name}\n${sender.title}`;
      }
      
      // Create the email object
      emails.push({
        id: emailId,
        threadId,
        from: sender.email,
        fromName: sender.name,
        fromTitle: sender.title,
        fromDepartment: sender.department,
        to: recipients.map(r => r.email),
        toNames: recipients.map(r => r.name),
        subject: emailSubject,
        timestamp: emailTimestamp.toISOString(),
        body,
        replyTo: previousEmailId,
        preview: body.substring(0, 100) + '...'
      });
      
      previousEmailId = emailId;
    }
  }
  
  // Calculate statistics based on the generated data
  
  return {
    emails,
    stats: {
      emailCount: threadCount * Math.round((emailsPerThreadMin + emailsPerThreadMax) / 2),
      threadCount: threadCount,
      departmentCount: departmentCount,
      personCount: departmentCount * Math.round((employeesPerDeptMin + employeesPerDeptMax) / 2)
    }
  };
};

/**
 * Generate full email dataset based on form configuration
 * @param formData The scenario configuration data
 * @returns The status of the generation process
 */
export const generateFullDataset = async (
  formData: ScenarioFormData
): Promise<GenerationStatus> => {
  try {
    // In a real implementation, this would call your backend API
    // For now, we'll simulate a successful response
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Return success status
    return {
      status: 'complete',
      progress: 100,
      message: 'Dataset generated successfully',
      outputPath: `/datasets/${formData.scenario.id}`
    };
  } catch (error) {
    console.error('Error generating dataset:', error);
    return {
      status: 'error',
      progress: 0,
      message: 'Error generating dataset'
    };
  }
};

/**
 * Check the status of a generation job
 * @param jobId The ID of the generation job
 * @returns The current status of the generation job
 */
export const checkGenerationStatus = async (
  jobId: string
): Promise<GenerationStatus> => {
  try {
    // In a real implementation, this would call your backend API
    // For now, we'll simulate a response
    return {
      status: 'generating',
      progress: 50,
      message: 'Generating emails...'
    };
  } catch (error) {
    console.error('Error checking generation status:', error);
    return {
      status: 'error',
      progress: 0,
      message: 'Error checking generation status'
    };
  }
};

export default {
  generatePreview,
  generateFullDataset,
  checkGenerationStatus
};
