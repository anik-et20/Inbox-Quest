# Inbox Quest

**Play the game. Clear the inbox.**

Inbox Quest is a fast-paced browser game where every unread email is an enemy card. Each decision you make (Archive, Keep, Trash) is a real inbox action, and a live "Real-World Progress" panel shows the chore actually getting done while you play.

Built for **PromptWars x OUTLIER'2026** (Google for Developers, Build with AI).

> **Challenge:** Build an experience where playing a fast-paced game or interactive story actually executes the real-world chore in the background.

---

## Features

- **Game loop:** score, combo multiplier (x2 / x5 / x10), waves, and health hearts, with swipe or keyboard controls.
- **Real Gmail connection:** sign in with Google and play on your real unread emails.
- **AI classification:** Groq (`openai/gpt-oss-20b`) labels each email as newsletter, spam, important, receipt, or needs reply, with a confidence score and a short reason.
- **Fair three-tier scoring:** Protected emails must be kept, clutter should be cleared, and uncertain emails are your call.
- **Real-World Progress panel:** live counter, archived/trashed counts, and an action log with a confirmed check on every action.
- **Safety first:** Dry Run mode is on by default, Trash is recoverable, and Live mode needs an explicit confirmation.
- **Demo mode:** a seeded fake inbox so anyone can play instantly without signing in.

---

## How it works

1. The player opens the app and chooses **Play Demo** or **Connect Gmail**.
2. In Gmail mode, the app fetches up to 40 unread inbox emails (metadata only: sender, subject, snippet, date, labels).
3. A rule pre-filter and the Groq model classify each email. Only sender, subject, and a trimmed snippet are sent to Groq. Full email bodies are never read.
4. The game shows one email card at a time. The player chooses Archive, Keep, or Trash.
5. The action runs in the background (simulated in Dry Run, real in Live) and appears in the action log.
6. When the queue ends or health reaches zero, the end screen shows the results.

The AI never changes your inbox by itself. It only labels emails. You make every decision.

### Scoring tiers

| Tier | Examples | Correct move | Soft mistake (combo resets, no health lost) | Hard mistake (-1 health) |
|---|---|---|---|---|
| **Protected** | Real people, security alerts, bills, interviews, starred mail | Keep | none | Archive or Trash |
| **Clutter** | Newsletters, promotions, receipts, spam | Archive or Trash | Keep | none |
| **Uncertain** | AI confidence below 0.6 | Anything | none | none |

Enemy types: Newsletter (slow blob), Spam (swarm), Important (gem), Receipt (loot chest), Needs Reply (boss).

### Actions

| Action | Gmail effect |
|---|---|
| Archive | Removes the `INBOX` label (the email stays searchable) |
| Trash | Moves the email to Trash (recoverable for 30 days, never permanently deleted) |
| Keep | No change |
| Rewind | Undoes the last archive or trash |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Zustand |
| Auth | NextAuth.js (Google OAuth) |
| Email access | Gmail API via `googleapis` (scope `gmail.modify`) |
| AI classification | Groq API (`openai/gpt-oss-20b`, fallback `openai/gpt-oss-120b`) |
| Hosting | Vercel |

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- A Google account
- A free Groq API key from [console.groq.com](https://console.groq.com)

### 1. Install

```bash
npm install
```

> Don't run `npm audit fix --force`. It downgrades ESLint to an incompatible version and can break the project.

### 2. Set up Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com) and create a project.
2. **APIs & Services → Library:** enable the **Gmail API**.
3. **Google Auth Platform → Branding:** set the app name and your contact email.
4. **Audience:** choose **External** and keep it in **Testing**. Under **Test users**, add every Gmail address that should be able to sign in.
5. **Data Access:** add the scope `https://www.googleapis.com/auth/gmail.modify`.
6. **Clients → Create client:** choose **Web application** and add these redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-APP.vercel.app/api/auth/callback/google` (after deploying)
7. Copy the Client ID and Client Secret.

### 3. Configure environment variables

Create `.env.local` (or `.env`) in the project root:

```env
GROQ_API_KEY=your-groq-key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_FALLBACK_MODEL=openai/gpt-oss-120b

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

NEXTAUTH_SECRET=a-long-random-string
NEXTAUTH_URL=http://localhost:3000
```

Generate a secret with `openssl rand -base64 32`. Never commit this file, and make sure it is listed in `.gitignore`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the terminal shows a different port, set `NEXTAUTH_URL` and the Google redirect URI to match it.

Restart the dev server after changing environment variables or installing packages. Other code changes hot-reload, so a browser refresh is enough.

---

## Using the app

### Demo mode
Click **Play Demo**. It uses a seeded fake inbox, performs no real actions, and needs no login.

### Gmail mode
1. Click **Connect Gmail** and sign in with an account on the Test users list.
2. On the "Google hasn't verified this app" screen, click **Advanced → Go to Inbox Quest (unsafe)**. This is expected in Testing mode.
3. Click **Play with my Gmail**. Dry Run is on by default: real emails are shown, but no action changes Gmail.
4. To make real changes, switch to **Live** and confirm the warning. Trashed emails can be restored from Gmail Trash, and **Rewind** undoes the last action.

---

## Safety and privacy

- Dry Run is the default for Gmail mode, and Live mode needs an explicit confirmation.
- Emails are never permanently deleted. Trash is recoverable for 30 days.
- Only metadata (sender, subject, snippet, labels) is read. Full email bodies are never fetched.
- Only sender, subject, and a short snippet are sent to Groq for classification.
- Access tokens stay on the server and are never exposed to the browser.
- Protected emails (security alerts, real people, starred mail) cost health if trashed or archived.
- The app never sends emails.

---

## Project structure

Adjust this to match your repository.

```
app/
  page.tsx                      landing and game screens
  api/auth/[...nextauth]/       Google sign-in
  api/emails/                   fetch unread emails from Gmail
  api/classify/                 Groq classification with fallbacks
  api/action/                   archive and trash actions
  api/undo/                     rewind the last action
components/                     EmailCard, Hud, ActionLog, ProgressPanel, EnemySprite, EndScreen
lib/
  auth.ts                       NextAuth config and token refresh
  gmail.ts                      Gmail API helpers
  classify.ts                   classification and rule-based fallback
  actions.ts                    archive, trash, keep
store/game.ts                   Zustand game state
data/demo-emails.json           seeded fake inbox for Demo mode
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Error 403: access_denied` | Add your email under **Audience → Test users** in Google Cloud |
| `redirect_uri_mismatch` | The redirect URI must match exactly, including the port. Wait a few minutes after saving |
| Stuck on "Fetching emails" | Sign out and sign in again, because Google tokens expire after about an hour. Then check the terminal for errors |
| Sign-in times out | Retry. If it keeps happening, set `httpOptions: { timeout: 10000 }` on the Google provider |
| Groq errors or bad output | Check the model name in the Groq console. The app falls back to the second model, then to keyword rules |
| Running on port 3001 | An old dev server is still running. Close it, or update `NEXTAUTH_URL` and the Google redirect URI |
| Weird behavior after many edits | Stop the server, delete the `.next` folder, and run `npm run dev` again |

## Testing

The project uses Vitest with jsdom, Testing Library, and jest-axe.

```bash
npm test
npm run test:watch
npm run test:coverage
npm run typecheck
npm run lint
```

Tests cover tiering, rules pre-filtering, scoring/combo/ranks, validation,
entity decoding, API authentication boundaries, Demo mode, and a landing-page
accessibility smoke test. The current suite has 34 passing tests; the latest
coverage run reports 24.6% overall, 32.4% for `lib/`, and 45.9% for `store/`.
See [docs/TESTING.md](docs/TESTING.md) for the manual Demo checklist. |

Testing-mode Google tokens expire after about 7 days, so sign in again before a demo.

---

## Roadmap

- Boss fights with AI-drafted replies that need your approval before sending
- Power-ups (bulk archive a sender, slow-mo)
- Safe unsubscribe flow with confirmation
- More chores using the same game shell: file sorting, expense review, lint fixing
- Google OAuth verification for public access
- Leaderboard and shareable result cards

---

## Team

Built by Aniket at PromptWars x OUTLIER'2026.

## License

MIT