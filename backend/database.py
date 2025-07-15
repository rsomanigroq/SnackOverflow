import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_database_connection():
    """Create and return a MySQL database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DB', 'snackoverflow'),
            port=int(os.getenv('MYSQL_PORT', 3306))
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def create_tables():
    """Create the necessary tables if they don't exist"""
    connection = get_database_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Create food_analyses table
        create_table_query = """
        CREATE TABLE IF NOT EXISTS food_analyses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fruit_name VARCHAR(255) NOT NULL,
            freshness_level INT,
            freshness_state VARCHAR(100),
            visual_indicators TEXT,
            should_buy BOOLEAN,
            best_use VARCHAR(100),
            shelf_life_days INT,
            calories INT,
            nutrition_highlights TEXT,
            health_benefits TEXT,
            purchase_recommendation TEXT,
            storage_method TEXT,
            food_pun TEXT,
            image_filename VARCHAR(255),
            image_data LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        cursor.execute(create_table_query)
        connection.commit()
        print("✅ Database tables created successfully")
        return True
        
    except Error as e:
        print(f"Error creating tables: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def save_food_analysis(analysis_data, image_filename=None, image_data=None):
    """Save food analysis to database"""
    connection = get_database_connection()
    if not connection:
        return None
    
    try:
        cursor = connection.cursor()
        
        insert_query = """
        INSERT INTO food_analyses (
            fruit_name, freshness_level, freshness_state, visual_indicators,
            should_buy, best_use, shelf_life_days, calories, nutrition_highlights,
            health_benefits, purchase_recommendation, storage_method, food_pun,
            image_filename, image_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            analysis_data.get('fruit_name'),
            analysis_data.get('freshness_level'),
            analysis_data.get('freshness_state'),
            analysis_data.get('visual_indicators'),
            analysis_data.get('should_buy'),
            analysis_data.get('best_use'),
            analysis_data.get('shelf_life_days'),
            analysis_data.get('calories'),
            analysis_data.get('nutrition_highlights'),
            analysis_data.get('health_benefits'),
            analysis_data.get('purchase_recommendation'),
            analysis_data.get('storage_method'),
            analysis_data.get('food_pun'),
            image_filename,
            image_data
        )
        
        cursor.execute(insert_query, values)
        connection.commit()
        
        # Get the inserted ID
        inserted_id = cursor.lastrowid
        print(f"✅ Food analysis saved to database with ID: {inserted_id}")
        return inserted_id
        
    except Error as e:
        print(f"Error saving to database: {e}")
        return None
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def get_recent_analyses(limit=10):
    """Get recent food analyses from database"""
    connection = get_database_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        select_query = """
        SELECT * FROM food_analyses 
        ORDER BY created_at DESC 
        LIMIT %s
        """
        
        cursor.execute(select_query, (limit,))
        results = cursor.fetchall()
        
        return results
        
    except Error as e:
        print(f"Error fetching analyses: {e}")
        return []
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close() 