import React, { useMemo, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
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
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import {
  Close,
  ZoomIn,
} from '@mui/icons-material';

const GNSSSignalAnalysis = ({ data, loading }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Helper function to calculate distance between two points using Haversine formula
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

    return data.map((row, index) => {
      const timestamp = parseDate(row['Transmitted Time']);
      const lat = parseFloat(row.Latitude) || 0;
      const lon = parseFloat(row.Longitude) || 0;
      const altitude = parseFloat(row.Altitude) || 0;
      const satellites = parseInt(row.Satellites) || 0;
      const direction = parseFloat(row.Direction) || 0;
      
      // Calculate signal quality indicators
      const isWeakSignal = satellites < 8;
      const isStrongSignal = satellites >= 10;
      
      // Calculate positional drift (for stationary points)
      let driftDistance = 0;
      let driftDirection = 0;
      
      if (index > 0) {
        const prevLat = parseFloat(data[index - 1].Latitude) || 0;
        const prevLon = parseFloat(data[index - 1].Longitude) || 0;
        const prevTime = parseDate(data[index - 1]['Transmitted Time']);
        
        const timeDiff = (timestamp - prevTime) / 1000; // seconds
        
        // Only calculate drift for stationary periods (assuming < 1 m/s movement)
        const distance = calculateDistance(lat, lon, prevLat, prevLon);
        const speed = timeDiff > 0 ? distance / timeDiff : 0;
        
        if (speed < 1) { // Stationary threshold
          driftDistance = distance;
          driftDirection = Math.atan2(lat - prevLat, lon - prevLon) * 180 / Math.PI;
        }
      }

      // Estimate horizontal accuracy based on satellite count
      const estimatedAccuracy = satellites >= 12 ? 2 : 
                               satellites >= 10 ? 5 : 
                               satellites >= 8 ? 10 : 
                               satellites >= 6 ? 15 : 25; // meters

      return {
        index,
        timestamp,
        time: timestamp.toLocaleTimeString(),
        timeShort: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`,
        lat,
        lon,
        altitude,
        satellites,
        direction,
        isWeakSignal,
        isStrongSignal,
        driftDistance,
        driftDirection,
        estimatedAccuracy,
        signalQuality: satellites >= 10 ? 'Excellent' : 
                     satellites >= 8 ? 'Good' : 
                     satellites >= 6 ? 'Fair' : 'Poor',
      };
    });
  }, [data]);

  const signalAnalysis = useMemo(() => {
    if (processedData.length === 0) return {};

    const weakSignals = processedData.filter(point => point.isWeakSignal);
    const strongSignals = processedData.filter(point => point.isStrongSignal);
    const stationaryPoints = processedData.filter(point => point.driftDistance > 0);
    
    const avgSatellites = processedData.reduce((sum, p) => sum + p.satellites, 0) / processedData.length;
    const minSatellites = Math.min(...processedData.map(p => p.satellites));
    const maxSatellites = Math.max(...processedData.map(p => p.satellites));
    
    const avgDrift = stationaryPoints.length > 0 ? 
      stationaryPoints.reduce((sum, p) => sum + p.driftDistance, 0) / stationaryPoints.length : 0;
    
    const maxDrift = Math.max(...processedData.map(p => p.driftDistance));
    
    const avgAccuracy = processedData.reduce((sum, p) => sum + p.estimatedAccuracy, 0) / processedData.length;

    return {
      totalPoints: processedData.length,
      weakSignals: weakSignals.length,
      strongSignals: strongSignals.length,
      stationaryPoints: stationaryPoints.length,
      avgSatellites: avgSatellites.toFixed(1),
      minSatellites,
      maxSatellites,
      avgDrift: avgDrift.toFixed(2),
      maxDrift: maxDrift.toFixed(2),
      avgAccuracy: avgAccuracy.toFixed(1),
      signalQualityDistribution: {
        Excellent: processedData.filter(p => p.signalQuality === 'Excellent').length,
        Good: processedData.filter(p => p.signalQuality === 'Good').length,
        Fair: processedData.filter(p => p.signalQuality === 'Fair').length,
        Poor: processedData.filter(p => p.signalQuality === 'Poor').length,
      }
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
      case 'satellites':
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
              dataKey="satellites" 
              stroke="#00bcd4" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'drift':
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
              dataKey="driftDistance" 
              fill="#ff9800"
            />
          </ScatterChart>
        );

      case 'accuracy':
        return (
          <AreaChart {...chartProps}>
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
            <Area 
              type="monotone" 
              dataKey="estimatedAccuracy" 
              fill="#00bcd4" 
              fillOpacity={0.3}
              stroke="#00bcd4"
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'direction':
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
            <YAxis stroke="#b0b0b0" domain={[0, 360]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="direction" 
              stroke="#f44336" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'satelliteCount':
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
            <YAxis stroke="#b0b0b0" domain={[0, 15]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="satellites" 
              stroke="#00bcd4" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="estimatedAccuracy" 
              stroke="#ff9800" 
              strokeWidth={2}
              dot={false}
              yAxisId={1}
            />
          </LineChart>
        );

      case 'signalQuality':
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
              dataKey="satellites" 
              fill={(entry) => 
                entry.isWeakSignal ? '#f44336' : 
                entry.isStrongSignal ? '#4caf50' : '#ff9800'
              }
            />
          </BarChart>
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
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4', mb: 3 }}>
        GNSS Signal Quality and Spatial Precision Estimation
      </Typography>

      {/* Signal Quality Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                GNSS Signal Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Points</Typography>
                  <Typography variant="h6">{signalAnalysis.totalPoints}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg Satellites</Typography>
                  <Typography variant="h6">{signalAnalysis.avgSatellites}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Min Satellites</Typography>
                  <Typography variant="h6">{signalAnalysis.minSatellites}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Max Satellites</Typography>
                  <Typography variant="h6">{signalAnalysis.maxSatellites}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Weak Signals</Typography>
                  <Typography variant="h6">{signalAnalysis.weakSignals}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Strong Signals</Typography>
                  <Typography variant="h6">{signalAnalysis.strongSignals}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg Drift</Typography>
                  <Typography variant="h6">{signalAnalysis.avgDrift} m</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Max Drift</Typography>
                  <Typography variant="h6">{signalAnalysis.maxDrift} m</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg Accuracy</Typography>
                  <Typography variant="h6">{signalAnalysis.avgAccuracy} m</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Signal Quality Distribution
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(signalAnalysis.signalQualityDistribution).map(([quality, count]) => (
                  <Box key={quality} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {quality}
                    </Typography>
                    <Chip 
                      label={count} 
                      color={
                        quality === 'Excellent' ? 'success' :
                        quality === 'Good' ? 'primary' :
                        quality === 'Fair' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Satellite Count vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Satellite Count vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('satelliteCount', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Signal Quality vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Signal Quality vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('signalQuality', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* GPS Drift Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  GPS Drift Analysis (Stationary Points)
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('drift', processedData.filter(point => point.driftDistance > 0))}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Accuracy Estimation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Estimated Horizontal Accuracy
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('accuracy', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Direction Noise Analysis */}
        <Grid item xs={12}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00bcd4' }}>
                  Direction Noise Analysis (Rapid Changes)
                </Typography>
                <IconButton size="small" sx={{ color: '#00bcd4' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('direction', processedData)}
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
            {selectedChart === 'satellites' && 'Satellites vs Time'}
            {selectedChart === 'drift' && 'GPS Drift Analysis'}
            {selectedChart === 'accuracy' && 'Estimated Horizontal Accuracy'}
            {selectedChart === 'direction' && 'Direction Noise Analysis'}
            {selectedChart === 'satelliteCount' && 'Satellite Count vs Time'}
            {selectedChart === 'signalQuality' && 'Signal Quality vs Time'}
          </Typography>
          
          <Box sx={{ height: 'calc(100% - 100px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(selectedChart, selectedChart === 'drift' ? processedData.filter(point => point.driftDistance > 0) : processedData, '100%')}
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

export default GNSSSignalAnalysis; 