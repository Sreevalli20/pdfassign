import { AssessmentResult } from "@/types/assessment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://pdfassign.onrender.com";

export async function processAssessment(
  questionPaper: File,
  answerSheet: File
): Promise<AssessmentResult> {
  const formData = new FormData();
  formData.append("question_paper", questionPaper);
  formData.append("answer_sheet", answerSheet);
  formData.append("demo_mode", "false");

  // Store the answer sheet file for later PDF retrieval
  const answerSheetFile = answerSheet;

  const url = `${API_URL}/api/assessment/process`;
  console.log('[API] POST request to:', url);
  console.log('[API] FormData fields:', Array.from(formData.keys()));
  console.log('[API] Question paper:', questionPaper.name, questionPaper.type, questionPaper.size);
  console.log('[API] Answer sheet:', answerSheet.name, answerSheet.type, answerSheet.size);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  console.log('[API] Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Error response:', errorText);
    let userMessage = "We couldn't process the assessment. Please try again.";
    
    try {
      const errorJson = JSON.parse(errorText);
      const detail = errorJson.detail || errorText;
      
      // Provide user-friendly messages for common errors
      if (detail.includes("Invalid question paper format")) {
        userMessage = "The question paper must be a PDF or image file (PNG, JPG).";
      } else if (detail.includes("Invalid answer sheet format")) {
        userMessage = "The answer sheet must be a PDF or image file (PNG, JPG).";
      } else if (detail.includes("size")) {
        userMessage = "The file is too large. Please upload a smaller file.";
      } else if (detail.includes("timeout")) {
        userMessage = "Processing took too long. Please try with smaller files.";
      } else {
        userMessage = detail;
      }
    } catch {
      userMessage = "We couldn't process the assessment. Please make sure the files are valid PDFs or images and try again.";
    }
    
    throw new Error(userMessage);
  }

  const result = await response.json();
  console.log('[API] Response result:', result);
  
  // Store the assessment ID for PDF retrieval
  (result as any)._assessmentId = result.id;
  (result as any)._answerSheetFile = answerSheetFile;
  
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
    
    const url = `${API_URL}/api/assessment/${assessmentId}`;
    console.log(`[API] Polling attempt ${attempts + 1}/${maxAttempts}:`, url);
    
    const response = await fetch(url);
    console.log(`[API] Poll status:`, response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Poll error:', errorText);
      throw new Error(`Failed to fetch assessment status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`[API] Poll result:`, result.status);
    
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

  const result = await response.json();
  // Store the assessment ID for PDF retrieval
  (result as any)._assessmentId = assessmentId;
  return result;
}

export async function getAnswerSheetPdf(assessmentId: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/assessment/${assessmentId}/answer-sheet`);

  if (!response.ok) {
    throw new Error("Failed to fetch answer sheet PDF");
  }

  return response.blob();
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

export async function getAssessmentReport(assessmentId: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/assessment/${assessmentId}/report`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment report");
  }

  return response.blob();
}
