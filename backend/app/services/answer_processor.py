import pypdf
import io
import re
from typing import List
from app.schemas.assessment import Answer, AnswerRegion, BoundingBox
import gc


class AnswerProcessor:
    """Process answer sheets to extract answers and regions."""
    
    def __init__(self):
        pass
    
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
            question_pages = {}  # question_num -> [start_page, end_page, text_snippet]
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
                            page_num - 1,
                            question_pages[current_question][2]
                        ]
                    # Start new question
                    current_question = question_num
                    # Extract a snippet of text for the answer
                    text_snippet = text[:200].replace('\n', ' ') if text else ""
                    question_pages[question_num] = [page_num, page_num, text_snippet]
            
            # Close the last question
            if current_question is not None:
                question_pages[current_question][1] = total_pages
            
            # Create Answer objects from detected question pages
            answers = []
            for question_num, (start_page, end_page, text_snippet) in sorted(question_pages.items()):
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
                    text=text_snippet or f"Answer for question {question_num}",
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
