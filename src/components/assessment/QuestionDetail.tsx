import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionWithStatus } from "@/types/assessment";
import { CheckCircle2, XCircle, AlertTriangle, FileText, MapPin, BarChart3 } from "lucide-react";
import { GradingDetails } from "./GradingDetails";

interface QuestionDetailProps {
  questionWithStatus: QuestionWithStatus;
}

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive"; icon: any; bgColor: string; textColor: string; borderColor: string }
> = {
  answered: { label: "Correct", variant: "success", icon: CheckCircle2, bgColor: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-400" },
  partially_correct: { label: "Partially Correct", variant: "warning", icon: AlertTriangle, bgColor: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-400" },
  incorrect: { label: "Incorrect", variant: "destructive", icon: XCircle, bgColor: "bg-red-100", textColor: "text-red-800", borderColor: "border-red-400" },
  unanswered: { label: "Unanswered", variant: "destructive", icon: XCircle, bgColor: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-400" },
  needs_review: { label: "Needs Review", variant: "warning", icon: AlertTriangle, bgColor: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-400" },
  unable_to_determine: { label: "Unable to Determine", variant: "warning", icon: AlertTriangle, bgColor: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-400" },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || statusConfig.unable_to_determine;
};

const confidenceLabel = (confidence: number) => {
  if (confidence >= 0.9) return "High confidence";
  if (confidence >= 0.7) return "Medium confidence";
  return "Low confidence";
};

const confidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return "bg-green-600";
  if (confidence >= 0.7) return "bg-yellow-600";
  return "bg-red-600";
};

export function QuestionDetail({ questionWithStatus }: QuestionDetailProps) {
  const { question, status, mapping, answer } = questionWithStatus;
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
          <span className={`font-bold ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <p className={`text-sm ${config.textColor} font-medium`}>
          {status === "answered" && "An answer was found and mapped to this question."}
          {status === "unanswered" && "No answer was found for this question."}
          {status === "needs_review" && "This answer may need manual review."}
        </p>
      </div>

      {/* Question Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#6B6480]">
          <FileText className="w-4 h-4 text-purple-600" />
          <span className="font-bold">Question {question.number}</span>
          {question.sub_part && (
            <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
              {question.sub_part.toUpperCase()}
            </Badge>
          )}
        </div>
        <p className="text-sm text-[#18122B] bg-gradient-to-r from-purple-50 to-orange-50 p-3 rounded-lg border border-purple-200 font-medium">
          {question.text}
        </p>
      </div>

      {/* Mapping Confidence */}
      {mapping && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#6B6480]">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span className="font-bold">Mapping Confidence</span>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`${confidenceColor(mapping.confidence)} h-2 rounded-full transition-all`}
                  style={{ width: `${mapping.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[#18122B]">
                {Math.round(mapping.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-[#6B6480] font-medium">
              {confidenceLabel(mapping.confidence)}
            </p>
          </div>
        </div>
      )}

      {/* Answer Info */}
      {answer && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#6B6480]">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span className="font-bold">Answer Location</span>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-orange-50 border-2 border-purple-300 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#18122B]">
                Answer {answer.label}
              </span>
              <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                {answer.pages.length} page{answer.pages.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-xs text-[#6B6480] mb-2 font-medium">
              Pages: {answer.pages.join(", ")}
            </p>
            {answer.text && (
              <p className="text-xs text-[#18122B] bg-white p-2 rounded border border-purple-200 font-medium">
                {answer.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grading Details */}
      <GradingDetails questionWithStatus={questionWithStatus} />
    </div>
  );
}
