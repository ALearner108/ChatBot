from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
import base64
import re
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from huggingface_hub import InferenceClient

# Initialize FastAPI app
app = FastAPI()

# MongoDB Connection
MONGO_URI = "mongodb+srv://dipakacharya442:y11qAZe4TatlCCba@chatbot.oeaoj.mongodb.net/?retryWrites=true&w=majority&appName=ChatBot"
DB_NAME = "chatbot"

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
prompts_collection = db["prompts"]
media_collection = db["media"]

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded Gemini API key
API_KEY = "AIzaSyBJWK1kMs4SDGpV0NDk7UQs-k5Ggzf2DQM"

# Initialize the Gemini model
def initialize_genai():
    genai.configure(api_key=API_KEY)
    return genai.GenerativeModel("gemini-2.0-flash")

# Format response text (for bold text and line breaks)
def format_response_text(response_text):
    if not response_text:
        return "No response received."

    formatted_text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", response_text)
    formatted_text = formatted_text.replace("\n", "<br>")
    return formatted_text

# Async function to generate content
async def generate_content(model, prompt, media_data=None):
    try:
        if media_data:
            response = model.generate_content([prompt, media_data])
        else:
            response = model.generate_content(prompt)

        return response.text if response else "No response received."
    except Exception as e:
        return f"Error generating response: {str(e)}"

# Request model for text-based prompts
class PromptRequest(BaseModel):
    api_key: str
    prompt: str

@app.post("/generate")
async def generate(request: PromptRequest):
    try:
        model = initialize_genai()
        print("Generating response for:", request.prompt)
        print("Using API Key:", API_KEY[:10] + "********")  # Partial key for security

        response_text = await generate_content(model, request.prompt)
        formatted_response = format_response_text(response_text)
        
        # Store in MongoDB
        await prompts_collection.insert_one({
            "prompt": request.prompt,
            "response": formatted_response
        })

        return {"response": formatted_response}
    except Exception as e:
        print("Error:", e)  
        raise HTTPException(status_code=500, detail=str(e))

HF_API_KEY = "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"
hf_client = InferenceClient(provider="together", api_key=HF_API_KEY)

class HFRequest(BaseModel):
    message: str

@app.post("/chat-huggingface")
async def chat_huggingface(request: HFRequest):
    try:
        print(f"Received message: {request.message}")

        messages = [{"role": "user", "content": request.message}]

        completion = hf_client.chat.completions.create(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=messages,
            max_tokens=500,
        )

        response_text = completion.choices[0].message.content
        return {"response": response_text}
    except Exception as e:
        print(f"Error communicating with Hugging Face API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error communicating with Hugging Face API: {str(e)}")
    
@app.post("/analyze-image-huggingface")
async def analyze_image_huggingface(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        base64_image = base64.b64encode(image_data).decode("utf-8")

        messages = [{"role": "user", "content": "Analyze this image", "image": base64_image}]
        
        completion = hf_client.chat.completions.create(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=messages,
            max_tokens=500,
        )

        response_text = completion.choices[0].message.content
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.post("/analyze-video-huggingface")
async def analyze_video_huggingface(file: UploadFile = File(...)):
    try:
        video_data = await file.read()
        base64_video = base64.b64encode(video_data).decode("utf-8")

        messages = [{"role": "user", "content": "Analyze this video actions in 200 words", "video": base64_video}]
        
        completion = hf_client.chat.completions.create(
            model="Qwen/Qwen2.5-7B-Instruct",
            messages=messages,
            max_tokens=500,
        )

        response_text = completion.choices[0].message.content
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing video: {str(e)}")


@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        model = initialize_genai()
        image_data = await file.read()

        # Convert image to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        image_input = {
            "mime_type": file.content_type,
            "data": base64_image
        }

        response_text = await generate_content(model, "Analyze this image", image_input)
        formatted_response = format_response_text(response_text)
        
        await media_collection.insert_one({
            "file_name": file.filename,
            "mime_type": file.content_type,
            "data": base64_image,
            "analysis": formatted_response
        })

        return {"response": formatted_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    try:
        model = initialize_genai()
        video_data = await file.read()

        # Convert video to base64
        base64_video = base64.b64encode(video_data).decode('utf-8')

        video_input = {
            "mime_type": file.content_type,
            "data": base64_video
        }

        response_text = await generate_content(model, "Analyze this video", video_input)
        formatted_response = format_response_text(response_text)
        
        await media_collection.insert_one({
            "file_name": file.filename,
            "mime_type": file.content_type,
            "data": base64_video,
            "analysis": formatted_response
        })

        return {"response": formatted_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper function to convert MongoDB data to JSON serializable format
def serialize_objectid(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Type {obj} not serializable")

@app.get("/prompts")
async def get_prompts():
    prompts = await prompts_collection.find().to_list(100)
    
    # Convert ObjectId to string before returning the response
    for prompt in prompts:
        prompt["_id"] = serialize_objectid(prompt["_id"])
    
    return {"prompts": prompts}

@app.get("/prompts/{prompt_id}")
async def get_prompt(prompt_id: str):
    try:
        # Convert the string prompt_id back to ObjectId
        prompt_obj_id = ObjectId(prompt_id)
        
        # Query the prompt by its ObjectId
        prompt = await prompts_collection.find_one({"_id": prompt_obj_id})
        
        # If the prompt is not found, raise an HTTPException
        if prompt is None:
            raise HTTPException(status_code=404, detail="Prompt not found")
        
        # Convert ObjectId to string before returning the response
        prompt["_id"] = str(prompt["_id"])
        
        return {"prompt": prompt}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid prompt ID: {e}")

@app.get("/media")
async def get_media():
    media = await media_collection.find().to_list(100)
    
    # Convert ObjectId to string before returning the response
    for item in media:
        item["_id"] = serialize_objectid(item["_id"])
    
    return {"media": media}

# Test MongoDB Connection
@app.get("/test-mongo")
async def test_mongo():
    try:
        result = await db.list_collection_names()
        return {"status": "Connected", "collections": result}
    except Exception as e:
        return {"status": "Failed", "error": str(e)}

# Run FastAPI application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
