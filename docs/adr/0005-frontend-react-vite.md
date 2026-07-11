# 0005 — Frontend: React + Vite + TypeScript

- **Status:** Accepted. State management superseded by [0017](0017-frontend-clean-zustand.md); wavesurfer superseded by [0023](0023-previews-and-peaks.md)
- **Date:** 2026-10-27

## Context

The app is highly interactive (audio mixer) and needs neither SSR nor SEO.

## Decision

SPA with React + Vite + TypeScript. wavesurfer.js for waveforms, the Web Audio API for synchronized mixing, TanStack Query for server data.

## Consequences

- Fast development and a simple build.
- If the product grows and needs public pages or SEO, evaluate moving to a framework with SSR.
