import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState([
    {
      id: 1,
      name: "Fresh Banana",
      calories: 105,
      nutrition: "High in potassium",
      quality: "Excellent",
      image: "/campus-eats.jpg",
      timestamp: "2 minutes ago"
    },
    {
      id: 2,
      name: "Overripe Apple",
      calories: 80,
      nutrition: "Good fiber source",
      quality: "Use soon - soft spots detected",
      image: "/campus-eats.jpg",
      timestamp: "5 minutes ago"
    }
  ]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFood = async () => {
    if (!selectedImage) return;
    
    setAnalyzing(true);
    
    // Simulate AI analysis with different results based on file name
    setTimeout(() => {
      const fileName = selectedImage.name.toLowerCase();
      let result;
      
      if (fileName.includes('banana')) {
        result = {
          name: "Fresh Banana",
          calories: 105,
          nutrition: "High in potassium",
          quality: "Excellent",
          qualityDetails: "Perfect ripeness, no blemishes detected",
          groqPowered: true
        };
      } else if (fileName.includes('apple')) {
        result = {
          name: "Overripe Apple",
          calories: 80,
          nutrition: "Good fiber source",
          quality: "Use soon - soft spots detected",
          qualityDetails: "Soft spots detected, consume within 24 hours",
          groqPowered: true
        };
      } else {
        result = {
          name: "Food Item Detected",
          calories: Math.floor(Math.random() * 200) + 50,
          nutrition: "Nutritional analysis complete",
          quality: "Good condition",
          qualityDetails: "Standard quality assessment",
          groqPowered: true
        };
      }
      
      setAnalysisResult(result);
      setAnalyzing(false);
      
      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        ...result,
        image: previewUrl,
        timestamp: "Just now"
      };
      setScanHistory([newHistoryItem, ...scanHistory]);
    }, 2000);
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🍌 SnackOverflow</h1>
        <p>Real-time food analysis powered by Groq</p>
        <button 
          className="history-button"
          onClick={() => setShowHistory(!showHistory)}
        >
          📋 {showHistory ? 'Hide' : 'Show'} History
        </button>
      </header>
      
      <main className="App-main">
        {!showHistory ? (
          <>
            <div className="upload-container">
              <div className="upload-area">
                <h2>📸 Scan Your Food</h2>
                <p>Take a photo or upload an image to get instant nutrition and quality analysis</p>
                
                <div className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    id="image-upload"
                    className="file-input"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    {previewUrl ? (
                      <div className="preview-container">
                        <img src={previewUrl} alt="Preview" className="preview-image" />
                        <div className="preview-overlay">
                          <span>Click to change image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <div className="upload-icon">📸</div>
                        <p>Click to take photo or upload image</p>
                        <p className="upload-hint">Supports: JPG, PNG, GIF</p>
                      </div>
                    )}
                  </label>
                </div>
                
                {selectedImage && !analysisResult && (
                  <div className="upload-actions">
                    <button 
                      className="analyze-button"
                      onClick={analyzeFood}
                      disabled={analyzing}
                    >
                      {analyzing ? '🔍 Analyzing...' : '🔍 Analyze Food'}
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={resetAnalysis}
                      disabled={analyzing}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {analysisResult && (
              <div className="analysis-container">
                <div className="analysis-card">
                  <div className="analysis-header">
                    <h3>🍎 {analysisResult.name}</h3>
                    <div className="groq-badge">
                      Powered by Groq
                    </div>
                  </div>
                  
                  <div className="analysis-content">
                    <div className="nutrition-info">
                      <div className="calorie-badge">
                        <span className="calorie-number">{analysisResult.calories}</span>
                        <span className="calorie-label">calories</span>
                      </div>
                      <p className="nutrition-text">{analysisResult.nutrition}</p>
                    </div>
                    
                    <div className="quality-info">
                      <h4>Quality Assessment</h4>
                      <div className={`quality-badge ${analysisResult.quality.includes('Excellent') ? 'excellent' : 'warning'}`}>
                        {analysisResult.quality}
                      </div>
                      <p className="quality-details">{analysisResult.qualityDetails}</p>
                    </div>
                  </div>
                  
                  <div className="analysis-actions">
                    <button 
                      className="save-button"
                      onClick={() => {
                        alert('Saved to your food diary! 📝');
                      }}
                    >
                      Save to Diary
                    </button>
                    <button 
                      className="scan-again-button"
                      onClick={resetAnalysis}
                    >
                      Scan Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="history-container">
            <h2>📋 Recent Scans</h2>
            <div className="history-list">
              {scanHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <img src={item.image} alt={item.name} className="history-image" />
                  <div className="history-content">
                    <h4>{item.name}</h4>
                    <div className="history-details">
                      <span className="calories">{item.calories} cal</span>
                      <span className="nutrition">{item.nutrition}</span>
                    </div>
                    <div className={`quality-indicator ${item.quality.includes('Excellent') ? 'excellent' : 'warning'}`}>
                      {item.quality}
                    </div>
                    <span className="timestamp">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="features-section">
          <div className="feature-card">
            <h3>🔍 Real-time Analysis</h3>
            <p>Instant food detection and nutrition analysis powered by advanced AI.</p>
          </div>
          <div className="feature-card">
            <h3>🍎 Quality Assessment</h3>
            <p>Get detailed quality insights and freshness recommendations.</p>
          </div>
          <div className="feature-card">
            <h3>📱 Mobile Optimized</h3>
            <p>Perfect camera interface for on-the-go food scanning.</p>
          </div>
        </div>
      </main>
      
      <footer className="App-footer">
        <p>&copy; 2024 SnackOverflow. Real-time quality assessment powered by Groq 🚀</p>
      </footer>
    </div>
  );
}

export default App; 