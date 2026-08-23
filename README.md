**Rinmukht**


Informal Debt Normalizer and Financial Health Engine.

Rinmukht is a lightweight financial health tool designed to help
borrowers understand and prioritize informal debt.

Many people do not deal with formal bank loans alone. They may owe money
to relatives, local shopkeepers, moneylenders, BNPL services, or other
informal lenders. These debts can have very different financial and
social consequences even when their face values look similar.

Rinmukht converts those different obligations into a comparable picture
using transparent debt mathematics, monthly interest burden, repayment
context, and relational urgency.

The goal is not simply to show "how much debt you have." The goal is to
answer:

Which debt is actually costing me the most?

How much money is leaving me every month because of interest?

Which debt should I prioritize?

Does a debt carry social or relationship pressure even if it has 0%
interest?

What happens to my debt after I make a payment?

Can I understand my financial situation without needing a complex
financial application?

Problem

Informal debt is often difficult to compare.

Consider these examples:

Debt                          Amount             Interest Context

Relative                   Rs. 5,000                   0% Family trust
and repayment
expectations

Local                      Rs. 2,500           1% monthly Household
shopkeeper                                                essentials
purchased on
credit

Moneylender               Rs. 15,000           5% monthly High recurring
financial
burden

A simple "largest debt first" approach can produce a poor repayment
strategy.

A smaller debt can have a much higher effective cost, while a
zero-interest family debt can still carry significant relational
importance.

Rinmukht addresses this by separating:

Financial urgency

Monthly interest burden

Effective annual cost

Relational urgency

Repayment status

Solution

Rinmukht provides a simple workflow:

Create Account
      |
      v
Add Your Debts
      |
      v
Normalize Debt Information
      |
      v
Calculate Financial Cost
      |
      v
Calculate Monthly Interest Bleed
      |
      v
Assess Financial + Relational Urgency
      |
      v
View Debt Dashboard
      |
      v
Choose a Repayment Strategy
      |
      v
Record Payments
      |
      v
Track Remaining Balance

The application is intentionally designed to be understandable rather
than intimidating.

Key Features

1. Client-Side Authentication

Rinmukht supports account creation and login without requiring a
database.

User credentials and session information are stored locally in the
browser.

Features include:

Sign up

Login

Logout

Duplicate email detection

Case-insensitive email handling

Session restoration after refresh

Per-user debt isolation

This makes the application easy to demonstrate and deploy without
provisioning a database.

2. No Database Required

The current application uses browser localStorage for user and debt
persistence.

This means:

No PostgreSQL setup is required

No Prisma database connection is required

No database hosting cost is required

The hackathon demo can run immediately

Vercel deployment does not require a database service

Data is kept locally in the user's browser.

Important limitation

This architecture is intended for a lightweight prototype and hackathon
demonstration.

Because data is stored in browser localStorage:

Data does not automatically synchronize between devices

Clearing browser storage removes locally stored application data

This is not a production-grade authentication system

Password storage is intended for this prototype architecture and
should be replaced with secure server-side authentication before
handling real financial accounts

The project intentionally prioritizes a zero-database, accessible
prototype for the hackathon.

3. Informal Debt Modeling

Each debt can contain information such as:

Lender name

Lender type

Principal amount

Remaining balance

Interest type

Interest rate

Start date

Duration

Repayment expectation

Social weight

Status

Payment history

Supported lender contexts can include:

Relatives

Shopkeepers

Moneylenders

BNPL services

Other informal lenders

This allows the application to represent real-world borrowing
relationships rather than treating every loan as a conventional bank
loan.

4. Effective Annual Cost

Rinmukht calculates an Effective Annual Cost (EAC) so that debts with
different interest structures can be compared on a common basis.

Instead of looking only at:

Interest Rate = 5%

the application evaluates the actual cost structure of the debt.

This helps users understand that:

5% monthly

is very different from:

5% annually

and that different interest models should not be compared purely by
their displayed percentage.

The calculation is deterministic and implemented in the application's
debt mathematics layer.

5. Monthly Interest Bleed

Rinmukht calculates the estimated monthly financial burden created by
interest.

For example:

Remaining balance = Rs. 15,000
Monthly flat interest = 5%

Monthly interest bleed
= 15,000 x 5%
= Rs. 750

This gives the borrower a much more tangible metric:

"How much money is this debt costing me every month?"

This is often easier to understand than an annual percentage.

6. Financial Urgency

The application evaluates the financial cost of a debt using derived
metrics such as:

Effective annual cost

Monthly interest bleed

This produces a financial urgency classification.

The objective is to help users identify expensive debt instead of
automatically prioritizing the largest balance.

7. Relational Urgency

Not every important debt is expensive in purely financial terms.

For example:

Borrowed from a family member
Interest = 0%
Amount = Rs. 5,000

Financial urgency may be low.

However, the relationship can still matter.

Rinmukht therefore considers contextual information such as:

Social weight

Repayment expectation

Time since borrowing

This creates a separate relational urgency signal.

The system can therefore distinguish:

Financially expensive

from:

Socially important

This is a central part of Rinmukht's approach to informal debt.

8. Debt Dashboard

The dashboard provides a consolidated view of the borrower's financial
situation.

The interface is designed around understandable financial information
rather than complicated financial terminology.

Users can review:

Total outstanding debt

Individual debts

Interest burden

Urgency

Repayment progress

Debt status

9. Debt Management

Users can:

Add a debt

View a debt

Edit a debt

Delete a debt

Clear all debts

Record payments

View payment history

When a payment is recorded, the application updates:

Remaining Balance
Payment History
Debt Status
Updated Debt Calculations

When the remaining balance reaches zero, the debt is marked as:

paid_off

10. Multi-User Isolation

Even though the application does not use a database, debt data is still
separated by user ID.

Conceptually:

User A
  |
  +-- Debt A1
  +-- Debt A2

User B
  |
  +-- Debt B1
  +-- Debt B2

User A cannot retrieve User B's debts through the application's local
storage functions.

This behavior is covered by automated tests.

11. Multilingual Accessibility

Rinmukht is designed for users who may be more comfortable with regional
Indian languages.

The interface includes multilingual support through the language
context.

The project is intended to support accessible financial explanations in
languages such as:

English

Hindi

Marathi

The architecture is designed so that additional languages can be added
without rewriting the entire application.

The goal is to make financial concepts understandable to users who may
not be comfortable with English-heavy financial terminology.

12. AI-Assisted Explanations

Rinmukht can optionally integrate Gemini-powered explanations for
financial and debt-related content.

The AI layer is intended to make complex financial information easier to
understand.

For example, instead of only displaying:

Effective Annual Cost: 79.6%

the application can provide a simpler explanation of what that number
means and why the debt may deserve attention.

The AI functionality is optional. Core debt calculations remain
deterministic so that important financial values do not depend on an AI
model response.

13. Voice-Oriented Accessibility

The project includes components for voice input and voice explanation
playback.

These features are intended to reduce dependence on reading-heavy
interfaces and make the application easier to use for people with
different literacy and accessibility needs.

Repayment Strategy

Rinmukht can support a repayment strategy such as an avalanche-style
approach.

The basic idea is:

1. Identify expensive debt
2. Prioritize high-cost obligations
3. Continue minimum/expected payments elsewhere
4. Direct additional available money toward the priority debt
5. Repeat after the debt is cleared

The application combines financial urgency with contextual information
instead of blindly sorting by principal amount.

Technology Stack

Frontend

Next.js 14

React

TypeScript

Tailwind CSS

State and Persistence

React Context

Browser localStorage

Financial Logic

TypeScript

Deterministic debt calculation functions

Testing

Vitest

AI / Optional Services

Google Gemini API for optional explanations and voice-oriented
functionality

Deployment

Vercel

GitHub

Project Structure

Rinmukt/
|
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── explain/
│   │   │   └── extract/
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── debts/
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── page.tsx
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   │
│   │   ├── plan/
│   │   │   └── page.tsx
│   │   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── AddDebtModal.tsx
│   │   ├── ClarificationModal.tsx
│   │   ├── DebtWeb.tsx
│   │   ├── Navbar.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── TrustNotice.tsx
│   │   ├── UntangleKnotVisual.tsx
│   │   ├── UrgencyBadge.tsx
│   │   ├── VoiceExplanationPlayer.tsx
│   │   └── VoiceInput.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   │
│   └── lib/
│       ├── localStorage.ts
│       ├── debtMath.ts
│       ├── explanationService.ts
│       └── llmExtraction.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── package.json
├── package-lock.json
└── README.md

The current application runtime does not require PostgreSQL or Prisma
for authentication or debt persistence.

Core Data Flow

Authentication

Signup Form
     |
     v
registerUser()
     |
     v
localStorage
     |
     v
Session
     |
     v
AuthContext
     |
     v
Dashboard

Login

Login Form
     |
     v
authenticateUser()
     |
     v
Validate local credentials
     |
     v
setSession()
     |
     v
AuthContext
     |
     v
Dashboard

Debt Creation

Add Debt
   |
   v
addDebt()
   |
   +--> Effective Annual Cost
   |
   +--> Monthly Interest Bleed
   |
   +--> Financial Urgency
   |
   +--> Relational Urgency
   |
   v
Save to localStorage
   |
   v
Dashboard

Payment

Payment
   |
   v
addPayment()
   |
   v
Remaining Balance
   |
   +--> Payment Log
   |
   +--> Updated Status
   |
   +--> Updated Debt Calculations
   |
   v
localStorage

Testing

The project includes automated tests covering the core deterministic
logic.

Run:

npm run test

The current test suite covers:

Authentication

User registration

Duplicate registration prevention

Valid login

Invalid password

Invalid email

Case-insensitive email handling

Session persistence

Debt Management

New users start with zero debts

Debt creation

Debt calculations

Monthly interest bleed

Per-user debt isolation

Payments

Payment recording

Balance updates

Full debt clearance

Overpayment rejection

Zero-payment rejection

Debt Operations

Debt deletion

Missing debt handling

Clearing debts

User-specific debt clearing

The current test suite passes:

3 test files
58 tests
58 passed

Production Build

Before deployment, run:

npm run test

Then:

npm run build

The production build should complete successfully before deployment.

Local Development

1. Clone the repository

git clone <your-repository-url>
cd Karza-Untangler

2. Install dependencies

npm install

3. Configure environment variables

Create:

.env.local

Optional AI configuration can be added according to the environment
variable expected by the application.

The core localStorage-based authentication and debt-management
functionality does not require a database connection.

4. Start development server

npm run dev

Open:

http://localhost:3000

Environment Variables

The application is designed so that the core application can run without
a database.

Optional AI functionality can use:

GEMINI_API_KEY=your-gemini-api-key

Do not commit real API keys to GitHub.

Use .env.local for local development and configure production secrets
through the deployment platform.

Deployment

Rinmukht can be deployed to Vercel.

Basic flow:

GitHub Repository
       |
       v
Vercel
       |
       v
Next.js Production Build
       |
       v
Rinmukht

Before deploying:

npm run test
npm run build

Then push the project:

git add .
git commit -m "Prepare production deployment"
git push origin main

If the GitHub repository is connected to Vercel, the new commit can
trigger a production deployment.

Why No Database?

The hackathon version intentionally avoids database dependency.

This makes the project:

Faster to set up

Easier to demonstrate

Easier to deploy

Less dependent on external infrastructure

Suitable for an offline-first prototype

More accessible for a hackathon judging environment

A future production version can migrate persistence to a secure backend
while keeping the same frontend data model and debt calculation layer.

Privacy and Trust

Financial data is highly sensitive.

The current prototype therefore keeps core debt data in the user's
browser instead of transmitting it to a database.

The application also keeps the important mathematical calculations
deterministic.

This creates a clear separation:

Sensitive user data
        |
        v
Local browser storage

Deterministic financial calculations
        |
        v
Application logic

Optional AI explanation
        |
        v
Only when AI functionality is used

For a production financial application, additional security, encryption,
server-side authentication, secure password hashing, audit logging, and
regulatory/privacy review would be required.

Accessibility and Design Principles

Rinmukht is designed around the following principles:

Simple language

Avoid unnecessary financial jargon.

Clear hierarchy

Users should quickly understand:

What I owe
        |
How much it costs
        |
What needs attention
        |
What I can do next

Low cognitive load

The interface avoids requiring users to understand complex financial
systems before using the application.

Regional language support

Financial information should be understandable in the user's preferred
language.

Transparent calculations

Important financial metrics should be explainable and reproducible.

Human context

Informal debt is not purely mathematical. Family relationships, trust,
expectations, and social pressure can influence repayment priorities.

Hackathon Value Proposition

Rinmukht is different from a conventional expense tracker because it
focuses specifically on the complexity of informal debt.

A traditional expense application might answer:

"How much did you spend?"

Rinmukht asks:

"What does each debt actually cost you, which debt needs attention
first, and what financial or social consequences come with it?"

The project combines:

Informal debt normalization

Deterministic financial mathematics

Monthly interest burden

Effective annual cost

Financial urgency

Relational urgency

Local-first persistence

Multilingual accessibility

Optional AI explanations

Voice-oriented accessibility

Payment tracking

Repayment planning

This combination is designed around the real-world experience of
borrowers rather than conventional banking assumptions.

Future Scope

The prototype can be extended with:

Secure cloud synchronization

Move from browser-only storage to an encrypted backend.

Secure authentication

Use server-side authentication with properly salted password hashing and
secure session management.

Cross-device access

Allow users to access their debt information from multiple devices.

SMS and WhatsApp reminders

Provide repayment reminders through channels that users already use.

Offline-first PWA

Allow users to use the application in areas with unreliable
connectivity.

Financial education

Add short explanations about:

Interest

Compound interest

Debt traps

Repayment strategies

Credit

Informal lending

Community resources

Connect users to relevant financial assistance and public resources.

Better regional-language support

Expand beyond the current language architecture to additional Indian
languages.

Team / Hackathon

Project Name

Rinmukht

Category

Financial Inclusion / Public Good / Accessibility

Core Problem

Helping people understand and prioritize informal debt.

Core Innovation

Normalizing different informal debt obligations using both financial and
relational dimensions.

Primary Users

Borrowers dealing with:

Family loans

Shop credit

Moneylenders

BNPL

Other informal borrowing

Primary Outcome

Give users a clearer, simpler answer to:

"What should I repay first, and why?"

Demo Flow for Judges

A recommended demonstration sequence is:

Step 1: Create an account

Show the simple signup experience.

Step 2: Add multiple types of debt

Add examples such as:

Relative       Rs. 5,000    0%
Shopkeeper     Rs. 2,500    1% monthly
Moneylender    Rs. 15,000   5% monthly
BNPL           Rs. 8,000    2% monthly compound

Step 3: Open the dashboard

Show how the debts are normalized.

Step 4: Explain the difference

Point out that the largest debt is not necessarily the most expensive
debt.

Step 5: Show monthly bleed

Demonstrate how recurring interest creates a monthly financial burden.

Step 6: Show relational urgency

Explain why a zero-interest family debt can still matter.

Step 7: Record a payment

Make a payment and show:

Old balance
    ->
Payment
    ->
New balance
    ->
Updated debt status

Step 8: Refresh

Demonstrate that localStorage persistence keeps the user's data
available.

Step 9: Explain the no-database architecture

Highlight that the hackathon demo does not require PostgreSQL or a
database server.


Acknowledgements

Built as a hackathon project focused on financial inclusion,
accessibility, and understandable debt management.
