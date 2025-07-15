import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [mode, setMode] = useState('upload');          // current UI mode: 'upload' or 'camera'
  const [lastSource, setLastSource] = useState(null);  // how current preview was created: 'upload' | 'camera'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleSubmit = () => {
    if (!selectedImage) return;
    setUploading(true);
    setTimeout(() => {
      alert('Image uploaded successfully! 🍌');
      setUploading(false);
      setSelectedImage(null);
      setPreviewUrl(null);
      setLastSource(null);
    }, 2000);
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

            <div className="mode-switch">
              <button
                className={mode === 'upload' ? 'active' : ''}
                onClick={() => setMode('upload')}
              >
                Upload
              </button>
              <button
                className={mode === 'camera' ? 'active' : ''}
                onClick={() => setMode('camera')}
              >
                Camera
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
                      <div className="upload-placeholder">
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

            {selectedImage && (
              <div className="upload-actions">
                <button
                  className="upload-button"
                  onClick={handleSubmit}
                  disabled={uploading}
                >
                  {uploading
                    ? 'Uploading...'
                    : 'Share My Food! 🍽️'}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    setLastSource(null);
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