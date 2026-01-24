# Osimi Digital Library — UI Colors & States

This document defines the **approved color palette**, **usage rules**, and **file state semantics**
for the Osimi Digital Library UI.

The goal is to ensure:
- visual consistency
- intuitive scanning of ingestion states
- long-session readability
- strict adherence to the provided palette

---

## 1. Core Color Palette (Authoritative)

The UI uses **only the following base colors** and their opacity variants.

| Name | Hex | Purpose |
|----|----|----|
| Burnt Peach | `#dd6e42` | Attention, warnings, human-required states |
| Pearl Beige | `#e8dab2` | Archival warmth, contextual backgrounds |
| Blue Slate | `#4f6d7a` | Structure, system states, primary actions |
| Pale Sky | `#c0d6df` | Selection, hover, readable foreground on dark |
| Alabaster Grey | `#eaeaea` | Neutral canvas, low-noise surfaces |

⚠️ No additional hues are permitted.  
Opacity and lightness adjustments are allowed **only within these families**.

---

## 2. Global Layout Color Roles

### Application Canvas
- **Background:** Alabaster Grey
- **Primary surfaces (cards, rows):** White / Alabaster Grey
- **Hover & selection:** Pale Sky (light)

### Left Sidebar (Structural Context)
- **Background:** Blue Slate
- **Body text:** Pale Sky
- **Section headers:** Burnt Peach
- **Purpose:** navigation, context, batch intent (not content)

### Archival Emphasis Areas
- **Dropzone**
- **Human-review callouts**
- **Contextual highlights**

→ Use **Pearl Beige** sparingly to convey “archival / paper”.

---

## 3. Color Semantics (Rules)

| Color | Semantic Meaning |
|----|----|
| Blue Slate | System, structure, non-urgent |
| Pale Sky | Calm visibility, readability |
| Pearl Beige | Human context, archival warmth |
| Burnt Peach | Attention required (only) |
| Alabaster Grey | Neutral background |

**Burnt Peach MUST NOT be used for system-only states.**

---

## 4. File State Model

File states are designed for **at-a-glance recognition**, not decoration.

Each state uses:
- text color
- background tone
- optional dot indicator

---

## 5. File States & Visual Treatment

### Queued
**Meaning:** Waiting for processing

- Text: Blue Slate
- Background: Transparent
- Border: Blue Slate (light)
- Urgency: None

---

### Processing
**Meaning:** Pipeline running

- Text: Blue Slate
- Background: Pale Sky (light)
- Urgency: Low

---

### Extracted
**Meaning:** Machine output produced (not yet reviewed)

- Text: Blue Slate
- Background: Pale Sky (stronger)
- Urgency: Medium (informational)

---

### Needs Review
**Meaning:** Human attention required

- Text: Burnt Peach
- Background: Pearl Beige
- Border: Burnt Peach
- Urgency: High

🚨 This is the **only** state that uses Burnt Peach prominently.

---

### Approved
**Meaning:** Human-approved, authoritative

- Text: Blue Slate
- Background: Pale Sky
- Urgency: None (calm finality)

---

### Blocked
**Meaning:** Cannot proceed without missing input

- Text: Burnt Peach
- Background: Pearl Beige
- Border: Burnt Peach (stronger)
- Urgency: High (action required)

---

### Skipped
**Meaning:** Pipeline intentionally not run

- Text: Muted Blue Slate
- Background: Alabaster Grey
- Urgency: None

---

### Failed
**Meaning:** Pipeline error occurred

- Text: Burnt Peach
- Background: Burnt Peach (very soft)
- Border: Burnt Peach (strong)
- Urgency: High (system issue)

---

## 6. Design Constraints (Non‑Negotiable)

- ❌ No traffic-light semantics
- ❌ No red/green success signaling
- ❌ No decorative gradients
- ❌ No additional colors
- ❌ No color-only meaning (always paired with text)

- ✅ Warm vs cool conveys human vs system
- ✅ Calm hierarchy beats loud contrast
- ✅ States communicate responsibility

---

## 7. Mental Model (Design Intent)

> **Blue = system**  
> **Beige = human context**  
> **Peach = attention**  

If a UI element does not clearly fit one of these roles,
its color usage must be reconsidered.

---

## 8. Status Legend Requirement

Every screen that lists files **must include**:
- a visible status legend, or
- consistent badge patterns users can learn once

This ensures accessibility and reduces cognitive load.

---

## 9. Versioning

This document defines the **v1 canonical UI color and state system**.
Future additions must extend—not contradict—these rules.

Any proposed change should answer:
> “Does this make the system more understandable at a glance?”