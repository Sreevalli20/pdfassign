import pytest
from app.services.demo_service import get_demo_assessment
from app.schemas.assessment import QuestionStatus, AnswerStatus


def test_question_ordering():
    """Test 1 — Question ordering preserves original numbering including sub-parts"""
    result = get_demo_assessment()
    
    question_numbers = [q.question.number for q in result.questions]
    
    # Verify correct order with sub-parts
    assert question_numbers == ["1", "2", "3(a)", "3(b)", "4", "5"]
    
    # Verify sub-parts are separate questions
    assert len([q for q in result.questions if q.question.sub_part]) == 2


def test_out_of_order_answers():
    """Test 2 — Out-of-order answers are mapped correctly"""
    result = get_demo_assessment()
    
    # Create a map of question number to status
    status_map = {q.question.number: q.status for q in result.questions}
    
    # Verify mapping based on demo data
    assert status_map["1"] == QuestionStatus.ANSWERED
    assert status_map["2"] == QuestionStatus.UNANSWERED  # Skipped in demo
    assert status_map["3(a)"] == QuestionStatus.ANSWERED
    assert status_map["3(b)"] == QuestionStatus.ANSWERED
    assert status_map["4"] == QuestionStatus.ANSWERED
    assert status_map["5"] == QuestionStatus.ANSWERED


def test_unmatched_answer():
    """Test 3 — Unmatched answer (label 99) is not mapped to any question"""
    result = get_demo_assessment()
    
    # Should have one unmatched answer
    assert len(result.unmatched_answers) == 1
    assert result.unmatched_answers[0].label == "99"


def test_multi_page_answer():
    """Test 4 — Multi-page answer retains all regions"""
    result = get_demo_assessment()
    
    # Find answer for 3(a) which spans multiple pages in demo
    answer_3a = None
    for q in result.questions:
        if q.question.number == "3(a)" and q.answer:
            answer_3a = q.answer
            break
    
    assert answer_3a is not None
    assert len(answer_3a.pages) == 2  # Spans 2 pages
    assert len(answer_3a.regions) == 2  # Has 2 regions
    assert answer_3a.pages == [4, 5]


def test_bounding_box_scaling():
    """Test 5 — Bounding boxes use normalized coordinates (0-1)"""
    result = get_demo_assessment()
    
    for q in result.questions:
        if q.question.bbox:
            bbox = q.question.bbox
            assert 0 <= bbox.x <= 1
            assert 0 <= bbox.y <= 1
            assert 0 <= bbox.width <= 1
            assert 0 <= bbox.height <= 1
    
    for q in result.questions:
        if q.answer:
            for region in q.answer.regions:
                bbox = region.bbox
                assert 0 <= bbox.x <= 1
                assert 0 <= bbox.y <= 1
                assert 0 <= bbox.width <= 1
                assert 0 <= bbox.height <= 1


def test_confidence_scores():
    """Test confidence scores are within valid range"""
    result = get_demo_assessment()
    
    for q in result.questions:
        assert 0 <= q.question.confidence <= 1
        if q.mapping:
            assert 0 <= q.mapping.confidence <= 1
        if q.answer:
            assert 0 <= q.answer.confidence <= 1


def test_assessment_structure():
    """Test assessment result has required structure"""
    result = get_demo_assessment()
    
    assert result.id is not None
    assert result.status is not None
    assert len(result.questions) > 0
    assert result.total_pages > 0
    assert result.processing_time_seconds is not None
