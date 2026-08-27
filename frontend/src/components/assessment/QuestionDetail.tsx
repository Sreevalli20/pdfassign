import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionWithStatus } from "@/types/assessment";

interface QuestionDetailProps {
  questionWithStatus: QuestionWithStatus;
}

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  answered: { label: "Answered", variant: "success" },
  unanswered: { label: "Unanswered", variant: "destructive" },
  needs_review: { label: "Needs Review", variant: "warning" },
};

const confidenceLabel = (confidence: number) => {
  if (confidence >= 0.9) return "High confidence";
  if (confidence >= 0.7) return "Review recommended";
  return "Needs review";
};

export function QuestionDetail({ questionWithStatus }: QuestionDetailProps) {
  const { question, status, mapping, answer } = questionWithStatus;
  const config = statusConfig[status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>Question {question.number}</CardTitle>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            Question Text
          </h4>
          <p className="text-sm">{question.text}</p>
        </div>

        {mapping && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Mapping Confidence
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${mapping.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {Math.round(mapping.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {confidenceLabel(mapping.confidence)}
            </p>
          </div>
        )}

        {answer && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Extracted Answer
            </h4>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">
              {answer.text || "Unable to extract text from handwriting"}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <p>Pages: {answer.pages.join(", ")}</p>
              <p>Label: {answer.label}</p>
            </div>
          </div>
        )}

        {status === "unanswered" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              No answer was found for this question.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
