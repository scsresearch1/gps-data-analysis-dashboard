import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  LinearProgress,
  Divider,
  CircularProgress,
  Alert,
  Slider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Speed,
  Analytics,
  CenterFocusStrong,
  LocationOn,
  Timeline,
  Satellite,
  AccessTime,
  Height,
  Navigation,
  Info,
  Map,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Popup, Marker, ZoomControl, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const [mapCenter] = useState([17.726, 78.256]);
  const [mapZoom, setMapZoom] = useState(16); // Increased default zoom
  const [mapRef, setMapRef] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Memoized helper function to parse DD-MM-YYYY HH.MM format
  const parseDate = useCallback((dateStr) => {
    try {
      const parts = dateStr.split(' ');
      if (parts.length !== 2) return null;
      
      const datePart = parts[0];
      const timePart = parts[1];
      
      const dateComponents = datePart.split('-');
      if (dateComponents.length !== 3) return null;
      
      const day = parseInt(dateComponents[0]);
      const month = parseInt(dateComponents[1]) - 1;
      let year = parseInt(dateComponents[2]);
      
      if (year < 100) {
        year += 2000;
      }
      
      const timeComponents = timePart.split('.');
      if (timeComponents.length !== 2) return null;
      
      const hour = parseInt(timeComponents[0]);
      const minute = parseInt(timeComponents[1]);
      
      // Set seconds to 0 since CSV doesn't include seconds
      return new Date(year, month, day, hour, minute, 0);
    } catch (error) {
      console.error('parseDate error:', error);
      return null;
    }
  }, []);

  // Memoized distance calculation
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Memoized dates extraction
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
  }, [data, parseDate]);

  // Memoized filtered data
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
  }, [data, selectedDate, parseDate]);

  // Optimized data processing with better memoization
  const processedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { points: [], dateSummaries: [], totalDistance: 0, trajectory: [] };
    }
    
    const points = [];
    const dateSummaries = [];
    const trajectory = [];
    let totalDistance = 0;
    
    // Pre-process all dates to avoid repeated parsing
    const processedRows = filteredData.map(row => {
      const dateStr = row['Transmitted Time'];
      if (!dateStr) return null;
      
      try {
        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) return null;
        
        return {
          ...row,
          parsedDate: date,
          dateKey: format(date, 'yyyy-MM-dd'),
        };
      } catch (error) {
        console.warn('Invalid date format in grouping:', dateStr);
        return null;
      }
    }).filter(Boolean);

    // Group data by date for multiple date analysis
    const groupedByDate = {};
    processedRows.forEach(row => {
      const dateKey = row.dateKey;
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(row);
    });

    // Process each date group
    Object.entries(groupedByDate).forEach(([dateKey, dateData]) => {
      const datePoints = [];
      let dateDistance = 0;
      
      // Sort by time using pre-parsed dates
      dateData.sort((a, b) => a.parsedDate - b.parsedDate);
      
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
          timestamp: row.parsedDate,
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
  }, [filteredData, parseDate, calculateDistance]);

  // Memoized advanced statistics
  const advancedStats = useMemo(() => {
    if (!processedData.points.length) {
      return {
        avgSpeed: 0,
        maxSpeed: 0,
        avgAltitude: 0,
        avgSatellites: 0,
        totalPoints: 0,
        totalDistance: 0,
        dateCount: 0,
      };
    }
    
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

  // Memoized marker icons to prevent recreation
  const markerIcons = useMemo(() => {
    return {
      slow: createCustomIcon('#00d4ff'),
      medium: createCustomIcon('#ffaa00'),
      fast: createCustomIcon('#ff4757'),
    };
  }, []);

  // Memoized marker click handler
  const handleMarkerClick = useCallback(() => {
    // Marker click handler - currently empty to avoid unused variable warnings
  }, []);

  // Handle zoom level changes
  const handleZoomChange = useCallback(() => {
    if (mapRef) {
      const currentZoom = mapRef.getZoom();
      setMapZoom(currentZoom);
    }
  }, [mapRef]);

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
          
                     <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
             <Button
               variant="outlined"
               size="small"
               onClick={() => mapRef?.zoomIn()}
               sx={{ 
                 borderColor: '#00d4ff', 
                 color: '#00d4ff',
                 '&:hover': { borderColor: '#00e5ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }
               }}
             >
               Zoom In
             </Button>
             <Button
               variant="outlined"
               size="small"
               onClick={() => mapRef?.zoomOut()}
               sx={{ 
                 borderColor: '#00d4ff', 
                 color: '#00d4ff',
                 '&:hover': { borderColor: '#00e5ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }
               }}
             >
               Zoom Out
             </Button>
             <Button
               variant="outlined"
               size="small"
               onClick={() => mapRef?.setZoom(12)}
               sx={{ 
                 borderColor: '#00ff88', 
                 color: '#00ff88',
                 '&:hover': { borderColor: '#00ffaa', backgroundColor: 'rgba(0, 255, 136, 0.1)' }
               }}
             >
               Street Level
             </Button>
             <Button
               variant="outlined"
               size="small"
               onClick={() => mapRef?.setZoom(16)}
               sx={{ 
                 borderColor: '#ffaa00', 
                 color: '#ffaa00',
                 '&:hover': { borderColor: '#ffcc00', backgroundColor: 'rgba(255, 170, 0, 0.1)' }
               }}
             >
               Building Level
             </Button>
                           <Button
                variant="outlined"
                size="small"
                onClick={() => mapRef?.setZoom(18)}
                sx={{ 
                  borderColor: '#ff4757', 
                  color: '#ff4757',
                  '&:hover': { borderColor: '#ff6b7a', backgroundColor: 'rgba(255, 71, 87, 0.1)' }
                }}
              >
                Max Detail
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => mapRef?.setZoom(20)}
                sx={{ 
                  borderColor: '#9c27b0', 
                  color: '#9c27b0',
                  '&:hover': { borderColor: '#ba68c8', backgroundColor: 'rgba(156, 39, 176, 0.1)' }
                }}
              >
                Ultra Detail
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => mapRef?.setZoom(22)}
                sx={{ 
                  borderColor: '#e91e63', 
                  color: '#e91e63',
                  '&:hover': { borderColor: '#f06292', backgroundColor: 'rgba(233, 30, 99, 0.1)' }
                }}
              >
                Maximum Zoom
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
                label={`${(processedData.totalDistance || 0).toFixed(2)} km Total`}
                color="success"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                icon={<Speed />}
                label={`${(advancedStats.avgSpeed || 0).toFixed(1)} km/h Avg`}
                color="warning"
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
                             <Chip
                 icon={<Satellite />}
                 label={`${(advancedStats.avgSatellites || 0).toFixed(0)} Sats Avg`}
                 color="info"
                 size="small"
                 sx={{ fontWeight: 'bold' }}
               />
               <Chip
                 icon={<Map />}
                 label={`Zoom: ${mapZoom}`}
                 color="secondary"
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
                         <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
               <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                 Zoom: {mapZoom}
               </Typography>
               <Button
                 size="small"
                 variant="outlined"
                 onClick={() => mapRef?.setZoom(10)}
                 sx={{ 
                   borderColor: '#00d4ff', 
                   color: '#00d4ff',
                   fontSize: '0.7rem',
                   py: 0.5,
                   px: 1
                 }}
               >
                 City
               </Button>
               <Button
                 size="small"
                 variant="outlined"
                 onClick={() => mapRef?.setZoom(14)}
                 sx={{ 
                   borderColor: '#00ff88', 
                   color: '#00ff88',
                   fontSize: '0.7rem',
                   py: 0.5,
                   px: 1
                 }}
               >
                 District
               </Button>
               <Button
                 size="small"
                 variant="outlined"
                 onClick={() => mapRef?.setZoom(16)}
                 sx={{ 
                   borderColor: '#ffaa00', 
                   color: '#ffaa00',
                   fontSize: '0.7rem',
                   py: 0.5,
                   px: 1
                 }}
               >
                 Street
               </Button>
               <Button
                 size="small"
                 variant="outlined"
                 onClick={() => mapRef?.setZoom(18)}
                 sx={{ 
                   borderColor: '#ff4757', 
                   color: '#ff4757',
                   fontSize: '0.7rem',
                   py: 0.5,
                   px: 1
                 }}
               >
                 Building
               </Button>
                               <Button
                  size="small"
                  variant="outlined"
                  onClick={() => mapRef?.setZoom(20)}
                  sx={{ 
                    borderColor: '#9c27b0', 
                    color: '#9c27b0',
                    fontSize: '0.7rem',
                    py: 0.5,
                    px: 1
                  }}
                >
                  Ultra
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => mapRef?.setZoom(22)}
                  sx={{ 
                    borderColor: '#e91e63', 
                    color: '#e91e63',
                    fontSize: '0.7rem',
                    py: 0.5,
                    px: 1
                  }}
                >
                  Max
                </Button>
             </Box>
             
             {/* Zoom Slider */}
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
               <Tooltip title="Zoom Out">
                 <IconButton
                   size="small"
                   onClick={() => mapRef?.zoomOut()}
                   sx={{ color: '#00d4ff' }}
                 >
                   <ZoomOut />
                 </IconButton>
               </Tooltip>
                               <Slider
                  value={mapZoom}
                  onChange={(event, newValue) => mapRef?.setZoom(newValue)}
                  min={8}
                  max={22}
                  step={1}
                  sx={{
                    width: 120,
                    color: '#00d4ff',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#00d4ff',
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#00d4ff',
                    },
                  }}
                />
               <Tooltip title="Zoom In">
                 <IconButton
                   size="small"
                   onClick={() => mapRef?.zoomIn()}
                   sx={{ color: '#00d4ff' }}
                 >
                   <ZoomIn />
                 </IconButton>
               </Tooltip>
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
                    maxZoom={22}
                    minZoom={8}
                    ref={(ref) => setMapRef(ref)}
                    whenCreated={(map) => {
                      setMapRef(map);
                      map.on('zoomend', handleZoomChange);
                    }}
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
                    
                    {/* Individual GPS point markers - Optimized rendering */}
                    {showMarkers && processedData.points.map((point, index) => {
                      const icon = point.speed > 50 ? markerIcons.fast : 
                                  point.speed > 20 ? markerIcons.medium : 
                                  markerIcons.slow;
                      
                      return (
                        <Marker
                          key={index}
                          position={[point.lat, point.lng]}
                          icon={icon}
                          eventHandlers={{
                            click: handleMarkerClick,
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
                                    {(point.speed || 0).toFixed(1)} km/h
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                    <LocationOn sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                    Coordinates
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                    {(point.lat || 0).toFixed(6)}, {(point.lng || 0).toFixed(6)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                    <Height sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                    Altitude
                                  </Typography>
                                  <Typography variant="body2">
                                    {(point.altitude || 0).toFixed(1)} m
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                                    <Navigation sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                                    Direction
                                  </Typography>
                                  <Typography variant="body2">
                                    {(point.direction || 0).toFixed(1)}°
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
                                    Distance from previous: {((point.distanceFromPrevious || 0) * 1000).toFixed(1)} m
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Popup>
                        </Marker>
                      );
                    })}
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
                      {(advancedStats.totalDistance || 0).toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      Total Distance (km)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(0, 255, 136, 0.1)', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#00ff88', fontWeight: 'bold' }}>
                      {(advancedStats.avgSpeed || 0).toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      Avg Speed (km/h)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 170, 0, 0.1)', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ color: '#ffaa00', fontWeight: 'bold' }}>
                      {(advancedStats.maxSpeed || 0).toFixed(1)}
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
                        Distance: {(summary.totalDistance || 0).toFixed(2)} km
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        Avg: {(summary.avgSpeed || 0).toFixed(1)} km/h
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