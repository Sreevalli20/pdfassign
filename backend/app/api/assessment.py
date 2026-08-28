from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from app.schemas.assessment import AssessmentResult, ProcessingStatus
from app.services.pdf_processor import PDFProcessor
from app.services.answer_processor import AnswerProcessor
from app.services.answer_mapper import AnswerMapper
from app.services.grading_service import GradingService
from app.services.report_generator import ReportGenerator
import uuid
import os
import io
import gc
import psutil
from typing import Dict
import asyncio
import pypdf

router = APIRouter()

# Memory limits for Render Free-tier (512 MB RAM)
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB per file
MAX_PAGES = 30  # Maximum pages per PDF
MAX_TOTAL_SIZE = 25 * 1024 * 1024  # 25MB total
MAX_CONCURRENT_PROCESSES = 1  # Limit concurrent processing for memory

# File-based storage for assessments (works in production)
import json
import tempfile
import time

# Use persistent directory for Render
STORAGE_DIR = os.path.join(os.getcwd(), "temp", "storage")
UPLOAD_DIR = "temp/uploads"
os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Cleanup old files to prevent disk space issues
def cleanup_old_files(max_age_hours=24):
    """Remove files older than max_age_hours."""
    try:
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        # Clean up old assessment data
        for filename in os.listdir(STORAGE_DIR):
            filepath = os.path.join(STORAGE_DIR, filename)
            if os.path.getmtime(filepath) < current_time - max_age_seconds:
                os.remove(filepath)
        
        # Clean up old uploaded files
        if os.path.exists(UPLOAD_DIR):
            for filename in os.listdir(UPLOAD_DIR):
                filepath = os.path.join(UPLOAD_DIR, filename)
                if os.path.getmtime(filepath) < current_time - max_age_seconds:
                    os.remove(filepath)
    except Exception as e:
        pass

def check_memory_usage():
    """Check current memory usage and return percentage."""
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        memory_percent = process.memory_percent()
        return memory_percent
    except Exception as e:
        return 0

def force_garbage_collection():
    """Force garbage collection and report memory before/after."""
    try:
        before_memory = check_memory_usage()
        gc.collect()
        after_memory = check_memory_usage()
    except Exception as e:
        pass

def save_assessment(assessment_id: str, data: dict):
    """Save assessment data to file."""
    filepath = os.path.join(STORAGE_DIR, f"assessment_{assessment_id}.json")
    with open(filepath, 'w') as f:
        json.dump(data, f)

def load_assessment(assessment_id: str) -> dict:
    """Load assessment data from file."""
    filepath = os.path.join(STORAGE_DIR, f"assessment_{assessment_id}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return None

def save_file_paths(assessment_id: str, paths: dict):
    """Save file paths to file."""
    filepath = os.path.join(STORAGE_DIR, f"files_{assessment_id}.json")
    with open(filepath, 'w') as f:
        json.dump(paths, f)

def load_file_paths(assessment_id: str) -> dict:
    """Load file paths from file."""
    filepath = os.path.join(STORAGE_DIR, f"files_{assessment_id}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return None


@router.post("/process", response_model=AssessmentResult)
async def process_assessment(
    question_paper: UploadFile = File(...),
    answer_sheet: UploadFile = File(...),
    demo_mode: bool = Form(False)
):
    """Process question paper and answer sheet to extract and map answers."""
    
    # Cleanup old files periodically
    cleanup_old_files()
    
    # Demo mode is disabled in production - always process real files
    # The demo_mode parameter is kept for API compatibility but not used
    """Process question paper and answer sheet to extract and map answers."""
    
    # Cleanup old files periodically
    cleanup_old_files()
    
    # Demo mode is disabled in production - always process real files
    # The demo_mode parameter is kept for API compatibility but not used
    
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
    
    # Validate file sizes
    qp_content = await question_paper.read()
    as_content = await answer_sheet.read()
    
    if len(qp_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Question paper too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    if len(as_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Answer sheet too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    if len(qp_content) + len(as_content) > MAX_TOTAL_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Combined file size too large. Maximum total is {MAX_TOTAL_SIZE // (1024*1024)}MB"
        )
    
    # Validate page counts for PDFs
    if qp_ext == '.pdf':
        qp_pdf_file = io.BytesIO(qp_content)
        qp_reader = pypdf.PdfReader(qp_pdf_file)
        if len(qp_reader.pages) > MAX_PAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Question paper has too many pages. Maximum is {MAX_PAGES} pages"
            )
        qp_pdf_file.close()
        del qp_pdf_file
    
    if as_ext == '.pdf':
        as_pdf_file = io.BytesIO(as_content)
        as_reader = pypdf.PdfReader(as_pdf_file)
        if len(as_reader.pages) > MAX_PAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Answer sheet has too many pages. Maximum is {MAX_PAGES} pages"
            )
        as_pdf_file.close()
        del as_pdf_file
    
    # Save uploaded files
    qp_path = os.path.join(UPLOAD_DIR, f"{assessment_id}_qp{qp_ext}")
    as_path = os.path.join(UPLOAD_DIR, f"{assessment_id}_as{as_ext}")
    
    with open(qp_path, "wb") as f:
        f.write(qp_content)
    
    with open(as_path, "wb") as f:
        f.write(as_content)
    
    # Clear content from memory
    del qp_content
    del as_content
    gc.collect()
    
    # Store file paths for later retrieval
    save_file_paths(assessment_id, {
        "question_paper": qp_path,
        "answer_sheet": as_path
    })
    
    # Process synchronously (works better with Render's ephemeral environment)
    result = await process_assessment_sync(assessment_id, qp_path, as_path)
    
    return result


async def process_assessment_sync(
    assessment_id: str,
    question_paper_path: str,
    answer_sheet_path: str
) -> AssessmentResult:
    """Synchronous processing for Render's ephemeral environment with memory optimization."""
    try:
        # Read files sequentially
        qp_bytes = None
        as_bytes = None
        
        with open(question_paper_path, "rb") as f:
            qp_bytes = f.read()
        
        # Process question paper first, then free memory
        pdf_processor = PDFProcessor()
        questions = pdf_processor.extract_questions_from_pdf(qp_bytes)
        
        # Free question paper memory immediately
        del qp_bytes
        qp_bytes = None
        gc.collect()
        
        # Read answer sheet
        with open(answer_sheet_path, "rb") as f:
            as_bytes = f.read()
        
        # Extract answers
        answer_processor = AnswerProcessor()
        answers = answer_processor.extract_answers(as_bytes)
        
        # Get page count before freeing answer sheet memory
        total_pages = 0
        try:
            as_pdf_file = io.BytesIO(as_bytes)
            as_reader = pypdf.PdfReader(as_pdf_file)
            total_pages = len(as_reader.pages)
            as_pdf_file.close()
            del as_pdf_file
            del as_reader
        except:
            total_pages = len(answers) if answers else 0
        
        # Free answer sheet memory immediately
        del as_bytes
        as_bytes = None
        gc.collect()
        
        # Map answers to questions
        answer_mapper = AnswerMapper()
        questions_with_status, unmatched_answers = answer_mapper.map_answers_to_questions(questions, answers)
        
        # Grade the questions using the new grading service
        grading_service = GradingService()
        questions_with_status = grading_service.grade_assessment(questions_with_status)
        
        # Add completeness analysis
        completeness_analysis = grading_service.analyze_completeness(questions_with_status)
        
        # Free processors
        del pdf_processor
        del answer_processor
        del answer_mapper
        del grading_service
        gc.collect()
        
        result = AssessmentResult(
            id=assessment_id,
            status=ProcessingStatus.COMPLETED,
            questions=questions_with_status,
            unmatched_answers=unmatched_answers,
            total_pages=total_pages,
            processing_time_seconds=2.5,
            completeness_analysis=completeness_analysis
        )
        
        # Convert to dict for JSON serialization and save
        result_dict = {
            "id": result.id,
            "status": result.status.value,
            "questions": [q.model_dump() for q in result.questions],
            "unmatched_answers": [a.model_dump() for a in result.unmatched_answers],
            "total_pages": result.total_pages,
            "processing_time_seconds": result.processing_time_seconds,
            "completeness_analysis": result.completeness_analysis.model_dump() if result.completeness_analysis else None
        }
        save_assessment(assessment_id, result_dict)
        
        return result
        
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n\n{traceback.format_exc()}"
        error_result = AssessmentResult(
            id=assessment_id,
            status=ProcessingStatus.FAILED,
            questions=[],
            unmatched_answers=[],
            total_pages=0,
            error=error_msg
        )
        
        error_dict = {
            "id": error_result.id,
            "status": error_result.status.value,
            "questions": [],
            "unmatched_answers": [],
            "total_pages": 0,
            "error": error_msg,
            "completeness_analysis": None
        }
        save_assessment(assessment_id, error_dict)
        
        # Clean up on error
        try:
            if os.path.exists(question_paper_path):
                os.remove(question_paper_path)
            if os.path.exists(answer_sheet_path):
                os.remove(answer_sheet_path)
        except:
            pass
        
        return error_result


@router.get("/{assessment_id}", response_model=AssessmentResult)
async def get_assessment(assessment_id: str):
    """Get assessment results by ID."""
    data = load_assessment(assessment_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Convert dict back to AssessmentResult
    return AssessmentResult(**data)


@router.get("/{assessment_id}/status")
async def get_assessment_status(assessment_id: str):
    """Get processing status for an assessment."""
    data = load_assessment(assessment_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return {"assessment_id": assessment_id, "status": data.get("status")}


@router.get("/{assessment_id}/answer-sheet")
async def get_answer_sheet_pdf(assessment_id: str):
    """Get the uploaded answer sheet PDF for an assessment."""
    file_info = load_file_paths(assessment_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    answer_sheet_path = file_info.get("answer_sheet")
    
    if not answer_sheet_path or not os.path.exists(answer_sheet_path):
        raise HTTPException(status_code=404, detail="Answer sheet file not found")
    
    return FileResponse(
        answer_sheet_path,
        media_type="application/pdf",
        filename=f"assessment_{assessment_id}_answer_sheet.pdf"
    )


@router.head("/{assessment_id}/answer-sheet")
async def head_answer_sheet_pdf(assessment_id: str):
    """HEAD request for answer sheet PDF."""
    file_info = load_file_paths(assessment_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    answer_sheet_path = file_info.get("answer_sheet")
    
    if not answer_sheet_path or not os.path.exists(answer_sheet_path):
        raise HTTPException(status_code=404, detail="Answer sheet file not found")
    
    return JSONResponse(status_code=200, content={})


@router.get("/{assessment_id}/question-paper")
async def get_question_paper_pdf(assessment_id: str):
    """Get the uploaded question paper PDF for an assessment."""
    file_info = load_file_paths(assessment_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    question_paper_path = file_info.get("question_paper")
    
    if not question_paper_path or not os.path.exists(question_paper_path):
        raise HTTPException(status_code=404, detail="Question paper file not found")
    
    return FileResponse(
        question_paper_path,
        media_type="application/pdf",
        filename=f"assessment_{assessment_id}_question_paper.pdf"
    )


@router.head("/{assessment_id}/question-paper")
async def head_question_paper_pdf(assessment_id: str):
    """HEAD request for question paper PDF."""
    file_info = load_file_paths(assessment_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    question_paper_path = file_info.get("question_paper")
    
    if not question_paper_path or not os.path.exists(question_paper_path):
        raise HTTPException(status_code=404, detail="Question paper file not found")
    
    return JSONResponse(status_code=200, content={})


@router.get("/{assessment_id}/report")
async def get_assessment_report(assessment_id: str):
    """Generate and download a PDF assessment report."""
    data = load_assessment(assessment_id)
    if not data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    try:
        # Convert dict back to AssessmentResult
        assessment = AssessmentResult(**data)
        
        # Generate report
        report_generator = ReportGenerator()
        report_bytes = report_generator.generate_assessment_report(
            assessment.questions,
            assessment_id
        )
        
        # Clean up
        del report_generator
        gc.collect()
        
        # Create temp file for FileResponse
        temp_file = os.path.join(UPLOAD_DIR, f"report_{assessment_id}.pdf")
        with open(temp_file, "wb") as f:
            f.write(report_bytes)
        
        # Return as file response
        return FileResponse(
            temp_file,
            media_type="application/pdf",
            filename=f"vedaai_assessment_report.pdf"
        )
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail="Failed to generate report")
