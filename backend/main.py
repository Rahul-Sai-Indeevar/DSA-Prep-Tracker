from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# 1. LOAD ENVIRONMENT VARIABLES
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. DATABASE SETUP (SQLAlchemy)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 3. SQL DATABASE MODEL (How it saves in Postgres)
class DBProblem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    timeOfDay = Column(String)
    category = Column(String)
    platform = Column(String)
    name = Column(String)
    difficulty = Column(String)
    tags = Column(JSON) # Postgres natively supports JSON/Arrays!
    time = Column(String)
    status = Column(String)
    statusVal = Column(String)
    link = Column(String)
    initialIdea = Column(String)
    missedPoints = Column(String)
    trickUsed = Column(String)

# Create the table in the database
Base.metadata.create_all(bind=engine)

# 4. PYDANTIC MODELS (Data Validation for API)
class ProblemBase(BaseModel):
    date: str
    timeOfDay: Optional[str] = ""
    category: Optional[str] = "DSA"
    platform: str
    name: str
    difficulty: str
    tags: List[str]
    time: str
    status: str
    statusVal: str
    link: Optional[str] = ""
    initialIdea: Optional[str] = ""
    missedPoints: Optional[str] = ""
    trickUsed: Optional[str] = ""

class ProblemCreate(ProblemBase):
    pass

class ProblemResponse(ProblemBase):
    id: int
    class Config:
        from_attributes = True

# 5. FASTAPI APP INITIALIZATION
app = FastAPI(title="DSA Tracker API", version="1.0")

# Enable CORS so your HTML frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 6. API ENDPOINTS
# ==========================================

@app.get("/api/problems", response_model=List[ProblemResponse])
def get_problems(db: Session = Depends(get_db)):
    """Fetch all logged problems."""
    return db.query(DBProblem).order_by(DBProblem.id.desc()).all()


@app.post("/api/problems", response_model=ProblemResponse)
def create_problem(problem: ProblemCreate, db: Session = Depends(get_db)):
    """Log a new problem."""
    db_prob = DBProblem(**problem.model_dump())
    db.add(db_prob)
    db.commit()
    db.refresh(db_prob)
    return db_prob


@app.put("/api/problems/{problem_id}", response_model=ProblemResponse)
def update_problem(problem_id: int, problem: ProblemCreate, db: Session = Depends(get_db)):
    """Update an existing problem."""
    db_prob = db.query(DBProblem).filter(DBProblem.id == problem_id).first()
    if not db_prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    for key, value in problem.model_dump().items():
        setattr(db_prob, key, value)
        
    db.commit()
    db.refresh(db_prob)
    return db_prob

# Add this right below your existing PUT route

class AIRequest(BaseModel):
    prompt: str

@app.post("/api/ai-analyze")
def analyze_weaknesses(request: AIRequest):
    """Analyze weak points using AI (Mocked for now, plug in OpenAI/Gemini later)"""
    
    # In the future, you would send 'request.prompt' to OpenAI/Gemini here.
    
    mock_html_response = """
        <h4 style="color: #ef4444;">📉 Weakness Analysis (From Python API!)</h4>
        <ul>
            <li>You seem to struggle with <strong>Dynamic Programming</strong> edge cases.</li>
            <li>In <strong>SQL</strong>, you often miss handling NULL values in LEFT JOINS.</li>
        </ul>
        <br>
        <h4 style="color: #10b981;">🚀 Your Custom Cheat Sheet</h4>
        <ul>
            <li><strong>Two Pointers:</strong> When array is sorted, always consider pointers at index 0 and length-1.</li>
            <li><strong>Pandas:</strong> Use <code>df.fillna()</code> before applying aggregations.</li>
        </ul>
        <p style="color: var(--primary); font-weight: bold; margin-top: 15px;">Keep up the great work!</p>
    """
    return {"reply": mock_html_response}