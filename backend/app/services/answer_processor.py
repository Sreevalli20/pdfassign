import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import pypdf
import io
import re
from typing import List, Tuple, Optional
from app.schemas.assessment import Answer, AnswerRegion, BoundingBox


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
        """Extract answer labels (e.g., '1', '2', '3(a)') from OCR text."""
        labels = []
        
        # Pattern for answer labels - match numbers that might be followed by parentheses
        label_pattern = r'(\d+(?:\([a-z]\))?)\s*[\.:]?\s*$'
        
        lines = ocr_text.split('\n')
        for line in lines:
            match = re.match(label_pattern, line.strip())
            if match:
                labels.append((match.group(1), 0, 0, 0, 0))  # Placeholder coordinates
        
        # If no labels found, try a more lenient pattern
        if not labels:
            label_pattern = r'(\d+(?:\([a-z]\))?)'
            for line in lines:
                match = re.search(label_pattern, line.strip())
                if match:
                    label = match.group(1)
                    # Only add if it's likely a question number (short, at start of line)
                    if len(line.strip()) < 20 and line.strip().startswith(label):
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
        """Extract answers from answer sheet PDF."""
        # First try to get text directly from PDF
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = pypdf.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            # Extract answer labels from text
            labels = self.extract_answer_labels(text)
            
            if labels:
                answers = []
                answer_id = 0
                total_pages = len(reader.pages)
                
                for i, (label, _, _, _, _) in enumerate(labels):
                    answer_id += 1
                    # Distribute answers across pages
                    page_num = (i % total_pages) + 1 if total_pages > 0 else 1
                    
                    # Create bounding box based on position
                    y_pos = min(0.1 + i * 0.08, 0.85)
                    bbox = BoundingBox(x=0.1, y=y_pos, width=0.8, height=0.15)
                    
                    answer = Answer(
                        id=f"a_{answer_id}",
                        label=label,
                        text=f"Answer for question {label}",
                        pages=[page_num],
                        regions=[AnswerRegion(page=page_num, bbox=bbox)],
                        confidence=0.70
                    )
                    answers.append(answer)
                
                return answers
        except Exception as e:
            print(f"Warning: Could not extract text from PDF: {e}")
        
        # Fallback to OCR if available
        try:
            images = self.pdf_to_images(pdf_bytes)
        except Exception as e:
            print(f"Warning: Could not convert PDF to images: {e}")
            return []
        
        answers = []
        answer_id = 0
        
        for page_num, image in enumerate(images, start=1):
            try:
                ocr_text, boxes = self.ocr_image_with_boxes(image)
                labels = self.extract_answer_labels(ocr_text)
                regions = self.detect_answer_regions(image, labels)
                
                for i, (label, _, _, _, _) in enumerate(labels):
                    answer_id += 1
                    answer = Answer(
                        id=f"a_{answer_id}",
                        label=label,
                        text=ocr_text[:100] + "..." if len(ocr_text) > 100 else ocr_text,
                        pages=[page_num],
                        regions=[regions[i]] if i < len(regions) else [],
                        confidence=0.75
                    )
                    answers.append(answer)
            except Exception as e:
                print(f"Warning: Failed to process page {page_num}: {e}")
                continue
        
        return answers
