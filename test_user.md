# RUMI Platform Testing Guide

This guide explains how to set up the test environment, seed test data, and log in as various user roles to verify platform functionality.

## 1. Prerequisites

Ensure you have the backend dependencies installed:

```bash
# In Backend/ directory
pip install pandas scikit-learn
```

## 2. Setting Up Test Data

We have a dedicated command to manage test users and data.

### Dry Run (Safe Preview)
To see what will be created without modifying the database:
```bash
python manage.py seed_test_users --dry-run
```

### Create Test Users (Staging)
To create 5 users (one per role) with hostels, bookings, and payment configs:
```bash
python manage.py seed_test_users --env=staging
```

### Clean Up
To remove **only** the test data created by this command:
```bash
python manage.py seed_test_users --remove
```
*Note: This will delete any user, hostel, or booking tagged with `test_seeded_by=rumia_ide`.*

## 3. Test Credentials

**Password for ALL users:** Test@Rumia2026

### 🎓 Student
- **Name**: Amani Ochieng
- **Email**: amani.ochieng@test.rumia.co.ke
- **Phone**: +254712345001
- **University**: University of Nairobi
- **Student ID**: STU-2026-001
- **Course**: Computer Science (Year 2)
- **Status**: Verified, Profile Complete, Onboarding Done
- **Current Booking**: Room 101, Bed A (Test Hostel Kilimani)

### 🏘️ Landlord
- **Name**: James Mwangi
- **Email**: james.mwangi@test.rumia.co.ke
- **Phone**: +254712345002
- **Company**: Mwangi Properties Ltd
- **Business Address**: 123 Kenyatta Avenue, Nairobi
- **Holdings**: 1 Hostel, 10 Rooms
- **Payment Config**: M-Pesa Paybill 174379 (Sandbox Mode)

### 🔑 Caretaker
- **Name**: Grace Wanjiku
- **Email**: grace.wanjiku@test.rumia.co.ke
- **Phone**: +254712345003
- **Assigned Hostel**: Test Hostel Kilimani
- **Permissions**: Check-in, Inventory, Maintenance, Visitors

### 🛠️ Tech Support
- **Name**: Kevin Njoroge
- **Email**: kevin.njoroge@test.rumia.co.ke
- **Phone**: +254712345004
- **Role**: Staff (Monitoring Access)
- **Capabilities**: System Monitoring, User Impersonation

### ⚡ Super Admin
- **Name**: Admin Rumia
- **Email**: `admin.rumia@test.rumia.co.ke`
- **Phone**: `+254712345005`
- **Role**: Superuser (Full System Access)

## 4. Access Links

- **Student/Landlord Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Caretaker Dashboard**: [http://localhost:3000/caretaker/dashboard](http://localhost:3000/caretaker/dashboard)
- **Admin Portal**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)

## 5. Troubleshooting Common Issues

- **404 Errors in Recommendations**: The `recommendations` app integration is currently pending, so related endpoints may return 404s. This is expected.
- **Session Errors**: If you can't log in during tests, ensure `test_settings.py` is using `LocMemCache` for sessions (already configured in staging).
- **Missing Tables**: If you see `no such table: reviews`, run `python manage.py migrate hostels`.

## 6. Running Automated Tests

To run the full backend test suite:
```bash
python manage.py test --settings=rumi.test_settings
```

To run frontend type checks:
```bash
# In frontend/ directory
pnpm run typecheck
```
