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
  BarChart,
  Bar,
  Histogram,
  AreaChart,
  Area,
} from 'recharts';
import {
  Close,
  ZoomIn,
} from '@mui/icons-material';

const TemporalIntegrityAnalysis = ({ data, loading }) => {
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

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((row, index) => {
      const timestamp = parseDate(row['Transmitted Time']);
      
      // Calculate time gaps
      let timeGap = 0;
      let expectedInterval = 3; // Expected 3-second intervals
      let isGap = false;
      let isDrift = false;
      
      if (index > 0) {
        const prevTimestamp = parseDate(data[index - 1]['Transmitted Time']);
        timeGap = (timestamp - prevTimestamp) / 1000; // seconds
        
        // Detect gaps (missing packets)
        isGap = timeGap > expectedInterval * 1.5; // More than 1.5x expected interval
        
        // Detect time drift
        isDrift = Math.abs(timeGap - expectedInterval) > 0.5; // More than 0.5s deviation
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
        packetIndex: index + 1,
        transmissionTime: timestamp.getTime(),
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
    
    const avgInterval = processedData.length > 1 ? 
      totalTime / (processedData.length - 1) : 0;
    
    const maxGap = Math.max(...processedData.map(p => p.timeGap));
    const minGap = Math.min(...processedData.map(p => p.timeGap));
    
    const packetLossRate = gaps.length / (processedData.length - 1) * 100;
    const driftRate = drifts.length / (processedData.length - 1) * 100;
    
    // Calculate jitter (standard deviation of intervals)
    const intervals = processedData.slice(1).map((point, index) => 
      (point.timestamp - processedData[index].timestamp) / 1000
    );
    const avgIntervalValue = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const jitter = Math.sqrt(
      intervals.reduce((sum, interval) => sum + Math.pow(interval - avgIntervalValue, 2), 0) / intervals.length
    );

    return {
      totalPackets: processedData.length,
      totalTime: totalTime.toFixed(2),
      avgInterval: avgInterval.toFixed(2),
      maxGap: maxGap.toFixed(2),
      minGap: minGap.toFixed(2),
      gaps: gaps.length,
      drifts: drifts.length,
      normalIntervals: normalIntervals.length,
      packetLossRate: packetLossRate.toFixed(2),
      driftRate: driftRate.toFixed(2),
      jitter: jitter.toFixed(3),
      reliability: ((1 - packetLossRate / 100) * 100).toFixed(2),
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
      case 'timeGaps':
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
              dataKey="timeGap" 
              stroke="#00bcd4" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'packetIntervals':
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
              dataKey="timeGap" 
              fill={(entry) => entry.isGap ? '#f44336' : entry.isDrift ? '#ff9800' : '#4caf50'}
            />
          </BarChart>
        );

      case 'reliability':
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
              dataKey="packetIndex" 
              fill="#00bcd4" 
              fillOpacity={0.3}
              stroke="#00bcd4"
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'distribution':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#b0b0b0" />
            <YAxis stroke="#b0b0b0" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                color: '#ffffff'
              }}
            />
            <Bar dataKey="value" fill="#00bcd4" />
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
        Temporal Integrity and Transmission Reliability Analysis
      </Typography>

      {/* Transmission Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Transmission Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Packets</Typography>
                  <Typography variant="h6">{temporalAnalysis.totalPackets}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Time</Typography>
                  <Typography variant="h6">{temporalAnalysis.totalTime}s</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg Interval</Typography>
                  <Typography variant="h6">{temporalAnalysis.avgInterval}s</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Max Gap</Typography>
                  <Typography variant="h6">{temporalAnalysis.maxGap}s</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Min Gap</Typography>
                  <Typography variant="h6">{temporalAnalysis.minGap}s</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Jitter</Typography>
                  <Typography variant="h6">{temporalAnalysis.jitter}s</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Reliability Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Packet Loss Rate</Typography>
                  <Typography variant="h6">{temporalAnalysis.packetLossRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Drift Rate</Typography>
                  <Typography variant="h6">{temporalAnalysis.driftRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Reliability</Typography>
                  <Typography variant="h6">{temporalAnalysis.reliability}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Gaps Detected</Typography>
                  <Typography variant="h6">{temporalAnalysis.gaps}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Drifts Detected</Typography>
                  <Typography variant="h6">{temporalAnalysis.drifts}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Normal Intervals</Typography>
                  <Typography variant="h6">{temporalAnalysis.normalIntervals}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time Gap Analysis */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Time Gap Analysis
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {processedData.slice(1).map((point, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #333', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Packet {point.packetIndex}</Typography>
                        <Typography variant="body1">{point.time}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Time Gap</Typography>
                        <Typography variant="body1">{point.timeGap.toFixed(2)}s</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={point.isGap ? 'Gap' : point.isDrift ? 'Drift' : 'Normal'} 
                          color={point.isGap ? 'error' : point.isDrift ? 'warning' : 'success'}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Deviation</Typography>
                        <Typography variant="body1">
                          {(point.timeGap - point.expectedInterval).toFixed(2)}s
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Time Gaps vs Packet Index */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Time Gaps vs Packet Index
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={processedData.slice(1)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="packetIndex" 
                    stroke="#b0b0b0"
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
                    dataKey="timeGap" 
                    stroke="#00bcd4" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expectedInterval" 
                    stroke="#ff9800" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Transmission Jitter */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Transmission Jitter Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.slice(1)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="packetIndex" 
                    stroke="#b0b0b0"
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
                    dataKey="timeGap" 
                    fill={(entry) => 
                      entry.isGap ? '#f44336' : 
                      entry.isDrift ? '#ff9800' : '#4caf50'
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cumulative Transmission Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Cumulative Transmission Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="packetIndex" 
                    stroke="#b0b0b0"
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
                    dataKey="transmissionTime" 
                    fill="#00bcd4" 
                    fillOpacity={0.3}
                    stroke="#00bcd4"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Packet Loss Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'rgba(26, 26, 26, 0.9)', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4' }}>
                Packet Loss Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { category: 'Normal', count: temporalAnalysis.normalIntervals, color: '#4caf50' },
                  { category: 'Drift', count: temporalAnalysis.drifts, color: '#ff9800' },
                  { category: 'Gap', count: temporalAnalysis.gaps, color: '#f44336' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="category" stroke="#b0b0b0" />
                  <YAxis stroke="#b0b0b0" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="count" fill="#00bcd4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TemporalIntegrityAnalysis; 