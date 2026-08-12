# S7 — Final Student + Parent Regression

## Admin setup
- [ ] Create student account
- [ ] Assign student to a batch
- [ ] Create parent account
- [ ] Link parent to the student
- [ ] Ensure the batch has a timetable entry
- [ ] Ensure study material exists
- [ ] Ensure homework exists
- [ ] Ensure attendance exists

## Student workflow
- [ ] Login with valid credentials
- [ ] Close and reopen browser; session restores
- [ ] Student dashboard loads
- [ ] Timetable shows classes inherited from the assigned batch
- [ ] Study materials are visible
- [ ] Material download succeeds
- [ ] Homework is visible
- [ ] Attendance is visible
- [ ] Logout succeeds
- [ ] Login again succeeds
- [ ] Timetable/materials/homework/attendance still work

## Parent workflow
- [ ] Login with valid credentials
- [ ] Close and reopen browser; session restores
- [ ] Linked child profile loads
- [ ] Timetable matches the child's batch
- [ ] Attendance is visible
- [ ] Homework is visible
- [ ] Study materials are visible
- [ ] Logout succeeds
- [ ] Login again succeeds
- [ ] Child data remains available after re-login

## Invalid-access tests
- [ ] Student A cannot read Student B data
- [ ] Student A cannot read Student B timetable
- [ ] Student A cannot read Student B attendance/homework/materials
- [ ] Parent A cannot read Parent B's child
- [ ] Parent cannot modify student data
- [ ] Parent cannot access teacher functionality
- [ ] Parent cannot access admin functionality
- [ ] Removing the parent-child link removes parent access
- [ ] Disabled student account is rejected at login
- [ ] Disabled parent account is rejected at login

# S8 — Final Production Gate

The release is considered complete only when every gate is green:

1. Code implementation complete
2. Supabase schema/RLS verified
3. GitHub commit present on main
4. CI passes
5. Production Check passes
6. GitHub Pages/Vercel deployment passes
7. Live Student regression passes
8. Live Parent regression passes
9. Invalid-access/RLS regression passes

A green build alone is not sufficient to declare S7/S8 complete. Live workflow and database authorization checks are required.
