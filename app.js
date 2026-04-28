const STORAGE_KEY = 'objective-tracker-v1';
const BG_STORAGE_KEY = 'objective-tracker-bg-v1';
const DEFAULT_BACKGROUND_THEME = {
    primary: '#f0efe9',
    secondary: '#e5e5e3',
    plus: '#3e3e40',
    fontPrimary: '#1c1c1e',
    fontSecondary: '#5e5e62',
};

function applyBackgroundTheme(theme) {
    document.documentElement.style.setProperty('--bg-primary', theme.primary);
    document.documentElement.style.setProperty('--bg-secondary', theme.secondary);
    document.documentElement.style.setProperty('--plus-color', theme.plus || DEFAULT_BACKGROUND_THEME.plus);
    document.documentElement.style.setProperty('--font-color-primary', theme.fontPrimary || DEFAULT_BACKGROUND_THEME.fontPrimary);
    document.documentElement.style.setProperty('--font-color-secondary', theme.fontSecondary || DEFAULT_BACKGROUND_THEME.fontSecondary);
}

document.addEventListener('alpine:init', () => {
    Alpine.store('tracker', {
        sections: [],
        backgroundTheme: { ...DEFAULT_BACKGROUND_THEME },

        init() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) this.sections = JSON.parse(saved);

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

        save() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sections));
        },

        saveBackgroundTheme() {
            localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(this.backgroundTheme));
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
            section.tasks.push({ id: this.uid(), text: '', checked: false, subtasks: [] });
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
