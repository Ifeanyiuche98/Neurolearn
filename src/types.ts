// src/types.ts

export type Screen =
  | 'home' | 'lesson' | 'flashcard' | 'quiz'
  | 'results' | 'leaderboard' | 'analytics' | 'tiergated';

export interface FlashCard   { front: string; back: string; }
export interface QuizQuestion { question: string; options: string[]; correct: number; }
export interface LearningModule {
  id:          string;
  title:       string;
  description: string;
  color:       string;
  icon:        string;
  lesson:      { title: string; content: string }[];
  flashcards:  FlashCard[];
  quiz:        QuizQuestion[];
}