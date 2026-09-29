const STORAGE_KEY = 'objective-tracker-v1';
const BG_STORAGE_KEY = 'objective-tracker-bg-v1';
const DEFAULT_BACKGROUND_THEME = {
    primary: '#f0efe9',
    secondary: '#e5e5e3',
    plus: '#3e3e40',
    fontPrimary: '#1c1c1e',
    fontSecondary: '#5e5e62',
};

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
    return (r * 0.299 + g * 0.587 + b * 0.114) > 160 ? 'light' : 'dark';
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

function showTooltipForElement(element, text) {
    if (!element || !text) return;
    const tooltip = document.getElementById('app-hover-tooltip');
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.classList.add('visible');

    const rect = element.getBoundingClientRect();
    const margin = 12;
    const tooltipWidth = Math.min(tooltip.offsetWidth || 140, window.innerWidth - margin * 2);
    const tooltipHeight = tooltip.offsetHeight || 24;
    const centerX = rect.left + rect.width / 2;
    const minLeft = margin + tooltipWidth / 2;
    const maxLeft = window.innerWidth - margin - tooltipWidth / 2;
    const clampedLeft = Math.min(Math.max(centerX, minLeft), maxLeft);
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

function bindThemeHoverTooltips() {
    const tooltipSelectors = '.new-section-btn, .theme-btn, .task-text, .subtask-text';

    document.addEventListener('mouseover', (event) => {
        const element = event.target.closest(tooltipSelectors);
        if (!element) return;
        const text = element.getAttribute('title');
        if (!text) return;
        element.dataset.tooltip = text;
        element.removeAttribute('title');
        showTooltipForElement(element, text);
    });

    document.addEventListener('mousemove', (event) => {
        const element = event.target.closest('[data-tooltip]');
        if (!element) return;
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
    });
}

document.addEventListener('alpine:init', () => {
    bindThemeHoverTooltips();
    Alpine.store('tracker', {
        sections: [],
        backgroundTheme: { ...DEFAULT_BACKGROUND_THEME },
        dragState: null,

        init() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                this.sections = JSON.parse(saved);
                this.sections.forEach((section) => {
                    if (!section.tasks) return;
                    section.tasks.forEach((task) => {
                        if (task.deadline && !task.deadlineDate && !task.deadlineTime) {
                            const [datePart, timePart] = String(task.deadline).split('T');
                            task.deadlineDate = datePart || '';
                            task.deadlineTime = timePart || '';
                        }
                        task.deadlineDate = task.deadlineDate || '';
                        task.deadlineTime = task.deadlineTime || '';
                        task.deadlineMonth = task.deadlineDate ? String(new Date(`${task.deadlineDate}T00:00`).getMonth() + 1) : '';
                        task.deadlineDay = task.deadlineDate ? String(new Date(`${task.deadlineDate}T00:00`).getDate()) : '';
                        task.deadlineYear = task.deadlineDate ? String(new Date(`${task.deadlineDate}T00:00`).getFullYear()) : '';
                        task.deadlineHour = task.deadlineTime ? String(Math.floor(Number(task.deadlineTime.split(':')[0]) || 0)) : '';
                        task.deadlineMinute = task.deadlineTime ? String((Number(task.deadlineTime.split(':')[1]) || 0)) : '';
                        task.deadlineEditorOpen = false;
                    });
                });
            }

            const savedTheme = localStorage.getItem(BG_STORAGE_KEY);
            if (savedTheme) {
                try {
                    const parsed = JSON.parse(savedTheme);
                    if (parsed?.primary && parsed?.secondary) {
                        this.backgroundTheme = {
                            primary: parsed.primary,
                            secondary: parsed.secondary,
                            plus: parsed.plus || DEFAULT_BACKGROUND_THEME.plus,
                            fontPrimary: parsed.fontPrimary || DEFAULT_BACKGROUND_THEME.fontPrimary,
                            fontSecondary: parsed.fontSecondary || DEFAULT_BACKGROUND_THEME.fontSecondary,
                        };
                    }
                } catch (_) {}
            }

            applyBackgroundTheme(this.backgroundTheme);
        },

        formatDeadline(task) {
            if (!task?.deadlineDate && !task?.deadlineTime) return '▾ No deadline';

            const dateText = task.deadlineDate ? new Date(`${task.deadlineDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const timeText = task.deadlineTime ? new Date(`2000-01-01T${task.deadlineTime}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

            if (dateText && timeText) return `${dateText} • ${timeText}`;
            if (dateText) return dateText;
            if (timeText) return timeText;
            return '▾ No deadline';
        },

        toggleDeadlineEditor(task) {
            if (!task) return;
            task.deadlineEditorOpen = !task.deadlineEditorOpen;
        },

        saveDeadline(task) {
            const year = String(task.deadlineYear || '').trim();
            const month = String(task.deadlineMonth || '').trim();
            const day = String(task.deadlineDay || '').trim();
            const hour = String(task.deadlineHour || '').trim();
            const minute = String(task.deadlineMinute || '').trim();

            const hasDate = Boolean(year && month && day);
            const hasTime = Boolean(hour && minute);

            if (!hasDate && !hasTime) {
                task.deadlineDate = '';
                task.deadlineTime = '';
                task.deadlineMonth = '';
                task.deadlineDay = '';
                task.deadlineYear = '';
                task.deadlineHour = '';
                task.deadlineMinute = '';
                task.deadlineEditorOpen = false;
                this.save();
                return;
            }

            task.deadlineDate = hasDate ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            task.deadlineTime = hasTime ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : '';
            task.deadlineEditorOpen = false;
            this.save();
        },

        clearDeadline(task) {
            if (!task) return;
            task.deadlineDate = '';
            task.deadlineTime = '';
            task.deadlineMonth = '';
            task.deadlineDay = '';
            task.deadlineYear = '';
            task.deadlineHour = '';
            task.deadlineMinute = '';
            task.deadlineEditorOpen = false;
            this.save();
        },

        save() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sections));
        },

        saveBackgroundTheme() {
            localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(this.backgroundTheme));
        },

        showTooltip(text, event) {
            if (!text) return;
            const tooltip = document.getElementById('app-hover-tooltip');
            if (!tooltip) return;
            tooltip.textContent = text;
            tooltip.classList.add('visible');
            const rect = event.currentTarget.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 10}px`;
        },

        hideTooltip() {
            const tooltip = document.getElementById('app-hover-tooltip');
            if (!tooltip) return;
            tooltip.classList.remove('visible');
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

        moveTask(section, targetTask) {
            if (!this.dragState || this.dragState.type !== 'task') return;
            const list = section.tasks;
            const draggedTask = this.dragState.item;
            const fromIndex = list.indexOf(draggedTask);
            const toIndex = list.indexOf(targetTask);
            if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
                this.dragState = null;
                return;
            }
            list.splice(fromIndex, 1);
            list.splice(toIndex, 0, draggedTask);
            this.dragState = null;
            this.save();
        },

        moveSubtask(task, targetSubtask) {
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
            this.save();
        },

        setBackgroundTheme(theme) {
            if (!theme?.primary || !theme?.secondary) return;
            this.backgroundTheme = {
                primary: theme.primary,
                secondary: theme.secondary,
                plus: theme.plus || DEFAULT_BACKGROUND_THEME.plus,
                fontPrimary: theme.fontPrimary || DEFAULT_BACKGROUND_THEME.fontPrimary,
                fontSecondary: theme.fontSecondary || DEFAULT_BACKGROUND_THEME.fontSecondary,
            };
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
            return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
        },

        isTaskChecked(task) {
            if (task.subtasks.length) return task.subtasks.every(s => s.checked);
            return task.checked;
        },

        addSection() {
            this.sections.push({ id: this.uid(), title: 'Section', tasks: [] });
            this.save();
        },

        deleteSection(section) {
            this.sections.splice(this.sections.indexOf(section), 1);
            this.save();
        },

        addTask(section) {
            section.tasks.push({ id: this.uid(), text: '', checked: false, deadlineDate: '', deadlineTime: '', deadlineMonth: '', deadlineDay: '', deadlineYear: '', deadlineHour: '', deadlineMinute: '', deadlineEditorOpen: false, subtasks: [] });
            this.save();
        },

        deleteTask(section, task) {
            section.tasks.splice(section.tasks.indexOf(task), 1);
            this.save();
        },

        toggleTask(task) {
            if (task.subtasks.length) {
                const allChecked = task.subtasks.every(s => s.checked);
                task.subtasks.forEach(s => s.checked = !allChecked);
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

    if (window.objectiveTracker?.onBackgroundThemeSelected) {
        window.objectiveTracker.onBackgroundThemeSelected((theme) => {
            const tracker = Alpine.store('tracker');
            if (tracker) tracker.setBackgroundTheme(theme);
        });
    }
});
