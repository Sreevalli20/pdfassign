from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum


class ProcessingStatus(str, Enum):
    UPLOADING = "uploading"
    READING_QUESTION_PAPER = "reading_question_paper"
    EXTRACTING_QUESTIONS = "extracting_questions"
    READING_ANSWERS = "reading_answers"
    DETECTING_REGIONS = "detecting_regions"
    MAPPING_ANSWERS = "mapping_answers"
    PREPARING_ASSESSMENT = "preparing_assessment"
    COMPLETED = "completed"
    FAILED = "failed"


class BoundingBox(BaseModel):
    x: float = Field(..., ge=0, le=1, description="Normalized x coordinate (0-1)")
    y: float = Field(..., ge=0, le=1, description="Normalized y coordinate (0-1)")
    width: float = Field(..., ge=0, le=1, description="Normalized width (0-1)")
    height: float = Field(..., ge=0, le=1, description="Normalized height (0-1)")


class Question(BaseModel):
    id: str
    number: str
    text: str
    page: int
    bbox: Optional[BoundingBox] = None
    confidence: float = Field(..., ge=0, le=1)
    sub_part: Optional[str] = None


class AnswerRegion(BaseModel):
    page: int
    bbox: BoundingBox


class Answer(BaseModel):
    id: str
    label: str
    text: Optional[str] = None
    pages: List[int]
    regions: List[AnswerRegion]
    confidence: float = Field(..., ge=0, le=1)


class MappingMethod(str, Enum):
    EXPLICIT_LABEL = "explicit_label"
    OCR_DERIVED = "ocr_derived"
    STRUCTURAL = "structural"
    SEMANTIC = "semantic"
    AI_REASONING = "ai_reasoning"


class AnswerMapping(BaseModel):
    question_id: str
    answer_id: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)
    mapping_method: Optional[MappingMethod] = None


class QuestionStatus(str, Enum):
    ANSWERED = "answered"
    UNANSWERED = "unanswered"
    NEEDS_REVIEW = "needs_review"
    PARTIALLY_CORRECT = "partially_correct"
    INCORRECT = "incorrect"
    UNABLE_TO_DETERMINE = "unable_to_determine"


class AnswerStatus(str, Enum):
    MAPPED = "mapped"
    UNMATCHED = "unmatched"
    NEEDS_REVIEW = "needs_review"


class RequirementInfo(BaseModel):
    type: str
    description: str
    detected: bool
    item: Optional[str] = None

class SatisfactionResult(BaseModel):
    satisfied: bool
    evidence: str

class GradingInfo(BaseModel):
    status: QuestionStatus
    score: float
    satisfied_count: int
    total_requirements: int
    requirements: List[RequirementInfo]
    satisfaction_results: List[SatisfactionResult]
    recommendations: List[str]
    explanation: str
    evidence: str
    presentation_analysis: Optional[Dict[str, Any]] = None

class QuestionWithStatus(BaseModel):
    question: Question
    status: QuestionStatus
    mapping: Optional[AnswerMapping] = None
    answer: Optional[Answer] = None
    grading_info: Optional[GradingInfo] = None


class CompletenessAnalysis(BaseModel):
    total_questions: int
    answered: int
    unanswered: int
    needs_review: int
    unable_to_determine: int
    completion_rate: float
    assessment: str

class AssessmentResult(BaseModel):
    id: str
    status: ProcessingStatus
    questions: List[QuestionWithStatus]
    unmatched_answers: List[Answer]
    total_pages: int
    processing_time_seconds: Optional[float] = None
    error: Optional[str] = None
    completeness_analysis: Optional[CompletenessAnalysis] = None
