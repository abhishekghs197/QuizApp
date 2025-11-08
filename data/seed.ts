
import { User, Quiz, MockTest, QuizResult, Role } from '../types';

// Hashed passwords for 'password123'
const studentPasswordHash = 'student123';
const adminPasswordHash = 'admin123';

const users: User[] = [
  { id: 'user-1', username: 'student', password: studentPasswordHash, role: Role.STUDENT },
  { id: 'user-2', username: 'admin', password: adminPasswordHash, role: Role.ADMIN },
  { id: 'user-3', username: 'john.doe', password: studentPasswordHash, role: Role.STUDENT },
];

const quizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'React Fundamentals',
    questions: [
      { id: 'q-1-1', text: 'What is JSX?', options: ['A JavaScript syntax extension', 'A templating engine', 'A CSS preprocessor', 'A database query language'], correctAnswerIndex: 0 },
      { id: 'q-1-2', text: 'Which hook is used to manage state in a functional component?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswerIndex: 1 },
      { id: 'q-1-3', text: 'What does `ReactDOM.createRoot()` do?', options: ['Creates a virtual DOM', 'Renders a component to the browser DOM', 'Creates an entry point for a React application', 'Compiles JSX to JavaScript'], correctAnswerIndex: 2 },
    ]
  },
  {
    id: 'quiz-2',
    title: 'Advanced TypeScript',
    questions: [
        { id: 'q-2-1', text: 'What is a generic in TypeScript?', options: ['A type of function', 'A way to create reusable components', 'A feature for defining interfaces', 'A tool for type-checking'], correctAnswerIndex: 1 },
        { id: 'q-2-2', text: 'What is the purpose of the `never` type?', options: ['To represent the type of values that never occur', 'To indicate a function that always throws an exception', 'To specify a variable that is always null', 'Both A and B'], correctAnswerIndex: 3 },
    ]
  }
];

const mockTests: MockTest[] = [
  {
    id: 'mock-1',
    title: 'Frontend Developer Interview Simulation',
    durationMinutes: 60,
    timeSlots: [
        { id: 'slot-1-1', startTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 25 * 3600 * 1000).toISOString(), isBooked: false },
        { id: 'slot-1-2', startTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 49 * 3600 * 1000).toISOString(), isBooked: false },
        { id: 'slot-1-3', startTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 73 * 3600 * 1000).toISOString(), isBooked: true, bookedBy: 'user-1' },
    ]
  }
];

const quizResults: QuizResult[] = [];

export const seedData = {
    users,
    quizzes,
    mockTests,
    quizResults,
};
