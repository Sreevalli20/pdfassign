import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
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
        return convert_from_bytes(pdf_bytes)
    
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
        
        # Pattern for answer labels
        label_pattern = r'^(\d+(?:\([a-z]\))?)\s*[\.:]?\s*$'
        
        lines = ocr_text.split('\n')
        for line in lines:
            match = re.match(label_pattern, line.strip())
            if match:
                labels.append((match.group(1), 0, 0, 0, 0))  # Placeholder coordinates
        
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
                norm_y = 0.1 + idx * 0.15
                bbox = BoundingBox(x=0.1, y=norm_y, width=0.8, height=0.12)
            else:
                # Convert pixel coordinates to normalized
                norm_x = x / width
                norm_y = y / height
                norm_w = w / width
                norm_h = h / height
                bbox = BoundingBox(x=norm_x, y=norm_y, width=norm_w, height=norm_h * 3)  # Extend height
            
            regions.append(AnswerRegion(page=1, bbox=bbox))
        
        return regions
    
    def extract_answers(self, pdf_bytes: bytes) -> List[Answer]:
        """Extract answers from answer sheet PDF."""
        images = self.pdf_to_images(pdf_bytes)
        answers = []
        answer_id = 0
        
        for page_num, image in enumerate(images, start=1):
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
        
        return answers
