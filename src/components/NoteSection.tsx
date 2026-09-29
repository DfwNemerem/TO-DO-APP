import React, { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  ListTodo,
  Clock,
  Copy,
  Check,
  Download,
  FileText,
} from 'lucide-react';
import { NoteItem } from '../types';

interface NoteSectionProps {
  notes: NoteItem[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<NoteItem>) => void;
  onExtractTasksFromNote: (tasksText: string[]) => number;
}

export const NoteSection: React.FC<NoteSectionProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
  onExtractTasksFromNote,
}) => {
  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [extractFeedback, setExtractFeedback] = useState<string | null>(null);

  if (!activeNote) {
    return null;
  }

  const content = activeNote.content;
  const wordCount = content.trim()
    ? content.trim().split(/\s+/).length
    : 0;
  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 1;

  // Count how many "- [ ] ..." action lines exist in the current note
  const actionItemMatches = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- [ ] ') && line.slice(6).trim().length > 0);

  const insertSnippet = (prefix: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) {
      onUpdateNote(activeNote.id, {
        content: activeNote.content + (activeNote.content.endsWith('\n') ? '' : '\n') + prefix + suffix,
      });
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const replacement = `${prefix}${selected || 'Text'}${suffix}`;
    const updated = content.slice(0, start) + replacement + content.slice(end);

    onUpdateNote(activeNote.id, { content: updated });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 0);
  };

  const insertTimestamp = () => {
    const stamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const snippet = `[${stamp}] `;
    const updated = content.slice(0, start) + snippet + content.slice(start);
    onUpdateNote(activeNote.id, { content: updated });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownload = () => {
    const blob = new Blob([`# ${activeNote.title}\n\n${activeNote.content}`], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'note'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExtractActionItems = () => {
    if (actionItemMatches.length === 0) {
      setExtractFeedback('Tip: Write lines starting with "- [ ] " to send them to Tasks.');
      setTimeout(() => setExtractFeedback(null), 3200);
      return;
    }

    const cleanTitles = actionItemMatches.map((line) => line.slice(6).trim());
    const addedCount = onExtractTasksFromNote(cleanTitles);

    // Mark extracted items as [x] in the note so they aren't duplicated
    const updatedContent = content
      .split('\n')
      .map((line) => {
        if (line.trim().startsWith('- [ ] ') && line.trim().slice(6).trim().length > 0) {
          return line.replace('- [ ] ', '- [x] ');
        }
        return line;
      })
      .join('\n');

    onUpdateNote(activeNote.id, { content: updatedContent });
    setExtractFeedback(`Added ${addedCount} task${addedCount === 1 ? '' : 's'} to your To-Do list`);
    setTimeout(() => setExtractFeedback(null), 3000);
  };

  return (
    <section
      aria-label="Workspace Notes and Scratchpad"
      className="bg-white border border-slate-200/90 rounded-xl flex flex-col h-full overflow-hidden"
    >
      {/* Top Note Selector Bar */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-slate-700 shrink-0" />
          <h2 className="font-display text-base font-semibold text-slate-900 truncate">
            Studio Notes & Scratchpad
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onCreateNote}
            className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note
          </button>
          {notes.length > 1 && (
            <button
              type="button"
              onClick={() => onDeleteNote(activeNote.id)}
              title="Delete current note"
              aria-label="Delete current note"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Note Tabs */}
      <div className="px-5 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto">
        {notes.map((note) => {
          const isActive = note.id === activeNote.id;
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelectNote(note.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors truncate max-w-[180px] cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {note.title || 'Untitled Note'}
            </button>
          );
        })}
      </div>

      {/* Note Title Input */}
      <div className="px-5 pt-4 pb-2">
        <input
          type="text"
          value={activeNote.title}
          onChange={(e) => onUpdateNote(activeNote.id, { title: e.target.value })}
          placeholder="Note title..."
          aria-label="Note title"
          className="w-full text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none border-b border-transparent focus:border-slate-200 pb-1 transition-colors"
        />
      </div>

      {/* Formatting & Task Extraction Toolbar */}
      <div className="px-5 py-2 border-y border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertSnippet('## ', '')}
            title="Insert Heading"
            className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded font-medium cursor-pointer"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('**', '**')}
            title="Bold text"
            className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded font-semibold cursor-pointer"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('- ', '')}
            title="Bullet point"
            className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('- [ ] ', '')}
            title="Insert extractable checklist item"
            className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded font-mono cursor-pointer"
          >
            [ ] Todo
          </button>
          <button
            type="button"
            onClick={insertTimestamp}
            title="Insert current time"
            className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded inline-flex items-center gap-1 cursor-pointer"
          >
            <Clock className="w-3 h-3" />
            Time
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExtractActionItems}
            title="Convert lines starting with '- [ ] ' into To-Do tasks"
            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 rounded-md font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>
              Send <span className="font-mono tabular-nums">({actionItemMatches.length})</span> to Tasks
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy note to clipboard"
            aria-label="Copy note to clipboard"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Download note as Markdown (.md)"
            aria-label="Download note as Markdown"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {extractFeedback && (
        <div className="px-5 py-1.5 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 font-medium">
          {extractFeedback}
        </div>
      )}

      {/* Freeform Writing Canvas */}
      <div className="flex-1 p-5 flex flex-col min-h-[320px]">
        <textarea
          ref={textareaRef}
          value={activeNote.content}
          onChange={(e) => onUpdateNote(activeNote.id, { content: e.target.value })}
          placeholder="Write meeting notes, freeform thoughts, or type '- [ ] Task name' to push items directly to your To-Do list..."
          aria-label="Note content editor"
          className="w-full flex-1 resize-none text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none font-sans"
        />
      </div>

      {/* Footer Metadata (Unboxed, Tabular Numerals, Auto-Save Timestamp) */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2 font-mono tabular-nums">
          <span>{wordCount} words</span>
          <span aria-hidden="true">·</span>
          <span>{charCount} chars</span>
          <span aria-hidden="true">·</span>
          <span>{lineCount} lines</span>
        </div>
        <div className="font-mono tabular-nums text-slate-400">
          Saved to localStorage ·{' '}
          {new Date(activeNote.updatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>
    </section>
  );
};
