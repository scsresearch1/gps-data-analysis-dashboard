import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { Science, Login as LoginIcon, Security, Analytics } from '@mui/icons-material';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (username === 'Admin' && password === 'Keiros@1985') {
      onLogin(true);
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #1a2332 50%, #0a0e1a 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: { xs: 2, sm: 3, md: 0 },
        margin: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box 
        maxWidth="xl" 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center',
          padding: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Box 
          container 
          spacing={{ xs: 2, sm: 3, md: 4 }} 
          sx={{ 
            height: '100%', 
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Left Side - Splash Screen (Hidden on mobile) */}
          <Box 
            item 
            xs={12} 
            md={6} 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              pr: { md: 4 },
            }}
          >
            {/* Top Flask Icon */}
            <Box
              sx={{
                position: 'relative',
                display: 'inline-block',
                mb: 4,
              }}
            >
              <Science 
                sx={{ 
                  fontSize: 120, 
                  color: '#00d4ff',
                  filter: 'drop-shadow(0 0 40px rgba(0, 212, 255, 0.8))',
                  animation: 'pulse 2s ease-in-out infinite',
                }} 
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%)',
                  animation: 'ripple 2s ease-in-out infinite',
                }}
              />
            </Box>
            
            {/* Main Title */}
            <Typography 
              variant="h1" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: '3.5rem',
                mb: 3,
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              <Box component="span" sx={{ color: '#00d4ff', textShadow: '0 0 50px rgba(0, 212, 255, 0.7)' }}>
                Keiros
              </Box>
              <Box component="span" sx={{ 
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)', 
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(255, 107, 53, 0.7)',
              }}>
                {' '}Data Analysis
              </Box>
            </Typography>
            
            {/* Subtitle */}
            <Typography 
              variant="h4" 
              color="text.secondary"
              sx={{ 
                mb: 6,
                fontWeight: 500,
                opacity: 0.9,
                fontSize: '1.8rem',
                color: '#e0e7ff',
                lineHeight: 1.4,
              }}
            >
              Advanced Scientific GPS Trajectory Analysis Platform
            </Typography>
            
            {/* Bottom Icons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
              <Security sx={{ color: '#00ff88', fontSize: 35, filter: 'drop-shadow(0 0 15px rgba(0, 255, 136, 0.6))' }} />
              <Analytics sx={{ color: '#ffaa00', fontSize: 35, filter: 'drop-shadow(0 0 15px rgba(255, 170, 0, 0.6))' }} />
              <Science sx={{ color: '#3742fa', fontSize: 35, filter: 'drop-shadow(0 0 15px rgba(55, 66, 250, 0.6))' }} />
            </Box>
          </Box>

          {/* Mobile Header (Only visible on mobile) */}
          <Box 
            item 
            xs={12} 
            sx={{ 
              display: { xs: 'block', md: 'none' },
              textAlign: 'center',
              mb: 2,
            }}
          >
            {/* Top Flask Icon */}
            <Box
              sx={{
                position: 'relative',
                display: 'inline-block',
                mb: 2,
              }}
            >
              <Science 
                sx={{ 
                  fontSize: { xs: 60, sm: 80 }, 
                  color: '#00d4ff',
                  filter: 'drop-shadow(0 0 30px rgba(0, 212, 255, 0.8))',
                  animation: 'pulse 2s ease-in-out infinite',
                }} 
              />
            </Box>
            
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.5rem' },
                mb: 1,
                letterSpacing: '0.02em',
              }}
            >
              <Box component="span" sx={{ color: '#00d4ff', textShadow: '0 0 30px rgba(0, 212, 255, 0.7)' }}>
                Keiros
              </Box>
              <Box component="span" sx={{ 
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)', 
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {' '}Data Analysis
              </Box>
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                mb: 2,
                fontWeight: 500,
                opacity: 0.9,
                fontSize: { xs: '1rem', sm: '1.2rem' },
                color: '#e0e7ff',
                lineHeight: 1.3,
              }}
            >
              Scientific GPS Analysis Platform
            </Typography>
          </Box>

          {/* Right Side - Login Form */}
          <Box 
            item 
            xs={12} 
            md={6}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Login Form Card */}
            <Box
              sx={{
                width: '100%',
                maxWidth: { xs: '100%', sm: 500, md: 600 },
                background: 'rgba(26, 35, 50, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '3px solid rgba(0, 212, 255, 0.4)',
                borderRadius: { xs: 16, sm: 20, md: 24 },
                boxShadow: '0 30px 100px rgba(0, 0, 0, 0.7), 0 0 80px rgba(0, 212, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #00d4ff, #ff6b35, #00ff88, #00d4ff)',
                  animation: 'shimmer 4s ease-in-out infinite',
                },
              }}
            >
              {/* Card Content */}
              <Box
                sx={{ 
                  p: { xs: 3, sm: 4, md: 6 },
                  '&:last-child': { pb: { xs: 3, sm: 4, md: 6 } }
                }}
              >
                {/* Title */}
                <Typography 
                  variant="h3" 
                  align="center"
                  sx={{
                    mb: { xs: 3, sm: 4 },
                    fontWeight: 700,
                    fontSize: { xs: '1.8rem', sm: '2rem', md: '2.5rem' },
                  }}
                >
                  <Box component="span" sx={{ color: '#00d4ff' }}>
                    Access
                  </Box>
                  <Box component="span" sx={{ color: '#ff6b35' }}>
                    {' '}Platform
                  </Box>
                </Typography>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="large"
                    sx={{
                      mb: { xs: 3, sm: 4 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' },
                        height: { xs: 64, sm: 70, md: 80 },
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 212, 255, 0.8)',
                          borderWidth: 3,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00d4ff',
                          borderWidth: 3,
                        },
                        '& input': {
                          color: '#ffffff',
                          fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' },
                          fontWeight: 500,
                          padding: { xs: '18px 16px', sm: '20px 16px', md: '24px 16px' },
                        },
                        '& label': {
                          color: '#b8c5d6',
                          fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                          fontWeight: 500,
                          transform: { xs: 'translate(16px, 18px) scale(1)', sm: 'translate(16px, 20px) scale(1)', md: 'translate(16px, 24px) scale(1)' },
                          '&.Mui-focused': {
                            transform: { xs: 'translate(16px, -9px) scale(0.75)', sm: 'translate(16px, -9px) scale(0.75)', md: 'translate(16px, -9px) scale(0.75)' },
                          },
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    size="large"
                    sx={{
                      mb: { xs: 3, sm: 4 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' },
                        height: { xs: 64, sm: 70, md: 80 },
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover fieldset': {
                          borderColor: 'rgba(0, 212, 255, 0.8)',
                          borderWidth: 3,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00d4ff',
                          borderWidth: 3,
                        },
                        '& input': {
                          color: '#ffffff',
                          fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' },
                          fontWeight: 500,
                          padding: { xs: '18px 16px', sm: '20px 16px', md: '24px 16px' },
                        },
                        '& label': {
                          color: '#b8c5d6',
                          fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                          fontWeight: 500,
                          transform: { xs: 'translate(16px, 18px) scale(1)', sm: 'translate(16px, 20px) scale(1)', md: 'translate(16px, 24px) scale(1)' },
                          '&.Mui-focused': {
                            transform: { xs: 'translate(16px, -9px) scale(0.75)', sm: 'translate(16px, -9px) scale(0.75)', md: 'translate(16px, -9px) scale(0.75)' },
                          },
                        },
                      },
                    }}
                  />
                  
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: { xs: 3, sm: 4 },
                        borderRadius: 3,
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                        fontWeight: 500,
                        '& .MuiAlert-icon': {
                          color: '#ff4757',
                          fontSize: { xs: '1.5rem', sm: '1.6rem', md: '1.8rem' },
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<LoginIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }} />}
                    sx={{
                      py: { xs: 2, sm: 2.5, md: 3 },
                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #00d4ff 0%, #0099cc 50%, #00d4ff 100%)',
                      borderRadius: 4,
                      boxShadow: '0 15px 50px rgba(0, 212, 255, 0.5)',
                      border: '2px solid rgba(0, 212, 255, 0.4)',
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #00e5ff 0%, #00b3e6 50%, #00e5ff 100%)',
                        boxShadow: '0 20px 60px rgba(0, 212, 255, 0.7)',
                        transform: 'translateY(-3px)',
                        border: '2px solid rgba(0, 212, 255, 0.7)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    → Access Scientific Analysis Platform
                  </Button>
                </form>

                {/* Footer */}
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  align="center"
                  sx={{ 
                    mt: { xs: 3, sm: 4 },
                    opacity: 0.8,
                    fontStyle: 'italic',
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                    fontWeight: 400,
                    color: '#a8b5c6',
                  }}
                >
                  Advanced GNSS Trajectory Analysis & Kinematic Dynamics
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 