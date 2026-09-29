import React, { useState } from 'react';
import {
  Check,
  Bell,
  BellOff,
  Trash2,
  Edit3,
  Clock,
  X,
  BellRing,
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority } from '../types';

interface TaskRowProps {
  task: Task;
  now: number;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSetReminder: (id: string, timestamp: number | null) => void;
  onTriggerReminderNow: (task: Task) => void;
}

const CATEGORIES: TaskCategory[] = ['Product', 'Work', 'Personal', 'Errands'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  if (diff <= 0) return 'Due now';
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `in ${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `in ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function formatClockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  now,
  onToggleComplete,
  onDelete,
  onUpdateTask,
  onSetReminder,
  onTriggerReminderNow,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDetails, setEditDetails] = useState(task.details || '');
  const [editCategory, setEditCategory] = useState<TaskCategory>(task.category);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);

  const [showReminderPopover, setShowReminderPopover] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  const hasActiveReminder = Boolean(task.reminderAt && !task.completed);
  const isReminderOverdue = Boolean(
    task.reminderAt && task.reminderAt <= now && !task.completed
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    onUpdateTask(task.id, {
      title: trimmed,
      details: editDetails.trim() || undefined,
      category: editCategory,
      priority: editPriority,
    });
    setIsEditing(false);
  };

  const handleQuickReminder = (minutesFromNow: number) => {
    const target = Date.now() + minutesFromNow * 60 * 1000;
    onSetReminder(task.id, target);
    setShowReminderPopover(false);
  };

  const handleCustomReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDateTime) return;
    const parsed = new Date(customDateTime).getTime();
    if (!Number.isNaN(parsed)) {
      onSetReminder(task.id, parsed);
      setShowReminderPopover(false);
      setCustomDateTime('');
    }
  };

  const priorityLabelColor =
    task.priority === 'High'
      ? 'text-rose-700 font-medium'
      : task.priority === 'Medium'
      ? 'text-amber-700'
      : 'text-slate-500';

  return (
    <div
      className={`group border-b border-slate-100 last:border-b-0 transition-colors ${
        task.completed ? 'bg-slate-50/60' : 'bg-white hover:bg-slate-50/50'
      }`}
    >
      <div className="px-4 sm:px-5 py-3.5 flex items-start gap-3.5">
        {/* Accessible Complete Toggle Button */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={
            task.completed
              ? `Mark "${task.title}" as incomplete`
              : `Mark "${task.title}" as complete`
          }
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'border-slate-300 bg-white hover:border-slate-500 text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Main Content Column */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2.5 py-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 text-slate-900"
              />
              <input
                type="text"
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                placeholder="Optional context or note for this task..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-700"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as TaskCategory)}
                    aria-label="Task category"
                    className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-slate-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    aria-label="Task priority"
                    className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-slate-700"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p} Priority
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <p
                  onClick={() => onToggleComplete(task.id)}
                  className={`text-[15px] leading-snug cursor-pointer select-none transition-colors ${
                    task.completed
                      ? 'line-through text-slate-400'
                      : 'text-slate-900 font-medium'
                  }`}
                >
                  {task.title}
                </p>
              </div>

              {task.details && (
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    task.completed ? 'text-slate-400 line-through' : 'text-slate-600'
                  }`}
                >
                  {task.details}
                </p>
              )}

              {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="text-slate-700 font-medium">{task.category}</span>
                <span aria-hidden="true">·</span>
                <span className={priorityLabelColor}>{task.priority} Priority</span>

                {hasActiveReminder && task.reminderAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono tabular-nums ${
                        isReminderOverdue
                          ? 'text-rose-600 font-semibold'
                          : 'text-amber-700 font-medium'
                      }`}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      Reminder {formatClockTime(task.reminderAt)} (
                      {formatCountdown(task.reminderAt, now)})
                    </span>
                  </>
                )}

                {task.completed && task.completedAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-mono tabular-nums">
                      Completed {formatClockTime(task.completedAt)}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Individual Item Actions: Reminder Action, Edit, Delete */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Reminder Action Button for Individual Item */}
            <button
              type="button"
              onClick={() => setShowReminderPopover((prev) => !prev)}
              disabled={task.completed}
              title={
                task.completed
                  ? 'Completed tasks do not need reminders'
                  : hasActiveReminder
                  ? 'Manage task reminder'
                  : 'Set reminder for this task'
              }
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                showReminderPopover
                  ? 'bg-slate-900 text-white'
                  : hasActiveReminder
                  ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasActiveReminder ? 'Reminder Set' : 'Remind'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditTitle(task.title);
                setEditDetails(task.details || '');
                setEditCategory(task.category);
                setEditPriority(task.priority);
                setIsEditing(true);
                setShowReminderPopover(false);
              }}
              aria-label={`Edit "${task.title}"`}
              title="Edit task"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              aria-label={`Delete "${task.title}"`}
              title="Delete task"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Inline Reminder Action Drawer for this Individual Task */}
      {showReminderPopover && !task.completed && (
        <div className="mx-4 sm:mx-5 mb-3.5 p-3.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-slate-800">
              <BellRing className="w-3.5 h-3.5 text-amber-600" />
              <span>Schedule Reminder for “{task.title}”</span>
            </div>
            <button
              type="button"
              onClick={() => setShowReminderPopover(false)}
              aria-label="Close reminder scheduler"
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 mr-1">Quick presets:</span>
            <button
              type="button"
              onClick={() => handleQuickReminder(0.1)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:border-slate-400 hover:text-slate-900 font-mono tabular-nums transition-colors cursor-pointer"
            >
              +6 sec (Test)
            </button>
            <button
              type="button"
              onClick={() => handleQuickReminder(1)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:border-slate-400 hover:text-slate-900 font-mono tabular-nums transition-colors cursor-pointer"
            >
              +1 min
            </button>
            <button
              type="button"
              onClick={() => handleQuickReminder(15)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:border-slate-400 hover:text-slate-900 font-mono tabular-nums transition-colors cursor-pointer"
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => handleQuickReminder(60)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:border-slate-400 hover:text-slate-900 font-mono tabular-nums transition-colors cursor-pointer"
            >
              +1 hour
            </button>
            <button
              type="button"
              onClick={() => {
                onTriggerReminderNow(task);
                setShowReminderPopover(false);
              }}
              className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-900 hover:bg-amber-100 font-medium transition-colors cursor-pointer"
            >
              Ping Alert Now
            </button>
          </div>

          <form
            onSubmit={handleCustomReminderSubmit}
            className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70"
          >
            <div className="flex items-center gap-2">
              <label htmlFor={`custom-rem-${task.id}`} className="text-slate-600">
                Specific time:
              </label>
              <input
                id={`custom-rem-${task.id}`}
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-800 font-mono text-xs focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                disabled={!customDateTime}
                className="px-2.5 py-1 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Set Time
              </button>
            </div>

            {hasActiveReminder && (
              <button
                type="button"
                onClick={() => {
                  onSetReminder(task.id, null);
                  setShowReminderPopover(false);
                }}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
              >
                <BellOff className="w-3.5 h-3.5" />
                Clear Reminder
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
