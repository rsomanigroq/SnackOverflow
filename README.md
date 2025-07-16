# SnackOverflow 🍌

SnackOverflow is an AI-powered food analysis application designed with **accessibility first** in mind. Using computer vision and AI analysis powered by Groq, the app helps users make informed decisions about produce quality and nutrition. Now fully accessible for blind and visually impaired users through comprehensive voice commands, audio feedback, and screen reader support.

## 🌟 Accessibility Features

### 🎤 Voice Command System
- **Always-On Voice Recognition**: Press spacebar or click the microphone button to activate voice commands
- **Natural Language Processing**: Speak naturally - "analyze the food" or "show me history"
- **Voice Feedback**: All actions and results are announced audibly
- **Hands-Free Operation**: Complete app navigation without touch or mouse

### 🔊 Audio Interface
- **Groq Whisper Integration**: Advanced speech-to-text using Whisper-large-v3-turbo
- **Text-to-Speech Output**: All analysis results read aloud using Groq PlayAI TTS
- **Status Announcements**: Real-time audio feedback for all app states
- **Error Handling**: Clear audio error messages and guidance

### ⌨️ Keyboard Navigation
- **Comprehensive Shortcuts**: Full app control via keyboard
- **Focus Management**: Proper tab order and focus indicators
- **Screen Reader Support**: ARIA labels and semantic HTML throughout
- **Quick Navigation**: Alt+number shortcuts for common actions

## Voice Commands Reference

### 🍎 Food Analysis Commands
- **"analyze"** or **"scan"** - Analyze the current image
- **"camera"** - Switch to camera mode
- **"upload"** - Open file selector for image upload
- **"capture"** - Take a photo (when in camera mode)

### 🧭 Navigation Commands
- **"history"** - View scan history
- **"help"** or **"tutorial"** - Get voice command tutorial
- **"reset"** - Clear current analysis and start over
- **"repeat"** - Hear the last response again

### ⌨️ Keyboard Shortcuts
- **Spacebar** - Activate voice commands
- **Alt+1** - Upload mode
- **Alt+2** - Camera mode  
- **Alt+3** - Analyze food
- **Alt+4** - Toggle history
- **Alt+H** - Voice tutorial

## Features

### 🔍 Smart Food Analysis
- **Image Upload & Camera Capture**: Upload photos or use your camera to analyze food items
- **AI-Powered Assessment**: Uses Groq's vision models to analyze food quality and nutrition
- **Freshness Rating**: Get a 1-10 freshness score with detailed visual indicators
- **Purchase Recommendations**: Smart buy/skip advice with reasoning
- **Nutritional Information**: Calories, key nutrients, and health benefits
- **Storage Guidance**: Best practices for storing your food after purchase

### 🎵 Audio Summaries
- **Voice Output**: Toggle-able audio summaries of analysis results
- **Accessibility**: Voice-enabled interface for hands-free operation
- **Natural Speech**: Human-like voice responses using Groq PlayAI TTS
- **Multiple Languages**: Support for various languages through Whisper

### 📊 Analysis History
- **Scan History**: View all your previous food analyses
- **Recipe Generation**: Select multiple items to generate custom recipes
- **Database Storage**: All analyses saved to MySQL database with full metadata
- **Voice Navigation**: Navigate history entirely through voice commands

### 🍳 Recipe Suggestions
- **Multi-Item Recipes**: Generate recipes using multiple scanned food items
- **AI-Generated Content**: Creative recipe ideas based on your selected ingredients
- **Voice Recipe Reading**: Recipes read aloud for hands-free cooking

## Technology Stack

### Frontend
- **React 18** - Modern React application with accessibility features
- **CSS3** - Accessible styling with high contrast and reduced motion support
- **Camera API** - Browser camera integration
- **Web Speech API** - Text-to-speech functionality and speech recognition
- **MediaRecorder API** - Voice command recording

### Backend
- **Flask** - Python web framework with accessibility endpoints
- **MySQL** - Database for storing analysis history
- **Groq AI** - Multiple models for comprehensive AI support:
  - **Vision**: `meta-llama/llama-4-maverick-17b-128e-instruct` for food analysis
  - **Speech-to-Text**: `whisper-large-v3-turbo` for voice commands
  - **Text-to-Speech**: `playai-tts` with Celeste voice for audio output
- **Node.js/Express** - Alternative API server implementation

### Database
- **MySQL** - Relational database with comprehensive food analysis schema
- **Base64 Image Storage** - Images stored directly in database
- **Full Metadata Tracking** - Timestamps, nutritional data, recommendations

## Installation & Setup

### Prerequisites
- **Python 3.7+** with pip
- **Node.js 16+** with npm
- **MySQL Server** running locally
- **Groq API Key** (sign up at groq.com) - Required for vision, speech, and voice features

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SnackOverflow
git checkout accessibility-whisper-integration
```

### 2. Backend Setup
```bash
# Install Python dependencies (make sure you're in the project root)
pip install -r requirements.txt

# Create .env file in backend directory with your credentials
cd backend
cat > .env << 'EOF'
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here
MYSQL_DB=snackoverflow
MYSQL_PORT=3306

# Groq AI API Configuration  
GROQ_API_KEY=your_groq_api_key_here
EOF

# Edit the .env file with your actual credentials:
# - Set MYSQL_PASSWORD to your MySQL root password
# - Get a Groq API key from groq.com and set GROQ_API_KEY

# Run database setup script
python setup_database.py
```

### 3. Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install
```

### 4. Start the Application
```bash
# Terminal 1: Start Flask backend (from project root)
cd backend
python api.py

# Terminal 2: Start React frontend (from project root)
cd client
npm start
```

**Important**: Always run `python api.py` from within the `backend/` directory, not from the project root.

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## API Endpoints

### Core Analysis
- `POST /analyze` - Analyze food image and save to database
- `POST /generate-recipes` - Generate recipes from selected food items

### Accessibility Features
- `POST /transcribe-audio` - Convert voice commands to text using Groq Whisper
- `GET /voice-tutorial` - Get available voice commands and tutorial
- `GET /accessibility-status` - Get current accessibility features status
- `POST /generate-audio` - Generate audio from text using Groq TTS

### Data Retrieval
- `GET /analyses/recent` - Get recent food analyses
- `GET /health` - API health check

## Usage

### For Sighted Users
1. **Capture/Upload**: Take a photo or upload an image of produce
2. **Analyze**: Wait for AI analysis (powered by Groq)
3. **Review**: Check freshness score, nutrition info, and buy/skip recommendation
4. **Listen**: Toggle audio summary for hands-free experience
5. **History**: View past analyses in the scan history
6. **Recipes**: Select multiple items to generate recipe ideas

### For Blind/Visually Impaired Users
1. **Voice Activation**: Press spacebar or say "hello" to start
2. **Voice Tutorial**: Say "help" to learn all available commands
3. **Image Capture**: Say "camera" then "capture" to take a photo, or "upload" to select a file
4. **Analysis**: Say "analyze" to process the food image
5. **Results**: Listen to comprehensive audio analysis including freshness, nutrition, and recommendations
6. **Navigation**: Use voice commands to access history, generate recipes, or start over

## Accessibility Standards Compliance

### WCAG 2.1 AA Compliance
- **Perceivable**: High contrast colors, scalable text, audio alternatives
- **Operable**: Full keyboard navigation, voice control, no seizure-inducing content
- **Understandable**: Clear language, consistent navigation, input assistance
- **Robust**: Compatible with assistive technologies, semantic HTML

### Screen Reader Support
- **Comprehensive ARIA Labels**: All interactive elements properly labeled
- **Semantic HTML**: Proper heading structure and landmarks
- **Live Regions**: Dynamic content updates announced to screen readers
- **Focus Management**: Logical tab order and focus indicators

### Voice Interface Features
- **Natural Language Processing**: Understands conversational commands
- **Context Awareness**: Commands work in any app state
- **Error Recovery**: Clear feedback when commands aren't recognized
- **Tutorial System**: Built-in help for learning voice commands

## Database Schema

The `food_analyses` table includes:
- Basic identification (id, fruit_name, created_at)
- Freshness data (freshness_level, freshness_state, visual_indicators)
- Recommendations (should_buy, best_use, purchase_recommendation)
- Nutrition (calories, nutrition_highlights, health_benefits)
- Storage (storage_method, shelf_life_days)
- Media (image_filename, image_data as base64)
- Fun element (food_pun for positive recommendations)

## Development

### Testing the Database
```bash
cd backend
python test_database.py
```

### Testing Accessibility Features
```bash
# Test voice commands
cd backend
python -c "
import requests
response = requests.get('http://localhost:5000/voice-tutorial')
print(response.json())
"

# Test audio generation
cd backend  
python -c "
import requests
response = requests.post('http://localhost:5000/generate-audio', 
                        json={'text': 'Testing accessibility features'})
print(response.json())
"
```

### Alternative Backend
The project includes both Flask (Python) and Express (Node.js) backend implementations:
- **Primary**: `api.py` (Flask) - with full accessibility features
- **Alternative**: `server.js` (Express) - basic functionality only

### Sample Images
Test images are available in `backend/img/`:
- `apple.webp` - Fresh apple example
- `bad-apple.webp` - Overripe apple example

## Voice Command Examples

### Basic Usage
- "Take a photo" → Switches to camera mode
- "Upload an image" → Opens file selector  
- "Analyze this food" → Processes current image
- "What did you find?" → Repeats last analysis

### Navigation
- "Show me the history" → Displays scan history
- "Go back" or "Reset" → Returns to main screen
- "Help me" → Plays voice tutorial

### Advanced Commands
- "Generate recipes with selected items" → Creates recipes from history
- "Tell me about the nutrition" → Repeats nutritional information
- "Should I buy this?" → Repeats purchase recommendation

## Troubleshooting

### Common Issues

1. **"can't open file api.py"**: Make sure you run `python api.py` from inside the `backend/` directory, not from the project root.

2. **Voice Commands Not Working**: 
   - Check microphone permissions in browser
   - Verify Groq API key is set correctly
   - Test with `curl -X POST http://localhost:5000/accessibility-status`

3. **Audio Not Playing**: 
   - Check browser audio permissions
   - Verify audio output device is working
   - Test with different voice commands

4. **Database Connection Errors**: 
   - Verify MySQL is running: `brew services start mysql` (macOS) or `sudo systemctl start mysql` (Linux)
   - Check your `.env` file has the correct MySQL password
   - Test connection: `mysql -u root -p`

5. **Missing Groq API Key**: 
   - Sign up at [groq.com](https://groq.com) to get your API key
   - Add it to `backend/.env` as `GROQ_API_KEY=your_key_here`
   - Accept PlayAI TTS terms at: https://console.groq.com/playground?model=playai-tts

6. **Port Already in Use**:
   - Frontend (3000): `lsof -ti:3000 | xargs kill -9`
   - Backend (5000): `lsof -ti:5000 | xargs kill -9`

7. **Node.js Version Warnings**: The Jest warnings about Node.js v23 are safe to ignore - the app will work fine.

### Accessibility-Specific Troubleshooting

1. **Voice Commands Not Recognized**:
   - Speak clearly and wait for the "listening" indicator
   - Try the tutorial: say "help" to learn proper command phrasing
   - Check microphone input levels in browser settings

2. **Audio Responses Not Playing**:
   - Verify audio is enabled in app settings (toggle switch)
   - Check browser's autoplay policy settings
   - Test with different commands to isolate the issue

3. **Keyboard Navigation Issues**:
   - Ensure focus indicators are visible (blue outline)
   - Test tab order follows logical sequence
   - Verify shortcuts work with Alt+number combinations

## Browser Compatibility

### Recommended Browsers (Full Feature Support)
- **Chrome 80+** - Full voice command and audio support
- **Firefox 75+** - Full accessibility features
- **Safari 14+** - Good support with some voice limitations
- **Edge 80+** - Full compatibility

### Screen Reader Compatibility
- **NVDA** (Windows) - Full support
- **JAWS** (Windows) - Full support  
- **VoiceOver** (macOS/iOS) - Full support
- **Orca** (Linux) - Good support

## Support

For setup issues, check:
1. **Database Connection**: Verify MySQL is running and credentials are correct
2. **API Keys**: Ensure Groq API key is valid and set in `.env`
3. **Dependencies**: Run `pip install -r requirements.txt` and `npm install`
4. **Ports**: Default ports are 3000 (frontend) and 5000 (backend)
5. **Working Directory**: Always run `python api.py` from the `backend/` directory
6. **Voice Permissions**: Check browser microphone and audio permissions
7. **Accessibility**: Test voice commands with the tutorial system

## Contributing

When contributing to accessibility features:

1. **Test with Screen Readers**: Verify changes work with NVDA, JAWS, or VoiceOver
2. **Voice Command Testing**: Ensure new features work with voice navigation
3. **Keyboard Navigation**: Test all interactions work without a mouse
4. **Audio Feedback**: Provide appropriate audio announcements for new features
5. **ARIA Labels**: Add proper accessibility attributes to new components

### Accessibility Guidelines
- Follow WCAG 2.1 AA standards
- Test with actual assistive technology users when possible
- Provide multiple input methods (voice, keyboard, touch)
- Ensure audio descriptions are clear and helpful
- Maintain focus management and tab order

## License

MIT License - see LICENSE file for details

---

*Built with ❤️ and accessibility-first design for smarter food choices for everyone*
