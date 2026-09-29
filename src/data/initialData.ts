import { Task, NoteItem } from '../types';

export const STORAGE_KEYS = {
  TASKS: 'cadence_tasks_v1',
  NOTES: 'cadence_notes_v1',
  ACTIVE_NOTE_ID: 'cadence_active_note_id_v1',
  SOUND_ENABLED: 'cadence_sound_enabled_v1',
};

export function getInitialTasks(): Task[] {
  const now = Date.now();
  return [
    {
      id: 'task-1',
      title: 'Finalize Q3 architecture specification and performance budget',
      details: 'Verify latency targets under 150ms and document caching invariants.',
      completed: true,
      category: 'Product',
      priority: 'High',
      createdAt: now - 1000 * 60 * 180,
      completedAt: now - 1000 * 60 * 45,
      reminderAt: null,
    },
    {
      id: 'task-2',
      title: 'Audit localStorage state synchronization across browser tabs',
      details: 'Ensure tasks, completion percentages, and notes persist cleanly on reload.',
      completed: true,
      category: 'Work',
      priority: 'Medium',
      createdAt: now - 1000 * 60 * 120,
      completedAt: now - 1000 * 60 * 20,
      reminderAt: null,
    },
    {
      id: 'task-3',
      title: 'Prepare design critique notes for afternoon stakeholder sync',
      details: 'Focus on typography hierarchy, tabular numerals, and responsive split view.',
      completed: false,
      category: 'Product',
      priority: 'High',
      createdAt: now - 1000 * 60 * 90,
      reminderAt: now + 1000 * 60 * 25, // 25 minutes from now
      reminderFired: false,
    },
    {
      id: 'task-4',
      title: 'Send revised supplier contract to legal counsel',
      details: 'Include updated SLA clauses from the morning review note.',
      completed: false,
      category: 'Work',
      priority: 'Medium',
      createdAt: now - 1000 * 60 * 60,
      reminderAt: now + 1000 * 60 * 90, // 90 minutes from now
      reminderFired: false,
    },
    {
      id: 'task-5',
      title: 'Pick up roasted espresso beans and sparkling water',
      details: 'Stop by the roastery before 6:00 PM closing.',
      completed: false,
      category: 'Errands',
      priority: 'Low',
      createdAt: now - 1000 * 60 * 30,
      reminderAt: null,
    },
  ];
}

export function getInitialNotes(): NoteItem[] {
  const now = Date.now();
  return [
    {
      id: 'note-1',
      title: 'Daily Working Scratchpad & Meeting Notes',
      content: `## Morning Standup & Priorities
Focus today is shipping a cohesive, tactile task and note workspace with zero visual clutter.

Key discussion points:
- Progress bar automatically recalculates completion ratio as tasks are toggled or removed.
- Every task has an individual Reminder Action with quick presets (+1m test, +15m, +1h, or custom time).
- Notes are saved immediately to localStorage as you type.

Action items to extract:
- [ ] Review accessibility contrast ratios on muted metadata
- [ ] Schedule Friday retrospective with engineering lead`,
      createdAt: now - 1000 * 60 * 240,
      updatedAt: now - 1000 * 60 * 12,
    },
    {
      id: 'note-2',
      title: 'Reading & Idea Log',
      content: `Notes on calm software design:
1. Prefer clear typographic hierarchy and generous whitespace over nested card borders.
2. Keep numerical indicators aligned with tabular numerals so countdowns never jitter.
3. Combine structured tasks with unstructured freeform writing in a single viewport.`,
      createdAt: now - 1000 * 60 * 600,
      updatedAt: now - 1000 * 60 * 180,
    },
  ];
}
