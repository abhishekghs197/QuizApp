
import { seedData } from '../data/seed';

const APP_PREFIX = 'intelliQuiz_';

export const storageService = {
  get<T,>(key: string): T | null {
    const item = localStorage.getItem(`${APP_PREFIX}${key}`);
    return item ? JSON.parse(item) : null;
  },
  set<T,>(key: string, value: T): void {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
  },
  remove(key: string): void {
    localStorage.removeItem(`${APP_PREFIX}${key}`);
  },
};

export function initializeData() {
  if (!storageService.get('users')) {
    storageService.set('users', seedData.users);
    storageService.set('quizzes', seedData.quizzes);
    storageService.set('mockTests', seedData.mockTests);
    storageService.set('quizResults', seedData.quizResults);
  }
}
