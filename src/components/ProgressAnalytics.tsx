import React from 'react';
import { Task, TaskCategory } from '../types';

interface ProgressAnalyticsProps {
  tasks: Task[];
  onFilterSelect: (category: TaskCategory | 'ALL') => void;
  selectedCategory: TaskCategory | 'ALL';
}

const CATEGORIES: TaskCategory[] = ['Product', 'Work', 'Personal', 'Errands'];

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  tasks,
  onFilterSelect,
  selectedCategory,
}) => {
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const activeRemindersCount = tasks.filter(
    (t) => !t.completed && t.reminderAt && t.reminderAt > Date.now()
  ).length;

  const getStatusLabel = (pct: number, total: number) => {
    if (total === 0) return 'No tasks queued';
    if (pct === 100) return 'All tasks complete';
    if (pct >= 75) return 'Final stretch';
    if (pct >= 40) return 'Steady momentum';
    if (pct > 0) return 'In progress';
    return 'Ready to begin';
  };

  return (
    <section
      aria-label="Task Completion Progress"
      className="bg-white border border-slate-200/90 rounded-xl p-6 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Completion Progress</span>
            <span aria-hidden="true">·</span>
            <span>{getStatusLabel(percentage, totalCount)}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              {percentage}%
            </span>
            <span className="text-sm text-slate-600 font-mono tabular-nums">
              {completedCount} of {totalCount} completed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-600 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div>
            <span className="text-slate-400 block mb-0.5">Remaining</span>
            <span className="font-mono tabular-nums font-semibold text-sm text-slate-900">
              {pendingCount}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <span className="text-slate-400 block mb-0.5">Done</span>
            <span className="font-mono tabular-nums font-semibold text-sm text-emerald-700">
              {completedCount}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <span className="text-slate-400 block mb-0.5">Reminders</span>
            <span className="font-mono tabular-nums font-semibold text-sm text-amber-700">
              {activeRemindersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Task completion: ${percentage}%`}
        className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-slate-900 rounded-full transition-transform duration-300 ease-out origin-left"
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
      </div>

      {/* Category Breakdown & Interactive Filter Strip */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">Filter by domain:</span>
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onFilterSelect('ALL')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalCount})
          </button>
          {CATEGORIES.map((cat) => {
            const catTasks = tasks.filter((t) => t.category === cat);
            const catDone = catTasks.filter((t) => t.completed).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onFilterSelect(cat)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap font-sans ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}{' '}
                <span className="font-mono tabular-nums text-[11px] text-slate-400">
                  {catDone}/{catTasks.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
