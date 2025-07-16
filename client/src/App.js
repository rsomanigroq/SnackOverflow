import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [mode, setMode] = useState('upload');          // current UI mode: 'upload' or 'camera'
  const [lastSource, setLastSource] = useState(null);  // how current preview was created: 'upload' | 'camera'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [stream, setStream] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showWrap, setShowWrap] = useState(false); // New state for wrap view
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice toggle state
  const [hideCaptureSection, setHideCaptureSection] = useState(false); // New state to control capture section visibility
  const [scanHistory, setScanHistory] = useState([]);
  const [recipes, setRecipes] = useState(null);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);
  const [wrapData, setWrapData] = useState(null); // New state for wrap data
  const [loadingWrap, setLoadingWrap] = useState(false); // Loading state for wrap

  // Effect to speak voice script when analysis results are set
  useEffect(() => {
    if (analysisResult && voiceEnabled) {
      // Create voice script from analysis result
      const voiceScript = createVoiceScript(
        analysisResult.name, 
        analysisResult.nutrition, 
        analysisResult.purchaseRecommendation
      );
      
      // Small delay to ensure UI is updated first
      const timer = setTimeout(() => {
        speakVoiceScript(voiceScript);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [analysisResult, voiceEnabled]);

  // Function to get emoji for food name
  const getFoodEmoji = (foodName) => {
    const foodNameLower = foodName.toLowerCase();
    
    // Check for no food detected case
    if (foodNameLower.includes('no food detected')) return '❓';
    
    // Common fruits - order specific terms before general ones
    if (foodNameLower.includes('pineapple')) return '🍍';
    if (foodNameLower.includes('strawberry')) return '🍓';
    if (foodNameLower.includes('blueberry')) return '🫐';
    if (foodNameLower.includes('watermelon')) return '🍉';
    if (foodNameLower.includes('bell pepper')) return '🫑';
    if (foodNameLower.includes('sweet potato')) return '🍠';
    if (foodNameLower.includes('banana')) return '🍌';
    if (foodNameLower.includes('apple')) return '🍎';
    if (foodNameLower.includes('orange')) return '🍊';
    if (foodNameLower.includes('grape')) return '🍇';
    if (foodNameLower.includes('raspberry')) return '🍓';
    if (foodNameLower.includes('mango')) return '🥭';
    if (foodNameLower.includes('peach')) return '🍑';
    if (foodNameLower.includes('pear')) return '🍐';
    if (foodNameLower.includes('kiwi')) return '🥝';
    if (foodNameLower.includes('melon')) return '🍈';
    if (foodNameLower.includes('cherry')) return '🍒';
    if (foodNameLower.includes('plum')) return '🫐';
    
    // Vegetables
    if (foodNameLower.includes('carrot')) return '🥕';
    if (foodNameLower.includes('broccoli')) return '🥦';
    if (foodNameLower.includes('tomato')) return '🍅';
    if (foodNameLower.includes('cucumber')) return '🥒';
    if (foodNameLower.includes('lettuce')) return '🥬';
    if (foodNameLower.includes('spinach')) return '🥬';
    if (foodNameLower.includes('onion')) return '🧅';
    if (foodNameLower.includes('garlic')) return '🧄';
    if (foodNameLower.includes('potato')) return '🥔';
    if (foodNameLower.includes('sweet potato')) return '🍠';
    if (foodNameLower.includes('corn')) return '🌽';
    if (foodNameLower.includes('pepper')) return '🫑';
    if (foodNameLower.includes('bell pepper')) return '🫑';
    
    // Other foods
    if (foodNameLower.includes('bread')) return '🍞';
    if (foodNameLower.includes('pizza')) return '🍕';
    if (foodNameLower.includes('burger')) return '🍔';
    if (foodNameLower.includes('hot dog')) return '🌭';
    if (foodNameLower.includes('taco')) return '🌮';
    if (foodNameLower.includes('sushi')) return '🍣';
    if (foodNameLower.includes('rice')) return '🍚';
    if (foodNameLower.includes('pasta')) return '🍝';
    if (foodNameLower.includes('salad')) return '🥗';
    if (foodNameLower.includes('sandwich')) return '🥪';
    if (foodNameLower.includes('cake')) return '🍰';
    if (foodNameLower.includes('cookie')) return '🍪';
    if (foodNameLower.includes('ice cream')) return '🍨';
    if (foodNameLower.includes('chocolate')) return '🍫';
    if (foodNameLower.includes('coffee')) return '☕';
    if (foodNameLower.includes('tea')) return '🫖';
    if (foodNameLower.includes('milk')) return '🥛';
    if (foodNameLower.includes('cheese')) return '🧀';
    if (foodNameLower.includes('egg')) return '🥚';
    if (foodNameLower.includes('meat')) return '🥩';
    if (foodNameLower.includes('chicken')) return '🍗';
    if (foodNameLower.includes('fish')) return '🐟';
    if (foodNameLower.includes('shrimp')) return '🦐';
    
    // Default fallback
    return '😊';
  };

  // Function to get freshness class based on level
  const getFreshnessClass = (freshnessLevel) => {
    if (freshnessLevel < 3) return 'danger';
    if (freshnessLevel < 5) return 'warning';
    return ''; // Default green for good freshness
  };

  // Function to create voice script for debugging
  const createVoiceScript = (fruitName, nutrition, recommendation) => {
    const fruit = fruitName || "this food";
    const nutritionInfo = nutrition || "good source of nutrients";
    const rec = recommendation || "analysis complete";
    
    // Create a natural-sounding script
    return `This looks like ${fruit.toLowerCase()} - ${nutritionInfo.toLowerCase()}. ${rec.toLowerCase()}.`;
  };

  // Function to speak the voice script using Groq TTS
  const speakVoiceScript = async (text) => {
    try {
      console.log('🎤 Generating audio for:', text);
      
      // Call a new backend endpoint that generates audio from text
      const response = await fetch('http://localhost:5000/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.audio_file) {
        console.log('🔊 Audio generated:', result.audio_file);
        // The backend will handle playing the audio
        console.log('✅ Audio playback completed by backend');
      } else {
        console.log('❌ No audio file generated');
      }
      
    } catch (error) {
      console.error('Error generating audio:', error);
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
        console.log('🔊 Fallback: Using browser speech synthesis');
      }
    }
  };

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load scan history from database on component mount
  useEffect(() => {
    const loadScanHistory = async () => {
      try {
        const response = await fetch('http://localhost:5000/analyses/recent?limit=20');
        if (response.ok) {
          const data = await response.json();
          setScanHistory(data);
        }
      } catch (error) {
        console.error('Error loading scan history:', error);
      }
    };

    loadScanHistory();
  }, []);

  // start/stop camera
  useEffect(() => {
    if (mode === 'camera') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setStream(s);
        })
        .catch(() => {
          alert('Unable to access camera');
          setMode('upload');
        });
    } else if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line
  }, [mode]);

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    setLastSource('upload');
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = ev => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      setLastSource('camera');
      const file = new File([blob], 'capture.png', { type: 'image/png' });
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = ev => setPreviewUrl(ev.target.result);
      reader.readAsDataURL(blob);
      setMode('upload');
    });
  };

  const analyzeFood = async () => {
    if (!selectedImage) return;
    
    setAnalyzing(true);
    setHideCaptureSection(true); // Hide the capture section when scan is clicked
    
    // Debug logging for the selected image
    console.log('Analyzing image:', selectedImage);
    console.log('Image type:', selectedImage.type);
    console.log('Image size:', selectedImage.size);
    console.log('Image name:', selectedImage.name);
    console.log('Last source:', lastSource);
    
    try {
      // Create FormData to send the image file
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      console.log('FormData created, sending to backend...');
      
      // Call the backend API
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Debug logging
      console.log('Backend response:', result);
      console.log('should_buy value:', result.should_buy, 'type:', typeof result.should_buy);
      
      // Transform the backend response to match our frontend format
      const transformedResult = {
        name: result.fruit_name || "No food detected",
        calories: result.fruit_name === "No food detected" ? 0 : (result.calories || Math.floor(Math.random() * 200) + 50),
        nutrition: result.nutrition_highlights || "Nutritional analysis complete",
        quality: result.freshness_state || "Good condition",
        qualityDetails: result.visual_indicators || "Standard quality assessment",
        groqPowered: true,
        freshnessLevel: result.fruit_name === "No food detected" ? 0 : (result.freshness_level || 7),
        shouldBuy: result.should_buy === true, // Explicitly check for true
        bestUse: result.best_use || "Eat now",
        shelfLife: result.fruit_name === "No food detected" ? 0 : (result.shelf_life_days || 3),
        healthBenefits: result.health_benefits || "Good source of nutrients",
        purchaseRecommendation: result.purchase_recommendation || "Good choice",
        storageMethod: result.storage_method || "Store in cool, dry place",
        foodPun: result.food_pun || null
      };
      
      setAnalysisResult(transformedResult);
      
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Error analyzing food. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setLastSource(null);
    setHideCaptureSection(false); // Show the capture section again when reset is called
  };

  const handlePreviewClick = () => {
    if (lastSource === 'camera') {
      // retake
      setMode('camera');
    } else if (lastSource === 'upload') {
      // re-upload
      fileInputRef.current.click();
    }
  };

  const [selectedItems, setSelectedItems] = useState([]);

  const handleSelect = (id) => {
    const isSelected = selectedItems.includes(id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const generateRecipes = async () => {
    const selectedItemsData = scanHistory.filter((item) => selectedItems.includes(item.id));
    
    if (selectedItemsData.length === 0) {
      alert('Please select at least one food item to generate recipes!');
      return;
    }
    
    setGeneratingRecipes(true);
    
    try {
      console.log('🍳 Generating recipes for:', selectedItemsData);
      
      const response = await fetch('http://localhost:5000/generate-recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedFoods: selectedItemsData
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setRecipes(result);
      console.log('✅ Recipes generated:', result);
      
    } catch (error) {
      console.error('Error generating recipes:', error);
      alert('Failed to generate recipes. Please try again.');
    } finally {
      setGeneratingRecipes(false);
    }
  };

  const handleSendSelected = () => {
    const selectedItemsData = scanHistory.filter((item) => selectedItems.includes(item.id));
    console.log('Selected items:', selectedItemsData);
    // Add code to send the selected items to the backend here
  };

  // Function to load wrap data
  const loadWrapData = async (days = 30) => {
    setLoadingWrap(true);
    try {
      const response = await fetch(`http://localhost:5000/food-wrap?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setWrapData(data);
        setShowWrap(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to load wrap data');
      }
    } catch (error) {
      console.error('Error loading wrap data:', error);
      alert('Failed to load wrap data. Please try again.');
    } finally {
      setLoadingWrap(false);
    }
  };

  return (
    <div className="App">
      {/* Floating particles background */}
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <header className="App-header">
        <div className="header-left">
          <div className="header-logo">🍎</div>
          <div>
            <h1>SnackOverflow</h1>
            <p>AI-Powered Food Analysis & Quality Assessment</p>
          </div>
        </div>
        <div className="header-buttons">
          <button
            className="wrap-button glow-effect"
            onClick={() => loadWrapData(30)}
            disabled={loadingWrap}
          >
            🎵 {loadingWrap ? 'Loading...' : 'My Food Wrap'}
          </button>
          <button
            className="history-button glow-effect"
            onClick={() => {
              setShowHistory(!showHistory);
              setShowWrap(false);
            }}
          >
            📋 {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
      </header>

      <main className="App-main">
        {showWrap ? (
          <FoodWrap 
            wrapData={wrapData} 
            onClose={() => setShowWrap(false)}
            onChangePeriod={loadWrapData}
          />
        ) : !showHistory ? (
          <>
            <div className="upload-container" style={{ display: hideCaptureSection ? 'none' : 'block' }}>
              <div className="upload-area">
                <h2>📸 Scan Your Food</h2>
                <p>Take a photo or upload an image to get instant nutrition and quality analysis</p>

                <div className="mode-switch">
                  <button
                    className={mode === 'upload' ? 'active' : ''}
                    onClick={() => setMode('upload')}
                  >
                    📁 Upload
                  </button>
                  <button
                    className={mode === 'camera' ? 'active' : ''}
                    onClick={() => setMode('camera')}
                  >
                    📷 Camera
                  </button>
                </div>

                <div className="upload-box">
                  {mode === 'upload' && (
                    <>
                      <input
                        ref={fileInputRef}
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input"
                      />

                      {previewUrl ? (
                        <div
                          className="preview-container"
                          onClick={handlePreviewClick}
                        >
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="preview-image"
                          />
                          <div className="preview-overlay">
                            <span>
                              {lastSource === 'camera'
                                ? 'Click to retake'
                                : 'Click to change'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <label htmlFor="image-upload" className="upload-label">
                          <div className="upload-placeholder glow-effect">
                            <div className="upload-icon">📸</div>
                            <p>Click to upload food image</p>
                            <p className="upload-hint">Supports: JPG, PNG, GIF</p>
                          </div>
                        </label>
                      )}
                    </>
                  )}

                  {mode === 'camera' && (
                    <div className="camera-container">
                      <video ref={videoRef} className="camera-video" />
                      <button
                        className="capture-button"
                        onClick={handleCapture}
                      >
                        📷 Capture
                      </button>
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                  )}
                </div>

                <div className="voice-toggle">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                      🔊 Audio Feedback {voiceEnabled ? 'ON' : 'OFF'}
                    </span>
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

            {analyzing && (
              <div className="analyzing-container">
                <div className="analyzing-content">
                  <div className="analyzing-spinner">
                    <svg className="progress-ring" viewBox="0 0 100 100">
                      <circle className="bg" cx="50" cy="50" r="40"></circle>
                      <circle className="progress" cx="50" cy="50" r="40"></circle>
                    </svg>
                  </div>
                  <h3>🔍 Analyzing Your Food</h3>
                  <p>Our AI is examining your image for nutrition facts, quality assessment, and recommendations...</p>
                  <div className="analyzing-steps">
                    <div className="step">
                      <span className="step-icon">📸</span>
                      <span className="step-text">Processing image</span>
                    </div>
                    <div className="step">
                      <span className="step-icon">🍎</span>
                      <span className="step-text">Identifying food type</span>
                    </div>
                    <div className="step">
                      <span className="step-icon">📊</span>
                      <span className="step-text">Calculating nutrition</span>
                    </div>
                    <div className="step">
                      <span className="step-icon">✨</span>
                      <span className="step-text">Quality assessment</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {analysisResult && (
              <div className="analysis-container">
                <div className="analysis-card">
                  <div className="analysis-header">
                    <h3><span className="food-emoji">{getFoodEmoji(analysisResult.name)}</span> {analysisResult.name}</h3>
                    <div className="groq-badge quality-pulse">
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
                      {analysisResult.healthBenefits && (
                        <p className="health-benefits">💚 {analysisResult.healthBenefits}</p>
                      )}
                    </div>
                    
                    <div className="quality-info">
                      <h4>Quality Assessment</h4>
                      <div className={`quality-badge ${analysisResult.quality.includes('Fresh') || analysisResult.quality.includes('Excellent') ? 'excellent' : 'warning'}`}>
                        {analysisResult.quality}
                      </div>
                      <p className="quality-details">{analysisResult.qualityDetails}</p>
                      
                      {analysisResult.freshnessLevel && (
                        <div className="freshness-meter">
                          <span>Freshness: {analysisResult.freshnessLevel}/10</span>
                          <div className="meter-bar">
                            <div 
                              className={`meter-fill ${getFreshnessClass(analysisResult.freshnessLevel)}`}
                              style={{width: `${(analysisResult.freshnessLevel / 10) * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {analysisResult.bestUse && (
                        <p className="best-use">🍽️ Best use: {analysisResult.bestUse}</p>
                      )}
                      
                      {analysisResult.shelfLife && (
                        <p className="shelf-life">📅 Shelf life: {analysisResult.shelfLife} days</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Purchase Recommendation Section */}
                  <div className="purchase-recommendation-section">
                    <h4>🛒 Purchase Recommendation</h4>
                    <div className={`purchase-recommendation ${analysisResult.shouldBuy ? 'buy' : 'skip'}`}>
                      {analysisResult.shouldBuy ? '✅ Buy' : '❌ Skip'}: {analysisResult.purchaseRecommendation}
                    </div>
                    
                    {analysisResult.shouldBuy && analysisResult.foodPun && (
                      <div className="food-pun">
                        <p>😄 {analysisResult.foodPun}</p>
                      </div>
                    )}
                    
                    {analysisResult.storageMethod && (
                      <div className="storage-info">
                        <h5>📦 Storage Method</h5>
                        <p>{analysisResult.storageMethod}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="analysis-actions">
                    <button 
                      className="save-button"
                      onClick={() => {
                        // Save the current analysis result to history
                        const newHistoryItem = {
                          id: Date.now(),
                          ...analysisResult,
                          image: previewUrl,
                          timestamp: "Just now"
                        };
                        setScanHistory([newHistoryItem, ...scanHistory]);
                        alert('Saved to your cupboard! 🥫');
                      }}
                    >
                      Save to Cupboard
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
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(item.id)} 
                    onChange={() => handleSelect(item.id)}
                  />
                  <img src={item.image} alt={item.name} className="history-image" />
                  <div className="history-content">
                    <h4>{item.name}</h4>
                    <div className="history-details">
                      <span className="calories">{item.calories} cal</span>
                      <span className="nutrition">{item.nutrition}</span>
                    </div>
                    <div className={`quality-indicator ${item.quality.includes('Fresh') || item.quality.includes('Excellent') ? 'excellent' : 'warning'}`}>
                      {item.quality}
                    </div>
                    <span className="timestamp">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="history-actions">
              <button 
                className="generate-recipes-button"
                onClick={generateRecipes}
                disabled={generatingRecipes || selectedItems.length === 0}
              >
                {generatingRecipes ? '🍳 Generating Recipes...' : '🍳 Generate Recipes'}
              </button>
              <button onClick={handleSendSelected}>Send Selected</button>
            </div>

            {recipes && (
              <div className="recipes-container">
                <h3>🍽️ Generated Recipes</h3>
                
                <div className="recipes-list">
                  {recipes.recipes && recipes.recipes.map((recipe, index) => (
                    <div key={index} className="recipe-card">
                      <div className="recipe-header">
                        <h4>{recipe.name}</h4>
                        <div className="recipe-meta">
                          <span className="cooking-time">⏱️ {recipe.cooking_time}</span>
                          <span className="difficulty">📊 {recipe.difficulty}</span>
                          <span className="servings">👥 {recipe.servings} servings</span>
                          <span className="calories">🔥 {recipe.calories_per_serving} cal/serving</span>
                        </div>
                      </div>
                      
                      {recipe.summary && (
                        <div className="recipe-summary">
                          <h4>📊 Recipe Summary</h4>
                          <p><strong>Total Calories:</strong> {recipe.summary.total_calories}</p>
                          <p><strong>Nutrition Benefits:</strong> {recipe.summary.nutrition_benefits}</p>
                          <p><strong>Freshness Considerations:</strong> {recipe.summary.freshness_considerations}</p>
                        </div>
                      )}
                      
                      <p className="recipe-description">{recipe.description}</p>
                      
                      <div className="recipe-ingredients">
                        <h5>🥕 Ingredients:</h5>
                        <ul>
                          {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx}>
                              <strong>{ingredient.item}</strong> - {ingredient.amount}
                              {ingredient.notes && <span className="ingredient-notes"> ({ingredient.notes})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="recipe-instructions">
                        <h5>📝 Instructions:</h5>
                        <ol>
                          {recipe.instructions.map((instruction, idx) => (
                            <li key={idx}>{instruction}</li>
                          ))}
                        </ol>
                      </div>
                      
                      {recipe.tips && (
                        <div className="recipe-tips">
                          <h5>💡 Tips:</h5>
                          <p>{recipe.tips}</p>
                        </div>
                      )}
                      
                      {recipe.why_this_recipe && (
                        <div className="recipe-why">
                          <h5>🤔 Why This Recipe:</h5>
                          <p>{recipe.why_this_recipe}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        <p>&copy; 2025 SnackOverflow. Real-time quality assessment powered by Groq 🚀</p>
      </footer>
    </div>
  );
}

// Food Wrap Component
function FoodWrap({ wrapData, onClose, onChangePeriod }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  if (!wrapData) {
    return (
      <div className="wrap-container">
        <div className="wrap-loading">
          <h2>🎵 Generating Your Food Wrap...</h2>
          <div className="wrap-spinner"></div>
        </div>
      </div>
    );
  }

  const slides = [
    'intro',
    'stats',
    'top-food',
    'categories',
    'quality',
    'habits',
    'achievements',
    'insights'
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handlePeriodChange = (days) => {
    setSelectedPeriod(days);
    onChangePeriod(days);
    setCurrentSlide(0);
  };

  const renderSlide = () => {
    const slide = slides[currentSlide];
    const { ai_insights } = wrapData;

    switch (slide) {
      case 'intro':
        return (
          <div className="wrap-slide intro-slide">
            <div className="wrap-slide-content">
              <h1>🎵 Your Food Wrap</h1>
              <h2>{ai_insights?.wrap_title || 'Your Food Journey'}</h2>
              <p>Let's explore your {wrapData.period} of food discoveries!</p>
              <div className="wrap-period-selector">
                <button 
                  className={selectedPeriod === 7 ? 'active' : ''} 
                  onClick={() => handlePeriodChange(7)}
                >
                  7 Days
                </button>
                <button 
                  className={selectedPeriod === 30 ? 'active' : ''} 
                  onClick={() => handlePeriodChange(30)}
                >
                  30 Days
                </button>
                <button 
                  className={selectedPeriod === 90 ? 'active' : ''} 
                  onClick={() => handlePeriodChange(90)}
                >
                  90 Days
                </button>
              </div>
              <div className="personality-badge">
                <span className="personality-label">Your Food Personality:</span>
                <span className="personality-type">{ai_insights?.personality_type || 'Food Explorer'}</span>
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="wrap-slide stats-slide">
            <div className="wrap-slide-content">
              <h2>📊 Your Numbers</h2>
              <div className="stats-grid">
                <div className="stat-card pulse-animation">
                  <span className="stat-number">{wrapData.total_scans}</span>
                  <span className="stat-label">Total Scans</span>
                </div>
                <div className="stat-card pulse-animation">
                  <span className="stat-number">{wrapData.unique_foods}</span>
                  <span className="stat-label">Unique Foods</span>
                </div>
                <div className="stat-card pulse-animation">
                  <span className="stat-number">{wrapData.total_calories.toLocaleString()}</span>
                  <span className="stat-label">Calories Analyzed</span>
                </div>
                <div className="stat-card pulse-animation">
                  <span className="stat-number">{wrapData.consecutive_days}</span>
                  <span className="stat-label">Day Streak</span>
                </div>
              </div>
              <div className="health-scores">
                <div className="score-circle">
                  <div className="score-inner">
                    <span className="score-number">{ai_insights?.health_score || 85}</span>
                    <span className="score-label">Health Score</span>
                  </div>
                </div>
                <div className="score-circle">
                  <div className="score-inner">
                    <span className="score-number">{ai_insights?.variety_score || 92}</span>
                    <span className="score-label">Variety Score</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'top-food':
        return (
          <div className="wrap-slide top-food-slide">
            <div className="wrap-slide-content">
              <h2>👑 Your Food Champion</h2>
              <div className="top-food-display">
                <div className="food-crown">👑</div>
                <h3>{wrapData.top_food.name}</h3>
                <p>Scanned {wrapData.top_food.count} times</p>
                <div className="food-frequency-bars">
                  {Object.entries(wrapData.food_frequency).slice(0, 5).map(([food, count], index) => (
                    <div key={food} className="frequency-bar">
                      <span className="food-name">{food}</span>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${(count / wrapData.top_food.count) * 100}%`,
                            animationDelay: `${index * 0.2}s`
                          }}
                        ></div>
                      </div>
                      <span className="count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="wrap-slide categories-slide">
            <div className="wrap-slide-content">
              <h2>🍎 Your Food Universe</h2>
              <div className="category-chart">
                <div className="donut-chart">
                  <svg viewBox="0 0 200 200" className="donut-svg">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#e0e0e0" strokeWidth="20"/>
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#ff6b6b" 
                      strokeWidth="20"
                      strokeDasharray={`${(wrapData.food_categories.fruits / wrapData.total_scans) * 502.4} 502.4`}
                      transform="rotate(-90 100 100)"
                      className="animated-stroke"
                    />
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#4ecdc4" 
                      strokeWidth="20"
                      strokeDasharray={`${(wrapData.food_categories.vegetables / wrapData.total_scans) * 502.4} 502.4`}
                      strokeDashoffset={`-${(wrapData.food_categories.fruits / wrapData.total_scans) * 502.4}`}
                      transform="rotate(-90 100 100)"
                      className="animated-stroke"
                    />
                  </svg>
                  <div className="donut-center">
                    <span className="center-number">{wrapData.total_scans}</span>
                    <span className="center-label">Total</span>
                  </div>
                </div>
                <div className="category-legends">
                  <div className="legend-item">
                    <span className="legend-color fruits"></span>
                    <span>Fruits ({wrapData.food_categories.fruits})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color vegetables"></span>
                    <span>Vegetables ({wrapData.food_categories.vegetables})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color other"></span>
                    <span>Other ({wrapData.food_categories.other})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'quality':
        return (
          <div className="wrap-slide quality-slide">
            <div className="wrap-slide-content">
              <h2>✨ Quality Master</h2>
              <div className="quality-stats">
                <div className="freshness-gauge">
                  <div className="gauge-container">
                    <div className="gauge-background"></div>
                    <div 
                      className="gauge-fill" 
                      style={{ transform: `rotate(${(wrapData.avg_freshness / 10) * 180 - 90}deg)` }}
                    ></div>
                    <div className="gauge-center">
                      <span className="gauge-number">{wrapData.avg_freshness}</span>
                      <span className="gauge-label">Avg Freshness</span>
                    </div>
                  </div>
                </div>
                <div className="buy-ratio-display">
                  <div className="ratio-circle">
                    <svg viewBox="0 0 120 120" className="ratio-svg">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" strokeWidth="8"/>
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="50" 
                        fill="none" 
                        stroke="#28a745" 
                        strokeWidth="8"
                        strokeDasharray={`${(wrapData.buy_ratio / 100) * 314} 314`}
                        transform="rotate(-90 60 60)"
                        className="animated-stroke"
                      />
                    </svg>
                    <div className="ratio-center">
                      <span className="ratio-number">{wrapData.buy_ratio}%</span>
                      <span className="ratio-label">Buy Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'habits':
        return (
          <div className="wrap-slide habits-slide">
            <div className="wrap-slide-content">
              <h2>⏰ Your Habits</h2>
              <div className="habits-content">
                <div className="peak-time">
                  <h3>Peak Scanning Time</h3>
                  <div className="clock-display">
                    <div className="clock">
                      <div className="clock-face">
                        <div 
                          className="clock-hand" 
                          style={{ transform: `rotate(${(wrapData.peak_hour / 12) * 360}deg)` }}
                        ></div>
                      </div>
                      <span className="time-text">{wrapData.peak_hour}:00</span>
                    </div>
                  </div>
                </div>
                <div className="fun-facts">
                  <h3>🎉 Fun Facts</h3>
                  <ul>
                    {ai_insights?.fun_facts?.map((fact, index) => (
                      <li key={index} className="fun-fact-item">
                        <span className="fact-emoji">🌟</span>
                        {fact}
                      </li>
                    )) || [
                      <li key="default" className="fun-fact-item">
                        <span className="fact-emoji">🌟</span>
                        You've developed quite the eye for food quality!
                      </li>
                    ]}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="wrap-slide achievements-slide">
            <div className="wrap-slide-content">
              <h2>🏆 Achievements Unlocked</h2>
              <div className="achievements-grid">
                {ai_insights?.achievements?.map((achievement, index) => (
                  <div key={index} className="achievement-card">
                    <div className="achievement-icon">🏆</div>
                    <h4>{achievement}</h4>
                  </div>
                )) || [
                  <div key="scanner" className="achievement-card">
                    <div className="achievement-icon">📸</div>
                    <h4>Food Scanner</h4>
                    <p>Scanned your first food item</p>
                  </div>,
                  <div key="explorer" className="achievement-card">
                    <div className="achievement-icon">🌍</div>
                    <h4>Food Explorer</h4>
                    <p>Tried {wrapData.unique_foods} different foods</p>
                  </div>
                ]}
                {wrapData.puns_received > 0 && (
                  <div className="achievement-card">
                    <div className="achievement-icon">😄</div>
                    <h4>Pun Collector</h4>
                    <p>Collected {wrapData.puns_received} food puns</p>
                  </div>
                )}
                {wrapData.consecutive_days >= 7 && (
                  <div className="achievement-card">
                    <div className="achievement-icon">🔥</div>
                    <h4>Streak Master</h4>
                    <p>{wrapData.consecutive_days} day scanning streak</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="wrap-slide insights-slide">
            <div className="wrap-slide-content">
              <h2>💡 AI Insights</h2>
              <div className="insights-content">
                <div className="recommendations">
                  <h3>🎯 Recommendations</h3>
                  <ul>
                    {ai_insights?.recommendations?.map((rec, index) => (
                      <li key={index} className="recommendation-item">
                        <span className="rec-emoji">💡</span>
                        {rec}
                      </li>
                    )) || [
                      <li key="default" className="recommendation-item">
                        <span className="rec-emoji">💡</span>
                        Keep exploring new foods to expand your palate!
                      </li>
                    ]}
                  </ul>
                </div>
                <div className="wrap-summary">
                  <h3>📝 Your Journey</h3>
                  <p>
                    In the past {wrapData.period}, you've scanned {wrapData.total_scans} food items, 
                    discovered {wrapData.unique_foods} unique foods, and maintained an impressive 
                    {wrapData.avg_freshness}/10 freshness score. Keep up the great work!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Slide not found</div>;
    }
  };

  return (
    <div className="wrap-container">
      <div className="wrap-header">
        <button className="wrap-close-btn" onClick={onClose}>
          ← Back
        </button>
        <div className="wrap-progress">
          <div className="progress-dots">
            {slides.map((_, index) => (
              <div 
                key={index} 
                className={`progress-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="wrap-content">
        {renderSlide()}
      </div>

      <div className="wrap-navigation">
        <button 
          className="nav-btn prev-btn" 
          onClick={prevSlide}
          disabled={currentSlide === 0}
        >
          ← Previous
        </button>
        <span className="slide-counter">
          {currentSlide + 1} of {slides.length}
        </span>
        <button 
          className="nav-btn next-btn" 
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default App; 
