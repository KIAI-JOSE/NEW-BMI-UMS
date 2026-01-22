# NestJS Architecture Rules

This is a production backend. Stability is more important than elegance.

## Architecture Principles
- Controllers should remain thin
- Services contain business logic
- DTOs define request/response structure
- Guards and middleware should not be modified once working
- Existing module boundaries must be preserved

## Do NOT
- Do not rename controllers, services, modules, or routes
- Do not reorganize folders
- Do not merge services
- Do not introduce new architectural patterns unless requested

## When implementing features
- Follow existing patterns in the codebase
- Match existing style and structure
- Add new files rather than changing old ones
