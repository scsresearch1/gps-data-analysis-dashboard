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
  Chip,
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
} from 'recharts';
import {
  Speed,
  Height,
  Explore,
  Close,
  ZoomIn,
  DirectionsCar,
  Satellite,
} from '@mui/icons-material';

const SpatioTemporalAnalysis = ({ data, loading }) => {
  const [selectedChart, setSelectedChart] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Helper function to calculate distance between two points using Haversine formula
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

  // Helper function to parse date correctly
  const parseDate = (dateString) => {
    try {
      // Handle format: "29-07-2025 6.06" (DD-MM-YYYY HH.MM)
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      const [hour, minute] = timePart.split('.');
      
      // Create date with seconds set to 0 since CSV doesn't include seconds
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), 0);
      
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

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((row, index) => {
      // Safely parse values with fallbacks
      const timestamp = parseDate(row['Transmitted Time']);
      const lat = parseFloat(row.Latitude) || 0;
      const lon = parseFloat(row.Longitude) || 0;
      const altitude = parseFloat(row.Altitude) || 0;
      const direction = parseFloat(row.Direction) || 0;
      
      // Calculate speed if not first point
      let speed = 0;
      let distance = 0;
      if (index > 0) {
        const prevLat = parseFloat(data[index - 1].Latitude) || 0;
        const prevLon = parseFloat(data[index - 1].Longitude) || 0;
        const prevTime = parseDate(data[index - 1]['Transmitted Time']);
        
        distance = calculateDistance(lat, lon, prevLat, prevLon);
        const timeDiff = (timestamp - prevTime) / 1000; // seconds
        speed = timeDiff > 0 ? distance / timeDiff : 0; // m/s
      }

      return {
        index,
        timestamp,
        time: timestamp.toLocaleTimeString(),
        timeFormatted: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`,
        timeShort: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`,
        lat,
        lon,
        altitude,
        direction,
        speed: speed * 3.6, // Convert to km/h
        satellites: parseInt(row.Satellites) || 0,
        distance,
        // Add meaningful movement categories
        movementType: speed * 3.6 < 1 ? 'Stationary' : 
                     speed * 3.6 < 5 ? 'Slow Movement' :
                     speed * 3.6 < 15 ? 'Normal Movement' : 'Fast Movement',
        // Add direction categories
        directionCategory: direction < 22.5 || direction >= 337.5 ? 'North' :
                         direction < 67.5 ? 'Northeast' :
                         direction < 112.5 ? 'East' :
                         direction < 157.5 ? 'Southeast' :
                         direction < 202.5 ? 'South' :
                         direction < 247.5 ? 'Southwest' :
                         direction < 292.5 ? 'West' : 'Northwest',
      };
    }).filter(point => !isNaN(point.lat) && !isNaN(point.lon) && !isNaN(point.speed)); // Filter out invalid points
  }, [data]);

  const tripSummary = useMemo(() => {
    if (processedData.length === 0) return {};

    const totalTime = (processedData[processedData.length - 1].timestamp - processedData[0].timestamp) / 1000 / 60; // minutes
    const totalDistance = processedData.reduce((sum, point) => sum + point.distance, 0);
    const avgSpeed = totalTime > 0 ? (totalDistance / 1000) / (totalTime / 60) : 0; // km/h
    const maxSpeed = Math.max(...processedData.map(p => p.speed));
    const maxAltitude = Math.max(...processedData.map(p => p.altitude));
    const minAltitude = Math.min(...processedData.map(p => p.altitude));
    const elevationLoss = maxAltitude - minAltitude;

    // Movement analysis
    const stationaryPoints = processedData.filter(point => point.speed < 1);
    const slowMovement = processedData.filter(point => point.speed >= 1 && point.speed < 5);
    const normalMovement = processedData.filter(point => point.speed >= 5 && point.speed < 15);
    const fastMovement = processedData.filter(point => point.speed >= 15);

    // Direction analysis
    const directionCounts = {
      North: processedData.filter(p => p.directionCategory === 'North').length,
      Northeast: processedData.filter(p => p.directionCategory === 'Northeast').length,
      East: processedData.filter(p => p.directionCategory === 'East').length,
      Southeast: processedData.filter(p => p.directionCategory === 'Southeast').length,
      South: processedData.filter(p => p.directionCategory === 'South').length,
      Southwest: processedData.filter(p => p.directionCategory === 'Southwest').length,
      West: processedData.filter(p => p.directionCategory === 'West').length,
      Northwest: processedData.filter(p => p.directionCategory === 'Northwest').length,
    };

    // Signal quality analysis
    const avgSatellites = processedData.reduce((sum, p) => sum + p.satellites, 0) / processedData.length;
    const signalQuality = avgSatellites >= 10 ? 'Excellent' :
                         avgSatellites >= 8 ? 'Good' :
                         avgSatellites >= 6 ? 'Fair' : 'Poor';

    return {
      totalPoints: processedData.length,
      timeMinutes: totalTime.toFixed(1),
      totalDistanceKm: (totalDistance / 1000).toFixed(2),
      avgSpeedKmh: avgSpeed.toFixed(1),
      maxSpeedKmh: maxSpeed.toFixed(1),
      maxAltitude: maxAltitude.toFixed(1),
      minAltitude: minAltitude.toFixed(1),
      elevationLoss: elevationLoss.toFixed(1),
      stationaryPoints: stationaryPoints.length,
      slowMovement: slowMovement.length,
      normalMovement: normalMovement.length,
      fastMovement: fastMovement.length,
      directionCounts,
      avgSatellites: avgSatellites.toFixed(1),
      signalQuality,
    };
  }, [processedData]);

  const speedDistribution = useMemo(() => {
    if (processedData.length === 0) return [];

    const speeds = processedData.map(p => p.speed).filter(speed => !isNaN(speed));
    
    return [
      { name: 'Stationary (<1 km/h)', value: speeds.filter(s => s < 1).length },
      { name: 'Slow (1-5 km/h)', value: speeds.filter(s => s >= 1 && s < 5).length },
      { name: 'Normal (5-15 km/h)', value: speeds.filter(s => s >= 5 && s < 15).length },
      { name: 'Fast (15-30 km/h)', value: speeds.filter(s => s >= 15 && s < 30).length },
      { name: 'Very Fast (>30 km/h)', value: speeds.filter(s => s >= 30).length },
    ];
  }, [processedData]);

  const directionAnalysis = useMemo(() => {
    if (processedData.length === 0) return [];

    return Object.entries(tripSummary.directionCounts || {}).map(([direction, count]) => ({
      name: direction,
      value: count,
    }));
  }, [tripSummary, processedData.length]);

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
      case 'speed':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
            <XAxis 
              dataKey="timeShort" 
              stroke="#b8c5d6"
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#b8c5d6" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                border: '1px solid #00d4ff',
                borderRadius: 8,
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="speed" 
              stroke="#00d4ff" 
              strokeWidth={3}
              dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#00d4ff', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        );

      case 'altitude':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
            <XAxis 
              dataKey="timeShort" 
              stroke="#b8c5d6"
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#b8c5d6" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                border: '1px solid #00ff88',
                borderRadius: 8,
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="altitude" 
              stroke="#00ff88" 
              strokeWidth={3}
              dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#00ff88', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        );

      case 'direction':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
            <XAxis 
              dataKey="timeShort" 
              stroke="#b8c5d6"
              fontSize={10}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#b8c5d6" fontSize={12} domain={[0, 360]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                border: '1px solid #ffaa00',
                borderRadius: 8,
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="direction" 
              stroke="#ffaa00" 
              strokeWidth={3}
              dot={{ fill: '#ffaa00', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ffaa00', strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        );

      case 'speedDistribution':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
            <XAxis dataKey="name" stroke="#b8c5d6" fontSize={12} />
            <YAxis stroke="#b8c5d6" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                border: '1px solid #00d4ff',
                borderRadius: 8,
                color: '#ffffff'
              }}
            />
            <Bar dataKey="value" fill="#00d4ff" />
          </BarChart>
        );

      case 'directionAnalysis':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3f5f" />
            <XAxis dataKey="name" stroke="#b8c5d6" fontSize={12} />
            <YAxis stroke="#b8c5d6" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                border: '1px solid #ffaa00',
                borderRadius: 8,
                color: '#ffffff'
              }}
            />
            <Bar dataKey="value" fill="#ffaa00" />
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
    <Box sx={{ p: 3 }}>
      {/* Trip Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #00d4ff' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ mr: 1, color: '#00d4ff' }} />
                <Typography variant="h6" sx={{ color: '#00d4ff' }}>
                  Trip Overview
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Duration: {tripSummary.timeMinutes} min
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Distance: {tripSummary.totalDistanceKm} km
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Avg Speed: {tripSummary.avgSpeedKmh} km/h
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6' }}>
                Max Speed: {tripSummary.maxSpeedKmh} km/h
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #00ff88' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Height sx={{ mr: 1, color: '#00ff88' }} />
                <Typography variant="h6" sx={{ color: '#00ff88' }}>
                  Elevation & Signal
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Elevation Loss: {tripSummary.elevationLoss} m
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Max Altitude: {tripSummary.maxAltitude} m
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Avg Satellites: {tripSummary.avgSatellites}
              </Typography>
              <Chip 
                label={tripSummary.signalQuality} 
                size="small" 
                sx={{ 
                  bgcolor: tripSummary.signalQuality === 'Excellent' ? '#4caf50' : 
                          tripSummary.signalQuality === 'Good' ? '#8bc34a' :
                          tripSummary.signalQuality === 'Fair' ? '#ff9800' : '#f44336',
                  color: '#ffffff',
                  fontSize: '0.75rem'
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #ffaa00' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DirectionsCar sx={{ mr: 1, color: '#ffaa00' }} />
                <Typography variant="h6" sx={{ color: '#ffaa00' }}>
                  Movement Analysis
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Stationary: {tripSummary.stationaryPoints}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Slow: {tripSummary.slowMovement}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 0.5 }}>
                Normal: {tripSummary.normalMovement}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b8c5d6' }}>
                Fast: {tripSummary.fastMovement}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #00d4ff' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Satellite sx={{ mr: 1, color: '#00d4ff' }} />
                <Typography variant="h6" sx={{ color: '#00d4ff' }}>
                  Signal Quality
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#b8c5d6', mb: 1 }}>
                {tripSummary.signalQuality} Signal
              </Typography>
              <Chip 
                label={tripSummary.signalQuality} 
                size="small" 
                sx={{ 
                  bgcolor: tripSummary.signalQuality === 'Excellent' ? '#4caf50' : 
                          tripSummary.signalQuality === 'Good' ? '#8bc34a' :
                          tripSummary.signalQuality === 'Fair' ? '#ff9800' : '#f44336',
                  color: '#ffffff',
                  fontSize: '0.75rem'
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Speed vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #00d4ff' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00d4ff', display: 'flex', alignItems: 'center' }}>
                  <Speed sx={{ mr: 1 }} />
                  Speed vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#00d4ff' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('speed', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Altitude vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #00ff88' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00ff88', display: 'flex', alignItems: 'center' }}>
                  <Height sx={{ mr: 1 }} />
                  Altitude vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#00ff88' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('altitude', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Direction vs Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #ffaa00' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#ffaa00', display: 'flex', alignItems: 'center' }}>
                  <Explore sx={{ mr: 1 }} />
                  Direction vs Time
                </Typography>
                <IconButton size="small" sx={{ color: '#ffaa00' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('direction', processedData)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Speed Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #00d4ff' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#00d4ff', display: 'flex', alignItems: 'center' }}>
                  <Speed sx={{ mr: 1 }} />
                  Speed Distribution
                </Typography>
                <IconButton size="small" sx={{ color: '#00d4ff' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('speedDistribution', speedDistribution)}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Direction Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 35, 50, 0.9)', border: '1px solid #ffaa00' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#ffaa00', display: 'flex', alignItems: 'center' }}>
                  <Explore sx={{ mr: 1 }} />
                  Direction Analysis
                </Typography>
                <IconButton size="small" sx={{ color: '#ffaa00' }}>
                  <ZoomIn />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {renderChart('directionAnalysis', directionAnalysis)}
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
            bgcolor: 'rgba(26, 35, 50, 0.95)',
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
              color: '#00d4ff',
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>
          
          <Typography variant="h5" sx={{ color: '#00d4ff', mb: 3, textAlign: 'center' }}>
            {selectedChart === 'speed' && 'Speed vs Time'}
            {selectedChart === 'altitude' && 'Altitude vs Time'}
            {selectedChart === 'direction' && 'Direction vs Time'}
            {selectedChart === 'speedDistribution' && 'Speed Distribution'}
            {selectedChart === 'directionAnalysis' && 'Direction Analysis'}
          </Typography>
          
          <Box sx={{ height: 'calc(100% - 100px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(selectedChart, selectedChart === 'speedDistribution' ? speedDistribution : 
                          selectedChart === 'directionAnalysis' ? directionAnalysis : processedData, '100%')}
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
};

export default SpatioTemporalAnalysis; 