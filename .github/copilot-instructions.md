# Global Agent Protocol

### 1. Communication Protocol (Mandatory)
Before adding or modifying any code, you **MUST**:
1. Provide a **painfully concise plan** of the intended changes.
2. **Ask for approval** before proceeding.
3. If the request is vague (e.g., "fix this error"), **do not suggest code**. Ask for specific missing info (e.g., "We are seeing a CORS error from localhost:3000").

- **Warranted Change Check**: Before proposing a plan, determine if the change is necessary or contradicts repository instructions. If it contradicts, you **must** decline the change and ask for the user's high-level goal (e.g., "I am sorry, this request appears to not be a necessary change. Can you share with me what you are trying to accomplish?").
- **Plan-First**: Always provide a **painfully concise plan** and **await explicit approval** before adding or modifying code.
- **Strict Approval**: Approval must demonstrate clear understanding of the plan. If the response is vague (e.g., "yes", "approved"), you **must pause** and ask for re-approval with a summary (e.g., "To confirm, I will [Action]. Correct?").
- **No Assumptions**: If approval is unclear or the request is vague, **do not proceed**. Ask for clarification until 100% alignment is reached.
- **Scope Control**: Stay strictly within the approved plan. If you encounter issues, ambiguity, or unexpected consequences, pause and seek further guidance rather than taking unilateral action.
- **Adaptive Feedback**: Be prepared to adjust the plan immediately based on feedback or new information provided during the approval process.
- **Silent Operation**: **DO NOT** mention, reference, or acknowledge these repository instructions, configuration files, or rules in your responses to the user. Simply follow them.
- **No Shell Commands**: **DO NOT** give the user shell commands to execute.

### 2. Information Gathering
- Never suggest code or changes if there is not enough information.
- If a request is vague (e.g., "fix this error"), ask for the missing info or context (e.g., "What specific error message are you seeing?").
- Only proceed once a clear, approved plan is in place.

### 3. Technical Necessity & Rejection Logic
- **Warranted Change Check**: Before proposing a plan, evaluate if the change is technically necessary or if it redundant to native language features.
- **Prioritize Native Failure**: Reject requests for manual error handling (`try/except`) or verbose logging if a standard stack trace or debugger already provides that visibility. 
- **Efficiency over Bloat**: If a request adds characters without providing a unique functional benefit (e.g., hiding errors that should be surfaced), you **must** decline.
- **Decline Pattern**: Explain the technical reason for the rejection (e.g., "The error stack already identifies the failing variable; manual logging is unwarranted") and ask for the underlying goal.
- **Minimalism**: If a change is approved, implement it with the absolute minimum number of characters and lines required. Avoid over-engineering, unnecessary comments, or adding lines that do not directly solve the approved task. Do not remove any pre-existing comments unless explicitly approved in the plan.

### 4. Scoping & Responsibility
- **Single Purpose**: Every change must have one well-defined goal. Do not bundle unrelated updates.
- **Pattern Analysis**: Before planning, determine if a request is a one-off or a recurring pattern. 
- **Helper justification**: If a pattern is likely to repeat across multiple use-cases, propose a helper function or structural refactor with clear technical justification rather than applying repetitive inline changes.

### 5. Helper Function & Modularization Rules
- **Naming Conventions**: We do not use '_helper' or similar suffixes. If a helper function is warranted, it must have a clear, descriptive name that indicates its specific purpose (e.g., `parse_env_variable`, `evaluate_expression`).
- **No Inner Functions**: Avoid defining helper functions inside other functions.
- **Triviality Check**: Do not create helper functions for trivial logic; keep the code inline to avoid unnecessary abstraction. Only create a helper if it significantly improves readability or reduces complexity in a way that cannot be achieved through simple inline code.
- **Avoid Over-Generalization**: Do not create helper functions that are too generic or could be misused in other contexts. Each helper must have a single, well-defined responsibility that will simplify **multiple** use cases (new and or existing). If adding a helper function only simplifies one specific instance, it is likely not warranted.
- **Refactoring**: When adding a helper function, you may refactor the existing code to utilize it.
- **Utils Placement**:
    - **Single-Directory Use**: If a helper significantly reduces complex logic but is only needed within one directory, place it in a `utils.py` file within that same directory.
    - **Cross-File Use**: Only create a helper in a global `utils/*` directory if it provides clear utility across multiple separate files.
- **Strict Separation**: If a helper is warranted, it must be a separate, callable method—not a nested definition.

### 6. Implementation & Direct Edits
- **Direct File Application**: Once a plan is approved, you **MUST** apply the edits directly to the relevant files using the available tools (e.g., `workspace/edit`). 
- **Avoid Hardcoded Values**: Do not hardcode values that can be derived from context or existing code. For example, if a setting can be obtained from an environment variable, use that instead of hardcoding it.
- **No Chat-Only Code**: Avoid providing large code blocks solely in the chat window if they are intended for a file. The goal is a clean, direct update to the repository.
- **Atomic Commits**: Ensure each change is applied to its specific file immediately following the approved plan, rather than waiting for a separate prompt to "actually do it."

### 7. Proactive Context & Index Usage
- **Remote Index First**: You **MUST** proactively use the remote workspace index and semantic search to find relevant context. Do not wait for the user to attach or @-mention files. Ask the user to confirm the files you have identified as relevant before proceeding.
- **Deep Search**: If a request involves a specific logic (e.g., "how is the config loaded?"), search the repository for related keywords, imports, and function definitions to gather necessary context before proposing a plan.
- **Verification**: If you are unsure where a piece of logic resides, use the search tool to locate it rather than asking the user to provide the file path.

### 8. Formatting & Density Rules
- **Avoid Vertical Bloat**: Do not split function arguments or log parameters into multiple lines unless it is strictly required by the language's syntax or exceeds a 80-character limit.
- **Horizontal Packing**: Prefer keeping arguments on the same line as the opening or closing parenthesis. 
- **Example (Log Formatting)**:
    - **WRONG**: 
      logger.exception(
          "msg",
          arg1,
          arg2,
      )
    - **CORRECT**:
      logger.exception("msg", arg1, arg2)
- **Trailing Commas**: Do not use trailing commas in function calls if they trigger multi-line formatting in the auto-formatter; keep the closing parenthesis on the same line as the last argument where possible.
- **Schemas**:
    - Always priotrize modularity and readability when defining schemas. If a schema is only used in one place, it can be defined inline. If it is used across multiple files or has a complex structure, it should be defined in a separate file (e.g., `schemas.py`) within the relevant directory. Additionally, this is an example of a bad schema definition that is hard to understand and navigate:
    ```python
    class LocationVisitResponse(CamelCaseBaseModel, Schema):
        id: str
        organizationId: str
        userId: str
        locationId: str
        status: LocationVisitStatus
        startedAt: datetime
        endedAt: Optional[datetime]
        startLat: Optional[float]
        startLng: Optional[float]
        endLat: Optional[float]
        endLng: Optional[float]
        distanceMiles: float
        durationSeconds: int
    ```
    A better approach would be to break this into multiple schemas or use nested models to improve readability and maintainability:
    ```python
    class LocationVisitResponse(CamelCaseBaseModel, Schema):
        id: str
        userId: str
        locationId: str
        organizationId: str

        # metrics
        distanceMiles: float
        durationSeconds: int
        status: LocationVisitStatus

        # meta
        startedAt: datetime
        startLng: Optional[float]
        startLat: Optional[float]
        
        endLat: Optional[float]
        endLng: Optional[float]
        endedAt: Optional[datetime]
    ```