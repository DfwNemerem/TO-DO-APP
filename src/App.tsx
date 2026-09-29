import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus,
  Search,
  BellRing,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  Task,
  TaskCategory,
  TaskPriority,
  FilterView,
  NoteItem,
  FiredReminderAlert,
} from './types';
import {
  STORAGE_KEYS,
  getInitialTasks,
  getInitialNotes,
} from './data/initialData';
import { playReminderChime, playCompletionTick } from './utils/sound';
import { ProgressAnalytics } from './components/ProgressAnalytics';
import { TaskRow } from './components/TaskRow';
import { NoteSection } from './components/NoteSection';

const CATEGORIES: TaskCategory[] = ['Product', 'Work', 'Personal', 'Errands'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export default function App() {
  // 1. Load Tasks from localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback to initial tasks
    }
    return getInitialTasks();
  });

  // 2. Load Notes from localStorage
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial notes
    }
    return getInitialNotes();
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_NOTE_ID);
      if (savedId) return savedId;
    } catch {
      // Ignore
    }
    return 'note-1';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // UI & Filter States
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Product');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
  const [newReminderPreset, setNewReminderPreset] = useState<string>('none');
  const [showDetailsInput, setShowDetailsInput] = useState(false);

  // Active Reminder Alerts Banner Queue
  const [firedAlerts, setFiredAlerts] = useState<FiredReminderAlert[]>([]);

  const taskInputRef = useRef<HTMLInputElement | null>(null);
  const notesContainerRef = useRef<HTMLDivElement | null>(null);

  // Persist Tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch {
      // Ignore quota errors
    }
  }, [tasks]);

  // Persist Notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch {
      // Ignore quota errors
    }
  }, [notes]);

  // Persist Active Note ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_NOTE_ID, activeNoteId);
    } catch {
      // Ignore
    }
  }, [activeNoteId]);

  // Persist Sound Preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(soundEnabled));
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  // 1-Second Heartbeat for Live Reminder Countdowns & Due Checks
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      setTasks((prevTasks) => {
        let changed = false;
        const newlyFired: FiredReminderAlert[] = [];

        const updated = prevTasks.map((t) => {
          if (
            !t.completed &&
            t.reminderAt &&
            t.reminderAt <= currentNow &&
            !t.reminderFired
          ) {
            changed = true;
            newlyFired.push({
              taskId: t.id,
              taskTitle: t.title,
              category: t.category,
              firedAt: currentNow,
            });
            return { ...t, reminderFired: true };
          }
          return t;
        });

        if (newlyFired.length > 0) {
          playReminderChime(soundEnabled);
          setFiredAlerts((prev) => {
            const existingIds = new Set(prev.map((a) => a.taskId));
            const uniqueNew = newlyFired.filter((a) => !existingIds.has(a.taskId));
            return [...uniqueNew, ...prev];
          });
        }

        return changed ? updated : prevTasks;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Handlers for Tasks
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    let reminderTimestamp: number | null = null;
    if (newReminderPreset === '1m') {
      reminderTimestamp = Date.now() + 60 * 1000;
    } else if (newReminderPreset === '15m') {
      reminderTimestamp = Date.now() + 15 * 60 * 1000;
    } else if (newReminderPreset === '1h') {
      reminderTimestamp = Date.now() + 60 * 60 * 1000;
    }

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      details: newDetails.trim() || undefined,
      completed: false,
      category: newCategory,
      priority: newPriority,
      createdAt: Date.now(),
      reminderAt: reminderTimestamp,
      reminderFired: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setNewDetails('');
    setNewReminderPreset('none');
    setShowDetailsInput(false);
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          playCompletionTick(soundEnabled);
        }
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
      })
    );
    // Dismiss any active reminder alert for this task
    setFiredAlerts((prev) => prev.filter((a) => a.taskId !== id));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setFiredAlerts((prev) => prev.filter((a) => a.taskId !== id));
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleSetReminder = (id: string, timestamp: number | null) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              reminderAt: timestamp,
              reminderFired: false,
            }
          : t
      )
    );
    if (!timestamp || timestamp > Date.now()) {
      setFiredAlerts((prev) => prev.filter((a) => a.taskId !== id));
    }
  };

  const handleTriggerReminderNow = (task: Task) => {
    playReminderChime(soundEnabled);
    setFiredAlerts((prev) => {
      const filtered = prev.filter((a) => a.taskId !== task.id);
      return [
        {
          taskId: task.id,
          taskTitle: task.title,
          category: task.category,
          firedAt: Date.now(),
        },
        ...filtered,
      ];
    });
  };

  const handleSnoozeAlert = (taskId: string, minutes: number) => {
    const nextTime = Date.now() + minutes * 60 * 1000;
    handleSetReminder(taskId, nextTime);
    setFiredAlerts((prev) => prev.filter((a) => a.taskId !== taskId));
  };

  const handleClearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const handleResetDemoWorkspace = () => {
    const defaultTasks = getInitialTasks();
    const defaultNotes = getInitialNotes();
    setTasks(defaultTasks);
    setNotes(defaultNotes);
    setActiveNoteId(defaultNotes[0].id);
    setFiredAlerts([]);
    setFilterView('all');
    setSelectedCategory('ALL');
    setSearchQuery('');
  };

  // Handlers for Notes
  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: `Untitled Note ${notes.length + 1}`,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) return;
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (activeNoteId === id && remaining.length > 0) {
      setActiveNoteId(remaining[0].id);
    }
  };

  const handleUpdateNote = (id: string, updates: Partial<NoteItem>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      )
    );
  };

  const handleExtractTasksFromNote = (titles: string[]): number => {
    const createdTasks: Task[] = titles.map((t, idx) => ({
      id: `task-note-${Date.now()}-${idx}`,
      title: t,
      details: 'Extracted from Studio Notes',
      completed: false,
      category: 'Work',
      priority: 'Medium',
      createdAt: Date.now(),
      reminderAt: null,
    }));
    setTasks((prev) => [...createdTasks, ...prev]);
    return createdTasks.length;
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterView === 'active' && t.completed) return false;
      if (filterView === 'completed' && !t.completed) return false;
      if (filterView === 'reminders' && (!t.reminderAt || t.completed)) return false;
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDetails = t.details?.toLowerCase().includes(q);
        const matchCategory = t.category.toLowerCase().includes(q);
        return matchTitle || matchDetails || matchCategory;
      }
      return true;
    });
  }, [tasks, filterView, selectedCategory, searchQuery]);

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: 3 Zones (Brand Wordmark — 4-5 Nav Links — 1-2 Actions) */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single Text Element Brand Wordmark */}
          <a
            href="#top"
            className="font-display text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap"
          >
            Cadence
          </a>

          {/* Zone 2: Clean Text Navigation Links */}
          <nav
            aria-label="Workspace Views"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => setFilterView('all')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                filterView === 'all'
                  ? 'text-slate-900 border-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => setFilterView('active')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                filterView === 'active'
                  ? 'text-slate-900 border-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilterView('completed')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                filterView === 'completed'
                  ? 'text-slate-900 border-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setFilterView('reminders')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                filterView === 'reminders'
                  ? 'text-slate-900 border-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Reminders
            </button>
            <button
              type="button"
              onClick={() =>
                notesContainerRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              className="py-1 border-b-2 border-transparent hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              Studio Notes
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              title={
                soundEnabled
                  ? 'Reminder sound alerts enabled (click to mute)'
                  : 'Reminder sound alerts muted (click to enable)'
              }
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Chime On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => taskInputRef.current?.focus()}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          </div>
        </div>
      </header>

      {/* Active Reminder Alert Notifications Banner */}
      {firedAlerts.length > 0 && (
        <div
          role="region"
          aria-label="Triggered Task Reminders"
          className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-3"
        >
          <div className="max-w-[1380px] mx-auto space-y-2">
            {firedAlerts.map((alert) => (
              <div
                key={alert.taskId}
                className="flex flex-wrap items-center justify-between gap-3 bg-white border border-amber-300/90 rounded-lg px-4 py-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BellRing className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                  <div className="text-xs sm:text-sm text-slate-900 truncate">
                    <span className="font-semibold">Reminder Due:</span>{' '}
                    <span>{alert.taskTitle}</span>
                    <span className="text-slate-400 mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {alert.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(alert.taskId)}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete Task
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSnoozeAlert(alert.taskId, 5)}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap font-mono tabular-nums"
                  >
                    <Clock className="w-3 h-3" />
                    Snooze +5m
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFiredAlerts((prev) =>
                        prev.filter((a) => a.taskId !== alert.taskId)
                      )
                    }
                    aria-label="Dismiss reminder alert"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Responsive Workspace Container (1440px Baseline Grid) */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column (7 cols on desktop): Progress Bar, Task Composer, and Task List */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Completion Percentage Progress Bar & Category Breakdown */}
            <ProgressAnalytics
              tasks={tasks}
              selectedCategory={selectedCategory}
              onFilterSelect={setSelectedCategory}
            />

            {/* 2. Task Creation Form */}
            <section
              aria-label="Add a new task"
              className="bg-white border border-slate-200/90 rounded-xl p-5"
            >
              <form onSubmit={handleAddTask} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    ref={taskInputRef}
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Add a new task to your queue..."
                    aria-label="New task title"
                    className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900 text-slate-900 placeholder:text-slate-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="px-4 py-2.5 text-xs sm:text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>

                {showDetailsInput && (
                  <input
                    type="text"
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    placeholder="Optional task note, acceptance criteria, or context..."
                    aria-label="Task details"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900 text-slate-700"
                  />
                )}

                {/* Task Attributes & Initial Reminder Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                      aria-label="Select category"
                      className="bg-slate-100 border border-slate-200/80 rounded-md px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      aria-label="Select priority"
                      className="bg-slate-100 border border-slate-200/80 rounded-md px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-slate-900 cursor-pointer"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p} Priority
                        </option>
                      ))}
                    </select>

                    <select
                      value={newReminderPreset}
                      onChange={(e) => setNewReminderPreset(e.target.value)}
                      aria-label="Initial reminder preset"
                      className="bg-slate-100 border border-slate-200/80 rounded-md px-2.5 py-1.5 text-slate-700 font-mono tabular-nums focus:outline-none focus:border-slate-900 cursor-pointer"
                    >
                      <option value="none">No initial reminder</option>
                      <option value="1m">Remind in 1 min</option>
                      <option value="15m">Remind in 15 mins</option>
                      <option value="1h">Remind in 1 hour</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDetailsInput((prev) => !prev)}
                    className="text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                  >
                    {showDetailsInput ? 'Hide task note' : '+ Add task note'}
                  </button>
                </div>
              </form>
            </section>

            {/* 3. Task Queue Container with Search, Segmented Tabs & Individual Task Rows */}
            <section
              aria-label="To-Do Tasks List"
              className="bg-white border border-slate-200/90 rounded-xl overflow-hidden"
            >
              {/* Filter & Search Header Bar */}
              <div className="p-4 sm:px-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Interactive Segmented Control */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'completed', label: 'Done' },
                      { id: 'reminders', label: 'Reminders' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterView(tab.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        filterView === tab.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Live Client-Side Search Input */}
                <div className="relative flex-1 sm:max-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter tasks..."
                    aria-label="Filter tasks by keyword"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900 text-slate-800"
                  />
                </div>
              </div>

              {/* Tasks List or Empty State */}
              {filteredTasks.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    No tasks match your current view.
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {tasks.length === 0
                      ? 'Your task list is completely clear. Add a new task above or restore the starter workspace.'
                      : 'Try clearing your search filter or switching tabs to view all tasks.'}
                  </p>
                  <div className="pt-1 flex items-center justify-center gap-3">
                    {tasks.length === 0 ? (
                      <button
                        type="button"
                        onClick={handleResetDemoWorkspace}
                        className="px-3.5 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore Sample Tasks
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterView('all');
                          setSelectedCategory('ALL');
                          setSearchQuery('');
                        }}
                        className="px-3.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                      >
                        Reset View Filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      now={now}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onUpdateTask={handleUpdateTask}
                      onSetReminder={handleSetReminder}
                      onTriggerReminderNow={handleTriggerReminderNow}
                    />
                  ))}
                </div>
              )}

              {/* List Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono tabular-nums">
                  Showing {filteredTasks.length} of {tasks.length} tasks
                </span>

                <div className="flex items-center gap-4">
                  {completedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCompleted}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Completed ({completedCount})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetDemoWorkspace}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Sample Data
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (5 cols on desktop): Studio Notes & Scratchpad Section */}
          <div
            ref={notesContainerRef}
            className="lg:col-span-5 lg:sticky lg:top-20"
          >
            <NoteSection
              notes={notes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onCreateNote={handleCreateNote}
              onDeleteNote={handleDeleteNote}
              onUpdateNote={handleUpdateNote}
              onExtractTasksFromNote={handleExtractTasksFromNote}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
