# Testing

Run the focused suite with:

```bash
npm test
npm run test:coverage
npm run typecheck
npm run lint
```

The Vitest suite covers tier protection and clutter pre-filtering, scoring and
combo thresholds, rank thresholds, request and model-output validation, HTML
entity decoding, API authentication and Demo-mode boundaries, and a
Testing Library/Axe landing-page smoke test. Use `npm run test:watch` while
developing. The coverage report is written to `coverage/`.

The current suite has 34 passing tests. The latest coverage run reports 24.6%
overall, 32.4% for `lib/`, and 45.9% for `store/`.

Manual Demo smoke checklist:

1. Start the app with `npm run dev`.
2. Select **Play Demo** without signing in.
3. Use Archive, Keep, Trash, and the Left/Right/Down keyboard shortcuts.
4. Confirm the progress log reaches the end screen and **Play Again** starts a
   fresh run.
5. Confirm the footer says the fictitious inbox was used and no real inbox was
   changed.
