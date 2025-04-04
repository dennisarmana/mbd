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
  
  // Generate fake preview data based on form values
  const sampleCount = 5;
  const emails = [];
  
  for (let i = 0; i < sampleCount; i++) {
    const fromDomain = formData.generation.companyOptions.domain || 'company.com';
    const fromName = `user${i + 1}@${fromDomain}`;
    const subject = `Sample email ${i + 1} - ${formData.scenario.name}`;
    
    // Calculate sample date within timespan
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-15');
    const randomDate = new Date(
      startDate.getTime() + 
      Math.random() * (endDate.getTime() - startDate.getTime())
    );
    
    emails.push({
      id: `preview_${i}`,
      from: fromName,
      to: [`recipient${i + 1}@${fromDomain}`, `recipient${i + 2}@${fromDomain}`],
      subject,
      timestamp: randomDate.toISOString(),
      preview: `This is a preview of an email that would be generated based on your 
scenario configuration. The actual content will contain realistic business 
communications with embedded miscommunication patterns related to 
"${formData.scenario.description}"`
    });
  }
  
  // Extract values with defaults to handle undefined values
  const threadCount = formData.generation.emailOptions.threadCount || 15;
  const emailsPerThreadMin = formData.generation.emailOptions.emailsPerThread?.min || 3;
  const emailsPerThreadMax = formData.generation.emailOptions.emailsPerThread?.max || 7;
  const departmentCount = formData.generation.companyOptions.departmentCount || 5;
  const employeesPerDeptMin = formData.generation.companyOptions.employeesPerDepartment?.min || 5;
  const employeesPerDeptMax = formData.generation.companyOptions.employeesPerDepartment?.max || 15;
  
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
