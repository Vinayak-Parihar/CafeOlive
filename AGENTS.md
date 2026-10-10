# AI Developer Instructions: Cafe Olive

If you are a new AI model or subagent working on this codebase, **read this document first**. It specifies safety constraints, design rules, and core patterns that must not be broken.

---

## 1. Core Implementation Rules

1. **Prioritize Codebase Over Assumptions**: Never assume API structures, database schemas, or page routes. Always query the codebase using grep or directory searches before creating or modifying code.
2. **Backend is the Source of Truth**:
   - Always calculate pricing, totals, and fees on the server using active database models.
   - Never trust pricing data sent directly from the client.
3. **Double Booking Prevention**:
   - For any reservation modifications, verify availability by checking overlaps against existing booked slots in the database.
4. **Preserve Bill Session Logic**:
   - All client-side orders must link back to their browser's session cookie (`billSessionId`).
   - Customer orders must not require immediate payment checkouts; instead, save them directly to the database with status `placed` and payment status `pending`.
   - Never allow orders to be placed on a session that has already been marked `paid: true`.
5. **No Static Replacements**:
   - Design guidelines (e.g. from Stitch) are references for layout and CSS themes only.
   - Do **not** replace existing dynamic database bindings (e.g., categories, reviews, menu items) with static mockup values.

---

## 2. Naming & Style Conventions

- **Helper Typo**: Keep in mind that the JSON API response class in this codebase is spelled [`ApiResponce.js`](file:///e:/CAFEOLIVE/backend/src/utils/ApiResponce.js) (with a **c**). Ensure you import it with matching spelling to prevent build crashes.
- **Tailwind Extension**: Custom color tokens (such as `primary`, `soft-gold`, `ivory-surface`) are configured in `tailwind.config.js`. Do not define inline hex values for standard accents; use theme tokens.
- **Date Handling**: Venue bookings utilize local calendar date strings (`YYYY-MM-DD`). Do not convert date values using `.toISOString()` as it shifts timezone offsets. Use `toLocalDateStr()` instead.

---

## 3. Directory Context Guide

Before modifying code, read the index mapping file:
- **Index Guide**: [`AI_CONTEXT_INDEX.md`](file:///e:/CAFEOLIVE/AI_CONTEXT_INDEX.md)
- **Detailed Docs**: Explore `/docs` folder for context on database schemas, API maps, security protocols, and business rules.
- **Active Tasks Tracker**: Monitor [`task.md`](file:///C:/Users/vinay/.gemini/antigravity/brain/3359d8e8-d405-42b0-a367-24c2eb8b9bdf/task.md) for current implementation progress.
