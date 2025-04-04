import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  TextField, 
  Button, 
  Grid, 
  Paper, 
  FormControlLabel,
  Switch,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import { ScenarioFormData } from '../../types';

/**
 * Default values for scenario form
 */
const initialValues: ScenarioFormData = {
  scenario: {
    id: '',
    name: '',
    description: '',
    complexity_level: 5,
    key_issues: [''],
  },
  generation: {
    companyOptions: {
      name: '',
      domain: '',
      departmentCount: 6,
      employeesPerDepartment: {
        min: 5,
        max: 15
      }
    },
    emailOptions: {
      threadCount: 20,
      emailsPerThread: {
        min: 5,
        max: 10
      },
      timeSpan: {
        start: new Date('2025-01-01'),
        end: new Date('2025-02-01')
      },
      chanceOfCC: 0.4,
      maxCCRecipients: 3
    },
    autoGenerate: true
  }
};

/**
 * Validation schema for the form
 */
const validationSchema = Yup.object().shape({
  scenario: Yup.object({
    name: Yup.string().required('Scenario name is required'),
    description: Yup.string().required('Description is required'),
    complexity_level: Yup.number()
      .min(1, 'Min complexity is 1')
      .max(10, 'Max complexity is 10')
      .required('Complexity level is required')
  }),
  generation: Yup.object({
    companyOptions: Yup.object({
      departmentCount: Yup.number()
        .min(2, 'At least 2 departments')
        .max(15, 'Maximum 15 departments')
    }),
    emailOptions: Yup.object({
      threadCount: Yup.number()
        .min(5, 'At least 5 threads')
    })
  })
});

/**
 * Calculate estimated email count based on form values
 */
const calculateEstimatedEmails = (values: ScenarioFormData): number => {
  const { threadCount, emailsPerThread } = values.generation.emailOptions;
  if (!threadCount || !emailsPerThread) return 0;
  
  const avgEmailsPerThread = (emailsPerThread.min + emailsPerThread.max) / 2;
  return Math.round(threadCount * avgEmailsPerThread);
};

/**
 * Props for the ScenarioForm component
 */
interface ScenarioFormProps {
  onSubmit: (values: ScenarioFormData) => void;
  onPreview: (values: ScenarioFormData) => void;
  isGenerating?: boolean;
}

/**
 * Form component for configuring email scenarios
 */
const ScenarioForm: React.FC<ScenarioFormProps> = ({ 
  onSubmit, 
  onPreview,
  isGenerating = false 
}) => {
  // Predefined scenario templates
  const scenarioTemplates = [
    {
      id: 'marketing_campaign_interpretation',
      name: 'Marketing Campaign Interpretation',
      description: 'Different team members have varied understandings of campaign goals',
      complexity_level: 1,
      key_issues: [
        'Ambiguous campaign objectives',
        'Unclear success metrics',
        'Different interpretations of target audience'
      ]
    },
    {
      id: 'product_launch_timeline',
      name: 'Product Launch Timeline',
      description: 'Marketing and product teams disagree on the launch date',
      complexity_level: 2,
      key_issues: [
        'Different understanding of "ready to launch"',
        'Dependency tracking issues',
        'Miscommunication about approval processes'
      ]
    },
    // Only showing 2 templates for brevity
  ];

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleTemplateChange = (event: React.ChangeEvent<{ value: unknown }>, 
    setFieldValue: any) => {
    const templateId = event.target.value as string;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = scenarioTemplates.find(t => t.id === templateId);
      if (template) {
        setFieldValue('scenario.id', template.id);
        setFieldValue('scenario.name', template.name);
        setFieldValue('scenario.description', template.description);
        setFieldValue('scenario.complexity_level', template.complexity_level);
        setFieldValue('scenario.key_issues', template.key_issues);
      }
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Configure Email Scenario
      </Typography>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          onSubmit(values);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue
        }) => (
          <Form>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scenario Details
              </Typography>
              
              <Grid container spacing={3} display="grid" gridTemplateColumns="repeat(12, 1fr)">
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    select
                    fullWidth
                    label="Use Template (Optional)"
                    value={selectedTemplate}
                    onChange={(e: any) => handleTemplateChange(e, setFieldValue)}
                    helperText="Select a predefined scenario or create your own"
                  >
                    <MenuItem value="">
                      <em>Create Custom Scenario</em>
                    </MenuItem>
                    {scenarioTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} (Complexity: {template.complexity_level})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <TextField
                    fullWidth
                    name="scenario.name"
                    label="Scenario Name"
                    value={values.scenario.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.scenario?.name && Boolean(errors.scenario?.name)}
                    helperText={touched.scenario?.name && errors.scenario?.name as string}
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <TextField
                    fullWidth
                    name="scenario.id"
                    label="Scenario ID"
                    value={values.scenario.id || values.scenario.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '_')}
                    onChange={handleChange}
                    helperText="Auto-generated from name if left blank"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="scenario.description"
                    label="Description"
                    value={values.scenario.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.scenario?.description && 
                      Boolean(errors.scenario?.description)}
                    helperText={touched.scenario?.description && 
                      errors.scenario?.description as string}
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Typography gutterBottom>
                    Complexity Level: {values.scenario.complexity_level}
                  </Typography>
                  <Slider
                    name="scenario.complexity_level"
                    value={values.scenario.complexity_level}
                    onChange={(_, value) => {
                      setFieldValue('scenario.complexity_level', value);
                      
                      // Adjust thread count based on complexity
                      let newThreadCount = 20;
                      const numValue = Number(value);
                      if (numValue <= 3) {
                        newThreadCount = 25 + (numValue * 5);
                      } else if (numValue <= 6) {
                        newThreadCount = 40 + (numValue * 5);
                      } else {
                        newThreadCount = 50 + (numValue * 10);
                      }
                      setFieldValue('generation.emailOptions.threadCount', 
                        newThreadCount);
                      
                      // Adjust email per thread based on complexity
                      let minEmails = 3;
                      let maxEmails = 7;
                      if (value <= 3) {
                        minEmails = 4;
                        maxEmails = 7;
                      } else if (value <= 6) {
                        minEmails = 5;
                        maxEmails = 9;
                      } else {
                        minEmails = 7;
                        maxEmails = 15;
                      }
                      setFieldValue('generation.emailOptions.emailsPerThread.min', 
                        minEmails);
                      setFieldValue('generation.emailOptions.emailsPerThread.max', 
                        maxEmails);
                    }}
                    min={1}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Higher complexity = more departments, people, and emails
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Generation Options
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.generation.autoGenerate}
                      onChange={(e) => {
                        setFieldValue('generation.autoGenerate', e.target.checked);
                      }}
                      name="generation.autoGenerate"
                      color="primary"
                    />
                  }
                  label="Auto-generate names & structure"
                />
              </Box>

              <Grid container spacing={3} display="grid" gridTemplateColumns="repeat(12, 1fr)">
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <TextField
                    fullWidth
                    name="generation.companyOptions.name"
                    label="Company Name (Optional)"
                    value={values.generation.companyOptions.name}
                    onChange={handleChange}
                    disabled={values.generation.autoGenerate}
                    helperText={values.generation.autoGenerate ? 
                      "Will be auto-generated" : "Leave blank to auto-generate"}
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <TextField
                    fullWidth
                    name="generation.companyOptions.domain"
                    label="Email Domain (Optional)"
                    value={values.generation.companyOptions.domain}
                    onChange={handleChange}
                    disabled={values.generation.autoGenerate}
                    helperText={values.generation.autoGenerate ? 
                      "Will be auto-generated" : "E.g., company.com"}
                  />
                </Grid>

                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography gutterBottom>
                    Department Count: {values.generation.companyOptions.departmentCount}
                  </Typography>
                  <Slider
                    name="generation.companyOptions.departmentCount"
                    value={values.generation.companyOptions.departmentCount}
                    onChange={(_, value) => {
                      setFieldValue('generation.companyOptions.departmentCount', value);
                    }}
                    min={2}
                    max={15}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography gutterBottom>
                    Employees Per Department
                  </Typography>
                  <Slider
                    value={[
                      values.generation.companyOptions.employeesPerDepartment?.min || 5,
                      values.generation.companyOptions.employeesPerDepartment?.max || 15
                    ]}
                    onChange={(_, value) => {
                      const [min, max] = value as number[];
                      setFieldValue(
                        'generation.companyOptions.employeesPerDepartment.min', 
                        min
                      );
                      setFieldValue(
                        'generation.companyOptions.employeesPerDepartment.max', 
                        max
                      );
                    }}
                    min={2}
                    max={25}
                    step={1}
                    valueLabelDisplay="auto"
                  />
                </Grid>

                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Email Volume Settings
                  </Typography>
                </Grid>

                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography gutterBottom>
                    Thread Count: {values.generation.emailOptions.threadCount}
                  </Typography>
                  <Slider
                    name="generation.emailOptions.threadCount"
                    value={values.generation.emailOptions.threadCount}
                    onChange={(_, value) => {
                      setFieldValue('generation.emailOptions.threadCount', value);
                    }}
                    min={5}
                    max={200}
                    step={5}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                
                <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                  <Typography gutterBottom>
                    Emails Per Thread
                  </Typography>
                  <Slider
                    value={[
                      values.generation.emailOptions.emailsPerThread?.min || 3,
                      values.generation.emailOptions.emailsPerThread?.max || 7
                    ]}
                    onChange={(_, value) => {
                      const [min, max] = value as number[];
                      setFieldValue('generation.emailOptions.emailsPerThread.min', min);
                      setFieldValue('generation.emailOptions.emailsPerThread.max', max);
                    }}
                    min={2}
                    max={20}
                    step={1}
                    valueLabelDisplay="auto"
                  />
                </Grid>

                <Grid sx={{ gridColumn: 'span 12' }}>
                  <Alert severity="info">
                    Estimated total emails: {calculateEstimatedEmails(values)} emails
                    across {values.generation.emailOptions.threadCount} threads with 
                    {' '}{values.generation.companyOptions.departmentCount} departments
                  </Alert>
                </Grid>
              </Grid>
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                onClick={() => onPreview(values)}
                disabled={isGenerating}
              >
                Preview Sample
              </Button>
              
              <Button 
                variant="contained" 
                color="primary" 
                type="submit"
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Dataset'}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default ScenarioForm;
