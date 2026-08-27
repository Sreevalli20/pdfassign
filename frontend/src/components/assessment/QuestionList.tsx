import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionWithStatus, QuestionStatus } from "@/types/assessment";
import { CheckCircle2, XCircle, AlertCircle, FileText, ChevronRight } from "lucide-react";

interface QuestionListProps {
  questions: QuestionWithStatus[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

const statusConfig: Record<
  QuestionStatus,
  { label: string; variant: "success" | "warning" | "destructive"; icon: any; bgColor: string; textColor: string }
> = {
  answered: { label: "Answered", variant: "success", icon: CheckCircle2, bgColor: "bg-green-50", textColor: "text-green-700" },
  unanswered: { label: "Unanswered", variant: "destructive", icon: XCircle, bgColor: "bg-red-50", textColor: "text-red-700" },
  needs_review: { label: "Needs Review", variant: "warning", icon: AlertCircle, bgColor: "bg-yellow-50", textColor: "text-yellow-700" },
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.7) return "text-yellow-600";
  return "text-red-600";
};

export function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion,
}: QuestionListProps) {
  const sortedQuestions = [...questions].sort((a, b) => {
    const aNum = a.question.number;
    const bNum = b.question.number;
    return aNum.localeCompare(bNum, undefined, { numeric: true });
  });

  return (
    <div className="space-y-2">
      {sortedQuestions.map((item) => {
        const config = statusConfig[item.status];
        const StatusIcon = config.icon;
        const isMultiPageAnswer = item.answer && item.answer.pages.length > 1;
        const isSelected = selectedQuestionId === item.question.id;
        
        return (
          <Card
            key={item.question.id}
            className={`p-3 cursor-pointer transition-all hover:shadow-md border-2 rounded-lg ${
              isSelected
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onSelectQuestion(item.question.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${config.textColor}`} />
                  </div>
                  <p className="font-semibold text-sm text-gray-900">
                    {item.question.number}
                  </p>
                  {item.question.sub_part && (
                    <Badge variant="outline" className="text-xs h-5 bg-white border-gray-200">
                      {item.question.sub_part.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {item.question.text}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium ${config.textColor}`}>
                    {config.label}
                  </span>
                  
                  {item.answer && (
                    <Badge variant="outline" className="text-xs bg-white border-gray-200">
                      Page {item.answer.pages[0]}
                      {isMultiPageAnswer && ` +${item.answer.pages.length - 1}`}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
