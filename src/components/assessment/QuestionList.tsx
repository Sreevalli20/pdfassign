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
  string,
  { label: string; variant: "success" | "warning" | "destructive"; icon: any; bgColor: string; textColor: string; borderColor: string }
> = {
  answered: { label: "Correct", variant: "success", icon: CheckCircle2, bgColor: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-400" },
  partially_correct: { label: "Partial", variant: "warning", icon: AlertCircle, bgColor: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-400" },
  incorrect: { label: "Incorrect", variant: "destructive", icon: XCircle, bgColor: "bg-red-100", textColor: "text-red-800", borderColor: "border-red-400" },
  unanswered: { label: "Unanswered", variant: "destructive", icon: XCircle, bgColor: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-400" },
  needs_review: { label: "Needs Review", variant: "warning", icon: AlertCircle, bgColor: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-400" },
  unable_to_determine: { label: "Unable to Determine", variant: "warning", icon: AlertCircle, bgColor: "bg-gray-100", textColor: "text-gray-800", borderColor: "border-gray-400" },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || statusConfig.unable_to_determine;
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
        const config = getStatusConfig(item.status);
        const StatusIcon = config.icon;
        const isMultiPageAnswer = item.answer && item.answer.pages.length > 1;
        const isSelected = selectedQuestionId === item.question.id;
        
        return (
          <Card
            key={item.question.id}
            className={`p-3 cursor-pointer transition-all hover:shadow-lg border-2 rounded-lg ${
              isSelected
                ? "border-orange-500 bg-gradient-to-r from-orange-50 to-purple-50 shadow-lg"
                : config.borderColor
            }`}
            onClick={() => onSelectQuestion(item.question.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor} ${config.borderColor} border`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${config.textColor}`} />
                  </div>
                  <p className="font-bold text-sm text-[#18122B]">
                    {item.question.number}
                  </p>
                  {item.question.sub_part && (
                    <Badge variant="outline" className="text-xs h-5 bg-white border-purple-300 text-purple-700 font-semibold">
                      {item.question.sub_part.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#6B6480] line-clamp-2 mb-2 font-medium">
                  {item.question.text}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${config.textColor}`}>
                    {config.label}
                  </span>
                  
                  {item.grading_info && item.grading_info.score !== undefined && (
                    <Badge variant="outline" className="text-xs bg-white border-purple-500 text-purple-700 font-bold">
                      {Math.round(item.grading_info.score)}%
                    </Badge>
                  )}
                  
                  {item.answer && (
                    <Badge variant="outline" className="text-xs bg-white border-purple-300 text-purple-700 font-semibold">
                      Page {item.answer.pages[0]}
                      {isMultiPageAnswer && ` +${item.answer.pages.length - 1}`}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${isSelected ? "text-purple-600" : "text-[#6B6480]"}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
