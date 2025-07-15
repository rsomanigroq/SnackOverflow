# SnackOverflow 🍌

SnackOverflow is an AI-powered food analysis application that helps users make informed decisions about produce quality and nutrition. Using computer vision and AI analysis powered by Groq, the app can analyze food images to determine freshness, nutritional value, and purchase recommendations.

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

### 📊 Analysis History
- **Scan History**: View all your previous food analyses
- **Recipe Generation**: Select multiple items to generate custom recipes
- **Database Storage**: All analyses saved to MySQL database with full metadata

### 🍳 Recipe Suggestions
- **Multi-Item Recipes**: Generate recipes using multiple scanned food items
- **AI-Generated Content**: Creative recipe ideas based on your selected ingredients

## Technology Stack

### Frontend
- **React 18** - Modern React application
- **CSS3** - Custom styling with responsive design
- **Camera API** - Browser camera integration
- **Web Speech API** - Text-to-speech functionality

### Backend
- **Flask** - Python web framework
- **MySQL** - Database for storing analysis history
- **Groq AI** - Vision model for food analysis (`meta-llama/llama-4-maverick-17b-128e-instruct`)
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
- **Groq API Key** (sign up at groq.com)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SnackOverflow
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

### Data Retrieval
- `GET /analyses/recent` - Get recent food analyses
- `GET /health` - API health check

### Audio Features
- `POST /create-audio` - Generate audio summary of analysis

## Database Schema

The `food_analyses` table includes:
- Basic identification (id, fruit_name, created_at)
- Freshness data (freshness_level, freshness_state, visual_indicators)
- Recommendations (should_buy, best_use, purchase_recommendation)
- Nutrition (calories, nutrition_highlights, health_benefits)
- Storage (storage_method, shelf_life_days)
- Media (image_filename, image_data as base64)
- Fun element (food_pun for positive recommendations)

## Usage

1. **Capture/Upload**: Take a photo or upload an image of produce
2. **Analyze**: Wait for AI analysis (powered by Groq)
3. **Review**: Check freshness score, nutrition info, and buy/skip recommendation
4. **Listen**: Toggle audio summary for hands-free experience
5. **History**: View past analyses in the scan history
6. **Recipes**: Select multiple items to generate recipe ideas

## Development

### Testing the Database
```bash
cd backend
python test_database.py
```

### Alternative Backend
The project includes both Flask (Python) and Express (Node.js) backend implementations:
- **Primary**: `api.py` (Flask)
- **Alternative**: `server.js` (Express)

### Sample Images
Test images are available in `backend/img/`:
- `apple.webp` - Fresh apple example
- `bad-apple.webp` - Overripe apple example

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

1. **"can't open file api.py"**: Make sure you run `python api.py` from inside the `backend/` directory, not from the project root.

2. **Database Connection Errors**: 
   - Verify MySQL is running: `brew services start mysql` (macOS) or `sudo systemctl start mysql` (Linux)
   - Check your `.env` file has the correct MySQL password
   - Test connection: `mysql -u root -p`

3. **Missing Groq API Key**: 
   - Sign up at [groq.com](https://groq.com) to get your API key
   - Add it to `backend/.env` as `GROQ_API_KEY=your_key_here`

4. **Port Already in Use**:
   - Frontend (3000): `lsof -ti:3000 | xargs kill -9`
   - Backend (5000): `lsof -ti:5000 | xargs kill -9`

5. **Node.js Version Warnings**: The Jest warnings about Node.js v23 are safe to ignore - the app will work fine.

## Support

For setup issues, check:
1. **Database Connection**: Verify MySQL is running and credentials are correct
2. **API Keys**: Ensure Groq API key is valid and set in `.env`
3. **Dependencies**: Run `pip install -r requirements.txt` and `npm install`
4. **Ports**: Default ports are 3000 (frontend) and 5000 (backend)
5. **Working Directory**: Always run `python api.py` from the `backend/` directory

---

*Built with ❤️ for smarter food choices*
