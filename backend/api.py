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
from database import create_tables, save_food_analysis, get_recent_analyses

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize database tables on startup
create_tables()

# Voice command mappings for accessibility
VOICE_COMMANDS = {
    "analyze": ["analyze", "scan", "check food", "examine", "process image"],
    "camera": ["camera", "take photo", "use camera"],
    "capture": ["capture", "take picture", "snap photo"],
    "upload": ["upload", "select file", "choose image", "browse"],
    "history": ["history", "show history", "recent scans", "past analyses"],
    "help": ["help", "tutorial", "how to use", "instructions", "guide"],
    "reset": ["reset", "clear", "start over", "cancel"],
    "repeat": ["repeat", "say again", "read again"]
}

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
            "fruit_name": "No food detected",
            "freshness_level": 0,
            "freshness_state": "Unable to assess",
            "visual_indicators": "No clear food item identified in the image",
            "should_buy": False,
            "best_use": "Unable to determine",
            "shelf_life_days": 0,
            "calories": 0,
            "nutrition_highlights": "No nutritional information available",
            "health_benefits": "No food item identified",
            "purchase_recommendation": "No food detected - please try with a clearer image",
            "storage_method": "Not applicable",
            "food_pun": None,
            "raw_analysis": response_text
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        # Return structured data with the raw response
        return {
            "fruit_name": "No food detected",
            "freshness_level": 0,
            "freshness_state": "Unable to assess",
            "visual_indicators": "No clear food item identified in the image",
            "should_buy": False,
            "best_use": "Unable to determine",
            "shelf_life_days": 0,
            "calories": 0,
            "nutrition_highlights": "No nutritional information available",
            "health_benefits": "No food item identified",
            "purchase_recommendation": "No food detected - please try with a clearer image",
            "storage_method": "Not applicable",
            "food_pun": None,
            "raw_analysis": response_text
        }

def generate_recipes_with_groq(selected_foods, groq_api_key):
    """Generate recipes using Groq based on selected food items"""
    
    # Initialize Groq client
    client = Groq(api_key=groq_api_key)
    
    try:
        # Create a detailed prompt for recipe generation
        food_details = []
        for food in selected_foods:
            food_details.append(f"""
- {food['name']} (Freshness: {food['quality']}, Calories: {food['calories']}, 
  Nutrition: {food['nutrition']}, Best Use: {food['bestUse']}, 
  Shelf Life: {food['shelfLife']} days)
""")
        
        food_list = "\n".join(food_details)
        
        # Create chat completion for recipe generation
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": f"""Based on these food items from my recent scans, generate 3 creative and practical recipes:

{food_list}

Please provide a JSON response with the following structure:

{{
  "recipes": [
    {{
      "name": "Recipe Name",
      "description": "Brief description of the recipe",
      "ingredients": [
        {{
          "item": "Food item name",
          "amount": "Quantity needed",
          "notes": "Any special preparation notes"
        }}
      ],
      "instructions": [
        "Step 1",
        "Step 2",
        "Step 3"
      ],
      "cooking_time": "15 minutes",
      "difficulty": "Easy/Medium/Hard",
      "calories_per_serving": 250,
      "servings": 2,
      "tips": "Helpful cooking tips",
      "why_this_recipe": "Why this recipe works well with these ingredients"
    }}
  ],
  "summary": {{
    "total_calories": 750,
    "nutrition_benefits": "Combined nutritional benefits",
    "freshness_considerations": "How to use ingredients based on their freshness"
  }}
}}

IMPORTANT GUIDELINES:
- Consider the freshness state of ingredients (use fresher items first)
- Account for shelf life when planning cooking order
- Make recipes practical and achievable
- Include any additional common ingredients needed
- Focus on healthy, nutritious combinations
- Consider dietary restrictions and preferences
- Make instructions clear and step-by-step

Respond ONLY with valid JSON. Do not include any text before or after the JSON object."""
                }
            ],
            model="meta-llama/llama-4-maverick-17b-128e-instruct",
            temperature=0.3,
            max_tokens=2000,
        )
        
        response_content = chat_completion.choices[0].message.content
        print(f"Raw Groq response: {response_content[:500]}...")  # Log first 500 chars
        
        return response_content
        
    except Exception as e:
        print(f"Error with Groq API for recipe generation: {e}")
        return None

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
                
                # Convert image to base64 for storage
                image_base64 = None
                try:
                    with open(temp_path, "rb") as image_file:
                        image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
                except Exception as e:
                    print(f"Error converting image to base64: {e}")
                
                # Save to database
                db_id = save_food_analysis(parsed_result, file.filename, image_base64)
                if db_id:
                    parsed_result['id'] = db_id
                    print(f"✅ Analysis saved to database with ID: {db_id}")
                else:
                    print("⚠️ Failed to save to database, but analysis completed")
                
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

@app.route('/generate-recipes', methods=['POST'])
def generate_recipes():
    """API endpoint to generate recipes based on selected food items"""
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data or 'selectedFoods' not in data:
            return jsonify({'error': 'No selected foods provided'}), 400
        
        selected_foods = data['selectedFoods']
        
        if not selected_foods or len(selected_foods) == 0:
            return jsonify({'error': 'No food items selected'}), 400
        
        # Get API key from environment variable
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            return jsonify({'error': 'GROQ_API_KEY not configured'}), 500
        
        print(f"🍳 Generating recipes for {len(selected_foods)} selected foods...")
        
        # Generate recipes using Groq
        result = generate_recipes_with_groq(selected_foods, api_key)
        
        if result:
            print(f"Recipe generation response: {result[:200]}...")  # Log first 200 chars
            
            # Parse the response
            try:
                # Try to find JSON in the response
                response_text = result.strip()
                
                # If it starts and ends with curly braces, try to parse as JSON
                if response_text.startswith('{') and response_text.endswith('}'):
                    parsed_result = json.loads(response_text)
                    return jsonify(parsed_result)
                
                # If not, try to extract JSON from the text
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}')
                
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx + 1]
                    parsed_result = json.loads(json_str)
                    return jsonify(parsed_result)
                
                # If no JSON found, create a fallback response
                print("No valid JSON found in response, creating fallback")
                fallback_result = {
                    "recipes": [
                        {
                            "name": "Simple Recipe",
                            "description": "A simple recipe using your selected ingredients",
                            "ingredients": [
                                {
                                    "item": "Selected ingredients",
                                    "amount": "As available",
                                    "notes": "Use based on freshness"
                                }
                            ],
                            "instructions": [
                                "Wash and prepare your ingredients",
                                "Combine ingredients in a bowl",
                                "Serve fresh and enjoy!"
                            ],
                            "cooking_time": "10 minutes",
                            "difficulty": "Easy",
                            "calories_per_serving": 200,
                            "servings": 2,
                            "tips": "Use freshest ingredients first",
                            "why_this_recipe": "Simple preparation to preserve nutrients"
                        }
                    ],
                    "summary": {
                        "total_calories": 400,
                        "nutrition_benefits": "Fresh ingredients provide essential nutrients",
                        "freshness_considerations": "Use ingredients based on their freshness level"
                    }
                }
                return jsonify(fallback_result)
                
            except json.JSONDecodeError as e:
                print(f"Error parsing recipe JSON: {e}")
                print(f"Full response: {result}")
                return jsonify({'error': 'Failed to parse recipe response'}), 500
        else:
            return jsonify({'error': 'Failed to generate recipes'}), 500
            
    except Exception as e:
        print(f"Server error in recipe generation: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/transcribe-audio', methods=['POST'])
def transcribe_audio_endpoint():
    """API endpoint to transcribe audio using Groq Whisper"""
    try:
        # Check if audio file is in request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400
        
        # Get API key from environment variable
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            return jsonify({'error': 'GROQ_API_KEY not configured'}), 500
        
        # Save uploaded audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            print(f"Transcribing audio: {file.filename}")
            
            # Initialize Groq client
            client = Groq(api_key=api_key)
            
            # Transcribe using Groq Whisper
            with open(temp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-large-v3-turbo",
                    response_format="text",
                    language="en"
                )
            
            transcribed_text = transcription
            print(f"Transcription result: {transcribed_text}")
            
            # Analyze for voice commands
            voice_command = analyze_voice_command(transcribed_text)
            
            return jsonify({
                'transcription': transcribed_text,
                'voice_command': voice_command,
                'success': True
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return jsonify({'error': f'Transcription error: {str(e)}'}), 500

def analyze_voice_command(text):
    """Analyze transcribed text for voice commands"""
    if not text:
        return None
    
    text_lower = text.lower().strip()
    
    # Check for voice commands
    for command, variations in VOICE_COMMANDS.items():
        for variation in variations:
            if variation in text_lower:
                return {
                    'command': command,
                    'confidence': 'high',
                    'original_text': text,
                    'matched_phrase': variation
                }
    
    # Check for generic navigation commands
    if any(word in text_lower for word in ['go to', 'navigate', 'open', 'show me']):
        return {
            'command': 'navigate',
            'confidence': 'medium',
            'original_text': text,
            'matched_phrase': 'navigation request'
        }
    
    return {
        'command': 'unknown',
        'confidence': 'low',
        'original_text': text,
        'matched_phrase': None
    }

@app.route('/voice-tutorial', methods=['GET'])
def get_voice_tutorial():
    """Provide voice tutorial and available commands"""
    tutorial = {
        'welcome_message': "Welcome to SnackOverflow's voice interface! Here are the commands you can use:",
        'commands': {
            'Food Analysis': [
                "Say 'analyze' or 'scan' to analyze food in your current image",
                "Say 'camera' to switch to camera mode",
                "Say 'upload' to select an image file"
            ],
            'Navigation': [
                "Say 'history' to view your scan history",
                "Say 'help' for this tutorial",
                "Say 'reset' to start over"
            ],
            'Audio Controls': [
                "Say 'repeat' to hear the last response again",
                "All analysis results are automatically read aloud"
            ]
        },
        'tips': [
            "Speak clearly and wait for the beep",
            "Commands work in any order",
            "You can combine commands like 'upload and analyze'",
            "The app will announce what it's doing"
        ]
    }
    
    return jsonify(tutorial)

@app.route('/accessibility-status', methods=['GET'])
def get_accessibility_status():
    """Get current accessibility features status"""
    return jsonify({
        'voice_commands_enabled': True,
        'audio_feedback_enabled': True,
        'keyboard_navigation_enabled': True,
        'screen_reader_support': True,
        'available_commands': list(VOICE_COMMANDS.keys()),
        'whisper_model': 'whisper-large-v3-turbo',
        'tts_model': 'playai-tts'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'SnackOverflow API is running'})

@app.route('/analyses/recent', methods=['GET'])
def get_recent_food_analyses():
    """Get recent food analyses from database"""
    try:
        limit = request.args.get('limit', 10, type=int)
        analyses = get_recent_analyses(limit)
        
        # Format for frontend
        formatted_analyses = []
        for analysis in analyses:
            # Calculate time ago
            from datetime import datetime
            created_at = analysis['created_at']
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            
            time_diff = datetime.now() - created_at
            minutes = int(time_diff.total_seconds() / 60)
            hours = int(minutes / 60)
            days = int(hours / 24)
            
            if days > 0:
                time_ago = f"{days} days ago"
            elif hours > 0:
                time_ago = f"{hours} hours ago"
            else:
                time_ago = f"{minutes} minutes ago"
            
            formatted_analysis = {
                'id': analysis['id'],
                'name': analysis['fruit_name'],
                'calories': analysis['calories'],
                'nutrition': analysis['nutrition_highlights'],
                'quality': analysis['freshness_state'],
                'image': f"data:image/jpeg;base64,{analysis['image_data']}" if analysis['image_data'] else None,
                'timestamp': time_ago,
                'shouldBuy': analysis['should_buy'],
                'bestUse': analysis['best_use'],
                'shelfLife': analysis['shelf_life_days'],
                'healthBenefits': analysis['health_benefits'],
                'purchaseRecommendation': analysis['purchase_recommendation'],
                'storageMethod': analysis['storage_method'],
                'foodPun': analysis['food_pun']
            }
            formatted_analyses.append(formatted_analysis)
        
        return jsonify(formatted_analyses)
        
    except Exception as e:
        print(f"Error fetching recent analyses: {e}")
        return jsonify({'error': 'Failed to fetch analyses'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 