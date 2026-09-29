export type TaskCategory = 'Work' | 'Product' | 'Personal' | 'Errands';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type FilterView = 'all' | 'active' | 'completed' | 'reminders';

export interface Task {
  id: string;
  title: string;
  details?: string;
  completed: boolean;
  category: TaskCategory;
  priority: TaskPriority;
  createdAt: number;
  completedAt?: number;
  reminderAt?: number | null; // Unix timestamp in ms
  reminderFired?: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  createdAt: number;
}

export interface FiredReminderAlert {
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  firedAt: number;
}
