import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import MainLayout from './layouts/MainLayout';
import GeneratorContainer from './components/GeneratorContainer';

/**
 * Main application component for the Email Generator UI
 */
const App: React.FC = () => {
  // Create a responsive theme with consistent styling
  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#f5f5f5',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,
      h5: {
        fontWeight: 500,
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout title="MBD Email Generator">
        <GeneratorContainer />
      </MainLayout>
    </ThemeProvider>
  );
};

export default App;
