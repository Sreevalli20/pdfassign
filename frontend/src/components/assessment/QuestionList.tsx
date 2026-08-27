import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionWithStatus, QuestionStatus } from "@/types/assessment";
import { CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

interface QuestionListProps {
  questions: QuestionWithStatus[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

const statusConfig: Record<
  QuestionStatus,
  { label: string; variant: "success" | "warning" | "destructive"; icon: any }
> = {
  answered: { label: "Answered", variant: "success", icon: CheckCircle },
  unanswered: { label: "Unanswered", variant: "destructive", icon: XCircle },
  needs_review: { label: "Needs Review", variant: "warning", icon: AlertCircle },
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.7) return "text-yellow-600";
  return "text-red-600";
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.9) return "High";
  if (confidence >= 0.7) return "Medium";
  return "Low";
};

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
}: QuestionListProps) {
  // Sort questions to ensure proper ordering of sub-questions
  const sortedQuestions = [...questions].sort((a, b) => {
    const aNum = a.question.number;
    const bNum = b.question.number;
    return aNum.localeCompare(bNum, undefined, { numeric: true });
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Questions</h3>
        <Badge variant="outline" className="text-xs">
          {questions.length} total
        </Badge>
      </div>
      
      {sortedQuestions.map((item) => {
        const config = statusConfig[item.status];
        const StatusIcon = config.icon;
        const isMultiPageAnswer = item.answer && item.answer.pages.length > 1;
        
        return (
          <Card
            key={item.question.id}
            className={`p-3 cursor-pointer transition-all hover:shadow-md ${
              selectedQuestionId === item.question.id
                ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50"
                : ""
            }`}
            onClick={() => onSelectQuestion(item.question.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="font-semibold text-sm">
                    Question {item.question.number}
                  </p>
                  {item.question.sub_part && (
                    <Badge variant="outline" className="text-xs h-5">
                      {item.question.sub_part.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {item.question.text}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={config.variant} className="text-xs flex items-center gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </Badge>
                  
                  {item.answer && (
                    <Badge variant="outline" className="text-xs">
                      Page {item.answer.pages[0]}
                      {isMultiPageAnswer && `+${item.answer.pages.length - 1}`}
                    </Badge>
                  )}
                  
                  <span className={`text-xs ${getConfidenceColor(item.question.confidence)}`}>
                    {getConfidenceLabel(item.question.confidence)} ({Math.round(item.question.confidence * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
