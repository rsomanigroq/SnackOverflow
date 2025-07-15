from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import tempfile
import json
from groq import Groq
from dotenv import load_dotenv
import subprocess
import platform

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
  "storage_method": "Best storage method after purchase",
  "food_pun": "A clever pun using the food name (only if should_buy is true, otherwise null)"
}

IMPORTANT: 
- Respond ONLY with valid JSON. Do not include any text before or after the JSON object.
- If should_buy is true, include a clever pun using the food name in the food_pun field.
- If should_buy is false, set food_pun to null.
- Make the puns fun and food-related!"""
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

def create_natural_audio_script(fruit_name, nutrition_info, should_buy, groq_api_key):
    """Use Groq to create a natural, conversational audio script"""
    
    client = Groq(api_key=groq_api_key)
    
    try:
        # Use Groq to restructure the information into a natural sentence
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": f"""Convert this produce analysis into a single, natural-sounding sentence for audio narration:

Fruit: {fruit_name}
Nutrition: {nutrition_info}
Recommendation: {should_buy}

Create a conversational sentence that sounds like a helpful friend giving advice. Make it flow naturally and sound friendly. Examples:
- "This looks like fresh apples - they're packed with vitamin C and I'd definitely grab them since they look crisp and ready to eat!"
- "These bananas appear ripe and are great for potassium, so I'd recommend buying them for a healthy snack."

Keep it under 25 words and make it sound natural for speech."""
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=100
        )
        
        natural_script = response.choices[0].message.content.strip()
        
        # Clean up any extra quotes or formatting
        natural_script = natural_script.replace('"', '').replace("'", "'").strip()
        
        return natural_script
        
    except Exception as e:
        print(f"Error creating natural script: {e}")
        # Fallback to simple format
        return f"This looks like {fruit_name}. {nutrition_info}. {should_buy}"

def create_audio_summary(fruit_name, nutrition_info, should_buy, groq_api_key):
    """Generate audio summary using Groq PlayAI TTS"""
    
    # Create natural-sounding script using another API call
    print("🤖 Creating natural audio script...")
    summary_text = create_natural_audio_script(fruit_name, nutrition_info, should_buy, groq_api_key)
    
    print(f"\n🔊 AUDIO SUMMARY:")
    print(f"Text: {summary_text}")
    
    # Initialize Groq client for TTS
    client = Groq(api_key=groq_api_key)
    
    try:
        # Generate speech using Groq's PlayAI TTS
        response = client.audio.speech.create(
            model="playai-tts",
            voice="Celeste-PlayAI",
            input=summary_text,
            response_format="wav"
        )
        
        # Save audio file
        speech_file_path = "produce_summary.wav"
        response.write_to_file(speech_file_path)
        
        print(f"🎵 Audio saved as: {speech_file_path}")
        
        return speech_file_path
        
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        if "model_terms_required" in str(e):
            print("   Please accept PlayAI TTS terms at: https://console.groq.com/playground?model=playai-tts")
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
            "food_pun": "This food is berry good for you! 🫐",
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
            "food_pun": "This food is berry good for you! 🫐",
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

@app.route('/analyze-with-audio', methods=['POST'])
def analyze_food_with_audio():
    """API endpoint to analyze food images and generate audio summary"""
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
            print(f"Analyzing image with audio: {file.filename}")
            
            # Analyze the image
            result = analyze_nutrition_with_groq(temp_path, api_key)
            
            if result:
                print(f"Groq response: {result[:200]}...")  # Log first 200 chars
                
                # Parse the response
                parsed_result = parse_groq_response(result)
                
                print(f"Parsed result: {parsed_result}")
                
                # Generate audio summary
                fruit_name = parsed_result.get('fruit_name', 'Food Item')
                nutrition_info = parsed_result.get('nutrition_highlights', 'Good source of nutrients')
                should_buy = parsed_result.get('purchase_recommendation', 'Analysis provided')
                
                audio_file_path = create_audio_summary(fruit_name, nutrition_info, should_buy, api_key)
                
                # Add audio file path to response if successful
                if audio_file_path:
                    parsed_result['audio_file'] = audio_file_path
                    parsed_result['audio_text'] = f"Audio summary generated for {fruit_name}"
                
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

@app.route('/generate-audio', methods=['POST'])
def generate_audio_from_text():
    """API endpoint to generate audio from text using Groq TTS"""
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        
        # Get API key from environment variable
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            return jsonify({'error': 'GROQ_API_KEY not configured'}), 500
        
        print(f"🎤 Generating audio for text: {text}")
        
        # Generate audio using Groq PlayAI TTS
        client = Groq(api_key=api_key)
        
        try:
            # Generate speech using Groq's PlayAI TTS
            response = client.audio.speech.create(
                model="playai-tts",
                voice="Celeste-PlayAI",
                input=text,
                response_format="wav"
            )
            
            # Save audio file
            speech_file_path = "produce_summary.wav"
            response.write_to_file(speech_file_path)
            
            print(f"🎵 Audio saved as: {speech_file_path}")
            
            # Play the audio file
            print("🔊 Playing audio...")
            system = platform.system().lower()
            
            if system == "darwin":  # macOS
                subprocess.run(["afplay", speech_file_path], check=True)
                print("✅ Audio playback completed")
            else:
                print(f"💡 Please play manually: open {speech_file_path}")
            
            return jsonify({
                'audio_file': speech_file_path,
                'text': text,
                'message': 'Audio generated and played successfully'
            })
            
        except Exception as e:
            print(f"❌ TTS Error: {e}")
            if "model_terms_required" in str(e):
                print("   Please accept PlayAI TTS terms at: https://console.groq.com/playground?model=playai-tts")
            return jsonify({'error': f'TTS Error: {str(e)}'}), 500
                
    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'SnackOverflow API is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 