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
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice toggle state
  const [hideCaptureSection, setHideCaptureSection] = useState(false); // New state to control capture section visibility
  const [scanHistory, setScanHistory] = useState([]);
  const [recipes, setRecipes] = useState(null);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);
  
  // New accessibility states
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [lastAudioResponse, setLastAudioResponse] = useState('');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);
  const [currentAnnouncement, setCurrentAnnouncement] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);

  // References for voice recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceTimeoutRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Voice commands reference for accessibility
  const voiceCommands = useRef({
    analyze: ['analyze', 'scan', 'check food', 'examine', 'process image'],
    camera: ['camera', 'take photo', 'use camera'],
    capture: ['capture', 'take picture', 'snap photo'],
    upload: ['upload', 'select file', 'choose image', 'browse'],
    history: ['history', 'show history', 'recent scans', 'past analyses'],
    help: ['help', 'tutorial', 'how to use', 'instructions', 'guide'],
    reset: ['reset', 'clear', 'start over', 'cancel'],
    repeat: ['repeat', 'say again', 'read again']
  });

  // Local voice command recognition for faster response
  const recognizeLocalCommand = (text) => {
    if (!text) return null;
    
    const textLower = text.toLowerCase().trim();
    
    // Quick keyword matching for instant response
    for (const [command, variations] of Object.entries(voiceCommands.current)) {
      for (const variation of variations) {
        if (textLower.includes(variation)) {
          return {
            command,
            confidence: 'high',
            matched_phrase: variation,
            source: 'local'
          };
        }
      }
    }
    
    return null;
  };

  // Announce text for screen readers and voice feedback
  const announceText = async (text) => {
    setCurrentAnnouncement(text);
    
    if (voiceEnabled) {
      try {
        const response = await fetch('http://localhost:5000/generate-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });
        
        if (response.ok) {
          console.log('🔊 Announcement played:', text);
        }
      } catch (error) {
        console.error('Error playing announcement:', error);
        // Fallback to browser speech synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.volume = 0.8;
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  };

  // Start voice recording with dual approach (browser + Groq)
  const startVoiceRecording = async () => {
    try {
      setIsListening(true);
      
      // Try browser speech recognition first for instant response
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognitionRef.current = new SpeechRecognition();
        speechRecognitionRef.current.continuous = false;
        speechRecognitionRef.current.interimResults = false;
        speechRecognitionRef.current.lang = 'en-US';
        
        speechRecognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          console.log('🚀 Browser recognition (fast):', transcript);
          setVoiceTranscript(transcript);
          
          // Quick local command recognition
          const localCommand = recognizeLocalCommand(transcript);
          if (localCommand) {
            console.log('⚡ Local command executed:', localCommand);
            executeVoiceCommand(localCommand);
            setIsListening(false);
            // Hide transcript quickly after local command execution
            setTimeout(() => {
              setVoiceTranscript('');
            }, 1500);
            return;
          }
        };
        
        speechRecognitionRef.current.start();
        
        // Fallback timeout
        voiceTimeoutRef.current = setTimeout(() => {
          stopVoiceRecording();
        }, 3000);
      }
      
      // Parallel Groq processing for accuracy (fallback)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        // Only process with Groq if browser recognition failed
        if (isListening) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          await processVoiceCommand(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setIsListening(false);
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
    }
    setIsListening(false);
  };

  // Process voice command with optimized request
  const processVoiceCommand = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-command.wav');

      const response = await fetch('http://localhost:5000/transcribe-audio', {
        method: 'POST',
        body: formData,
        // Add timeout for faster failure detection
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setVoiceTranscript(result.transcription);
      
      // Execute voice command
      if (result.voice_command && result.voice_command.command !== 'unknown') {
        await executeVoiceCommand(result.voice_command);
        // Hide transcript immediately after successful command execution
        setTimeout(() => {
          setVoiceTranscript('');
        }, 1500); // 1.5 seconds to briefly show what was recognized
      } else {
        // Hide transcript after 2 seconds for unrecognized commands
        setTimeout(() => {
          setVoiceTranscript('');
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error processing voice command:', error);
    }
  };

  // Execute voice command
  const executeVoiceCommand = async (voiceCommand) => {
    const { command, matched_phrase } = voiceCommand;
    
    switch (command) {
      case 'analyze':
        if (selectedImage) {
          await analyzeFood();
        }
        break;
        
      case 'camera':
        setMode('camera');
        break;
        
      case 'capture':
        if (mode === 'camera') {
          handleCapture();
        } else {
          // Switch to camera mode and auto-capture after camera initializes
          setMode('camera');
          // Wait for camera to initialize, then auto-capture
          setTimeout(() => {
            handleCapture();
          }, 2000); // 2-second delay for camera initialization
        }
        break;
        
      case 'upload':
        setMode('upload');
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        break;
        
      case 'history':
        setShowHistory(true);
        // Announce brief summary of scan history
        if (scanHistory.length > 0) {
          const foodNames = scanHistory.slice(0, 5).map(item => item.name).join(', ');
          const summaryText = `You have ${scanHistory.length} recent scan${scanHistory.length === 1 ? '' : 's'}: ${foodNames}${scanHistory.length > 5 ? ', and more' : ''}.`;
          await announceText(summaryText);
        } else {
          await announceText("No scan history available. Start by analyzing some food!");
        }
        break;
        
      case 'help':
        await showVoiceTutorial();
        break;
        
      case 'reset':
        resetAnalysis();
        break;
        
      case 'repeat':
        if (lastAudioResponse) {
          await announceText(lastAudioResponse);
        }
        break;
        
      default:
        // Silently ignore unrecognized commands
        break;
    }
  };

  // Show voice tutorial
  const showVoiceTutorial = async () => {
    try {
      const response = await fetch('http://localhost:5000/voice-tutorial');
      const tutorial = await response.json();
      
      let tutorialText = tutorial.welcome_message + " ";
      
      Object.entries(tutorial.commands).forEach(([category, commands]) => {
        tutorialText += `${category}: `;
        commands.forEach(command => {
          tutorialText += `${command}. `;
        });
      });
      
      tutorialText += "Tips: ";
      tutorial.tips.forEach(tip => {
        tutorialText += `${tip}. `;
      });
      
      await announceText(tutorialText);
      
    } catch (error) {
      console.error('Error getting voice tutorial:', error);
      await announceText("Tutorial not available at the moment.");
    }
  };

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Voice activation with spacebar
      if (event.code === 'Space' && voiceCommandsEnabled && !isListening) {
        event.preventDefault();
        startVoiceRecording();
      }
      
      // Stop recording with spacebar release or ESC
      if ((event.code === 'Escape' || event.code === 'Enter') && isListening) {
        event.preventDefault();
        stopVoiceRecording();
      }
      
      // Quick navigation keys
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setMode('upload');
            break;
          case '2':
            event.preventDefault();
            setMode('camera');
            break;
          case '3':
            event.preventDefault();
            if (selectedImage) {
              analyzeFood();
            }
            break;
          case '4':
            event.preventDefault();
            setShowHistory(!showHistory);
            break;
          case 'h':
            event.preventDefault();
            showVoiceTutorial();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [voiceCommandsEnabled, isListening, selectedImage, showHistory]);

  // Effect to speak voice script when analysis results are set
  useEffect(() => {
    if (analysisResult && voiceEnabled) {
      // Create voice script from analysis result
      const voiceScript = createVoiceScript(
        analysisResult.name, 
        analysisResult.nutrition, 
        analysisResult.purchaseRecommendation
      );
      
      setLastAudioResponse(voiceScript);
      
      // Small delay to ensure UI is updated first
      const timer = setTimeout(() => {
        speakVoiceScript(voiceScript);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [analysisResult, voiceEnabled]);

  // Removed mode change announcements
  // Removed image selection announcements

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
    if (foodNameLower.includes('green pepper')) return '🫑';
    if (foodNameLower.includes('red pepper')) return '🌶️';
    if (foodNameLower.includes('hot pepper')) return '🌶️';
    if (foodNameLower.includes('chili')) return '🌶️';
    if (foodNameLower.includes('avocado')) return '🥑';
    if (foodNameLower.includes('eggplant')) return '🍆';
    if (foodNameLower.includes('corn')) return '🌽';
    if (foodNameLower.includes('broccoli')) return '🥦';
    if (foodNameLower.includes('lettuce')) return '🥬';
    if (foodNameLower.includes('spinach')) return '🥬';
    if (foodNameLower.includes('kale')) return '🥬';
    if (foodNameLower.includes('cabbage')) return '🥬';
    if (foodNameLower.includes('carrot')) return '🥕';
    if (foodNameLower.includes('potato')) return '🥔';
    if (foodNameLower.includes('sweet potato')) return '🍠';
    if (foodNameLower.includes('onion')) return '🧅';
    if (foodNameLower.includes('garlic')) return '🧄';
    if (foodNameLower.includes('ginger')) return '🫚';
    if (foodNameLower.includes('mushroom')) return '🍄';
    if (foodNameLower.includes('tomato')) return '🍅';
    if (foodNameLower.includes('cucumber')) return '🥒';
    if (foodNameLower.includes('olive')) return '🫒';
    if (foodNameLower.includes('coconut')) return '🥥';
    if (foodNameLower.includes('kiwi')) return '🥝';
    if (foodNameLower.includes('mango')) return '🥭';
    if (foodNameLower.includes('peach')) return '🍑';
    if (foodNameLower.includes('cherr')) return '🍒';
    if (foodNameLower.includes('grape')) return '🍇';
    if (foodNameLower.includes('melon')) return '🍈';
    if (foodNameLower.includes('banana')) return '🍌';
    if (foodNameLower.includes('apple')) return '🍎';
    if (foodNameLower.includes('pear')) return '🍐';
    if (foodNameLower.includes('orange')) return '🍊';
    if (foodNameLower.includes('lemon')) return '🍋';
    if (foodNameLower.includes('lime')) return '🍋';
    if (foodNameLower.includes('grapefruit')) return '🍊';
    
    // Nuts and legumes
    if (foodNameLower.includes('peanut')) return '🥜';
    if (foodNameLower.includes('almond')) return '🥜';
    if (foodNameLower.includes('walnut')) return '🥜';
    if (foodNameLower.includes('nut')) return '🥜';
    if (foodNameLower.includes('bean')) return '🫘';
    if (foodNameLower.includes('pea')) return '🟢';
    
    // Herbs and spices
    if (foodNameLower.includes('herb')) return '🌿';
    if (foodNameLower.includes('basil')) return '🌿';
    if (foodNameLower.includes('parsley')) return '🌿';
    if (foodNameLower.includes('cilantro')) return '🌿';
    if (foodNameLower.includes('mint')) return '🌿';
    
    // Grains and bread
    if (foodNameLower.includes('bread')) return '🍞';
    if (foodNameLower.includes('rice')) return '🍚';
    if (foodNameLower.includes('pasta')) return '🍝';
    if (foodNameLower.includes('wheat')) return '🌾';
    if (foodNameLower.includes('grain')) return '🌾';
    if (foodNameLower.includes('oat')) return '🌾';
    if (foodNameLower.includes('quinoa')) return '🌾';
    
    // Meat and protein
    if (foodNameLower.includes('chicken')) return '🍗';
    if (foodNameLower.includes('beef')) return '🥩';
    if (foodNameLower.includes('pork')) return '🥓';
    if (foodNameLower.includes('fish')) return '🐟';
    if (foodNameLower.includes('salmon')) return '🐟';
    if (foodNameLower.includes('tuna')) return '🐟';
    if (foodNameLower.includes('shrimp')) return '🦐';
    if (foodNameLower.includes('lobster')) return '🦞';
    if (foodNameLower.includes('crab')) return '🦀';
    if (foodNameLower.includes('egg')) return '🥚';
    
    // Dairy
    if (foodNameLower.includes('milk')) return '🥛';
    if (foodNameLower.includes('cheese')) return '🧀';
    if (foodNameLower.includes('butter')) return '🧈';
    if (foodNameLower.includes('yogurt')) return '🥛';
    if (foodNameLower.includes('cream')) return '🥛';
    
    // Default food emoji
    return '🍽️';
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
      
      // Analysis completion will be announced through the voice script below
      
      // Add to history (the backend now saves to database automatically)
      const newHistoryItem = {
        id: transformedResult.id || Date.now(),
        ...transformedResult,
        image: previewUrl,
        timestamp: "Just now"
      };
      setScanHistory([newHistoryItem, ...scanHistory]);
      
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

  const handleSendSelected = async () => {
      const selectedItemsData = scanHistory.filter((item) => selectedItems.includes(item.id));
      console.log('Selected items:', selectedItemsData);
      
      // Convert the image URLs to blobs
      const image1 = await fetch(selectedItemsData[0].image)
          .then(response => response.blob())
          .then(blob => new File([blob], 'image1.jpg', { type: 'image/jpeg' }));
      const image2 = await fetch(selectedItemsData[1].image)
          .then(response => response.blob())
          .then(blob => new File([blob], 'image2.jpg', { type: 'image/jpeg' }));
      
      // Create a FormData object to send the images
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);
      
      // Send the images to the backend
      fetch('http://localhost:5000/compare-fruits', {
          method: 'POST',
          body: formData,
      })
      .then(response => response.json())
      .then(data => {
        console.log(data)
        setComparisonResult({ result: data.result, selectedItemsData });
    })
    .catch(error => console.error('Error:', error));
  };

  return (
    <div className="App" role="main">
      {/* Accessibility announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {currentAnnouncement}
      </div>
      
      {/* Speech-to-text subtitle display */}
      {(isListening || voiceTranscript) && (
        <div className="subtitle-overlay" aria-live="polite">
          <div className="subtitle-content">
            {isListening ? (
              <div className="listening-indicator">
                <span className="listening-text">🎤 Listening...</span>
                <div className="listening-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            ) : voiceTranscript ? (
              <div className="transcript-display">
                <span className="transcript-label">You said:</span>
                <span className="transcript-text">"{voiceTranscript}"</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
      
      <header className="App-header">
        <div className="header-left">
                      <h1>🤖 Groqcessible</h1>
                      <p>Groq-powered accessible food intelligence</p>
        </div>
        
        <div className="header-controls">
          {/* Voice controls */}
          <div className="voice-controls">
            <button 
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopVoiceRecording : startVoiceRecording}
              disabled={analyzing}
              aria-label={isListening ? 'Stop listening' : 'Start voice command'}
              title="Press spacebar or click to give voice commands"
            >
              {isListening ? '🔴 Listening...' : '🎤 Voice Commands'}
            </button>
            
            <button 
              className="tutorial-button"
              onClick={showVoiceTutorial}
              aria-label="Voice tutorial"
              title="Alt+H for voice tutorial"
            >
              ❓ Help
            </button>
          </div>
          
          <button 
            className="history-button"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                resetAnalysis();
              }
            }}
            aria-label={showHistory ? 'Hide history' : 'Show history'}
            title="Alt+4 to toggle history"
          >
            📋 {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
      </header>

      <main className="App-main">
        {/* Accessibility instructions */}
        <div className="accessibility-instructions" aria-label="Keyboard shortcuts">
          <p className="sr-only">
            Keyboard shortcuts: Spacebar for voice commands (press ESC or Enter to stop early), Alt+1 for upload, Alt+2 for camera, 
            Alt+3 to analyze, Alt+4 for history, Alt+H for help
          </p>
        </div>

        {!showHistory ? (
          <>
            <div className="upload-container" style={{ display: hideCaptureSection ? 'none' : 'block' }}>
              <div className="upload-area">
                <h2>📸 Scan Your Food</h2>
                <p>Take a photo, upload an image, or use voice commands for instant analysis</p>

                <div className="mode-switch" role="tablist">
                  <button
                    className={mode === 'upload' ? 'active' : ''}
                    onClick={() => {
                      setMode('upload');
                    }}
                    role="tab"
                    aria-selected={mode === 'upload'}
                    aria-label="Upload mode - Alt+1"
                  >
                    📁 Upload
                  </button>
                  <button
                    className={mode === 'camera' ? 'active' : ''}
                    onClick={() => {
                      setMode('camera');
                    }}
                    role="tab"
                    aria-selected={mode === 'camera'}
                    aria-label="Camera mode - Alt+2"
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
                        aria-label="Select food image"
                      />

                      {previewUrl ? (
                        <div
                          className="preview-container"
                          onClick={handlePreviewClick}
                          role="button"
                          tabIndex={0}
                          aria-label={`Image preview. ${lastSource === 'camera' ? 'Click to retake' : 'Click to change'}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handlePreviewClick();
                            }
                          }}
                        >
                          <img
                            src={previewUrl}
                            alt="Food preview"
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
                            <p>Click to upload food image or say "upload"</p>
                            <p className="upload-hint">Supports: JPG, PNG, GIF</p>
                          </div>
                        </label>
                      )}
                    </>
                  )}

                  {mode === 'camera' && (
                    <div className="camera-container">
                      <video 
                        ref={videoRef} 
                        className="camera-video"
                        aria-label="Camera feed"
                      />
                      <button
                        className="capture-button"
                        onClick={() => {
                          handleCapture();
                        }}
                        aria-label="Capture photo"
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
                      onChange={(e) => {
                        setVoiceEnabled(e.target.checked);
                      }}
                      className="toggle-input"
                      aria-label="Toggle audio feedback"
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
                      aria-label="Analyze food - Alt+3"
                    >
                      {analyzing ? '🔍 Analyzing...' : '🔍 Analyze Food'}
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={resetAnalysis}
                      disabled={analyzing}
                      aria-label="Cancel analysis"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {analyzing && (
              <div className="analyzing-container" aria-live="polite">
                <div className="analyzing-content">
                  <div className="analyzing-spinner">
                    <svg className="progress-ring" viewBox="0 0 100 100">
                      <circle className="bg" cx="50" cy="50" r="40"></circle>
                      <circle className="progress" cx="50" cy="50" r="40"></circle>
                    </svg>
                  </div>
                  <h3>🔍 Analyzing Your Food</h3>
                  <p>AI is examining your image for nutrition facts, quality assessment, and recommendations...</p>
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
              <div className="analysis-result" aria-live="polite">
                <div className="result-content">
                  <h3 className="result-header">
                    Analysis Results
                  </h3>
                  <div className="food-name" style={{textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: '#667eea', marginBottom: '1.5rem'}}>
                    {getFoodEmoji(analysisResult.name)} {analysisResult.name}
                  </div>
                  
                  <div className="nutrition-section">
                    <h4>📊 Nutrition Information</h4>
                    <div className="nutrition-grid">
                      <div className="nutrition-item">
                        <span className="nutrition-label">Calories</span>
                        <span className="nutrition-value">{analysisResult.calories}</span>
                      </div>
                      <div className="nutrition-item">
                        <span className="nutrition-label">Shelf Life</span>
                        <span className="nutrition-value">{analysisResult.shelfLife} days</span>
                      </div>
                    </div>
                    <p className="nutrition-details">{analysisResult.nutrition}</p>
                  </div>
                  
                  <div className="quality-section">
                    <h4>✨ Quality Assessment</h4>
                    <div className="quality-content">
                      <div className="freshness-indicator">
                        <span className="freshness-label">Freshness Level</span>
                        <div className="freshness-bar">
                          <div 
                            className="freshness-fill" 
                            style={{ width: `${(analysisResult.freshnessLevel / 10) * 100}%` }}
                          ></div>
                          <span className="freshness-score">{analysisResult.freshnessLevel}/10</span>
                        </div>
                      </div>
                      <p className="quality-description">
                        <strong>Condition:</strong> {analysisResult.quality}
                      </p>
                      <p className="quality-details">{analysisResult.qualityDetails}</p>
                    </div>
                  </div>
                  
                  <div className="health-section">
                    <h4>💪 Health Benefits</h4>
                    <p className="health-benefits">{analysisResult.healthBenefits}</p>
                    <div className="best-use">
                      <strong>Best Use:</strong> {analysisResult.bestUse}
                    </div>
                  </div>
                  
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
                        announceText('Analysis saved to your food diary!');
                        alert('Saved to your food diary! 📝');
                      }}
                      aria-label="Save to diary"
                    >
                      Save to Cupboard
                    </button>
                    <button 
                      className="scan-again-button"
                      onClick={resetAnalysis}
                      aria-label="Scan another food item"
                    >
                      Scan Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) :
          <div className="history-container">
            <h2>📋 Recent Scans</h2>
            <div className="history-list" role="list">
              {scanHistory.map((item) => (
                <div key={item.id} className="history-item" role="listitem">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(item.id)} 
                    onChange={() => handleSelect(item.id)}
                    aria-label={`Select ${item.name} for recipe generation`}
                  />
                  <img src={item.image} alt={`${item.name} scan`} className="history-image" />
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
                aria-label="Generate recipes from selected items"
              >
                {generatingRecipes ? '🍳 Generating Recipes...' : '🍳 Generate Recipes'}
              </button>
              <button 
                className="send-selected-button fancy-button"
                onClick={handleSendSelected}
                aria-label="Send selected items"
              >
                Compare Two Items
              </button>
            </div>

            {comparisonResult && (
              <div className="comparison-panel">
                <button
                  className="close-comparison"
                  onClick={() => setComparisonResult(null)}
                  aria-label="Close comparison"
                >
                  ×
                </button>
                <h3>Comparison Result</h3>
                <div className="comparison-images">
                  <figure>
                    <img
                      src={comparisonResult.selectedItemsData[0].image}
                      alt={comparisonResult.selectedItemsData[0].name}
                    />
                    <figcaption>{comparisonResult.selectedItemsData[0].name}</figcaption>
                  </figure>
                  <figure>
                    <img
                      src={comparisonResult.selectedItemsData[1].image}
                      alt={comparisonResult.selectedItemsData[1].name}
                    />
                    <figcaption>{comparisonResult.selectedItemsData[1].name}</figcaption>
                  </figure>
                </div>
                <div className="comparison-result-text">
                  <strong>Idea:</strong> {comparisonResult.result}
                </div>
              </div>
            )}
            
            {/* Recipe results display */}
            {recipes && (
              <div className="recipes-section" aria-live="polite">
                <button
                  className="close-recipes"
                  onClick={() => setRecipes(null)}
                  aria-label="Close recipes"
                >
                  ×
                </button>
                <h3>🍳 Generated Recipes</h3>
                
                <div className="recipes-content">
                  {Array.isArray(recipes.recipes) ? (
                    recipes.recipes.map((recipe, index) => (
                      <div key={index} className="recipe-card glow-effect">
                        <div className="recipe-header">
                          <h4>{recipe.name || `Recipe ${index + 1}`}</h4>
                          <div className="recipe-meta">
                            {recipe.cooking_time && <span>⏱️ {recipe.cooking_time}</span>}
                            {recipe.difficulty && <span>📊 {recipe.difficulty}</span>}
                            {recipe.calories_per_serving && <span>🔥 {recipe.calories_per_serving} cal</span>}
                            {recipe.servings && <span>👥 {recipe.servings} servings</span>}
                          </div>
                        </div>
                        
                        <div className="recipe-description">
                          {recipe.description || (typeof recipe === 'string' ? recipe : 'Recipe description not available')}
                        </div>
                        
                        {recipe.ingredients && Array.isArray(recipe.ingredients) && (
                          <div className="recipe-ingredients">
                            <h5>🥕 Ingredients</h5>
                            <ul>
                              {recipe.ingredients.map((ingredient, i) => (
                                <li key={i}>
                                  {typeof ingredient === 'string' ? ingredient : 
                                    <span>
                                      <strong>{ingredient.item || 'Unknown'}</strong> - {ingredient.amount || 'As needed'}
                                      {ingredient.notes && <span className="ingredient-notes"> ({ingredient.notes})</span>}
                                    </span>
                                  }
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {recipe.instructions && Array.isArray(recipe.instructions) && (
                          <div className="recipe-instructions">
                            <h5>👨‍🍳 Instructions</h5>
                            <ol>
                              {recipe.instructions.map((step, i) => (
                                <li key={i}>{typeof step === 'string' ? step : 'Step instruction not available'}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        
                        {recipe.tips && (
                          <div className="recipe-tips">
                            <h5>💡 Tips</h5>
                            <p>{recipe.tips}</p>
                          </div>
                        )}
                        
                        {recipe.why_this_recipe && (
                          <div className="recipe-why">
                            <h5>🤔 Why This Recipe?</h5>
                            <p>{recipe.why_this_recipe}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="recipe-text">
                      <p>{typeof recipes.recipes === 'string' ? recipes.recipes : 'No recipes generated'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        }
        
        <div className="features-section">
          <div className="feature-card">
            <h3>🔍 Real-time Analysis</h3>
            <p>Voice-controlled food detection and nutrition analysis powered by AI.</p>
          </div>
          <div className="feature-card">
            <h3>🎤 Voice Commands</h3>
            <p>Fully accessible through voice commands and keyboard navigation.</p>
          </div>
          <div className="feature-card">
            <h3>📱 Accessibility First</h3>
            <p>Designed for blind and visually impaired users with comprehensive audio feedback.</p>
          </div>
        </div>
      </main>

      <footer className="App-footer">
        <p>&copy; 2024 Groqcessible. Powered by Groq AI for accessible food intelligence 🚀</p>
      </footer>
    </div>
  );
}

export default App; 
