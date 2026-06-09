# LeaveApp

A full-stack leave management system built with Flask (backend) and React (frontend).

---

## Features

- Employee registration and login (JWT-based auth)
- Apply for leave with automatic business-day calculation
- View and cancel your own leave requests
- Admin panel to approve/reject requests, manage users, and set leave balances
- Gender-based leave restriction (maternity leave available to female employees only)
- SQLite for development, PostgreSQL-ready for production

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended |
| Frontend | React 18, Vite, React Router, Axios |
| Database | SQLite (dev) / PostgreSQL (prod) |

---

## Project Structure

```
LeaveApp/
├── backend/
│   ├── app.py              # App factory
│   ├── config.py           # Dev / prod / test configs
│   ├── models.py           # SQLAlchemy models (User, LeaveBalance, LeaveRequest)
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py         # Register, login, profile
│   │   ├── users.py        # User management, leave balances
│   │   └── leaves.py       # Leave requests CRUD + approve/reject
│   └── tests/
│       ├── conftest.py     # Shared fixtures (app, client)
│       ├── test_auth.py    # Auth tests
│       ├── test_leaves.py  # Leave request tests
│       └── test_users.py   # User management tests
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api/axios.js            # Axios instance with JWT interceptor
        ├── contexts/AuthContext.jsx
        ├── components/Navbar.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx       # Leave balance cards + recent requests
            ├── ApplyLeave.jsx      # Leave request form
            ├── MyLeaves.jsx        # Leave history with filters
            └── AdminPanel.jsx      # Approve/reject, users, balances
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend runs on `http://localhost:5000`.

By default it uses SQLite (`instance/leave_app.db`). To use PostgreSQL, set the `DATABASE_URL` environment variable:

```bash
# .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/leave_app_db
JWT_SECRET_KEY=your-secret-key
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies all `/api` requests to the backend.

---

## Default Accounts

| Username | Password | Role |
|---|---|---|
| admin | admin | Admin |

> Register new employee accounts via the `/register` page.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |

### Leaves
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/leaves/request` | Submit leave request |
| GET | `/api/leaves/requests` | List requests (own / all for admin) |
| GET | `/api/leaves/requests/:id` | Get specific request |
| POST | `/api/leaves/requests/:id/approve` | Approve request (admin) |
| POST | `/api/leaves/requests/:id/reject` | Reject request (admin) |
| POST | `/api/leaves/requests/:id/cancel` | Cancel request |

### Users (Admin)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/` | List all users |
| GET | `/api/users/:id/leave-balance` | Get leave balance |
| POST | `/api/users/:id/leave-balance` | Set leave balance |
| POST | `/api/users/:id/toggle-admin` | Toggle admin role |

---

## Testing

The backend has a full pytest test suite using an in-memory SQLite database — no setup required.

### Run Tests

```bash
cd backend
pip install pytest
python -m pytest tests/ -v
```

### Test Summary

| File | Tests | Coverage |
|---|---|---|
| `test_auth.py` | 12 | Register, login, profile, gender update |
| `test_leaves.py` | 17 | Submit, approve, reject, cancel, maternity restriction |
| `test_users.py` | 11 | List users, set/get balance, toggle admin |
| **Total** | **40** | **All passing** |

### Key Scenarios Tested

- Duplicate username / email rejected on register
- Wrong password returns 401
- Protected routes reject requests without a valid JWT
- Leave submission fails with no balance or insufficient balance
- Maternity leave blocked for male employees, allowed for female
- Approving a leave deducts from the balance
- Cancelling an approved leave restores the balance
- Non-admin users cannot approve, reject, set balances, or toggle roles
- Double-approving a request returns 400

---

## Leave Types

| Type | Notes |
|---|---|
| Annual | General paid leave |
| Sick | Medical leave |
| Personal | Personal errands |
| Maternity | Female employees only |
| Bereavement | Loss of family member |

---

## License

MIT
