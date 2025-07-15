import mysql from 'mysql';
import config from './config.js';
import fetch from 'node-fetch';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://project-a1a08-default-rtdb.firebaseio.com"
});

// Define file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, "client/build")));

// Create MySQL Connection Pool
const pool = mysql.createPool(config);

// Insert a new post
app.post("/api/posts", (req, res) => {
  const { restaurantName, reviewText, rating, restaurantTag } = req.body;


  if (!restaurantName || !reviewText || !rating) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const sql = `
  INSERT INTO posts (restaurantName, reviewText, rating, restaurantTag, votes)
  VALUES (?, ?, ?, ?, 0)
  ON DUPLICATE KEY UPDATE 
  restaurantName = VALUES(restaurantName), 
  reviewText = VALUES(reviewText), 
  rating = VALUES(rating), 
  restaurantTag = VALUES(restaurantTag), 
  votes = VALUES(votes)
`;

  pool.query(sql, [restaurantName, reviewText, rating, restaurantTag], (err, result) => {
    if (err) {
      console.error("Error inserting review:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ id: result.insertId, restaurantName, reviewText, rating, votes: 0 });
  });
});

// Get all posts (sorted by most votes)
app.get("/api/posts", (req, res) => {
  const sql = `SELECT * FROM posts ORDER BY votes DESC`;
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Upvote or downvote a post
app.put("/api/posts/:id/vote", (req, res) => {
  const { id } = req.params;
  const { change } = req.body; // +1 for upvote, -1 for downvote

  if (![1, -1].includes(change)) {
    return res.status(400).json({ error: "Invalid vote change." });
  }

  const sql = `UPDATE posts SET votes = votes + ? WHERE id = ?`;
  pool.query(sql, [change, id], (err, result) => {
    if (err) {
      console.error("Error updating votes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});

// Delete a post
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM posts WHERE id = ?`;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting review:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});

// Fetch comments for a specific post
app.get("/api/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC";

  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching comments:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Add a new comment to a post
app.post("/api/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  const sql = "INSERT INTO comments (post_id, text) VALUES (?, ?)";

  pool.query(sql, [id, text], (err, result) => {
    if (err) {
      console.error("Error inserting comment:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ message: "Comment added successfully!" });
  });
});

// Delete a comment by ID
app.delete("/api/comments/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM comments WHERE id = ?";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting comment:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});


// Profile API
app.post("/api/profile", (req, res) => {
  const { name, email, fitnessGoal, lifestyle, dietaryRestrictions, privacy } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and Email are required." });
  }

  const dietaryString = dietaryRestrictions.length > 0 ? dietaryRestrictions.join(", ") : "";

  const sql = `
    INSERT INTO users (name, email, fitness_goal, lifestyle, dietary_restrictions, privacy)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    fitness_goal = VALUES(fitness_goal), 
    lifestyle = VALUES(lifestyle), 
    dietary_restrictions = VALUES(dietary_restrictions), 
    privacy = VALUES(privacy)
  `;

  pool.query(sql, [name, email, fitnessGoal, lifestyle, dietaryString, privacy], (err, result) => {
    if (err) {
      console.error("Error saving profile:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ message: "Profile saved successfully" });
  });
});

app.get("/api/profile/:email", (req, res) => {
  const { email } = req.params;

  const sql = "SELECT * FROM users WHERE email = ?";
  pool.query(sql, [email], (err, result) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result[0]);
  });
});

// LUKAS SQL SECTION


// ******************** LUKAS SQL SECTION ******************

// FETCH FROM DATABASE

/*
app.get('/api/recipes', async (req, res) => {
  try {
    const { allergy, ingredient } = req.query;
    
    // JOIN INGREDIENTS AND RECIPES TABLES
    let query = `
      SELECT  
        r.id, 
        r.title, 
        r.cooking_time, 
        r.instructions,
        r.fitness_goal,
        r.created_at,
        GROUP_CONCAT(i.name ORDER BY i.id SEPARATOR ', ') AS ingredients
      FROM rrsomani.ltrecipes r
      LEFT JOIN rrsomani.ltingredients i ON r.id = i.recipe_id
      GROUP BY r.id
    `;
    
    let havingConditions = [];
    let values = [];

    if (allergy) {
      havingConditions.push("NOT ingredients LIKE ?");
      values.push(`%${allergy}%`);
    }

    if (ingredient) {
      havingConditions.push("ingredients LIKE ?");
      values.push(`%${ingredient}%`);
    }

    if (havingConditions.length > 0) {
      query += " HAVING " + havingConditions.join(" AND ");
    }

    pool.query(query, values, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      // PROCESS EMPTY INGREDIENTS
      const processedResults = results.map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients || ""
      }));
      
      res.json(processedResults);
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

*/

// Update your GET /api/recipes endpoint in server.js
app.get('/api/recipes', async (req, res) => {
  try {
    const { allergy, ingredient, fitnessGoal } = req.query;
    
    // JOIN INGREDIENTS AND RECIPES TABLES
    let query = `
      SELECT  
        r.id, 
        r.title, 
        r.cooking_time, 
        r.instructions,
        r.fitness_goal,
        r.created_at,
        GROUP_CONCAT(i.name ORDER BY i.id SEPARATOR ', ') AS ingredients
      FROM rrsomani.ltrecipes r
      LEFT JOIN rrsomani.ltingredients i ON r.id = i.recipe_id
    `;
    
    let havingConditions = [];
    let whereConditions = [];
    let values = [];


    if (fitnessGoal && fitnessGoal !== '') {
      whereConditions.push("LOWER(r.fitness_goal) = LOWER(?)");
      values.push(fitnessGoal);
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }

    query += " GROUP BY r.id";

    if (allergy) {
      havingConditions.push("NOT ingredients LIKE ?");
      values.push(`%${allergy}%`);
    }

    if (ingredient) {
      havingConditions.push("ingredients LIKE ?");
      values.push(`%${ingredient}%`);
    }

    // Add HAVING clause if we have conditions
    if (havingConditions.length > 0) {
      query += " HAVING " + havingConditions.join(" AND ");
    }

    pool.query(query, values, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      // PROCESS EMPTY INGREDIENTS
      const processedResults = results.map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients || ""
      }));
      
      res.json(processedResults);
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST METHOD FOR NEW RECIPES
app.post("/api/recipes", (req, res) => {
  console.log("Received payload:", req.body);

  let { title, cooking_time, instructions, fitness_goal, ingredients } = req.body;

  if (!title || !cooking_time || !instructions || !fitness_goal || !ingredients) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // CSV HANDLING
  const ingredientsArray = typeof ingredients === 'string' 
    ? ingredients.split(",").map(item => item.trim()).filter(item => item !== "")
    : [];

  const insertRecipeSQL = `
    INSERT INTO rrsomani.ltrecipes (title, cooking_time, instructions, fitness_goal) 
    VALUES (?, ?, ?, ?)`;

  pool.query(insertRecipeSQL, [title, cooking_time, instructions, fitness_goal], (err, result) => {
    if (err) {
      console.error("Error inserting recipe:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const recipeId = result.insertId;

    if (ingredientsArray.length === 0) {
      return res.status(201).json({ message: "Recipe added successfully!", id: recipeId });
    }

    const insertIngredientsSQL = `
      INSERT INTO rrsomani.ltingredients (recipe_id, name) 
      VALUES ${ingredientsArray.map(() => "(?, ?)").join(", ")}`;

    const ingredientValues = ingredientsArray.flatMap((ingredient) => [recipeId, ingredient]);

    pool.query(insertIngredientsSQL, ingredientValues, (err) => {
      if (err) {
        console.error("Error inserting ingredients:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(201).json({ message: "Recipe added successfully!", id: recipeId });
    });
  });
});

// ******************** DIET TRACKING  ******************

// Get all meals for a user
app.get("/api/meals", (req, res) => {
  // You can add user authentication here later
  const sql = "SELECT * FROM meals ORDER BY date DESC";
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching meals:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Add a new meal
app.post("/api/meals", (req, res) => {
  const { name, calories, protein, carbs, fats, date } = req.body;
  
  if (!name || !calories || !protein || !carbs || !fats || !date) {
    return res.status(400).json({ error: "All fields are required." });
  }
  
  const sql = `
    INSERT INTO meals (name, calories, protein, carbs, fats, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  pool.query(sql, [name, calories, protein, carbs, fats, date], (err, result) => {
    if (err) {
      console.error("Error adding meal:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    const newMeal = {
      id: result.insertId,
      name,
      calories,
      protein, 
      carbs,
      fats,
      date
    };
    
    res.status(201).json(newMeal);
  });
});

// Update a meal
app.put("/api/meals/:id", (req, res) => {
  const { id } = req.params;
  const { name, calories, protein, carbs, fats, date } = req.body;
  
  if (!name || !calories || !protein || !carbs || !fats || !date) {
    return res.status(400).json({ error: "All fields are required." });
  }
  
  const sql = `
    UPDATE meals 
    SET name = ?, calories = ?, protein = ?, carbs = ?, fats = ?, date = ?
    WHERE id = ?
  `;
  
  pool.query(sql, [name, calories, protein, carbs, fats, date, id], (err, result) => {
    if (err) {
      console.error("Error updating meal:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }
    
    res.json({ id, name, calories, protein, carbs, fats, date });
  });
});

// Delete a meal
app.delete("/api/meals/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM meals WHERE id = ?";
  
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting meal:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Meal not found" });
    }
    
    res.json({ success: true });
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to Campus Eats API!");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


