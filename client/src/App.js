import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const handleSubmit = async () => {
    if (!selectedImage) return;
    
    setUploading(true);
    // Simulate upload process
    setTimeout(() => {
      setUploading(false);
      alert('Image uploaded successfully! 🍌');
      setSelectedImage(null);
      setPreviewUrl(null);
    }, 2000);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🍌 SnackOverflow</h1>
        <p>Upload your food photos and discover what others are eating!</p>
      </header>
      
      <main className="App-main">
        <div className="upload-container">
          <div className="upload-area">
            <h2>What are you eating today?</h2>
            <p>Upload a photo of your food to share with the community</p>
            
            <div className="upload-box">
              <input
                type="file"
                accept="image/*"
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
                    <p>Click to upload food image</p>
                    <p className="upload-hint">Supports: JPG, PNG, GIF</p>
                  </div>
                )}
              </label>
            </div>
            
            {selectedImage && (
              <div className="upload-actions">
                <button 
                  className="upload-button"
                  onClick={handleSubmit}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Share My Food! 🍽️'}
                </button>
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="features-section">
          <div className="feature-card">
            <h3>📸 Share Food Photos</h3>
            <p>Upload pictures of your meals, snacks, and culinary creations.</p>
          </div>
          <div className="feature-card">
            <h3>👥 Community</h3>
            <p>See what others are eating and get inspired by their food choices.</p>
          </div>
          <div className="feature-card">
            <h3>🍎 Healthy Eating</h3>
            <p>Track your food intake and discover new healthy meal ideas.</p>
          </div>
        </div>
      </main>
      
      <footer className="App-footer">
        <p>&copy; 2024 SnackOverflow. Share your food journey! 🍌</p>
      </footer>
    </div>
  );
}

export default App; 