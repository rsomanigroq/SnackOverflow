#!/usr/bin/env python3
"""
Database setup script for SnackOverflow
This script helps you configure and test your MySQL database connection.
"""

import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

def create_env_file():
    """Create .env file with database configuration"""
    env_content = """# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DB=snackoverflow
MYSQL_PORT=3306

# Groq API Key
GROQ_API_KEY=your_groq_api_key_here
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file")
    print("📝 Please edit .env file with your actual MySQL credentials")

def test_connection():
    """Test MySQL database connection"""
    load_dotenv()
    
    try:
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            port=int(os.getenv('MYSQL_PORT', 3306))
        )
        
        if connection.is_connected():
            print("✅ Successfully connected to MySQL server")
            
            # Create database if it doesn't exist
            cursor = connection.cursor()
            cursor.execute("CREATE DATABASE IF NOT EXISTS snackoverflow")
            print("✅ Database 'snackoverflow' created/verified")
            
            cursor.close()
            connection.close()
            return True
            
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Make sure MySQL is running")
        print("2. Check your credentials in .env file")
        print("3. Verify MySQL is accessible on the configured host/port")
        return False

def main():
    print("🍌 SnackOverflow Database Setup")
    print("=" * 40)
    
    # Check if .env exists
    if not os.path.exists('.env'):
        print("📁 Creating .env file...")
        create_env_file()
    else:
        print("📁 .env file already exists")
    
    print("\n🔍 Testing database connection...")
    if test_connection():
        print("\n✅ Database setup complete!")
        print("🚀 You can now run your Flask app with: python api.py")
    else:
        print("\n❌ Database setup failed. Please check your configuration.")

if __name__ == "__main__":
    main() 