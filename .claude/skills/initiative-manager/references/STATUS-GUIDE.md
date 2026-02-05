# Initiative Status Guide

This document defines the standard statuses for initiatives and when to use each.

## Status Lifecycle

```
Idea → In discovery → In progress → Waiting approvals → Delivered
       ↓              ↓
     Paused        Blocked
       ↓              ↓
   Cancelled      [resolve] → In progress
```

## Status Definitions

### Idea
**When to use:** Initial concept, not yet approved or started.

**Characteristics:**
- No resources allocated
- No start date set
- Exploring if this should be pursued

**Typical duration:** 1-4 weeks

**Next steps:**
- Get sponsor alignment
- Create initial scope
- Move to "In discovery" when exploration starts

---

### In discovery
**When to use:** Active exploration of feasibility, scope, and requirements.

**Characteristics:**
- Research phase
- Gathering requirements
- Architecture exploration
- Vendor evaluation
- Risk assessment

**Typical duration:** 2-8 weeks (depending on complexity)

**Deliverables:**
- PRD or equivalent
- Architecture proposal
- Risk assessment
- Resource estimate

**Next steps:**
- Get stakeholder approvals
- Move to "In progress" when development starts
- Move to "Paused" if deprioritized
- Move to "Cancelled" if not viable

---

### In progress
**When to use:** Active development/implementation work.

**Characteristics:**
- Team actively building
- Regular standups/check-ins
- Code being written
- Testing happening

**Typical duration:** 4-16 weeks (depending on scope)

**Next steps:**
- Move to "Blocked" if work stops due to impediments
- Move to "Waiting approvals" when code complete
- Move to "Paused" if deprioritized

---

### Blocked
**When to use:** Work stopped due to external impediments.

**Characteristics:**
- Team cannot proceed
- Waiting on external dependency
- Critical blocker exists

**IMPORTANT:**
- Always document blockers in the "Blockers / Risks" section
- Assign owners to resolve blockers
- Set expected resolution date

**Next steps:**
- Resolve blocker
- Move back to "In progress" when unblocked
- Move to "Paused" if blocker will take months

---

### Waiting approvals
**When to use:** Implementation complete, pending final sign-offs.

**Characteristics:**
- Code complete and tested
- Documentation ready
- Waiting for Risk/Legal/Product approval to launch

**Typical duration:** 1-3 weeks

**Next steps:**
- Obtain all sign-offs
- Move to "Delivered" when approved and launched
- Move back to "In progress" if sign-off requires changes

---

### Delivered
**When to use:** Launched to production and handed off.

**Characteristics:**
- In production
- Monitoring established
- Team handed off to support

**Next steps:**
- Schedule post-launch review
- Archive initiative after review
- Document learnings

---

### Paused
**When to use:** Temporarily suspended (not cancelled).

**Characteristics:**
- Work stopped due to reprioritization
- Not cancelled - may resume later
- Resources reallocated

**IMPORTANT:**
- Document pause reason in notes
- Set expected resume date if known

**Next steps:**
- Move to "In progress" when resumed
- Move to "Cancelled" if definitely not pursuing

---

### Cancelled
**When to use:** No longer pursuing this initiative.

**Characteristics:**
- Permanently stopped
- Resources freed up
- Decision documented

**IMPORTANT:**
- Always document cancellation reason in notes
- Include decision maker and date
- Preserve all documentation for historical reference

**Next steps:**
- Archive initiative
- Conduct brief retrospective if significant work was done

## Status Update Best Practices

1. **Update promptly:** Status should reflect current reality
2. **Add note on change:** Always add a note explaining why status changed
3. **Update stakeholders:** Notify key stakeholders of status changes
4. **Log communication:** Record the notification in comms.md
5. **Review blockers:** When moving from "Blocked", document how it was resolved

## Red Flags

Watch for these warning signs:

- **In discovery > 8 weeks:** Scope likely too big or unclear
- **Blocked > 2 weeks:** Blocker not being addressed actively
- **Waiting approvals > 4 weeks:** Sign-off process broken
- **Status unchanged > 2 weeks:** Update needed or initiative stale
