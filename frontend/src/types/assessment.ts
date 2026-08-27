export type ProcessingStatus = 
  | "uploading"
  | "reading_question_paper"
  | "extracting_questions"
  | "reading_answers"
  | "detecting_regions"
  | "mapping_answers"
  | "preparing_assessment"
  | "completed"
  | "failed";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Question {
  id: string;
  number: string;
  text: string;
  page: number;
  bbox?: BoundingBox;
  confidence: number;
  sub_part?: string;
}

export interface AnswerRegion {
  page: number;
  bbox: BoundingBox;
}

export interface Answer {
  id: string;
  label: string;
  text?: string;
  pages: number[];
  regions: AnswerRegion[];
  confidence: number;
}

export type MappingMethod = 
  | "explicit_label"
  | "ocr_derived"
  | "structural"
  | "semantic"
  | "ai_reasoning";

export interface AnswerMapping {
  question_id: string;
  answer_id?: string;
  confidence: number;
  mapping_method?: MappingMethod;
}

export type QuestionStatus = "answered" | "unanswered" | "needs_review";
export type AnswerStatus = "mapped" | "unmatched" | "needs_review";

export interface QuestionWithStatus {
  question: Question;
  status: QuestionStatus;
  mapping?: AnswerMapping;
  answer?: Answer;
}

export interface AssessmentResult {
  id: string;
  status: ProcessingStatus;
  questions: QuestionWithStatus[];
  unmatched_answers: Answer[];
  total_pages: number;
  processing_time_seconds?: number;
  error?: string;
}

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
}
