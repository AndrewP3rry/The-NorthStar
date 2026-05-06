# Branding Guidelines - The NorthStar

## 1) Brand Core
- Brand name: The NorthStar
- Product name: Assessment Test Hub
- Brand promise: Luyen aptitude moi ngay, de dang bat dau va tang kho dan theo tien bo.
- Target users: Fresher / ung vien Management Trainee tai Viet Nam.

## 2) Positioning
- Functional value: Luyen 20-25 cau/ngay, co timer, co giai thich, co theo doi streak.
- Emotional value: Tao cam giac hoc nhe nhang, than thien, khong ap luc nhu bai thi that.
- Personality: Friendly, playful, practical, growth-oriented.

## 3) Visual Direction
- Direction: Hand-drawn UI + modern clean layout.
- Signature style:
  - Vien den dam, bo goc lon, shadow offset nhu sticker/card.
  - Nen sang, texture cham nhe (dot pattern).
  - Accent mau pastel de giu cam giac hoc tap thoai mai.

## 4) Color System
Nguon: `src/app/globals.css`

- `--background`: `#f8f9fa`
- `--foreground`: `#2d2d2d`
- `--primary`: `#6d5d6e`
- `--secondary`: `#d1f2e5`
- `--accent`: `#fef6e4`
- `--peach`: `#f9e2d2`
- `--border`: `#000000`

Semantic usage:
- Primary actions: `--primary`
- Success/Completed cards: `--secondary`
- Neutral highlights: `--accent`
- Warning/attention blocks: `--peach`
- Structural outlines: `--border`

## 5) Typography
- Primary font: Inter (set in `src/app/layout.tsx`)
- Fallback stack: Segoe UI, Aptos, SF Pro Text, Helvetica Neue, sans-serif
- Type style:
  - Heading: heavy/black
  - CTA/labels: bold/extrabold
  - Body: regular/medium

## 6) Component Language
Reusable classes in `src/app/globals.css`:
- `.hand-drawn-card`
- `.hand-drawn-button`
- `.hand-drawn-button-primary`
- `.hand-drawn-button-secondary`
- `.glass-pill`

Component behavior:
- Cards: thick border + offset shadow + hover translate
- Buttons: tactile press effect (shadow collapse on active)
- Pills/badges: rounded full with strong contrast

## 7) Interaction & Motion
- Motion library: Framer Motion
- Motion principle:
  - Subtle entry reveal (small translate + fade)
  - Tactile interactions on click/hover
  - Progress/timer movement should feel smooth, not flashy

## 8) Iconography
- Icon set: Lucide React
- Style rule:
  - Stroke icons for navigation/status
  - Emoji can be used in micro-labels for friendly tone, but do not overuse.

## 9) Imagery & Diagrammatic Questions
- Diagrammatic questions should:
  - Render clearly at mobile width first.
  - Keep high contrast (dark lines, clear shapes).
  - Use consistent shape colors across a single question.
  - Avoid excessive micro-details that reduce readability.

## 10) Content Voice
- Tone: Clear, encouraging, practical.
- Microcopy rule:
  - Short instructions.
  - Explain errors without blame.
  - Result explanations should be specific to question data, not generic.

## 11) Accessibility Baseline
- Keep contrast high for text and interactive elements.
- Minimum touch target: 44px height on mobile.
- Do not rely only on color for right/wrong state.
- Support keyboard focus states for actionable controls.

## 12) Do / Don't
Do:
- Use thick black outlines and rounded corners consistently.
- Keep spacing generous to reduce cognitive load.
- Preserve 5-5-5-5 topic balance in daily tests.

Don't:
- Mix too many unrelated visual styles.
- Use low-contrast pastel text on white backgrounds.
- Add long generic explanations in result view.

## 13) Brand Checklist Before Release
- Home, Practice, Results, Admin share one visual language.
- CTA buttons use primary style consistently.
- Diagrammatic items remain readable on phone screens.
- Explanations are concrete and tied to the question.
- Streak and progression are visible but not distracting.
