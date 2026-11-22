# PolSpeak

PolSpeak is a content management system for English teachers. Teachers create interactive, CEFR-levelled lessons (A1–C2) and manage students, groups, homework, schedules and messages. AI-assisted lesson generation is planned as the core feature.

It is a university project for two courses:

- **IT Project: Advanced Concepts of Algorithmics and Software Development.** Topic: *Custom CMS with AI-Driven Content Generation*.
- **Programming Web Applications Based on Microservices.** A Spring Boot microservice backend.

**What is done and what comes next:** [docs/ROADMAP.md](docs/ROADMAP.md).

## Run the frontend

You need [Node.js](https://nodejs.org) 20.9 or newer.

```bash
cd frontend
npm install      # first time only
npm run dev
```

Open http://localhost:3000. That is all; no configuration is needed.

- There is no backend yet, so you are signed in automatically as a demo teacher and pages show empty data. The terminal prints `ECONNREFUSED` / "Failed to proxy" for API calls; that is expected until the backend exists.
- To see the student portal, create `frontend/.env.local` with `NEXT_PUBLIC_DEV_AUTH_ROLE=student` and restart `npm run dev`.
- Defaults live in [frontend/.env.development](frontend/.env.development). Override them in `frontend/.env.local` (not committed).

Other commands (run inside `frontend/`):

| Command | What it does |
|---|---|
| `npm run build` | Production build |
| `npm start` | Runs the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

> **Windows:** open the terminal in the folder with its real letter case (for example `C:\Users\<you>\Desktop\PolSpeak`). A differently-cased path such as `desktop\polspeak` makes Node load React twice and `npm run build` fails.

## Project layout

```
frontend/          Next.js 16 + React 19 + TypeScript + Tailwind CSS (all pages are done)
  src/app/         pages
  src/components/  shared components
  src/lib/api/     API client; its types are the contract for the backend
docs/ROADMAP.md    current state, course requirements and the ordered list of next steps
```

The backend (`services/`, Java 21 + Spring Boot) is not started yet; see ROADMAP Phase C.

## License

[MIT](LICENSE)
