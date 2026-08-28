from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from typing import List
from app.schemas.assessment import QuestionWithStatus, QuestionStatus
import io


class ReportGenerator:
    """Generate PDF assessment reports."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom styles for the report."""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=32,
            textColor=colors.HexColor('#6D28D9'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#F97316'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=18,
            textColor=colors.HexColor('#6D28D9'),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='QuestionText',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#18181B'),
            spaceAfter=8,
            leading=14,
            fontName='Helvetica'
        ))
        
        self.styles.add(ParagraphStyle(
            name='AnswerText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#475569'),
            spaceAfter=8,
            leading=12,
            fontName='Helvetica',
            leftIndent=20
        ))
        
        self.styles.add(ParagraphStyle(
            name='GradingText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#71717A'),
            spaceAfter=6,
            leading=12,
            fontName='Helvetica',
            leftIndent=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='RecommendationText',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#F97316'),
            spaceAfter=4,
            leading=11,
            fontName='Helvetica',
            leftIndent=15
        ))
    
    def generate_assessment_report(
        self,
        questions: List[QuestionWithStatus],
        assessment_id: str
    ) -> bytes:
        """Generate a PDF assessment report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        story = []
        
        # Title with branding
        story.append(Paragraph("VedaAI Assessment Report", self.styles['CustomTitle']))
        story.append(Paragraph("AI-Powered Assessment Review System", self.styles['CustomSubtitle']))
        story.append(Paragraph(f"Assessment ID: {assessment_id}", self.styles['CustomSubtitle']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Summary section
        story.append(self._create_summary_section(questions))
        story.append(Spacer(1, 0.3 * inch))
        
        # Overall score and grade
        story.append(self._create_overall_score_section(questions))
        story.append(Spacer(1, 0.3 * inch))
        
        # Questions section
        story.append(Paragraph("Question-by-Question Analysis", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.1 * inch))
        
        for i, qws in enumerate(questions):
            story.append(self._create_question_detail(qws, i + 1))
            story.append(Spacer(1, 0.2 * inch))
            
            # Add page break every 5 questions to avoid overly long pages
            if (i + 1) % 5 == 0 and i < len(questions) - 1:
                story.append(PageBreak())
        
        # Recommendations section
        story.append(PageBreak())
        story.append(Paragraph("Overall Recommendations", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.1 * inch))
        story.append(self._create_recommendations_section(questions))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _create_summary_section(self, questions: List[QuestionWithStatus]) -> Table:
        """Create summary statistics table."""
        total = len(questions)
        answered = len([q for q in questions if q.status == QuestionStatus.ANSWERED])
        partially_correct = len([q for q in questions if q.status == QuestionStatus.PARTIALLY_CORRECT])
        incorrect = len([q for q in questions if q.status == QuestionStatus.INCORRECT])
        unanswered = len([q for q in questions if q.status == QuestionStatus.UNANSWERED])
        unable_to_determine = len([q for q in questions if q.status == QuestionStatus.UNABLE_TO_DETERMINE])
        
        # Calculate average score
        scores = [q.grading_info.score for q in questions if q.grading_info and q.grading_info.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        data = [
            ['Metric', 'Count / Value'],
            ['Total Questions', str(total)],
            ['Correct', str(answered)],
            ['Partially Correct', str(partially_correct)],
            ['Incorrect', str(incorrect)],
            ['Unanswered', str(unanswered)],
            ['Unable to Determine', str(unable_to_determine)],
            ['Average Score', f'{avg_score:.1f}%']
        ]
        
        table = Table(data, colWidths=[2.5 * inch, 1.5 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#6D28D9')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (1, 0), 12),
            ('BACKGROUND', (0, 1), (1, 1), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (0, 2), (1, 2), colors.white),
            ('BACKGROUND', (0, 3), (1, 3), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (0, 4), (1, 4), colors.white),
            ('BACKGROUND', (0, 5), (1, 5), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (0, 6), (1, 6), colors.white),
            ('BACKGROUND', (0, 7), (1, 7), colors.HexColor('#f1f5f9')),
            ('GRID', (0, 0), (1, 7), 1, colors.HexColor('#e2e8f0')),
            ('FONTNAME', (0, 0), (1, 7), 'Helvetica'),
            ('FONTSIZE', (0, 0), (1, 7), 11),
            ('ALIGN', (0, 0), (1, 7), 'LEFT'),
            ('VALIGN', (0, 0), (1, 7), 'MIDDLE'),
        ]))
        
        return table
    
    def _create_overall_score_section(self, questions: List[QuestionWithStatus]) -> Table:
        """Create overall score and grade section."""
        # Calculate average score
        scores = [q.grading_info.score for q in questions if q.grading_info and q.grading_info.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # Determine grade
        if avg_score >= 90:
            grade = "A+"
            grade_color = colors.HexColor('#22c55e')
        elif avg_score >= 80:
            grade = "A"
            grade_color = colors.HexColor('#22c55e')
        elif avg_score >= 70:
            grade = "B+"
            grade_color = colors.HexColor('#F97316')
        elif avg_score >= 60:
            grade = "B"
            grade_color = colors.HexColor('#F97316')
        elif avg_score >= 50:
            grade = "C"
            grade_color = colors.HexColor('#f59e0b')
        else:
            grade = "D"
            grade_color = colors.HexColor('#ef4444')
        
        data = [
            ['Overall Assessment Score', f'{avg_score:.1f}%'],
            ['Grade', grade],
            ['Total Questions', str(len(questions))],
            ['Questions Answered', str(len([q for q in questions if q.status in [QuestionStatus.ANSWERED, QuestionStatus.PARTIALLY_CORRECT]]))]
        ]
        
        table = Table(data, colWidths=[2.5 * inch, 1.5 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#6D28D9')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (1, 0), 12),
            ('BACKGROUND', (0, 1), (1, 1), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (0, 2), (1, 2), colors.white),
            ('BACKGROUND', (0, 3), (1, 3), colors.HexColor('#f1f5f9')),
            ('GRID', (0, 0), (1, 3), 1, colors.HexColor('#e2e8f0')),
            ('FONTNAME', (0, 0), (1, 3), 'Helvetica'),
            ('FONTSIZE', (0, 0), (1, 3), 11),
            ('ALIGN', (0, 0), (1, 3), 'LEFT'),
            ('VALIGN', (0, 0), (1, 3), 'MIDDLE'),
            ('TEXTCOLOR', (1, 1), (1, 1), grade_color),  # Grade color
            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#6D28D9')),  # Score color
        ]))
        
        return table
    
    def _create_recommendations_section(self, questions: List[QuestionWithStatus]) -> Table:
        """Create overall recommendations section."""
        recommendations = []
        
        # Collect all recommendations from questions
        for q in questions:
            if q.grading_info and q.grading_info.recommendations:
                for rec in q.grading_info.recommendations:
                    if rec and rec != "Answer appears complete based on detected requirements":
                        recommendations.append(f"Q{q.question.number}: {rec}")
        
        # Add general recommendations
        total = len(questions)
        answered = len([q for q in questions if q.status in [QuestionStatus.ANSWERED, QuestionStatus.PARTIALLY_CORRECT]])
        unanswered = len([q for q in questions if q.status == QuestionStatus.UNANSWERED])
        
        if unanswered > 0:
            recommendations.append(f"General: {unanswered} question(s) were left unanswered")
        
        if not recommendations:
            recommendations.append("Great job! All questions were addressed adequately.")
        
        data = [[i + 1, rec] for i, rec in enumerate(recommendations)]
        
        table = Table(data, colWidths=[0.5 * inch, 5.5 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#F97316')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (1, 0), 10),
            ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f8fafc')),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (1, -1), 9),
            ('GRID', (0, 0), (1, -1), 1, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (1, -1), 8),
            ('RIGHTPADDING', (0, 0), (1, -1), 8),
            ('TOPPADDING', (0, 0), (1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (1, -1), 6),
        ]))
        
        return table
    
    def _create_question_detail(self, qws: QuestionWithStatus, index: int) -> Table:
        """Create detailed question table."""
        status_colors = {
            QuestionStatus.ANSWERED: colors.HexColor('#22c55e'),
            QuestionStatus.PARTIALLY_CORRECT: colors.HexColor('#F97316'),
            QuestionStatus.INCORRECT: colors.HexColor('#ef4444'),
            QuestionStatus.UNANSWERED: colors.HexColor('#ef4444'),
            QuestionStatus.NEEDS_REVIEW: colors.HexColor('#f59e0b'),
            QuestionStatus.UNABLE_TO_DETERMINE: colors.HexColor('#6b7280')
        }
        
        status_text = qws.status.value.replace('_', ' ').title()
        status_color = status_colors.get(qws.status, colors.gray)
        
        # Answer text
        answer_text = qws.answer.text if qws.answer else "No answer provided"
        if len(answer_text) > 300:
            answer_text = answer_text[:300] + "..."
        
        # Pages
        pages = "N/A"
        if qws.answer and qws.answer.pages:
            pages = ", ".join(map(str, qws.answer.pages))
        
        # Confidence
        confidence = f"{qws.mapping.confidence * 100:.1f}%" if qws.mapping else "N/A"
        
        # Grading information
        score = "N/A"
        explanation = "N/A"
        requirements_met = "N/A"
        if qws.grading_info:
            score = f"{qws.grading_info.score:.1f}%" if qws.grading_info.score is not None else "N/A"
            explanation = qws.grading_info.explanation or "N/A"
            requirements_met = f"{qws.grading_info.satisfied_count}/{qws.grading_info.total_requirements}" if qws.grading_info.total_requirements > 0 else "N/A"
        
        # Recommendations
        recommendations_text = ""
        if qws.grading_info and qws.grading_info.recommendations:
            recommendations_text = "; ".join(qws.grading_info.recommendations[:2])  # Show first 2 recommendations
            if len(qws.grading_info.recommendations) > 2:
                recommendations_text += "..."
        
        data = [
            ['Question Number', qws.question.number],
            ['Status', status_text],
            ['Score', score],
            ['Requirements Met', requirements_met],
            ['Question Text', qws.question.text],
            ['Student Answer', answer_text],
            ['Answer Pages', pages],
            ['Mapping Confidence', confidence],
            ['Explanation', explanation],
            ['Recommendations', recommendations_text]
        ]
        
        table = Table(data, colWidths=[1.5 * inch, 4 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 9), colors.HexColor('#f8fafc')),
            ('FONTNAME', (0, 0), (0, 9), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, 9), 'Helvetica'),
            ('FONTSIZE', (0, 0), (1, 9), 9),
            ('GRID', (0, 0), (1, 9), 1, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (1, 9), 'TOP'),
            ('LEFTPADDING', (0, 0), (1, 9), 8),
            ('RIGHTPADDING', (0, 0), (1, 9), 8),
            ('TOPPADDING', (0, 0), (1, 9), 6),
            ('BOTTOMPADDING', (0, 0), (1, 9), 6),
            ('TEXTCOLOR', (1, 1), (1, 1), status_color),  # Status color
            ('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor('#6D28D9')),  # Score color
            ('TEXTCOLOR', (1, 9), (1, 9), colors.HexColor('#F97316')),  # Recommendations color
        ]))
        
        return table