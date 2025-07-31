import React, { useMemo, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  CheckCircle,
  Error,
  TrendingUp,
  Analytics,
  SignalCellularAlt,
  Timer,
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
  Warning,
  Info,
} from '@mui/icons-material';

const TemporalIntegrityAnalysis = ({ data, loading }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showGapAnalysis, setShowGapAnalysis] = useState(true);
  const [showDriftAnalysis, setShowDriftAnalysis] = useState(true);
  const [selectedGap, setSelectedGap] = useState(null);

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

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((row, index) => {
      const timestamp = parseDate(row['Transmitted Time']);
      
      let timeGap = 0;
      let expectedInterval = 3;
      let isGap = false;
      let isDrift = false;
      let gapSeverity = 'normal';
      
      if (index > 0) {
        const prevTimestamp = parseDate(data[index - 1]['Transmitted Time']);
        timeGap = (timestamp - prevTimestamp) / 1000;
        
        isGap = timeGap > expectedInterval * 1.5;
        isDrift = Math.abs(timeGap - expectedInterval) > 0.5;
        
        // Determine gap severity
        if (timeGap > expectedInterval * 3) {
          gapSeverity = 'critical';
        } else if (timeGap > expectedInterval * 2) {
          gapSeverity = 'high';
        } else if (timeGap > expectedInterval * 1.5) {
          gapSeverity = 'medium';
        }
      }

      return {
        index,
        timestamp,
        time: timestamp.toLocaleTimeString(),
        timeShort: `${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`,
        timeGap,
        expectedInterval,
        isGap,
        isDrift,
        gapSeverity,
        packetIndex: index + 1,
        transmissionTime: timestamp.getTime(),
        reliability: isGap ? 0 : (isDrift ? 50 : 100),
      };
    });
  }, [data]);

  const temporalAnalysis = useMemo(() => {
    if (processedData.length === 0) return {};

    const gaps = processedData.filter(point => point.isGap);
    const drifts = processedData.filter(point => point.isDrift);
    const normalIntervals = processedData.filter(point => !point.isGap && !point.isDrift);
    
    const totalTime = processedData.length > 1 ? 
      (processedData[processedData.length - 1].timestamp - processedData[0].timestamp) / 1000 : 0;
    
    const totalPackets = processedData.length;
    const reliability = ((normalIntervals.length / totalPackets) * 100).toFixed(2);
    const packetLossRate = ((gaps.length / totalPackets) * 100).toFixed(2);
    const driftRate = ((drifts.length / totalPackets) * 100).toFixed(2);
    
    const timeGaps = processedData.map(p => p.timeGap).filter(g => g > 0);
    const avgInterval = timeGaps.length > 0 ? (timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length).toFixed(2) : 0;
    const maxGap = timeGaps.length > 0 ? Math.max(...timeGaps).toFixed(2) : 0;
    const minGap = timeGaps.length > 0 ? Math.min(...timeGaps).toFixed(2) : 0;
    
    // Calculate jitter (standard deviation of time gaps)
    const jitter = timeGaps.length > 0 ? 
      Math.sqrt(timeGaps.reduce((sum, gap) => sum + Math.pow(gap - avgInterval, 2), 0) / timeGaps.length).toFixed(2) : 0;

    // Analyze gap patterns
    const criticalGaps = gaps.filter(g => g.gapSeverity === 'critical').length;
    const highGaps = gaps.filter(g => g.gapSeverity === 'high').length;
    const mediumGaps = gaps.filter(g => g.gapSeverity === 'medium').length;

    return {
      totalPackets,
      reliability: parseFloat(reliability),
      packetLossRate: parseFloat(packetLossRate),
      driftRate: parseFloat(driftRate),
      jitter: parseFloat(jitter),
      totalTime: totalTime.toFixed(2),
      avgInterval: parseFloat(avgInterval),
      maxGap: parseFloat(maxGap),
      minGap: parseFloat(minGap),
      gaps: gaps.length,
      drifts: drifts.length,
      normalIntervals: normalIntervals.length,
      criticalGaps,
      highGaps,
      mediumGaps,
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
                dataKey="timeGap" 
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
                dataKey="timeGap" 
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
              <Bar dataKey="timeGap" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
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
  const chartData = processedData.slice(1, 50); // Show first 50 points for better visualization
  const pieData = [
    { name: 'Normal', value: temporalAnalysis.normalIntervals, color: '#4caf50' },
    { name: 'Drift', value: temporalAnalysis.drifts, color: '#ff9800' },
    { name: 'Gap', value: temporalAnalysis.gaps, color: '#f44336' },
  ];

  const gapSeverityData = [
    { name: 'Critical', value: temporalAnalysis.criticalGaps, color: '#f44336' },
    { name: 'High', value: temporalAnalysis.highGaps, color: '#ff9800' },
    { name: 'Medium', value: temporalAnalysis.mediumGaps, color: '#ffc107' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <Timer sx={{ mr: 1, fontSize: '2rem' }} />
              Temporal Integrity Analysis
            </Typography>
            <Typography variant="body1" sx={{ color: '#b0b0b0', mt: 0.5 }}>
              Comprehensive analysis of data transmission reliability and temporal consistency
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
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
                '&:hover': { borderColor: '#00e5ff', backgroundColor: 'rgba(0, 212, 255, 0.1)' }
              }}
            >
              Advanced
            </Button>
          </Box>
        </Box>

        {/* Advanced Controls */}
        {showAdvancedMetrics && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(26, 35, 50, 0.8)' }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showGapAnalysis}
                    onChange={(e) => setShowGapAnalysis(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Gap Analysis"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showDriftAnalysis}
                    onChange={(e) => setShowDriftAnalysis(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Drift Analysis"
              />
            </Box>
          </Paper>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
        {/* Left Column - Metrics and Charts */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Key Metrics */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              {renderMetricCard(
                'Total Packets',
                temporalAnalysis.totalPackets || 0,
                <Analytics sx={{ color: '#00d4ff', fontSize: 28 }} />,
                '#00d4ff'
              )}
            </Grid>
            <Grid item xs={6} md={3}>
              {renderMetricCard(
                'Reliability',
                `${temporalAnalysis.reliability || 0}%`,
                <CheckCircle sx={{ color: '#4caf50', fontSize: 28 }} />,
                '#4caf50',
                'Transmission Success Rate',
                temporalAnalysis.reliability
              )}
            </Grid>
            <Grid item xs={6} md={3}>
              {renderMetricCard(
                'Packet Loss',
                `${temporalAnalysis.packetLossRate || 0}%`,
                <Error sx={{ color: '#f44336', fontSize: 28 }} />,
                '#f44336',
                'Missing Packets'
              )}
            </Grid>
            <Grid item xs={6} md={3}>
              {renderMetricCard(
                'Jitter',
                `${temporalAnalysis.jitter || 0}s`,
                <SignalCellularAlt sx={{ color: '#ff9800', fontSize: 28 }} />,
                '#ff9800',
                'Timing Variation'
              )}
            </Grid>
          </Grid>

          {/* Transmission Statistics */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(40, 50, 60, 0.95) 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                height: '100%'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Timer sx={{ color: '#00d4ff', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                      Transmission Statistics
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Total Time</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {temporalAnalysis.totalTime}s
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Avg Interval</Typography>
                      <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                        {temporalAnalysis.avgInterval}s
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Max Gap</Typography>
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {temporalAnalysis.maxGap}s
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Min Gap</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {temporalAnalysis.minGap}s
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
                borderRadius: 3,
                height: '100%'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ color: '#00d4ff', mr: 1 }} />
                    <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                      Quality Metrics
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Normal Intervals</Typography>
                      <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {temporalAnalysis.normalIntervals}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Drifts Detected</Typography>
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {temporalAnalysis.drifts}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Gaps Detected</Typography>
                      <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                        {temporalAnalysis.gaps}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>Drift Rate</Typography>
                      <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {temporalAnalysis.driftRate}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {renderChart(
                chartData,
                'line',
                'Time Gaps Analysis',
                '#00d4ff',
                200
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderChart(
                chartData,
                'area',
                'Transmission Jitter',
                '#ff9800',
                200
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderChart(
                pieData,
                'pie',
                'Packet Distribution',
                '#4caf50',
                200
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderChart(
                gapSeverityData,
                'pie',
                'Gap Severity',
                '#f44336',
                200
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Right Column - Advanced Analytics */}
        <Box sx={{ width: 350, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Reliability Analysis */}
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', flexGrow: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ mr: 1 }} />
                Reliability Analysis
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Overall Reliability
                  </Typography>
                  <Chip
                    label={`${temporalAnalysis.reliability?.toFixed(1)}%`}
                    size="small"
                    sx={{ 
                      bgcolor: temporalAnalysis.reliability > 95 ? 'rgba(76, 175, 80, 0.2)' : 
                             temporalAnalysis.reliability > 80 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                      color: temporalAnalysis.reliability > 95 ? '#4caf50' : 
                             temporalAnalysis.reliability > 80 ? '#ff9800' : '#f44336'
                    }}
                  />
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={temporalAnalysis.reliability || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: temporalAnalysis.reliability > 95 ? '#4caf50' : 
                               temporalAnalysis.reliability > 80 ? '#ff9800' : '#f44336',
                    },
                  }}
                />

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Packet Loss Rate
                  </Typography>
                  <Chip
                    label={`${temporalAnalysis.packetLossRate?.toFixed(2)}%`}
                    size="small"
                    sx={{ bgcolor: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Drift Rate
                  </Typography>
                  <Chip
                    label={`${temporalAnalysis.driftRate?.toFixed(2)}%`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    Average Jitter
                  </Typography>
                  <Chip
                    label={`${temporalAnalysis.jitter?.toFixed(2)}s`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Gap Analysis */}
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', flexGrow: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1 }} />
                Gap Analysis
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Critical Gaps</Typography>
                  <Typography variant="caption" sx={{ color: '#f44336' }}>
                    {temporalAnalysis.criticalGaps || 0} gaps
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>High Severity</Typography>
                  <Typography variant="caption" sx={{ color: '#ff9800' }}>
                    {temporalAnalysis.highGaps || 0} gaps
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Medium Severity</Typography>
                  <Typography variant="caption" sx={{ color: '#ffc107' }}>
                    {temporalAnalysis.mediumGaps || 0} gaps
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>Total Gaps</Typography>
                  <Typography variant="caption" sx={{ color: '#00d4ff' }}>
                    {temporalAnalysis.gaps || 0} gaps
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default TemporalIntegrityAnalysis; 