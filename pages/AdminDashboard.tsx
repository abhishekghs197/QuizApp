import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Quiz, MockTest, QuizResult, User, Role, Question, TimeSlot } from '../types';

type AdminTab = 'quizzes' | 'mock-tests' | 'results';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('quizzes');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [mockTests, setMockTests] = useState<MockTest[]>([]);
    const [results, setResults] = useState<QuizResult[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // State for new/edit quiz form
    const [isQuizFormOpen, setIsQuizFormOpen] = useState(false);
    const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
    const [newQuizTitle, setNewQuizTitle] = useState('');
    const [newQuizQuestions, setNewQuizQuestions] = useState<Omit<Question, 'id'>[]>([]);

    // State for new/edit mock test form
    const [isCreatingMockTest, setIsCreatingMockTest] = useState(false);
    const [editingMockTestId, setEditingMockTestId] = useState<string | null>(null);
    const [newMockTestTitle, setNewMockTestTitle] = useState('');
    const [newMockTestDuration, setNewMockTestDuration] = useState(60);
    const [newMockTestSlots, setNewMockTestSlots] = useState<{ startTime: string, endTime: string }[]>([]);

    // State for results filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        setQuizzes(storageService.get<Quiz[]>('quizzes') || []);
        setMockTests(storageService.get<MockTest[]>('mockTests') || []);
        setResults(storageService.get<QuizResult[]>('quizResults') || []);
        const allUsers = storageService.get<User[]>('users') || [];
        setUsers(allUsers.filter(u => u.role === Role.STUDENT));
    }, []);

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.username || 'Unknown Student';
    const getQuizTitle = (quizId: string) => quizzes.find(q => q.id === quizId)?.title || 'Unknown Quiz';

    const filteredResults = useMemo(() => {
        return results
            .filter(result => {
                // Student name search
                const studentNameMatch = searchTerm
                    ? getUserName(result.userId).toLowerCase().includes(searchTerm.toLowerCase())
                    : true;

                // Quiz selection filter
                const quizMatch = selectedQuizId
                    ? result.quizId === selectedQuizId
                    : true;

                // Date range filter
                const submittedDate = new Date(result.submittedAt);
                const startDateMatch = startDate ? submittedDate >= new Date(startDate) : true;
                const endDateMatch = endDate ? submittedDate <= new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)) : true;

                return studentNameMatch && quizMatch && startDateMatch && endDateMatch;
            })
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }, [results, users, quizzes, searchTerm, selectedQuizId, startDate, endDate]);


    const resetQuizForm = () => {
        setIsQuizFormOpen(false);
        setEditingQuizId(null);
        setNewQuizTitle('');
        setNewQuizQuestions([]);
    };

    const handleEditQuiz = (quizId: string) => {
        const quizToEdit = quizzes.find(q => q.id === quizId);
        if (quizToEdit) {
            setEditingQuizId(quizId);
            setNewQuizTitle(quizToEdit.title);
            setNewQuizQuestions(quizToEdit.questions.map(({ id, ...rest }) => rest)); // Remove ID for form state
            setIsQuizFormOpen(true);
        }
    };

    const handleAddQuestion = () => {
        setNewQuizQuestions([
            ...newQuizQuestions,
            { text: '', options: ['', '', '', ''], correctAnswerIndex: -1 }
        ]);
    };

    const handleRemoveQuestion = (index: number) => {
        const updatedQuestions = [...newQuizQuestions];
        updatedQuestions.splice(index, 1);
        setNewQuizQuestions(updatedQuestions);
    };

    const handleQuestionChange = (index: number, field: 'text' | 'correctAnswerIndex', value: string | number) => {
        const updatedQuestions = [...newQuizQuestions];
        if(field === 'text') {
            updatedQuestions[index].text = value as string;
        } else {
            updatedQuestions[index].correctAnswerIndex = value as number;
        }
        setNewQuizQuestions(updatedQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const updatedQuestions = [...newQuizQuestions];
        updatedQuestions[qIndex].options[oIndex] = value;
        setNewQuizQuestions(updatedQuestions);
    };

    const handleSaveQuiz = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuizTitle.trim() || newQuizQuestions.length === 0) {
            alert('Please provide a title and at least one question.');
            return;
        }
        for (const q of newQuizQuestions) {
            if (!q.text.trim() || q.options.some(opt => !opt.trim()) || q.correctAnswerIndex === -1) {
                alert('Please fill out all fields for each question and select a correct answer.');
                return;
            }
        }

        if (editingQuizId) {
            // Update existing quiz
            const updatedQuizzes = quizzes.map(quiz => {
                if (quiz.id === editingQuizId) {
                    return {
                        ...quiz,
                        title: newQuizTitle,
                        questions: newQuizQuestions.map((q, index) => ({
                            ...q,
                            id: quiz.questions[index]?.id || `q-${Date.now()}-${index}`,
                        })),
                    };
                }
                return quiz;
            });
            storageService.set('quizzes', updatedQuizzes);
            setQuizzes(updatedQuizzes);
        } else {
            // Create new quiz
            const newQuiz: Quiz = {
                id: `quiz-${Date.now()}`,
                title: newQuizTitle,
                questions: newQuizQuestions.map((q, index) => ({
                    ...q,
                    id: `q-${Date.now()}-${index}`,
                })),
            };

            const currentQuizzes = storageService.get<Quiz[]>('quizzes') || [];
            const updatedQuizzes = [...currentQuizzes, newQuiz];
            storageService.set('quizzes', updatedQuizzes);
            setQuizzes(updatedQuizzes);
        }
        resetQuizForm();
    };

    const handleDeleteQuiz = (quizId: string) => {
        if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
            const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
            setQuizzes(updatedQuizzes);
            storageService.set('quizzes', updatedQuizzes);
        }
    };

    const resetMockTestForm = () => {
        setIsCreatingMockTest(false);
        setEditingMockTestId(null);
        setNewMockTestTitle('');
        setNewMockTestDuration(60);
        setNewMockTestSlots([]);
    };

    const handleEditMockTest = (testId: string) => {
        const testToEdit = mockTests.find(t => t.id === testId);
        if (testToEdit) {
            setEditingMockTestId(testId);
            setNewMockTestTitle(testToEdit.title);
            setNewMockTestDuration(testToEdit.durationMinutes);
            
            const toLocalISOString = (isoString: string) => {
                const date = new Date(isoString);
                const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
                return localISOTime;
            };

            setNewMockTestSlots(testToEdit.timeSlots.map(slot => ({
                startTime: toLocalISOString(slot.startTime),
                endTime: toLocalISOString(slot.endTime),
            })));
            setIsCreatingMockTest(true);
        }
    };

    const handleAddTimeSlot = () => {
        setNewMockTestSlots([...newMockTestSlots, { startTime: '', endTime: '' }]);
    };
    
    const handleRemoveTimeSlot = (index: number) => {
        const updatedSlots = [...newMockTestSlots];
        updatedSlots.splice(index, 1);
        setNewMockTestSlots(updatedSlots);
    };

    const handleSlotChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const updatedSlots = [...newMockTestSlots];
        updatedSlots[index][field] = value;
        setNewMockTestSlots(updatedSlots);
    };

    const handleSaveMockTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMockTestTitle.trim() || newMockTestDuration <= 0 || newMockTestSlots.length === 0) {
            alert('Please provide a title, a valid duration, and at least one time slot.');
            return;
        }
        if (newMockTestSlots.some(slot => !slot.startTime || !slot.endTime || new Date(slot.startTime) >= new Date(slot.endTime))) {
            alert('Please ensure all time slots have a valid start and end time, and the start time is before the end time.');
            return;
        }

        if (editingMockTestId) {
            const updatedMockTests = mockTests.map(test => {
                if (test.id === editingMockTestId) {
                    return {
                        ...test,
                        title: newMockTestTitle,
                        durationMinutes: newMockTestDuration,
                        timeSlots: newMockTestSlots.map((slot, index) => ({
                            id: `slot-${editingMockTestId}-${index}`,
                            startTime: new Date(slot.startTime).toISOString(),
                            endTime: new Date(slot.endTime).toISOString(),
                            isBooked: false,
                            bookedBy: undefined,
                        })),
                    };
                }
                return test;
            });
            storageService.set('mockTests', updatedMockTests);
            setMockTests(updatedMockTests);
        } else {
            const newMockTest: MockTest = {
                id: `mock-${Date.now()}`,
                title: newMockTestTitle,
                durationMinutes: newMockTestDuration,
                timeSlots: newMockTestSlots.map((slot, index) => ({
                    id: `slot-${Date.now()}-${index}`,
                    startTime: new Date(slot.startTime).toISOString(),
                    endTime: new Date(slot.endTime).toISOString(),
                    isBooked: false,
                })),
            };
    
            const currentMockTests = storageService.get<MockTest[]>('mockTests') || [];
            const updatedMockTests = [...currentMockTests, newMockTest];
            storageService.set('mockTests', updatedMockTests);
            setMockTests(updatedMockTests);
        }
        
        resetMockTestForm();
    };

    const handleDeleteMockTest = (testId: string) => {
        if (window.confirm('Are you sure you want to delete this mock test? This action is permanent.')) {
            const updatedMockTests = mockTests.filter(test => test.id !== testId);
            setMockTests(updatedMockTests);
            storageService.set('mockTests', updatedMockTests);
        }
    };
    
    const TabButton: React.FC<{tabName: AdminTab, label: string}> = ({tabName, label}) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === tabName
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h1 className="text-4xl font-bold mb-8 text-white">Admin Dashboard</h1>
            <div className="flex space-x-2 border-b border-slate-700 mb-6">
                <TabButton tabName="quizzes" label="Quiz Management"/>
                <TabButton tabName="mock-tests" label="Mock Test Management"/>
                <TabButton tabName="results" label="Student Results"/>
            </div>

            <div>
                {activeTab === 'quizzes' && (
                    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{isQuizFormOpen ? (editingQuizId ? 'Edit Quiz' : 'Create New Quiz') : 'Quizzes'}</h2>
                            {!isQuizFormOpen && (
                                <button 
                                    onClick={() => { setIsQuizFormOpen(true); handleAddQuestion(); }}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                                >
                                    Create New Quiz
                                </button>
                            )}
                        </div>
                        
                        {isQuizFormOpen ? (
                            <form onSubmit={handleSaveQuiz} className="space-y-6 bg-slate-900/50 p-6 rounded-lg">
                                <div>
                                    <label htmlFor="quizTitle" className="block text-sm font-medium text-slate-300 mb-1">Quiz Title</label>
                                    <input
                                        id="quizTitle"
                                        type="text"
                                        value={newQuizTitle}
                                        onChange={(e) => setNewQuizTitle(e.target.value)}
                                        required
                                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                
                                {newQuizQuestions.map((q, qIndex) => (
                                    <div key={qIndex} className="p-4 border border-slate-700 rounded-lg space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-slate-200">Question {qIndex + 1}</h4>
                                            <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                        </div>
                                        <textarea
                                            placeholder="Question Text"
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                            required
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center space-x-2">
                                                    <input 
                                                        type="radio" 
                                                        name={`correct-answer-${qIndex}`}
                                                        checked={q.correctAnswerIndex === oIndex}
                                                        onChange={() => handleQuestionChange(qIndex, 'correctAnswerIndex', oIndex)}
                                                        required
                                                        className="form-radio h-4 w-4 text-primary-600 bg-slate-600 border-slate-500 focus:ring-primary-500"
                                                    />
                                                    <input 
                                                        type="text"
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                        required
                                                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <button type="button" onClick={handleAddQuestion} className="w-full text-center py-2 px-4 border border-dashed border-slate-600 rounded-md text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors">
                                    Add Another Question
                                </button>
                                
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={resetQuizForm} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
                                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">{editingQuizId ? 'Update Quiz' : 'Save Quiz'}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 mt-4">
                                {quizzes.length > 0 ? quizzes.map(quiz => (
                                    <div key={quiz.id} className="p-4 bg-slate-700 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white">{quiz.title}</p>
                                            <p className="text-sm text-slate-400">{quiz.questions.length} questions</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEditQuiz(quiz.id)}
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-slate-400 py-4">No quizzes found. Create one to get started!</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'mock-tests' && (
                    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{isCreatingMockTest ? (editingMockTestId ? 'Edit Mock Test' : 'Create New Mock Test') : 'Mock Tests'}</h2>
                            {!isCreatingMockTest && (
                                <button 
                                    onClick={() => { setIsCreatingMockTest(true); handleAddTimeSlot(); }}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                                >
                                    Create New Mock Test
                                </button>
                            )}
                        </div>
                        
                        {isCreatingMockTest ? (
                             <form onSubmit={handleSaveMockTest} className="space-y-6 bg-slate-900/50 p-6 rounded-lg">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="mockTestTitle" className="block text-sm font-medium text-slate-300 mb-1">Test Title</label>
                                        <input
                                            id="mockTestTitle"
                                            type="text"
                                            value={newMockTestTitle}
                                            onChange={(e) => setNewMockTestTitle(e.target.value)}
                                            required
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="mockTestDuration" className="block text-sm font-medium text-slate-300 mb-1">Duration (minutes)</label>
                                        <input
                                            id="mockTestDuration"
                                            type="number"
                                            value={newMockTestDuration}
                                            onChange={(e) => setNewMockTestDuration(parseInt(e.target.value, 10))}
                                            required
                                            min="1"
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                 </div>
                                
                                {newMockTestSlots.map((slot, index) => (
                                    <div key={index} className="p-4 border border-slate-700 rounded-lg space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-slate-200">Time Slot {index + 1}</h4>
                                            <button type="button" onClick={() => handleRemoveTimeSlot(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">Start Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={slot.startTime}
                                                    onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                                                    required
                                                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1">End Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={slot.endTime}
                                                    onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                                                    required
                                                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button type="button" onClick={handleAddTimeSlot} className="w-full text-center py-2 px-4 border border-dashed border-slate-600 rounded-md text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-colors">
                                    Add Another Time Slot
                                </button>
                                
                                <div className="flex justify-end space-x-4">
                                    <button type="button" onClick={resetMockTestForm} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
                                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">{editingMockTestId ? 'Update Mock Test' : 'Save Mock Test'}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 mt-4">
                                {mockTests.length > 0 ? mockTests.map(test => (
                                    <div key={test.id} className="p-4 bg-slate-700 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-white">{test.title}</p>
                                            <p className="text-sm text-slate-400">{test.durationMinutes} minutes - {test.timeSlots.length} available slots</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEditMockTest(test.id)}
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMockTest(test.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-slate-400 py-4">No mock tests found. Create one to get started!</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'results' && (
                    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Student Quiz Results</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-slate-700/50 rounded-lg">
                            <input
                                type="text"
                                placeholder="Search by student name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-primary-500 focus:border-primary-500"
                            />
                            <select
                                value={selectedQuizId}
                                onChange={(e) => setSelectedQuizId(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">All Quizzes</option>
                                {quizzes.map(quiz => (
                                    <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white"
                                title="Start Date"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white"
                                title="End Date"
                            />
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedQuizId('');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="lg:col-span-4 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-700 text-slate-300 uppercase text-sm">
                                    <tr>
                                        <th className="p-3">Student</th>
                                        <th className="p-3">Quiz</th>
                                        <th className="p-3">Score</th>
                                        <th className="p-3">Date Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.length > 0 ? (
                                        filteredResults.map(result => (
                                            <tr key={result.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                                <td className="p-3">{getUserName(result.userId)}</td>
                                                <td className="p-3">{getQuizTitle(result.quizId)}</td>
                                                <td className={`p-3 font-semibold ${result.score >= 70 ? 'text-green-400' : result.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {result.score.toFixed(2)}%
                                                </td>
                                                <td className="p-3 text-slate-400">{new Date(result.submittedAt).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center p-6 text-slate-400">
                                                {results.length > 0 ? 'No results match the current filters.' : 'No results have been submitted yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;