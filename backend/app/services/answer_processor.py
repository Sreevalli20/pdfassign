import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import pypdf
import io
import re
from typing import List, Tuple, Optional
from app.schemas.assessment import Answer, AnswerRegion, BoundingBox
import gc


class AnswerProcessor:
    """Process answer sheets to extract answers and regions."""
    
    def __init__(self):
        self.ocr_config = '--psm 6'
    
    def pdf_to_images(self, pdf_bytes: bytes) -> List[Image.Image]:
        """Convert PDF pages to images."""
        try:
            return convert_from_bytes(pdf_bytes)
        except Exception as e:
            print(f"Warning: Could not convert PDF to images (poppler may not be installed): {e}")
            return []
    
    def ocr_image_with_boxes(self, image: Image.Image) -> Tuple[str, List[Tuple[str, int, int, int, int]]]:
        """Extract text and bounding boxes from image."""
        data = pytesseract.image_to_data(image, config=self.ocr_config, output_type=pytesseract.Output.DICT)
        
        text_lines = []
        boxes = []
        
        n_boxes = len(data['text'])
        for i in range(n_boxes):
            text = data['text'][i].strip()
            if text:
                text_lines.append(text)
                x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
                boxes.append((text, x, y, w, h))
        
        return '\n'.join(text_lines), boxes
    
    def extract_answer_labels(self, ocr_text: str) -> List[Tuple[str, int, int, int, int]]:
        """Extract answer labels (e.g., 'Question 1', 'Question 2') from OCR text."""
        labels = []
        
        # Pattern for "Question X" or "Question X -" headers
        question_pattern = r'^Question\s+(\d+)(?:\s*–|\s*-|\s+|$)'
        
        lines = ocr_text.split('\n')
        for line in lines:
            line = line.strip()
            
            match = re.match(question_pattern, line, re.IGNORECASE)
            if match:
                label = match.group(1)
                
                # Filter out obviously invalid numbers
                try:
                    num = int(label)
                    if num > 100:  # Reasonable upper bound
                        continue
                except:
                    pass
                
                # Add the label
                labels.append((label, 0, 0, 0, 0))
        
        return labels
    
    def detect_answer_regions(self, image: Image.Image, labels: List[Tuple[str, int, int, int, int]]) -> List[AnswerRegion]:
        """Detect answer regions based on label positions."""
        regions = []
        width, height = image.size
        
        # Simple heuristic: region below label
        for label, x, y, w, h in labels:
            if x == 0 and y == 0:  # Placeholder
                # Estimate position based on label order
                idx = labels.index((label, x, y, w, h))
                norm_y = min(0.1 + idx * 0.15, 0.85)
                bbox = BoundingBox(x=0.1, y=norm_y, width=0.8, height=0.12)
            else:
                # Convert pixel coordinates to normalized
                norm_x = min(max(x / width, 0), 1)
                norm_y = min(max(y / height, 0), 1)
                norm_w = min(max(w / width, 0), 1)
                norm_h = min(max(h / height, 0), 1)
                # Extend height but ensure it stays within bounds
                extended_height = min(norm_h * 3, 1 - norm_y)
                bbox = BoundingBox(x=norm_x, y=norm_y, width=norm_w, height=extended_height)
            
            regions.append(AnswerRegion(page=1, bbox=bbox))
        
        return regions
    
    def extract_answers(self, pdf_bytes: bytes) -> List[Answer]:
        """Extract answers from answer sheet PDF using text extraction only (faster, no OCR)."""
        # Use only text extraction for speed
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = pypdf.PdfReader(pdf_file)
            total_pages = len(reader.pages)
            
            # Extract text page by page to track which page each question appears on
            page_texts = []
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                page_texts.append((page_num + 1, text))
            
            pdf_file.close()
            del pdf_file
            del reader
            gc.collect()
            
            # Find "Question X" headers and their page ranges
            question_pages = {}  # question_num -> [start_page, end_page]
            current_question = None
            
            for page_num, text in page_texts:
                # Look for "Question X" headers
                question_match = re.search(r'Question\s+(\d+)', text, re.IGNORECASE)
                if question_match:
                    question_num = int(question_match.group(1))
                    if current_question is not None:
                        # End previous question
                        question_pages[current_question] = [
                            question_pages[current_question][0],
                            page_num - 1
                        ]
                    # Start new question
                    current_question = question_num
                    question_pages[question_num] = [page_num, page_num]  # Will update end page later
            
            # Close the last question
            if current_question is not None:
                question_pages[current_question][1] = total_pages
            
            # Create Answer objects from detected question pages
            answers = []
            for question_num, (start_page, end_page) in sorted(question_pages.items()):
                pages = list(range(start_page, end_page + 1))
                
                # Create bounding box for each page
                regions = []
                for page in pages:
                    y_pos = 0.1  # Start of page
                    bbox = BoundingBox(x=0.1, y=y_pos, width=0.8, height=0.8)
                    regions.append(AnswerRegion(page=page, bbox=bbox))
                
                answer = Answer(
                    id=f"a_{question_num}",
                    label=str(question_num),
                    text=f"Answer for question {question_num}",
                    pages=pages,
                    regions=regions,
                    confidence=0.85
                )
                answers.append(answer)
            
            return answers
        except Exception as e:
            print(f"Warning: Could not extract text from PDF: {e}")
            import traceback
            traceback.print_exc()
            return []
