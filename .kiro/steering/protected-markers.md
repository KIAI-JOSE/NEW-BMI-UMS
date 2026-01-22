# Protected Code Markers

Any code marked with:

// KIRO: DO NOT MODIFY
or
// STABLE: DO NOT TOUCH

Must be treated as read-only unless the user explicitly instructs modification.

## Automatic Protection Rule

**CRITICAL**: Each time we finish implementing any feature and it becomes functional, automatically add the protection marker:

```
/**
 * KIRO: DO NOT MODIFY
 * This file contains stable production logic.
 * Do not edit unless explicitly instructed.
 */
```

This applies to:
- New backend controllers, services, modules, entities
- New frontend components, pages, services
- Any file that becomes working/functional
- Configuration files that are tested and working

**Process**: 
1. Implement feature
2. Test functionality 
3. Confirm it works
4. Immediately add protection marker
5. Treat as read-only going forward

This ensures all working code is automatically protected from accidental modification.
