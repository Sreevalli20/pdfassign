import re
from typing import List, Dict, Optional, Tuple
from app.schemas.assessment import (
    Question, Answer, QuestionWithStatus, QuestionStatus,
    RequirementInfo, SatisfactionResult, GradingInfo
)


class GradingService:
    """Grade student answers based on actual question requirements and evidence."""
    
    def __init__(self):
        pass
    
    def extract_requirements(self, question: Question) -> List[RequirementInfo]:
        """
        Extract requirements from a question based on its text content.
        This analyzes the actual question to identify what is being asked.
        """
        requirements = []
        text = question.text.lower()
        
        # Detect different types of requirements based on question content
        if "create" in text or "make" in text:
            requirements.append(RequirementInfo(
                type="creation",
                description="Create or make something specified in the question",
                detected=True
            ))
        
        if "explain" in text or "describe" in text:
            requirements.append(RequirementInfo(
                type="explanation",
                description="Provide explanation or description",
                detected=True
            ))
        
        if "command" in text or "script" in text or "code" in text:
            requirements.append(RequirementInfo(
                type="technical_command",
                description="Include commands, scripts, or code",
                detected=True
            ))
        
        if "user" in text or "group" in text or "permission" in text:
            requirements.append(RequirementInfo(
                type="user_group_management",
                description="Handle users, groups, or permissions",
                detected=True
            ))
        
        if "file" in text or "directory" in text or "path" in text:
            requirements.append(RequirementInfo(
                type="file_operations",
                description="Perform file or directory operations",
                detected=True
            ))
        
        if "install" in text or "setup" in text or "configure" in text:
            requirements.append(RequirementInfo(
                type="installation_configuration",
                description="Install or configure something",
                detected=True
            ))
        
        if "verify" in text or "test" in text or "check" in text:
            requirements.append(RequirementInfo(
                type="verification",
                description="Include verification or testing steps",
                detected=True
            ))
        
        # Extract specific items mentioned in the question
        # Look for patterns like "create X", "configure Y", etc.
        patterns = [
            r"create\s+(\w+)",
            r"make\s+(\w+)",
            r"setup\s+(\w+)",
            r"configure\s+(\w+)",
            r"install\s+(\w+)",
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                requirements.append(RequirementInfo(
                    type="specific_item",
                    description=f"Handle: {match}",
                    detected=True,
                    item=match
                ))
        
        # If no specific requirements detected, add a general one
        if not requirements:
            requirements.append(RequirementInfo(
                type="general_response",
                description="Provide a relevant response to the question",
                detected=True
            ))
        
        return requirements
    
    def check_requirement_satisfaction(
        self, 
        requirement: RequirementInfo, 
        answer_text: str
    ) -> SatisfactionResult:
        """
        Check if a specific requirement is satisfied by the answer.
        Returns SatisfactionResult with is_satisfied and evidence.
        """
        if not answer_text:
            return SatisfactionResult(satisfied=False, evidence="No answer text provided")
        
        answer_lower = answer_text.lower()
        req_type = requirement.type
        description = requirement.description
        
        evidence = ""
        is_satisfied = False
        
        if req_type == "creation":
            if "create" in answer_lower or "mkdir" in answer_lower or "new" in answer_lower:
                is_satisfied = True
                evidence = "Answer contains creation-related terms or commands"
            else:
                evidence = "No clear creation activity detected in answer"
        
        elif req_type == "explanation":
            # Check if answer has sufficient length and explanatory content
            if len(answer_text) > 50 and ("because" in answer_lower or "explain" in answer_lower or "reason" in answer_lower):
                is_satisfied = True
                evidence = "Answer provides explanatory content with sufficient detail"
            else:
                evidence = "Answer lacks sufficient explanatory detail"
        
        elif req_type == "technical_command":
            # Check for commands, code patterns
            if any(cmd in answer_lower for cmd in ["$", "#", "sudo", "command", "chmod", "chown", "useradd", "groupadd"]):
                is_satisfied = True
                evidence = "Answer contains technical commands or code"
            else:
                evidence = "No technical commands detected in answer"
        
        elif req_type == "user_group_management":
            if any(term in answer_lower for term in ["user", "group", "permission", "chmod", "chown", "useradd", "groupadd"]):
                is_satisfied = True
                evidence = "Answer addresses user/group management"
            else:
                evidence = "No user/group management content detected"
        
        elif req_type == "file_operations":
            if any(term in answer_lower for term in ["file", "directory", "mkdir", "touch", "cp", "mv", "rm"]):
                is_satisfied = True
                evidence = "Answer includes file/directory operations"
            else:
                evidence = "No file operation commands detected"
        
        elif req_type == "installation_configuration":
            if any(term in answer_lower for term in ["install", "setup", "configure", "apt", "yum", "dnf", "config"]):
                is_satisfied = True
                evidence = "Answer includes installation/configuration steps"
            else:
                evidence = "No installation/configuration content detected"
        
        elif req_type == "verification":
            if any(term in answer_lower for term in ["verify", "test", "check", "validate", "confirm"]):
                is_satisfied = True
                evidence = "Answer includes verification or testing steps"
            else:
                evidence = "No verification steps detected in answer"
        
        elif req_type == "specific_item":
            item = requirement.item.lower() if requirement.item else ""
            if item and item in answer_lower:
                is_satisfied = True
                evidence = f"Answer specifically mentions {item}"
            else:
                evidence = f"Answer does not mention {item}" if item else "No specific item detected"
        
        elif req_type == "general_response":
            # For general responses, check if there's any meaningful content
            if len(answer_text.strip()) > 20:
                is_satisfied = True
                evidence = "Answer provides meaningful content"
            else:
                evidence = "Answer is too brief or empty"
        
        return SatisfactionResult(satisfied=is_satisfied, evidence=evidence)
    
    def calculate_score(
        self, 
        requirements: List[RequirementInfo], 
        satisfaction_results: List[SatisfactionResult]
    ) -> Tuple[float, int, int]:
        """
        Calculate score based on requirement satisfaction.
        Returns (score_percentage, satisfied_count, total_requirements).
        """
        if not requirements:
            return 0.0, 0, 0
        
        satisfied_count = sum(1 for result in satisfaction_results if result.satisfied)
        total_requirements = len(requirements)
        
        score_percentage = (satisfied_count / total_requirements) * 100 if total_requirements > 0 else 0.0
        
        return score_percentage, satisfied_count, total_requirements
    
    def determine_grade_status(
        self, 
        score_percentage: float, 
        has_answer: bool,
        confidence: float
    ) -> QuestionStatus:
        """
        Determine the grade status based on score and other factors.
        """
        if not has_answer:
            return QuestionStatus.UNANSWERED
        
        if confidence < 0.5:
            return QuestionStatus.UNABLE_TO_DETERMINE
        
        if score_percentage >= 90:
            return QuestionStatus.ANSWERED  # Correct
        elif score_percentage >= 60:
            return QuestionStatus.PARTIALLY_CORRECT
        elif score_percentage >= 30:
            return QuestionStatus.INCORRECT
        else:
            return QuestionStatus.INCORRECT
    
    def generate_recommendations(
        self, 
        requirements: List[RequirementInfo], 
        satisfaction_results: List[SatisfactionResult]
    ) -> List[str]:
        """
        Generate recommendations based on unsatisfied requirements.
        """
        recommendations = []
        
        for (requirement, result) in zip(requirements, satisfaction_results):
            if not result.satisfied:
                recommendations.append(f"Address: {requirement.description}")
        
        if not recommendations:
            recommendations.append("Answer appears complete based on detected requirements")
        
        return recommendations
    
    def grade_question(
        self, 
        question: Question, 
        answer: Optional[Answer]
    ) -> GradingInfo:
        """
        Grade a single question-answer pair.
        Returns comprehensive grading information.
        """
        if not answer or not answer.text:
            return GradingInfo(
                status=QuestionStatus.UNANSWERED,
                score=0.0,
                satisfied_count=0,
                total_requirements=0,
                requirements=[],
                satisfaction_results=[],
                recommendations=["No answer provided"],
                explanation="Question was not answered",
                evidence="No answer text available"
            )
        
        # Extract requirements from the question
        requirements = self.extract_requirements(question)
        
        # Check each requirement against the answer
        satisfaction_results = []
        for requirement in requirements:
            result = self.check_requirement_satisfaction(
                requirement, 
                answer.text or ""
            )
            satisfaction_results.append(result)
        
        # Calculate score
        score_percentage, satisfied_count, total_requirements = self.calculate_score(
            requirements, 
            satisfaction_results
        )
        
        # Determine status
        status = self.determine_grade_status(
            score_percentage, 
            bool(answer and answer.text),
            answer.confidence if answer else 0.0
        )
        
        # Generate recommendations
        recommendations = self.generate_recommendations(requirements, satisfaction_results)
        
        # Generate explanation
        if status == QuestionStatus.ANSWERED:
            explanation = f"Answer satisfies {satisfied_count}/{total_requirements} detected requirements"
        elif status == QuestionStatus.PARTIALLY_CORRECT:
            explanation = f"Answer partially satisfies requirements ({satisfied_count}/{total_requirements} met)"
        elif status == QuestionStatus.INCORRECT:
            explanation = f"Answer does not adequately address the requirements ({satisfied_count}/{total_requirements} met)"
        elif status == QuestionStatus.UNABLE_TO_DETERMINE:
            explanation = "Unable to reliably determine correctness due to low confidence or unclear content"
        else:
            explanation = "Question was not answered"
        
        return GradingInfo(
            status=status,
            score=score_percentage,
            satisfied_count=satisfied_count,
            total_requirements=total_requirements,
            requirements=requirements,
            satisfaction_results=satisfaction_results,
            recommendations=recommendations,
            explanation=explanation,
            evidence=f"Based on analysis of {len(requirements)} detected requirements"
        )
    
    def analyze_presentation(self, answer_text: Optional[str]) -> Dict:
        """
        Analyze the presentation and neatness of the answer.
        This is a basic analysis based on text characteristics.
        """
        if not answer_text:
            return {
                "score": 0,
                "readability": "Cannot determine - no text",
                "organization": "Cannot determine - no text",
                "formatting": "Cannot determine - no text",
                "overall_assessment": "Presentation could not be analyzed - no answer text available"
            }
        
        analysis = {
            "score": 0,
            "readability": "",
            "organization": "",
            "formatting": "",
            "overall_assessment": ""
        }
        
        # Analyze readability
        words = answer_text.split()
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
        sentence_count = answer_text.count('.') + answer_text.count('!') + answer_text.count('?')
        
        if len(words) > 0:
            if avg_word_length > 4 and sentence_count > 0:
                analysis["readability"] = "Good - proper sentence structure and word length"
                analysis["score"] += 25
            elif len(words) > 10:
                analysis["readability"] = "Moderate - some structure present"
                analysis["score"] += 15
            else:
                analysis["readability"] = "Limited - very brief response"
                analysis["score"] += 5
        else:
            analysis["readability"] = "Poor - no readable content"
        
        # Analyze organization
        has_structure = any(char in answer_text for char in ['\n', '-', '*', '1.', '2.', '3.'])
        if has_structure:
            analysis["organization"] = "Good - structured content detected"
            analysis["score"] += 25
        else:
            analysis["organization"] = "Basic - unstructured text"
            analysis["score"] += 10
        
        # Analyze formatting
        has_formatting = any(char in answer_text for char in ['$', '#', 'sudo', 'chmod', 'mkdir', '/', '='])
        if has_formatting:
            analysis["formatting"] = "Good - technical formatting present"
            analysis["score"] += 25
        else:
            analysis["formatting"] = "Basic - minimal formatting"
            analysis["score"] += 10
        
        # Overall assessment
        if analysis["score"] >= 70:
            analysis["overall_assessment"] = "Well-presented answer with good structure and formatting"
        elif analysis["score"] >= 40:
            analysis["overall_assessment"] = "Moderately presented with some structure"
        else:
            analysis["overall_assessment"] = "Basic presentation - could be improved with better structure"
        
        return analysis

    def analyze_completeness(self, questions_with_status: List[QuestionWithStatus]) -> Dict:
        """
        Analyze the completeness of the entire assessment.
        """
        total_questions = len(questions_with_status)
        answered = sum(1 for q in questions_with_status if q.status in [QuestionStatus.ANSWERED, QuestionStatus.PARTIALLY_CORRECT])
        unanswered = sum(1 for q in questions_with_status if q.status == QuestionStatus.UNANSWERED)
        needs_review = sum(1 for q in questions_with_status if q.status == QuestionStatus.NEEDS_REVIEW)
        unable_to_determine = sum(1 for q in questions_with_status if q.status == QuestionStatus.UNABLE_TO_DETERMINE)
        
        completion_rate = (answered / total_questions * 100) if total_questions > 0 else 0
        
        return {
            "total_questions": total_questions,
            "answered": answered,
            "unanswered": unanswered,
            "needs_review": needs_review,
            "unable_to_determine": unable_to_determine,
            "completion_rate": completion_rate,
            "assessment": f"{completion_rate:.1f}% completion rate - {answered}/{total_questions} questions answered"
        }

    def grade_assessment(
        self, 
        questions_with_status: List[QuestionWithStatus]
    ) -> List[QuestionWithStatus]:
        """
        Grade all questions in an assessment.
        """
        graded_questions = []
        
        for question_with_status in questions_with_status:
            question = question_with_status.question
            answer = question_with_status.answer
            
            # Perform grading
            grading_result = self.grade_question(question, answer)
            
            # Add presentation analysis if answer exists
            if answer and answer.text:
                presentation_analysis = self.analyze_presentation(answer.text)
                grading_result.presentation_analysis = presentation_analysis
            
            # Update the question status based on grading
            updated_question_with_status = QuestionWithStatus(
                question=question,
                status=grading_result.status,
                mapping=question_with_status.mapping,
                answer=answer,
                grading_info=grading_result  # Add grading information
            )
            
            graded_questions.append(updated_question_with_status)
        
        return graded_questions