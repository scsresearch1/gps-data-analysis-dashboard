import React, { useMemo, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Modal,
  IconButton,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Close,
  ZoomIn,
} from '@mui/icons-material';

const MotionBehaviorAnalysis = ({ data, loading }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Helper function to parse date correctly
  const parseDate = (dateString) => {
    try {
      // Handle format: "29/07/2025 06:06:36"
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      
      // Create date with proper parameters (month is 0-indexed)
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return new Date(); // Fallback to current date
      }
      
      return date;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date(); // Fallback to current date
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const result = data.map((row, index) => {
      const timestamp = parseDate(row['Transmitted Time']);
      const lat = parseFloat(row.Latitude) || 0;
      const lon = parseFloat(row.Longitude) || 0;
      const direction = parseFloat(row.Direction) || 0;
      
      // Calculate speed and distance
      let speed = 0;
      let distance = 0;
      let directionDelta = 0;
      
      if (index > 0) {
        const prevLat = parseFloat(data[index - 1].Latitude) || 0;
        const prevLon = parseFloat(data[index - 1].Longitude) || 0;
        const prevTime = parseDate(data[index - 1]['Transmitted Time']);
        const prevDirection = parseFloat(data[index - 1].Direction) || 0;
        
        distance = calculateDistance(lat, lon, prevLat, prevLon);
        const timeDiff = (timestamp - prevTime) / 1000; // seconds
        speed = timeDiff > 0 ? distance / timeDiff : 0; // m/s
        
        // Calculate direction change
        directionDelta = Math.abs(direction - prevDirection);
        if (directionDelta > 180) {
          directionDelta = 360 - directionDelta;
        }
      }

      // Determine movement state
      const isMoving = speed > 0.5; // > 0.5 m/s
      const isStopped = speed <= 0.5;
      const isSharpTurn = directionDelta > 45; // > 45 degrees
      const isSuddenJump = distance > 50; // > 50 meters

      return {
        index,
        timestamp,
        time: timestamp.toLocaleTimeString(),
        timeShort: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`,
        lat,
        lon,
        direction,
        speed: speed * 3.6, // Convert to km/h
        distance,
        directionDelta,
        isMoving,
        isStopped,
        isSharpTurn,
        isSuddenJump,
        state: isMoving ? 'Moving' : 'Idle',
      };
    });

    // Debug: Check if we have valid data
    if (result.length > 0) {
      console.log('First processed point:', result[0]);
      console.log('Direction delta range:', Math.min(...result.map(p => p.directionDelta)), 'to', Math.max(...result.map(p => p.directionDelta)));
      console.log('Speed range:', Math.min(...result.map(p => p.speed)), 'to', Math.max(...result.map(p => p.speed)));
    }

    return result;
  }, [data]);

  const motionAnalysis = useMemo(() => {
    if (processedData.length === 0) return {};

    const movingPoints = processedData.filter(point => point.isMoving);
    const stoppedPoints = processedData.filter(point => point.isStopped);
    const sharpTurns = processedData.filter(point => point.isSharpTurn);
    const suddenJumps = processedData.filter(point => point.isSuddenJump);

    // Find stop periods
    const stopPeriods = [];
    let currentStopStart = null;
    
    processedData.forEach((point, index) => {
      if (point.isStopped && currentStopStart === null) {
        currentStopStart = index;
      } else if (!point.isStopped && currentStopStart !== null) {
        stopPeriods.push({
          start: currentStopStart,
          end: index - 1,
          duration: (index - currentStopStart) * 3, // seconds
          location: `${processedData[currentStopStart].lat.toFixed(6)}, ${processedData[currentStopStart].lon.toFixed(6)}`
        });
        currentStopStart = null;
      }
    });

    // Handle case where trip ends with a stop
    if (currentStopStart !== null) {
      stopPeriods.push({
        start: currentStopStart,
        end: processedData.length - 1,
        duration: (processedData.length - currentStopStart) * 3,
        location: `${processedData[currentStopStart].lat.toFixed(6)}, ${processedData[currentStopStart].lon.toFixed(6)}`
      });
    }

    return {
      totalPoints: processedData.length,
      movingPoints: movingPoints.length,
      stoppedPoints: stoppedPoints.length,
      sharpTurns: sharpTurns.length,
      suddenJumps: suddenJumps.length,
      stopPeriodsCount: stopPeriods.length,
      avgSpeed: movingPoints.length > 0 ? 
        movingPoints.reduce((sum, p) => sum + p.speed, 0) / movingPoints.length : 0,
      maxSpeed: Math.max(...processedData.map(p => p.speed)),
      avgDirectionDelta: processedData.reduce((sum, p) => sum + p.directionDelta, 0) / processedData.length,
      maxDirectionDelta: Math.max(...processedData.map(p => p.directionDelta)),
      stopPeriods,
    };
  }, [processedData]);

  const handleChartClick = (chartType) => {
    setSelectedChart(chartType);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedChart(null);
  };

  const renderChart = (chartType, data, height = 300) => {
    const chartProps = {
      data,
      style: { cursor: 'pointer' },
      onClick: () => handleChartClick(chartType),
    };

    switch (chartType) {
      case 'directionDelta':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="timeShort" 
              stroke="#b0b0b0"
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#b0b0b0" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="directionDelta" 
              stroke="#ff9800" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'movementState':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="timeShort" 
              stroke="#b0b0b0"
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#b0b0b0" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                color: '#ffffff'
              }}
            />
            <Bar 
              dataKey="speed" 
              fill={(entry) => entry.isMoving ? '#00bcd4' : '#ff9800'}
            />
          </BarChart>
        );

      case 'distance':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="timeShort" 
              stroke="#b0b0b0"
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#b0b0b0" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="distance" 
              stroke="#4caf50" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'sharpTurn':
        return (
          <ScatterChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="timeShort" 
              stroke="#b0b0b0"
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#b0b0b0" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                color: '#ffffff'
              }}
            />
            <Scatter 
              dataKey="directionDelta" 
              fill={(entry) => entry.isSharpTurn ? '#f44336' : '#00bcd4'}
            />
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert severity="error">
        No data available for analysis. Please ensure TestRun.csv is properly loaded.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00bcd4', mb: 1 }}>
                Total Points
              </Typography>
              <Typography variant="h4" sx={{ color: '#ffffff' }}>
                {motionAnalysis.totalPoints || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00bcd4', mb: 1 }}>
                Moving Points
              </Typography>
              <Typography variant="h4" sx={{ color: '#4caf50' }}>
                {motionAnalysis.movingPoints || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00bcd4', mb: 1 }}>
                Sharp Turns
              </Typography>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>
                {motionAnalysis.sharpTurns || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00bcd4', mb: 1 }}>
                Stop Periods
              </Typography>
              <Typography variant="h4" sx={{ color: '#f44336' }}>
                {motionAnalysis.stopPeriodsCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Analysis */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00bcd4', mb: 2 }}>
                Motion Analysis Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 1 }}>
                      Speed Analysis
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      Average Speed: {motionAnalysis.avgSpeed?.toFixed(2) || 0} km/h
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      Maximum Speed: {motionAnalysis.maxSpeed?.toFixed(2) || 0} km/h
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: '#ffffff', mb: 1 }}>
                      Direction Analysis
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      Average Direction Change: {motionAnalysis.avgDirectionDelta?.toFixed(2) || 0}°
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      Maximum Direction Change: {motionAnalysis.maxDirectionDelta?.toFixed(2) || 0}°
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Direction Delta vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Direction Changes vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('directionDelta', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Movement State vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Movement State vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('movementState', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Distance vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Distance Between Points vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('distance', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Sharp Turn Detection */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Sharp Turn Detection
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('sharpTurn', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal for enlarged chart view */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="chart-modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Paper
          sx={{
            position: 'relative',
            width: '90vw',
            height: '80vh',
            maxWidth: 1200,
            maxHeight: 800,
            bgcolor: 'rgba(26, 26, 26, 0.95)',
            border: '2px solid #333',
            borderRadius: 2,
            p: 3,
            outline: 'none',
          }}
        >
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#00bcd4',
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>
          
          <Typography variant="h5" sx={{ color: '#00bcd4', mb: 3, textAlign: 'center' }}>
            {selectedChart === 'directionDelta' && 'Direction Changes vs Time'}
            {selectedChart === 'movementState' && 'Movement State vs Time'}
            {selectedChart === 'distance' && 'Distance Between Points vs Time'}
            {selectedChart === 'sharpTurn' && 'Sharp Turn Detection'}
          </Typography>
          
          <Box sx={{ height: 'calc(100% - 100px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(selectedChart, processedData, '100%')}
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

export default MotionBehaviorAnalysis; 