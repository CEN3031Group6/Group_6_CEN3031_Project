# Loyalty Card Project


Business-facing web app to issue and manage loyalty cards.
Monorepo with **Django (backend)** and **Next.js + TypeScript + Tailwind v4 (frontend)**.

## Team Roles

Product Manager : Zachary Nelson
Frontend Manager : Christopher Horhota
Backend Development Team Member : Brandon Guergo
Frontend Development Team Member : Carlos
Frontend Development Team Member : James Jean Philipe

## Setup Process For Team


```
repo/
├─ backend/      # Django REST API (SQLite in dev)
├─ frontend/     # Next.js + TS + Tailwind v4 (pages router, /src structure)
└─ docs/         # (optional course docs)
```

---

## 1) Prerequisites

### macOS

* **Python 3.10+** → `python3 --version`
  If missing: `brew install python`
* **Node.js 18+** → `node -v`
  If missing: `brew install node`
* **Git** → `git --version`
  If missing: `brew install git`

### Windows (PowerShell)

* **Python 3.10+** → `py --version` (install from python.org if missing)
* **Node.js 18+** → `node -v` (install from nodejs.org if missing)
* **Git** → `git --version` (install from gitforwindows.org if missing)

> If PowerShell blocks venv activation on Windows, run once:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force`

---

## 2) Clone the repo

```bash
git clone <YOUR_REPO_URL>
cd <YOUR_REPO_FOLDER>
```

---

## 3) Backend (Django) — Setup & Run

> Uses **SQLite** in development — no database install required.

### 3.1 Create a virtual environment & install dependencies

**macOS / Linux**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Windows (PowerShell)**

```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

### 3.2 Create your env file

Create `backend/.env` (or copy `backend/.env.example` if present):

```
DJANGO_SECRET_KEY=dev-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

### 3.3 Migrate & run

**macOS / Linux**

```bash
python3 manage.py migrate
python3 manage.py runserver
```

**Windows**

```powershell
py manage.py migrate
py manage.py runserver
```

Backend runs at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

### 3.4 Health check

Open **[http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/)** — you should see:

```json
{"status":"ok"}
```

---

## 4) Frontend (Next.js) — Setup & Run

Open a **new terminal** (keep the backend running).

### 4.1 Install dependencies

```bash
cd frontend
npm install
```

### 4.2 Create your env file

Create `frontend/.env.local` (or copy `frontend/.env.local.example` if present):

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4.3 Tailwind v4 (already set up)

* `frontend/postcss.config.mjs` should contain:

  ```js
  export default { plugins: { "@tailwindcss/postcss": {} } };
  ```
* `frontend/src/styles/globals.css` should start with:

  ```css
  @import "tailwindcss";
  ```

### 4.4 Run the dev server

```bash
npm run dev
```

Frontend runs at **[http://localhost:3000](http://localhost:3000)**

### 4.5 Frontend → Backend connectivity test

Open **[http://localhost:3000/home](http://localhost:3000/home)** and click **“Ping Backend.”**
You should see **“Backend says: ok”**.

---

## 5) Common Commands

**Backend**

```bash
# with venv active (macOS: source venv/bin/activate | Windows: .\venv\Scripts\Activate.ps1)
python3 manage.py makemigrations     # Windows: py manage.py makemigrations
python3 manage.py migrate            # Windows: py manage.py migrate
python3 manage.py createsuperuser    # Windows: py manage.py createsuperuser
python3 manage.py runserver          # Windows: py manage.py runserver
```

**Frontend**

```bash
npm install
npm run dev
```

---

## 6) Troubleshooting

* **`python: command not found` (macOS)**
  Use `python3` instead, or add `alias python="python3"` to `~/.zshrc`.

* **`py: command not found` (Windows)**
  Use `python` instead:
  `python -m venv venv` and `python manage.py ...`

* **CORS error in the browser**
  Backend is configured for dev with `CORS_ALLOW_ALL_ORIGINS = True`.
  Ensure the backend is running at `http://127.0.0.1:8000` and the frontend `.env.local` points to `http://localhost:8000/api`.

* **404 at root**
  `/` is not a backend route. Use:

  * Backend health: `http://127.0.0.1:8000/api/health/`
  * Frontend UI: `http://localhost:3000/home`

* **Port already in use**

  * macOS (kill 8000): `lsof -i :8000` → `kill -9 <PID>`
  * macOS (kill 3000): `lsof -i :3000` → `kill -9 <PID>`
  * Windows: `netstat -ano | findstr :8000` → `taskkill /PID <PID> /F`

* **Tailwind styles not applying**

  * Restart `npm run dev` after changing PostCSS/CSS.
  * Verify `postcss.config.mjs` and `globals.css` content as shown above.
  * Ensure `_app.tsx` imports `@/styles/globals.css`.

---

## 7) Development Workflow (team)

1. First baseline commit can go to **main**.
2. After that, use feature branches + PRs:

   ```bash
   git checkout -b feature/<short-name>
   git add -A
   git commit -m "feat: <message>"
   git push -u origin feature/<short-name>
   ```
3. Open a Pull Request into `main`.

---

## 8) What **not** to commit

These should already be ignored by `.gitignore`, but double-check:

```
backend/venv/
backend/.env
backend/*.sqlite3
frontend/node_modules/
frontend/.next/
frontend/.env.local
.DS_Store
```

Add example envs (commit these):

```
backend/.env.example
frontend/.env.local.example
```

---

## 9) Quick “it works” checklist ✅

* [ ] `http://127.0.0.1:8000/api/health/` returns `{"status":"ok"}`
* [ ] `npm run dev` serves `http://localhost:3000/home`
* [ ] “Ping Backend” shows “Backend says: ok”
* [ ] No secrets or build artifacts are committed

