import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Slider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  PictureAsPdf,
  NavigateBefore,
  NavigateNext,
  Image,
  ZoomIn,
  ZoomOut,
  Visibility,
} from '@mui/icons-material';

const DesignData = ({ data, loading }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoRef, setVideoRef] = useState(null);
  
  // Image viewer states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const images = [
    '/DesignData/CaseD1.png',
    '/DesignData/CaseD2.png',
    '/DesignData/CaseD3.png',
    '/DesignData/CaseD4.png'
  ];

  // Product viewer states
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [productZoomLevel, setProductZoomLevel] = useState(1);
  const productImages = [
    '/DesignData/OutlookP1.png',
    '/DesignData/OutlookP2.png',
    '/DesignData/OutlookP3.png'
  ];



  // Video player functions
  const handlePlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (videoRef) {
      videoRef.pause();
      videoRef.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleMute = () => {
    if (videoRef) {
      videoRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef) {
      if (!isFullscreen) {
        if (videoRef.requestFullscreen) {
          videoRef.requestFullscreen();
        } else if (videoRef.webkitRequestFullscreen) {
          videoRef.webkitRequestFullscreen();
        } else if (videoRef.msRequestFullscreen) {
          videoRef.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef) {
      setCurrentTime(videoRef.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef) {
      setDuration(videoRef.duration);
    }
  };

  const handleSeek = (event) => {
    if (videoRef) {
      const newTime = (event.target.value / 100) * duration;
      videoRef.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Image navigation functions
  const handlePreviousImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleZoomChange = useCallback((event, newValue) => {
    setZoomLevel(newValue);
  }, []);

  // Product navigation functions
  const handlePreviousProduct = useCallback(() => {
    setCurrentProductIndex((prevIndex) => 
      prevIndex === 0 ? productImages.length - 1 : prevIndex - 1
    );
  }, [productImages.length]);

  const handleNextProduct = useCallback(() => {
    setCurrentProductIndex((prevIndex) => 
      prevIndex === productImages.length - 1 ? 0 : prevIndex + 1
    );
  }, [productImages.length]);

  // Product zoom functions
  const handleProductZoomIn = useCallback(() => {
    setProductZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleProductZoomOut = useCallback(() => {
    setProductZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleProductZoomReset = useCallback(() => {
    setProductZoomLevel(1);
  }, []);

  const handleProductZoomChange = useCallback((event, newValue) => {
    setProductZoomLevel(newValue);
  }, []);

  // Keyboard navigation for images
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      if (activeTab === 2) { // Image viewer tab
        if (event.key === 'ArrowLeft') {
          handlePreviousImage();
        } else if (event.key === 'ArrowRight') {
          handleNextImage();
        } else if (event.key === '+' || event.key === '=') {
          handleZoomIn();
        } else if (event.key === '-') {
          handleZoomOut();
        } else if (event.key === '0') {
          handleZoomReset();
        }
      } else if (activeTab === 3) { // Product viewer tab
        if (event.key === 'ArrowLeft') {
          handlePreviousProduct();
        } else if (event.key === 'ArrowRight') {
          handleNextProduct();
        } else if (event.key === '+' || event.key === '=') {
          handleProductZoomIn();
        } else if (event.key === '-') {
          handleProductZoomOut();
        } else if (event.key === '0') {
          handleProductZoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, currentImageIndex, currentProductIndex, handlePreviousImage, handleNextImage, handleZoomIn, handleZoomOut, handleZoomReset, handlePreviousProduct, handleNextProduct, handleProductZoomIn, handleProductZoomOut, handleProductZoomReset]);

    return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ color: '#00d4ff', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <PlayArrow sx={{ mr: 1, fontSize: '1.5rem' }} />
              Design Data Analysis
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mt: 0.5 }}>
              PCB 3D Design Video & Schematic Analysis
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#b0b0b0',
              '&.Mui-selected': {
                color: '#00d4ff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00d4ff',
            },
          }}
        >
          <Tab 
            icon={<PlayArrow />} 
            label="Video" 
            iconPosition="start"
          />
          <Tab 
            icon={<PictureAsPdf />} 
            label="Schematic" 
            iconPosition="start"
          />
          <Tab 
            icon={<Image />} 
            label="Cases" 
            iconPosition="start"
          />
          <Tab 
            icon={<Visibility />} 
            label="Product View" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1 }}>
        {activeTab === 0 && (
          /* Video Player Section */
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', height: '100%' }}>
            <CardContent sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <PlayArrow sx={{ mr: 1 }} />
                PCB 3D Design Video
              </Typography>
              
              <Box sx={{ position: 'relative', bgcolor: '#000', borderRadius: 2, overflow: 'hidden', height: 'calc(100% - 60px)' }}>
                <video
                  ref={setVideoRef}
                  src="/DesignData/PCB-3D.mp4"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
                
                {/* Video Controls */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  bgcolor: 'rgba(0,0,0,0.8)', 
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <IconButton
                    onClick={handlePlayPause}
                    sx={{ color: '#00d4ff', '&:hover': { color: '#00e5ff' } }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  
                  <IconButton
                    onClick={handleStop}
                    sx={{ color: '#00d4ff', '&:hover': { color: '#00e5ff' } }}
                  >
                    <Stop />
                  </IconButton>
                  
                  <Box sx={{ flexGrow: 1, mx: 2 }}>
                    <Slider
                      value={duration > 0 ? (currentTime / duration) * 100 : 0}
                      onChange={handleSeek}
                      sx={{
                        color: '#00d4ff',
                        '& .MuiSlider-thumb': { backgroundColor: '#00d4ff' },
                        '& .MuiSlider-track': { backgroundColor: '#00d4ff' },
                      }}
                    />
                  </Box>
                  
                  <Typography variant="caption" sx={{ color: '#ffffff', minWidth: '80px' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Typography>
                  
                  <IconButton
                    onClick={handleMute}
                    sx={{ color: '#00d4ff', '&:hover': { color: '#00e5ff' } }}
                  >
                    {isMuted ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                  
                  <IconButton
                    onClick={handleFullscreen}
                    sx={{ color: '#00d4ff', '&:hover': { color: '#00e5ff' } }}
                  >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          /* PDF Viewer Section */
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', height: '100%' }}>
            <CardContent sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <PictureAsPdf sx={{ mr: 1 }} />
                Schematic V1
              </Typography>
              
              <Box sx={{ 
                bgcolor: '#000', 
                borderRadius: 2, 
                overflow: 'hidden', 
                height: 'calc(100% - 60px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <iframe
                  src="/DesignData/SchematicV1.pdf"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  title="Schematic V1 PDF"
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {activeTab === 2 && (
          /* Image Viewer Section */
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', height: '100%' }}>
            <CardContent sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Image sx={{ mr: 1 }} />
                Case Analysis (CaseD{currentImageIndex + 1})
              </Typography>
              
              {/* Zoom Controls */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2,
                flexWrap: 'wrap'
              }}>
                <IconButton
                  onClick={handleZoomOut}
                  sx={{ 
                    color: '#00d4ff', 
                    bgcolor: 'rgba(0,0,0,0.3)',
                    '&:hover': { 
                      color: '#00e5ff',
                      bgcolor: 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  <ZoomOut />
                </IconButton>
                
                <Box sx={{ flexGrow: 1, mx: 2, minWidth: 200 }}>
                  <Slider
                    value={zoomLevel}
                    onChange={handleZoomChange}
                    min={0.25}
                    max={3}
                    step={0.25}
                    sx={{
                      color: '#00d4ff',
                      '& .MuiSlider-thumb': { backgroundColor: '#00d4ff' },
                      '& .MuiSlider-track': { backgroundColor: '#00d4ff' },
                    }}
                  />
                </Box>
                
                <IconButton
                  onClick={handleZoomIn}
                  sx={{ 
                    color: '#00d4ff', 
                    bgcolor: 'rgba(0,0,0,0.3)',
                    '&:hover': { 
                      color: '#00e5ff',
                      bgcolor: 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  <ZoomIn />
                </IconButton>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#00d4ff', 
                    fontWeight: 'bold',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}
                >
                  {Math.round(zoomLevel * 100)}%
                </Typography>
                
                <IconButton
                  onClick={handleZoomReset}
                  sx={{ 
                    color: '#00d4ff', 
                    bgcolor: 'rgba(0,0,0,0.3)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    '&:hover': { 
                      color: '#00e5ff',
                      bgcolor: 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  Reset
                </IconButton>
              </Box>
              
              <Box sx={{ 
                position: 'relative',
                bgcolor: '#000', 
                borderRadius: 2, 
                overflow: 'hidden', 
                height: 'calc(100% - 120px)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Left Navigation Arrow */}
                <IconButton
                  onClick={handlePreviousImage}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: '#00d4ff',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.9)',
                      color: '#00e5ff',
                    },
                    width: 48,
                    height: 48,
                  }}
                >
                  <NavigateBefore />
                </IconButton>

                {/* Image Display */}
                <img
                  src={images[currentImageIndex]}
                  alt={`CaseD${currentImageIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `scale(${zoomLevel})`,
                    transition: 'transform 0.2s ease-in-out',
                  }}
                />

                {/* Right Navigation Arrow */}
                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: '#00d4ff',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.9)',
                      color: '#00e5ff',
                    },
                    width: 48,
                    height: 48,
                  }}
                >
                  <NavigateNext />
                </IconButton>

                {/* Image Counter */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0,0,0,0.8)',
                  color: '#ffffff',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}>
                  {currentImageIndex + 1} / {images.length}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {activeTab === 3 && (
          /* Product Viewer Section */
          <Card sx={{ bgcolor: 'rgba(26, 35, 50, 0.9)', height: '100%' }}>
            <CardContent sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
                <Visibility sx={{ mr: 1 }} />
                Product View (OutlookP{currentProductIndex + 1})
              </Typography>
              
              {/* Product Zoom Controls */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2,
                flexWrap: 'wrap'
              }}>
                <IconButton
                  onClick={handleProductZoomOut}
                  sx={{ 
                    color: '#00d4ff', 
                    bgcolor: 'rgba(0,0,0,0.3)',
                    '&:hover': { 
                      color: '#00e5ff',
                      bgcolor: 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  <ZoomOut />
                </IconButton>
                
                <Box sx={{ flexGrow: 1, mx: 2, minWidth: 200 }}>
                  <Slider
                    value={productZoomLevel}
                    onChange={handleProductZoomChange}
                    min={0.25}
                    max={3}
                    step={0.25}
                    sx={{
                      color: '#00d4ff',
                      '& .MuiSlider-thumb': { backgroundColor: '#00d4ff' },
                      '& .MuiSlider-track': { backgroundColor: '#00d4ff' },
                    }}
                  />
                </Box>
                
                <IconButton
                  onClick={handleProductZoomIn}
                  sx={{ 
                    color: '#00d4ff', 
                    bgcolor: 'rgba(0,0,0,0.3)',
                    '&:hover': { 
                      color: '#00e5ff',
                      bgcolor: 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  <ZoomIn />
                </IconButton>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#00d4ff', 
                    fontWeight: 'bold',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}
                >
                  {Math.round(productZoomLevel * 100)}%
                </Typography>
                
                <IconButton
                  onClick={handleProductZoomReset}
                  sx={{ 
                    color: '#00d4ff', 
                    bgcolor: 'rgba(0,0,0,0.3)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    '&:hover': { 
                      color: '#00e5ff',
                      bgcolor: 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  Reset
                </IconButton>
              </Box>
              
              <Box sx={{ 
                position: 'relative',
                bgcolor: '#000', 
                borderRadius: 2, 
                overflow: 'hidden', 
                height: 'calc(100% - 120px)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Left Navigation Arrow */}
                <IconButton
                  onClick={handlePreviousProduct}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: '#00d4ff',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.9)',
                      color: '#00e5ff',
                    },
                    width: 48,
                    height: 48,
                  }}
                >
                  <NavigateBefore />
                </IconButton>

                {/* Product Image Display */}
                <img
                  src={productImages[currentProductIndex]}
                  alt={`OutlookP${currentProductIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `scale(${productZoomLevel})`,
                    transition: 'transform 0.2s ease-in-out',
                  }}
                />

                {/* Right Navigation Arrow */}
                <IconButton
                  onClick={handleNextProduct}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: '#00d4ff',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.9)',
                      color: '#00e5ff',
                    },
                    width: 48,
                    height: 48,
                  }}
                >
                  <NavigateNext />
                </IconButton>

                {/* Product Counter */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0,0,0,0.8)',
                  color: '#ffffff',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}>
                  {currentProductIndex + 1} / {productImages.length}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default DesignData;
