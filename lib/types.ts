export interface Section {
  id: string;
  title: string;
  content: string;
  notes?: string; // Additional user notes
  summary?: string;
  keyPoints?: string[];
  connections?: string[];
  questions?: string[]; // AI generated critical questions
  quotes?: string[];
  themes?: string[];
  nextSteps?: string[];
}

export interface ResearchProject {
  id: string;
  title: string;
  description?: string;
  author?: string;
  sourceUrl?: string;
  year?: string;
  isArchived?: boolean;
  deletedAt?: number;
  isPinned?: boolean;
  sections: Section[];
  createdAt: number;
  updatedAt: number;
}
