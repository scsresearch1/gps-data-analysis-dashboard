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
  Divider,
  LinearProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Speed,
  DirectionsWalk,
  Warning,
  TrendingUp,
  Timeline,
  Analytics,
  PlayArrow,
  Pause,
  FilterList,
  Settings,
  Visibility,
  VisibilityOff,
  CenterFocusStrong,
  Route,
  Straighten,
  AccessTime,
  Satellite,
  Height,
  Navigation,
  Timer,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/icons-material';

const MotionBehaviorAnalysis = ({ data, loading }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [speedThreshold, setSpeedThreshold] = useState(5);

  // Helper function to parse date correctly
  const parseDate = (dateString) => {
    try {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return new Date();
      }
      
      return date;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date();
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // First pass: calculate basic metrics
    const basicData = data.map((row, index) => {
      const timestamp = parseDate(row['Transmitted Time']);
      const lat = parseFloat(row.Latitude) || 0;
      const lon = parseFloat(row.Longitude) || 0;
      const direction = parseFloat(row.Direction) || 0;
      
      let speed = 0;
      let distance = 0;
      let directionDelta = 0;
      
      if (index > 0) {
        const prevLat = parseFloat(data[index - 1].Latitude) || 0;
        const prevLon = parseFloat(data[index - 1].Longitude) || 0;
        const prevTime = parseDate(data[index - 1]['Transmitted Time']);
        const prevDirection = parseFloat(data[index - 1].Direction) || 0;
        
        distance = calculateDistance(lat, lon, prevLat, prevLon);
        const timeDiff = (timestamp - prevTime) / 1000;
        speed = timeDiff > 0 ? (distance / 1000) / (timeDiff / 3600) : 0; // Convert to km/h
        
        directionDelta = Math.abs(direction - prevDirection);
        if (directionDelta > 180) {
          directionDelta = 360 - directionDelta;
        }
      }

      const isMoving = speed > speedThreshold;
      const isSharpTurn = directionDelta > 45;
      const isHighSpeed = speed > 50;

      return {
        index,
        timestamp,
        time: timestamp.toLocaleTimeString(),
        timeShort: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`,
        lat,
        lon,
        speed,
        distance: distance / 1000, // Convert to km
        direction,
        directionDelta,
        acceleration: 0, // Will be calculated in second pass
        isMoving,
        isSharpTurn,
        isHighSpeed,
        altitude: parseFloat(row.Altitude) || 0,
        satellites: parseInt(row.Satellites) || 0,
      };
    });

    // Second pass: calculate acceleration
    const finalData = basicData.map((point, index) => {
      if (index > 1) {
        const prevPoint = basicData[index - 1];
        const timeDiff = (point.timestamp - prevPoint.timestamp) / 1000;
        point.acceleration = timeDiff > 0 ? (point.speed - prevPoint.speed) / timeDiff : 0;
      }
      return point;
    });

    return finalData;
  }, [data, speedThreshold]);

  // Calculate motion analysis statistics
  const motionAnalysis = useMemo(() => {
    if (!processedData.length) return {};

    const movingPoints = processedData.filter(point => point.isMoving);
    const sharpTurns = processedData.filter(point => point.isSharpTurn);
    const highSpeedPoints = processedData.filter(point => point.isHighSpeed);
    
    // Find stop periods (consecutive stationary points)
    let stopPeriods = 0;
    let currentStopLength = 0;
    processedData.forEach(point => {
      if (!point.isMoving) {
        currentStopLength++;
      } else {
        if (currentStopLength > 3) { // Consider it a stop period if more than 3 consecutive stationary points
          stopPeriods++;
        }
        currentStopLength = 0;
      }
    });

    const speeds = processedData.map(p => p.speed).filter(s => s > 0);
    const directionDeltas = processedData.map(p => p.directionDelta).filter(d => d > 0);
    const accelerations = processedData.map(p => p.acceleration).filter(a => !isNaN(a));

    return {
      totalPoints: processedData.length,
      movingPoints: movingPoints.length,
      sharpTurns: sharpTurns.length,
      stopPeriodsCount: stopPeriods,
      highSpeedPoints: highSpeedPoints.length,
      avgSpeed: speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      maxSpeed: speeds.length ? Math.max(...speeds) : 0,
      avgDirectionDelta: directionDeltas.length ? directionDeltas.reduce((a, b) => a + b, 0) / directionDeltas.length : 0,
      maxDirectionDelta: directionDeltas.length ? Math.max(...directionDeltas) : 0,
      avgAcceleration: accelerations.length ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0,
      maxAcceleration: accelerations.length ? Math.max(...accelerations) : 0,
      totalDistance: processedData.reduce((sum, p) => sum + p.distance, 0),
      movingPercentage: (movingPoints.length / processedData.length) * 100,
    };
  }, [processedData]);

  // Get time ranges for filtering
  const timeRanges = useMemo(() => {
    if (!processedData.length) return [];
    
    const uniqueHours = [...new Set(processedData.map(p => p.timestamp.getHours()))];
    return uniqueHours.map(hour => ({
      value: hour.toString(),
      label: `${hour.toString().padStart(2, '0')}:00`
    }));
  }, [processedData]);

  const renderMetricCard = (title, value, icon, color, subtitle = '', progress = null) => (
    <Card sx={{ 
      background: 'linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(40, 50, 60, 0.95) 100%)',
      border: '2px solid rgba(255,255,255,0.1)',
      borderRadius: 3,
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: color,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${color}20`,
      }
    }}>
      <CardContent sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h4" sx={{ color: color, fontWeight: 'bold', mb: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: color, fontWeight: 'bold' }}>
            {subtitle}
          </Typography>
        )}
        {progress && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1,
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: color,
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  const renderChart = (data, type, title, color, height = 250) => (
    <Card sx={{ 
      background: 'linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(40, 50, 60, 0.95) 100%)',
      border: '2px solid rgba(255,255,255,0.1)',
      borderRadius: 3,
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: color,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${color}20`,
      }
    }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" sx={{ color: color, mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timeShort" stroke="#b0b0b0" fontSize={10} />
              <YAxis stroke="#b0b0b0" fontSize={10} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#ffffff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="speed" 
                stroke={color} 
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timeShort" stroke="#b0b0b0" fontSize={10} />
              <YAxis stroke="#b0b0b0" fontSize={10} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#ffffff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="directionDelta" 
                stroke={color} 
                fill={color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timeShort" stroke="#b0b0b0" fontSize={10} />
              <YAxis stroke="#b0b0b0" fontSize={10} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#ffffff'
                }}
              />
              <Bar dataKey="directionDelta" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : type === 'scatter' ? (
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timeShort" stroke="#b0b0b0" fontSize={10} />
              <YAxis stroke="#b0b0b0" fontSize={10} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#ffffff'
                }}
              />
              <Scatter dataKey="distance" fill={color} />
            </ScatterChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#ffffff'
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

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

  // Prepare chart data
  const chartData = processedData.slice(0, 50); // Show first 50 points for better visualization
  const pieData = [
    { name: 'Moving', value: motionAnalysis.movingPoints, color: '#4caf50' },
    { name: 'Stationary', value: motionAnalysis.totalPoints - motionAnalysis.movingPoints, color: '#f44336' },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%)',
      p: { xs: 1, sm: 2 }
    }}>
      {/* Compact Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: 1,
          mb: 1 
        }}>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#00d4ff', 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              <Speed sx={{ mr: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              Motion Behavior Analysis
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#b0b0b0', 
                mt: 0.5,
                fontSize: '0.875rem'
              }}
            >
              Movement patterns and speed analysis
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' }
          }}>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="all">All Time</MenuItem>
                {timeRanges.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Settings />}
              onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
              sx={{ 
                borderColor: '#00d4ff', 
                color: '#00d4ff',
                '&:hover': { borderColor: '#00e5ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Advanced
            </Button>
          </Box>
        </Box>

        {/* Compact Advanced Controls */}
        {showAdvancedMetrics && (
          <Paper sx={{ 
            p: 1.5, 
            mb: 1, 
            bgcolor: 'rgba(26, 35, 50, 0.8)',
            borderRadius: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center', 
              flexWrap: 'wrap' 
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Heatmap"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                  Speed Threshold: {speedThreshold} km/h
                </Typography>
                <Slider
                  value={speedThreshold}
                  onChange={(e, value) => setSpeedThreshold(value)}
                  min={1}
                  max={20}
                  step={1}
                  sx={{ width: 120, color: '#00d4ff' }}
                />
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Compact Main Content */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 2
      }}>
        {/* Left Column - Main Content */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2
        }}>
          {/* Compact Key Metrics */}
          <Grid container spacing={1.5}>
            <Grid item xs={6} sm={3}>
              {renderMetricCard(
                'Total Points',
                motionAnalysis.totalPoints || 0,
                <Analytics sx={{ color: '#00d4ff', fontSize: 24 }} />,
                '#00d4ff'
              )}
            </Grid>
            <Grid item xs={6} sm={3}>
              {renderMetricCard(
                'Moving Points',
                motionAnalysis.movingPoints || 0,
                <DirectionsWalk sx={{ color: '#4caf50', fontSize: 24 }} />,
                '#4caf50',
                `${motionAnalysis.movingPercentage?.toFixed(1)}%`,
                motionAnalysis.movingPercentage
              )}
            </Grid>
            <Grid item xs={6} sm={3}>
              {renderMetricCard(
                'Sharp Turns',
                motionAnalysis.sharpTurns || 0,
                <Warning sx={{ color: '#ff9800', fontSize: 24 }} />,
                '#ff9800'
              )}
            </Grid>
            <Grid item xs={6} sm={3}>
              {renderMetricCard(
                'Stop Periods',
                motionAnalysis.stopPeriodsCount || 0,
                <Timer sx={{ color: '#f44336', fontSize: 24 }} />,
                '#f44336'
              )}
            </Grid>
          </Grid>

          {/* Combined Analysis Section */}
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(40, 50, 60, 0.95) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#00d4ff',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 212, 255, 0.2)',
                }
              }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Speed sx={{ color: '#00d4ff', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                      Speed & Direction Analysis
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>Avg Speed</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold', fontSize: '1rem' }}>
                        {motionAnalysis.avgSpeed?.toFixed(1) || 0} km/h
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>Max Speed</Typography>
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold', fontSize: '1rem' }}>
                        {motionAnalysis.maxSpeed?.toFixed(1) || 0} km/h
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>Total Distance</Typography>
                      <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 'bold', fontSize: '1rem' }}>
                        {motionAnalysis.totalDistance?.toFixed(2) || 0} km
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>Avg Direction</Typography>
                      <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold', fontSize: '1rem' }}>
                        {motionAnalysis.avgDirectionDelta?.toFixed(1) || 0}°
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(40, 50, 60, 0.95) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#ff9800',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255, 152, 0, 0.2)',
                }
              }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <TrendingUp sx={{ color: '#ff9800', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      Movement Distribution
                    </Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                          border: '2px solid rgba(255,255,255,0.2)',
                          borderRadius: 8,
                          color: '#ffffff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Single Chart Section */}
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(40, 50, 60, 0.95) 100%)',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            height: 250,
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#00d4ff',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0, 212, 255, 0.2)',
            }
          }}>
            <CardContent sx={{ p: 1.5, height: '100%' }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 1.5, textAlign: 'center', fontWeight: 'bold' }}>
                Speed Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timeShort" stroke="#b0b0b0" fontSize={10} />
                  <YAxis stroke="#b0b0b0" fontSize={10} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(26, 35, 50, 0.95)', 
                      border: '2px solid rgba(255,255,255,0.2)',
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
                    activeDot={{ r: 6, stroke: '#00d4ff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Compact Right Column */}
        <Box sx={{ 
          width: { xs: '100%', lg: 280 },
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1.5
        }}>
          {/* Combined Analytics Card */}
          <Card sx={{ 
            bgcolor: 'rgba(26, 35, 50, 0.9)', 
            flexGrow: 1,
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#4caf50',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
            }
          }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Analytics Summary
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                    Moving vs Stationary
                  </Typography>
                  <Chip
                    label={`${motionAnalysis.movingPercentage?.toFixed(1)}% Moving`}
                    size="small"
                    sx={{ bgcolor: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }}
                  />
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={motionAnalysis.movingPercentage || 0}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#4caf50',
                    },
                  }}
                />

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                    Sharp Turns
                  </Typography>
                  <Chip
                    label={`${motionAnalysis.sharpTurns || 0} turns`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                    High Speed Points
                  </Typography>
                  <Chip
                    label={`${motionAnalysis.highSpeedPoints || 0} points`}
                    size="small"
                    sx={{ bgcolor: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem' }}>
                    Stop Periods
                  </Typography>
                  <Chip
                    label={`${motionAnalysis.stopPeriodsCount || 0} stops`}
                    size="small"
                    sx={{ bgcolor: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.875rem', mb: 1 }}>
                  Speed Distribution:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>0-10 km/h</Typography>
                    <Typography variant="caption" sx={{ color: '#4caf50' }}>
                      {processedData.filter(p => p.speed >= 0 && p.speed <= 10).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>10-30 km/h</Typography>
                    <Typography variant="caption" sx={{ color: '#ff9800' }}>
                      {processedData.filter(p => p.speed > 10 && p.speed <= 30).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>30-50 km/h</Typography>
                    <Typography variant="caption" sx={{ color: '#f44336' }}>
                      {processedData.filter(p => p.speed > 30 && p.speed <= 50).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>50+ km/h</Typography>
                    <Typography variant="caption" sx={{ color: '#9c27b0' }}>
                      {processedData.filter(p => p.speed > 50).length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default MotionBehaviorAnalysis; 