from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import google.generativeai as genai
import logging
import uvicorn
import json
import requests
from typing import List, Optional
import os
from pathlib import Path
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

BASE_DIR = Path(__file__).parent.parent / "Frontend"

logger.info(f"Looking for files in: {BASE_DIR}")

# ========== Database Setup ==========
# Create SQLite database in Backend folder
DATABASE_URL = "sqlite:///./studyplanner.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# Define Plan Model
class PlanModel(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    plan_name = Column(String)
    tasks = Column(JSON)
    time_available = Column(String)
    plan_content = Column(Text)
    timestamp = Column(String)
    progress = Column(Integer, default=0)
    checked_tasks = Column(JSON, default=list)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== Plan Models ==========
class PlanSaveRequest(BaseModel):
    user_email: str
    plan_name: str
    tasks: List[str]
    time_available: str
    plan_content: str
    timestamp: str
    progress: int = 0
    checked_tasks: List[int] = []

class PlanResponse(BaseModel):
    id: int
    user_email: str
    plan_name: str
    tasks: List[str]
    time_available: str
    plan_content: str
    timestamp: str
    progress: int
    checked_tasks: List[int]

# ========== Plan API Endpoints ==========
@app.post("/api/save-plan")
async def save_plan(request: PlanSaveRequest, db: Session = Depends(get_db)):
    """Save a study plan to database"""
    try:
        existing_plan = db.query(PlanModel).filter(
            PlanModel.user_email == request.user_email,
            PlanModel.plan_name == request.plan_name
        ).first()
        
        if existing_plan:
            existing_plan.tasks = request.tasks
            existing_plan.time_available = request.time_available
            existing_plan.plan_content = request.plan_content
            existing_plan.timestamp = request.timestamp
            existing_plan.progress = request.progress
            existing_plan.checked_tasks = request.checked_tasks
            db.commit()
            return {"message": "Plan updated successfully", "id": existing_plan.id}
        else:
            new_plan = PlanModel(
                user_email=request.user_email,
                plan_name=request.plan_name,
                tasks=request.tasks,
                time_available=request.time_available,
                plan_content=request.plan_content,
                timestamp=request.timestamp,
                progress=request.progress,
                checked_tasks=request.checked_tasks
            )
            db.add(new_plan)
            db.commit()
            db.refresh(new_plan)
            return {"message": "Plan saved successfully", "id": new_plan.id}
            
    except Exception as e:
        logger.error(f"Error saving plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get-plans/{user_email}")
async def get_plans(user_email: str, db: Session = Depends(get_db)):
    """Get all plans for a user"""
    try:
        plans = db.query(PlanModel).filter(
            PlanModel.user_email == user_email
        ).order_by(PlanModel.id.desc()).all()
        
        return [{
            "id": p.id,
            "plan_name": p.plan_name,
            "tasks": p.tasks,
            "time_available": p.time_available,
            "plan_content": p.plan_content,
            "timestamp": p.timestamp,
            "progress": p.progress,
            "checked_tasks": p.checked_tasks
        } for p in plans]
        
    except Exception as e:
        logger.error(f"Error fetching plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/delete-plan/{plan_id}")
async def delete_plan(plan_id: int, user_email: str, db: Session = Depends(get_db)):
    """Delete a plan"""
    try:
        plan = db.query(PlanModel).filter(
            PlanModel.id == plan_id,
            PlanModel.user_email == user_email
        ).first()
        
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        db.delete(plan)
        db.commit()
        return {"message": "Plan deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/update-plan-progress/{plan_id}")
async def update_plan_progress(
    plan_id: int, 
    user_email: str, 
    progress: int, 
    checked_tasks: List[int],
    db: Session = Depends(get_db)
):
    """Update plan progress"""
    try:
        plan = db.query(PlanModel).filter(
            PlanModel.id == plan_id,
            PlanModel.user_email == user_email
        ).first()
        
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        plan.progress = progress
        plan.checked_tasks = checked_tasks
        db.commit()
        return {"message": "Progress updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========== Serve Frontend Files ==========
@app.get("/")
async def serve_index():
    """Serve the landing page"""
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"error": f"index.html not found in {BASE_DIR}"}

@app.get("/index.html")  # <-- ADD THIS ROUTE
async def serve_index_html():
    """Serve the landing page"""
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"error": "index.html not found"}

@app.get("/main.html")
async def serve_main():
    """Serve the main application page"""
    main_path = BASE_DIR / "main.html"
    if main_path.exists():
        return FileResponse(main_path)
    return {"error": "main.html not found"}

@app.get("/history.html")
async def serve_history():
    """Serve the history page"""
    history_path = BASE_DIR / "history.html"
    if history_path.exists():
        return FileResponse(history_path)
    return {"error": "history.html not found"}

@app.get("/timer.html")
async def serve_timer():
    """Serve the timer page"""
    timer_path = BASE_DIR / "timer.html"
    if timer_path.exists():
        return FileResponse(timer_path)
    return {"error": "timer.html not found"}

@app.get("/resources.html")
async def serve_resources():
    """Serve the resource finder page"""
    resources_path = BASE_DIR / "resources.html"
    if resources_path.exists():
        return FileResponse(resources_path)
    return {"error": "resources.html not found"}

@app.get("/styles.css")
async def serve_styles():
    """Serve the main CSS file"""
    css_path = BASE_DIR / "styles.css"
    if css_path.exists():
        return FileResponse(css_path, media_type="text/css")
    return {"error": "styles.css not found"}

@app.get("/landing-styles.css")
async def serve_landing_styles():
    """Serve the landing page CSS"""
    css_path = BASE_DIR / "landing-styles.css"
    if css_path.exists():
        return FileResponse(css_path, media_type="text/css")
    return {"error": "landing-styles.css not found"}

@app.get("/script.js")
async def serve_script():
    """Serve the main JavaScript file"""
    js_path = BASE_DIR / "script.js"
    if js_path.exists():
        return FileResponse(js_path, media_type="application/javascript")
    return {"error": "script.js not found"}

@app.get("/timer.js")
async def serve_timer_js():
    """Serve the timer JavaScript file"""
    timer_path = BASE_DIR / "timer.js"
    if timer_path.exists():
        return FileResponse(timer_path, media_type="application/javascript")
    return {"error": "timer.js not found"}

@app.get("/landing-script.js")
async def serve_landing_script():
    """Serve the landing page JavaScript"""
    js_path = BASE_DIR / "landing-script.js"
    if js_path.exists():
        return FileResponse(js_path, media_type="application/javascript")
    return {"error": "landing-script.js not found"}

# ========== Debug Endpoint ==========
@app.get("/debug-paths")
async def debug_paths():
    """Debug endpoint to check file paths"""
    files = []
    if BASE_DIR.exists():
        files = [f.name for f in BASE_DIR.iterdir() if f.is_file()][:20]
    return {
        "base_dir": str(BASE_DIR),
        "exists": BASE_DIR.exists(),
        "index_exists": (BASE_DIR / "index.html").exists(),
        "files_found": files
    }

# ========== Resource Finder Models ==========
class ResourceRequest(BaseModel):
    topic: str
    subject: Optional[str] = None
    grade_level: Optional[str] = "college"
    resource_type: List[str] = ["text", "video", "audio"]
    difficulty: Optional[str] = "intermediate"

class ResourceItem(BaseModel):
    title: str
    type: str
    url: str
    source: str
    duration: Optional[str] = None
    description: str
    difficulty: str

class ResourceResponse(BaseModel):
    topic: str
    resources: List[ResourceItem]
    summary: str
    recommendations: str

# ========== Resource Finder Functions ==========
def generate_search_queries(topic: str, subject: str = None):
    """Generate optimized search queries using Gemini AI"""
    prompt = f"""
    Generate 5 specific search queries to find the best learning resources for:
    Topic: {topic}
    Subject: {subject or "general"}
    
    Format as a JSON array of strings.
    Make queries specific and include terms like "tutorial", "explanation", "for beginners".
    Return ONLY the JSON array, no other text.
    """
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        # Clean JSON
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        queries = json.loads(response_text)
        return queries[:5]
    except Exception as e:
        logger.error(f"Error generating queries: {e}")
        return [
            f"{topic} tutorial",
            f"{topic} explained simply",
            f"best {topic} course",
            f"{topic} for beginners",
            f"{topic} lecture"
        ]

def search_youtube(queries, max_results=3):
    """Search YouTube for educational videos"""
    resources = []
    for query in queries[:3]:
        resources.append(ResourceItem(
            title=f"{query} - YouTube Tutorial",
            type="video",
            url=f"https://youtube.com/results?search_query={query.replace(' ', '+')}",
            source="YouTube",
            duration="10-20 minutes",
            description=f"Watch video tutorials about {query}. Great for visual learners.",
            difficulty="intermediate"
        ))
    return resources

def search_educational_sites(queries):
    """Search educational websites"""
    resources = []
    sites = [
        {"name": "Khan Academy", "url": "khanacademy.org"},
        {"name": "Coursera", "url": "coursera.org"},
        {"name": "MIT OpenCourseWare", "url": "ocw.mit.edu"},
        {"name": "Wikipedia", "url": "wikipedia.org"}
    ]
    
    for query in queries[:2]:
        for site in sites:
            resources.append(ResourceItem(
                title=f"{site['name']}: {query}",
                type="text",
                url=f"https://www.{site['url']}/search?q={query.replace(' ', '+')}",
                source=site['name'],
                duration=None,
                description=f"Comprehensive learning materials for {query} from {site['name']}",
                difficulty="intermediate"
            ))
    return resources

def search_podcasts(queries):
    """Search for podcast episodes"""
    resources = []
    for query in queries[:2]:
        resources.append(ResourceItem(
            title=f"Understanding {query} - Podcast Episode",
            type="audio",
            url=f"https://podcasts.example.com/search?q={query.replace(' ', '+')}",
            source="Various Podcasts",
            duration="20-30 minutes",
            description=f"Audio explanation of {query} with real-world examples",
            difficulty="beginner"
        ))
    return resources

def generate_resource_summary(topic, resources):
    """Generate AI-powered summary and recommendations"""
    if not resources:
        return {
            "overview": f"Learning resources for {topic}",
            "study_path": "Start with foundational concepts, then move to advanced topics"
        }
    
    prompt = f"""
    Based on these resources found for {topic}:
    {[r.title for r in resources[:5]]}
    
    Generate a JSON with:
    1. "overview": A 2-3 sentence summary of what the student will learn
    2. "study_path": A recommended order to consume these resources (2-3 sentences)
    
    Return ONLY valid JSON.
    """
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return {
            "overview": f"Comprehensive resources for learning {topic}",
            "study_path": "Start with video tutorials, then read articles for depth"
        }

# ========== Resource Finder Endpoints ==========
@app.post("/resources/find", response_model=ResourceResponse)
async def find_resources(request: ResourceRequest):
    """Find learning resources based on topic and preferences"""
    try:
        logger.info(f"Finding resources for: {request.topic}")
        
        # Generate search queries
        search_queries = generate_search_queries(request.topic, request.subject)
        logger.info(f"Generated queries: {search_queries}")
        
        # Search resources
        resources = []
        if "video" in request.resource_type:
            resources.extend(search_youtube(search_queries))
        if "text" in request.resource_type:
            resources.extend(search_educational_sites(search_queries))
        if "audio" in request.resource_type:
            resources.extend(search_podcasts(search_queries))
        
        # Remove duplicates by URL
        seen_urls = set()
        unique_resources = []
        for r in resources:
            if r.url not in seen_urls:
                seen_urls.add(r.url)
                unique_resources.append(r)
        
        # Generate summary
        summary_data = generate_resource_summary(request.topic, unique_resources)
        
        return ResourceResponse(
            topic=request.topic,
            resources=unique_resources[:10],
            summary=summary_data.get("overview", f"Resources for {request.topic}"),
            recommendations=summary_data.get("study_path", "Start with foundational resources")
        )
        
    except Exception as e:
        logger.error(f"Error in find_resources: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/resources/suggestions")
async def get_quick_suggestions(topic: str):
    """Get quick AI-powered resource suggestions"""
    try:
        prompt = f"""
        Suggest 3 specific learning resources for {topic}.
        Format as JSON with fields: title, type, url, description
        """
        
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        suggestions = json.loads(response_text)
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========== Configure Gemini API ==========
GEMINI_API_KEY = "AIzaSyDcqYtGn4wudS5IN5MGM4By1jJcbmAJsZY"
genai.configure(api_key=GEMINI_API_KEY)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Study Plan Endpoints ==========
class StudyPlanRequest(BaseModel):
    tasks: list[str]
    time_available: str

def generate_study_plan(tasks, time_available):
    """Generate a study plan with difficulty-based time allocation"""
    
    # First, get difficulty classification from Gemini
    difficulty_prompt = f"""
Analyze these tasks and classify each as EASY, MEDIUM, or HARD based on typical academic difficulty.

Tasks: {tasks}

Rules for classification:
- HARD: Problem solving, coding, mathematics, machine learning, data structures, algorithms, physics, advanced topics
- MEDIUM: Theory understanding, reading concepts, standard subjects (history, biology, chemistry basics)
- EASY: Revision, memorization, light review, simple definitions

Return ONLY a JSON array in this exact format:
["EASY", "MEDIUM", "HARD", ...]
No other text.
"""
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        # Step 1: Get difficulty classification
        difficulty_response = model.generate_content(difficulty_prompt)
        difficulty_text = difficulty_response.text.strip()
        
        # Clean JSON response
        if difficulty_text.startswith("```json"):
            difficulty_text = difficulty_text[7:]
        if difficulty_text.startswith("```"):
            difficulty_text = difficulty_text[3:]
        if difficulty_text.endswith("```"):
            difficulty_text = difficulty_text[:-3]
        
        difficulties = json.loads(difficulty_text)
        
        # Ensure we have the same number of difficulties as tasks
        if len(difficulties) != len(tasks):
            # Fallback: assign based on task name heuristics
            difficulties = []
            for task in tasks:
                task_lower = task.lower()
                if any(word in task_lower for word in ['problem', 'solve', 'code', 'math', 'algorithm', 'ml', 'ai', 'physics']):
                    difficulties.append("HARD")
                elif any(word in task_lower for word in ['theory', 'concept', 'understand', 'read']):
                    difficulties.append("MEDIUM")
                else:
                    difficulties.append("EASY")
        
        # Step 2: Parse time available
        import re
        time_str = time_available.lower()
        hours_match = re.findall(r'(\d+(?:\.\d+)?)\s*(?:hour|hr|hours|hrs)', time_str)
        minutes_match = re.findall(r'(\d+(?:\.\d+)?)\s*(?:minute|min|minutes|mins)', time_str)
        
        total_minutes = 0
        if hours_match:
            total_minutes += float(hours_match[0]) * 60
        if minutes_match:
            total_minutes += float(minutes_match[0])
        
        if total_minutes == 0:
            total_minutes = 120  # Default 2 hours
        
        # Step 3: Calculate time allocation based on difficulty
        difficulty_weights = {
            "HARD": 0.45,    # 45% of time for hard tasks
            "MEDIUM": 0.35,  # 35% for medium
            "EASY": 0.20     # 20% for easy
        }
        
        # Count tasks by difficulty
        hard_count = difficulties.count("HARD")
        medium_count = difficulties.count("MEDIUM")
        easy_count = difficulties.count("EASY")
        
        # Calculate total weight
        total_weight = (hard_count * difficulty_weights["HARD"] + 
                       medium_count * difficulty_weights["MEDIUM"] + 
                       easy_count * difficulty_weights["EASY"])
        
        # Calculate minutes per task based on difficulty
        task_minutes = []
        for difficulty in difficulties:
            if difficulty == "HARD":
                minutes = (difficulty_weights["HARD"] / total_weight) * total_minutes / hard_count if hard_count > 0 else 0
            elif difficulty == "MEDIUM":
                minutes = (difficulty_weights["MEDIUM"] / total_weight) * total_minutes / medium_count if medium_count > 0 else 0
            else:  # EASY
                minutes = (difficulty_weights["EASY"] / total_weight) * total_minutes / easy_count if easy_count > 0 else 0
            
            # Round to nearest 5 minutes
            minutes = round(minutes / 5) * 5
            minutes = max(15, min(minutes, 120))  # Between 15 min and 2 hours
            task_minutes.append(int(minutes))
        
        # Step 4: Generate the schedule
        plan = []
        current_time = 9  # Start at 9:00 AM
        current_minutes = 0
        
        for i, (task, difficulty, duration) in enumerate(zip(tasks, difficulties, task_minutes)):
            # Calculate start time
            start_hour = current_time + (current_minutes // 60)
            start_min = current_minutes % 60
            start_ampm = "AM" if start_hour < 12 else "PM"
            start_hour_display = start_hour if start_hour <= 12 else start_hour - 12
            if start_hour_display == 0:
                start_hour_display = 12
            
            # Calculate end time
            end_minutes = current_minutes + duration
            end_hour = current_time + (end_minutes // 60)
            end_min = end_minutes % 60
            end_ampm = "AM" if end_hour < 12 else "PM"
            end_hour_display = end_hour if end_hour <= 12 else end_hour - 12
            if end_hour_display == 0:
                end_hour_display = 12
            
            # Format time slot
            time_slot = f"{start_hour_display:02d}:{start_min:02d} {start_ampm} - {end_hour_display:02d}:{end_min:02d} {end_ampm}"
            
            # Determine break based on difficulty
            if difficulty == "HARD":
                break_minutes = 15
            elif difficulty == "MEDIUM":
                break_minutes = 10
            else:
                break_minutes = 5
            
            if i < len(tasks) - 1:
                break_text = f"{break_minutes} min break"
            else:
                break_text = "Done"
            
            plan.append(f"{time_slot} | {task} | {duration} min | {break_text}")
            
            # Update current time
            current_minutes += duration + break_minutes
            current_time += current_minutes // 60
            current_minutes = current_minutes % 60
        
        return "\n".join(plan)
        
    except Exception as e:
        logger.error(f"Error in generate_study_plan: {e}")
        return create_fallback_plan(tasks, time_available)
    
def create_fallback_plan(tasks, time_available):
    """Create simple fallback plan with difficulty-based allocation"""
    import re
    
    # Parse time available
    time_str = time_available.lower()
    hours = re.findall(r'(\d+(?:\.\d+)?)\s*(?:hour|hr|hours|hrs)', time_str)
    minutes = re.findall(r'(\d+(?:\.\d+)?)\s*(?:minute|min|minutes|mins)', time_str)
    
    total_minutes = 0
    if hours:
        total_minutes += float(hours[0]) * 60
    if minutes:
        total_minutes += float(minutes[0])
    
    if total_minutes == 0:
        total_minutes = 120  # Default 2 hours
    
    # Simple heuristic for difficulty based on task name
    difficulties = []
    for task in tasks:
        task_lower = task.lower()
        if any(word in task_lower for word in ['problem', 'solve', 'code', 'math', 'algorithm', 'ml', 'ai', 'physics', 'calculus', 'programming']):
            difficulties.append("HARD")
        elif any(word in task_lower for word in ['theory', 'concept', 'understand', 'read', 'history', 'biology', 'chemistry']):
            difficulties.append("MEDIUM")
        else:
            difficulties.append("EASY")
    
    # Weighted allocation
    hard_count = difficulties.count("HARD")
    medium_count = difficulties.count("MEDIUM")
    easy_count = difficulties.count("EASY")
    
    hard_minutes = (0.45 * total_minutes) / hard_count if hard_count > 0 else 0
    medium_minutes = (0.35 * total_minutes) / medium_count if medium_count > 0 else 0
    easy_minutes = (0.20 * total_minutes) / easy_count if easy_count > 0 else 0
    
    task_minutes = []
    for diff in difficulties:
        if diff == "HARD":
            mins = int(round(hard_minutes / 5) * 5)
        elif diff == "MEDIUM":
            mins = int(round(medium_minutes / 5) * 5)
        else:
            mins = int(round(easy_minutes / 5) * 5)
        task_minutes.append(max(15, min(mins, 120)))
    
    # Generate schedule
    plan = []
    current_time = 9
    current_minutes = 0
    
    for i, (task, duration) in enumerate(zip(tasks, task_minutes)):
        start_hour = current_time + (current_minutes // 60)
        start_min = current_minutes % 60
        start_ampm = "AM" if start_hour < 12 else "PM"
        start_hour_display = start_hour if start_hour <= 12 else start_hour - 12
        if start_hour_display == 0:
            start_hour_display = 12
        
        end_minutes = current_minutes + duration
        end_hour = current_time + (end_minutes // 60)
        end_min = end_minutes % 60
        end_ampm = "AM" if end_hour < 12 else "PM"
        end_hour_display = end_hour if end_hour <= 12 else end_hour - 12
        if end_hour_display == 0:
            end_hour_display = 12
        
        time_slot = f"{start_hour_display:02d}:{start_min:02d} {start_ampm} - {end_hour_display:02d}:{end_min:02d} {end_ampm}"
        
        if i < len(tasks) - 1:
            break_minutes = 15 if difficulties[i] == "HARD" else (10 if difficulties[i] == "MEDIUM" else 5)
            break_text = f"{break_minutes} min break"
        else:
            break_text = "Done"
        
        plan.append(f"{time_slot} | {task} | {duration} min | {break_text}")
        
        current_minutes += duration + (break_minutes if i < len(tasks) - 1 else 0)
        current_time += current_minutes // 60
        current_minutes = current_minutes % 60
    
    return "\n".join(plan)

@app.post("/generate-plan/")
async def get_study_plan(request: StudyPlanRequest):
    try:
        plan = generate_study_plan(request.tasks, request.time_available)
        return {"study_plan": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running", "endpoints": ["/generate-plan", "/resources/find", "/resources/suggestions"]}

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 50)
    logger.info("Study Planner API Started")
    logger.info(f"Looking for files in: {BASE_DIR}")
    logger.info("=" * 50)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)