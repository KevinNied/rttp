# RTTP - Product Requirements Document

> **RTTP** stands for **Return To The Prime**.

| Version | Status |
| --- | --- |
| 0.1 | Living document |

## Table of Contents

- [Vision](#vision)
- [Problem Statement](#problem-statement)
- [Product Goal](#product-goal)
- [Primary Users](#primary-users)
- [Design Principles](#design-principles)
- [MVP Scope](#mvp-scope)
- [Out of Scope](#out-of-scope)
- [UX Philosophy](#ux-philosophy)
- [Success Metrics](#success-metrics)
- [Open Questions](#open-questions)
- [Non-Functional Requirements](#non-functional-requirements)
- [Future Vision](#future-vision)

## Vision

RTTP is a mobile-first web application designed to improve how athletes execute training routines created by coaches.

Today, most coaches create routines using Excel or Google Sheets because they are flexible and familiar. However, spreadsheets provide a poor experience during workouts.

RTTP aims to transform a static spreadsheet into an interactive workout experience.

> The focus of the product is **not** creating routines. The focus is **executing** routines.

## Problem Statement

Athletes frequently receive workout plans in spreadsheets. While spreadsheets are excellent authoring tools, they become difficult to use inside the gym.

Common pain points include:

- Constant zooming.
- Losing track of the current exercise.
- Poor visualization of workout structure.
- Difficulty recording weights and repetitions.
- Inability to quickly leave feedback.
- Too much information displayed at once.

The experience interrupts the workout instead of supporting it.

## Product Goal

Create the best possible mobile experience for following a workout routine.

The application should require minimal interaction during training while still allowing useful data collection.

## Primary Users

| User | Primary needs | Typical time in the application | Priority |
| --- | --- | --- | --- |
| **Coach** | Create and manage routines quickly and efficiently. | A few minutes | Secondary |
| **Athlete** | Execute workouts with minimal interruption. | 60-90 minutes | Highest |

The athlete experience has higher priority than the coach experience.

## Design Principles

### Mobile First

The application should be designed primarily for smartphones. Desktop is secondary.

### One-Handed Usage

Users are exercising. Interactions should be possible with one hand whenever possible.

### Minimal Cognitive Load

The application should always answer one question:

> “What should I do now?”

Avoid showing unnecessary information.

### Preserve Workout Structure

Coaches think in a hierarchy of:

- Warmup
- Circuits
- Blocks
- Main work
- Accessories

The application should preserve this hierarchy.

## MVP Scope

### Coach

- Create athletes.
- Create routines.
- Create workout sections.
- Create exercises.
- Configure sets.
- Configure repetitions.
- Configure notes.
- Assign routines.
- Share routine links.

### Athlete

- Open a shared link.
- View a workout overview.
- Start a workout.
- Navigate exercise by exercise.
- Record weights.
- Record repetitions.
- Mark exercises as completed.
- Leave comments.
- Finish a workout.

## Out of Scope

The following are not part of the MVP:

- Payments
- Nutrition
- AI-generated routines
- Videos
- Exercise library
- Push notifications
- Wearables
- Social features
- Chat
- Coach marketplace

## UX Philosophy

The product has two distinct experiences.

### Workout Overview

| Aspect | Description |
| --- | --- |
| **Purpose** | Understand today’s workout. |
| **Question answered** | “What am I doing today?” |

### Workout Mode

| Aspect | Description |
| --- | --- |
| **Purpose** | Guide the athlete through the workout. |
| **Question answered** | “What should I do next?” |

## Success Metrics

### Primary Metric

| Metric | Target |
| --- | --- |
| Time required to register a completed set | Less than three seconds |

### Secondary Metrics

- Workout completion rate
- Athlete feedback completion
- Coach adoption
- Weekly active athletes

## Open Questions

These questions are intentionally unresolved and should be explored during the design phase.

### Workout Overview

How should the routine be displayed?

- Expandable cards
- Visual diagram
- Timeline
- Flow diagram

### Workout Mode

How should navigation happen?

- Swipe cards
- Vertical scrolling
- Horizontal carousel
- Step-by-step wizard

### Feedback

Where should comments exist?

- Per exercise
- Per circuit
- At the end of the workout
- All of the above

### Progress

How should progress be visualized?

- Progress bar
- Checklist
- Timeline
- Circuit completion

### Coach Builder

How should routines be built?

- Drag and drop
- Tree structure
- Blocks
- Cards

## Non-Functional Requirements

- Fast loading
- Offline-friendly, if possible
- Mobile-optimized
- Accessible
- Responsive
- Easy to extend
- Clean architecture
- Component-based UI

## Future Vision

RTTP should become the best experience for executing coach-created workouts.

The long-term vision is not replacing Excel. The vision is replacing the experience of using Excel during training.
