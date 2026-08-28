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
import { processAssessment, getAssessmentReport } from "@/lib/api";
import { Brain, FileText, Sparkles, ArrowLeft, Settings, HelpCircle, Upload, Search, Highlighter, CheckCircle, Download, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
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
      
      // Backend processes synchronously, so result is immediately available
      setAssessment(result);
      if (result.questions.length > 0) {
        setSelectedQuestionId(result.questions[0].question.id);
      }
      setIsProcessing(false);
    } catch (error) {
      console.error("Processing failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process documents. Please try again.";
      setError(errorMessage);
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
    <main className="min-h-screen bg-[#FAF9FC]">
      {/* Header */}
      <header className="bg-white border-b-2 border-purple-200 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-[#6D28D9] to-[#F97316] rounded-xl flex items-center justify-center shadow-xl border-2 border-purple-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-[#6D28D9] tracking-tight">Veda</span>
                    <span className="text-4xl font-extrabold text-[#F97316] tracking-tight">AI</span>
                  </div>
                  <p className="text-sm font-bold text-[#6B6480] tracking-wide uppercase">AI Assessment Review</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-[#6B6480] hover:text-[#7C3AED] hover:bg-purple-50 border border-transparent hover:border-purple-200">
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-[#6B6480] hover:text-[#7C3AED] hover:bg-purple-50 border border-transparent hover:border-purple-200">
                <Settings className="w-5 h-5" />
              </Button>
              {assessment && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadReport} 
                    className="gap-2 border-2 border-purple-500 text-purple-700 hover:bg-purple-50 font-bold shadow-sm hover:shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleReset} 
                    className="gap-2 border-2 border-purple-500 text-purple-700 hover:bg-purple-50 font-bold shadow-sm hover:shadow-md"
                  >
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
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-purple-100 text-purple-700 px-6 py-3 rounded-full text-sm font-bold mb-8 border-2 border-purple-300 shadow-sm">
                <Brain className="w-5 h-5" />
                AI-Powered Assessment Review
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-[#18122B] mb-8 tracking-tight leading-tight">
                <span className="text-[#6D28D9]">AI-Powered</span> Assessment Review
              </h1>
              <p className="text-xl md:text-2xl text-[#6B6480] max-w-4xl mx-auto leading-relaxed font-medium">
                Upload question papers and answer sheets, automatically map answers, review evidence, and generate comprehensive assessment reports.
              </p>
            </div>

            {/* Upload Cards */}
            <div className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  disabled={!questionPaper || !answerSheet || isProcessing}
                  size="lg"
                  className="bg-[#F97316] text-white border-4 border-[#EA580C] hover:bg-[#EA580C] hover:border-[#C2410C] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:border-gray-400 disabled:text-white px-16 py-8 text-xl font-extrabold shadow-2xl hover:shadow-2xl rounded-2xl transition-all disabled:border-gray-300 transform hover:scale-105 disabled:hover:scale-100 ring-4 ring-orange-300 hover:ring-orange-400"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-3" />
                      Process Assessment
                      <ChevronRight className="w-6 h-6 ml-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Value Preview Section */}
            <div className="border-t border-purple-100 pt-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-sm font-semibold text-[#6B6480] mb-2">01</div>
                  <h3 className="font-semibold text-[#18122B] mb-1">Extract Questions</h3>
                  <p className="text-sm text-[#6B6480]">AI reads your question paper</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-sm font-semibold text-[#6B6480] mb-2">02</div>
                  <h3 className="font-semibold text-[#18122B] mb-1">Map Answers</h3>
                  <p className="text-sm text-[#6B6480]">Match answers to questions</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Highlighter className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-sm font-semibold text-[#6B6480] mb-2">03</div>
                  <h3 className="font-semibold text-[#18122B] mb-1">Highlight Evidence</h3>
                  <p className="text-sm text-[#6B6480]">See exact answer regions</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-sm font-semibold text-[#6B6480] mb-2">04</div>
                  <h3 className="font-semibold text-[#18122B] mb-1">Review Assessment</h3>
                  <p className="text-sm text-[#6B6480]">Navigate and grade easily</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-purple-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#6D28D9] to-[#F97316] rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-[#6D28D9]">Veda</span>
                <span className="text-lg font-bold text-[#F97316]">AI</span>
              </div>
              <p className="text-sm text-[#6B6480]">
                AI-Powered Assessment Review System
              </p>
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
              <h2 className="text-3xl font-bold text-[#18122B] mb-2">Assessment Review</h2>
              <p className="text-[#6B6480]">Review and grade student answers with AI-powered insights</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-2 border-purple-300 shadow-md bg-white border-t-4 border-t-[#6D28D9]">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-[#18181B]">{assessment.questions.length}</div>
                  <div className="text-sm font-bold text-[#71717A] mt-1">Total Questions</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-400 shadow-md bg-white border-t-4 border-t-green-600">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-green-700">
                    {assessment.questions.filter(q => q.status === "answered").length}
                  </div>
                  <div className="text-sm font-bold text-green-600 mt-1">Correct</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-orange-400 shadow-md bg-white border-t-4 border-t-[#F97316]">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-[#F97316]">
                    {assessment.questions.filter(q => q.status === "partially_correct").length}
                  </div>
                  <div className="text-sm font-bold text-[#F97316] mt-1">Partial</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-400 shadow-md bg-white border-t-4 border-t-red-600">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-red-700">
                    {assessment.questions.filter(q => q.status === "incorrect").length}
                  </div>
                  <div className="text-sm font-bold text-red-600 mt-1">Incorrect</div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-2 border-gray-300 shadow-md bg-white border-t-4 border-t-gray-500">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-gray-700">
                    {assessment.questions.filter(q => q.status === "unanswered").length}
                  </div>
                  <div className="text-sm font-bold text-gray-600 mt-1">Unanswered</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-400 shadow-md bg-white border-t-4 border-[#6D28D9]">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-[#6D28D9]">
                    {assessment.questions.filter(q => q.status === "unable_to_determine").length}
                  </div>
                  <div className="text-sm font-bold text-[#6D28D9] mt-1">Unable to Determine</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-300 shadow-md bg-white border-t-4 border-t-[#6D28D9]">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-[#18181B]">
                    {(() => {
                      const totalScore = assessment.questions.reduce((sum, q) => sum + (q.grading_info?.score || 0), 0);
                      const count = assessment.questions.filter(q => q.grading_info?.score !== undefined).length;
                      return count > 0 ? (totalScore / count).toFixed(1) : "0";
                    })()}%
                  </div>
                  <div className="text-sm font-bold text-[#71717A] mt-1">Average Score</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-300 shadow-md bg-white border-t-4 border-t-green-600">
                <CardContent className="p-4">
                  <div className="text-3xl font-extrabold text-green-700">
                    {assessment.completeness_analysis?.completion_rate.toFixed(1) || "0"}%
                  </div>
                  <div className="text-sm font-bold text-green-600 mt-1">Completion Rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Overall Score Card */}
            <div className="mb-8">
              <Card className="border-2 border-purple-300 shadow-md bg-gradient-to-r from-purple-50 to-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#18181B] mb-2">Overall Assessment Score</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-extrabold text-[#6D28D9]">
                          {(() => {
                            const totalScore = assessment.questions.reduce((sum, q) => sum + (q.grading_info?.score || 0), 0);
                            const count = assessment.questions.filter(q => q.grading_info?.score !== undefined).length;
                            return count > 0 ? (totalScore / count).toFixed(1) : "0";
                          })()}%
                        </div>
                        <div className="text-sm font-bold text-[#71717A]">
                          Grade: {(() => {
                            const totalScore = assessment.questions.reduce((sum, q) => sum + (q.grading_info?.score || 0), 0);
                            const count = assessment.questions.filter(q => q.grading_info?.score !== undefined).length;
                            const avgScore = count > 0 ? (totalScore / count) : 0;
                            if (avgScore >= 90) return "A+";
                            if (avgScore >= 80) return "A";
                            if (avgScore >= 70) return "B+";
                            if (avgScore >= 60) return "B";
                            if (avgScore >= 50) return "C";
                            return "D";
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="w-24 h-24 bg-gradient-to-br from-[#6D28D9] to-[#F97316] rounded-full flex items-center justify-center shadow-xl">
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="border-2 border-purple-300 shadow-md bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#18181B]">
                        {assessment.completeness_analysis?.completion_rate.toFixed(1) || "0"}%
                      </div>
                      <div className="text-sm font-bold text-[#71717A]">Completion Rate</div>
                    </div>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all" 
                      style={{ width: `${assessment.completeness_analysis?.completion_rate || 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-bold text-purple-700 mt-2">
                    {assessment.completeness_analysis?.assessment || "Calculating..."}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-300 shadow-md bg-gradient-to-br from-orange-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#18181B]">{assessment.total_pages}</div>
                      <div className="text-sm font-bold text-[#71717A]">Total Pages</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-[#71717A]">
                    Answer sheet contains {assessment.total_pages} pages
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-300 shadow-md bg-gradient-to-br from-green-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#18181B]">{assessment.unmatched_answers.length}</div>
                      <div className="text-sm font-bold text-[#71717A]">Unmatched Answers</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-[#71717A]">
                    {assessment.unmatched_answers.length === 0 ? "All answers mapped successfully" : "Some answers need manual review"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Assessment Grid */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left Sidebar - Question List */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                <Card className="shadow-md border-2 border-purple-300 sticky top-24">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-orange-50 border-b-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-[#18181B]">QUESTIONS</CardTitle>
                      <Badge variant="purple" className="text-xs font-bold">
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
                  <Card className="mt-4 shadow-md border-2 border-orange-300 bg-orange-50">
                    <CardHeader className="bg-orange-100 border-b-2 border-orange-200">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#18181B]">
                        <Sparkles className="w-4 h-4 text-[#F97316]" />
                        Unmatched Answers
                        <Badge variant="orange" className="text-xs font-bold">
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

              {/* Right - Answer Sheet + Question Detail */}
              <div className="lg:col-span-9 flex flex-col gap-6 order-1 lg:order-2">
                {/* Answer Sheet - Primary Large Area */}
                <AnswerViewer
                  answer={selectedQuestion?.answer || null}
                  totalPages={assessment.total_pages}
                  assessmentId={(assessment as any)._assessmentId || assessment.id}
                />

                {/* Question Detail - Secondary */}
                {selectedQuestion && (
                  <Card className="shadow-md border-2 border-purple-300">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-orange-50 border-b-2 border-purple-200">
                      <CardTitle className="text-base font-bold text-[#18181B]">Question Details</CardTitle>
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
