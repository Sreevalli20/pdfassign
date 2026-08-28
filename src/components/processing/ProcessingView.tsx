import { Loader2, CheckCircle2, XCircle, Upload, FileText, Brain, Sparkles, Layers, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProcessingStatus } from "@/types/assessment";

const statusConfig: Record<string, { message: string; icon: any; color: string }> = {
  uploading: { message: "Uploading documents", icon: Upload, color: "text-[#6D28D9]" },
  reading_question_paper: { message: "Reading question paper", icon: FileText, color: "text-[#6D28D9]" },
  extracting_questions: { message: "Extracting questions", icon: Brain, color: "text-[#7C3AED]" },
  reading_answers: { message: "Reading handwritten answers", icon: FileText, color: "text-[#8B5CF6]" },
  detecting_regions: { message: "Detecting answer regions", icon: Layers, color: "text-[#A78BFA]" },
  mapping_answers: { message: "Mapping answers to questions", icon: Sparkles, color: "text-[#F97316]" },
  preparing_assessment: { message: "Preparing assessment", icon: CheckCircle2, color: "text-[#22C55E]" },
  completed: { message: "Assessment complete!", icon: CheckCircle2, color: "text-[#22C55E]" },
  failed: { message: "Processing failed.", icon: XCircle, color: "text-[#EF4444]" },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || statusConfig.uploading;
};

const statusOrder: ProcessingStatus[] = [
  "uploading",
  "reading_question_paper",
  "extracting_questions",
  "reading_answers",
  "detecting_regions",
  "mapping_answers",
  "preparing_assessment",
  "completed",
];

interface ProcessingViewProps {
  status: ProcessingStatus;
}

export function ProcessingView({ status }: ProcessingViewProps) {
  const isComplete = status === "completed";
  const isFailed = status === "failed";
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="p-12 max-w-3xl w-full shadow-sm border border-gray-200 rounded-2xl">
        <div className="flex flex-col items-center text-center">
          {!isComplete && !isFailed && (
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-orange-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#6D28D9] animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-[#6D28D9] to-[#F97316] rounded-full flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          
          {isComplete && (
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-8">
              <CheckCircle2 className="w-12 h-12 text-[#22C55E]" />
            </div>
          )}

          {isFailed && (
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mb-8">
              <XCircle className="w-12 h-12 text-[#EF4444]" />
            </div>
          )}

          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            {isComplete ? "Processing Complete" : isFailed ? "Processing Failed" : "Analyzing assessment"}
          </h3>
          <p className={`text-xl mb-12 ${config.color}`}>
            {config.message}
          </p>

          {/* Progress Steps */}
          <div className="w-full space-y-4">
            {statusOrder.slice(0, -1).map((step, index) => {
              const isCurrent = step === status;
              const isPast = index < currentIndex;
              const stepConfig = getStatusConfig(step);
              const StepIcon = stepConfig.icon;
              
              return (
                <div
                  key={step}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isCurrent
                      ? "bg-purple-50 border-2 border-purple-200"
                      : isPast
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCurrent
                        ? "bg-gradient-to-br from-[#6D28D9] to-[#F97316] text-white"
                        : isPast
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-500"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-base font-medium flex-1 text-left ${
                      isCurrent
                        ? "text-[#18181B]"
                        : isPast
                        ? "text-green-900"
                        : "text-gray-500"
                    }`}
                  >
                    {stepConfig.message}
                  </span>
                  {isPast && (
                    <ArrowRight className="w-5 h-5 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
