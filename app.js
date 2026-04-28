const COLORS = ['#f5c842', '#4a9eff', '#5cb85c', '#e87d7d', '#9b89c4', '#ff9f43'];
const STORAGE_KEY = 'objective-tracker-v1';

document.addEventListener('alpine:init', () => {
    Alpine.store('tracker', {
        notes: [],
        colors: COLORS,

        init() {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) this.notes = JSON.parse(saved);
        },

        save() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
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

        addNote() {
            this.notes.push({
                id: this.uid(),
                title: 'New Note',
                color: COLORS[0],
                sections: [{ id: this.uid(), title: 'Section', tasks: [] }],
            });
            this.save();
        },

        deleteNote(note) {
            this.notes.splice(this.notes.indexOf(note), 1);
            this.save();
        },

        addSection(note) {
            note.sections.push({ id: this.uid(), title: 'Section', tasks: [] });
            this.save();
        },

        deleteSection(note, section) {
            note.sections.splice(note.sections.indexOf(section), 1);
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
});
