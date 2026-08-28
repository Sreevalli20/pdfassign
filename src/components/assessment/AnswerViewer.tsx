import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Loader2, Maximize2, Minimize2, Download, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Answer, BoundingBox } from "@/types/assessment";
import { getAnswerSheetPdf } from "@/lib/api";

interface AnswerViewerProps {
  answer: Answer | null;
  totalPages: number;
  assessmentId?: string;
}

type PdfViewerMode = 'native' | 'fallback';

export function AnswerViewer({ answer, totalPages, assessmentId }: AnswerViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState(800);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [viewerMode, setViewerMode] = useState<PdfViewerMode>('native');
  const [nativePdfUrl, setNativePdfUrl] = useState<string | null>(null);
  const [isAnswerTextExpanded, setIsAnswerTextExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch PDF from backend when assessmentId changes
  useEffect(() => {
    const fetchPdf = async () => {
      if (assessmentId) {
        setPdfLoading(true);
        setPdfError(null);
        setShowTextFallback(false);
        setViewerMode('native');
        try {
          console.log('[AnswerViewer] Fetching PDF for assessment:', assessmentId);
          const blob = await getAnswerSheetPdf(assessmentId);
          console.log('[AnswerViewer] Received PDF blob, size:', blob.size, 'type:', blob.type);
          if (blob.size === 0) {
            throw new Error('Received empty PDF file');
          }
          setPdfBlob(blob);
          
          // Create object URL for native PDF viewing
          const url = URL.createObjectURL(blob);
          setNativePdfUrl(url);
          
          // Try native PDF viewing first
          setViewerMode('native');
        } catch (error) {
          console.error('[AnswerViewer] Failed to fetch PDF:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load answer sheet PDF from server. Please try again.';
          setPdfError(errorMessage);
          setShowTextFallback(true);
          setViewerMode('fallback');
        } finally {
          setPdfLoading(false);
        }
      }
    };
    fetchPdf();
    
    // Cleanup object URL
    return () => {
      if (nativePdfUrl) {
        URL.revokeObjectURL(nativePdfUrl);
      }
    };
  }, [assessmentId]);

  // Auto-navigate to the first page of the answer when answer changes
  useEffect(() => {
    if (answer && answer.pages.length > 0) {
      setCurrentPage(answer.pages[0]);
    }
  }, [answer]);

  // Reset to page 1 when PDF blob changes (new assessment)
  useEffect(() => {
    if (pdfBlob) {
      setCurrentPage(1);
    }
  }, [pdfBlob]);

  // Calculate responsive page width
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32; // padding
      setPageWidth(Math.min(1200, Math.max(600, containerWidth)));
    }
  }, []);

  const handleNativePdfError = () => {
    console.log('[AnswerViewer] Native PDF viewer failed, switching to fallback');
    setViewerMode('fallback');
    setShowTextFallback(true);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    const maxPage = totalPages || 1;
    setCurrentPage((prev) => Math.min(maxPage, prev + 1));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev - 0.25));
  };

  const handleDownloadPdf = async () => {
    if (assessmentId) {
      try {
        const blob = await getAnswerSheetPdf(assessmentId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `answer_sheet_${assessmentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download PDF:', error);
      }
    }
  };

  const getCurrentRegion = () => {
    if (!answer) return null;
    return answer.regions.find((r) => r.page === currentPage);
  };

  const region = getCurrentRegion();
  const isMultiPage = answer && answer.pages.length > 1;
  const currentPageIndex = answer ? answer.pages.indexOf(currentPage) : -1;

  return (
    <Card className="flex flex-col shadow-lg border-2 border-purple-300 rounded-2xl overflow-hidden" style={{ minHeight: '700px' }}>
      <div className="p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-orange-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#18122B]">ANSWER SHEET</h3>
              {answer && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">Answer {answer.label}</Badge>
                  {isMultiPage && (
                    <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                      {answer.pages.length} pages
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                    {Math.round(answer.confidence * 100)}% confidence
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-10 w-10 border-purple-300 text-purple-700 hover:bg-purple-50">
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-sm font-bold text-[#18122B] w-16 text-center bg-white px-3 py-2 rounded-lg border border-purple-300">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-10 w-10 border-purple-300 text-purple-700 hover:bg-purple-50">
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(1)} className="h-10 w-10 border-purple-300 text-purple-700 hover:bg-purple-50" title="Reset zoom">
              <Maximize2 className="w-5 h-5" />
            </Button>
            {assessmentId && (
              <Button variant="outline" onClick={handleDownloadPdf} className="h-10 px-4 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold gap-2">
                <Download className="w-4 h-4" />
                Download Answer Sheet
              </Button>
            )}
          </div>
        </div>
        
        {/* Page Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-purple-200">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#18122B]">
              Page {currentPage} of {totalPages || 1}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === (totalPages || 1)}
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-6"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 bg-gray-100" ref={containerRef} style={{ minHeight: '500px' }}>
        <div className="flex items-center justify-center min-h-full">
          {pdfLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-base font-medium text-[#6B6480]">Loading answer sheet...</p>
              </div>
            </div>
          ) : viewerMode === 'native' && nativePdfUrl ? (
            <div className="w-full h-full flex flex-col" style={{ minHeight: '500px' }}>
              <iframe
                src={nativePdfUrl}
                className="w-full h-full border-0 rounded-xl shadow-2xl flex-1 bg-white"
                title="Answer Sheet PDF"
                onError={handleNativePdfError}
                onLoad={() => console.log('[AnswerViewer] Native PDF loaded successfully')}
                style={{ minHeight: '500px' }}
              />
            </div>
          ) : viewerMode === 'fallback' || showTextFallback ? (
            <div className="flex items-center justify-center p-12 w-full">
              <div className="text-center max-w-lg w-full">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <AlertCircle className="w-10 h-10 text-amber-600" />
                </div>
                <p className="text-amber-700 font-bold text-lg mb-2">PDF Preview Unavailable</p>
                <p className="text-amber-600 text-base mb-6">The answer is still available below.</p>
                
                {assessmentId && (
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadPdf} 
                    className="gap-2 mb-6 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-6"
                  >
                    <Download className="w-4 h-4" />
                    Download Answer Sheet
                  </Button>
                )}
                
                {answer && (
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-6 text-left shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg text-[#18122B]">Answer {answer.label}</h4>
                      <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                        Confidence: {Math.round(answer.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-4 text-base text-[#18122B] max-h-64 overflow-y-auto font-medium">
                      {answer.text || "No answer text available"}
                    </div>
                    {isMultiPage && (
                      <div className="mt-4 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                          Pages: {answer.pages.join(", ")}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="relative bg-white shadow-2xl rounded-2xl flex flex-col items-center justify-center p-16"
              style={{
                width: `${pageWidth}px`,
                minHeight: "600px",
              }}
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-[#6B6480] mb-3 font-bold text-xl">No answer sheet loaded</p>
                {answer ? (
                  <div className="text-center space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-purple-200 rounded-xl p-6">
                      <p className="text-base font-bold text-[#18122B] mb-2">
                        Answer {answer.label}
                      </p>
                      <p className="text-sm text-[#6B6480] max-w-md">
                        {answer.text || "Handwritten answer region"}
                      </p>
                    </div>
                    {isMultiPage && (
                      <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-purple-200 rounded-xl p-4">
                        <p className="text-sm text-[#6B6480]">
                          <span className="font-bold">Multi-page answer:</span> Pages {answer.pages.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                    <p className="text-base text-[#6B6480]">
                      Select a question to view its answer on the answer sheet
                    </p>
                  </div>
                )}
              </div>
              {region && (
                <div
                  className="absolute border-4 border-[#F97316] bg-[rgba(249, 115, 22, 0.22)] pointer-events-none rounded shadow-lg"
                  style={{
                    left: `${region.bbox.x * 100}%`,
                    top: `${region.bbox.y * 100}%`,
                    width: `${region.bbox.width * 100}%`,
                    height: `${region.bbox.height * 100}%`,
                  }}
                />
              )}
            </div>
          )}
          
        </div>
      </div>

      <div className="p-6 border-t border-purple-200 bg-white">
        {/* Multi-page navigation */}
        {isMultiPage && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#18122B]">Answer spans {answer.pages.length} pages</p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {answer.pages.map((page, idx) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-4" : "border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-4"}
                >
                  Page {page}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Collapsible Answer Text */}
        {answer && (
          <div className="border-t border-purple-200 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsAnswerTextExpanded(!isAnswerTextExpanded)}
              className="w-full justify-between text-left font-bold text-[#18122B] hover:bg-purple-50 px-0"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                ANSWER CONTENT
              </span>
              {isAnswerTextExpanded ? (
                <ChevronUp className="w-5 h-5 text-purple-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-purple-600" />
              )}
            </Button>
            
            {isAnswerTextExpanded && (
              <div className="mt-4 bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[#18122B]">Answer {answer.label}</h4>
                  <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                    Confidence: {Math.round(answer.confidence * 100)}%
                  </Badge>
                </div>
                <div className="bg-white rounded-lg p-4 text-base text-[#18122B] max-h-64 overflow-y-auto font-medium">
                  {answer.text || "No answer text available"}
                </div>
                {isMultiPage && (
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                      Pages: {answer.pages.join(", ")}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
