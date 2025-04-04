import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Avatar,
  useTheme
} from '@mui/material';
import { EmailPreview as EmailPreviewType } from '../../types';

/**
 * Props for single email preview item
 */
interface EmailItemProps {
  email: EmailPreviewType;
}

/**
 * Displays a single email in preview format
 */
const EmailItem: React.FC<EmailItemProps> = ({ email }) => {
  const theme = useTheme();
  const dateObject = new Date(email.timestamp);
  
  // Get initials from sender name for avatar
  const senderName = email.from.split('@')[0].replace(/[^a-zA-Z ]/g, ' ');
  const initials = senderName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {initials}
          </Avatar>
        }
        title={email.from}
        subheader={`${dateObject.toLocaleDateString()} ${dateObject.toLocaleTimeString()}`}
      />
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {email.subject}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" component="span" sx={{ mr: 1 }}>
            To:
          </Typography>
          {email.to.map((recipient, index) => (
            <Chip 
              key={index} 
              label={recipient} 
              size="small" 
              sx={{ mr: 0.5, mb: 0.5 }} 
            />
          ))}
        </Box>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {email.preview}
        </Typography>
      </CardContent>
    </Card>
  );
};

/**
 * Props for email preview component
 */
interface EmailPreviewProps {
  emails: EmailPreviewType[];
  stats: {
    emailCount: number;
    threadCount: number;
    departmentCount: number;
    personCount: number;
  };
}

/**
 * Displays a preview of generated emails
 */
const EmailPreview: React.FC<EmailPreviewProps> = ({ emails, stats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Preview of Generated Emails
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} display="grid" gridTemplateColumns="repeat(12, 1fr)">
          <Grid sx={{ gridColumn: { xs: 'span 6', sm: 'span 3' } }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{stats.emailCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Emails
              </Typography>
            </Box>
          </Grid>
          <Grid sx={{ gridColumn: { xs: 'span 6', sm: 'span 3' } }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{stats.threadCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Email Threads
              </Typography>
            </Box>
          </Grid>
          <Grid sx={{ gridColumn: { xs: 'span 6', sm: 'span 3' } }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{stats.departmentCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Departments
              </Typography>
            </Box>
          </Grid>
          <Grid sx={{ gridColumn: { xs: 'span 6', sm: 'span 3' } }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{stats.personCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Team Members
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="subtitle1" gutterBottom>
        Sample Emails (showing {emails.length} of {stats.emailCount})
      </Typography>
      
      <Box>
        {emails.map((email) => (
          <EmailItem key={email.id} email={email} />
        ))}
      </Box>
      
      <Typography variant="caption" color="text.secondary">
        Note: This is a small sample of what will be generated. The full dataset 
        will contain more varied content and complete communication threads.
      </Typography>
    </Box>
  );
};

export default EmailPreview;
