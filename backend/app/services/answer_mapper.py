from typing import List, Dict, Optional
from app.schemas.assessment import (
    Question, Answer, AnswerMapping, MappingMethod,
    QuestionStatus, QuestionWithStatus
)


class AnswerMapper:
    """Map answers to questions using various strategies."""
    
    def __init__(self):
        pass
    
    def normalize_label(self, label: str) -> str:
        """Normalize question/answer labels for comparison."""
        # Remove spaces, dots, parentheses
        normalized = label.replace(' ', '').replace('.', '').lower()
        return normalized
    
    def map_by_explicit_label(self, questions: List[Question], answers: List[Answer]) -> Dict[str, AnswerMapping]:
        """Map answers to questions by explicit label matching."""
        mappings = {}
        answer_map = {self.normalize_label(a.label): a for a in answers}
        
        for question in questions:
            q_label = self.normalize_label(question.number)
            if q_label in answer_map:
                answer = answer_map[q_label]
                mappings[question.id] = AnswerMapping(
                    question_id=question.id,
                    answer_id=answer.id,
                    confidence=0.95,
                    mapping_method=MappingMethod.EXPLICIT_LABEL
                )
        
        return mappings
    
    def map_by_ocr_derived(self, questions: List[Question], answers: List[Answer]) -> Dict[str, AnswerMapping]:
        """Map answers using OCR-derived labels."""
        # Similar to explicit label but with lower confidence
        return self.map_by_explicit_label(questions, answers)
    
    def map_by_structural(self, questions: List[Question], answers: List[Answer]) -> Dict[str, AnswerMapping]:
        """Map answers based on structural layout (position on page)."""
        mappings = {}
        
        # Sort by page and y-position
        sorted_questions = sorted(questions, key=lambda q: (q.page, q.bbox.y if q.bbox else 0))
        sorted_answers = sorted(answers, key=lambda a: (a.pages[0] if a.pages else 0, 
                                                       a.regions[0].bbox.y if a.regions else 0))
        
        # Map by position
        for i, question in enumerate(sorted_questions):
            if i < len(sorted_answers):
                answer = sorted_answers[i]
                mappings[question.id] = AnswerMapping(
                    question_id=question.id,
                    answer_id=answer.id,
                    confidence=0.60,
                    mapping_method=MappingMethod.STRUCTURAL
                )
        
        return mappings
    
    def create_question_status_map(
        self,
        questions: List[Question],
        answers: List[Answer],
        mappings: Dict[str, AnswerMapping]
    ) -> List[QuestionWithStatus]:
        """Create question status map with answers."""
        question_with_status = []
        mapped_answer_ids = {m.answer_id for m in mappings.values() if m.answer_id}
        
        for question in questions:
            mapping = mappings.get(question.id)
            
            if mapping and mapping.answer_id:
                answer = next((a for a in answers if a.id == mapping.answer_id), None)
                status = QuestionStatus.ANSWERED
            else:
                answer = None
                status = QuestionStatus.UNANSWERED
            
            question_with_status.append(QuestionWithStatus(
                question=question,
                status=status,
                mapping=mapping,
                answer=answer
            ))
        
        return question_with_status
    
    def get_unmatched_answers(self, answers: List[Answer], mappings: Dict[str, AnswerMapping]) -> List[Answer]:
        """Get answers that were not mapped to any question."""
        mapped_answer_ids = {m.answer_id for m in mappings.values() if m.answer_id}
        return [a for a in answers if a.id not in mapped_answer_ids]
    
    def map_answers_to_questions(
        self,
        questions: List[Question],
        answers: List[Answer]
    ) -> tuple[List[QuestionWithStatus], List[Answer]]:
        """Main mapping function using multiple strategies."""
        # Try explicit label mapping first
        mappings = self.map_by_explicit_label(questions, answers)
        
        # If no mappings, try OCR-derived
        if not mappings:
            mappings = self.map_by_ocr_derived(questions, answers)
        
        # If still no mappings, try structural
        if not mappings:
            mappings = self.map_by_structural(questions, answers)
        
        # Create question status map
        questions_with_status = self.create_question_status_map(questions, answers, mappings)
        
        # Get unmatched answers
        unmatched_answers = self.get_unmatched_answers(answers, mappings)
        
        return questions_with_status, unmatched_answers
