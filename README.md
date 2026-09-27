# Budgeting Web — BID Accounts

Web version starter based on `Budgeting 2.0.xlsx`.

## Included
- Authorized-only Budget ID login (`BID0001`, `BID0002`, ...)
- Firebase Authentication + Firestore structure
- Separate user data model
- Dashboard inspired by the workbook: income, spend, remaining, savings, Needs/Wants/Savings breakdown, transactions and savings goals
- Admin-only callable functions for account creation and account suspension
- Firestore rules that isolate each user's data
- Responsive mobile UI

## Firebase setup
1. Create a Firebase project and Web App.
2. Copy the Web App config into `public/firebase-config.js`.
3. Enable Email/Password Authentication.
4. Create Firestore Database.
5. Install Firebase CLI and run `firebase login` then `firebase use <project-id>`.
6. Deploy with `firebase deploy`.
7. Bootstrap your first administrator using Firebase Auth, then assign the `admin:true` custom claim using a trusted server/admin workflow.

## Important
The frontend deliberately does not create accounts or expose public registration. Account creation is designed to go through the secured `createBudgetUser` callable function. The final password is never stored in Firestore; Firebase Authentication stores it.

The current UI is a safe first web build. Transaction/goal write operations should be connected through secured Firebase callable functions before production use.

## Admin portal
- Admin portal URL: `/admin.html`
- Admin sign-in uses Firebase Authentication email/password.
- Access is granted only when the signed-in Firebase user has the `admin: true` custom claim.
- To bootstrap the first admin, create the admin user in Firebase Authentication, then run the trusted `functions/set-admin.js` script with a service-account credential. Do not put the service-account JSON or credentials in `public/` or commit them to GitHub.
- After the claim is assigned, sign out and sign back in to refresh the ID token.

## Budgeting Admin Portal

- Client portal: `/`
- Admin portal: `/admin.html`
- Admins must have the Firebase `admin` custom claim.
- Admin creates a client with a Budget ID and temporary password.
- Client signs in using the Budget ID and temporary password, then must choose a private password.
- Client final passwords are never stored in Firestore.
- New client Firebase Auth identities use a synthetic internal sign-in email derived from the Budget ID; the client's real email is stored only as contact information.
