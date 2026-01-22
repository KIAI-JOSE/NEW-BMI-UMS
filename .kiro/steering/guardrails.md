# Guardrails for this project

## Critical Rule
Do NOT refactor, delete, rename, or alter any existing working functions unless explicitly instructed.

## Protected Areas
The following modules are considered stable and must be treated as read-only unless I explicitly say "you may modify":
- Authentication module
- Admissions module
- Students module
- Program module
- Any function that is already working

## When changes are allowed
Only modify existing code when:
- I explicitly request a refactor
- I say "you can change existing functions"
- A bug is proven and I approve the fix

## Default behavior
Prefer:
- Adding new functions instead of changing old ones
- Extending behavior without breaking existing logic
- Asking before making structural changes
