from fastapi import FastAPI, APIRouter
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import markdown


ROOT_DIR = Path(__file__).parent
DOCS_DIR = ROOT_DIR.parent / 'docs'
FIRMWARE_DIR = ROOT_DIR.parent / 'firmware'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Visual Homing Documentation API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class DocFile(BaseModel):
    name: str
    path: str
    title: str

class DocContent(BaseModel):
    name: str
    title: str
    content: str
    html: Optional[str] = None


# Documentation endpoints
@api_router.get("/")
async def root():
    return {"message": "Visual Homing API", "version": "1.0"}

@api_router.get("/docs/list")
async def list_docs():
    """List all documentation files"""
    docs = []
    if DOCS_DIR.exists():
        for f in sorted(DOCS_DIR.glob("*.md")):
            # Extract title from first line
            with open(f, 'r', encoding='utf-8') as file:
                first_line = file.readline().strip()
                title = first_line.replace('#', '').strip() if first_line.startswith('#') else f.stem
            docs.append(DocFile(name=f.name, path=str(f), title=title))
    return docs

@api_router.get("/docs/{filename}")
async def get_doc(filename: str):
    """Get documentation file content"""
    filepath = DOCS_DIR / filename
    if not filepath.exists():
        return {"error": "Document not found"}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Convert markdown to HTML
    html = markdown.markdown(content, extensions=['tables', 'fenced_code'])
    
    # Extract title
    first_line = content.split('\n')[0]
    title = first_line.replace('#', '').strip() if first_line.startswith('#') else filename
    
    return DocContent(name=filename, title=title, content=content, html=html)

@api_router.get("/firmware/structure")
async def get_firmware_structure():
    """Get firmware directory structure"""
    structure = {"python": [], "cpp": [], "scripts": [], "config": []}
    
    if FIRMWARE_DIR.exists():
        # Python files
        for f in (FIRMWARE_DIR / 'python').rglob("*.py"):
            structure["python"].append(str(f.relative_to(FIRMWARE_DIR)))
        
        # C++ files
        for ext in ['*.cpp', '*.hpp', '*.h']:
            for f in (FIRMWARE_DIR / 'cpp').rglob(ext):
                structure["cpp"].append(str(f.relative_to(FIRMWARE_DIR)))
        
        # Scripts
        for f in (FIRMWARE_DIR / 'scripts').glob("*.sh"):
            structure["scripts"].append(str(f.relative_to(FIRMWARE_DIR)))
        
        # Config files
        for f in (FIRMWARE_DIR / 'config').glob("*"):
            structure["config"].append(str(f.relative_to(FIRMWARE_DIR)))
    
    return structure

@api_router.get("/firmware/file/{filepath:path}")
async def get_firmware_file(filepath: str):
    """Get firmware file content"""
    full_path = FIRMWARE_DIR / filepath
    if not full_path.exists():
        return {"error": "File not found"}
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    return {"path": filepath, "content": content}


# Status endpoints (original)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()