import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Answer, BoundingBox } from "@/types/assessment";
import { Document, Page, pdfjs } from "react-pdf";

// Configure PDF.js worker for production
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface AnswerViewerProps {
  answer: Answer | null;
  totalPages: number;
  pdfFile?: File | null;
}

export function AnswerViewer({ answer, totalPages, pdfFile }: AnswerViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-navigate to the first page of the answer when answer changes
  useEffect(() => {
    if (answer && answer.pages.length > 0) {
      setCurrentPage(answer.pages[0]);
    }
  }, [answer]);

  // Calculate responsive page width
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32; // padding
      setPageWidth(Math.min(800, Math.max(400, containerWidth)));
    }
  }, []);

  function onDocumentLoadSuccess({ numPages: pages }: { numPages: number }) {
    setNumPages(pages);
    setPdfLoading(false);
    setPdfError(null);
  }

  function onDocumentLoadError(error: Error) {
    setPdfLoading(false);
    setPdfError("Failed to load PDF. Please ensure the file is a valid PDF.");
    console.error("PDF load error:", error);
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages || numPages, prev + 1));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev - 0.25));
  };

  const getCurrentRegion = () => {
    if (!answer) return null;
    return answer.regions.find((r) => r.page === currentPage);
  };

  const region = getCurrentRegion();
  const isMultiPage = answer && answer.pages.length > 1;
  const currentPageIndex = answer ? answer.pages.indexOf(currentPage) : -1;

  return (
    <Card className="flex flex-col h-full shadow-lg border-0">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Answer Sheet</h3>
              {answer && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs bg-white">Answer {answer.label}</Badge>
                  {isMultiPage && (
                    <Badge variant="outline" className="text-xs bg-white border-blue-200 text-blue-700">
                      Multi-page ({currentPageIndex + 1}/{answer.pages.length})
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 w-12 text-center bg-white px-2 py-1 rounded border">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(1)} className="h-8 w-8" title="Reset zoom">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-100 to-blue-100" ref={containerRef}>
        <div className="flex items-center justify-center min-h-full">
          {pdfFile ? (
            <div
              className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
              }}
            >
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<Loader2 className="w-8 h-8 animate-spin text-blue-500" />}
              >
                <Page
                  pageNumber={currentPage}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>

              {/* Highlight overlay */}
              {region && (
                <div
                  className="absolute border-4 border-yellow-500 bg-yellow-300 bg-opacity-40 pointer-events-none rounded shadow-lg"
                  style={{
                    left: `${region.bbox.x * 100}%`,
                    top: `${region.bbox.y * 100}%`,
                    width: `${region.bbox.width * 100}%`,
                    height: `${region.bbox.height * 100}%`,
                  }}
                />
              )}
            </div>
          ) : (
            <div
              className="relative bg-white shadow-2xl rounded-lg flex flex-col items-center justify-center p-12"
              style={{
                width: `${pageWidth}px`,
                minHeight: "800px",
              }}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-400 mb-2 font-medium text-lg">Page {currentPage}</p>
                {answer ? (
                  <div className="text-center space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Answer {answer.label}
                      </p>
                      <p className="text-xs text-blue-700 max-w-md">
                        {answer.text || "Handwritten answer region"}
                      </p>
                    </div>
                    {isMultiPage && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-xs text-purple-700">
                          <span className="font-medium">Multi-page answer:</span> Pages {answer.pages.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Select a question to view its answer on the answer sheet
                    </p>
                  </div>
                )}
              </div>
              {region && (
                <div
                  className="absolute border-4 border-yellow-500 bg-yellow-300 bg-opacity-40 pointer-events-none rounded shadow-lg"
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
          
          {pdfError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-700 font-medium mb-1">PDF Load Error</p>
                <p className="text-red-600 text-sm">{pdfError}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages || numPages}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === (totalPages || numPages)}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {isMultiPage && (
          <div className="mt-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {answer.pages.map((page, idx) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  Page {page}
                </Button>
              ))}
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              Answer spans {answer.pages.length} pages • Click to navigate
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
