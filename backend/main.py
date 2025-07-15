import base64
import os
from groq import Groq
import argparse
from dotenv import load_dotenv

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
                            "text": """Analyze this fruit image and provide:

**Fruit Identification**: What type of fruit is this?

**Freshness Assessment**: 
- Freshness level (1-10 scale)
- Current state: Fresh/Ripe/Overripe/Spoiled
- Visual indicators observed (color, texture, blemishes)

**Quality Indicators**:
- Should buy: Yes/No with reasoning
- Best use: Eat now/Wait a few days/Use for cooking/Avoid
- Estimated shelf life: X days at room temperature

**Nutritional Highlights**:
- Key vitamins and minerals
- Caloric content per serving
- Notable health benefits

**Purchase Recommendation**:
- Buy/Skip with clear reasoning
- Price point consideration (if this quality is worth the typical price)
- Best storage method after purchase

Keep response concise but informative for grocery shopping decisions."""
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

def main():
    # Set up command line arguments
    parser = argparse.ArgumentParser(description='Analyze food/produce nutrition from image')
    parser.add_argument('image_path', help='Path to the image file')
    
    args = parser.parse_args()
    
    # Get API key from environment variable
    api_key = os.getenv('GROQ_API_KEY')
    
    if not api_key:
        print("Error: Please set GROQ_API_KEY in your .env file")
        return
    
    # Check if image file exists
    if not os.path.exists(args.image_path):
        print(f"Error: Image file '{args.image_path}' not found")
        return
    
    print(f"Analyzing image: {args.image_path}")
    print("Please wait...")
    
    # Analyze the image
    result = analyze_nutrition_with_groq(args.image_path, api_key)
    
    if result:
        print("\n" + "="*50)
        print("NUTRITIONAL ANALYSIS RESULTS")
        print("="*50)
        print(result)
    else:
        print("Failed to analyze the image")

if __name__ == "__main__":
    main()
