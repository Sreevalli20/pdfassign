# VedaAI Hiring Assignment

A production-quality web application for automated assessment of handwritten answer sheets.

## Features

- **Question Extraction**: Extracts every question from question papers (PDF/images) with original numbering preserved
- **Handwritten Answer Extraction**: Uses OCR/AI to extract handwritten answers from student answer sheets
- **Smart Answer Mapping**: Maps answers to correct questions even when out of order
- **Exact Region Highlighting**: Highlights the exact answer region on the answer sheet
- **Multi-page Support**: Handles answers spanning multiple pages
- **Status Tracking**: Identifies unanswered questions and unmatched answers
- **Demo Mode**: Fully functional demo for evaluation without API keys

## Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for accessible components
- **React PDF** for PDF viewing with region highlighting

### Backend
- **Python 3.14.6** (exact version required)
- **FastAPI** for REST API
- **PyMuPDF** for PDF processing
- **PaddleOCR** for handwritten text extraction
- **OpenAI GPT-4o** for intelligent question/answer processing

## Project Structure

```
/
├── frontend/          # Next.js frontend application
│   ├── app/           # Next.js app directory
│   ├── components/    # Reusable components
│   ├── lib/           # Utilities and types
│   └── public/        # Static assets
├── backend/           # FastAPI backend application
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── models/    # Data models
│   │   ├── services/  # Business logic
│   │   ├── schemas/   # Pydantic schemas
│   │   └── utils/     # Utilities
│   └── tests/         # Backend tests
├── render.yaml        # Render deployment configuration
├── .python-version    # Python version specification
└── README.md
```

## Setup

### Prerequisites
- Node.js 20+
- Python 3.14.6 (for production/Docker)
- Python 3.13 (recommended for local development due to package compatibility)
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Backend
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o
AI_PROVIDER=openai
DEMO_MODE=true  # Set to false to use real AI processing

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Demo Mode

The application includes a comprehensive demo mode that demonstrates:
- Question extraction with sub-parts (11a, 11b)
- Out-of-order answer mapping
- Unanswered question detection
- Unmatched answer handling
- Exact region highlighting
- Multi-page answer support

To use demo mode, set `DEMO_MODE=true` in the backend `.env` file.

## Tests

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Render Deployment

The application is configured for deployment on Render using `render.yaml`.

### Backend Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the `render.yaml` configuration
4. Set environment variables in Render dashboard
5. Deploy

### Frontend Deployment

1. Create a new Static Site or Web Service on Render
2. Connect to the same repository
3. Configure build settings
4. Set `NEXT_PUBLIC_API_URL` to the backend URL
5. Deploy

## API Endpoints

- `POST /api/assessment/process` - Process question paper and answer sheet
- `GET /api/assessment/{id}` - Get assessment results
- `GET /api/assessment/{id}/status` - Get processing status
- `GET /api/assessment/{id}/pages/{page}` - Get answer sheet page image
- `GET /health` - Health check

## How It Works

### Question Extraction
1. PDF text extraction using PyMuPDF
2. OCR for scanned documents using PaddleOCR
3. Hybrid pipeline combining regex, layout analysis, and AI reasoning
4. Preserves original numbering including sub-parts (11a, 11b)
5. Stores bounding boxes for each question

### Answer Extraction
1. Vision-capable AI/OCR for handwritten text
2. Extracts answer labels, text, regions, and page numbers
3. Stores normalized bounding boxes for exact highlighting
4. Supports multi-page answers with multiple regions

### Answer Mapping
1. Priority-based mapping strategy:
   - Explicit handwritten question number
   - OCR-derived labels
   - Structural/layout clues
   - Semantic similarity
   - AI/vision reasoning for ambiguous cases
2. Returns confidence scores for each mapping
3. Handles out-of-order answers correctly
4. Identifies unanswered questions and unmatched answers

### Exact Highlighting
1. Uses normalized coordinates (0-1 range)
2. Renders original page with overlay bounding box
3. Highlight remains correctly positioned on resize/zoom
4. Supports multi-page answer regions

## Assumptions

- Question papers follow standard academic formatting
- Handwritten answers are legible enough for OCR
- Answer sheets are single-sided
- Maximum file size: 50MB per document
- Supported formats: PDF, PNG, JPG, JPEG

## Important Limitations

- **Python 3.14.6 Compatibility**: Python 3.14 is very new and some packages (Pydantic, PyO3) do not yet support it. For local development, use Python 3.13. For production deployment, use Docker which guarantees Python 3.14.6 compatibility.
- OCR accuracy depends on handwriting quality
- Complex multi-column layouts may require manual review
- Very large documents may have longer processing times
- Demo mode uses static data, not real AI processing

## Live URL

[Will be added after deployment]

## License

MIT
