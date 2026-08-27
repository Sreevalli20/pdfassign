import { AssessmentResult } from "@/types/assessment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mock demo data for frontend-only demo mode
const mockDemoAssessment: AssessmentResult = {
  id: "demo-123",
  status: "completed",
  questions: [
    {
      question: {
        id: "q_1",
        number: "1",
        text: "Define photosynthesis and explain its importance in the ecosystem.",
        page: 1,
        bbox: { x: 0.10, y: 0.15, width: 0.80, height: 0.12 },
        confidence: 0.98
      },
      status: "answered",
      mapping: {
        question_id: "q_1",
        answer_id: "a_1",
        confidence: 0.94,
        mapping_method: "explicit_label"
      },
      answer: {
        id: "a_1",
        label: "1",
        text: "Photosynthesis is the biological process used by plants and other organisms to convert light energy into chemical energy...",
        pages: [2],
        regions: [{ page: 2, bbox: { x: 0.08, y: 0.10, width: 0.82, height: 0.22 } }],
        confidence: 0.94
      }
    },
    {
      question: {
        id: "q_2",
        number: "2",
        text: "Explain the process of cellular respiration in plants.",
        page: 1,
        bbox: { x: 0.10, y: 0.30, width: 0.80, height: 0.10 },
        confidence: 0.97
      },
      status: "unanswered",
      mapping: undefined,
      answer: undefined
    },
    {
      question: {
        id: "q_3a",
        number: "3(a)",
        text: "What is the chemical equation for photosynthesis?",
        page: 2,
        bbox: { x: 0.10, y: 0.15, width: 0.75, height: 0.08 },
        confidence: 0.96,
        sub_part: "a"
      },
      status: "answered",
      mapping: {
        question_id: "q_3a",
        answer_id: "a_3a",
        confidence: 0.95,
        mapping_method: "explicit_label"
      },
      answer: {
        id: "a_3a",
        label: "3(a)",
        text: "6CO2 + 6H2O + light energy → C6H12O6 + 6O2",
        pages: [4, 5],
        regions: [
          { page: 4, bbox: { x: 0.08, y: 0.40, width: 0.82, height: 0.10 } },
          { page: 5, bbox: { x: 0.08, y: 0.08, width: 0.82, height: 0.08 } }
        ],
        confidence: 0.95
      }
    },
    {
      question: {
        id: "q_3b",
        number: "3(b)",
        text: "Explain the role of chlorophyll in photosynthesis.",
        page: 2,
        bbox: { x: 0.10, y: 0.25, width: 0.75, height: 0.08 },
        confidence: 0.95,
        sub_part: "b"
      },
      status: "answered",
      mapping: {
        question_id: "q_3b",
        answer_id: "a_3b",
        confidence: 0.90,
        mapping_method: "explicit_label"
      },
      answer: {
        id: "a_3b",
        label: "3(b)",
        text: "Chlorophyll is a green pigment found in plants that absorbs light energy...",
        pages: [5],
        regions: [{ page: 5, bbox: { x: 0.08, y: 0.20, width: 0.82, height: 0.18 } }],
        confidence: 0.90
      }
    },
    {
      question: {
        id: "q_4",
        number: "4",
        text: "Describe the light-dependent reactions of photosynthesis.",
        page: 2,
        bbox: { x: 0.10, y: 0.38, width: 0.80, height: 0.12 },
        confidence: 0.97
      },
      status: "answered",
      mapping: {
        question_id: "q_4",
        answer_id: "a_4",
        confidence: 0.93,
        mapping_method: "explicit_label"
      },
      answer: {
        id: "a_4",
        label: "4",
        text: "The light-dependent reactions occur in the thylakoid membranes...",
        pages: [4],
        regions: [{ page: 4, bbox: { x: 0.08, y: 0.10, width: 0.82, height: 0.24 } }],
        confidence: 0.93
      }
    },
    {
      question: {
        id: "q_5",
        number: "5",
        text: "Compare and contrast photosynthesis and respiration.",
        page: 3,
        bbox: { x: 0.10, y: 0.15, width: 0.80, height: 0.12 },
        confidence: 0.98
      },
      status: "answered",
      mapping: {
        question_id: "q_5",
        answer_id: "a_5",
        confidence: 0.91,
        mapping_method: "explicit_label"
      },
      answer: {
        id: "a_5",
        label: "5",
        text: "While both processes involve energy transformation, photosynthesis builds glucose...",
        pages: [3],
        regions: [{ page: 3, bbox: { x: 0.08, y: 0.12, width: 0.82, height: 0.28 } }],
        confidence: 0.91
      }
    }
  ],
  unmatched_answers: [
    {
      id: "a_unmatched",
      label: "99",
      text: "This is an unclear answer that cannot be matched to any question.",
      pages: [6],
      regions: [{ page: 6, bbox: { x: 0.08, y: 0.10, width: 0.82, height: 0.15 } }],
      confidence: 0.75
    }
  ],
  total_pages: 6,
  processing_time_seconds: 2.5
};

export async function processAssessment(
  questionPaper: File,
  answerSheet: File,
  demoMode: boolean = false
): Promise<AssessmentResult> {
  // For demo mode, return mock data without calling backend
  if (demoMode) {
    return mockDemoAssessment;
  }

  const formData = new FormData();
  formData.append("question_paper", questionPaper);
  formData.append("answer_sheet", answerSheet);
  formData.append("demo_mode", "false");

  const response = await fetch(`${API_URL}/api/assessment/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to process assessment");
  }

  const result = await response.json();
  
  // Poll for completion if status is not completed
  if (result.status !== "completed" && result.status !== "failed") {
    return await pollForCompletion(result.id);
  }
  
  return result;
}

async function pollForCompletion(assessmentId: string): Promise<AssessmentResult> {
  const maxAttempts = 60; // 2 minutes with 2-second intervals
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`${API_URL}/api/assessment/${assessmentId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch assessment status");
    }
    
    const result = await response.json();
    
    if (result.status === "completed" || result.status === "failed") {
      return result;
    }
    
    attempts++;
  }
  
  throw new Error("Assessment processing timed out");
}

export async function getAssessment(assessmentId: string): Promise<AssessmentResult> {
  const response = await fetch(`${API_URL}/api/assessment/${assessmentId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment");
  }

  return response.json();
}

export async function getAssessmentStatus(assessmentId: string): Promise<{ assessment_id: string; status: string }> {
  const response = await fetch(`${API_URL}/api/assessment/${assessmentId}/status`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment status");
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/api/health`);
  return response.json();
}
