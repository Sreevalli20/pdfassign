from app.schemas.assessment import (
    Question, Answer, AnswerRegion, BoundingBox,
    QuestionWithStatus, QuestionStatus, AnswerStatus,
    AnswerMapping, MappingMethod, AssessmentResult, ProcessingStatus
)
from typing import List
import uuid


def get_demo_assessment() -> AssessmentResult:
    """Generate a realistic demo assessment with all required scenarios."""
    
    assessment_id = str(uuid.uuid4())
    
    # Demo questions with realistic numbering including sub-parts
    questions = [
        Question(
            id="q_1",
            number="1",
            text="Define photosynthesis and explain its importance in the ecosystem.",
            page=1,
            bbox=BoundingBox(x=0.10, y=0.15, width=0.80, height=0.12),
            confidence=0.98
        ),
        Question(
            id="q_2",
            number="2",
            text="Explain the process of cellular respiration in plants.",
            page=1,
            bbox=BoundingBox(x=0.10, y=0.30, width=0.80, height=0.10),
            confidence=0.97
        ),
        Question(
            id="q_3a",
            number="3(a)",
            text="What is the chemical equation for photosynthesis?",
            page=2,
            bbox=BoundingBox(x=0.10, y=0.15, width=0.75, height=0.08),
            confidence=0.96,
            sub_part="a"
        ),
        Question(
            id="q_3b",
            number="3(b)",
            text="Explain the role of chlorophyll in photosynthesis.",
            page=2,
            bbox=BoundingBox(x=0.10, y=0.25, width=0.75, height=0.08),
            confidence=0.95,
            sub_part="b"
        ),
        Question(
            id="q_4",
            number="4",
            text="Describe the light-dependent reactions of photosynthesis.",
            page=2,
            bbox=BoundingBox(x=0.10, y=0.38, width=0.80, height=0.12),
            confidence=0.97
        ),
        Question(
            id="q_5",
            number="5",
            text="Compare and contrast photosynthesis and respiration.",
            page=3,
            bbox=BoundingBox(x=0.10, y=0.15, width=0.80, height=0.12),
            confidence=0.98
        ),
    ]
    
    # Demo answers - intentionally out of order to test mapping
    answers = [
        Answer(
            id="a_1",
            label="3",
            text="Photosynthesis is the process by which plants convert light energy into chemical energy...",
            pages=[1],
            regions=[AnswerRegion(
                page=1,
                bbox=BoundingBox(x=0.08, y=0.12, width=0.82, height=0.25)
            )],
            confidence=0.92
        ),
        Answer(
            id="a_2",
            label="1",
            text="Photosynthesis is the biological process used by plants and other organisms...",
            pages=[2],
            regions=[AnswerRegion(
                page=2,
                bbox=BoundingBox(x=0.08, y=0.10, width=0.82, height=0.22)
            )],
            confidence=0.94
        ),
        # Question 2 is intentionally skipped (unanswered)
        Answer(
            id="a_3",
            label="5",
            text="While both processes involve energy transformation, photosynthesis builds glucose...",
            pages=[3],
            regions=[AnswerRegion(
                page=3,
                bbox=BoundingBox(x=0.08, y=0.12, width=0.82, height=0.28)
            )],
            confidence=0.91
        ),
        Answer(
            id="a_4",
            label="4",
            text="The light-dependent reactions occur in the thylakoid membranes...",
            pages=[4],
            regions=[AnswerRegion(
                page=4,
                bbox=BoundingBox(x=0.08, y=0.10, width=0.82, height=0.24)
            )],
            confidence=0.93
        ),
        # Multi-page answer for 3(a) and 3(b)
        Answer(
            id="a_5",
            label="3(a)",
            text="6CO2 + 6H2O + light energy → C6H12O6 + 6O2",
            pages=[4, 5],
            regions=[
                AnswerRegion(
                    page=4,
                    bbox=BoundingBox(x=0.08, y=0.40, width=0.82, height=0.10)
                ),
                AnswerRegion(
                    page=5,
                    bbox=BoundingBox(x=0.08, y=0.08, width=0.82, height=0.08)
                )
            ],
            confidence=0.95
        ),
        Answer(
            id="a_6",
            label="3(b)",
            text="Chlorophyll is a green pigment found in plants that absorbs light energy...",
            pages=[5],
            regions=[AnswerRegion(
                page=5,
                bbox=BoundingBox(x=0.08, y=0.20, width=0.82, height=0.18)
            )],
            confidence=0.90
        ),
        # Unmatched answer - unclear label
        Answer(
            id="a_7",
            label="99",
            text="This is an unclear answer that cannot be matched to any question.",
            pages=[6],
            regions=[AnswerRegion(
                page=6,
                bbox=BoundingBox(x=0.08, y=0.10, width=0.82, height=0.15)
            )],
            confidence=0.75
        ),
    ]
    
    # Create mappings
    question_status_map = {
        "q_1": (QuestionStatus.ANSWERED, "a_2", 0.94, MappingMethod.EXPLICIT_LABEL),
        "q_2": (QuestionStatus.UNANSWERED, None, 0.0, None),
        "q_3a": (QuestionStatus.ANSWERED, "a_5", 0.95, MappingMethod.EXPLICIT_LABEL),
        "q_3b": (QuestionStatus.ANSWERED, "a_6", 0.90, MappingMethod.EXPLICIT_LABEL),
        "q_4": (QuestionStatus.ANSWERED, "a_4", 0.93, MappingMethod.EXPLICIT_LABEL),
        "q_5": (QuestionStatus.ANSWERED, "a_3", 0.91, MappingMethod.EXPLICIT_LABEL),
    }
    
    # Build questions with status
    questions_with_status = []
    for q in questions:
        status, answer_id, confidence, method = question_status_map.get(q.id, (QuestionStatus.NEEDS_REVIEW, None, 0.0, None))
        
        mapping = None
        answer = None
        if answer_id:
            answer = next((a for a in answers if a.id == answer_id), None)
            mapping = AnswerMapping(
                question_id=q.id,
                answer_id=answer_id,
                confidence=confidence,
                mapping_method=method
            )
        
        questions_with_status.append(QuestionWithStatus(
            question=q,
            status=status,
            mapping=mapping,
            answer=answer
        ))
    
    # Unmatched answers
    unmatched_answers = [a for a in answers if a.label == "99"]
    
    return AssessmentResult(
        id=assessment_id,
        status=ProcessingStatus.COMPLETED,
        questions=questions_with_status,
        unmatched_answers=unmatched_answers,
        total_pages=6,
        processing_time_seconds=2.5
    )
