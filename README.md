# Timesheets App

Our prototype timesheet management system built with Django and React. Consultants log hours, managers approve them, and finance handles pay.

---

## What It Does

- Consultants create weekly timesheets and submit them by Sunday 9pm
- Line managers review and approve or reject submissions
- Finance calculates pay and generates PDF payslips
- Admins manage users
- Consultants, Line Managers and the Finance Team get notifications when something changes

---

## Tech Stack

**Frontend**
- React 19 with Bootstrap 5
- Axios for API calls
- jsPDF for payslip generation
- FontAwesome for icons

**Backend**
- Django 5 with Django REST Framework
- PostgreSQL via Supabase
- Supabase Auth for password resets
- Django CORS Headers

---

## Project Structure

```
TimesheetsRepoNew/
├── backend/
│   ├── api/                  # models, views, serializers, urls
│   ├── timesheets_backend/   # Django settings and root urls
│   ├── requirements.txt
│   └── manage.py
└── frontend/
    └── timesheets-repo/
        └── src/
            └── components/   # all React pages/components
```

---

## Setup

### Backend

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Runs at `http://localhost:8000/api/`

### Frontend

```bash
cd frontend/timesheets-repo
npm install
npm start
```

Runs at `http://localhost:3000`

### Environment Variables

Create a `.env` file inside `backend/` with:

```
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

FRONTEND_URL=http://localhost:3000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

---

## User Roles

### Consultant
- Create and edit timesheets for the current and future weeks
- Log daily hours, overtime, work type, and client per entry
- Submit before Sunday 9pm deadline
- Withdraw a submitted timesheet to edit it again
- View approval status and rejection notes

### Line Manager
- See all submitted timesheets from consultants
- Approve or reject with a reason
- Get notified when a consultant submits
- set overtime limit

### Admin
- Create users and assign roles
- Reset passwords and deactivate accounts


### Finance
- View all approved timesheets
- Calculate pay (standard hours + 1.5x overtime)
- Download PDF payslips
- Mark timesheets as paid

---

## Timesheet Workflow

```
DRAFT -> SUBMITTED -> APPROVED -> PAID
                 \-> REJECTED
```

A rejected timesheet goes back to the consultant who can edit and resubmit.

---

## Pay Calculation

Pay is based on a daily rate divided by 8 hours to get the hourly rate.

```
hourly_rate = daily_rate / 8
pay = (standard_hours * hourly_rate) + (overtime_hours * hourly_rate * 1.5)
```

The rate used depends on the consultant's client assignment. If multiple clients are assigned, the system matches each entry to its client rate.

---

## Notifications

Notifications are created automatically when a timesheet changes status. The bell icon in the navbar polls every 10 seconds and shows an unread count badge. You can mark them as read one by one or all at once.

Notification types: Submitted, Approved, Rejected, Paid.

---

## Key API Endpoints

| Method | Endpoint | What It Does |
|--------|----------|--------------|
| POST | `/api/login/` | Log in |
| POST | `/api/auth/forgot-password/` | Send password reset email |
| POST | `/api/auth/reset-password/` | Set new password with token |
| GET | `/api/timesheets/consultant/<id>/` | Get a consultant's timesheets |
| POST | `/api/timesheets/create/` | Create a timesheet |
| POST | `/api/timesheets/<id>/submit/` | Submit a timesheet |
| PUT | `/api/timesheets/<id>/approve/` | Approve a timesheet |
| PUT | `/api/timesheets/<id>/reject/` | Reject a timesheet |
| PUT | `/api/timesheets/<id>/mark-paid/` | Mark as paid |
| POST | `/api/payslips/calculate/` | Calculate pay |
| GET | `/api/notifications/<userId>/` | Get notifications |
| POST | `/api/users/create-user/` | Admin creates a user |
| PUT | `/api/users/<id>/reset-password/` | Admin resets a password |
