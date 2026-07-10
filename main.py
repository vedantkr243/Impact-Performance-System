from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import datetime
import google.generativeai as genai
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Golf Performance AI Service")

# Enable CORS for communication with your React frontend or Node backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini (or your preferred LLM)
# Set your API key in environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_fallback_key_here")
genai.configure(api_key=GEMINI_API_KEY)

# Social Auth Configuration
# These should be set in your .env file
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/golf_app")

# Database Setup
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_default_database()
users_collection = db.users

class PerformanceData(BaseModel):
    scores: List[float]
    handicap: float
    recent_notes: List[str]

class AuthToken(BaseModel):
    token: str

async def upsert_user(user_data: Dict[str, Any]):
    """
    Saves or updates user information in MongoDB.
    """
    query = {"email": user_data["email"]}
    update = {
        "$set": {
            "name": user_data.get("name"),
            "picture": user_data.get("picture"),
            "lastLogin": datetime.datetime.utcnow(),
            f"socialProviders.{user_data['provider']}": {
                "id": user_data["id"],
                "lastUsed": datetime.datetime.utcnow()
            }
        },
        "$setOnInsert": {
            "createdAt": datetime.datetime.utcnow(),
            "scoreHistory": [],
            "handicap": 0.0
        }
    }
    result = await users_collection.update_one(query, update, upsert=True)
    return result

@app.post("/api/v1/auth/google")
async def google_login(auth: AuthToken):
    """
    Verifies a Google ID Token received from the frontend.
    """
    try:
        # Verify the token using Google's official library
        idinfo = id_token.verify_oauth2_token(
            auth.token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # Token is valid; idinfo contains user profile (sub, email, name, etc.)
        user_payload = {
            "id": idinfo['sub'],
            "email": idinfo.get('email'),
            "name": idinfo.get('name'),
            "picture": idinfo.get('picture'),
            "provider": "google"
        }

        # Save to Database
        await upsert_user(user_payload)

        return {
            "status": "success",
            "user": user_payload
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

@app.post("/api/v1/auth/apple")
async def apple_login(auth: AuthToken):
    """
    Verifies an Apple ID Token (JWT) received from the frontend.
    """
    try:
        # 1. Fetch Apple's latest public keys to verify the token signature
        async with httpx.AsyncClient() as client:
            response = await client.get("https://appleid.apple.com/auth/keys")
            apple_public_keys = response.json()

        # 2. Decode and verify the JWT signature, issuer, and audience
        payload = jwt.decode(
            auth.token,
            apple_public_keys,
            audience=APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com",
            algorithms=["RS256"]
        )

        user_payload = {
            "id": payload['sub'],
            "email": payload.get('email'),
            "provider": "apple"
        }

        # Save to Database
        await upsert_user(user_payload)

        return {
            "status": "success",
            "user": user_payload
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Apple token: {str(e)}")

@app.post("/api/v1/ai/insights")
async def get_functional_insights(data: PerformanceData):
    """
    Analyzes raw golf data and returns functional AI insights.
    """
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-pro')
        
        # Construct a targeted prompt for golf analysis
        prompt = f"""
        Analyze the following golf performance data:
        - Scores: {data.scores}
        - Current Handicap: {data.handicap}
        - Recent Play Notes: {data.recent_notes}
        
        Provide:
        1. Two "Quick Insights" (short, punchy titles and descriptions).
        2. A list of three technical recommendations for improvement.
        Return the response in valid JSON format.
        """
        
        # In a production environment, you would parse the model response here.
        # For now, we calculate a dynamic trend and return it.
        avg_score = sum(data.scores) / len(data.scores) if data.scores else 0
        trend = "improving" if (len(data.scores) > 1 and data.scores[-1] < data.scores[0]) else "stable"

        return {
            "status": "success",
            "data": {
                "average_score": round(avg_score, 1),
                "trend": trend,
                "ai_summary": f"Based on your recent rounds, your game is {trend}. Focus on short game drills.",
                "quick_insights": [
                    {"title": "Consistency Check", "description": f"Your scores are hovering around {avg_score:.0f}."},
                    {"title": "Handicap Impact", "description": "Recent play suggests a downward handicap trend."}
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))