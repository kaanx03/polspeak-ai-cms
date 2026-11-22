# PolSpeak Roadmap

PolSpeak is an English-only content management system for English teachers. Teachers build interactive, CEFR-levelled lessons (A1–C2) and manage learners, groups, homework, schedules and messages. The core feature is **AI-driven lesson generation**. One codebase is submitted to two courses.

This document answers three questions:

1. **What exists today?** See [Section 1](#1-current-state).
2. **What does each course require, and what must PolSpeak do to meet it?** See [Section 2](#2-microservices-lab-requirements) for the Microservices lab and [Section 3](#3-it-project-requirements) for the IT Project. [Section 4](#4-work-that-counts-for-both-courses) lists the work that counts for both.
3. **In what order is the work done?** See [Section 5](#5-linear-route), Steps 0–27.

Design details (ground rules, architecture, algorithms, AI generation) are in the appendices.

**Conventions**

- The route is linear and has no dates. A step starts when the previous step's *Done when* gate is met.
- `[x]` is done, `[ ]` is still to do, and *(optional)* marks voluntary or stretch work.
- **Lab n** is concept *n* of the microservices laboratory.
- **W1–W15** and **M1–M6** are the IT Project workshops and milestones. They are sequence labels, not deadlines.

### Progress at a glance

| Track | Status | Next action |
|---|---|---|
| Phase A: separation and cleanup (Steps 0–2) | ✅ done | Step 3: concept and requirements |
| Microservices lab: required concepts 1–6 | 0 / 6 | Step 7 (user-service), after the design steps |
| Microservices lab: voluntary concepts 7–17 | 0 / 11 | Planned in Steps 7–26 |
| IT Project: weekly evidence W1–W15 | 0 / 15 | W1–W2: concept and requirements (Step 3) |
| Deliverables: 2 reports, Postman collection, 2 presentations | 0 / 5 | Written alongside every step, finished in Step 27 |

---

## 1. Current state

### 1.1 Summary

| Area | Today |
|---|---|
| Repository | `github.com/kaanx03/polspeak-ai-cms`, branch `main`. Started from a cleaned copy of an older app; no old history is included. |
| Frontend | Complete teacher and student UI in `frontend/`, built with Next.js 16.4, React 19.2, TypeScript and Tailwind CSS 4. English only, branded PolSpeak. |
| Data access | `frontend/src/lib/api/` has one client module per domain, all calling the future API gateway at `/api/v1/...`. `next dev` forwards `/api/*` to `API_GATEWAY_URL` (default `http://localhost:8080`). |
| Backend | **Not started.** Every API call fails until it exists (`ECONNREFUSED` in the `next dev` log) and pages show empty states. This is expected until Step 9. |
| Database | None yet. |
| AI generation | **Not started.** The design is in [Appendix D](#appendix-d--ai-generation-design). |
| Automated tests | None yet. The checks today are typecheck, lint and build. |
| Docker, CI/CD | None yet. `next.config.ts` already builds a `standalone` server for a future image. |
| Documentation | `README.md` and this roadmap. |

### 1.2 Repository layout

```
.
├── frontend/                    Next.js app (the only code today)
│   ├── src/app/                 pages (App Router), see 1.3
│   ├── src/components/          AuthGuard, Sidebar, PdfViewer, WaveformPlayer
│   ├── src/contexts/            LibraryContext, ToastContext
│   ├── src/lib/api/             http.ts (fetch, error mapping, XSRF header, 401 redirect) and one module per
│   │                            domain: auth, students, groups, schedule, content, media, homework,
│   │                            assignments, messages
│   ├── src/lib/                 format.ts, upload.ts, id.ts, async.ts
│   ├── public/logo.svg
│   └── .env.development         defaults for `npm run dev` (API_GATEWAY_URL, dev sign-in bypass)
├── docs/ROADMAP.md              this file
├── README.md, LICENSE (MIT), .gitignore, .gitattributes
└── planned: services/, libs/, infra/, config-repo/, postman/, deploy/, docs/report/
```

### 1.3 Frontend features

All of these work as UI today. They show real data once the matching backend step is done.

| Area | Route | What it does |
|---|---|---|
| Sign-in | `/login` | One sign-in page for teachers and students; `/` redirects here. The development bypass (`NEXT_PUBLIC_DEV_AUTH_BYPASS=true`) opens the UI as a fake teacher or student. |
| Dashboard | `/dashboard` | Counters (active learners, lessons), shortcuts, upcoming lessons, recent lessons. |
| Lessons | `/lessons`, `/lessons/[level]` | CEFR levels A1–C2 and a lesson list per level with manual ordering. |
| Lesson editor | `/lessons/[level]/[id]/edit` | 19 module types: section, text, fillblank, inlinechoice, quiz, truefalse, matching, vocabulary, imagechoice, image, audio, pdf, youtube, iframe, wordwall, miro, quizlet, genially, baamboozle. |
| Presenter | `/lessons/[level]/[id]/present` | Full-screen lesson mode for the teacher and for students. |
| Curriculum | `/curriculum` | Topics per level. |
| Library | `/library` | Folders and files, pinning, moving and previews. |
| Students and groups | `/students`, `/students/[id]`, `/students/groups/[id]` | Learner and group management, student sign-in accounts, sharing lessons with learners. |
| Schedule | `/schedule` | Single and weekly recurring lessons, lesson history. |
| Homework (teacher) | `/teacher/homework` | Assign homework, review submissions, grade. |
| Messages | `/messages` | Teacher–student conversations. These are polled for now, not delivered in real time. |
| Settings | `/settings` | Display name, password change, sign-out on all devices. |
| Student portal | `/student`, `/student/homework/[id]` | Homework, assigned lessons and messages; homework submission and withdrawal. |

### 1.4 API contract the frontend already expects

The backend must implement these paths with the snake_case DTO shapes defined in `frontend/src/lib/api/*.ts`. The existing pages then work without changes.

| Service | Paths |
|---|---|
| user | `POST /api/v1/auth/login`, `/auth/logout`, `/auth/logout-all`, `/auth/password`; `GET /api/v1/auth/me`; `PATCH /api/v1/users/me` |
| classroom | `/api/v1/students` (CRUD), `/students/by-user/{userId}`, `/students/{id}/account`; `/api/v1/groups`; `/api/v1/schedule/lessons`; `/api/v1/lesson-history?studentId=&groupId=&lessonId=`; `/api/v1/homework` (+ `/{id}/submission`, `/{id}/grade`); `/api/v1/assignments?studentId=&lessonId=` |
| content | `/api/v1/curriculum/topics`; `/api/v1/lessons?level=` (+ `PUT /lessons/order`) |
| media | `POST/DELETE /api/v1/media/uploads`; `GET /api/v1/media/files/{key}` (`?download=true&filename=`); `/api/v1/media/folders`; `/api/v1/media/library` |
| notification | `/api/v1/messages?studentId=` (+ `/latest`, `/read`, `/unread-counts`, `/unread-count`); later `/api/v1/notifications`, `/ws` |
| ai (later) | `/api/v1/ai/generations`, `/ai/blocks`, `/ai/rewrite` |

### 1.5 Removed from the original app (Phase A)

- **Vendors:** Supabase (database, auth, storage, realtime), Cloudflare R2 with its upload and download routes, Vercel Speed Insights, the PWA layer, the Google Docs viewer and unused dependencies.
- **Personal content:** personal photos, the personal-brand logo and icons, screenshots with real data, and the hard-coded teacher name.
- **Languages:** the Ukrainian and Polish UI text and the language pickers. Turkish code comments were rewritten in English.
- **Out-of-scope features:**
  - payments and payment reminders
  - sticky notes
  - device and session tracking
  - the legacy homework-notes checklist
  - client-side TOTP 2FA
  - live (synchronized) lessons

### 1.6 Known gaps and technical debt

| Gap | Planned in |
|---|---|
| No backend, database or seed data | Steps 6–17 |
| The editor (5,329 lines) and the presenter (1,604 lines) are single components with `any` types. About 128 lint warnings come through a documented override in `frontend/eslint.config.mjs`. | Step 10 |
| In the content model, fill-in blanks are detected by a "number followed by a period" pattern, and embeds are stored as entered. | Step 8 (content model v2) |
| Lesson media are plain URLs | Step 12 (`mediaId`) |
| Messages and unread counts are polled | Steps 13 and 17 (WebSocket/STOMP) |
| No automated tests | Every step from Step 6, consolidated in Step 22 |
| Security gaps of the original system: open row-level policies, an unauthenticated download proxy, client-side-only 2FA | Fixed by design in the backend and described in the report (Step 24) |

### 1.7 Checks that pass today

- [x] `npm run typecheck`
- [x] `npm run lint` (0 errors)
- [x] `npm run build`

---

## 2. Microservices lab requirements

**Course:** Programming Web Applications Based on Microservices [WTI.SME.IN.3002]. **Source:** the laboratory instructions (`laboratory-2026Z.pdf`).

### 2.1 What the course asks

**Assignment.** Build a web application on a microservice architecture. The suggested topic is a simplified e-commerce platform, but students may propose a different project. PolSpeak keeps the lab's module structure under education names:

| Module proposed by the lab | PolSpeak counterpart | Service |
|---|---|---|
| Product service: CRUD, search by product attributes | Lessons and curriculum: CRUD, filtering by level, topic and status, full-text search | content-service, search-service |
| User and authentication service: registration, login, JWT | Teacher, student and admin accounts; JWT sign-in | user-service |
| Order and cart service: adding and removing items, order placement and tracking | Placement: assigning lessons and homework to students and groups. Tracking: submission and grading. | classroom-service |
| Review and rating service: ratings and reviews, aggregate rating shown with the product | *(optional)* Students rate a lesson after finishing it, and the average rating appears in the lesson list. | classroom-service → content-service |

**Suggested technologies.** Spring Boot, Eureka, H2, Spring Cloud Gateway (or Netflix Zuul), Docker and Kubernetes. Another stack is allowed. PolSpeak follows the suggestion with current versions (see [2.6](#26-differences-from-the-versions-in-the-lab-sheet)).

**Concepts.**

- Concepts 1–6 are **required**.
- Concepts 7–11 ("for volunteers #1") and 12–17 ("for volunteers #2") are voluntary.

**Deliverables.**

1. A detailed report on the architecture, flow and design choices.
2. Source code for each service, with its configuration files.
3. Postman collections or scripts for testing individual services.
4. A presentation demonstrating the functionality.

**Evaluation.**

- Functionality and completeness of the microservices.
- Code quality and best practices.
- Inter-service communication **and error handling**.
- Scalability and resilience.
- Quality and thoroughness of the report.

Collaboration is allowed, but the final code must be individual work.

### 2.2 Required concepts (1–6)

#### Lab 1: Basic microservice creation (Step 7)

*Lab asks:* a Spring Boot REST microservice with Create, Read, Update and Delete endpoints for a "User" entity. It is built in layers (entity, repository, service, controller), runs on H2 and is tested with curl and Postman.

- [ ] `services/user-service`, generated with Spring Initializr (Maven, Spring Web, Spring Data JPA, Validation, Actuator).
- [ ] A `User` entity (id, email, display name, role `TEACHER`/`STUDENT`/`ADMIN`, password hash, status), with the same repository → service → controller layering as the lab.
- [ ] Admin-only CRUD at `/api/v1/users`, plus `POST /auth/register`, `/auth/login`, `/auth/logout` and `GET /auth/me`.
- [ ] H2 in the `dev` profile (as in the lab) and PostgreSQL in the `docker` profile, configured in `application.yml`.
- [ ] Bean Validation and RFC 9457 `ProblemDetail` errors (400, 404, 409).
- [ ] A Postman folder `user-service` with a `pm.test` assertion on every request, and curl examples in the service README.

*Done when:* every endpoint passes in Postman, including the error cases.

#### Lab 2: Data persistence and caching (Step 8)

*Lab asks:* a new "products" microservice on PostgreSQL, MySQL or MongoDB (the lab runs PostgreSQL in Docker). Optionally, a Caffeine or Redis cache for reads, with cache configuration and eviction, a cache manager, Postman tests, cache debugging and JUnit/Mockito tests of the cache.

- [ ] `services/content-service`, the "Products" analogue, on PostgreSQL 17 (Docker) with Flyway migrations.
- [ ] Entities `CurriculumTopic`, `Lesson` and `LessonVersion`, with CRUD and search by attributes (level, topic, status). This is the lab's "search based on product attributes".
- [ ] A Caffeine cache on published-lesson and curriculum reads: `@EnableCaching`, `@Cacheable`, and `@CacheEvict` on update and delete. `recordStats` is exposed through Actuator metrics.
- [ ] JUnit/Mockito tests showing that the second read comes from the cache and that an update evicts it.
- [ ] English seed data: an A1–C2 curriculum and 5–8 sample lessons.
- [ ] A Postman folder `content-service`.

*Done when:* data survives a restart, and cache hits and misses are visible in `/actuator/metrics`.

#### Lab 3: Service discovery (Step 9)

*Lab asks:* integrate Eureka (or Consul) and register the microservices so they can communicate.

- [ ] `services/discovery-server` with `@EnableEurekaServer` on port 8761.
- [ ] Every service is a Eureka client with a unique instance id (`${spring.application.name}:${random.uuid}`) and `prefer-ip-address`.
- [ ] Services call each other by name (`lb://`, load-balanced `RestClient`), never by host and port.

*Done when:* the Eureka dashboard shows every service as UP. Take a screenshot for the report.

#### Lab 4: API gateway (Step 9)

*Lab asks:* Spring Cloud Gateway (or Zuul) as the main entry point, routing each request to the right microservice through service discovery.

- [ ] `services/api-gateway` (Spring Cloud Gateway, WebFlux) on port 8080, the only public port.
- [ ] Routes resolved through discovery:

  | Path | Service |
  |---|---|
  | `/api/v1/auth/**`, `/api/v1/users/**` | user |
  | `/api/v1/lessons/**`, `/api/v1/curriculum/**` | content |
  | `/api/v1/students/**`, `/groups/**`, `/schedule/**`, `/lesson-history/**`, `/homework/**`, `/assignments/**` | classroom |
  | `/api/v1/media/**` | media |
  | `/api/v1/messages/**`, `/api/v1/notifications/**`, `/ws` | notification |
  | `/api/v1/ai/**` | ai |
  | `/api/v1/search/**` | search |

- [ ] `/` serves the frontend, so the browser and the API share one origin (no CORS outside development).
- [ ] Cross-cutting gateway features: JWT check, CSRF protection, correlation id and an `X-Instance-Id` response header.
- [ ] A Postman environment `gateway`, so every collection runs through port 8080.

*Done when:* the frontend works through the gateway alone.

#### Lab 5: Inter-service communication (Steps 13 and 16)

*Lab asks:* a "Notification" microservice connected to the "User" and "Orders" services through REST or RabbitMQ. In the lab, the notification service consumes events from RabbitMQ queues and prints them to the console.

- [ ] RabbitMQ 4 in Docker, with a topic exchange `polspeak.events` and queues and bindings per consumer.
- [ ] **User → Notification:** user-service publishes `user.registered`. notification-service prints it to the console (as in the lab) and stores a welcome notification.
- [ ] **Orders → Notification:** classroom-service publishes these events, and notification-service turns them into notifications:
  - `lesson.assigned`
  - `homework.assigned`, `homework.submitted` and `homework.graded`
  - `schedule.*`
- [ ] At least one synchronous REST call: classroom-service → user-service to create a student sign-in account.
- [ ] Error handling, which is graded explicitly: timeouts, retries with backoff, dead-letter queues, idempotent consumers and a transactional outbox. No event may be lost or processed twice.

*Done when:* registering a user and assigning homework both produce notifications, and a poison message ends up in the dead-letter queue.

#### Lab 6: Containerization (Step 19, groundwork in Step 6)

*Lab asks:* containerize the microservices with Docker so that they keep communicating inside the container environment.

- [ ] One multi-stage Dockerfile per service (`maven:3.9-eclipse-temurin-21` → `eclipse-temurin:21-jre`), with a non-root user and a `HEALTHCHECK`, plus a standalone frontend image.
- [ ] `infra/docker-compose.yml` with PostgreSQL, RabbitMQ, all services and the frontend, using `depends_on` with health conditions.
- [ ] Only the gateway port (8080) is published. Services talk over the Docker network through Eureka.

*Done when:* `docker compose up --build` on a clean machine gives a working PolSpeak at `http://localhost:8080`.

### 2.3 Voluntary concepts (7–17)

The lab instructions describe concepts 7 and 9 in detail. Concepts 8 and 10–17 are listed by title only, so the tasks below are PolSpeak's own interpretation.

#### Lab 7: Centralized configuration (Step 20)

*Lab asks:* Spring Cloud Config Server (or Consul KV), so that configuration changes need no redeployment.

- [ ] `services/config-server` (`@EnableConfigServer`, port 8888) serving `config-repo/` from the native backend, mounted read-only.
- [ ] Clients use `spring.config.import=optional:configserver:`, and Spring Cloud Bus over RabbitMQ refreshes them.
- [ ] These settings can change at runtime: AI model and effort, token budget, CEFR thresholds, cache sizes and rate limits.

*Done when:* a value changed in `config-repo/` and refreshed through `busrefresh` shows up in the API without a container restart.

#### Lab 8: Authentication and authorization (Steps 7 and 9)

- [ ] user-service issues RS256 JWTs in an httpOnly `SameSite=Strict` cookie and publishes a JWKS endpoint.
- [ ] The gateway validates the token and relays it as `Authorization: Bearer`. The services are OAuth2 resource servers.
- [ ] Roles are `TEACHER`, `STUDENT`, `ADMIN` and `SERVICE`. Ownership checks apply: a teacher sees only their own data, and a student sees only what is assigned to them.
- [ ] A CSRF double-submit token. *(optional)* TOTP enforced on the server.

*Done when:* a wrong role gets 403, and another teacher's resource gets 403 or 404, in tests and in Postman.

#### Lab 9: Resilience and fault tolerance (Steps 11 and 21)

*Lab asks:* a circuit breaker (Hystrix or Resilience4j), plus retries, timeouts, bulkheads and failover.

- [ ] Resilience4j on every REST call between services and on the LLM call: circuit breaker, retry with jitter, time limiter and bulkhead.
- [ ] Gateway fallbacks return a readable 503 `ProblemDetail`.
- [ ] Failover:
  - With one of two content-service instances stopped, requests still succeed.
  - When the LLM fails, the job becomes `DEFERRED`.

*Done when:* the failure demos work (WireMock fault injection, a stopped instance), and circuit-breaker states are visible in Actuator.

#### Lab 10: Distributed tracing (Step 23)

- [ ] Micrometer Tracing with Zipkin. The trace context travels through both HTTP and RabbitMQ headers.

*Done when:* one trace shows the whole path: gateway → ai-service → RabbitMQ → content-service → notification-service.

#### Lab 11: Event-driven architecture (Step 13)

- [ ] An event catalogue with a versioned envelope ([Appendix B](#appendix-b--target-architecture)), a transactional outbox, and competing consumers for AI generation jobs.
- [ ] Asynchronous generation: `generation.requested` → worker → `generation.completed` → AI draft → notification.

*Done when:* the generate → draft → notify chain works end to end, even when RabbitMQ restarts in the middle.

#### Lab 12: Load balancing (Steps 21 and 24)

- [ ] Two or more instances of content-service and ai-service, with client-side load balancing through Eureka. The `X-Instance-Id` header shows which instance answered.
- [ ] Stateful parts are made safe for several instances:
  - cache invalidation through events
  - one queue per instance
  - ShedLock for scheduled jobs
  - a STOMP broker relay

*Done when:* repeated requests are visibly spread across instances.

#### Lab 13: Microservices testing (every step, consolidated in Step 22)

- [ ] For each service: unit and slice tests, and at least one Testcontainers integration test. The algorithms also get property tests.
- [ ] The Postman collection runs under Newman in CI, alongside Playwright end-to-end tests. *(optional)* Spring Cloud Contract.

*Done when:* CI publishes the test reports (JaCoCo, Surefire/Failsafe, Newman, Playwright).

#### Lab 14: Monitoring and logging (Step 23)

- [ ] Actuator and Micrometer → Prometheus → Grafana dashboards for:
  - latency and errors
  - cache hit rate
  - circuit breakers
  - queue depth
  - generation time
  - LLM tokens and cost
- [ ] Structured JSON logs with trace and span ids. *(optional)* Loki.

*Done when:* the dashboards show live data during the demo.

#### Lab 15: API versioning (Step 24)

- [ ] `/api/v1` everywhere, and one endpoint also offered as `/api/v2`, with `Deprecation` and `Sunset` headers on its v1 version.

*Done when:* both versions work through the gateway and the change is documented in OpenAPI.

#### Lab 16: Deployment and scaling (Steps 19 and 26)

- [ ] `docker compose up --scale ai-service=2`.
- [ ] Kubernetes manifests (kustomize) with probes, resource limits and a HorizontalPodAutoscaler, run on kind or minikube.
- [ ] *(optional)* A public cloud VM.

*Done when:* the system runs on Kubernetes and a service scales out under load.

#### Lab 17: Security best practices (Steps 7, 9, 12 and 24)

- [ ] An OWASP Top 10 checklist, security headers (CSP, HSTS, `X-Content-Type-Options`), rate limiting, and upload checks for size and MIME type.
- [ ] Secrets only in environment variables, least-privilege database users, a Trivy image scan and Dependabot.

*Done when:* the checklist is part of the report and the scans run in CI.

### 2.4 Deliverables

- [ ] **Report** `docs/report/microservices-lab.md`, exported to PDF. It covers:
  - the architecture diagram and service catalogue
  - data ownership
  - request and event flows
  - design decisions and their reasons
  - the communication and error-handling matrix
  - a scalability and resilience chapter
  - an evidence table for concepts 1–17
  - the version differences from the lab sheet (2.6)
- [ ] **Source code and configuration per service:** `services/<name>/` holds `application.yml`, the profiles, a Dockerfile and a README (port, endpoints, environment variables). Shared settings live in `config-repo/`.
- [ ] **Postman:** `postman/polspeak.postman_collection.json` with one folder per service, a gateway folder and end-to-end flows. It has `local` and `gateway` environments and `pm.test` assertions, and it runs under Newman in CI.
- [ ] **Presentation:** slides, a live-demo checklist and a backup demo video.
- [ ] **Individual-work statement** in the report.

### 2.5 Grading criteria and where they are covered

| Criterion | Covered by |
|---|---|
| Functionality and completeness | Concepts 1–6, plus the PolSpeak features (Steps 7–17) |
| Code quality and best practices | Layered services, validation, `ProblemDetail`, static analysis in CI (Step 6), tests in every step |
| Inter-service communication and error handling | Lab 5 tasks, outbox, DLQs, idempotency, Resilience4j, the error-handling matrix (Step 5) |
| Scalability and resilience | Labs 9, 12 and 16; the stateful-component table in the report |
| Report | Deliverable 1, written step by step in `docs/report/` |

### 2.6 Differences from the versions in the lab sheet

| Lab sheet | PolSpeak (current versions) |
|---|---|
| Java 17 | Java 21 (LTS) |
| `spring-cloud-starter-gateway`, `spring.cloud.gateway.routes` | `spring-cloud-starter-gateway-server-webflux`, `spring.cloud.gateway.server.webflux.routes` (the old names were removed in Spring Cloud 2025.1) |
| Hystrix | Resilience4j (Hystrix is no longer maintained) |
| `bootstrap.properties` | `spring.config.import=optional:configserver:` |
| `RestTemplate` | `@LoadBalanced RestClient` |
| Jackson 2 packages | Jackson 3 (`tools.jackson`) in Spring Boot 4 |
| `openjdk:20`, `frodenas/postgresql`, `rabbitmq:3-management` images | `eclipse-temurin:21-jre`, `postgres:17`, `rabbitmq:4-management` |
| `spring.datasource.initialization-mode` | Flyway migrations |

---

## 3. IT Project requirements

**Course:** IT Project: Advanced Concepts of Algorithmics and Software Development [WTI.SME.IN.3000]. **Source:** the course guide and the weekly workshop plan.

### 3.1 What the course asks

- **Format.** 45 hours in 15 workshops of 3 hours. One of ten topics is chosen and developed through the weekly workshops and six milestones (M1–M6).
- **Topic: Custom CMS with AI-Driven Content Generation.** In PolSpeak:
  - The *CMS* is the lesson content system: a structured content model, editor, versions, publishing workflow, curriculum, media library, search and access control.
  - The *AI-driven content generation* is the generation of validated draft lessons.
- **Technologies.** The technologies named in the topic descriptions are only examples, so **every technology choice must be justified**. This is done in ADRs.
- **Workshop routine.** Each workshop ends with a demonstration and a recorded next action and blocker. Decisions, code changes and evidence are recorded in the repository, in `docs/worklog.md`, with one entry per working session.
- The brief sets no due dates, team size or pass threshold. Later announcements in Moodle apply.

**Grading.**

| Criterion | Weight |
|---|---|
| Functional completeness | 15% |
| Algorithmic complexity | 20% |
| System design and architecture | 20% |
| Code quality and documentation | 10% |
| Use of appropriate technologies | 10% |
| Innovation and creativity | 10% |
| Testing and validation | 10% |
| Presentation and reporting | 5% |
| **Bonus:** containerization, CI/CD or public cloud deployment | up to +10% |

### 3.2 What PolSpeak must do for each criterion

#### Functional completeness (15%)

- [ ] **CMS core** (Steps 8, 12, 14, 15):
  - lesson CRUD with the 19 module types
  - content model v2 with validation
  - versions and diff
  - the DRAFT → PUBLISHED → ARCHIVED workflow
  - curriculum with prerequisites
  - media library and search
- [ ] **AI generation** (Steps 11, 13, 14):
  - a draft lesson generated from a topic, level, module mix and optional note
  - in-editor actions: add an exercise from a text, make it easier or harder, simplify to level X
  - a quality gate on everything generated
- [ ] **Classroom** (Steps 16, 17): students, groups, schedule, homework, lesson assignment, the student portal, messaging and notifications.
- [ ] The requirement status table `docs/05-requirements-status.md`, mapping every FR-xx to its status and evidence (Step 19).

*Evidence:* the requirement status table and the recorded end-to-end scenario (Step 18).

#### Algorithmic complexity (20%)

- [ ] The algorithm decision note `docs/03-algorithms.md` (Step 4). For each algorithm it covers:
  - the problem and the alternatives
  - the data structures
  - time and space complexity
  - a worked example and a test case
- [ ] Implement the algorithms below by hand, each with property tests and a benchmark against a naive alternative. The details are in [Appendix C](#appendix-c--algorithmic-core).

  | # | Algorithm | Used for | Step |
  |---|---|---|---|
  | A1 | Inverted index + BM25 + top-k heap | Lesson and library search; context for the AI | 14 |
  | A2 | MinHash + LSH | Near-duplicate detection of generated content | 14 |
  | A3 | CEFR lexical-profile level estimator | Checks that AI output matches the requested level | 11 |
  | A4 | Myers O(ND) diff | Version history, the "AI edit ratio" | 15 |
  | A5 | Kahn topological sort + cycle detection | Curriculum prerequisites, "next topic" | 15 |
  | A8 | Token-budgeted context packing (greedy vs. 0/1 knapsack DP) | Fitting retrieved snippets into the prompt | 14 |
  | A6 *(supporting)* | Recurrence expansion + sweep-line conflict detection | Double-booking in the schedule | 16 |
  | A7 *(supporting)* | Token bucket | Daily LLM token budget per teacher | 11 |

- [ ] Measurements: JMH benchmarks, retrieval quality (P@5, nDCG@10) and the A3 confusion matrix (Step 25).

#### System design and architecture (20%)

- [ ] `docs/04-architecture.md` (Step 5), with:
  - C4 context and container diagrams
  - sequence diagrams for generation, assignment and messaging
  - data ownership and API contracts
  - the inter-service error-handling matrix
- [ ] ADRs in `docs/adr/` for every major decision (Step 5).
- [ ] An as-built update of the architecture at the integrated-system review (Step 19).

#### Code quality and documentation (10%)

- [ ] Static analysis and formatting in CI (Step 6):
  - backend: Spotless, Checkstyle/SpotBugs
  - frontend: ESLint, Prettier, `tsc`, `knip`
- [ ] The editor and presenter split into module components, with no `any` left, the lint override removed and 0 warnings (Step 10).
- [ ] OpenAPI for each service, with generated TypeScript types; a README per service; Javadoc on the algorithm classes.

#### Use of appropriate technologies (10%)

- [ ] One ADR per technology choice, listing the alternatives that were considered (Step 5):
  - Spring Boot microservices vs. a monolith
  - PostgreSQL
  - RabbitMQ vs. Kafka
  - an in-house search engine vs. Elasticsearch
  - Caffeine vs. Redis
  - Claude with structured outputs
  - WebSocket/STOMP
  - Resilience4j
  - Zipkin, Prometheus and Grafana
  - Eureka vs. Kubernetes DNS

#### Innovation and creativity (10%)

- [ ] A CEFR level gate on AI output and an "estimated level" badge in the editor (A3).
- [ ] Retrieval-augmented generation with token-budget packing (A1 + A8).
- [ ] Duplicate avoidance for generated content (A2).
- [ ] The "AI edit ratio": how much of an AI draft survives into the published lesson (A4).
- [ ] LLM cost tracking and a token budget per teacher (A7).

#### Testing and validation (10%)

- [ ] Tests in every step (unit, slice, Testcontainers, Postman), consolidated in `docs/06-test-plan.md` with test data, edge cases and CI reports (Step 22).
- [ ] Performance: baseline → change → revised measurements, with method and limitations, in `docs/07-performance.md` (Step 25).
- [ ] The validation report `docs/08-validation.md` (Step 25), with:
  - the full test run and the failure-recovery tests
  - an evaluation of the AI pipeline on about 20 real generations: success rate, CEFR fit, cost per lesson and a human rubric

#### Presentation and reporting (5%)

- [ ] The report `docs/report/it-project.md` (Step 27): problem, requirements, architecture, algorithms and measurements, technology choices, tests, outcomes, limitations and an AI-usage statement.
- [ ] Slides, a rehearsed live demo, a demo checklist and a backup video (Step 27).

#### Bonus (up to +10%)

- [ ] Containerization: Docker Compose for the whole system (Step 19).
- [ ] CI/CD: GitHub Actions, test → image → deploy (Steps 6 and 26).
- [ ] *(optional)* Deployment to a public cloud (Step 26).

### 3.3 Weekly evidence (W1–W15)

Each workshop expects a specific piece of evidence. The table maps each one to its PolSpeak artifact. Phase A (Steps 0–2) is preparation before W1 and produces no weekly evidence.

| Week | Milestone | Focus (course plan) | Expected evidence (course plan) | PolSpeak artifact | Step | Status |
|---|---|---|---|---|---|---|
| W1 | M1 | Topic choice; users and constraints; initial problem statement | One-page concept with objectives, users, features, risks and open questions | `docs/01-concept.md` | 3 | ⬜ |
| W2 | M1 | Prioritized requirements; data, privacy, reliability and performance concerns | Requirements list and acceptance criteria for the first usable version | `docs/02-requirements.md` | 3 | ⬜ |
| W3 | M2 | Computational core; algorithms and data structures compared | Algorithm decision note with complexity analysis and a small test example | `docs/03-algorithms.md` | 4 | ⬜ |
| W4 | M2 | Modules, interfaces, data flow, external services, failure cases, storage | Architecture diagram, interface sketch, technology rationale | `docs/04-architecture.md`, `docs/adr/` | 5 | ⬜ |
| W5 | M3 | Repository structure, setup, configuration, minimal running path | Runnable skeleton with README and initial automated checks | `services/` skeleton, Docker infrastructure, CI | 6 | ⬜ |
| W6 | M3 | First vertical feature slice connected to the computational core | Demonstrable feature slice and focused tests | Sign-in → lesson → AI draft with the A3 check | 7–11 | ⬜ |
| W7 | M3 | Extended prototype; correctness and complexity review; design feedback | Prototype demonstration, limitations, revised backlog | `docs/prototype-review.md` | 11 | ⬜ |
| W8 | M4 | Storage and API integration; invalid inputs and service failures | Integration path with reproducible test data or fixtures | Seed data, media fixtures, 413/415/422 and failure tests | 12–13 | ⬜ |
| W9 | M4 | Main end-to-end workflow; usability, accessibility, error messages | End-to-end scenario and documented issues | `docs/09-usability-review.md` | 18 | ⬜ |
| W10 | M4 | Connected system; each requirement traced to evidence; gaps | Integrated build, updated architecture, requirement status | `docker compose up`, `docs/05-requirements-status.md` | 19 | ⬜ |
| W11 | M5 | Unit, integration and performance checks; representative and edge-case inputs | Test plan, test data, automated test results | `docs/06-test-plan.md`, CI reports | 22 | ⬜ |
| W12 | M5 | Measurement of the critical algorithm or workflow; bottlenecks; failure recovery | Baseline and revised measurements with method and limitations | `docs/07-performance.md` | 25 | ⬜ |
| W13 | M5 | Full test suite; high-priority defects; evidence per criterion | Validation report and release candidate | `docs/08-validation.md`, tag `v1.0.0-rc1` | 25 | ⬜ |
| W14 | M6 | Problem, architecture, algorithms, choices, tests, outcomes, limitations; demo rehearsal | Draft report, slides or outline, demo checklist | Draft `docs/report/it-project.md`, slides | 27 | ⬜ |
| W15 | M6 | Presentation; justified choices; validation evidence; limitations and next steps | Final repository or build, report, presentation, demo evidence | GitHub release `v1.0.0` | 27 | ⬜ |

---

## 4. Work that counts for both courses

| Work | Microservices lab | IT Project |
|---|---|---|
| Service decomposition, Eureka, gateway | Labs 1–4 | System design 20%, functional completeness 15% |
| RabbitMQ events, outbox, notification-service | Labs 5 and 11 | System design; failure handling (W8) |
| AI generation (asynchronous jobs, resilience) | Labs 5, 9 and 11 | The topic itself, innovation 10%, algorithms A3, A7 and A8 |
| search-service | Lab 11 (event consumer) | Algorithms A1, A2 and A8 |
| Docker Compose | Lab 6 | Bonus |
| CI/CD, Kubernetes, cloud | Lab 16 | Bonus |
| Tests, Postman and Newman | Lab 13, Postman deliverable | Testing and validation 10% |
| Resilience and failover | Lab 9 | Performance and reliability (W12) |
| Tracing, metrics, dashboards | Labs 10 and 14 | Measurements (W12) |
| Architecture document and ADRs | Report: architecture and design choices | System design 20%, technologies 10% |
| Reports and presentations | Report and presentation deliverables | Presentation and reporting 5% |

- [ ] Both instructors confirm in writing that one project may be submitted to both courses (Step 3). Each submission includes an individual-work statement.
- The two reports share chapters (architecture, services, tests), but each has its own focus:
  - the lab report: services, communication and resilience
  - the IT report: requirements, algorithms, measurements and validation

### Minimum submission line

| Course | Required | Stretch (extra credit) |
|---|---|---|
| Microservices lab | Steps 0–13, 16 and 19 (lab concepts 1–6), the Postman collection, the lab report | Steps 20 (lab 7), 21 (9), 22 (13), 23 (10, 14), 24 (12, 15, 17), 26 (16) |
| IT Project | Steps 3–5, 8–11 and 14–15 (algorithms A1, A2, A4, A5, A8), the core of Step 22, Step 25 (benchmarks and A3 accuracy), Step 27 | More depth for A6 and A7; optional AI features |
| Product scope | Step 16 (students, groups, homework, schedule) and Step 17 (messaging) | Live lessons, TOTP, API v2, Kubernetes and cloud, central log aggregation, contract tests |

---

## 5. Linear route

Each step names the lab concepts (**Lab**) and IT Project criteria or workshops (**IT**) it delivers. "Lab n checklist" refers to the task list in Section 2.

### Phase A: Separation and cleanup ✅

**Step 0: Detach from the production site** ✅

- Checked that the local copy was fully in sync with GitHub, then removed `.git` and started a new repository.

**Step 1: Personal data, branding and language cleanup** ✅

- Removed personal photos, branding and screenshots with real data.
- Introduced the PolSpeak name and a neutral logo.
- Made the UI English only: translated the Polish editor defaults and rewrote comments in English.
- Removed the out-of-scope features (see 1.5).

**Step 2: Vendor removal and groundwork** ✅

- Removed Supabase, Cloudflare R2, Vercel and the PWA layer.
- Added the API client layer `frontend/src/lib/api/`, keeping the old helper names.
- Moved the app to `frontend/` and added the README.
- Updated Next.js to 16.4.6 and React to 19.2.9.
- [x] Typecheck, lint (0 errors) and build pass.
- [x] Published as `github.com/kaanx03/polspeak-ai-cms` ("first commit").

### Phase B: Definition and design (M1–M2)

**Step 3: Concept, requirements and scope** · IT: W1–W2, M1

- Get written approval from both instructors for using one project in two courses.
- `docs/01-concept.md`: problem, goals, users (teacher, student, admin), features, risks, open questions and the out-of-scope list.
- `docs/02-requirements.md`:
  - functional requirements prioritized with MoSCoW (FR-xx)
  - non-functional requirements: performance targets, reliability, security, privacy and an LLM cost limit
  - Given/When/Then acceptance criteria for the first usable version: sign in → AI draft → edit → publish → assign → the student solves it
- Start `docs/worklog.md` and the backlog: GitHub Issues and a Project board with MoSCoW labels.
- *Done when:* both documents are reviewed and the minimum submission line is confirmed.

**Step 4: Algorithm design note** · IT: algorithms, W3, M2

- Write `docs/03-algorithms.md` for A1–A8 ([Appendix C](#appendix-c--algorithmic-core)).
- Choose and cite the A3 data sets and their licences, and define the train/test split.
- *Done when:* every algorithm has a complexity analysis and an example test case.

**Step 5: Architecture and ADRs** · IT: design, technologies, W4, M2 · Lab: report

- `docs/04-architecture.md`:
  - C4 diagrams (Mermaid) and sequence diagrams
  - wireframes of the new screens: the generate-with-AI dialog, the version/diff panel, search and notifications
  - data ownership and the `/api/v1` contracts
  - the **inter-service error-handling matrix**: for every REST call and event, the timeout, retry, circuit breaker, fallback, DLQ, idempotency key and user-visible message
- `docs/adr/`: the choices listed under 3.2 "Use of appropriate technologies", plus database per service, JWT cookie + CSRF, file storage, Flyway, and native vs. git configuration.
- *Done when:* the diagrams, the matrix and the ADRs are reviewed.

### Phase C: Skeleton and first vertical slice (M3)

**Step 6: Monorepo skeleton, infrastructure and CI** · IT: W5, code quality, bonus · Lab: 6 (groundwork), 13

- A Maven parent POM with the Java 21, Spring Boot 4.x and Spring Cloud 2025.1.x BOMs.
- The ten services under `services/`, and `libs/common` with the event envelope, outbox, `ProblemDetail` and security helpers.
- `infra/docker-compose.yml` with four profiles:
  - `infra`: PostgreSQL 17 with one database and user per service, and RabbitMQ 4
  - `ops`: admin UIs, bound to 127.0.0.1
  - `docker`
  - `seed`
- CI (GitHub Actions):
  - backend: `mvn -B verify` with Spotless and Checkstyle/SpotBugs
  - frontend: ESLint, Prettier, `tsc`, build and `knip`
  - repository: gitleaks (secret scan)
- *Done when:* every service answers `/actuator/health` with UP and CI is green.

**Step 7: user-service and JWT** · Lab: 1, 8, 17 · IT: functional

- The Lab 1 and Lab 8 checklists.
- Teacher sign-up, gated by an invite code or admin approval.
- Student accounts created by the teacher.
- `logout-all` through a token version.
- Service-account tokens.
- Seed data: a demo admin, a demo teacher and invented students.
- *Done when:* register → login → `/auth/me` works in Postman, and a wrong role gets 403.

**Step 8: content-service, curriculum, lessons and content model v2** · Lab: 2 · IT: functional, data for A5

- The Lab 2 checklist.
- Entities:
  - `CurriculumTopic`: CEFR level A1–C2, category, order, prerequisites
  - `Lesson`: owner, level, topic, status, order, origin MANUAL/AI, version
  - `LessonVersion`: immutable
- Content model v2:
  - a discriminated union with `type` and `schemaVersion: 2`
  - explicit `{{n}}` blank markers and UUID ids
  - allow-listed embed URLs, rendered in sandboxed iframes
- JSON Schema and semantic validation; optimistic locking (409).
- A single-transaction `PUT /lessons/order` and a summary projection for lists.
- *Done when:* the tests pass and cache hits and misses are visible in metrics.

**Step 9: Eureka and API gateway** · Lab: 3, 4, 8

- The Lab 3 and Lab 4 checklists.
- A cookie → Bearer converter, CSRF protection, CORS for development only, and aggregated OpenAPI.
- *Done when:* all services are UP in Eureka and the Postman `gateway` environment passes.

**Step 10: Frontend wiring and editor split** · IT: W6, code quality

- Wire `/login`, settings, lessons, the level lists and the curriculum to the gateway.
- Add feature flags in `frontend/src/config/features.ts` to hide menus whose backend does not exist yet.
- Generate TypeScript types from OpenAPI (`openapi-typescript`); CI detects contract drift.
- Split the editor:
  - shared types in `lib/lesson/`
  - per-module editor and renderer components, shared by edit and present
  - debounced autosave with a "Saving… / Saved" indicator
  - parsing of content model v2
  - no file over about 800 lines, no `any`, and the lint override removed
- *Done when:* sign in → create, edit and present a lesson works through the gateway, and component tests and a Playwright smoke test pass.

**Step 11: ai-service, the first AI vertical slice** · IT: W6–W7, A3, A7, innovation · Lab: 9 (first part)

- An `LlmClient` port with `AnthropicLlmClient` and a deterministic `MockLlmClient`. The mock is the default, so development, CI and demos need no API key.
- `GenerationJob`, the generation schema and the `ModuleMapper`.
- Quality gate v1 (validators, A3 and repair) and the A7 token budget.
- Resilience4j on the LLM call and on the ai → content call.
- Frontend: the "Generate with AI" dialog with progress, the in-editor AI actions and the "estimated level" badge.
- *Done when:*
  - the validator, mapper and A3 tests pass
  - a `@SpringBootTest` with the mock covers the first-usable-version acceptance criteria
  - `docs/prototype-review.md` (W7) records the demo, the limitations and the re-prioritized backlog

### Phase D: Integrated system (M4)

**Step 12: media-service and `mediaId`** · IT: W8 · Lab: 17

- `Folder` and `MediaFile` (owner, MIME type, checksum, pinned, storage key), stored by `LocalFsBlobStorage` on a Docker volume.
- Uploads: multipart with MIME sniffing and one size limit (413/415).
- Downloads: range requests and HMAC-signed expiring links.
- A warning before deleting files that lessons use.
- In the editor, lesson media become `mediaId` references with media pickers, and the media modules are enabled.
- CC0 or self-made fixtures in `infra/seed/media/`.
- *Done when:* the tests pass, including these invalid inputs:
  - malformed module JSON → 422
  - oversized file → 413
  - wrong MIME type → 415

**Step 13: RabbitMQ, outbox and notification-service** · Lab: 5, 11 · IT: W8

- The Lab 5 (User → Notification) and Lab 11 checklists, with publisher confirms.
- `GET /api/v1/notifications` and mark-as-read.
- WebSocket/STOMP delivery to `/user/queue/notifications`, with a JWT check on CONNECT.
- *Done when:*
  - creating a user in Postman produces the console line and a stored notification
  - generate → draft → notify works
  - a poison message reaches the DLQ
  - a Testcontainers test stops RabbitMQ between commit and publish, and the event is still delivered

**Step 14: search-service** · IT: A1, A2, A8 · Lab: 11

- An in-memory index fed by `lesson.*` events (one queue per instance) and rebuilt from content-service on start-up.
- Endpoints: `GET /search`, `POST /search/similar` and `POST /search/near-duplicates`.
- ai-service uses search for RAG (A8) and for quality gate v2 (near-duplicates). If search is down, ai-service generates without context.
- A search box in the lessons and library pages.
- *Done when:* the A1, A2 and A8 tests pass and the labelled query set exists.

**Step 15: Versions, diff, publishing workflow and curriculum DAG** · IT: A4, A5, functional

- A version history panel with the Myers diff and the "AI edit ratio".
- The DRAFT → PUBLISHED → ARCHIVED workflow.
- A prerequisite that would create a cycle is rejected with 409, and the "next topic" suggestion uses A5.
- *Done when:* the A4 and A5 property tests pass and the UI flow works.

**Step 16: classroom-service, the "Orders" analogue** · Lab: 5 (Orders → Notification) · IT: A6, functional

- **Students.** Data minimization. Accounts are created through user-service, protected by Resilience4j. Deletion is one transaction plus a `learner.deleted` event.
- **Groups and schedule.** Groups; single and weekly recurring lessons with A6 conflict detection; lesson history.
- **Homework.** Assign, submit, withdraw and grade, with files in media-service. A `homework.due-soon` job runs exactly once (ShedLock).
- **Lesson assignment.** `lesson.assigned` updates the access grants in content-service, so students only see assigned, published lessons. Topic progress is tracked.
- *(optional)* **Lesson rating**, the lab's "Review and rating" module. Students rate a finished lesson (1–5 and a comment), and the average appears in the lesson list.
- **Frontend.** Wire students, groups, schedule, homework, the student portal and the dashboard, and turn on their feature flags.
- *Done when:* assigning homework notifies the student in real time, submitting it notifies the teacher, and opening another student's homework returns 403.

**Step 17: Messaging (+ optional live lessons)** · Lab: 5 · IT: functional

- Conversations with attachments (media-service), voice notes, read receipts and unread counts.
- Messages are sent over REST and delivered on `/user/queue/messages`, which replaces the polling.
- A RabbitMQ STOMP relay is required as soon as notification-service runs more than one instance.
- *(optional)* Live lessons on `/topic/live.{id}`, for invitees only.
- *Done when:* two browsers exchange messages instantly and unauthorized subscriptions are rejected.

**Step 18: End-to-end scenario, usability and accessibility review** · IT: W9

- Record the scenario: generate → edit → publish → assign → the student solves and submits → the teacher grades and messages.
- Run `@axe-core/playwright` and Lighthouse on the login, lesson list, editor, presenter and student portal, and fix the serious and critical findings.
- Review the error messages: problem details, empty and loading states, AI `FAILED`/`DEFERRED`, and 409/413/415/429.
- Run 2–3 think-aloud sessions with the SUS questionnaire.
- *Done when:* `docs/09-usability-review.md` lists the findings and fixes.

**Step 19: Full containerization and integrated-system review** · Lab: 6, 16 · IT: W10, bonus

- The Lab 6 checklist; `--scale ai-service=2` works.
- Update `docs/04-architecture.md` to the as-built design and update the ADR statuses.
- Write `docs/05-requirements-status.md`.
- *Done when:* `docker compose up --build` starts everything from a clean clone.

**Step 20: Centralized configuration** · Lab: 7

- The Lab 7 checklist, with `@ConfigurationProperties` and `@RefreshScope`. `busrefresh` is exposed internally only.
- *Done when:* the refresh demo works without restarting any container.

**Step 21: Resilience, full coverage and failover** · Lab: 9, 12

- The Lab 9 checklist, plus a rate limiter on the gateway routes.
- Provider failover: Claude → server-side fallback → `DEFERRED`, or a clearly labelled mock.
- *Done when:* the failure demos work and have their own Postman folder.

### Phase E: Testing, observability and performance (M5)

**Step 22: Test consolidation** · Lab: 13 · IT: testing, W11

- `docs/06-test-plan.md`.
- jqwik property tests (A1, A2, A4, A5, A6, A7), plus security and gateway route tests.
- End-to-end tests: Playwright (with axe) and Newman.
- CI reports published as artifacts.
- A fixed-seed synthetic corpus for JMH and k6.
- *(optional)* Spring Cloud Contract.
- *Done when:* the "Results" section of the test plan links the CI reports.

**Step 23: Observability** · Lab: 10, 14

- The Lab 10 and Lab 14 checklists.
- *Done when:* one end-to-end trace and the Grafana dashboards are shown with live data.

**Step 24: Scaling, load balancing, API versioning and security hardening** · Lab: 12, 15, 17

- The Lab 12, Lab 15 and Lab 17 checklists.
- The original system's security gaps go into the report as lessons learned.
- *Done when:* the security checklist is complete and the scans run in CI.

**Step 25: Performance, validation and release candidate** · IT: testing, algorithms, W12–W13

- JMH benchmarks against naive alternatives (A1, A2, A4, A6, and A8 greedy vs. DP), A1 retrieval quality and the A3 confusion matrix.
- Baseline → change → revised experiments, each with its method and limitations:
  - the lesson list before and after the summary projection and cache (k6 p50/p95/p99)
  - generation before and after prompt caching (tokens and cost)
  - scaling with the number of replicas
- The AI pipeline on about 20 real generations: success rate, average attempts, CEFR fit and cost per lesson; 10 lessons rated with a human rubric.
- Failure recovery:
  - kill ai-service mid-job: no duplicate drafts, and the recovery time is measured
  - restart RabbitMQ
  - simulate LLM 5xx errors
- `docs/07-performance.md` and `docs/08-validation.md`.
- Publish the images to GHCR and tag `v1.0.0-rc1`.
- *Done when:* both documents are complete and the release candidate is tagged.

### Phase F: Delivery (M6)

**Step 26: CI/CD, Kubernetes and optional cloud** · Lab: 16 · IT: bonus

- GitHub Actions: test → GHCR → (optional) deploy.
- `deploy/k8s/` with kustomize, probes, resource limits and an HPA for ai-service and content-service, run on kind or minikube.
- The report discusses Eureka vs. Kubernetes DNS.
- *(optional)* A VM with Docker Compose and Caddy (HTTPS). A public demo uses the mock AI provider or a small budget.
- Tag `rc2` if anything changed.
- *Done when:* the pipeline deploys to the Kubernetes cluster.

**Step 27: Reports, presentations and final release** · Lab: all deliverables · IT: presentation, W14–W15

- **W14:** draft `docs/report/microservices-lab.md` and `docs/report/it-project.md` (see 2.4 and 3.2), two slide decks and two demo checklists.
- **W15:**
  - final versions of everything
  - GitHub release `v1.0.0` with the report PDFs, the Postman export and the image digests
  - instructor access to the repository
  - a backup demo video, and README screenshots retaken with seed data
- *Done when:* both submissions are handed in.

---

## Appendix A — Ground rules

These apply to every step.

1. **Never touch the original production site.** Its repository (`kaanx03/PolSpeak`) is never added as a remote. This project lives only in `kaanx03/polspeak-ai-cms`.
2. **No live data or credentials** from the original site. The system starts with an empty database and invented English seed data.
3. **English everywhere:** code, comments, commits, docs, ADRs, Postman descriptions, seed data, UI and AI output.
4. **No removed vendor comes back,** not even for deployment.
5. **No dead features.** An optional feature is either implemented in its step, or its legacy code stays deleted.
6. **The app stays demonstrable after every step.** Menu items whose backend does not exist yet are hidden behind feature flags (`frontend/src/config/features.ts`, introduced in Step 10).
7. **Every step has automated tests.** A service step ships:
   - unit and slice tests
   - at least one Testcontainers integration test
   - its Postman folder with `pm.test` assertions, tagged with requirement ids (FR-xx)

   Each step also adds its chapter and evidence to `docs/report/`, so the report is written as the work goes.
8. **Privacy.** No student personal data is sent to the LLM. Prompts are built from a whitelisted DTO (topic, level, content, teacher note), and e-mail addresses and phone numbers are removed from teacher notes.
9. **Secrets** live only in environment variables, never in the repository or the config repository.

## Appendix B — Target architecture

```
                         ┌──────────── api-gateway (:8080) — single origin ────────────┐
Browser ───────────────  │ /            → frontend (Next.js :3000)                     │
 (dev: next dev :3000,   │ /api/v1/**   → services (lb://)   JWT (cookie → Bearer),     │
  /api rewritten to      │ /ws          → notification (lb:ws://)  CSRF, rate limit,     │
  the gateway)           │                                    circuit breaker           │
                         └─────────────────────────────────────────────────────────────┘
 user (:8081) · content (:8082, Caffeine) · ai (:8083 → Claude API) · search (:8084)
 media (:8085 → volume) · classroom (:8086) · notification (:8087, WebSocket/STOMP)
 discovery-server (:8761) · config-server (:8888) · PostgreSQL 17 (one database per service)
 RabbitMQ 4 (topic exchange polspeak.events)
 ops profile (127.0.0.1 only): Eureka 8761, RabbitMQ 15672, Zipkin 9411, Prometheus 9090, Grafana 3001
```

**Stack:** Java 21, Spring Boot 4.x with Spring Cloud 2025.1.x (Oakwood), Maven multi-module; PostgreSQL 17 with Flyway; RabbitMQ 4; Next.js 16 frontend.

| Service | Responsibility | Lab |
|---|---|---|
| discovery-server | Eureka registry | 3 |
| config-server | Central configuration from `config-repo/` (bind-mounted), with live refresh through Spring Cloud Bus | 7 |
| api-gateway | Single entry point (also serves the frontend), JWT validation, CSRF, rate limiting, CORS (development only), circuit-breaker fallbacks, WebSocket routing, API versioning | 4, 8, 9, 12, 15 |
| user-service | Registration, accounts (TEACHER / STUDENT / ADMIN), login/logout/me, password change, RS256 JWT + JWKS, service-account tokens, optional TOTP | 1, 8, 17 |
| content-service | **"Products" analogue:** curriculum (with the prerequisite DAG), lessons and immutable versions, search by attributes (level, topic, status), diff, publishing workflow, lesson access grants | 2 |
| ai-service | Generation jobs, prompts, the Claude client, quality gate, RAG context, token budget | 5, 9, 11 |
| search-service | BM25 inverted index, similar-content retrieval, MinHash near-duplicate detection | 11 |
| media-service | Library folders and files, blob storage on a volume, range downloads, signed links | 5, 17 |
| classroom-service | **"Orders" analogue** (assignment is order placement; submission and grading are order tracking): students, groups, schedule, lesson history, homework, lesson assignments, progress | 5 |
| notification-service | Notifications from events, teacher–student messaging, real-time delivery over WebSocket/STOMP, optional live-lesson channel | 5 |

**Authentication.**

- user-service issues an RS256 JWT in an httpOnly, `SameSite=Strict` cookie.
- The gateway validates it with a custom cookie converter, because Spring Security reads only the `Authorization` header by default. It then relays the token to the services as `Authorization: Bearer`.
- The services are resource servers and validate the token through JWKS. They take identity from the token, never from headers injected by the gateway.
- CSRF protection combines `SameSite=Strict` with a double-submit token (`XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header) on non-GET requests. The frontend client already sends the header.
- Background workers that act without a user request, such as the AI worker, use service-account tokens (`ROLE_SERVICE`). The gateway never routes `/internal/**` endpoints.

**Data.**

- One database and one least-privilege user per service, in a single PostgreSQL container. Each service owns its Flyway migrations.
- Every content and classroom entity carries an `ownerId` (the teacher), which removes the original single-teacher assumption.
- Seed data is loaded through `R__demo_seed.sql` or `@Profile("demo")` loaders.

**Events.**

- Topic exchange `polspeak.events`, with the envelope `{eventId, type, version, occurredAt, producer, payload}`.
- user-, content- and classroom-service use a **mandatory transactional outbox**. The relay uses `SELECT … FOR UPDATE SKIP LOCKED` and RabbitMQ publisher confirms.
- Every queue has a dead-letter queue and exponential retry, and consumers are idempotent (`processed_events`).

| Event | Producer → consumers |
|---|---|
| `user.registered` | user → notification (console log + welcome notification) |
| `generation.requested` | ai → ai workers (competing consumers) |
| `generation.completed` / `.failed` | ai → content (creates the AI draft version), notification |
| `lesson.draft-created`, `lesson.published` / `.updated` / `.archived` | content → search (one queue per instance), notification, other content instances (cache invalidation) |
| `lesson.assigned` / `.unassigned` | classroom → content (access grant), notification |
| `homework.assigned` / `.submitted` / `.graded` / `.due-soon` | classroom → notification |
| `schedule.lesson-created` / `.cancelled` | classroom → notification |
| `learner.deleted` | classroom → user (close the account), notification, media |

## Appendix C — Algorithmic core

| # | Algorithm | Service | Purpose | Complexity (vs. alternative) | Evidence |
|---|---|---|---|---|---|
| A1 | Inverted index + BM25 + top-k min-heap (tokenizer, stop words, Porter stemmer) | search | Lesson and library search; RAG context for the AI | Index O(T); query O(Σ\|P_t\| + R log k) vs. linear scan O(N·L) | JMH; P@5 and nDCG@10 on ~20 labelled queries vs. a substring/TF-IDF baseline |
| A2 | MinHash + LSH (b bands × r rows, threshold s ≈ (1/b)^(1/r)) | search | Near-duplicate detection of generated lessons and exercises | Signatures O(S·h); candidates ~O(b) vs. all pairs O(N²·S) | JMH; property test of candidate recall vs. exact Jaccard |
| A3 | CEFR lexical-profile level estimator (lemma dictionary → frequency-band hash map → band distribution + sentence length → level) | ai | Checks that AI output matches the requested level; "estimated level" badge in the editor | O(n) | Train/test split of a labelled levelled-text set; confusion matrix on the test split |
| A4 | Myers O(ND) diff (module level and word level) | content | Version history, "AI edit ratio" | O((N+M)·D) vs. DP-LCS O(N·M) | JMH + property test: applying diff(a,b) to a yields b |
| A5 | Kahn topological sort + cycle detection | content | Curriculum prerequisite DAG, "next topic" suggestion | O(V+E) | Property tests: the order respects the edges; cycles are rejected |
| A8 | Token-budgeted context packing (greedy vs. 0/1 knapsack DP) | ai | Fits retrieved snippets into the prompt budget | Greedy O(n log n); DP O(n·B) | Optimality gap and run time vs. budget B |
| A6 *(supporting)* | Weekly recurrence expansion + sweep-line conflict detection | classroom | Double-booking detection in the schedule | O(n log n) vs. pairwise O(n²) | Property test vs. an O(n²) oracle; JMH |
| A7 *(supporting)* | Self-written token bucket (daily LLM token budget per teacher) | ai | Cost control | O(1) per request | Property test: never exceeds capacity + rate·t |
| opt. | TOTP (RFC 6238) | user | Two-factor authentication | O(1) | Unit tests with the RFC test vectors |

The data sets and their licences are chosen and cited in Step 4:

- for A3, a CEFR word list or frequency bands (candidate: the CEFR-J Wordlist)
- a labelled levelled-text set (candidate: the OneStopEnglish corpus)

Usage terms are checked before use. The Porter stemmer is used only for search (A1); level estimation (A3) uses a lemma dictionary.

## Appendix D — AI generation design

This design is implemented in Step 11 and extended in Steps 13 and 14.

**Flow.**

1. The teacher chooses a topic, level, module mix, length and an optional note.
2. `POST /api/v1/ai/generations` returns `202 Accepted` with a job id and queues `generation.requested`.
3. A worker loads the topic (content-service) and similar lessons (search-service, A1 + A8).
4. The worker calls the model, runs the quality gate and publishes `generation.completed`.
5. content-service creates an AI draft version, idempotent by job id.
6. The teacher is notified and opens the draft in the lesson editor.

**Model call.**

- The model is `claude-opus-5-5`, called through the official `com.anthropic:anthropic-java` SDK, and only inside ai-service. Adaptive thinking is used, and `effort` comes from configuration: `high` for full lessons, `low` for small blocks.
- Structured output comes through `.outputConfig(GeneratedLesson.class)`. The stable system prompt pins "target language: English (EFL)" and uses prompt caching.
- The `refusal` and `max_tokens` stop reasons are handled explicitly. Server-side refusal fallback (beta `server-side-fallback-2026-07-01`, `fallbacks: "default"`) is enabled if the Java SDK supports it together with structured outputs. Otherwise a refusal counts as a job failure.
- The model, tokens and cost are recorded for each job. A deterministic `MockLlmClient` is the default provider.

**Generated module types.**

- Only the 8 text-based types are generated: `section`, `text`, `fillblank`, `quiz`, `matching` (word–definition), `truefalse`, `inlinechoice` and `vocabulary`.
- Media and embed types are never generated, so no URLs are invented.
- A `ModuleMapper` converts the flat schema (shaped for structured outputs) into the editor's lesson-module JSON (content model v2, Step 8).

**Quality gate.**

- Type-specific validators:
  - the number of `{{n}}` blanks equals the number of answers
  - a quiz has exactly one correct option, and no option is repeated
  - every correct answer appears among the options
  - vocabulary is not duplicated
- The A3 level check, which also rejects output with a high out-of-vocabulary rate (non-English output).
- The A2 near-duplicate check, plus scrubbing of HTML and URLs.
- On failure, deterministic repair runs first. Then come up to two retries with the validator feedback, and finally the job becomes `FAILED` with a stored report.

**In-editor actions.** These produce mini-markdown only, never HTML:

- "Add exercise from this text"
- "Regenerate / easier / harder"
- "Simplify to level X"

**Optional:**

- "Suggest topics", with batch generation per topic (Message Batches API).
- Image-choice distractors for teacher-uploaded images.
- "Practice homework from this lesson".
