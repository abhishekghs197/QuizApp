
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz, Question, QuizResult } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

const QuizTakerPage: React.FC = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const allQuizzes = storageService.get<Quiz[]>('quizzes') || [];
        const foundQuiz = allQuizzes.find(q => q.id === quizId);
        if (foundQuiz) {
            setQuiz(foundQuiz);
            setSelectedAnswers(new Array(foundQuiz.questions.length).fill(-1));
        } else {
            navigate('/student'); // Quiz not found
        }
    }, [quizId, navigate]);

    const handleAnswerSelect = (optionIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = () => {
        if (!quiz || !user) return;
        
        let correctCount = 0;
        quiz.questions.forEach((q, index) => {
            if (q.correctAnswerIndex === selectedAnswers[index]) {
                correctCount++;
            }
        });
        
        const finalScore = (correctCount / quiz.questions.length) * 100;
        setScore(finalScore);
        setIsFinished(true);

        const results = storageService.get<QuizResult[]>('quizResults') || [];
        const newResult: QuizResult = {
            id: `result-${Date.now()}`,
            userId: user.id,
            quizId: quiz.id,
            score: finalScore,
            answers: selectedAnswers,
            submittedAt: new Date().toISOString(),
        };
        results.push(newResult);
        storageService.set('quizResults', results);
    };

    if (!quiz) return <div className="text-center text-xl">Loading Quiz...</div>;
    
    if (isFinished) {
        return (
            <div className="max-w-3xl mx-auto bg-slate-800 p-8 rounded-lg shadow-2xl text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Quiz Completed!</h2>
                <p className="text-5xl font-bold text-primary-400 mb-6">{score.toFixed(2)}%</p>
                <p className="text-slate-300 mb-8">You answered {Math.round(score/100 * quiz.questions.length)} out of {quiz.questions.length} questions correctly.</p>
                <button
                    onClick={() => navigate('/student')}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-md transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    const currentQuestion: Question = quiz.questions[currentQuestionIndex];

    return (
        <div className="max-w-3xl mx-auto bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2">{quiz.title}</h1>
            <p className="text-slate-400 mb-6">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>

            <div className="bg-slate-700 p-6 rounded-md mb-6">
                <h2 className="text-xl font-semibold text-slate-100">{currentQuestion.text}</h2>
            </div>
            
            <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-md transition-all duration-200 border-2 ${
                            selectedAnswers[currentQuestionIndex] === index
                                ? 'bg-primary-600 border-primary-500 text-white font-semibold'
                                : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <div className="mt-8 flex justify-between items-center">
                <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                    >
                        Submit
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizTakerPage;
