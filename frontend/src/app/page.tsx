"use client";

import { useState } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessingView } from "@/components/processing/ProcessingView";
import { QuestionList } from "@/components/assessment/QuestionList";
import { AnswerViewer } from "@/components/assessment/AnswerViewer";
import { QuestionDetail } from "@/components/assessment/QuestionDetail";
import { Badge } from "@/components/ui/badge";
import {
  UploadedFile,
  AssessmentResult,
  QuestionWithStatus,
} from "@/types/assessment";
import { processAssessment } from "@/lib/api";

export default function Home() {
  const [questionPaper, setQuestionPaper] = useState<UploadedFile | null>(
    null
  );
  const [answerSheet, setAnswerSheet] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [demoMode, setDemoMode] = useState(false);

  const handleProcess = async () => {
    if (!questionPaper || !answerSheet) return;

    setIsProcessing(true);
    try {
      const result = await processAssessment(
        questionPaper.file,
        answerSheet.file,
        demoMode
      );
      setAssessment(result);
      if (result.questions.length > 0) {
        setSelectedQuestionId(result.questions[0].question.id);
      }
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Failed to process documents. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTryDemo = async () => {
    setIsProcessing(true);
    try {
      // Create dummy files for demo mode
      const dummyFile = new File([""], "demo.pdf", { type: "application/pdf" });
      const result = await processAssessment(dummyFile, dummyFile, true);
      setAssessment(result);
      if (result.questions.length > 0) {
        setSelectedQuestionId(result.questions[0].question.id);
      }
    } catch (error) {
      console.error("Demo failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedQuestion = assessment?.questions.find(
    (q) => q.question.id === selectedQuestionId
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">VedaAI</h1>
            <Badge variant="secondary">Assessment Tool</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!assessment && !isProcessing && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <FileUpload
                    title="Question Paper"
                    description="Upload the question paper (PDF or images)"
                    file={questionPaper}
                    onFileSelect={(file) =>
                      setQuestionPaper({
                        file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      })
                    }
                    onFileRemove={() => setQuestionPaper(null)}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  <FileUpload
                    title="Student Answer Sheet"
                    description="Upload the student's handwritten answer sheet"
                    file={answerSheet}
                    onFileSelect={(file) =>
                      setAnswerSheet({
                        file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                      })
                    }
                    onFileRemove={() => setAnswerSheet(null)}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="demo-mode"
                      checked={demoMode}
                      onChange={(e) => setDemoMode(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="demo-mode" className="text-sm text-gray-600">
                      Use Demo Mode
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleTryDemo}>
                      Try Demo
                    </Button>
                    <Button
                      onClick={handleProcess}
                      disabled={!questionPaper || !answerSheet}
                    >
                      Analyze Answer Sheet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {isProcessing && <ProcessingView status="uploading" />}

        {assessment && !isProcessing && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Question List */}
            <div className="lg:col-span-1">
              <QuestionList
                questions={assessment.questions}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={setSelectedQuestionId}
              />
              
              {/* Unmatched Answers Section */}
              {assessment.unmatched_answers.length > 0 && (
                <Card className="mt-4 p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Unmatched Answers ({assessment.unmatched_answers.length})
                  </h4>
                  <div className="space-y-2">
                    {assessment.unmatched_answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2"
                      >
                        <p className="font-medium text-yellow-800">Label: {answer.label}</p>
                        <p className="text-yellow-700 truncate">{answer.text}</p>
                        <p className="text-yellow-600 mt-1">Pages: {answer.pages.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Answer Viewer and Question Detail */}
            <div className="lg:col-span-2 space-y-6">
              {selectedQuestion && (
                <QuestionDetail questionWithStatus={selectedQuestion} />
              )}
              <AnswerViewer
                answer={selectedQuestion?.answer || null}
                totalPages={assessment.total_pages}
                pdfFile={answerSheet?.file}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
