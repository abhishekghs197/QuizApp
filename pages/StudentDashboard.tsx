
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quiz, MockTest, TimeSlot } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [mockTests, setMockTests] = useState<MockTest[]>([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        setQuizzes(storageService.get<Quiz[]>('quizzes') || []);
        setMockTests(storageService.get<MockTest[]>('mockTests') || []);
    }, []);

    const handleBookSlot = (testId: string, slotId: string) => {
        const updatedTests = mockTests.map(test => {
            if (test.id === testId) {
                const updatedSlots = test.timeSlots.map(slot => {
                    if (slot.id === slotId) {
                        return { ...slot, isBooked: true, bookedBy: user?.id };
                    }
                    return slot;
                });
                return { ...test, timeSlots: updatedSlots };
            }
            return test;
        });
        setMockTests(updatedTests);
        storageService.set('mockTests', updatedTests);
    };

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="space-y-12">
            <div>
                <h2 className="text-3xl font-bold mb-6 text-white border-b-2 border-primary-500 pb-2">Available Quizzes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map(quiz => (
                        <div key={quiz.id} className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col justify-between hover:shadow-primary-500/20 hover:-translate-y-1 transition-all duration-300">
                            <div>
                                <h3 className="text-xl font-semibold text-white">{quiz.title}</h3>
                                <p className="text-slate-400 mt-2">{quiz.questions.length} questions</p>
                            </div>
                            <button
                                onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                                className="mt-6 bg-primary-600 text-white font-bold py-2 px-4 rounded-md hover:bg-primary-700 transition-colors w-full"
                            >
                                Start Quiz
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-3xl font-bold mb-6 text-white border-b-2 border-primary-500 pb-2">Schedule Mock Test</h2>
                <div className="space-y-8">
                    {mockTests.map(test => (
                        <div key={test.id} className="bg-slate-800 rounded-lg shadow-lg p-6">
                            <h3 className="text-2xl font-semibold text-white">{test.title}</h3>
                            <p className="text-slate-400 mt-1">{test.durationMinutes} minutes</p>
                            <div className="mt-6 space-y-4">
                                <h4 className="font-semibold text-slate-200">Available Slots:</h4>
                                {test.timeSlots.map(slot => (
                                    <div key={slot.id} className="flex flex-col md:flex-row items-center justify-between bg-slate-700 p-4 rounded-md">
                                        <p className="text-slate-300">{formatDateTime(slot.startTime)}</p>
                                        {slot.isBooked ? (
                                             <span className={`px-4 py-2 rounded-full text-sm font-semibold ${slot.bookedBy === user?.id ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                                {slot.bookedBy === user?.id ? 'Booked by you' : 'Unavailable'}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleBookSlot(test.id, slot.id)}
                                                className="mt-2 md:mt-0 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                                            >
                                                Book Now
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
