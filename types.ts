export enum AppView {
  HOME = 'HOME',
  PRACTICE = 'PRACTICE',
  COMPLETED = 'COMPLETED'
}

export interface PracticeSession {
  words: string[];
  currentIndex: number;
  results: WordResult[];
}

export interface WordResult {
  word: string;
  isCorrect: boolean;
  userSpelling: string;
}

export interface SpellingFeedback {
  isCorrect: boolean;
  heardSpelling: string;
  feedbackText: string;
}
