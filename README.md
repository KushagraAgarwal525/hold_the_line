# Hold the Line

Hold the Line is a public red-team range for a fictional banking voice agent. Three phone lines will share one persona. Only the defense changes: the prompt, a stricter prompt, or checks in the tool layer.

No door is live. No phone number is assigned.

## Run it

```bash
npm install
npx vitest run
npx tsc --noEmit
npx next dev
```

The app serves `/`, `/play`, `/tape`, `/results`, and `/privacy`. Counts on those pages come from an empty list of human calls.
