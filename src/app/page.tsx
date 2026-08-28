"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/upload/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProcessingView } from "@/components/processing/ProcessingView";
import { QuestionList } from "@/components/assessment/QuestionList";
import { QuestionDetail } from "@/components/assessment/QuestionDetail";
import { Badge } from "@/components/ui/badge";
import { UnmatchedAnswers } from "@/components/assessment/UnmatchedAnswers";
import {
  UploadedFile,
  AssessmentResult,
  QuestionWithStatus,
  ProcessingStatus,
} from "@/types/assessment";
import { processAssessment, getAssessment, getAssessmentReport } from "@/lib/api";
import { Brain, FileText, Sparkles, ArrowLeft, Settings, HelpCircle, Upload, Search, Highlighter, CheckCircle, Download, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

const AnswerViewer = dynamic(() => import("@/components/assessment/AnswerViewer").then(mod => ({ default: mod.AnswerViewer })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Loading PDF viewer...</div>
});

export default function Home() {
  const [questionPaper, setQuestionPaper] = useState<UploadedFile | null>(null);
  const [answerSheet, setAnswerSheet] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("uploading");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!questionPaper || !answerSheet) return;

    setIsProcessing(true);
    setProcessingStatus("uploading");
    setError(null);
    try {
      const result = await processAssessment(
        questionPaper.file,
        answerSheet.file
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
      const errorMessage = error instanceof Error ? error.message : "Failed to process documents. Please try again.";
      setError(errorMessage);
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


  const handleReset = () => {
    setAssessment(null);
    setSelectedQuestionId(null);
    setQuestionPaper(null);
    setAnswerSheet(null);
    setError(null);
  };

  const handleDownloadReport = async () => {
    if (assessment) {
      try {
        const blob = await getAssessmentReport(assessment.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessment_report_${assessment.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download report:', error);
        alert('Failed to download report. Please try again.');
      }
    }
  };

  const selectedQuestion = assessment?.questions.find(
    (q) => q.question.id === selectedQuestionId
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VedaAI</h1>
                <p className="text-xs text-gray-500 font-medium">AI Assessment Review</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </Button>
              {assessment && (
                <>
                  <Button variant="outline" onClick={handleDownloadReport} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                  <Button variant="outline" onClick={handleReset} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Upload
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!assessment && !isProcessing && (
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                AI-Powered Assessment Review
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                Transform Grading with Intelligent Assessment Analysis
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Upload your question papers and student answer sheets. Our AI extracts questions, 
                maps answers, and provides detailed grading insights in seconds.
              </p>
            </div>

            {/* Upload Cards */}
            <div className="mb-12">
              <div className="grid md:grid-cols-2 gap-8">
                <FileUpload
                  title="Question Paper"
                  description="Upload your assignment or exam paper (PDF, PNG, JPG)"
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
                  description="Upload the student's handwritten or typed answers"
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

              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleProcess}
                  disabled={!questionPaper || !answerSheet}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-16 py-6 text-lg font-semibold shadow-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Process Assessment
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Value Preview Section */}
            <div className="border-t border-gray-100 pt-16">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">01</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Extract Questions</h3>
                  <p className="text-sm text-gray-500">AI reads your question paper</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">02</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Map Answers</h3>
                  <p className="text-sm text-gray-500">Match answers to questions</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Highlighter className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">03</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Highlight Evidence</h3>
                  <p className="text-sm text-gray-500">See exact answer regions</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-400 mb-2">04</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Review Assessment</h3>
                  <p className="text-sm text-gray-500">Navigate and grade easily</p>
                </div>
              </div>
            </div>

            {error && (
              <Card className="mt-8 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-red-900 font-semibold">Processing Error</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleProcess}
                    className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {isProcessing && <ProcessingView status={processingStatus} />}

        {assessment && !isProcessing && (
          <div>
            {/* Assessment Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Review</h2>
              <p className="text-gray-600">Review and grade student answers with AI-powered insights</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-900">{assessment.questions.length}</div>
                  <div className="text-sm text-gray-500">Questions</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-green-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-700">
                    {assessment.questions.filter(q => q.status === "answered").length}
                  </div>
                  <div className="text-sm text-green-600">Answered</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-yellow-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-700">
                    {assessment.questions.filter(q => q.status === "unanswered").length}
                  </div>
                  <div className="text-sm text-yellow-600">Unanswered</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-orange-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-700">
                    {assessment.questions.filter(q => q.status === "needs_review").length}
                  </div>
                  <div className="text-sm text-orange-600">Needs Review</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Assessment Grid */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left Sidebar - Question List */}
              <div className="lg:col-span-3">
                <Card className="shadow-sm border border-gray-200 sticky top-24">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">QUESTIONS</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {assessment.questions.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                    <QuestionList
                      questions={assessment.questions}
                      selectedQuestionId={selectedQuestionId}
                      onSelectQuestion={setSelectedQuestionId}
                    />
                  </CardContent>
                </Card>
                
                {/* Unmatched Answers */}
                {assessment.unmatched_answers.length > 0 && (
                  <Card className="mt-4 shadow-sm border border-yellow-200 bg-yellow-50">
                    <CardHeader className="bg-yellow-100 border-b">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Unmatched Answers
                        <Badge variant="secondary" className="text-xs">
                          {assessment.unmatched_answers.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
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
                  assessmentId={(assessment as any)._assessmentId || assessment.id}
                />
              </div>

              {/* Right Sidebar - Question Detail */}
              <div className="lg:col-span-3">
                {selectedQuestion && (
                  <Card className="shadow-sm border border-gray-200 sticky top-24">
                    <CardHeader className="bg-gray-50 border-b">
                      <CardTitle className="text-base font-semibold">Question Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <QuestionDetail questionWithStatus={selectedQuestion} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
