
export enum Role {
    STUDENT = 'student',
    ADMIN = 'admin',
}

export interface User {
    id: string;
    username: string;
    password?: string; // Should not be stored in client-side state long term, but needed for registration/login
    role: Role;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswerIndex: number;
}

export interface Quiz {
    id: string;
    title: string;
    questions: Question[];
}

export interface TimeSlot {
    id: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    isBooked: boolean;
    bookedBy?: string; // userId
}

export interface MockTest {
    id: string;
    title: string;
    durationMinutes: number;
    timeSlots: TimeSlot[];
}

export interface QuizResult {
    id: string;
    userId: string;
    quizId: string;
    score: number; // percentage
    answers: number[]; // indices of selected answers
    submittedAt: string; // ISO string
}
