"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessingView } from "@/components/processing/ProcessingView";
import { QuestionList } from "@/components/assessment/QuestionList";
import { AnswerViewer } from "@/components/assessment/AnswerViewer";
import { QuestionDetail } from "@/components/assessment/QuestionDetail";
import { Badge } from "@/components/ui/badge";
import { UnmatchedAnswers } from "@/components/assessment/UnmatchedAnswers";
import {
  UploadedFile,
  AssessmentResult,
  QuestionWithStatus,
  ProcessingStatus,
} from "@/types/assessment";
import { processAssessment, getAssessment } from "@/lib/api";
import { Brain, FileText, Sparkles, ArrowLeft } from "lucide-react";

export default function Home() {
  const [questionPaper, setQuestionPaper] = useState<UploadedFile | null>(null);
  const [answerSheet, setAnswerSheet] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("uploading");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!questionPaper || !answerSheet) return;

    setIsProcessing(true);
    setProcessingStatus("uploading");
    setError(null);
    try {
      const result = await processAssessment(
        questionPaper.file,
        answerSheet.file,
        demoMode
      );
      
      // If result is not completed, poll for completion
      if (result.status !== "completed" && result.status !== "failed") {
        setAssessment(result);
        await pollForCompletion(result.id);
      } else {
        setAssessment(result);
        if (result.questions.length > 0) {
          setSelectedQuestionId(result.questions[0].question.id);
        }
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Processing failed:", error);
      setError("Failed to process documents. Please try again.");
      setIsProcessing(false);
    }
  };

  const pollForCompletion = async (assessmentId: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const result = await getAssessment(assessmentId);
        setAssessment(result);
        setProcessingStatus(result.status);
        
        if (result.status === "completed" || result.status === "failed") {
          if (result.status === "completed" && result.questions.length > 0) {
            setSelectedQuestionId(result.questions[0].question.id);
          }
          setIsProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Polling failed:", error);
      }
      
      attempts++;
    }
    
    setError("Processing timed out. Please try again.");
    setIsProcessing(false);
  };

  const handleTryDemo = async () => {
    setIsProcessing(true);
    setProcessingStatus("uploading");
    setError(null);
    try {
      const dummyFile = new File([""], "demo.pdf", { type: "application/pdf" });
      const result = await processAssessment(dummyFile, dummyFile, true);
      setAssessment(result);
      if (result.questions.length > 0) {
        setSelectedQuestionId(result.questions[0].question.id);
      }
      setIsProcessing(false);
    } catch (error) {
      console.error("Demo failed:", error);
      setError("Demo failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAssessment(null);
    setSelectedQuestionId(null);
    setQuestionPaper(null);
    setAnswerSheet(null);
    setError(null);
  };

  const selectedQuestion = assessment?.questions.find(
    (q) => q.question.id === selectedQuestionId
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">VedaAI</h1>
                <p className="text-xs text-gray-500">AI-Powered Assessment</p>
              </div>
            </div>
            {assessment && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                New Assessment
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!assessment && !isProcessing && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Assessment Tool
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Automated Answer Sheet Grading
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload question papers and student answer sheets to automatically extract, 
                map, and grade handwritten answers with AI-powered precision.
              </p>
            </div>

            {/* Upload Cards */}
            <Card className="mb-8 shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="demo-mode"
                        checked={demoMode}
                        onChange={(e) => setDemoMode(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="demo-mode" className="text-sm text-gray-700 font-medium">
                        Demo Mode (sample data)
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleTryDemo} className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Try Demo
                      </Button>
                      <Button
                        onClick={handleProcess}
                        disabled={!questionPaper || !answerSheet}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Process Assessment
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="mb-8 border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {isProcessing && <ProcessingView status={processingStatus} />}

        {assessment && !isProcessing && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Question List */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg border-0 sticky top-24">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Questions</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {assessment.questions.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <QuestionList
                    questions={assessment.questions}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={setSelectedQuestionId}
                  />
                </CardContent>
              </Card>
              
              {/* Unmatched Answers */}
              {assessment.unmatched_answers.length > 0 && (
                <Card className="mt-4 shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Unmatched Answers
                      <Badge variant="secondary" className="text-xs">
                        {assessment.unmatched_answers.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <UnmatchedAnswers answers={assessment.unmatched_answers} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center - PDF Viewer */}
            <div className="lg:col-span-6">
              <AnswerViewer
                answer={selectedQuestion?.answer || null}
                totalPages={assessment.total_pages}
                pdfFile={answerSheet?.file}
              />
            </div>

            {/* Right Sidebar - Question Detail */}
            <div className="lg:col-span-3">
              {selectedQuestion && (
                <Card className="shadow-lg border-0 sticky top-24">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-lg">Question Details</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <QuestionDetail questionWithStatus={selectedQuestion} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
