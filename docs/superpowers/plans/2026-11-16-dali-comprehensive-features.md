# Dali Comprehensive Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Dali into a complete, deeply engaging yet quiet and soft-minimalist daily workspace with Task Icons & Filtering, Subtasks, Priorities, Focus Timer (Pomodoro), Daily Mood/Pulse, Routine Templates, Weekly Stats, and Extended Soft Pastel Themes.

**Architecture:** Extend existing repository schemas and domain services (`task`, `types`, `repositories`, `components`) with non-breaking backwards-compatible migrations. Use Radix UI primitives and Lucide icons for accessible micro-interactions, local storage persistence for mood/templates/stats, and custom CSS tokens for dynamic multi-palette themes.

**Tech Stack:** React 18, TypeScript, Vite, Tauri v2, Radix UI Popover/Dropdown, Lucide-react, Vitest, CSS Modules.

**Spec:** `Dali_Project_Specification.md` & Feature Brainstorming requirements.

## Global Constraints
- Soft minimalism and quiet productivity ethos must be maintained across all components.
- Past dates remain strictly read-only (`isPastDate`).
- Full Turkish localization for all new UI elements, buttons, tooltips, and badges.
- Unit test coverage with Vitest for domain additions.

---

### Task 1: Domain & Model Extension (Task Icons, Subtasks, Priority)
- Update `Task`, `CreateTaskDTO`, `UpdateTaskDTO` in `src/types/task.ts` with `icon`, `priority`, `subtasks`.
- Update `localRepository.ts` and `schema.sql` to support new fields with backward-compatible defaults.
- Add unit tests for subtask toggling and priority updates in `taskService.test.ts`.

### Task 2: Task Icon Picker & Priority Selector Components
- Create `src/components/ui/ModernIconPicker.tsx` (curated minimalist Lucide icons & soft emojis: 💼, 📚, 🏃, 🛒, ☕, 💻, 🎨, 🎯, 🌿, 💡, 🏠, ✈️).
- Create `src/components/ui/ModernPrioritySelect.tsx` (Düşük, Normal, Yüksek ile soft pastel renk noktaları).
- Integrate icon & priority selectors into `TaskInput.tsx` and `TaskItem.tsx` edit mode.

### Task 3: Subtasks (Alt Görevler) Implementation
- Create `src/components/tasks/SubtaskList.tsx` with inline adding, checkbox toggling, and deletion.
- In `TaskItem.tsx`, display subtask progress badge (e.g. `2/3 alt görev`) and expandable checklist toggle.
- Support subtask persistence in `TaskProvider.tsx`.

### Task 4: Filter Bar by Icon / Priority & Routine Templates
- Create `src/components/tasks/TaskFilterBar.tsx` on `TodayView` to quickly filter by icon (e.g. sadece 💼 İş) or priority.
- Create `src/components/tasks/RoutineTemplatesModal.tsx` allowing 1-click loading of predefined routine templates ("Sabah Rutini", "Çalışma Başlangıcı", "Günün Kapanışı") into today's task list.

### Task 5: Minimalist Focus Timer (Pomodoro Modal & Mini Bar)
- Create `src/components/focus/FocusTimerModal.tsx` and `FocusTimerFloating.tsx` (25m Focus / 5m Rest, custom duration, pause, reset, sound/notification on completion).
- Add "Odaklan" button on `TaskItem` which launches the timer pre-attached to that specific task.
- Mirror active timer in `CompanionWidget`.

### Task 6: Daily Mood & Rhythm (Günün Hissi & Nabzı)
- Create `src/types/mood.ts` and `src/domain/mood/moodService.ts` (Sakin 🌿, Enerjik ⚡, Odaklı 🎯, Yorgun ☕, Huzurlu ☁️).
- Add mood selector banner on `TodayView` next to the date.
- Show mood history indicators on `CalendarView`.

### Task 7: Weekly / Monthly Mini Stats Card
- Create `src/components/stats/WeeklyStatsCard.tsx` in `TodayView` and `CompletedView` showing:
  - Haftalık tamamlanma oranı (%)
  - En üretken gün
  - 7 günlük minimalist çubuk grafik (CSS bar chart)

### Task 8: Extended Soft Pastel Themes & Ultra-Mini Widget
- Add 4 new soft pastel palettes in `src/styles/themes.css` & `tokens.css`:
  - `sage` (Adaçayı Yeşili)
  - `slate` (Gece Mavisi / Nordic)
  - `peach` (Günbatımı Şeftalisi)
  - `mocha` (Sıcak Kahve / Krem)
- Update `SettingsView.tsx` and `ThemeProvider.tsx` to support theme selection.
- Add "Ultra-Mini Tek Görev Çubuğu" toggle in `CompanionWidget.tsx`.

### Task 9: Verification, Tests & Build Release v0.3.0
- Run all Vitest suites (`npm test`).
- Production build validation (`npm run build`).
- Build release v0.3.0 (`Dali_0.3.0_x64-setup.exe`).
