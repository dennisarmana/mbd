import React from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Paper 
} from '@mui/material';

/**
 * Main layout component that provides consistent structure across the application
 */
interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title = 'Email Generator' 
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper sx={{ p: 3 }}>
          {children}
        </Paper>
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          p: 2, 
          mt: 'auto', 
          backgroundColor: (theme) => theme.palette.grey[200] 
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          MBD Email Generator - {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default MainLayout;
