import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI, APIStatusError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Initialize OpenAI Client for OpenRouter ---
try:
    client = OpenAI(
        base_url=os.getenv("OPENROUTER_BASE_URL"),
        api_key=os.getenv("OPENROUTER_API_KEY"),
        default_headers={
            "HTTP-Referer": "https://localhost/",
            "X-Title": "Smart Task Planner",
        }
    )
    LLM_MODEL = os.getenv("OPENROUTER_MODEL")
    print(f"LLM Client configured for model: {LLM_MODEL}")
except Exception as e:
    print(f"Error configuring LLM Client: {e}")
    client = None
    
# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app)

@app.route('/plan', methods=['POST'])
def create_plan():
    """API endpoint to generate a task plan from a user's goal."""
    if not client or not LLM_MODEL:
        return jsonify({"error": "LLM client not configured. Check .env variables."}), 500

    data = request.get_json()
    if not data or 'goal' not in data:
        return jsonify({"error": "Goal not provided in request."}), 400

    goal = data['goal']
    
    prompt = f"""
    Break down the goal "{goal}" into actionable tasks.
    Provide the output as a clean JSON object with a single key "tasks".
    Each task object must have: "id", "task_name", "description", "dependencies", and "timeline_days".
    Your response must be only the JSON object, with no extra text or markdown.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful project planning assistant that only responds with JSON."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )
        
        response_content = chat_completion.choices[0].message.content
        plan = json.loads(response_content)
        return jsonify(plan)

    except APIStatusError as e:
        print("--- ERROR FROM OPENROUTER API ---")
        print(f"Status code: {e.status_code}")
        print(f"Response: {e.response.text}")
        print("--- END OF ERROR ---")
        return jsonify({"error": f"Error from AI service: {e.response.text}"}), 500
    except Exception as e:
        print(f"--- UNEXPECTED GENERIC ERROR ---")
        print(f"Error type: {type(e).__name__}")
        print(f"Error details: {e}")
        print("--- END OF ERROR ---")
        return jsonify({"error": f"An unexpected server error occurred."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)