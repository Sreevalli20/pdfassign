import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Loader2 } from "lucide-react";
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
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Answer Sheet</h3>
            {answer && (
              <Badge variant="secondary">Answer {answer.label}</Badge>
            )}
            {isMultiPage && (
              <Badge variant="warning">Multi-page ({currentPageIndex + 1}/{answer.pages.length})</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-100" ref={containerRef}>
        <div className="flex items-center justify-center min-h-full">
          {pdfFile ? (
            <div
              className="relative bg-white shadow-lg"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
              }}
            >
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
                  className="absolute border-4 border-yellow-400 bg-yellow-200 bg-opacity-30 pointer-events-none"
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
              className="relative bg-white shadow-lg flex flex-col items-center justify-center p-8"
              style={{
                width: `${pageWidth}px`,
                minHeight: "800px",
              }}
            >
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-400 mb-2 font-medium">Page {currentPage}</p>
              {answer ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Answer {answer.label}
                  </p>
                  <p className="text-xs text-gray-500 max-w-md">
                    {answer.text || "Handwritten answer region"}
                  </p>
                  {isMultiPage && (
                    <p className="text-xs text-blue-600 mt-2">
                      This answer spans pages: {answer.pages.join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Select a question to view its answer
                </p>
              )}
              {region && (
                <div
                  className="absolute border-4 border-yellow-400 bg-yellow-200 bg-opacity-30 pointer-events-none"
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
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4">
              <p className="text-red-600 text-sm">{pdfError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages || numPages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === (totalPages || numPages)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        {isMultiPage && (
          <div className="mt-3 flex justify-center gap-2">
            {answer.pages.map((page, idx) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                Page {page}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
