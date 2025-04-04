import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { SaveAlt as DownloadIcon } from '@mui/icons-material';
import ScenarioForm from './form/ScenarioForm';
import EmailPreview from './preview/EmailPreview';
import DatasetBrowser from './preview/DatasetBrowser';
import { 
  ScenarioFormData, 
  PreviewData, 
  GenerationStatus, 
  EmailPreview as EmailPreviewType 
} from '../types';
import { 
  generatePreview, 
  generateFullDataset 
} from '../services/generatorService';

/**
 * Main container component for the email generator
 * Manages the workflow between configuration, preview, and generation
 */
const GeneratorContainer: React.FC = () => {
  // State for the different steps of the generation process
  const [activeStep, setActiveStep] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [fullDataset, setFullDataset] = useState<EmailPreviewType[] | null>(null);
  const [formValues, setFormValues] = useState<ScenarioFormData | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: 'idle',
    progress: 0
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'info' | 'warning' | 'error'
  });
  
  // Handler for form submission to generate preview
  const handlePreview = async (formData: ScenarioFormData) => {
    try {
      setFormValues(formData);
      setGenerationStatus({ status: 'generating', progress: 0 });
      const preview = await generatePreview(formData);
      setPreviewData(preview);
      
      // Generate full dataset (this would normally be done in the generate step,
      // but for our prototype we'll use the same data)
      setFullDataset(preview.emails);
      
      setGenerationStatus({ status: 'idle', progress: 0 });
      setTabIndex(1); // Switch to preview tab
    } catch (error) {
      console.error('Error generating preview:', error);
      setGenerationStatus({ 
        status: 'error', 
        progress: 0,
        message: 'Failed to generate preview'
      });
      setNotification({
        open: true,
        message: 'Failed to generate preview. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Handler for generating full dataset
  const handleGenerate = async () => {
    if (!previewData || !formValues) return;
    
    try {
      setGenerationStatus({ status: 'generating', progress: 0 });
      setActiveStep(1); // Move to generation step
      
      // In a real application, this would make a backend call and potentially
      // poll for status until complete. For this prototype, we'll simulate progress.
      const intervalId = setInterval(() => {
        setGenerationStatus(prev => {
          const newProgress = Math.min(prev.progress + 10, 100);
          if (newProgress >= 100) {
            clearInterval(intervalId);
            // Once generation is complete, we'd normally fetch the full dataset
            // from the backend, but for now we'll just use our preview data
            setActiveStep(2); // Move to download step
            return { 
              status: 'complete', 
              progress: 100,
              outputPath: 'dataset.json'
            };
          }
          return { ...prev, progress: newProgress };
        });
      }, 500);
      
    } catch (error) {
      console.error('Error generating dataset:', error);
      setGenerationStatus({ 
        status: 'error', 
        progress: 0,
        message: 'Failed to generate dataset'
      });
      setNotification({
        open: true,
        message: 'Failed to generate dataset. Please try again.',
        severity: 'error'
      });
    }
  };
  
  // Handler for downloading the dataset
  const handleDownload = () => {
    if (!fullDataset || !formValues) return;
    
    // Create a data structure for the full dataset
    const datasetObject = {
      generationInfo: {
        scenarioName: formValues.scenario.name,
        scenarioDescription: formValues.scenario.description,
        complexity: formValues.scenario.complexity_level,
        timestamp: new Date().toISOString(),
        emailCount: fullDataset.length
      },
      company: {
        name: formValues.generation.companyOptions.name || 'Company',
        domain: formValues.generation.companyOptions.domain || 'company.com',
      },
      emails: fullDataset
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(datasetObject, null, 2);
    
    // Create a blob and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formValues.scenario.id || 'scenario'}_dataset.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setNotification({
      open: true,
      message: 'Dataset downloaded successfully!',
      severity: 'success'
    });
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Handle tab change between configure and preview
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  
  // Reset the whole process
  const handleReset = () => {
    setActiveStep(0);
    setTabIndex(0);
    setGenerationStatus({ status: 'idle', progress: 0 });
  };
  
  return (
    <Box>
      {/* Stepper to show progress through the generation workflow */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step key="Configure">
          <StepLabel>Configure</StepLabel>
        </Step>
        <Step key="Generate">
          <StepLabel>Generate</StepLabel>
        </Step>
        <Step key="Download">
          <StepLabel>Download</StepLabel>
        </Step>
      </Stepper>
      
      {/* Main content area */}
      <Box>
        {activeStep === 0 && (
          <Box sx={{ width: '100%', mt: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabIndex} 
                onChange={handleTabChange}
              >
                <Tab label="Configure" />
                <Tab label="Preview" disabled={!previewData} />
              </Tabs>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              {/* Tab 1: Configuration Form */}
              {tabIndex === 0 && (
                <ScenarioForm 
                  onSubmit={handleGenerate} 
                  onPreview={handlePreview}
                  isGenerating={generationStatus.status === 'generating'}
                />
              )}
              
              {/* Tab 2: Preview */}
              {tabIndex === 1 && previewData && (
                <Box>
                  <EmailPreview 
                    emails={previewData.emails} 
                    stats={previewData.stats}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={generationStatus.status === 'generating'}
                      onClick={handleGenerate}
                    >
                      Generate Full Dataset
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* Generation in progress */}
        {activeStep === 1 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Generating Email Dataset
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress 
                variant="determinate" 
                value={generationStatus.progress} 
                size={80}
                thickness={4}
                sx={{ mb: 2 }}
              />
              <Typography variant="h6">
                {generationStatus.progress}% Complete
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {generationStatus.message || 'Processing your configuration...'}
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* Dataset ready with browser and download options */}
        {activeStep === 2 && fullDataset && (
          <Box sx={{ p: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your email dataset has been generated successfully!
            </Alert>
            
            <Tabs 
              value={tabIndex} 
              onChange={handleTabChange}
              sx={{ mb: 2 }}
            >
              <Tab label="Dataset Info" />
              <Tab label="Browse Data" />
            </Tabs>
            
            {tabIndex === 0 && (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h5" gutterBottom>
                  Dataset Ready
                </Typography>
                
                <Typography paragraph>
                  Your email dataset has been generated and is ready for download.
                  The dataset contains {fullDataset.length} emails based on the "{formValues?.scenario.name}" scenario.
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<DownloadIcon />}
                    sx={{ mr: 2 }}
                    onClick={handleDownload}
                  >
                    Download Dataset
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleReset}
                  >
                    Create Another Dataset
                  </Button>
                </Box>
              </Box>
            )}
            
            {tabIndex === 1 && (
              <DatasetBrowser 
                emails={fullDataset} 
                onDownload={handleDownload}
              />
            )}
          </Box>
        )}
      </Box>
      
      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GeneratorContainer;
