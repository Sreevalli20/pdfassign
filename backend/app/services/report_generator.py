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
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading3'],
            fontSize=16,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='QuestionText',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#334155'),
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
        
        # Title
        story.append(Paragraph("VedaAI Assessment Report", self.styles['CustomTitle']))
        story.append(Paragraph(f"Assessment ID: {assessment_id}", self.styles['CustomSubtitle']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Summary section
        story.append(self._create_summary_section(questions))
        story.append(Spacer(1, 0.3 * inch))
        
        # Questions section
        story.append(Paragraph("Question Details", self.styles['SectionHeader']))
        story.append(Spacer(1, 0.1 * inch))
        
        for i, qws in enumerate(questions):
            story.append(self._create_question_detail(qws, i + 1))
            story.append(Spacer(1, 0.2 * inch))
            
            # Add page break every 5 questions to avoid overly long pages
            if (i + 1) % 5 == 0 and i < len(questions) - 1:
                story.append(PageBreak())
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _create_summary_section(self, questions: List[QuestionWithStatus]) -> Table:
        """Create summary statistics table."""
        total = len(questions)
        answered = len([q for q in questions if q.status == QuestionStatus.ANSWERED])
        unanswered = len([q for q in questions if q.status == QuestionStatus.UNANSWERED])
        needs_review = len([q for q in questions if q.status == QuestionStatus.NEEDS_REVIEW])
        
        data = [
            ['Metric', 'Count'],
            ['Total Questions', str(total)],
            ['Answered', str(answered)],
            ['Unanswered', str(unanswered)],
            ['Needs Review', str(needs_review)]
        ]
        
        table = Table(data, colWidths=[2.5 * inch, 1.5 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (1, 0), 12),
            ('BACKGROUND', (0, 1), (1, 1), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (0, 2), (1, 2), colors.white),
            ('BACKGROUND', (0, 3), (1, 3), colors.HexColor('#f1f5f9')),
            ('BACKGROUND', (0, 4), (1, 4), colors.white),
            ('GRID', (0, 0), (1, 4), 1, colors.HexColor('#e2e8f0')),
            ('FONTNAME', (0, 0), (1, 4), 'Helvetica'),
            ('FONTSIZE', (0, 0), (1, 4), 11),
            ('ALIGN', (0, 0), (1, 4), 'LEFT'),
            ('VALIGN', (0, 0), (1, 4), 'MIDDLE'),
        ]))
        
        return table
    
    def _create_question_detail(self, qws: QuestionWithStatus, index: int) -> Table:
        """Create detailed question table."""
        status_colors = {
            QuestionStatus.ANSWERED: colors.HexColor('#22c55e'),
            QuestionStatus.UNANSWERED: colors.HexColor('#ef4444'),
            QuestionStatus.NEEDS_REVIEW: colors.HexColor('#f59e0b')
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
        
        data = [
            ['Question Number', qws.question.number],
            ['Status', status_text],
            ['Question Text', qws.question.text],
            ['Student Answer', answer_text],
            ['Answer Pages', pages],
            ['Mapping Confidence', confidence]
        ]
        
        table = Table(data, colWidths=[1.5 * inch, 4 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 5), colors.HexColor('#f8fafc')),
            ('FONTNAME', (0, 0), (0, 5), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, 5), 'Helvetica'),
            ('FONTSIZE', (0, 0), (1, 5), 10),
            ('GRID', (0, 0), (1, 5), 1, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (1, 5), 'TOP'),
            ('LEFTPADDING', (0, 0), (1, 5), 8),
            ('RIGHTPADDING', (0, 0), (1, 5), 8),
            ('TOPPADDING', (0, 0), (1, 5), 8),
            ('BOTTOMPADDING', (0, 0), (1, 5), 8),
            ('TEXTCOLOR', (1, 1), (1, 1), status_color),  # Status color
        ]))
        
        return table