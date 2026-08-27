import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Answer } from "@/types/assessment";
import { AlertTriangle, FileText } from "lucide-react";

interface UnmatchedAnswersProps {
  answers: Answer[];
}

export function UnmatchedAnswers({ answers }: UnmatchedAnswersProps) {
  if (answers.length === 0) return null;

  return (
    <div className="space-y-2">
      {answers.map((answer) => (
        <Card
          key={answer.id}
          className="p-3 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                  {answer.label}
                </Badge>
                {answer.pages.length > 1 && (
                  <Badge variant="outline" className="text-xs">
                    {answer.pages.length} pages
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-700 line-clamp-2 mb-1">
                {answer.text || "Unable to extract text"}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="w-3 h-3" />
                <span>Pages: {answer.pages.join(", ")}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
