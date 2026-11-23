# Gaming Backend Infrastructure

A backend engineering project demonstrating secure game-score processing,
leaderboard management, payment integration and server-side validation
using Firebase Cloud Functions, Cloud Firestore and Node.js.

## Project Overview

This project explores backend infrastructure for a multiplayer gaming
platform, with particular emphasis on:

- Game-session validation
- Score integrity and anti-cheat safeguards
- Daily scoring limits
- Weekly leaderboards
- Audit logging
- Payment processing
- Webhook security
- Duplicate transaction prevention

The implementation is being developed in independent modules to
encourage maintainability, testability and separation of concerns.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| JavaScript | Application development |
| Firebase Cloud Functions | Serverless backend execution |
| Cloud Firestore | NoSQL database |
| Firebase Authentication | Player identity |
| Paystack | Payment processing |
| Node.js Test Runner | Automated unit testing |

## Current Development Progress

### 1. Score Validation

Status: Implemented

File:

`functions/src/scoring/scoreValidation.js`

Capabilities:

- Validates submitted scores.
- Rejects negative and invalid score values.
- Checks maximum achievable scores.
- Applies remaining daily scoring allowances.
- Identifies impossible score gains.

### 2. Error Handling

Status: Implemented

File:

`functions/src/utils/errors.js`

Capabilities:

- Standardised application errors.
- Reusable error codes.
- Safe error normalisation.
- Consistent error response formatting.

### 3. Score Processing Service

Status: Initial implementation

File:

`functions/src/scoring/submitScore.js`

Planned responsibilities:

- Validate player identity.
- Verify game sessions.
- Calculate session duration using trusted timestamps.
- Prevent duplicate score submissions.
- Apply daily scoring limits.
- Update weekly leaderboard totals.
- Record score submission audit logs.

The service uses dependency injection so its business logic can
be tested independently of Firebase initialisation.

### 4. Automated Tests

Status: Initial unit tests added

File:

`functions/src/scoring/scoreValidation.test.js`

The current tests cover:

- Valid score submissions.
- Impossible score gains.
- Daily scoring limits.
- Invalid scores.
- Invalid session durations.

Firestore integration tests will be added using the Firebase Emulator Suite.

## Planned Architecture

```text
gaming-backend/
│
├── functions/
│   └── src/
│       ├── scoring/
│       │   ├── scoreValidation.js
│       │   ├── submitScore.js
│       │   └── scoreValidation.test.js
│       │
│       ├── payments/
│       │   ├── paystackWebhook.js
│       │   └── paymentValidation.js
│       │
│       ├── utils/
│       │   └── errors.js
│       │
│       └── index.js
│
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .env.example
└── README.md
