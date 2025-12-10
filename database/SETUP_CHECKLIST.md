# TUPConnect Setup Checklist

Quick checklist for setting up your TUPConnect accounts.

---

## ✅ Admin Account Setup

- [ ] **Step 1:** Go to Supabase Dashboard → Authentication → Users
- [ ] **Step 2:** Check if user `veliganioandrian@gmail.com` exists
  - If not, click "Add User" and create with password: `123456`
- [ ] **Step 3:** Run this SQL (auto-finds user by email):

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'veliganioandrian@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

- [ ] **Step 4:** Test login at `components/login.html`:
  - Select "Administrator"
  - Email: `veliganioandrian@gmail.com`
  - Password: `123456`

---

## ✅ Organization Setup

- [ ] **Step 1:** Run `database/quick_setup.sql` in Supabase SQL Editor
- [ ] **Step 2:** Copy the organization IDs from the query result
- [ ] **Step 3:** Verify organizations appear in Admin Portal

---

## ✅ Organization Officer Account (For Testing)

- [ ] **Step 1:** Go to Supabase Dashboard → Authentication → Users
- [ ] **Step 2:** Click "Invite User" and enter org email (e.g., `gdg@tup.edu.ph`)
- [ ] **Step 3:** Check email and complete account setup (set password)
- [ ] **Step 4:** Copy the Org Officer User UUID
- [ ] **Step 5:** Run this SQL (replace both UUIDs):

```sql
-- Replace YOUR_ORG_OFFICER_UUID and YOUR_ORGANIZATION_ID
INSERT INTO user_roles (user_id, organization_id, role)
VALUES ('YOUR_ORG_OFFICER_UUID', 'YOUR_ORGANIZATION_ID', 'org_officer')
ON CONFLICT (user_id) DO UPDATE 
SET organization_id = EXCLUDED.organization_id, role = 'org_officer';

UPDATE organizations
SET account_status = 'Account Activated'
WHERE id = 'YOUR_ORGANIZATION_ID';
```

- [ ] **Step 6:** Test login at `components/login.html` (select "Organization" → "Login to Existing Account")

---

## 🔍 Verification

Run this to verify everything is set up correctly:

```sql
SELECT 
  ur.role,
  au.email,
  o.name as organization_name,
  o.account_status
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN organizations o ON ur.organization_id = o.id
ORDER BY ur.role, o.name;
```

You should see:
- ✅ 1 admin user
- ✅ 1+ org_officer users
- ✅ Organizations linked to officers

---

## 📚 Full Documentation

See `database/SETUP_GUIDE.md` for detailed instructions and troubleshooting.

