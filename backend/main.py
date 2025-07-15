import base64
import os
from groq import Groq
import argparse
from dotenv import load_dotenv
import subprocess
import platform

# Load environment variables
load_dotenv()

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
                            "text": """Analyze this fruit image and provide the following response:

**Fruit Identification**: What type of fruit is this? (just the name)

**Nutritional Information**: Brief nutritional highlights (one short sentence)

**Should Buy**: Yes/No (with 1 sentence reason)

Keep it very brief for audio output."""
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
            max_tokens=150,
        )
        
        return chat_completion.choices[0].message.content
        
    except Exception as e:
        print(f"Error with Groq API: {e}")
        return None

def extract_produce_name(analysis_result):
    """Extract the produce name from the analysis result"""
    lines = analysis_result.split('\n')
    
    for line in lines:
        if "**Fruit Identification**:" in line:
            produce_name = line.split(":", 1)[1].strip()
            return produce_name.lower()
    
    return "fruit"  # fallback

def extract_nutrition_info(analysis_result):
    """Extract nutritional information from the analysis result"""
    lines = analysis_result.split('\n')
    
    for line in lines:
        if "**Nutritional Information**:" in line:
            idx = lines.index(line)
            if idx + 1 < len(lines):
                nutrition_info = lines[idx + 1].strip()
                # Keep it short - just first sentence
                nutrition_info = nutrition_info.split('.')[0]
                return nutrition_info
    
    return "a good source of vitamins"  # fallback

def extract_should_buy(analysis_result):
    """Extract the should buy recommendation"""
    lines = analysis_result.split('\n')
    
    for line in lines:
        if "**Should Buy**:" in line:
            should_buy = line.split(":", 1)[1].strip()
            return should_buy
    
    return "Decision unclear"

def play_audio_file(file_path):
    """Play audio file using system default player"""
    try:
        system = platform.system().lower()
        
        if system == "darwin":  # macOS
            subprocess.run(["afplay", file_path], check=True)
        else:
            print(f"💡 Please play manually: open {file_path}")
            return False
        
        return True
        
    except Exception as e:
        print(f"Could not auto-play audio: {e}")
        print(f"💡 Please play manually: open {file_path}")
        return False

def create_natural_audio_script(produce_name, nutrition_info, should_buy, groq_api_key):
    """Use Groq to create a natural, conversational audio script"""
    
    client = Groq(api_key=groq_api_key)
    
    try:
        # Use Groq to restructure the information into a natural sentence
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": f"""Convert this produce analysis into a single, natural-sounding sentence for audio narration:

Fruit: {produce_name}
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
        return f"This looks like {produce_name}. {nutrition_info}. {should_buy}"

def create_audio_summary(produce_name, nutrition_info, should_buy, groq_api_key):
    """Generate audio summary using Groq PlayAI TTS"""
    
    # Create natural-sounding script using another API call
    print("🤖 Creating natural audio script...")
    summary_text = create_natural_audio_script(produce_name, nutrition_info, should_buy, groq_api_key)
    
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
        
        # Play the audio file
        print("🔊 Playing audio...")
        if play_audio_file(speech_file_path):
            print("✅ Audio playback completed")
        
        return speech_file_path
        
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        if "model_terms_required" in str(e):
            print("   Please accept PlayAI TTS terms at: https://console.groq.com/playground?model=playai-tts")
        return None

def main():
    parser = argparse.ArgumentParser(description='Analyze produce from image with audio summary')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('--audio', action='store_true', help='Generate audio summary')
    
    args = parser.parse_args()
    
    # Get API key
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        print("❌ Error: Please set GROQ_API_KEY in your .env file")
        return
    
    # Check if image exists
    if not os.path.exists(args.image_path):
        print(f"❌ Error: Image file '{args.image_path}' not found")
        return
    
    print(f"🔍 Analyzing image: {args.image_path}")
    print("Please wait...")
    
    # Analyze the image
    result = analyze_nutrition_with_groq(args.image_path, api_key)
    
    if result:
        print("\n" + "="*50)
        print("📊 ANALYSIS RESULTS")
        print("="*50)
        print(result)
        
        # Extract key information
        produce_name = extract_produce_name(result)
        nutrition_info = extract_nutrition_info(result)
        should_buy = extract_should_buy(result)
        
        print(f"\n📋 SUMMARY:")
        print(f"   Item: {produce_name.title()}")
        print(f"   Nutrition: {nutrition_info}")
        print(f"   Recommendation: {should_buy}")
        
        # Generate audio summary if requested
        if args.audio:
            create_audio_summary(produce_name, nutrition_info, should_buy, api_key)
    else:
        print("❌ Failed to analyze the image")

if __name__ == "__main__":
    main()
