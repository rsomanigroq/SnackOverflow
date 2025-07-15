# MySQL Database Setup for SnackOverflow

This guide will help you connect your local MySQL database to store food analysis entries.

## Prerequisites

1. **MySQL Server** - Make sure MySQL is installed and running on your machine
2. **Python Dependencies** - Install the required packages

## Quick Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Database

Navigate to the backend directory and run the setup script:

```bash
cd backend
python setup_database.py
```

This will:
- Create a `.env` file with default settings
- Test your MySQL connection
- Create the `snackoverflow` database

### 3. Edit Environment Variables

Edit the `.env` file in the backend directory with your actual MySQL credentials:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_actual_password
MYSQL_DB=snackoverflow
MYSQL_PORT=3306

GROQ_API_KEY=your_groq_api_key_here
```

### 4. Test the Setup

Run the setup script again to verify everything works:

```bash
python setup_database.py
```

### 5. Start the Application

```bash
# Start the backend
python api.py

# In another terminal, start the frontend
cd ../client
npm start
```

## Database Schema

The application creates a `food_analyses` table with the following structure:

- `id` - Auto-incrementing primary key
- `fruit_name` - Name of the food item
- `freshness_level` - Numeric freshness rating (1-10)
- `freshness_state` - Text description of freshness
- `visual_indicators` - Description of appearance
- `should_buy` - Boolean recommendation
- `best_use` - How to use the food
- `shelf_life_days` - Estimated shelf life
- `calories` - Calorie count
- `nutrition_highlights` - Key nutrients
- `health_benefits` - Health benefits
- `purchase_recommendation` - Buy/skip reasoning
- `storage_method` - Storage instructions
- `food_pun` - Fun food pun
- `image_filename` - Original image filename
- `image_data` - Base64 encoded image
- `created_at` - Timestamp of analysis

## API Endpoints

- `POST /analyze` - Analyze food image and save to database
- `GET /analyses/recent` - Get recent food analyses
- `GET /health` - Health check

## Troubleshooting

### Connection Issues
- Make sure MySQL is running
- Verify credentials in `.env` file
- Check if MySQL is accessible on the configured port

### Database Errors
- Ensure the `snackoverflow` database exists
- Check MySQL user permissions
- Verify table creation was successful

### Frontend Issues
- Make sure the backend is running on port 5000
- Check CORS settings if needed
- Verify API endpoints are accessible 