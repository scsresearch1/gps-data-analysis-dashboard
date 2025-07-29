import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

// Enhanced scientific theme with vibrant colors and better typography
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff', // Bright cyan
      light: '#4ddbff',
      dark: '#0099cc',
    },
    secondary: {
      main: '#ff6b35', // Vibrant orange
      light: '#ff8a65',
      dark: '#e65100',
    },
    background: {
      default: '#0a0e1a', // Deep space blue
      paper: '#1a2332', // Rich dark blue
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e7ff', // Brighter secondary text
    },
    success: {
      main: '#00ff88', // Bright green
    },
    warning: {
      main: '#ffaa00', // Bright yellow
    },
    error: {
      main: '#ff4757', // Bright red
    },
    info: {
      main: '#3742fa', // Bright blue
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      color: '#00d4ff',
      textShadow: '0 0 25px rgba(0, 212, 255, 0.6)',
      fontSize: '3.5rem',
      letterSpacing: '0.02em',
    },
    h2: {
      fontWeight: 700,
      color: '#00d4ff',
      textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
      fontSize: '3rem',
      letterSpacing: '0.01em',
    },
    h3: {
      fontWeight: 600,
      color: '#00d4ff',
      fontSize: '2.5rem',
      letterSpacing: '0.01em',
    },
    h4: {
      fontWeight: 600,
      color: '#00d4ff',
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 500,
      color: '#ffffff',
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 500,
      color: '#ffffff',
      fontSize: '1.25rem',
    },
    body1: {
      color: '#e0e7ff',
      fontSize: '1.1rem',
      fontWeight: 400,
    },
    body2: {
      color: '#b8c5d6',
      fontSize: '1rem',
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(26, 35, 50, 0.95)',
          border: '2px solid rgba(0, 212, 255, 0.3)',
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 212, 255, 0.1)',
          '&:hover': {
            border: '2px solid rgba(0, 212, 255, 0.5)',
            boxShadow: '0 16px 50px rgba(0, 212, 255, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(26, 35, 50, 0.95)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1.1rem',
          boxShadow: '0 6px 25px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 212, 255, 0.5)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #00d4ff 0%, #0099cc 100%)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #00e5ff 0%, #00b3e6 100%)',
            border: '1px solid rgba(0, 212, 255, 0.5)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 212, 255, 0.5)',
          color: '#00d4ff',
          '&:hover': {
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            fontSize: '1.1rem',
            '& fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.4)',
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.7)',
              borderWidth: 2,
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00d4ff',
              borderWidth: 2,
            },
            '& input': {
              color: '#ffffff',
              fontSize: '1.1rem',
              fontWeight: 500,
            },
            '& label': {
              color: '#b8c5d6',
              fontSize: '1rem',
              fontWeight: 500,
            },
            '& label.Mui-focused': {
              color: '#00d4ff',
              fontSize: '1rem',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0a0e1a 0%, #1a2332 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid rgba(0, 212, 255, 0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.9rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '1rem',
          fontWeight: 500,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-h1, &.MuiTypography-h2, &.MuiTypography-h3': {
            background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 10,
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (success) => {
    setIsAuthenticated(success);
    if (success) {
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard onLogout={handleLogout} /> : 
              <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
