# Rinmukht

### Informal Debt Normalizer & Financial Health Engine

**Live Demo:** https://rinmukt-theta.vercel.app/

Rinmukht is a lightweight financial health tool that helps people **understand, compare, and prioritize informal debt**.

Informal borrowing—such as money borrowed from relatives, shopkeepers, moneylenders, or BNPL services—often follows different interest rules and repayment expectations. Rinmukht converts these obligations into a **clear, comparable financial picture** while also considering the social context behind a debt.

> **Rinmukht answers one key question:**
> **“What should I repay first, and why?”**

---

## 🚨 Problem

Informal debts cannot always be prioritized by simply looking at the largest balance.

For example:

| Debt        |  Amount |   Interest | Context             |
| ----------- | ------: | ---------: | ------------------- |
| Relative    |  ₹5,000 |         0% | Family relationship |
| Shopkeeper  |  ₹2,500 | 1% / month | Household credit    |
| Moneylender | ₹15,000 | 5% / month | High recurring cost |

A smaller debt can create a much larger financial burden, while a zero-interest family debt may still carry significant social importance.

Rinmukht separates:

* 💰 **Financial urgency**
* 📈 **Effective annual cost**
* 🔥 **Monthly interest burden**
* 🤝 **Relational urgency**
* 💳 **Repayment progress**

---

## 💡 Solution

Rinmukht follows a simple workflow:

**Add Debts → Normalize → Calculate Cost → Assess Urgency → Plan Repayment → Track Payments**

The system combines deterministic financial calculations with contextual information to provide a more meaningful repayment priority.

---

## ✨ Key Features

### 📊 Debt Normalization

Supports different debt structures and interest conventions, making otherwise incomparable debts easier to evaluate.

### 💸 Effective Annual Cost

Converts different interest structures into a comparable annualized cost.

### 🔥 Monthly Interest Bleed

Shows how much interest a debt is costing approximately each month.

For example:

`₹15,000 × 5% = ₹750/month`

### ⚠️ Financial Urgency

Ranks debts using financial cost rather than simply prioritizing the largest balance.

### 🤝 Relational Urgency

Considers factors such as social weight, repayment expectations, and time since borrowing.

This allows Rinmukht to distinguish between:

**Financially expensive** vs **Socially important**

### 💳 Payment Tracking

Users can record payments and automatically update:

* Remaining balance
* Payment history
* Debt status
* Debt calculations

### 🌐 Multilingual Support

The interface supports:

* English
* Hindi
* Marathi

### 🤖 AI-Assisted Explanations

Optional Gemini integration can explain financial metrics in simpler language.

Core financial calculations remain **deterministic and independent of AI**.

### 🎙️ Voice Accessibility

Voice input and explanation playback components reduce dependence on text-heavy interfaces.

### 🔐 Local-First Architecture

The prototype stores authentication and debt data in browser `localStorage`, allowing the application to run without a database.

---

## 🧮 Repayment Strategy

Rinmukht supports an **avalanche-style repayment approach**:

1. Identify high-cost debt
2. Continue expected payments on other debts
3. Direct additional funds toward the priority debt
4. Clear it
5. Recalculate and repeat

The system combines financial urgency with relational context instead of blindly sorting by debt amount.

---

## 🛠️ Tech Stack

**Frontend**

* Next.js 14
* React
* TypeScript
* Tailwind CSS

**State & Persistence**

* React Context
* Browser localStorage

**Financial Logic**

* TypeScript
* Deterministic debt calculation functions

**AI**

* Google Gemini API

**Testing**

* Vitest

**Deployment**

* Vercel
* GitHub

---

## 🏗️ Architecture

```text
User
 │
 ├── Authentication
 │      └── localStorage
 │
 ├── Debt Management
 │      ├── Debt Creation
 │      ├── Payments
 │      └── Payment History
 │
 ├── Debt Mathematics
 │      ├── Effective Annual Cost
 │      ├── Monthly Interest Bleed
 │      ├── Financial Urgency
 │      └── Relational Urgency
 │
 ├── Dashboard
 │      └── Repayment Priorities
 │
 └── Optional AI Layer
        └── Financial Explanations
```

---

## 🧪 Testing

The project includes automated tests for core authentication, debt calculations, payments, and user-data isolation.

Run:

```bash
npm run test
```

Build for production:

```bash
npm run build
```

---

## 🚀 Run Locally

```bash
git clone https://github.com/Architap18/Rinmukt.git
cd Rinmukt
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### Optional AI Configuration

Create `.env.local`:

```env
GEMINI_API_KEY=your-gemini-api-key
```

Never commit real API keys to GitHub.

---

## 🔒 Privacy & Limitations

Rinmukht's hackathon version intentionally uses browser-based storage instead of a database.

This provides:

* Zero database setup
* Simple deployment
* Local-first data storage
* Fast hackathon demonstration

However, it also means data does not automatically synchronize between devices, and clearing browser storage can remove locally stored data.

This is a **prototype architecture**, not production-grade financial authentication.

A production version would require secure server-side authentication, password hashing, encryption, secure sessions, and stronger data protection.

---

## 🏆 Why Rinmukht?

Unlike a conventional expense tracker, Rinmukht focuses specifically on the complexity of **informal debt**.

Traditional financial apps ask:

> “How much did you spend?”

Rinmukht asks:

> **“What does each debt actually cost, which one needs attention first, and why?”**

The project combines:

**Debt Normalization + Financial Mathematics + Social Context + AI Assistance + Accessibility**

to make informal debt easier to understand and act upon.

---

## 🔮 Future Scope

* Secure cloud synchronization
* Cross-device access
* Production-grade authentication
* SMS / WhatsApp repayment reminders
* Offline-first PWA
* Expanded Indian-language support
* Financial education
* Community and financial-assistance resources

---

## 👥 Hackathon

**Project:** Rinmukht
**Category:** Financial Inclusion / Public Good / Accessibility

**Core Problem:** Helping people understand and prioritize informal debt.

**Core Innovation:** Comparing informal debt using both **financial and relational dimensions**.

**Primary Outcome:**

> **Give borrowers a clearer answer to: “What should I repay first, and why?”**

---

## 📌 Demo

**Live:** https://rinmukt-theta.vercel.app/

Built for a hackathon with a focus on **financial inclusion, accessibility, and understandable debt management.**
