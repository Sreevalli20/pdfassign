from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.schemas.assessment import ProcessRequest, AssessmentResult, ProcessingStatus
from app.services.demo_service import get_demo_assessment
import uuid
import os
from typing import Dict
import asyncio

router = APIRouter()

# In-memory storage for assessments (as per requirements)
assessments: Dict[str, AssessmentResult] = {}
processing_status: Dict[str, ProcessingStatus] = {}


@router.post("/process", response_model=AssessmentResult)
async def process_assessment(
    background_tasks: BackgroundTasks,
    request: ProcessRequest,
    question_paper: UploadFile = File(...),
    answer_sheet: UploadFile = File(...)
):
    """Process question paper and answer sheet to extract and map answers."""
    
    assessment_id = str(uuid.uuid4())
    
    # Validate file types
    valid_extensions = {'.pdf', '.png', '.jpg', '.jpeg'}
    
    qp_ext = os.path.splitext(question_paper.filename)[1].lower()
    as_ext = os.path.splitext(answer_sheet.filename)[1].lower()
    
    if qp_ext not in valid_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid question paper format. Supported: {', '.join(valid_extensions)}"
        )
    
    if as_ext not in valid_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid answer sheet format. Supported: {', '.join(valid_extensions)}"
        )
    
    # Save uploaded files
    upload_dir = "temp/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    qp_path = os.path.join(upload_dir, f"{assessment_id}_qp{qp_ext}")
    as_path = os.path.join(upload_dir, f"{assessment_id}_as{as_ext}")
    
    with open(qp_path, "wb") as f:
        f.write(await question_paper.read())
    
    with open(as_path, "wb") as f:
        f.write(await answer_sheet.read())
    
    # Initialize status
    processing_status[assessment_id] = ProcessingStatus.UPLOADING
    
    # Process in background
    if request.demo_mode:
        # Use demo data
        result = get_demo_assessment()
        result.id = assessment_id
        assessments[assessment_id] = result
        processing_status[assessment_id] = ProcessingStatus.COMPLETED
    else:
        # Real processing would go here
        background_tasks.add_task(
            process_assessment_background,
            assessment_id,
            qp_path,
            as_path
        )
    
    return assessments[assessment_id]


async def process_assessment_background(
    assessment_id: str,
    question_paper_path: str,
    answer_sheet_path: str
):
    """Background task for real AI processing."""
    try:
        processing_status[assessment_id] = ProcessingStatus.READING_QUESTION_PAPER
        await asyncio.sleep(0.5)
        
        processing_status[assessment_id] = ProcessingStatus.EXTRACTING_QUESTIONS
        await asyncio.sleep(1.0)
        
        processing_status[assessment_id] = ProcessingStatus.READING_ANSWERS
        await asyncio.sleep(0.5)
        
        processing_status[assessment_id] = ProcessingStatus.DETECTING_REGIONS
        await asyncio.sleep(1.0)
        
        processing_status[assessment_id] = ProcessingStatus.MAPPING_ANSWERS
        await asyncio.sleep(1.0)
        
        processing_status[assessment_id] = ProcessingStatus.PREPARING_ASSESSMENT
        await asyncio.sleep(0.5)
        
        # For now, use demo data as fallback
        result = get_demo_assessment()
        result.id = assessment_id
        assessments[assessment_id] = result
        processing_status[assessment_id] = ProcessingStatus.COMPLETED
        
    except Exception as e:
        processing_status[assessment_id] = ProcessingStatus.FAILED
        # Would create error result here


@router.get("/{assessment_id}", response_model=AssessmentResult)
async def get_assessment(assessment_id: str):
    """Get assessment results by ID."""
    if assessment_id not in assessments:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return assessments[assessment_id]


@router.get("/{assessment_id}/status")
async def get_assessment_status(assessment_id: str):
    """Get processing status for an assessment."""
    if assessment_id not in processing_status:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return {"assessment_id": assessment_id, "status": processing_status[assessment_id]}


@router.get("/{assessment_id}/pages/{page_number}")
async def get_answer_sheet_page(assessment_id: str, page_number: int):
    """Get a specific page image from the answer sheet."""
    # For demo mode, return a placeholder
    # In production, this would return the actual page image
    return {
        "assessment_id": assessment_id,
        "page": page_number,
        "image_url": f"/api/assessment/{assessment_id}/pages/{page_number}/image"
    }
