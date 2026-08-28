import { AssessmentResult } from "@/types/assessment";

// Force production URL to prevent localhost issues
const PRODUCTION_API_URL = "https://pdfassign.onrender.com";

export async function processAssessment(
  questionPaper: File,
  answerSheet: File
): Promise<AssessmentResult> {
  const formData = new FormData();
  formData.append("question_paper", questionPaper);
  formData.append("answer_sheet", answerSheet);

  // Store the answer sheet file for later PDF retrieval
  const answerSheetFile = answerSheet;

  const url = `${PRODUCTION_API_URL}/api/assessment/process`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Error response:', errorText);
    let userMessage = "We couldn't process the assessment. Please try again.";
    
    try {
      const errorJson = JSON.parse(errorText);
      const detail = errorJson.detail || errorText;
      
      // Handle specific HTTP status codes
      if (response.status === 400) {
        if (detail.includes("Invalid question paper format")) {
          userMessage = "The question paper must be a PDF or image file (PNG, JPG).";
        } else if (detail.includes("Invalid answer sheet format")) {
          userMessage = "The answer sheet must be a PDF or image file (PNG, JPG).";
        } else if (detail.includes("size")) {
          userMessage = "The file is too large. Please upload a smaller file.";
        } else if (detail.includes("pages")) {
          userMessage = "The file has too many pages. Please upload a file with fewer pages.";
        } else {
          userMessage = detail;
        }
      } else if (response.status === 422) {
        userMessage = "Invalid request format. Please check your files and try again.";
      } else if (response.status === 404) {
        userMessage = "The assessment service endpoint was not found. Please contact support.";
      } else if (response.status === 500) {
        userMessage = "The assessment service encountered an error. Please try again later.";
      } else {
        userMessage = detail;
      }
    } catch {
      if (response.status === 400) {
        userMessage = "Invalid request. Please check your files and try again.";
      } else if (response.status === 422) {
        userMessage = "Invalid request format. Please check your files and try again.";
      } else if (response.status === 404) {
        userMessage = "The assessment service endpoint was not found. Please contact support.";
      } else if (response.status === 500) {
        userMessage = "The assessment service encountered an error. Please try again later.";
      } else {
        userMessage = "We couldn't process the assessment. Please make sure the files are valid PDFs or images and try again.";
      }
    }
    
    throw new Error(userMessage);
  }

  const result = await response.json();
  
  // Store the assessment ID for PDF retrieval
  (result as any)._assessmentId = result.id;
  (result as any)._answerSheetFile = answerSheetFile;
  
  // Backend processes synchronously, so no polling needed
  return result;
}

export async function getAssessment(assessmentId: string): Promise<AssessmentResult> {
  const response = await fetch(`${PRODUCTION_API_URL}/api/assessment/${assessmentId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment");
  }

  const result = await response.json();
  // Store the assessment ID for PDF retrieval
  (result as any)._assessmentId = assessmentId;
  return result;
}

export async function getAnswerSheetPdf(assessmentId: string): Promise<Blob> {
  const response = await fetch(`${PRODUCTION_API_URL}/api/assessment/${assessmentId}/answer-sheet`);

  if (!response.ok) {
    throw new Error("Failed to fetch answer sheet PDF");
  }

  return response.blob();
}

export async function getAssessmentStatus(assessmentId: string): Promise<{ assessment_id: string; status: string }> {
  const response = await fetch(`${PRODUCTION_API_URL}/api/assessment/${assessmentId}/status`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment status");
  }

  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${PRODUCTION_API_URL}/api/health`);
  return response.json();
}

export async function getAssessmentReport(assessmentId: string): Promise<Blob> {
  const response = await fetch(`${PRODUCTION_API_URL}/api/assessment/${assessmentId}/report`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessment report");
  }

  return response.blob();
}
