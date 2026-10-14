# Smart Waste Management System — Frontend

React 18 + Vite single-page app for citizens (report and track waste problems) and administrators (monitor, assign and resolve them).

## Requirements
- Node.js 18 or newer and npm

## Install and run
```bash
cd swm-frontend
npm install
cp .env.example .env      # set VITE_API_URL if your backend is not on port 5000
npm run dev               # http://localhost:5173
```
Production build: `npm run build`, then `npm run preview`.

## Environment
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend base URL |

## Folder structure
```
src/
  components/   ui.jsx (Spinner, StatusBadge, EmptyState, StatCard, Field…), layouts, Timeline, tables
  context/      AuthContext (session), ToastContext (notifications)
  hooks/        useAsync (loading / error / reload)
  pages/        one file per screen
  services/     api.js (Axios instance + endpoint functions)
```

## Routes
| Path | Access | Page |
|---|---|---|
| `/` | public | Home |
| `/login`, `/register` | public | Auth |
| `/dashboard` | citizen | Citizen dashboard |
| `/report` | citizen | Report waste |
| `/complaints`, `/complaints/:id` | citizen | History and tracking |
| `/admin`, `/admin/complaints` | admin | Overview, charts, table |
| `/admin/complaints/:id` | admin | Assign and update status |

## Backend contract this frontend expects
All requests go to `VITE_API_URL`; protected ones send `Authorization: Bearer <token>`. Errors should return `{ "message": "..." }`.

| Method | Endpoint | Body / response |
|---|---|---|
| POST | `/auth/register` | `{name,email,password}` → `{token?, user}` |
| POST | `/auth/login` | `{email,password}` → `{token, user:{id,name,email,role}}` (`role`: `citizen` or `admin`) |
| GET | `/auth/me` | → `{user}` or user object |
| GET | `/stats` | public → `{total, resolved, pending}` |
| GET | `/complaints/mine` | → array, or `{complaints:[…]}` |
| GET | `/complaints/:id` | → complaint, or `{complaint}` |
| POST | `/complaints` | `multipart/form-data`: `title, description, category, location, address, image?, latitude?, longitude?` → complaint |
| GET | `/admin/complaints` | → array, or `{complaints:[…]}` |
| GET | `/admin/complaints/:id` | → complaint |
| PATCH | `/admin/complaints/:id` | `{status?, assignedTo?}` → updated complaint |

Complaint shape: `{ _id|id, title, description, category, status, location, address, latitude?, longitude?, imageUrl, assignedTo, createdAt, user:{name,email}, history:[{status, at}] }`

- `category`: `overflowing_bin`, `illegal_dumping`, `street_litter`, `missed_collection`
- `status`: `submitted`, `assigned`, `in_progress`, `resolved`
- "Pending" = submitted + assigned; "Active" = everything not resolved.
- All admin figures and charts are computed from the real `/admin/complaints` response; nothing is hardcoded.
- Your backend must allow CORS from `http://localhost:5173`, and `/admin/*` routes must enforce the admin role server-side.

## Authentication notes
- The JWT is kept in `sessionStorage` (cleared when the tab closes) and attached by an Axios interceptor.
- Any 401 on a protected call clears the token, signs the user out and shows a "session expired" toast.
- The most secure option is an `httpOnly`, `Secure`, `SameSite` cookie set by the backend. To switch, set `withCredentials: true` in `src/services/api.js` and remove the token handling.
- Route guards in the UI are a convenience only; enforce authorization on the server.
