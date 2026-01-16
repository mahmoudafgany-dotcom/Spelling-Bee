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

export interface LetterStatus {
  letter: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
}

export interface WordMetadata {
  partOfSpeech: string;
  definition: string;
  sentence: string;
}

export interface SpellingFeedback {
  isCorrect: boolean;
  isSilent: boolean;
  heardSpelling: string;
  letterAnalysis: LetterStatus[];
  feedbackText: string;
}