import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionWithStatus } from "@/types/assessment";
import { CheckCircle2, XCircle, AlertTriangle, FileText, MapPin, BarChart3 } from "lucide-react";

interface QuestionDetailProps {
  questionWithStatus: QuestionWithStatus;
}

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive"; icon: any; bgColor: string; textColor: string }
> = {
  answered: { label: "Answered", variant: "success", icon: CheckCircle2, bgColor: "bg-green-50", textColor: "text-green-700" },
  unanswered: { label: "Unanswered", variant: "destructive", icon: XCircle, bgColor: "bg-red-50", textColor: "text-red-700" },
  needs_review: { label: "Needs Review", variant: "warning", icon: AlertTriangle, bgColor: "bg-yellow-50", textColor: "text-yellow-700" },
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
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`${config.bgColor} border-2 rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
          <span className={`font-semibold ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <p className={`text-sm ${config.textColor}`}>
          {status === "answered" && "An answer was found and mapped to this question."}
          {status === "unanswered" && "No answer was found for this question."}
          {status === "needs_review" && "This answer may need manual review."}
        </p>
      </div>

      {/* Question Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          <span className="font-medium">Question {question.number}</span>
          {question.sub_part && (
            <Badge variant="outline" className="text-xs">
              {question.sub_part.toUpperCase()}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
          {question.text}
        </p>
      </div>

      {/* Mapping Confidence */}
      {mapping && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium">Mapping Confidence</span>
          </div>
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`${confidenceColor(mapping.confidence)} h-2 rounded-full transition-all`}
                  style={{ width: `${mapping.confidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {Math.round(mapping.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {confidenceLabel(mapping.confidence)}
            </p>
          </div>
        </div>
      )}

      {/* Answer Info */}
      {answer && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Answer Location</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Answer {answer.label}
              </span>
              <Badge variant="outline" className="text-xs bg-white">
                {answer.pages.length} page{answer.pages.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              Pages: {answer.pages.join(", ")}
            </p>
            {answer.text && (
              <p className="text-xs text-blue-600 bg-white p-2 rounded border border-blue-100">
                {answer.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
