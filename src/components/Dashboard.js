import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Speed,
  Explore,
  Satellite,
  Schedule,
  Science,
  Map,
  Menu,
  Logout,
} from '@mui/icons-material';
import SpatioTemporalAnalysis from './SpatioTemporalAnalysis';
import MotionBehaviorAnalysis from './MotionBehaviorAnalysis';
import GNSSSignalAnalysis from './GNSSSignalAnalysis';
import TemporalIntegrityAnalysis from './TemporalIntegrityAnalysis';
import GPSMap from './GPSMap';

const drawerWidth = 240;

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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

      console.log('Dashboard loaded data:', parsedData.length, 'records');
      console.log('Sample parsed data:', parsedData.slice(0, 3));
      
      setData(parsedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    setMobileOpen(false);
  };

  const tabConfig = [
    {
      label: 'Spatio-Temporal Analysis',
      icon: <Explore />,
      description: 'Analyze spatial and temporal patterns in GPS data',
      component: <SpatioTemporalAnalysis data={data} loading={loading} />
    },
    {
      label: 'Motion Behavior Analysis',
      icon: <Speed />,
      description: 'Study movement patterns and velocity analysis',
      component: <MotionBehaviorAnalysis data={data} loading={loading} />
    },
    {
      label: 'GNSS Signal Analysis',
      icon: <Satellite />,
      description: 'Examine satellite signal quality and strength',
      component: <GNSSSignalAnalysis data={data} loading={loading} />
    },
    {
      label: 'Temporal Integrity Analysis',
      icon: <Schedule />,
      description: 'Assess data consistency and time-based patterns',
      component: <TemporalIntegrityAnalysis data={data} loading={loading} />
    },
         {
       label: 'GPS Positional Analysis',
       icon: <Map />,
       description: 'Interactive map visualization of GPS trajectories',
       component: <GPSMap data={data} loading={loading} />
     }
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
             {/* Header */}
       <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
           <Avatar sx={{ bgcolor: '#00bcd4', mr: 1, width: 32, height: 32 }}>
             <Science />
           </Avatar>
           <Box>
             <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1rem' }}>
               Keiros
             </Typography>
             <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
               Data Analysis Platform
             </Typography>
           </Box>
         </Box>
         
         {/* Data Summary */}
         <Paper sx={{ p: 1, bgcolor: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.3)' }}>
           <Typography variant="body2" sx={{ color: '#00bcd4', mb: 0.5, fontWeight: 'bold' }}>
             Dataset Summary
           </Typography>
           <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
             <Chip 
               label={`${data.length} Records`} 
               size="small" 
               sx={{ bgcolor: 'rgba(0,188,212,0.2)', color: '#00bcd4' }}
             />
             <Chip 
               label={loading ? 'Loading...' : 'Ready'} 
               size="small" 
               color={loading ? 'warning' : 'success'}
             />
           </Box>
         </Paper>
       </Box>

             {/* Navigation */}
       <Box sx={{ flexGrow: 1, py: 1 }}>
         <Typography variant="overline" sx={{ px: 2, color: '#b0b0b0', fontWeight: 'bold' }}>
           Analysis Modules
         </Typography>
         <List sx={{ mt: 0.5 }}>
           {tabConfig.map((tab, index) => (
             <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
               <ListItemButton
                 selected={activeTab === index}
                 onClick={() => handleTabChange(index)}
                 sx={{
                   mx: 1,
                   borderRadius: 1,
                   py: 0.5,
                   '&.Mui-selected': {
                     bgcolor: 'rgba(0,188,212,0.2)',
                     border: '1px solid rgba(0,188,212,0.5)',
                     '&:hover': {
                       bgcolor: 'rgba(0,188,212,0.3)',
                     },
                   },
                   '&:hover': {
                     bgcolor: 'rgba(255,255,255,0.05)',
                   },
                 }}
               >
                 <ListItemIcon sx={{ color: activeTab === index ? '#00bcd4' : '#b0b0b0', minWidth: 32 }}>
                   {tab.icon}
                 </ListItemIcon>
                 <ListItemText 
                   primary={tab.label}
                   secondary={tab.description}
                   primaryTypographyProps={{
                     fontSize: '0.8rem',
                     fontWeight: activeTab === index ? 'bold' : 'normal',
                     color: activeTab === index ? '#00bcd4' : '#ffffff',
                   }}
                   secondaryTypographyProps={{
                     fontSize: '0.65rem',
                     color: '#b0b0b0',
                   }}
                 />
               </ListItemButton>
             </ListItem>
           ))}
         </List>
       </Box>

      
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0a0a0a' }}>
      {/* Mobile AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          display: { sm: 'none' },
          bgcolor: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: (theme) => theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#ffffff' }}>
            Keiros Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#1a1a1a',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#1a1a1a',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

             {/* Main content */}
                <Box
           component="main"
           sx={{
             flexGrow: 1,
             width: { sm: `calc(100% - ${drawerWidth}px)` },
             pt: { xs: 8, sm: 2 },
             pl: { sm: 2 },
             pr: { sm: 2 },
             maxWidth: 'none',
             minWidth: 0,
           }}
         >
                 {/* Page Header with Logout */}
         <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <Box>
             <Typography variant="h5" sx={{ color: '#ffffff', mb: 0.5, fontWeight: 'bold' }}>
               {tabConfig[activeTab].label}
             </Typography>
             <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
               {tabConfig[activeTab].description}
             </Typography>
           </Box>
           <IconButton
             onClick={onLogout}
             sx={{ 
               bgcolor: 'rgba(255,255,255,0.05)',
               color: '#b0b0b0',
               '&:hover': {
                 bgcolor: 'rgba(255,255,255,0.1)',
                 color: '#ffffff',
               }
             }}
           >
             <Logout />
           </IconButton>
         </Box>

                 {/* Content Area */}
         <Paper 
           sx={{ 
             bgcolor: 'rgba(26, 26, 26, 0.9)', 
             border: '1px solid rgba(255,255,255,0.1)',
             borderRadius: 3,
             overflow: 'hidden',
             height: 'calc(100vh - 140px)',
             width: '100%',
             maxWidth: 'none',
           }}
         >
           <Box sx={{ height: '100%', overflow: 'auto' }}>
             {tabConfig[activeTab].component}
           </Box>
         </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 