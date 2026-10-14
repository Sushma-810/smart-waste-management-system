# Smart Waste Management System: Backend

Node.js + Express REST API with SQLite storage (no database server to install).

## Requirements
- Node.js 22.13 or newer (uses the built-in `node:sqlite`)

## Run
```
cd swm-backend
npm install
copy .env.example .env     (Windows; use cp on Mac/Linux)
npm start
```
The API runs at http://localhost:5000/api. Check http://localhost:5000/api/health

On first start an admin account is created from `.env`:
- Email: admin@wastesystem.com
- Password: Admin@12345
Change these in `.env` before first start for real use. Also change `JWT_SECRET`.

## Endpoints
| Method | Path | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | signed in |
| GET | /api/stats | public |
| GET | /api/complaints/mine | signed in |
| POST | /api/complaints (multipart, field `image`) | signed in |
| GET | /api/complaints/:id | owner or admin |
| GET | /api/admin/complaints, /api/admin/complaints/:id | admin |
| PATCH | /api/admin/complaints/:id `{status, assignedTo}` | admin |

Data is saved in `data/waste.db`; photos in `uploads/`. Delete both to reset.
