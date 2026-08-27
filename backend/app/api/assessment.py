from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.schemas.assessment import AssessmentResult, ProcessingStatus
from app.services.pdf_processor import PDFProcessor
from app.services.answer_processor import AnswerProcessor
from app.services.answer_mapper import AnswerMapper
import uuid
import os
import io
from typing import Dict
import asyncio

router = APIRouter()

# In-memory storage for assessments (as per requirements)
assessments: Dict[str, AssessmentResult] = {}
processing_status: Dict[str, ProcessingStatus] = {}
uploaded_files: Dict[str, Dict[str, str]] = {}  # Store file paths by assessment_id


@router.post("/process", response_model=AssessmentResult)
async def process_assessment(
    background_tasks: BackgroundTasks,
    question_paper: UploadFile = File(...),
    answer_sheet: UploadFile = File(...),
    demo_mode: bool = Form(False)
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
    
    # Store file paths for later retrieval
    uploaded_files[assessment_id] = {
        "question_paper": qp_path,
        "answer_sheet": as_path
    }
    
    # Initialize status
    processing_status[assessment_id] = ProcessingStatus.UPLOADING
    
    # Process in background
    background_tasks.add_task(
        process_assessment_background,
        assessment_id,
        qp_path,
        as_path
    )
    
    # Return initial result (will be updated by background task)
    initial_result = AssessmentResult(
        id=assessment_id,
        status=ProcessingStatus.UPLOADING,
        questions=[],
        unmatched_answers=[],
        total_pages=0
    )
    assessments[assessment_id] = initial_result
    
    return initial_result


async def process_assessment_background(
    assessment_id: str,
    question_paper_path: str,
    answer_sheet_path: str
):
    """Background task for real AI processing."""
    try:
        processing_status[assessment_id] = ProcessingStatus.READING_QUESTION_PAPER
        
        # Read files
        with open(question_paper_path, "rb") as f:
            qp_bytes = f.read()
        with open(answer_sheet_path, "rb") as f:
            as_bytes = f.read()
        
        processing_status[assessment_id] = ProcessingStatus.EXTRACTING_QUESTIONS
        
        # Extract questions
        pdf_processor = PDFProcessor()
        questions = pdf_processor.extract_questions_from_pdf(qp_bytes)
        
        processing_status[assessment_id] = ProcessingStatus.READING_ANSWERS
        
        # Extract answers
        answer_processor = AnswerProcessor()
        answers = answer_processor.extract_answers(as_bytes)
        
        processing_status[assessment_id] = ProcessingStatus.DETECTING_REGIONS
        await asyncio.sleep(0.1)  # Regions already detected in answer extraction
        
        processing_status[assessment_id] = ProcessingStatus.MAPPING_ANSWERS
        
        # Map answers to questions
        answer_mapper = AnswerMapper()
        questions_with_status, unmatched_answers = answer_mapper.map_answers_to_questions(questions, answers)
        
        processing_status[assessment_id] = ProcessingStatus.PREPARING_ASSESSMENT
        
        # Create result
        # Get actual page count from answer sheet
        try:
            import pypdf
            as_pdf_file = io.BytesIO(as_bytes)
            as_reader = pypdf.PdfReader(as_pdf_file)
            total_pages = len(as_reader.pages)
        except:
            total_pages = len(answers) if answers else 0
        
        result = AssessmentResult(
            id=assessment_id,
            status=ProcessingStatus.COMPLETED,
            questions=questions_with_status,
            unmatched_answers=unmatched_answers,
            total_pages=total_pages,
            processing_time_seconds=2.5
        )
        
        assessments[assessment_id] = result
        processing_status[assessment_id] = ProcessingStatus.COMPLETED
        
    except Exception as e:
        processing_status[assessment_id] = ProcessingStatus.FAILED
        # Create error result
        result = AssessmentResult(
            id=assessment_id,
            status=ProcessingStatus.FAILED,
            questions=[],
            unmatched_answers=[],
            total_pages=0,
            error=str(e)
        )
        assessments[assessment_id] = result


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


@router.get("/{assessment_id}/answer-sheet")
async def get_answer_sheet_pdf(assessment_id: str):
    """Get the uploaded answer sheet PDF for an assessment."""
    if assessment_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    file_info = uploaded_files[assessment_id]
    answer_sheet_path = file_info.get("answer_sheet")
    
    if not answer_sheet_path or not os.path.exists(answer_sheet_path):
        raise HTTPException(status_code=404, detail="Answer sheet file not found")
    
    return FileResponse(
        answer_sheet_path,
        media_type="application/pdf",
        filename=f"assessment_{assessment_id}_answer_sheet.pdf"
    )


@router.get("/{assessment_id}/question-paper")
async def get_question_paper_pdf(assessment_id: str):
    """Get the uploaded question paper PDF for an assessment."""
    if assessment_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    file_info = uploaded_files[assessment_id]
    question_paper_path = file_info.get("question_paper")
    
    if not question_paper_path or not os.path.exists(question_paper_path):
        raise HTTPException(status_code=404, detail="Question paper file not found")
    
    return FileResponse(
        question_paper_path,
        media_type="application/pdf",
        filename=f"assessment_{assessment_id}_question_paper.pdf"
    )
