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

def get_food_wrap_data(days=30):
    """Get comprehensive food analysis data for wrap generation"""
    connection = get_database_connection()
    if not connection:
        return None
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Calculate date range
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get all analyses in the date range
        select_query = """
        SELECT * FROM food_analyses 
        WHERE created_at >= %s AND created_at <= %s
        ORDER BY created_at DESC
        """
        
        cursor.execute(select_query, (start_date, end_date))
        analyses = cursor.fetchall()
        
        if not analyses:
            return None
        
        # Calculate wrap statistics
        wrap_data = {
            'period': f'{days} days',
            'total_scans': len(analyses),
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'analyses': analyses
        }
        
        # Calculate additional statistics
        wrap_data.update(calculate_wrap_statistics(analyses))
        
        return wrap_data
        
    except Error as e:
        print(f"Error fetching wrap data: {e}")
        return None
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def calculate_wrap_statistics(analyses):
    """Calculate detailed statistics for the food wrap"""
    from collections import Counter
    import statistics
    
    # Basic counts
    total_scans = len(analyses)
    foods_scanned = [analysis['fruit_name'] for analysis in analyses]
    unique_foods = len(set(foods_scanned))
    
    # Food frequency
    food_counter = Counter(foods_scanned)
    top_food = food_counter.most_common(1)[0] if food_counter else ("No data", 0)
    
    # Calorie analysis
    calories_list = [analysis['calories'] for analysis in analyses if analysis['calories']]
    total_calories = sum(calories_list) if calories_list else 0
    avg_calories = statistics.mean(calories_list) if calories_list else 0
    
    # Quality analysis
    freshness_levels = [analysis['freshness_level'] for analysis in analyses if analysis['freshness_level']]
    avg_freshness = statistics.mean(freshness_levels) if freshness_levels else 0
    
    # Purchase decisions
    should_buy_count = sum(1 for analysis in analyses if analysis['should_buy'])
    buy_ratio = (should_buy_count / total_scans * 100) if total_scans > 0 else 0
    
    # Time analysis
    scan_times = []
    for analysis in analyses:
        if analysis['created_at']:
            if isinstance(analysis['created_at'], str):
                from datetime import datetime
                dt = datetime.fromisoformat(analysis['created_at'].replace('Z', '+00:00'))
            else:
                dt = analysis['created_at']
            scan_times.append(dt.hour)
    
    peak_hour = Counter(scan_times).most_common(1)[0][0] if scan_times else 12
    
    # Streak calculation
    consecutive_days = calculate_streak(analyses)
    
    # Food categories
    fruits = vegetables = other = 0
    fruit_keywords = ['apple', 'banana', 'orange', 'grape', 'berry', 'peach', 'pear', 'mango', 'kiwi', 'melon', 'cherry', 'plum', 'pineapple']
    vegetable_keywords = ['carrot', 'broccoli', 'tomato', 'cucumber', 'lettuce', 'spinach', 'onion', 'garlic', 'potato', 'pepper', 'corn']
    
    for food in foods_scanned:
        food_lower = food.lower()
        if any(keyword in food_lower for keyword in fruit_keywords):
            fruits += 1
        elif any(keyword in food_lower for keyword in vegetable_keywords):
            vegetables += 1
        else:
            other += 1
    
    # Pun count
    puns_received = sum(1 for analysis in analyses if analysis.get('food_pun'))
    
    return {
        'unique_foods': unique_foods,
        'top_food': {
            'name': top_food[0],
            'count': top_food[1]
        },
        'total_calories': total_calories,
        'avg_calories': round(avg_calories, 1),
        'avg_freshness': round(avg_freshness, 1),
        'buy_ratio': round(buy_ratio, 1),
        'peak_hour': peak_hour,
        'consecutive_days': consecutive_days,
        'food_categories': {
            'fruits': fruits,
            'vegetables': vegetables,
            'other': other
        },
        'puns_received': puns_received,
        'food_frequency': dict(food_counter.most_common(10))
    }

def calculate_streak(analyses):
    """Calculate the longest consecutive days of scanning"""
    if not analyses:
        return 0
    
    from datetime import datetime, timedelta
    
    # Get unique dates
    dates = set()
    for analysis in analyses:
        if analysis['created_at']:
            if isinstance(analysis['created_at'], str):
                dt = datetime.fromisoformat(analysis['created_at'].replace('Z', '+00:00'))
            else:
                dt = analysis['created_at']
            dates.add(dt.date())
    
    if not dates:
        return 0
    
    sorted_dates = sorted(dates)
    
    max_streak = 1
    current_streak = 1
    
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] - sorted_dates[i-1] == timedelta(days=1):
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 1
    
    return max_streak 
