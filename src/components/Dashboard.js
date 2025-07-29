import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Speed,
  Explore,
  Satellite,
  Schedule,
} from '@mui/icons-material';
import SpatioTemporalAnalysis from './SpatioTemporalAnalysis';
import MotionBehaviorAnalysis from './MotionBehaviorAnalysis';
import GNSSSignalAnalysis from './GNSSSignalAnalysis';
import TemporalIntegrityAnalysis from './TemporalIntegrityAnalysis';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/TestRun.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      const parsedData = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim();
        });
        return row;
      }).filter(row => row['Transmitted Time']); // Remove empty rows

      setData(parsedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabConfig = [
    {
      label: 'Spatio-Temporal Analysis',
      icon: <Explore />,
      component: <SpatioTemporalAnalysis data={data} loading={loading} />
    },
    {
      label: 'Motion Behavior Analysis',
      icon: <Speed />,
      component: <MotionBehaviorAnalysis data={data} loading={loading} />
    },
    {
      label: 'GNSS Signal Analysis',
      icon: <Satellite />,
      component: <GNSSSignalAnalysis data={data} loading={loading} />
    },
    {
      label: 'Temporal Integrity Analysis',
      icon: <Schedule />,
      component: <TemporalIntegrityAnalysis data={data} loading={loading} />
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #0a0a0a 30%, #1a1a1a 90%)' }}>
        <Toolbar>
          <Science sx={{ mr: 2, color: '#00bcd4' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#ffffff' }}>
            Keiros Data Analysis Platform
          </Typography>
          <IconButton
            color="inherit"
            onClick={onLogout}
            sx={{ color: '#ffffff' }}
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: '#00bcd4', mb: 2 }}>
                  GPS Trajectory Analysis Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Advanced scientific analysis of GNSS trajectory data with spatio-temporal, kinematic, and signal quality assessment
                </Typography>

                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      color: '#b0b0b0',
                      '&.Mui-selected': {
                        color: '#00bcd4',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#00bcd4',
                    },
                  }}
                >
                  {tabConfig.map((tab, index) => (
                    <Tab
                      key={index}
                      label={tab.label}
                      icon={tab.icon}
                      iconPosition="start"
                    />
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333', minHeight: '70vh' }}>
              <CardContent>
                {tabConfig[activeTab].component}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard; 