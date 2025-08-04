import React, { useState, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Speed,
  Analytics,
  Warning,
  Timer,
  TrendingUp,
  Settings,
  ZoomIn,
  Close,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

const TemporalIntegrityAnalysis = ({ data, loading }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showGapAnalysis, setShowGapAnalysis] = useState(true);
  const [showDriftAnalysis, setShowDriftAnalysis] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);

  // Helper function to parse date correctly
  const parseDate = (dateString) => {
    try {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      const [hour, minute] = timePart.split('.');
      
      // Create date with seconds set to 0 since CSV doesn't include seconds
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), 0);
      
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
        
        // More realistic gap detection - allow for more variation
        isGap = timeGap > expectedInterval * 2.5; // Increased from 2.0 to 2.5
        isDrift = Math.abs(timeGap - expectedInterval) > 1.5; // Increased from 1.0 to 1.5
        
        // Determine gap severity with more lenient thresholds
        if (timeGap > expectedInterval * 5) {
          gapSeverity = 'critical';
        } else if (timeGap > expectedInterval * 3.5) {
          gapSeverity = 'high';
        } else if (timeGap > expectedInterval * 2.5) {
          gapSeverity = 'medium';
        }
      }

      // More nuanced reliability scoring with better thresholds
      let reliabilityScore = 100; // Start with perfect score
      
      if (isGap) {
        reliabilityScore = 0; // Complete failure
      } else if (isDrift) {
        // Gradual reduction based on drift severity
        const driftSeverity = Math.abs(timeGap - expectedInterval) / expectedInterval;
        if (driftSeverity > 3.0) {
          reliabilityScore = 25; // Major drift
        } else if (driftSeverity > 2.0) {
          reliabilityScore = 50; // Moderate drift
        } else if (driftSeverity > 1.5) {
          reliabilityScore = 75; // Minor drift
        } else {
          reliabilityScore = 90; // Very minor drift
        }
      } else {
        // Perfect timing gets full score
        reliabilityScore = 100;
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
        reliability: reliabilityScore,
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
    
    // Calculate weighted reliability based on individual packet scores
    const totalReliability = processedData.reduce((sum, packet) => sum + packet.reliability, 0);
    const reliability = (totalReliability / totalPackets).toFixed(2);
    
    const packetLossRate = ((gaps.length / totalPackets) * 100).toFixed(2);
    const driftRate = ((drifts.length / totalPackets) * 100).toFixed(2);
    
    const timeGaps = processedData.map(p => p.timeGap).filter(g => g > 0);
    const avgInterval = timeGaps.length > 0 ? (timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length).toFixed(2) : 0;
    const maxGap = timeGaps.length > 0 ? Math.max(...timeGaps).toFixed(2) : 0;
    const minGap = timeGaps.length > 0 ? Math.min(...timeGaps).toFixed(2) : 0;
    
    // Calculate jitter only for consecutive readings within reasonable time windows
    const maxReasonableGap = 60; // Only consider gaps less than 60 seconds
    const reasonableGaps = timeGaps.filter(gap => gap <= maxReasonableGap);
    
    // Calculate average interval using only reasonable gaps
    const reasonableAvgInterval = reasonableGaps.length > 0 ? 
      reasonableGaps.reduce((sum, gap) => sum + gap, 0) / reasonableGaps.length : 0;
    
    const jitterStdDev = reasonableGaps.length > 0 ? 
      Math.sqrt(reasonableGaps.reduce((sum, gap) => sum + Math.pow(gap - reasonableAvgInterval, 2), 0) / reasonableGaps.length) : 0;
    
    // Convert to percentage using coefficient of variation
    const jitterPercentage = reasonableAvgInterval > 0 ? ((jitterStdDev / reasonableAvgInterval) * 100).toFixed(2) : 0;
    
    // Calculate standard deviation in milliseconds for display
    const jitterStdDevMs = (jitterStdDev * 1000).toFixed(2);

    // Analyze gap patterns
    const criticalGaps = gaps.filter(g => g.gapSeverity === 'critical').length;
    const highGaps = gaps.filter(g => g.gapSeverity === 'high').length;
    const mediumGaps = gaps.filter(g => g.gapSeverity === 'medium').length;

    return {
      totalPackets,
      reliability: parseFloat(reliability),
      packetLossRate: parseFloat(packetLossRate),
      driftRate: parseFloat(driftRate),
      jitter: parseFloat(jitterPercentage),
      jitterStdDev: parseFloat(jitterStdDevMs), // Standard deviation in milliseconds
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

  const handleChartClick = (chartType) => {
    setSelectedChart(chartType);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedChart(null);
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: color, fontWeight: 'bold' }}>
            {title}
          </Typography>
          <IconButton 
            size="small" 
            sx={{ color: color }}
            onClick={() => handleChartClick(title)}
          >
            <ZoomIn />
          </IconButton>
        </Box>
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
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
       <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '100%' }}>
                  {/* First Row - Key Metrics and Analysis */}
         <Grid container spacing={2} sx={{ mb: 2, width: '100%' }}>
           <Grid item xs={6} md={2}>
             {renderMetricCard(
               'Total Packets',
               temporalAnalysis.totalPackets || 0,
               <Analytics sx={{ color: '#00d4ff', fontSize: 28 }} />,
               '#00d4ff'
             )}
           </Grid>
           <Grid item xs={6} md={2}>
             {renderMetricCard(
               'Packet Loss',
               `${temporalAnalysis.packetLossRate || 0}%`,
               <Warning sx={{ color: '#f44336', fontSize: 28 }} />,
               '#f44336',
               'Missing Packets'
             )}
           </Grid>
           <Grid item xs={6} md={2}>
             {renderMetricCard(
               'Jitter',
               `${temporalAnalysis.jitter || 0}%`,
               <Speed sx={{ color: '#ff9800', fontSize: 28 }} />,
               '#ff9800',
               'Timing Variation'
             )}
           </Grid>
           <Grid item xs={6} md={3}>
             <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', height: '100%' }}>
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
                       Average Jitter (%)
                     </Typography>
                     <Chip
                       label={`${temporalAnalysis.jitter?.toFixed(2)}%`}
                       size="small"
                       sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' }}
                     />
                   </Box>
                 </Box>
               </CardContent>
             </Card>
           </Grid>
           <Grid item xs={6} md={3}>
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
         </Grid>

         {/* Second Row - Charts and Additional Metrics */}
         <Grid container spacing={2} sx={{ width: '100%' }}>
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
               'Transmission Jitter (%)',
               '#ff9800',
               200
             )}
           </Grid>
           <Grid item xs={12} md={4}>
             {renderChart(
               pieData,
               'pie',
               'Packet Distribution',
               '#4caf50',
               200
             )}
           </Grid>
           <Grid item xs={12} md={4}>
             {renderChart(
               gapSeverityData,
               'pie',
               'Gap Severity',
               '#f44336',
               200
             )}
           </Grid>
           <Grid item xs={12} md={4}>
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

                 
      </Box>
      
      {/* Chart Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(26, 35, 50, 0.95)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 3,
          }
        }}
      >
        <DialogContent sx={{ p: 3, position: 'relative' }}>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#b0b0b0',
              '&:hover': { color: '#ffffff' }
            }}
          >
            <Close />
          </IconButton>
          <Typography variant="h5" sx={{ color: '#00d4ff', mb: 3, textAlign: 'center' }}>
            {selectedChart}
          </Typography>
          <Box sx={{ height: 500 }}>
            {selectedChart === 'Time Gaps Analysis' && (
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timeShort" stroke="#b0b0b0" fontSize={12} />
                  <YAxis stroke="#b0b0b0" fontSize={12} />
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
                    stroke="#00d4ff" 
                    strokeWidth={3}
                    dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#00d4ff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {selectedChart === 'Transmission Jitter (%)' && (
              <ResponsiveContainer width="100%" height={450}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timeShort" stroke="#b0b0b0" fontSize={12} />
                  <YAxis stroke="#b0b0b0" fontSize={12} />
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
                    stroke="#ff9800" 
                    fill="#ff9800"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {selectedChart === 'Packet Distribution' && (
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
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
            )}
            {selectedChart === 'Gap Severity' && (
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <Pie
                    data={gapSeverityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {gapSeverityData.map((entry, index) => (
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
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TemporalIntegrityAnalysis; 