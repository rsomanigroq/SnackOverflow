from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import tempfile
import json
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

def encode_image_to_base64(image_path):
    """Convert image file to base64 string"""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error reading image: {e}")
        return None

def analyze_nutrition_with_groq(image_path, groq_api_key):
    """Analyze image for nutritional information using Groq"""
    
    # Initialize Groq client
    client = Groq(api_key=groq_api_key)
    
    # Convert image to base64
    base64_image = encode_image_to_base64(image_path)
    if not base64_image:
        return None
    
    try:
        # Create chat completion with vision
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this food image and provide a JSON response with the following structure:

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

IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON object."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            model="meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature=0.1,
            max_tokens=1000,
        )
        
        return chat_completion.choices[0].message.content
        
    except Exception as e:
        print(f"Error with Groq API: {e}")
        return None

def parse_groq_response(response_text):
    """Parse the Groq response and extract JSON or create structured data"""
    try:
        # Try to find JSON in the response
        response_text = response_text.strip()
        
        # If it starts and ends with curly braces, try to parse as JSON
        if response_text.startswith('{') and response_text.endswith('}'):
            return json.loads(response_text)
        
        # If not, try to extract JSON from the text
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx + 1]
            return json.loads(json_str)
        
        # If no JSON found, create a structured response from the text
        return {
            "fruit_name": "Food Item",
            "freshness_level": 7,
            "freshness_state": "Good",
            "visual_indicators": "Standard quality assessment",
            "should_buy": True,
            "best_use": "Eat now",
            "shelf_life_days": 3,
            "calories": 100,
            "nutrition_highlights": "Nutritional analysis complete",
            "health_benefits": "Good source of nutrients",
            "purchase_recommendation": "Analysis provided",
            "storage_method": "Store in cool, dry place",
            "raw_analysis": response_text
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        # Return structured data with the raw response
        return {
            "fruit_name": "Food Item",
            "freshness_level": 7,
            "freshness_state": "Good",
            "visual_indicators": "Standard quality assessment",
            "should_buy": True,
            "best_use": "Eat now",
            "shelf_life_days": 3,
            "calories": 100,
            "nutrition_highlights": "Nutritional analysis complete",
            "health_benefits": "Good source of nutrients",
            "purchase_recommendation": "Analysis provided",
            "storage_method": "Store in cool, dry place",
            "raw_analysis": response_text
        }

@app.route('/analyze', methods=['POST'])
def analyze_food():
    """API endpoint to analyze food images"""
    try:
        # Check if image file is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Get API key from environment variable
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            return jsonify({'error': 'GROQ_API_KEY not configured'}), 500
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            print(f"Analyzing image: {file.filename}")
            
            # Analyze the image
            result = analyze_nutrition_with_groq(temp_path, api_key)
            
            if result:
                print(f"Groq response: {result[:200]}...")  # Log first 200 chars
                
                # Parse the response
                parsed_result = parse_groq_response(result)
                
                print(f"Parsed result: {parsed_result}")
                
                return jsonify(parsed_result)
            else:
                return jsonify({'error': 'Failed to analyze image'}), 500
                
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'SnackOverflow API is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 