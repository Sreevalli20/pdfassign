import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProcessingStatus } from "@/types/assessment";

const statusMessages: Record<ProcessingStatus, string> = {
  uploading: "Uploading documents...",
  reading_question_paper: "Reading question paper...",
  extracting_questions: "Extracting questions...",
  reading_answers: "Reading handwritten answers...",
  detecting_regions: "Detecting answer regions...",
  mapping_answers: "Mapping answers to questions...",
  preparing_assessment: "Preparing assessment...",
  completed: "Assessment complete!",
  failed: "Processing failed.",
};

interface ProcessingViewProps {
  status: ProcessingStatus;
}

export function ProcessingView({ status }: ProcessingViewProps) {
  const isComplete = status === "completed";
  const isFailed = status === "failed";

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {!isComplete && !isFailed && (
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          )}
          
          {isComplete && (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {isFailed && (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          <h3 className="text-lg font-semibold mb-2">
            {isComplete ? "Processing Complete" : isFailed ? "Error" : "Processing"}
          </h3>
          <p className="text-sm text-gray-500">
            {statusMessages[status]}
          </p>
        </div>
      </Card>
    </div>
  );
}
