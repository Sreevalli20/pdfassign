import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionWithStatus } from "@/types/assessment";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Lightbulb, Target } from "lucide-react";
import { useState } from "react";

interface GradingDetailsProps {
  questionWithStatus: QuestionWithStatus;
}

export function GradingDetails({ questionWithStatus }: GradingDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const gradingInfo = questionWithStatus.grading_info;

  if (!gradingInfo) {
    return (
      <Card className="border-2 border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Grading information not available</span>
        </div>
      </Card>
    );
  }

  const { score, satisfied_count, total_requirements, requirements, satisfaction_results, recommendations, explanation, evidence } = gradingInfo;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "text-green-700 bg-green-100 border-green-300";
      case "partially_correct":
        return "text-orange-700 bg-orange-100 border-orange-300";
      case "incorrect":
        return "text-red-700 bg-red-100 border-red-300";
      case "unable_to_determine":
        return "text-gray-700 bg-gray-100 border-gray-300";
      default:
        return "text-gray-700 bg-gray-100 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "answered":
        return <CheckCircle2 className="w-4 h-4" />;
      case "partially_correct":
        return <AlertCircle className="w-4 h-4" />;
      case "incorrect":
        return <XCircle className="w-4 h-4" />;
      case "unable_to_determine":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Grade Card */}
      <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-white p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(questionWithStatus.status)}`}>
              {getStatusIcon(questionWithStatus.status)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#18181B]">Assessment Result</h3>
              <p className="text-sm text-[#71717A]">{explanation}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg font-bold px-4 py-2 border-2 border-purple-500 text-purple-700">
            {Math.round(score)}%
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-2xl font-extrabold text-[#18181B]">{satisfied_count}/{total_requirements}</div>
            <div className="text-xs font-bold text-[#71717A]">Requirements Met</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all" 
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <div className="text-xs font-bold text-purple-700 mt-1">Score Progress</div>
          </div>
        </div>

        <div className="text-xs font-medium text-[#71717A] bg-white rounded-lg p-3 border border-purple-200">
          <span className="font-bold">Evidence:</span> {evidence}
        </div>
      </Card>

      {/* Requirements Checklist */}
      <Card className="border-2 border-orange-300 bg-white">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-left font-bold text-[#18181B] hover:bg-orange-50 px-6 py-4 rounded-t-xl border-b border-orange-200"
        >
          <span className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            REQUIREMENT CHECKLIST
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-orange-600" /> : <ChevronDown className="w-5 h-5 text-orange-600" />}
        </Button>

        {isExpanded && (
          <div className="p-4 space-y-3">
            {requirements.map((req, index) => {
              const result = satisfaction_results[index] || { satisfied: false, evidence: "" };
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${result.satisfied ? "bg-green-500" : "bg-red-500"}`}>
                    {result.satisfied ? <CheckCircle2 className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#18181B]">{req.description}</p>
                    <p className="text-xs text-[#71717A] mt-1">{result.evidence}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              <h4 className="font-bold text-[#18181B]">How to Improve</h4>
            </div>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#71717A]">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}