import pypdf
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image
import io
import re
from typing import List, Tuple, Optional, Set
from app.schemas.assessment import Question, BoundingBox
import gc


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
    
    def extract_questions_from_text(self, text: str, page: int = 1, seen_numbers: Set[str] = None) -> List[Question]:
        """Extract questions from text using improved pattern matching for task-based questions."""
        if seen_numbers is None:
            seen_numbers = set()
            
        questions = []
        
        # Split text into lines for better analysis
        lines = text.split('\n')
        
        # Track assignment context
        current_assignment = None
        assignment_number = 0
        in_tasks_section = False
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines
            if not line:
                i += 1
                continue
            
            # Detect assignment headers (e.g., "Assignment 1:", "Assignment 2:")
            assignment_match = re.match(r'^Assignment\s+(\d+):', line, re.IGNORECASE)
            if assignment_match:
                assignment_number = int(assignment_match.group(1))
                current_assignment = assignment_number
                in_tasks_section = False
                i += 1
                continue
            
            # Detect "Tasks:" section header
            if line.lower() == 'tasks:':
                in_tasks_section = True
                i += 1
                continue
            
            # Pattern for task numbers at start of line (in Tasks sections)
            # Format: "1. " or "2. " followed by task description
            task_match = re.match(r'^(\d+)\.\s+(.+)', line)
            
            if task_match and current_assignment and in_tasks_section:
                task_number = int(task_match.group(1))
                task_text = task_match.group(2).strip()
                
                # Create composite question number (e.g., "1.1", "1.2" for Assignment 1, tasks 1-6)
                composite_number = f"{current_assignment}.{task_number}"
                
                # Skip if we've already seen this composite number
                if composite_number in seen_numbers:
                    i += 1
                else:
                    # Get full task text (may span multiple lines)
                    full_text = task_text
                    j = i + 1
                    while j < len(lines) and lines[j].strip() and not re.match(r'^\d+\.', lines[j].strip()):
                        full_text += " " + lines[j].strip()
                        j += 1
                    
                    # Generate question ID
                    q_id = f"q_{current_assignment}_{task_number}"
                    
                    # Create bounding box (placeholder)
                    y_pos = min(0.1 + len(questions) * 0.03, 0.9)
                    bbox = BoundingBox(x=0.1, y=y_pos, width=0.8, height=0.08)
                    
                    question = Question(
                        id=q_id,
                        number=composite_number,
                        text=full_text[:300] + "..." if len(full_text) > 300 else full_text,
                        page=page,
                        bbox=bbox,
                        confidence=0.85,
                        sub_part=None
                    )
                    questions.append(question)
                    seen_numbers.add(composite_number)
                    i = j
            else:
                i += 1
        
        return questions
    
    def extract_questions_from_pdf(self, pdf_bytes: bytes) -> List[Question]:
        """Extract questions from PDF using text extraction only (faster, no OCR)."""
        # Extract text page by page to track page numbers
        pdf_file = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(pdf_file)
        
        all_questions = []
        seen_numbers = set()  # Track seen numbers across all pages
        
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            page_questions = self.extract_questions_from_text(text, page_num + 1, seen_numbers)
            all_questions.extend(page_questions)
        
        pdf_file.close()
        del pdf_file
        del reader
        gc.collect()
        
        return all_questions
