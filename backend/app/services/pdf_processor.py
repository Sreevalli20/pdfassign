import pypdf
import io
import re
from typing import List, Set
from app.schemas.assessment import Question, BoundingBox
import gc


class PDFProcessor:
    """Process PDF question papers and answer sheets."""
    
    def __init__(self):
        pass
    
    def extract_questions_from_text(self, text: str, page: int = 1, seen_numbers: Set[str] = None) -> List[Question]:
        """Extract questions from text by detecting Assignment headers as main questions."""
        if seen_numbers is None:
            seen_numbers = set()
            
        questions = []
        
        # Split text into lines for better analysis
        lines = text.split('\n')
        
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
                assignment_label = str(assignment_number)
                
                # Skip if we've already seen this assignment number
                if assignment_label in seen_numbers:
                    i += 1
                    continue
                
                # Get full assignment text (may span multiple lines until next assignment or end)
                full_text = line
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip()
                    # Stop at next assignment header
                    if re.match(r'^Assignment\s+\d+:', next_line, re.IGNORECASE):
                        break
                    # Stop at empty line followed by next assignment
                    if not next_line and j + 1 < len(lines) and re.match(r'^Assignment\s+\d+:', lines[j + 1].strip(), re.IGNORECASE):
                        break
                    full_text += "\n" + lines[j]
                    j += 1
                
                # Generate question ID
                q_id = f"q_{assignment_number}"
                
                # Create bounding box (placeholder)
                y_pos = min(0.1 + len(questions) * 0.03, 0.9)
                bbox = BoundingBox(x=0.1, y=y_pos, width=0.8, height=0.08)
                
                # Truncate text if too long
                display_text = full_text[:400] + "..." if len(full_text) > 400 else full_text
                
                question = Question(
                    id=q_id,
                    number=assignment_label,
                    text=display_text,
                    page=page,
                    bbox=bbox,
                    confidence=0.90,
                    sub_part=None
                )
                questions.append(question)
                seen_numbers.add(assignment_label)
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
