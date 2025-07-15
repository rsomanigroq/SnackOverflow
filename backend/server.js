const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const { Groq } = require('groq-sdk');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB || 'snackoverflow',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

// API Routes
app.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    
    // Analyze with Groq (your existing logic)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image and provide a JSON response with the following structure:
{
  "fruit_name": "Name of the food item",
  "freshness_level": 8,
  "freshness_state": "Fresh/Ripe/Overripe/Spoiled",
  "visual_indicators": "Description of color, texture, blemishes",
  "should_buy": true,
  "best_use": "Eat now/Wait a few days/Use for cooking/Avoid",
  "shelf_life_days": 3,
  "calories": 105,
  "nutrition_highlights": "Key vitamins and minerals",
  "health_benefits": "Notable health benefits",
  "purchase_recommendation": "Buy/Skip with reasoning",
  "storage_method": "Best storage method after purchase"
}

IMPORTANT: Respond ONLY with valid JSON.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      temperature: 0.1,
      max_tokens: 1000,
    });

    const analysis = JSON.parse(result.choices[0].message.content);
    
    // Save to database
    const [result] = await pool.execute(
      `INSERT INTO food_analyses (
        fruit_name, freshness_level, freshness_state, visual_indicators,
        should_buy, best_use, shelf_life_days, calories, nutrition_highlights,
        health_benefits, purchase_recommendation, storage_method, image_filename, image_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        analysis.fruit_name,
        analysis.freshness_level,
        analysis.freshness_state,
        analysis.visual_indicators,
        analysis.should_buy,
        analysis.best_use,
        analysis.shelf_life_days,
        analysis.calories,
        analysis.nutrition_highlights,
        analysis.health_benefits,
        analysis.purchase_recommendation,
        analysis.storage_method,
        req.file.originalname,
        imageBase64
      ]
    );

    analysis.id = result.insertId;
    res.json(analysis);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.get('/analyses/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await pool.execute(
      `SELECT * FROM food_analyses ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    
    // Format for frontend
    const formatted = rows.map(row => {
      const timeDiff = Date.now() - new Date(row.created_at).getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      let timeAgo;
      if (days > 0) timeAgo = `${days} days ago`;
      else if (hours > 0) timeAgo = `${hours} hours ago`;
      else timeAgo = `${minutes} minutes ago`;
      
      return {
        id: row.id,
        name: row.fruit_name,
        calories: row.calories,
        nutrition: row.nutrition_highlights,
        quality: row.freshness_state,
        image: row.image_data ? `data:image/jpeg;base64,${row.image_data}` : null,
        timestamp: timeAgo
      };
    });
    
    res.json(formatted);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'SnackOverflow API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 