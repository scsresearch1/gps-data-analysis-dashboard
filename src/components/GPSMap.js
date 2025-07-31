import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  LinearProgress,
  Badge,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Map,
  LocationOn,
  Timeline,
  Info,
  ZoomIn,
  ZoomOut,
  MyLocation,
  PlayArrow,
  Pause,
  Speed,
  FilterList,
  Settings,
  Analytics,
  Visibility,
  VisibilityOff,
  CenterFocusStrong,
  Route,
  Straighten,
  AccessTime,
  Satellite,
  Height,
  Navigation,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Popup, Marker, ZoomControl, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format } from 'date-fns';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icon for better visibility
const createCustomIcon = (color = '#00d4ff') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 12px; 
      height: 12px; 
      background: ${color}; 
      border: 2px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const GPSMap = ({ data, loading }) => {
  const [selectedDate, setSelectedDate] = useState('all');
  const [mapCenter, setMapCenter] = useState([17.726, 78.256]);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapRef, setMapRef] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterRadius, setFilterRadius] = useState(50);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const animationRef = useRef(null);

  // Helper function to parse DD/MM/YYYY HH:mm:ss format
  const parseDate = (dateStr) => {
    try {
      const parts = dateStr.split(' ');
      if (parts.length !== 2) return null;
      
      const datePart = parts[0];
      const timePart = parts[1];
      
      const dateComponents = datePart.split('/');
      if (dateComponents.length !== 3) return null;
      
      const day = parseInt(dateComponents[0]);
      const month = parseInt(dateComponents[1]) - 1;
      let year = parseInt(dateComponents[2]);
      
      if (year < 100) {
        year += 2000;
      }
      
      const timeComponents = timePart.split(':');
      if (timeComponents.length !== 3) return null;
      
      const hour = parseInt(timeComponents[0]);
      const minute = parseInt(timeComponents[1]);
      const second = parseInt(timeComponents[2]);
      
      return new Date(year, month, day, hour, minute, second);
    } catch (error) {
      console.error('parseDate error:', error);
      return null;
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Process data to extract dates and group by date
  const dates = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const uniqueDates = [...new Set(data.map(row => {
      const dateStr = row['Transmitted Time'];
      if (!dateStr) return null;
      
      try {
        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) return null;
        return format(date, 'yyyy-MM-dd');
      } catch (error) {
        console.warn('Invalid date format:', dateStr);
        return null;
      }
    }))].filter(Boolean).sort();
    
    return uniqueDates;
  }, [data]);

  // Filter data by selected date
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (selectedDate === 'all') {
      return data;
    }
    
    return data.filter(row => {
      const dateStr = row['Transmitted Time'];
      if (!dateStr) return false;
      
      try {
        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) return false;
        return format(date, 'yyyy-MM-dd') === selectedDate;
      } catch (error) {
        console.warn('Invalid date format in filter:', dateStr);
        return false;
      }
    });
  }, [data, selectedDate]);

  // Process data to create individual points with distances
  const processedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { points: [], dateSummaries: [], totalDistance: 0, trajectory: [] };
    }
    
    const points = [];
    const dateSummaries = [];
    const trajectory = [];
    let totalDistance = 0;
    
    // Group data by date for multiple date analysis
    const groupedByDate = {};
    filteredData.forEach(row => {
      const dateStr = row['Transmitted Time'];
      if (!dateStr) return;
      
      try {
        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) return;
        
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(row);
      } catch (error) {
        console.warn('Invalid date format in grouping:', dateStr);
        return;
      }
    });

    // Process each date group
    Object.entries(groupedByDate).forEach(([dateKey, dateData]) => {
      const datePoints = [];
      let dateDistance = 0;
      
      // Sort by time
      dateData.sort((a, b) => {
        try {
          const dateA = parseDate(a['Transmitted Time']);
          const dateB = parseDate(b['Transmitted Time']);
          
          if (!dateA || !dateB || isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
          return dateA - dateB;
        } catch (error) {
          return 0;
        }
      });
      
      // Create individual points
      dateData.forEach((row, index) => {
        const lat = parseFloat(row.Latitude);
        const lng = parseFloat(row.Longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        const point = {
          lat,
          lng,
          time: row['Transmitted Time'],
          altitude: parseFloat(row.Altitude) || 0,
          direction: parseFloat(row.Direction) || 0,
          satellites: parseInt(row.Satellites) || 0,
          date: dateKey,
          pointNumber: index + 1,
          distanceFromPrevious: 0,
          speed: 0,
          timestamp: parseDate(row['Transmitted Time']),
        };
        
        // Calculate distance from previous point
        if (index > 0) {
          const prevPoint = datePoints[index - 1];
          const distance = calculateDistance(prevPoint.lat, prevPoint.lng, lat, lng);
          point.distanceFromPrevious = distance;
          dateDistance += distance;
          
          // Calculate speed
          const timeDiff = (point.timestamp - prevPoint.timestamp) / 1000; // seconds
          point.speed = timeDiff > 0 ? distance / timeDiff : 0;
        }
        
        datePoints.push(point);
        points.push(point);
        trajectory.push([lat, lng]);
      });
      
      // Add date summary
      if (datePoints.length > 0) {
        dateSummaries.push({
          date: dateKey,
          totalDistance: dateDistance,
          pointCount: datePoints.length,
          points: datePoints,
          avgSpeed: datePoints.reduce((sum, p) => sum + p.speed, 0) / datePoints.length,
          maxSpeed: Math.max(...datePoints.map(p => p.speed)),
        });
      }
      
      totalDistance += dateDistance;
    });
    
    return { points, dateSummaries, totalDistance, trajectory };
  }, [filteredData]);

  // Animation functions
  const startAnimation = () => {
    if (processedData.points.length === 0) return;
    
    setIsAnimating(true);
    setCurrentPointIndex(0);
    
    const animate = () => {
      setCurrentPointIndex(prev => {
        const next = prev + 1;
        if (next >= processedData.points.length) {
          setIsAnimating(false);
          return 0;
        }
        
        const point = processedData.points[next];
        if (mapRef) {
          mapRef.setView([point.lat, point.lng], mapZoom);
        }
        
        animationRef.current = setTimeout(animate, animationSpeed);
        return next;
      });
    };
    
    animationRef.current = setTimeout(animate, animationSpeed);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Calculate advanced statistics
  const advancedStats = useMemo(() => {
    if (!processedData.points.length) return {};
    
    const speeds = processedData.points.map(p => p.speed).filter(s => s > 0);
    const altitudes = processedData.points.map(p => p.altitude).filter(a => a > 0);
    const satellites = processedData.points.map(p => p.satellites);
    
    return {
      avgSpeed: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      maxSpeed: speeds.length ? Math.max(...speeds) : 0,
      avgAltitude: altitudes.length ? altitudes.reduce((a, b) => a + b, 0) / altitudes.length : 0,
      avgSatellites: satellites.length ? satellites.reduce((a, b) => a + b, 0) / satellites.length : 0,
      totalPoints: processedData.points.length,
      totalDistance: processedData.totalDistance,
      dateCount: processedData.dateSummaries.length,
    };
  }, [processedData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          No GPS data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ color: '#00d4ff', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <Map sx={{ mr: 1, fontSize: '1.5rem' }} />
              GPS Positional Analysis
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mt: 0.5 }}>
              Interactive map visualization of GPS trajectories with advanced analytics
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={isAnimating ? <Pause /> : <PlayArrow />}
              onClick={isAnimating ? stopAnimation : startAnimation}
              sx={{ 
                borderColor: '#00d4ff', 
                color: '#00d4ff',
                '&:hover': { borderColor: '#00e5ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }
              }}
            >
              {isAnimating ? 'Stop' : 'Animate'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CenterFocusStrong />}
              onClick={() => mapRef?.setView(mapCenter, mapZoom)}
              sx={{ 
                borderColor: '#ff6b35', 
                color: '#ff6b35',
                '&:hover': { borderColor: '#ff8a65', backgroundColor: 'rgba(255, 107, 53, 0.1)' }
              }}
            >
              Reset View
            </Button>
          </Box>
        </Box>

        {/* Enhanced Controls */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Date</InputLabel>
              <Select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                label="Select Date"
              >
                <MenuItem value="all">All Dates</MenuItem>
                {dates.map((date) => (
                  <MenuItem key={date} value={date}>
                    {(() => {
                      try {
                        const [year, month, day] = date.split('-');
                        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        return format(dateObj, 'MMM dd, yyyy');
                      } catch (error) {
                        return date;
                      }
                    })()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<LocationOn />}
                label={`${processedData.points.length} Points`}
                color="primary"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                icon={<Timeline />}
                label={`${processedData.totalDistance.toFixed(2)} km Total`}
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                icon={<Speed />}
                label={`${advancedStats.avgSpeed.toFixed(1)} km/h Avg`}
                color="warning"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                icon={<Satellite />}
                label={`${advancedStats.avgSatellites.toFixed(0)} Sats Avg`}
                color="info"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Visualization Controls */}
        <Paper sx={{ p: 1, mb: 2, bgcolor: 'rgba(26, 35, 50, 0.8)' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showMarkers}
                  onChange={(e) => setShowMarkers(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Markers"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showTrajectory}
                  onChange={(e) => setShowTrajectory(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Trajectory"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  color="primary"
                />
              }
              label="Heatmap"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Animation Speed:
              </Typography>
              <Slider
                value={animationSpeed}
                onChange={(e, value) => setAnimationSpeed(value)}
                min={500}
                max={3000}
                step={100}
                sx={{ width: 100, color: '#00d4ff' }}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
        {/* Map Section */}
        <Box sx={{ flexGrow: 1, height: '600px' }}>
          <Card sx={{ height: '100%', bgcolor: 'rgba(26, 35, 50, 0.9)' }}>
            <CardContent sx={{ height: '100%', p: 1, position: 'relative' }}>
              {processedData.points.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    No GPS points detected
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: '100%', position: 'relative' }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    ref={(ref) => setMapRef(ref)}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    <ZoomControl position="topright" />
                    
                    {/* Trajectory Line */}
                    {showTrajectory && processedData.trajectory.length > 1 && (
                      <Polyline
                        positions={processedData.trajectory}
                        color="#00d4ff"
                        weight={3}
                        opacity={0.8}
                      />
                    )}
                    
                    {/* Individual GPS point markers */}
                    {showMarkers && processedData.points.map((point, index) => (
                      <Marker
                        key={index}
                        position={[point.lat, point.lng]}
                        icon={createCustomIcon(
                          index === currentPointIndex && isAnimating ? '#ff6b35' : 
                          point.speed > 50 ? '#ff4757' : 
                          point.speed > 20 ? '#ffaa00' : '#00d4ff'
                        )}
                        eventHandlers={{
                          click: () => setSelectedPoint(point),
                        }}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 200 }}>
                            <Typography variant="subtitle2" sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                              GPS Point #{point.pointNumber}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                  <AccessTime sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                  Time
                                </Typography>
                                <Typography variant="body2">
                                  {(() => {
                                    try {
                                      return format(new Date(point.time), 'HH:mm:ss');
                                    } catch (error) {
                                      return 'Invalid time';
                                    }
                                  })()}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                  <Speed sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                  Speed
                                </Typography>
                                <Typography variant="body2">
                                  {point.speed.toFixed(1)} km/h
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                  <LocationOn sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                  Coordinates
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                  <Height sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                  Altitude
                                </Typography>
                                <Typography variant="body2">
                                  {point.altitude.toFixed(1)} m
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                  <Navigation sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                  Direction
                                </Typography>
                                <Typography variant="body2">
                                  {point.direction.toFixed(1)}°
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                  <Satellite sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                  Satellites
                                </Typography>
                                <Typography variant="body2">
                                  {point.satellites}
                                </Typography>
                              </Box>
                            </Box>
                            {point.distanceFromPrevious > 0 && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="caption" sx={{ color: '#00ff88' }}>
                                  Distance from previous: {(point.distanceFromPrevious * 1000).toFixed(1)} m
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar with Advanced Analytics */}
        <Box sx={{ width: 350, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Advanced Statistics */}
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Advanced Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0, 212, 255, 0.1)', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                      {advancedStats.totalPoints}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      Total Points
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 107, 53, 0.1)', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
                      {advancedStats.totalDistance.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      Total Distance (km)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0, 255, 136, 0.1)', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#00ff88', fontWeight: 'bold' }}>
                      {advancedStats.avgSpeed.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      Avg Speed (km/h)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 170, 0, 0.1)', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#ffaa00', fontWeight: 'bold' }}>
                      {advancedStats.maxSpeed.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      Max Speed (km/h)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Summary by Date */}
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', flexGrow: 1 }}>
            <CardContent sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Timeline sx={{ mr: 1 }} />
                Summary by Date
              </Typography>
              
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {processedData.dateSummaries.map((summary, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(0, 212, 255, 0.1)',
                        borderColor: '#00d4ff',
                      },
                    }}
                    onClick={() => setSelectedDate(summary.date)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                        {(() => {
                          try {
                            const [year, month, day] = summary.date.split('-');
                            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return format(dateObj, 'MMM dd');
                          } catch (error) {
                            return summary.date;
                          }
                        })()}
                      </Typography>
                      <Chip
                        label={`${summary.pointCount} pts`}
                        size="small"
                        sx={{ bgcolor: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff' }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        Distance: {summary.totalDistance.toFixed(2)} km
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        Avg: {summary.avgSpeed.toFixed(1)} km/h
                      </Typography>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={(summary.totalDistance / Math.max(...processedData.dateSummaries.map(s => s.totalDistance))) * 100}
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#00d4ff',
                        },
                      }}
                    />
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Enhanced Info Alert */}
      <Alert severity="info" sx={{ mt: 2, py: 1 }}>
        <Typography variant="caption">
          <Info sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '0.8rem' }} />
          Click markers for detailed information. Use animation controls to replay the trajectory. 
          Colors indicate speed: Blue (slow), Orange (medium), Red (fast).
        </Typography>
      </Alert>
    </Box>
  );
};

export default GPSMap; 