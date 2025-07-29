# GPS Data Analysis Dashboard

A comprehensive React-based dashboard for analyzing GPS trajectory data with interactive charts and modal views.

## 🚀 Features

- **Spatio-Temporal Analysis**: Speed, altitude, and direction over time
- **Motion Behavior Analysis**: Movement patterns and sharp turn detection
- **GNSS Signal Analysis**: Satellite count and signal quality assessment
- **Temporal Integrity Analysis**: Transmission reliability and packet analysis
- **Interactive Charts**: Click any chart to view in full-screen modal
- **Responsive Design**: Works on desktop and mobile devices

## 📊 Data Visualization

- **19 Interactive Charts** across 4 analysis modules
- **Modal Popup Views** for detailed chart examination
- **Real-time Data Processing** from CSV files
- **Professional Dark Theme** UI with Material-UI components

## 🛠️ Technology Stack

- **Frontend**: React.js, Material-UI, Recharts
- **Data Processing**: JavaScript ES6+
- **Charts**: Line, Bar, Scatter, Area, and Pie charts
- **Styling**: Material-UI theming with custom dark theme

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.js          # Main dashboard with tabs
│   ├── SpatioTemporalAnalysis.js
│   ├── MotionBehaviorAnalysis.js
│   ├── GNSSSignalAnalysis.js
│   └── TemporalIntegrityAnalysis.js
├── App.js                    # Main application component
└── index.js                  # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/scsresearch1/gps-data-analysis-dashboard.git
   cd gps-data-analysis-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📈 Data Format

The application expects GPS data in CSV format with the following columns:
- `Transmitted Time`: DD/MM/YYYY HH:MM:SS
- `Latitude`: Decimal degrees
- `Longitude`: Decimal degrees
- `Altitude`: Meters
- `Satellites`: Number of satellites
- `Direction`: Degrees (0-360)

## 🎯 Usage

1. **Load Data**: The application automatically loads `TestRun.csv`
2. **Navigate Tabs**: Switch between different analysis modules
3. **Interact with Charts**: Click any chart for full-screen view
4. **Analyze Data**: View statistics and trends in real-time

## 🌐 Deployment

### Frontend (Netlify)
- **Build Command**: `npm run build`
- **Publish Directory**: `build`
- **Environment Variables**: None required

### Backend (Render) - If needed
- **Runtime**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**scsresearch1** - [GitHub Profile](https://github.com/scsresearch1)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email scs.research.india@gmail.com or create an issue on GitHub.
