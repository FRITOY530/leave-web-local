# 本地学生请假网页复刻 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-only mobile H5 replica of the reference leave-record and new-leave flow.

**Architecture:** A small React + TypeScript + Vite app uses client-side view state instead of a router, with focused components for the list page, form page, select sheet, and localStorage persistence. Styling is centralized in CSS and mirrors the reference's PingFang/Microsoft YaHei typography, white cells, gray separators, and teal actions.

**Tech Stack:** React, TypeScript, Vite, CSS, browser localStorage.

---

### Task 1: Replace the Vite starter with local leave data and navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/index.css`
- Remove starter image imports/assets from the app entry

- [ ] Define `LeaveRecord` and `LeaveForm` types plus a safe `localStorage` adapter.
- [ ] Render the record list by default and switch to the form view when the floating plus button is pressed.
- [ ] Seed only anonymized sample records and never include the reference ticket or real credentials.

### Task 2: Implement the new-leave form and local selectors

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] Add all observed fields with required markers, mobile labels, placeholders, and local validation.
- [ ] Use native date/time controls for the two time fields and a local bottom-sheet selector for categorical fields.
- [ ] Keep proof material local-only and display its name without uploading.
- [ ] On valid submit, save to localStorage and return to the list page; no network request is allowed.

### Task 3: Verify build and browser behavior

**Files:**
- Modify: `README.md`

- [ ] Run `npm install` and `npm run build`.
- [ ] Run the local dev server and verify list → form → local save → list flow at a mobile viewport.
- [ ] Confirm a refresh preserves records and that required-field errors prevent saving.
