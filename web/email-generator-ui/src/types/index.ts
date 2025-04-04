/**
 * Type definitions for the email generator application
 */

/**
 * Scenario configuration
 */
export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  complexity_level: number;
  key_issues?: string[];
}

/**
 * Department structure
 */
export interface Department {
  id: string;
  name: string;
  parent_department?: string | null;
}

/**
 * Person/employee structure
 */
export interface Person {
  id: string;
  name: string;
  email: string;
  department_id: string;
  role: string;
  boss_id?: string | null;
  communication_style?: 'formal' | 'casual' | 'direct' | 'verbose' | 'technical' | 'diplomatic';
}

/**
 * Company structure
 */
export interface Company {
  name: string;
  domain: string;
  departments: Department[];
  persons: Person[];
}

/**
 * Options for generating emails
 */
export interface EmailGenerationOptions {
  threadCount?: number;
  emailsPerThread?: {
    min: number;
    max: number;
  };
  timeSpan?: {
    start: Date;
    end: Date;
  };
  chanceOfCC?: number;
  maxCCRecipients?: number;
}

/**
 * Options for generating company structure
 */
export interface CompanyGenerationOptions {
  name?: string;
  domain?: string;
  departmentCount?: number;
  employeesPerDepartment?: {
    min: number;
    max: number;
  };
}

/**
 * Form data for scenario generator
 */
export interface ScenarioFormData {
  scenario: {
    id: string;
    name: string;
    description: string;
    complexity_level: number;
    key_issues: string[];
  };
  generation: {
    companyOptions: CompanyGenerationOptions;
    emailOptions: EmailGenerationOptions;
    autoGenerate: boolean;
  };
}

/**
 * Generated preview data
 */
export interface PreviewData {
  emails: EmailPreview[];
  stats: {
    emailCount: number;
    threadCount: number;
    departmentCount: number;
    personCount: number;
  };
}

/**
 * Email preview data
 * 
 * Contains all information about a single email in the preview dataset
 */
export interface EmailPreview {
  /** Unique identifier for the email */
  id: string;
  
  /** Thread identifier this email belongs to */
  threadId?: string;
  
  /** Email address of the sender */
  from: string;
  
  /** Name of the sender */
  fromName?: string;
  
  /** Job title of the sender */
  fromTitle?: string;
  
  /** Department of the sender */
  fromDepartment?: string;
  
  /** Email addresses of recipients */
  to: string[];
  
  /** Names of recipients */
  toNames?: string[];
  
  /** Email subject line */
  subject: string;
  
  /** ISO timestamp when the email was sent */
  timestamp: string;
  
  /** Short preview text of the email body */
  preview: string;
  
  /** Full email body text */
  body?: string;
  
  /** ID of the email this is replying to, if any */
  replyTo?: string | null;
}

/**
 * Generation status
 */
export interface GenerationStatus {
  status: 'idle' | 'generating' | 'complete' | 'error';
  progress: number;
  message?: string;
  outputPath?: string;
}
