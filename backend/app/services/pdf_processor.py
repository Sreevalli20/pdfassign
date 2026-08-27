import pypdf
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image
import io
import re
from typing import List, Tuple, Optional
from app.schemas.assessment import Question, BoundingBox


class PDFProcessor:
    """Process PDF question papers and answer sheets."""
    
    def __init__(self):
        self.ocr_config = '--psm 6'  # Assume uniform text block
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF using pypdf."""
        pdf_file = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    def pdf_to_images(self, pdf_bytes: bytes) -> List[Image.Image]:
        """Convert PDF pages to images for OCR."""
        try:
            return convert_from_bytes(pdf_bytes)
        except Exception as e:
            print(f"Warning: Could not convert PDF to images (poppler may not be installed): {e}")
            return []
    
    def ocr_image(self, image: Image.Image) -> str:
        """Extract text from image using Tesseract OCR."""
        return pytesseract.image_to_string(image, config=self.ocr_config)
    
    def extract_questions_from_text(self, text: str, page: int = 1) -> List[Question]:
        """Extract questions from text using improved pattern matching."""
        questions = []
        
        # Split text into lines for better analysis
        lines = text.split('\n')
        
        # Track current question number to detect duplicates
        seen_numbers = set()
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines
            if not line:
                i += 1
                continue
            
            # Pattern for question numbers at start of line
            # Must be: number followed by period/space, then text
            # Avoid matching task lists, page numbers, or other numbered items
            question_match = re.match(r'^(\d+(?:\([a-z]\))?)\.[\s]+(.+)', line)
            
            if question_match:
                number = question_match.group(1)
                question_text = question_match.group(2).strip()
                
                # Skip if this looks like a task/instruction rather than a question
                # Task indicators: "Create", "Write", "Generate", "Implement", etc.
                task_indicators = ['create', 'write', 'generate', 'implement', 'make', 'build', 'develop']
                if any(question_text.lower().startswith(indicator) for indicator in task_indicators):
                    i += 1
                    continue
                
                # Skip if we've already seen this number (avoid duplicates)
                if number in seen_numbers:
                    i += 1
                    continue
                
                # Only accept if it looks like a question (has question words or reasonable length)
                question_words = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'explain', 'describe', 'define', 'compare', 'discuss', 'analyze']
                has_question_word = any(word in question_text.lower() for word in question_words)
                is_reasonable_length = len(question_text) > 10 and len(question_text) < 500
                
                if has_question_word or is_reasonable_length:
                    # Extract sub-part if present
                    sub_part = None
                    if '(' in number and ')' in number:
                        sub_part = number[number.index('(')+1:number.index(')')]
                    
                    # Generate question ID
                    q_id = f"q_{number.replace('(', '_').replace(')', '_').replace('.', '_')}"
                    
                    # Create bounding box (placeholder)
                    y_pos = min(0.1 + len(questions) * 0.03, 0.9)
                    bbox = BoundingBox(x=0.1, y=y_pos, width=0.8, height=0.08)
                    
                    question = Question(
                        id=q_id,
                        number=number,
                        text=question_text[:300] + "..." if len(question_text) > 300 else question_text,
                        page=page,
                        bbox=bbox,
                        confidence=0.85,
                        sub_part=sub_part
                    )
                    questions.append(question)
                    seen_numbers.add(number)
            
            i += 1
        
        return questions
    
    def extract_questions_from_pdf(self, pdf_bytes: bytes) -> List[Question]:
        """Extract questions from PDF combining text extraction and OCR."""
        # First try text extraction
        text = self.extract_text_from_pdf(pdf_bytes)
        questions = self.extract_questions_from_text(text)
        
        # If no questions found, try OCR if available
        if not questions:
            try:
                images = self.pdf_to_images(pdf_bytes)
                for i, image in enumerate(images):
                    try:
                        ocr_text = self.ocr_image(image)
                        page_questions = self.extract_questions_from_text(ocr_text, page=i+1)
                        questions.extend(page_questions)
                    except Exception as e:
                        print(f"Warning: OCR failed on page {i+1}: {e}")
                        continue
            except Exception as e:
                print(f"Warning: Could not perform OCR: {e}")
        
        return questions
