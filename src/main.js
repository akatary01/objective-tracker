import Alpine from 'alpinejs';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = isTauri() ? getCurrentWindow() : null;

window.resizeTaskText = (element) => {
  if (!element) return;
  const style = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.35;
  const maxHeight = Math.ceil(lineHeight * 3);
  element.style.height = 'auto';
  const contentHeight = Math.max(element.scrollHeight, lineHeight);
  element.style.height = `${Math.min(contentHeight, maxHeight)}px`;
  element.style.overflowY = contentHeight > maxHeight + 1 ? 'auto' : 'hidden';
  element.closest('.task-row')?.classList.toggle('task-row-multiline', contentHeight > lineHeight + 1);
};

window.addEventListener('resize', () => {
  document.querySelectorAll('textarea.task-text').forEach(window.resizeTaskText);
});

const DEFAULT_BACKGROUND_THEME = {
  primary: '#f0efe9',
  secondary: '#e5e5e3',
  plus: '#3e3e40',
  fontPrimary: '#1c1c1e',
  fontSecondary: '#5e5e62',
};

const THEME_SEQUENCE = [
  { label: 'Paper', primary: '#f0efe9', secondary: '#e5e5e3', plus: '#3e3e40', fontPrimary: '#1c1c1e', fontSecondary: '#5e5e62' },
  { label: 'Sky', primary: '#d9ecff', secondary: '#c7def5', plus: '#2d5b84', fontPrimary: '#17384f', fontSecondary: '#3c5f79' },
  { label: 'Lemon', primary: '#fff6cc', secondary: '#ebe2b6', plus: '#7d6625', fontPrimary: '#4e4210', fontSecondary: '#786833' },
  { label: 'Mint', primary: '#ddf4e5', secondary: '#c8e1d1', plus: '#2f6a4f', fontPrimary: '#1f4c38', fontSecondary: '#44745f' },
  { label: 'Rose', primary: '#ffe1dc', secondary: '#eccbc6', plus: '#8b4d47', fontPrimary: '#5f3431', fontSecondary: '#8a5854' },
  { label: 'Stone', primary: '#dedede', secondary: '#c9c9c9', plus: '#4b4b4b', fontPrimary: '#2f2f2f', fontSecondary: '#555555' },
];

function hexToRgba(hex, alpha = 1) {
  const clean = (hex || '#808080').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((part) => part + part).join('') : clean;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getThemeScheme(theme) {
  const base = theme.primary || DEFAULT_BACKGROUND_THEME.primary;
  const normalized = base.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return r * 0.299 + g * 0.587 + b * 0.114 > 160 ? 'light' : 'dark';
}

function applyBackgroundTheme(theme) {
  document.documentElement.style.setProperty('--bg-primary', theme.primary);
  document.documentElement.style.setProperty('--bg-secondary', theme.secondary);
  document.documentElement.style.setProperty('--plus-color', theme.plus || DEFAULT_BACKGROUND_THEME.plus);
  document.documentElement.style.setProperty('--task-accent', theme.plus || DEFAULT_BACKGROUND_THEME.plus);
  document.documentElement.style.setProperty('--font-color-primary', theme.fontPrimary || DEFAULT_BACKGROUND_THEME.fontPrimary);
  document.documentElement.style.setProperty('--font-color-secondary', theme.fontSecondary || DEFAULT_BACKGROUND_THEME.fontSecondary);
  document.documentElement.style.setProperty('--scrollbar-thumb', hexToRgba(theme.secondary || DEFAULT_BACKGROUND_THEME.secondary, 0.45));
  document.documentElement.style.setProperty('--scrollbar-thumb-hover', hexToRgba(theme.secondary || DEFAULT_BACKGROUND_THEME.secondary, 0.7));
  document.documentElement.style.setProperty('--deadline-bg', hexToRgba(theme.primary || DEFAULT_BACKGROUND_THEME.primary, 0.26));
  document.documentElement.style.setProperty('--deadline-border', hexToRgba(theme.fontSecondary || DEFAULT_BACKGROUND_THEME.fontSecondary, 0.35));
  document.documentElement.style.colorScheme = getThemeScheme(theme);
}

function normalizeBackgroundTheme(theme) {
  return {
    primary: theme.primary,
    secondary: theme.secondary,
    plus: theme.plus || DEFAULT_BACKGROUND_THEME.plus,
    fontPrimary: theme.fontPrimary || DEFAULT_BACKGROUND_THEME.fontPrimary,
    fontSecondary: theme.fontSecondary || DEFAULT_BACKGROUND_THEME.fontSecondary,
  };
}

function clearDeadlineFields(task) {
  task.deadlineDate = '';
  task.deadlineTime = '';
  task.deadlineMonth = '';
  task.deadlineDay = '';
  task.deadlineYear = '';
  task.deadlineHour = '';
  task.deadlineMinute = '';
  task.deadlineEditorOpen = false;
  task.deadlineDateInput = '';
  task.deadlineTimeInput = '';
  task.deadlinePeriod = 'AM';
  task.deadlineError = '';
}

function populateDeadlineEditor(task) {
  const [year, month, day] = String(task.deadlineDate || '').split('-');
  const [hour, minute] = String(task.deadlineTime || '').split(':');
  const hourNumber = Number(hour);
  const period = hourNumber >= 12 ? 'PM' : 'AM';
  const displayHour = hourNumber % 12 || 12;
  task.deadlineDateInput = year && month && day ? `${month}/${day}/${year}` : '';
  task.deadlineTimeInput = hour && minute ? `${displayHour}:${minute}` : '';
  task.deadlinePeriod = period;
  task.deadlineError = '';
}

function parseDeadlineDate(value) {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);
  if (!match) return null;
  const [, month, day, enteredYear] = match;
  const year = enteredYear || String(new Date().getFullYear());
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

function parseDeadlineTime(value, period) {
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match || !['AM', 'PM'].includes(period)) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || '00');
  if (hour < 1 || hour > 12 || minute > 59) return null;
  const hour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function localDateKey(date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDeadlineTime(value) {
  if (!value) return '';
  const [minutes] = String(value).split(':').slice(1);
  const options = { hour: 'numeric' };
  if (minutes && minutes !== '00') options.minute = '2-digit';
  return new Date(`2000-01-01T${value}:00`).toLocaleTimeString([], options);
}

function parseDateKey(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(Number(yearText), Number(monthText) - 1, Number(dayText));
  if (date.getFullYear() !== Number(yearText) || date.getMonth() !== Number(monthText) - 1 || date.getDate() !== Number(dayText)) return null;
  return date;
}

function monthYearForDateKey(value) {
  const date = parseDateKey(value);
  return date ? `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` : '';
}

function deadlineSortValue(task) {
  if (!task?.deadlineDate && !task?.deadlineTime) return Number.POSITIVE_INFINITY;
  const date = task.deadlineDate || new Date().toISOString().slice(0, 10);
  const time = task.deadlineTime || '00:00';
  return Date.parse(`${date}T${time}:00`);
}

function isTaskComplete(task) {
  return task?.subtasks?.length ? task.subtasks.every((subtask) => subtask.checked) : Boolean(task?.checked);
}

function compareTasks(first, second) {
  const completionOrder = Number(isTaskComplete(first)) - Number(isTaskComplete(second));
  return completionOrder || deadlineSortValue(first) - deadlineSortValue(second);
}

function compareSubtasks(first, second) {
  return Number(Boolean(first.checked)) - Number(Boolean(second.checked));
}

const themeState = { index: 0 };

async function cycleTheme() {
  themeState.index = (themeState.index + 1) % THEME_SEQUENCE.length;
  const next = THEME_SEQUENCE[themeState.index];
  applyBackgroundTheme(next);
  localStorage.setItem('objective-tracker-bg-v1', JSON.stringify(next));
}

const shellState = {
  editMode: false,
};

function isTextClipped(element) {
  return element.scrollWidth > element.clientWidth;
}

window.objectiveTracker = {
  minimizeWindow: async () => {
    if (!appWindow) return;
    await appWindow.minimize();
  },
  toggleMaximize: async () => {
    if (!appWindow) return;
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
      return;
    }
    await appWindow.maximize();
  },
  toggleFullScreen: async () => {
    if (!appWindow) return;
    const isFullscreen = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFullscreen);
  },
  toggleEditMode: () => {
    shellState.editMode = !shellState.editMode;
    document.body.classList.toggle('edit-mode', shellState.editMode);
  },
  openAppMenu: () => {
    const firstSection = document.querySelector('.section');
    if (firstSection) {
      firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const { tracker } = Alpine.store('tracker') || {};
    if (tracker) tracker.addSection();
  },
  cycleTheme,
  closeWindow: async () => {
    if (!appWindow) return;
    await appWindow.close();
  },
  onBackgroundThemeSelected: (callback) => callback(THEME_SEQUENCE[themeState.index]),
};

document.addEventListener('alpine:init', () => {
  const storedTheme = localStorage.getItem('objective-tracker-bg-v1');
  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme);
      if (parsed?.primary && parsed?.secondary) {
        const index = THEME_SEQUENCE.findIndex((theme) => theme.primary === parsed.primary && theme.secondary === parsed.secondary);
        if (index >= 0) themeState.index = index;
        applyBackgroundTheme(parsed);
      }
    } catch {
      applyBackgroundTheme(DEFAULT_BACKGROUND_THEME);
    }
  } else {
    applyBackgroundTheme(DEFAULT_BACKGROUND_THEME);
  }

  const STORAGE_KEY = 'objective-tracker-v1';
  const BG_STORAGE_KEY = 'objective-tracker-bg-v1';
  const DAY_TASKS_STORAGE_KEY = 'objective-tracker-days-v1';
  const DAY_VIEW_STORAGE_KEY = 'objective-tracker-day-view-v1';

  function showTooltipForElement(element, text) {
    if (!element || !text) return;
    const tooltip = document.getElementById('app-hover-tooltip');
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.classList.add('visible');

    const margin = 12;
    const tooltipWidth = Math.min(tooltip.offsetWidth || 140, window.innerWidth - margin * 2);
    const tooltipHeight = tooltip.offsetHeight || 24;
    const rect = element.getBoundingClientRect();
    const maxLeft = window.innerWidth - tooltipWidth - margin;
    const clampedLeft = Math.min(Math.max(rect.left, margin), Math.max(margin, maxLeft));
    const preferredTop = rect.bottom + 8;
    const canFitBelow = preferredTop + tooltipHeight + margin <= window.innerHeight;
    const finalTop = canFitBelow ? preferredTop : Math.max(margin, rect.top - tooltipHeight - 8);

    tooltip.style.left = `${clampedLeft}px`;
    tooltip.style.top = `${finalTop}px`;
  }

  function hideTooltipForElement() {
    const tooltip = document.getElementById('app-hover-tooltip');
    if (!tooltip) return;
    tooltip.classList.remove('visible');
  }

  document.addEventListener('mouseover', (event) => {
    const element = event.target.closest('.task-text, .subtask-text, .new-section-btn, .theme-btn, .view-mode-btn, .day-add-btn');
    if (!element) return;
    const isTaskInput = element.matches('.task-text, .subtask-text');
    if (isTaskInput && !isTextClipped(element)) return;
    const text = isTaskInput ? element.value : element.getAttribute('title');
    if (!text) return;
    element.dataset.tooltip = text;
    element.removeAttribute('title');
    showTooltipForElement(element, text);
  });

  document.addEventListener('mousemove', (event) => {
    const element = event.target.closest('[data-tooltip]');
    if (!element) return;
    if (element.matches('.task-text, .subtask-text') && !isTextClipped(element)) {
      hideTooltipForElement();
      return;
    }
    const text = element.dataset.tooltip;
    if (!text) return;
    showTooltipForElement(element, text);
  });

  document.addEventListener('mouseout', (event) => {
    const element = event.target.closest('[data-tooltip]');
    if (!element) return;
    const next = event.relatedTarget;
    if (next && element.contains(next)) return;
    hideTooltipForElement();
    if (element.matches('.new-section-btn, .theme-btn, .view-mode-btn, .day-add-btn')) {
      element.setAttribute('title', element.dataset.tooltip);
    }
    delete element.dataset.tooltip;
  });

  let pointerDragState = null;

  function clearPointerDrag() {
    if (pointerDragState?.handle?.hasPointerCapture(pointerDragState.pointerId)) {
      pointerDragState.handle.releasePointerCapture(pointerDragState.pointerId);
    }
    document.querySelectorAll('.subtask-row.dragging, .subtask-row.drag-target').forEach((row) => {
      row.classList.remove('dragging', 'drag-target');
    });
    pointerDragState = null;
  }

  document.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.drag-handle');
    const row = handle?.closest('.subtask-row');
    if (!row) return;
    const tracker = Alpine.store('tracker');
    const source = row.dataset.source || 'section';
    const task = source === 'day'
      ? Object.values(tracker.dayTasks).flat().find((item) => item.id === row.dataset.taskId)
      : tracker.sections.flatMap((section) => section.tasks).find((item) => item.id === row.dataset.taskId);
    const subtask = task?.subtasks.find((item) => item.id === row.dataset.subtaskId);
    if (!task || !subtask || task.subtasks.length <= 1) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    pointerDragState = { pointerId: event.pointerId, handle, task, subtask, source, targetRow: row, targetSubtask: subtask };
    row.classList.add('dragging');
  });

  document.addEventListener('pointermove', (event) => {
    if (!pointerDragState || event.pointerId !== pointerDragState.pointerId) return;
    const row = document.elementFromPoint(event.clientX, event.clientY)?.closest('.subtask-row');
    if (!row || row.dataset.taskId !== pointerDragState.task.id || (row.dataset.source || 'section') !== pointerDragState.source) return;
    const targetSubtask = pointerDragState.task.subtasks.find((item) => item.id === row.dataset.subtaskId);
    if (!targetSubtask) return;
    if (pointerDragState.targetRow !== row) {
      pointerDragState.targetRow?.classList.remove('drag-target');
      row.classList.add('drag-target');
      pointerDragState.targetRow = row;
      pointerDragState.targetSubtask = targetSubtask;
    }
  });

  document.addEventListener('pointerup', (event) => {
    if (!pointerDragState || event.pointerId !== pointerDragState.pointerId) return;
    const { task, subtask, targetSubtask, source } = pointerDragState;
    if (subtask !== targetSubtask) {
      const tracker = Alpine.store('tracker');
      tracker.startDrag(subtask, task.subtasks, 'subtask');
      if (source === 'day') tracker.moveDaySubtask(task, targetSubtask);
      else tracker.moveSubtask(task, targetSubtask);
    }
    clearPointerDrag();
  });

  document.addEventListener('pointercancel', clearPointerDrag);

  Alpine.store('tracker', {
    sections: [],
    dayTasks: {},
    newDayTaskSectionId: '',
    viewMode: 'sections',
    selectedDay: localDateKey(new Date()),
    monthYearInput: monthYearForDateKey(localDateKey(new Date())),
    currentTime: Date.now(),
    backgroundTheme: { ...DEFAULT_BACKGROUND_THEME },
    dragState: null,

    init() {
      setInterval(() => { this.currentTime = Date.now(); }, 30_000);
      const saved = localStorage.getItem(STORAGE_KEY);
      let defaultedTimeOnlyDeadline = false;
      if (saved) {
        this.sections = JSON.parse(saved);
        this.sections.forEach((section) => {
          section.minimized = Boolean(section.minimized);
          if (!section.tasks) return;
          section.tasks.forEach((task) => {
            task.minimized = Boolean(task.minimized);
            if (task.deadline && !task.deadlineDate && !task.deadlineTime) {
              const [datePart, timePart] = String(task.deadline).split('T');
              task.deadlineDate = datePart || '';
              task.deadlineTime = timePart || '';
            }
            task.deadlineDate = task.deadlineDate || '';
            task.deadlineTime = task.deadlineTime || '';
            if (!task.deadlineDate && task.deadlineTime) {
              task.deadlineDate = localDateKey(new Date());
              defaultedTimeOnlyDeadline = true;
            }
            task.deadlineMonth = task.deadlineDate ? String(new Date(`${task.deadlineDate}T00:00`).getMonth() + 1) : '';
            task.deadlineDay = task.deadlineDate ? String(new Date(`${task.deadlineDate}T00:00`).getDate()) : '';
            task.deadlineYear = task.deadlineDate ? String(new Date(`${task.deadlineDate}T00:00`).getFullYear()) : '';
            task.deadlineHour = task.deadlineTime ? String(Math.floor(Number(task.deadlineTime.split(':')[0]) || 0)) : '';
            task.deadlineMinute = task.deadlineTime ? String((Number(task.deadlineTime.split(':')[1]) || 0)) : '';
            task.deadlineEditorOpen = false;
            populateDeadlineEditor(task);
          });
          section.tasks.forEach((task) => task.subtasks.sort(compareSubtasks));
          section.tasks.sort(compareTasks);
        });
        if (defaultedTimeOnlyDeadline) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sections));
      }

      const savedDayView = localStorage.getItem(DAY_VIEW_STORAGE_KEY);
      if (savedDayView) {
        try {
          const parsed = JSON.parse(savedDayView);
          if (parsed?.viewMode === 'days' || parsed?.viewMode === 'sections') this.viewMode = parsed.viewMode;
          if (parseDateKey(parsed?.selectedDay)) this.selectedDay = parsed.selectedDay;
        } catch {
          // Ignore invalid date-view settings without affecting saved section data.
        }
      }
      this.monthYearInput = monthYearForDateKey(this.selectedDay);

      const savedDayTasks = localStorage.getItem(DAY_TASKS_STORAGE_KEY);
      if (savedDayTasks) {
        try {
          const parsed = JSON.parse(savedDayTasks);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) this.dayTasks = parsed;
        } catch {
          this.dayTasks = {};
        }
      }
      Object.entries(this.dayTasks).forEach(([dateKey, tasks]) => {
        if (!parseDateKey(dateKey) || !Array.isArray(tasks)) {
          delete this.dayTasks[dateKey];
          return;
        }
        this.dayTasks[dateKey] = tasks.map((task) => {
          const entry = task && typeof task === 'object' ? task : {};
          return {
            ...entry,
            id: entry.id || this.uid(),
            text: entry.text || '',
            checked: Boolean(entry.checked),
            minimized: Boolean(entry.minimized),
            subtasks: Array.isArray(entry.subtasks) ? entry.subtasks.map((subtask) => {
              const child = subtask && typeof subtask === 'object' ? subtask : {};
              return { ...child, id: child.id || this.uid(), text: child.text || '', checked: Boolean(child.checked) };
            }) : [],
          };
        });
      });
      this.saveDayTasks();

      const savedTheme = localStorage.getItem(BG_STORAGE_KEY);
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme);
          if (parsed?.primary && parsed?.secondary) {
            this.backgroundTheme = normalizeBackgroundTheme(parsed);
            applyBackgroundTheme(this.backgroundTheme);
          }
        } catch {
          applyBackgroundTheme(DEFAULT_BACKGROUND_THEME);
        }
      }
    },

    saveDayView() {
      localStorage.setItem(DAY_VIEW_STORAGE_KEY, JSON.stringify({ viewMode: this.viewMode, selectedDay: this.selectedDay }));
    },

    toggleView() {
      if (this.viewMode === 'sections') {
        this.viewMode = 'days';
        this.selectedDay = localDateKey(new Date());
        this.monthYearInput = monthYearForDateKey(this.selectedDay);
      } else {
        this.viewMode = 'sections';
      }
      this.saveDayView();
    },

    setMonthYear(value) {
      this.monthYearInput = value;
      const match = String(value || '').trim().match(/^(\d{2})\/(\d{4})$/);
      if (!match) return;
      const month = Number(match[1]);
      const year = Number(match[2]);
      if (month < 1 || month > 12 || year < 1 || year > 9999) return;

      const currentDate = parseDateKey(this.selectedDay) || new Date();
      const lastDay = new Date(0);
      lastDay.setFullYear(year, month, 0);
      const lastDayOfMonth = lastDay.getDate();
      const nextDate = new Date(0);
      nextDate.setHours(0, 0, 0, 0);
      nextDate.setFullYear(year, month - 1, Math.min(currentDate.getDate(), lastDayOfMonth));
      this.selectedDay = localDateKey(nextDate);
      this.monthYearInput = monthYearForDateKey(this.selectedDay);
      this.saveDayView();
    },

    normalizeMonthYearInput() {
      this.monthYearInput = monthYearForDateKey(this.selectedDay);
    },

    selectDay(dateKey) {
      if (!parseDateKey(dateKey)) return;
      this.selectedDay = dateKey;
      this.monthYearInput = monthYearForDateKey(dateKey);
      this.saveDayView();
    },

    shiftDayWeek(amount) {
      const date = parseDateKey(this.selectedDay) || new Date();
      date.setDate(date.getDate() + amount);
      this.selectedDay = localDateKey(date);
      this.monthYearInput = monthYearForDateKey(this.selectedDay);
      this.saveDayView();
    },

    visibleDays() {
      const selected = parseDateKey(this.selectedDay) || new Date();
      const first = new Date(selected);
      first.setDate(first.getDate() - 3);
      return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(first);
        day.setDate(first.getDate() + index);
        return {
          key: localDateKey(day),
          weekday: day.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
          number: day.getDate(),
        };
      });
    },

    selectedDayLabel() {
      if (this.selectedDay === localDateKey(new Date())) return 'Today';
      const date = parseDateKey(this.selectedDay);
      return date ? date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';
    },

    selectedWeekday() {
      const date = parseDateKey(this.selectedDay);
      return date ? date.toLocaleDateString(undefined, { weekday: 'long' }) : 'day';
    },

    dayTasksForSelectedDate() {
      return this.dayTasks[this.selectedDay] || [];
    },

    canAddDayTask() {
      return this.sections.some((section) => section.id === this.newDayTaskSectionId);
    },

    isDueToday(deadlineDate) {
      return Boolean(deadlineDate) && deadlineDate === localDateKey(new Date());
    },

    isOverdueTask(task) {
      return this.isDeadlineOverdue(task?.deadlineDate, task?.deadlineTime, isTaskComplete(task));
    },

    isDeadlineOverdue(deadlineDate, deadlineTime, isComplete) {
      if (!deadlineDate || isComplete) return false;
      const today = localDateKey(new Date(this.currentTime));
      if (deadlineDate < today) return true;
      if (deadlineDate !== today || !deadlineTime) return false;
      const deadline = Date.parse(`${deadlineDate}T${deadlineTime}:00`);
      return Number.isFinite(deadline) && deadline < this.currentTime;
    },

    isDayViewEntryOverdue(entry) {
      const deadlineDate = entry.source === 'day' ? this.selectedDay : entry.task.deadlineDate;
      return this.isDeadlineOverdue(deadlineDate, entry.task.deadlineTime, isTaskComplete(entry.task));
    },

    isFirstOverdueDayEntry(entry) {
      return this.dayViewEntries().find((item) => this.isDayViewEntryOverdue(item))?.key === entry.key;
    },

    tasksForSection(section) {
      return [...(section.tasks || [])].sort((first, second) => {
        const overdueOrder = Number(this.isOverdueTask(first)) - Number(this.isOverdueTask(second));
        return overdueOrder || compareTasks(first, second);
      });
    },

    isFirstOverdueTask(section, task) {
      if (!this.isOverdueTask(task)) return false;
      return this.tasksForSection(section).find((item) => this.isOverdueTask(item))?.id === task.id;
    },

    addFromToolbar() {
      if (this.viewMode === 'sections') {
        this.addSection();
        return;
      }
      if (!this.canAddDayTask()) {
        document.querySelector('.day-section-select')?.focus();
        return;
      }
      this.addDayTask();
    },

    dayViewEntries() {
      const sectionEntries = this.sections.flatMap((section) => (section.tasks || [])
        .filter((task) => task.deadlineDate === this.selectedDay)
        .map((task) => ({ key: `section:${section.id}:${task.id}`, source: 'section', section, task })));
      const standaloneEntries = this.dayTasksForSelectedDate()
        .map((task) => ({ key: `day:${task.id}`, source: 'day', section: null, task }));
      return [...sectionEntries, ...standaloneEntries].sort((first, second) => {
        const overdueOrder = Number(this.isDayViewEntryOverdue(first)) - Number(this.isDayViewEntryOverdue(second));
        if (overdueOrder) return overdueOrder;
        const completionOrder = Number(isTaskComplete(first.task)) - Number(isTaskComplete(second.task));
        if (completionOrder) return completionOrder;

        const firstTime = first.task.deadlineTime ? first.task.deadlineTime.replace(':', '') : '';
        const secondTime = second.task.deadlineTime ? second.task.deadlineTime.replace(':', '') : '';
        if (!firstTime && !secondTime) return 0;
        if (!firstTime) return 1;
        if (!secondTime) return -1;
        return Number(firstTime) - Number(secondTime);
      });
    },

    formatDayTime(task) {
      if (!task?.deadlineTime) return 'No time';
      return formatDeadlineTime(task.deadlineTime);
    },

    toggleDayViewDeadlineEditor(entry) {
      if (!entry?.task) return;
      if (!entry.task.deadlineEditorOpen) {
        // Day tasks belong to the selected date even when only their time is edited.
        if (entry.source === 'day') entry.task.deadlineDate = this.selectedDay;
        populateDeadlineEditor(entry.task);
      }
      entry.task.deadlineEditorOpen = !entry.task.deadlineEditorOpen;
    },

    saveDayViewDeadline(entry) {
      if (!entry?.task) return;
      const persist = () => this.saveDayViewEntry(entry);
      this.saveDeadline(entry.task, persist);
    },

    clearDayTimeDeadline(entry) {
      if (!entry?.task) return;
      entry.task.deadlineDate = this.selectedDay;
      entry.task.deadlineTime = '';
      entry.task.deadlineTimeInput = '';
      entry.task.deadlineError = '';
      entry.task.deadlineEditorOpen = false;
      this.saveDayViewEntry(entry);
    },

    dayProgress() {
      let done = 0;
      let total = 0;
      this.dayViewEntries().forEach(({ task }) => {
        if (!task.subtasks.length) {
          total++;
          if (task.checked) done++;
        } else {
          task.subtasks.forEach((subtask) => {
            total++;
            if (subtask.checked) done++;
          });
        }
      });
      return { done, total };
    },

    isDayViewTaskChecked(entry) {
      return entry.source === 'section' ? this.isTaskChecked(entry.task) : this.isDayTaskChecked(entry.task);
    },

    saveDayViewEntry(entry) {
      if (entry.source === 'section') this.save();
      else this.saveDayTasks();
    },

    updateDayViewTaskText(entry) {
      entry.task.text = entry.task.text.charAt(0).toUpperCase() + entry.task.text.slice(1);
      this.saveDayViewEntry(entry);
    },

    updateDayViewSubtaskText(entry, subtask) {
      subtask.text = subtask.text.charAt(0).toUpperCase() + subtask.text.slice(1);
      this.saveDayViewEntry(entry);
    },

    toggleDayViewTask(entry) {
      if (entry.source === 'section') this.toggleTask(entry.task);
      else this.toggleDayTask(entry.task);
    },

    toggleDayViewTaskMinimized(entry) {
      if (entry.source === 'section') this.toggleTaskMinimized(entry.task);
      else this.toggleDayTaskMinimized(entry.task);
    },

    addDayViewSubtask(entry) {
      if (entry.source === 'section') this.addSubtask(entry.task);
      else this.addDaySubtask(entry.task);
    },

    deleteDayViewTask(entry) {
      if (entry.source === 'section') this.deleteTask(entry.section, entry.task);
      else this.deleteDayTask(entry.task);
    },

    toggleDayViewSubtask(entry, subtask) {
      if (entry.source === 'section') this.toggleSubtask(entry.task, subtask);
      else this.toggleDaySubtask(entry.task, subtask);
    },

    deleteDayViewSubtask(entry, subtask) {
      if (entry.source === 'section') this.deleteSubtask(entry.task, subtask);
      else this.deleteDaySubtask(entry.task, subtask);
    },

    saveDayTasks() {
      localStorage.setItem(DAY_TASKS_STORAGE_KEY, JSON.stringify(this.dayTasks));
    },

    addDayTask(sectionId = this.newDayTaskSectionId) {
      const section = this.sections.find((item) => item.id === sectionId);
      if (!section) return;
      section.tasks.push({
        id: this.uid(),
        text: '',
        checked: false,
        minimized: false,
        deadlineDate: this.selectedDay,
        deadlineTime: '',
        deadlineMonth: '',
        deadlineDay: '',
        deadlineYear: '',
        deadlineHour: '',
        deadlineMinute: '',
        deadlineEditorOpen: false,
        deadlineDateInput: '',
        deadlineTimeInput: '',
        deadlinePeriod: 'AM',
        deadlineError: '',
        subtasks: [],
      });
      this.save();
    },

    deleteDayTask(task) {
      const tasks = this.dayTasksForSelectedDate();
      const index = tasks.indexOf(task);
      if (index < 0) return;
      tasks.splice(index, 1);
      this.saveDayTasks();
    },

    isDayTaskChecked(task) {
      return task.subtasks.length ? task.subtasks.every((subtask) => subtask.checked) : task.checked;
    },

    toggleDayTask(task) {
      if (task.subtasks.length) {
        const allChecked = task.subtasks.every((subtask) => subtask.checked);
        task.subtasks.forEach((subtask) => { subtask.checked = !allChecked; });
        task.checked = !allChecked;
      } else {
        task.checked = !task.checked;
      }
      this.saveDayTasks();
    },

    toggleDayTaskMinimized(task) {
      task.minimized = !task.minimized;
      this.saveDayTasks();
    },

    addDaySubtask(task) {
      task.subtasks.push({ id: this.uid(), text: '', checked: false });
      this.saveDayTasks();
    },

    deleteDaySubtask(task, subtask) {
      const index = task.subtasks.indexOf(subtask);
      if (index < 0) return;
      task.subtasks.splice(index, 1);
      this.saveDayTasks();
    },

    toggleDaySubtask(task, subtask) {
      subtask.checked = !subtask.checked;
      this.saveDayTasks();
    },

    formatDeadline(task) {
      if (!task?.deadlineDate && !task?.deadlineTime) return 'No deadline';
      const dateText = task.deadlineDate
        ? (task.deadlineDate === localDateKey(new Date())
          ? 'Today'
          : (() => {
            const date = new Date(`${task.deadlineDate}T00:00:00`);
            const options = { month: 'short', day: 'numeric' };
            if (date.getFullYear() !== new Date().getFullYear()) options.year = 'numeric';
            return date.toLocaleDateString(undefined, options);
          })())
        : '';
      const timeText = formatDeadlineTime(task.deadlineTime);
      if (dateText && timeText) return `${dateText} • ${timeText}`;
      if (dateText) return dateText;
      if (timeText) return timeText;
      return 'No deadline';
    },

    toggleDeadlineEditor(task) {
      if (!task) return;
      if (!task.deadlineEditorOpen) populateDeadlineEditor(task);
      task.deadlineEditorOpen = !task.deadlineEditorOpen;
    },

    saveDeadline(task, persist = () => this.save()) {
      const dateInput = String(task.deadlineDateInput || '').trim();
      const timeInput = String(task.deadlineTimeInput || '').trim();
      const hasDate = Boolean(dateInput);
      const hasTime = Boolean(timeInput);

      if (!hasDate && !hasTime) {
        clearDeadlineFields(task);
        persist();
        return;
      }

      const deadlineDate = hasDate ? parseDeadlineDate(dateInput) : '';
      const deadlineTime = hasTime ? parseDeadlineTime(timeInput, task.deadlinePeriod) : '';
      if ((hasDate && !deadlineDate) || (hasTime && !deadlineTime)) {
        task.deadlineError = hasDate && !deadlineDate ? 'Use a valid date: MM/DD or MM/DD/YYYY' : 'Use a valid time: h or h:mm and AM or PM';
        return;
      }

      task.deadlineDate = deadlineDate || (deadlineTime ? localDateKey(new Date()) : '');
      task.deadlineTime = deadlineTime;
      task.deadlineError = '';
      task.deadlineEditorOpen = false;
      persist();
    },

    clearDeadline(task) {
      if (!task) return;
      clearDeadlineFields(task);
      this.save();
    },

    save() {
      this.sections.forEach((section) => {
        section.tasks.forEach((task) => task.subtasks.sort(compareSubtasks));
        section.tasks.sort(compareTasks);
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sections));
    },

    saveBackgroundTheme() {
      localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(this.backgroundTheme));
    },

    clearDrag() {
      this.dragState = null;
    },

    isDragging(item) {
      return this.dragState?.item?.id === item?.id;
    },

    startDrag(item, list, type) {
      this.dragState = { item, list, type };
    },

    moveSubtask(task, targetSubtask) {
      this.reorderSubtask(task, targetSubtask, () => this.save());
    },

    moveDaySubtask(task, targetSubtask) {
      this.reorderSubtask(task, targetSubtask, () => this.saveDayTasks());
    },

    reorderSubtask(task, targetSubtask, persist) {
      if (!this.dragState || this.dragState.type !== 'subtask') return;
      const list = task.subtasks;
      const draggedSubtask = this.dragState.item;
      const fromIndex = list.indexOf(draggedSubtask);
      const toIndex = list.indexOf(targetSubtask);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        this.dragState = null;
        return;
      }
      list.splice(fromIndex, 1);
      list.splice(toIndex, 0, draggedSubtask);
      this.dragState = null;
      persist();
    },

    setBackgroundTheme(theme) {
      if (!theme?.primary || !theme?.secondary) return;
      this.backgroundTheme = normalizeBackgroundTheme(theme);
      applyBackgroundTheme(this.backgroundTheme);
      this.saveBackgroundTheme();
    },

    uid: () => crypto.randomUUID(),

    progress(section) {
      let done = 0, total = 0;
      for (const task of section.tasks) {
        if (!task.subtasks.length) {
          total++;
          if (task.checked) done++;
        } else {
          for (const sub of task.subtasks) {
            total++;
            if (sub.checked) done++;
          }
        }
      }
      return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
    },

    isTaskChecked(task) {
      if (task.subtasks.length) return task.subtasks.every((sub) => sub.checked);
      return task.checked;
    },

    addSection() {
      this.sections.push({ id: this.uid(), title: 'Section', minimized: false, tasks: [] });
      this.save();
    },

    toggleSectionMinimized(section) {
      section.minimized = !section.minimized;
      this.save();
    },

    deleteSection(section) {
      this.sections.splice(this.sections.indexOf(section), 1);
      this.save();
    },

    addTask(section) {
      section.tasks.push({
        id: this.uid(),
        text: '',
        checked: false,
        minimized: false,
        deadlineDate: '',
        deadlineTime: '',
        deadlineMonth: '',
        deadlineDay: '',
        deadlineYear: '',
        deadlineHour: '',
        deadlineMinute: '',
        deadlineEditorOpen: false,
        deadlineDateInput: '',
        deadlineTimeInput: '',
        deadlinePeriod: 'AM',
        deadlineError: '',
        subtasks: [],
      });
      this.save();
    },

    toggleTaskMinimized(task) {
      task.minimized = !task.minimized;
      this.save();
    },

    deleteTask(section, task) {
      section.tasks.splice(section.tasks.indexOf(task), 1);
      this.save();
    },

    toggleTask(task) {
      if (task.subtasks.length) {
        const allChecked = task.subtasks.every((sub) => sub.checked);
        task.subtasks.forEach((sub) => {
          sub.checked = !allChecked;
        });
        task.checked = !allChecked;
      } else {
        task.checked = !task.checked;
      }
      this.save();
    },

    addSubtask(task) {
      task.subtasks.push({ id: this.uid(), text: '', checked: false });
      this.save();
    },

    deleteSubtask(task, sub) {
      task.subtasks.splice(task.subtasks.indexOf(sub), 1);
      this.save();
    },

    toggleSubtask(task, sub) {
      sub.checked = !sub.checked;
      this.save();
    },
  });
});

window.Alpine = Alpine;
Alpine.start();

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('tauri-app');
});
