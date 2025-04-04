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
import ScenarioForm from './form/ScenarioForm';
import EmailPreview from './preview/EmailPreview';
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
      setGenerationStatus({ status: 'generating', progress: 0 });
      const preview = await generatePreview(formData);
      setPreviewData(preview);
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
  
  // Handler for form submission to generate full dataset
  const handleGenerateDataset = async (formData: ScenarioFormData) => {
    try {
      setGenerationStatus({ status: 'generating', progress: 0 });
      setActiveStep(1); // Move to generation step
      
      // Start the generation process
      const status = await generateFullDataset(formData);
      setGenerationStatus(status);
      
      if (status.status === 'complete') {
        setActiveStep(2); // Move to completion step
        setNotification({
          open: true,
          message: 'Dataset generated successfully!',
          severity: 'success'
        });
      } else if (status.status === 'error') {
        setNotification({
          open: true,
          message: status.message || 'Error generating dataset',
          severity: 'error'
        });
      }
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
  
  // Define steps for the generation process
  const steps = ['Configure', 'Generate', 'Download'];
  
  return (
    <Box>
      {/* Stepper to show progress through the generation workflow */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Main content area */}
      <Box>
        {activeStep === 0 && (
          <Box>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Configure" />
                <Tab 
                  label="Preview" 
                  disabled={!previewData}
                />
              </Tabs>
              
              <Divider />
              
              <Box sx={{ p: 3 }}>
                {tabIndex === 0 ? (
                  <ScenarioForm 
                    onSubmit={handleGenerateDataset}
                    onPreview={handlePreview}
                    isGenerating={generationStatus.status === 'generating'}
                  />
                ) : (
                  previewData && (
                    <Box>
                      <EmailPreview 
                        emails={previewData.emails}
                        stats={previewData.stats}
                      />
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <Button 
                          variant="outlined" 
                          onClick={() => setTabIndex(0)}
                        >
                          Back to Configure
                        </Button>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={() => {
                            // We would use the last form data here
                            // For now, just move to the next step
                            setActiveStep(1);
                            setGenerationStatus({ status: 'generating', progress: 10 });
                            
                            // Simulate generation progress
                            let progress = 10;
                            const interval = setInterval(() => {
                              progress += 10;
                              setGenerationStatus({ 
                                status: 'generating', 
                                progress 
                              });
                              
                              if (progress >= 100) {
                                clearInterval(interval);
                                setGenerationStatus({ 
                                  status: 'complete', 
                                  progress: 100,
                                  outputPath: '/datasets/sample'
                                });
                                setActiveStep(2);
                              }
                            }, 500);
                          }}
                        >
                          Generate Full Dataset
                        </Button>
                      </Box>
                    </Box>
                  )
                )}
              </Box>
            </Paper>
          </Box>
        )}
        
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
        
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your email dataset has been generated successfully!
            </Alert>
            
            <Typography variant="h5" gutterBottom>
              Dataset Ready
            </Typography>
            
            <Typography paragraph>
              Your email dataset has been generated and is ready for download.
              The dataset contains the emails, threads, and company information
              according to your configuration.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                sx={{ mr: 2 }}
                onClick={() => {
                  // In a real implementation, this would trigger a download
                  setNotification({
                    open: true,
                    message: 'Download started!',
                    severity: 'success'
                  });
                }}
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
