# EC2 Deployment Runbook

Covers deploying the verified-generation subsystem and getting the code
execution sandbox actually working in production.

**Read the "Known config problems" section before deploying.** Four of them
will bite you, and one is a security issue.

---

## Step 1 — Diagnose what is currently running

SSH in and run these. You need the answers before deciding anything else.

```bash
# Is Docker installed and running?
docker --version && sudo systemctl is-active docker

# Are the executor containers up? What are they called, and on which ports?
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# How is the backend itself running?
pm2 list 2>/dev/null || sudo systemctl status learncodeai --no-pager 2>/dev/null || docker ps | grep backend

# Which execution backend is configured?
grep -E 'CODE_EXEC_BACKEND|PISTON_URL|GEMINI_API_KEY|OPENAI_API_KEY' .env | sed 's/=.*/=<set>/'
```

Then test execution end to end through the live API:

```bash
curl -s -X POST http://localhost:4000/api/code/execute \
  -H 'Content-Type: application/json' \
  -d '{"code":"print(1+1)","language":"python"}'
```

Interpret the result:

| Response | Meaning | Action |
|---|---|---|
| `{"output":"2",...}` | Sandbox works. | Verification will work. Proceed. |
| `Piston error 401 ... whitelist only` | **Public Piston is dead.** | Must fix — see Step 3. |
| `Docker timeout` then a Piston error | Docker executors are not reachable. | See Step 3. |
| `C++ execution requires Docker` | Running the unsandboxed fallback. | **Security issue — see Step 3.** |

---

## Step 2 — Known config problems

These are all pre-existing. Fix them while you are in there.

### 2a. The healthcheck can never pass

`Dockerfile:41` probes `/health`, but the app serves `/healthz`
(`src/app.js:144`). The container is permanently marked unhealthy, which will
also break any orchestrator that gates traffic on health.

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/healthz || exit 1
```

### 2b. `docker-compose.yml` gives containers root on the host

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock   # container can control the host daemon
privileged: true                                 # and drops nearly all isolation
```

Mounting the Docker socket is equivalent to handing out host root. Combined
with `privileged: true`, on a platform whose entire purpose is running
untrusted student code, this is the highest-severity issue in the repo.

**Use `docker-compose.secure.yml` instead** — it is already written correctly
(`cap_drop: ALL`, `no-new-privileges`, `read_only`, `tmpfs` with `noexec`,
resource limits, no socket mount).

### 2c. `docker-compose.yml` references a service that does not exist

```yaml
depends_on:
  - docker      # there is no service named "docker" in this file
```

`docker compose up` fails outright on this. Another reason to use the secure
compose file.

### 2d. The image omits the `docker/` directory

`Dockerfile` copies only `src/` and `scripts/`, but `containerManager.js`
resolves its Dockerfiles at `<app>/docker`. Inside the image that path does not
exist, so building executor images from within the container cannot work.

Either add `COPY --chown=learncodeai:learncodeai docker/ ./docker/`, or use the
compose-managed executors (below) and stop building them at runtime.

---

## Step 3 — Get the sandbox working

There are two incompatible strategies in the codebase for the same job. Pick
one; running both is what causes the confusing failures.

### Strategy A — compose-managed executors (recommended)

`docker-compose.secure.yml` starts three hardened executor services on fixed
ports:

| Service | Host port |
|---|---|
| `python-executor` | 8765 |
| `javascript-executor` | 8766 |
| `cpp-executor` | 8767 |

```bash
docker compose -f docker-compose.secure.yml build
docker compose -f docker-compose.secure.yml up -d
docker compose -f docker-compose.secure.yml ps
```

> **Integration gap you must close.** `containerManager.js` looks up containers
> by the names `learncodeai-python-executor` / `-javascript-` / `-cpp-` and
> reads a *dynamically assigned* port via `docker inspect`. Compose creates
> them as `python-executor` etc. on *fixed* ports. With compose in charge,
> `containerManager.getContainerPort()` will not find them, and
> `codeExecutorWSService` falls through to Piston.
>
> Closing this means teaching `codeExecutorWSService` to connect to the fixed
> compose ports instead of asking `containerManager`. Until that is done,
> Strategy A will silently degrade to the Piston path.

### Strategy B — runtime-managed executors

Let `containerManager` create and name the containers itself. This is what the
current code expects, and it requires the backend to reach the Docker daemon —
which is the socket mount from 2b. If you take this route, run the backend
**directly on the host** under pm2/systemd rather than inside a container, so
no container needs the socket.

```bash
sudo usermod -aG docker $USER   # log out and back in
pm2 restart learncodeai-backend
```

### If you cannot run Docker at all

The public Piston API became whitelist-only on 2026-02-15 and now returns
`401`. Self-host it:

```bash
docker run -d --name piston -p 2000:2000 --privileged ghcr.io/engineer-man/piston
```

Then set `PISTON_URL=http://localhost:2000/api/v2/piston`.

> **Never set `CODE_EXEC_BACKEND=fallback` in production.**
> `fallbackCodeExecutor.js` shells out to `python <file>` and `node <file>`
> directly on the host with no isolation. It is a development convenience only.

---

## Step 4 — Environment variables

Add to `.env` on EC2:

```bash
# --- Verified generation ---
GEMINI_API_KEY=<your key>
# OPENAI_API_KEY=<optional; enables failover>
AI_PROVIDER_ORDER=gemini,openai
AI_MAX_RETRIES=3
AI_MAX_REPAIR_ATTEMPTS=2

# --- Execution backend ---
CODE_EXEC_BACKEND=docker
# PISTON_URL=http://localhost:2000/api/v2/piston   # only if self-hosting Piston
```

Nothing else is required — the subsystem adds no new npm dependencies.

---

## Step 5 — Deploy

```bash
cd /path/to/learncodeai-backend
git fetch origin
git checkout feat/verified-generation      # or main, once merged

npm ci --omit=dev
npm run test:pure                          # 84 tests, no DB or Docker needed

pm2 restart learncodeai-backend && pm2 logs --lines 50
```

The new subsystem adds one collection (`generationtraces`). No migration is
needed; Mongoose creates it on first write.

### Verify the deployment

```bash
curl -s http://localhost:4000/healthz
```

Then generate an AI tutorial through the UI or API and check the response's
`verification` block:

```jsonc
{
  "verified": true,          // sandbox actually judged the snippets
  "sandboxDegraded": false,  // true => sandbox was down, examples are UNVERIFIED
  "snippetsJudged": 3,
  "passedFirstTry": 2,
  "passedFinal": 3,
  "repaired": 1
}
```

**If `sandboxDegraded` is `true`, the sandbox is unreachable.** Examples are
still delivered (the service fails open rather than publishing a tutorial with
no code), but nothing was verified — go back to Step 3. Do not show a
"verified" badge in this state.

---

## Step 6 — Collect real evaluation numbers

Once the sandbox is confirmed working, run the benchmark on EC2 where the
executors live:

```bash
npm run evaluate:quick    # 6 tasks, ~40 API calls, sanity check first
npm run evaluate          # full 36-task benchmark, all 4 arms
```

Reports land in `evaluation/results/` (gitignored). `latest-live.md` contains
the results table, Wilson intervals, and the two-proportion z-test.

Run it against a real sandbox — a run where every snippet comes back
`executor_unavailable` produces no usable numbers, by design.

---

## Rollback

```bash
git checkout main
npm ci --omit=dev
pm2 restart learncodeai-backend
```

The only schema addition is a new collection that nothing else reads, so
rolling back the code is sufficient. Existing tutorials are unaffected.
