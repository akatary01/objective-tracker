---
name: API Architect
description: Strict guidelines for /api directory, model structure and api operations.
applyTo: "api/**/*"
---
### 1. Strict Import Sorting & Structure
- **Package Grouping**: Categorize all imports strictly by package type. Use the following order, separated by a single newline:
    1. **Third-Party**: Generic libraries (e.g., `os`, `re`, `redis`, `celery`).
    2. **FastApi**: All `from fastapi...` or `import fastapi` statements.
    3. **App-Local**: Internal project modules (e.g., `from conf import...`, `from apps.user import...`).
- **No Inline Comments**: Do not add comments like `# third_party` or `# fastapi` above the groups; use white space to separate them.
- **Alphabetical Order**: Within each group, sort imports alphabetically.
- **Minimalist Formatting**: Do not use multi-line imports (parentheses) unless the line exceeds 80 characters; prefer single-line imports to save vertical space.
- **No newlines**: Do not add extra newlines between imports within the same group.
