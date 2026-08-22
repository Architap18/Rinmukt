import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  calculateEffectiveAnnualCost,
  calculateMonthlyBleed,
  calculateFinancialUrgency,
  calculateRelationalUrgency,
} from '../src/lib/debtMath';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Karza Untangler database...');

  // 1. Create or reset demo user
  const demoEmail = 'demo@karza.in';
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.paymentLog.deleteMany({});
  await prisma.paymentPlan.deleteMany({});
  await prisma.debt.deleteMany({});
  await prisma.user.deleteMany({ where: { email: demoEmail } });

  const demoUser = await prisma.user.create({
    data: {
      name: 'Ramesh Kumar',
      email: demoEmail,
      phone: '+91 98765 43210',
      passwordHash,
      monthlyIncome: 35000.0,
      monthlySurplus: 4500.0,
      selectedStrategy: 'avalanche',
    },
  });

  console.log(`Created Demo User: ${demoUser.email} (ID: ${demoUser.id})`);

  // 2. Define 5 varied informal debts covering all interest types
  const exampleDebts = [
    {
      lenderName: 'Sahukar Moneylender',
      lenderType: 'moneylender',
      principalAmount: 10000,
      remainingBalance: 10000,
      interestDescription: 'Moneylender se 10000 liya 5% per month, har mahine ₹500 byaj dena hai',
      interestType: 'flat_monthly',
      interestRate: 5.0, // 5% per month flat
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
      durationMonths: 12,
      repaymentExpectation: 'Pay ₹500 interest every month; principal due whenever possible',
      socialWeight: 'low',
    },
    {
      lenderName: 'KreditBee BNPL App',
      lenderType: 'bnpl',
      principalAmount: 8000,
      remainingBalance: 8000,
      interestDescription: 'BNPL app 8000 balance 3% monthly compound',
      interestType: 'compound_monthly',
      interestRate: 3.0, // 3% compound monthly
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      durationMonths: 12,
      repaymentExpectation: 'Late fees compounding monthly on active app balance',
      socialWeight: 'low',
    },
    {
      lenderName: 'Gupta Kirana Store',
      lenderType: 'shopkeeper',
      principalAmount: 3500,
      remainingBalance: 3500,
      interestDescription: 'Kirana store 3500 udhar 10% one-time flat fee',
      interestType: 'one_time_flat',
      interestRate: 10.0, // 10% flat fee over 6 months
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      durationMonths: 6,
      repaymentExpectation: 'Udhar for daily groceries, pay when next harvest/wage arrives',
      socialWeight: 'medium',
    },
    {
      lenderName: 'Chacha (Ramesh Uncle)',
      lenderType: 'relative',
      principalAmount: 15000,
      remainingBalance: 15000,
      interestDescription: 'Chacha se 15000 liye hospital ke liye, koi interest nahi',
      interestType: 'none',
      interestRate: 0.0,
      startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
      durationMonths: 12,
      repaymentExpectation: 'Borrowed for hospital emergency. No interest, return when able.',
      socialWeight: 'high',
    },
    {
      lenderName: 'Local Chit Fund Committee',
      lenderType: 'chit_fund',
      principalAmount: 20000,
      remainingBalance: 18000,
      interestDescription: 'Local committee 20000 bishi 2% monthly',
      interestType: 'flat_monthly',
      interestRate: 2.0,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 1.5 months ago
      durationMonths: 12,
      repaymentExpectation: 'Monthly auction pool installment',
      socialWeight: 'medium',
    },
  ];

  for (const debt of exampleDebts) {
    const eac = calculateEffectiveAnnualCost(debt.remainingBalance, debt.interestType, debt.interestRate, debt.durationMonths);
    const bleed = calculateMonthlyBleed(debt.remainingBalance, debt.interestType, debt.interestRate, debt.durationMonths);
    const financialUrgency = calculateFinancialUrgency(eac, bleed);
    const relationalUrgency = calculateRelationalUrgency(debt.socialWeight, debt.repaymentExpectation, debt.startDate);

    const created = await prisma.debt.create({
      data: {
        userId: demoUser.id,
        lenderName: debt.lenderName,
        lenderType: debt.lenderType,
        principalAmount: debt.principalAmount,
        remainingBalance: debt.remainingBalance,
        interestDescription: debt.interestDescription,
        interestType: debt.interestType,
        interestRate: debt.interestRate,
        startDate: debt.startDate,
        durationMonths: debt.durationMonths,
        repaymentExpectation: debt.repaymentExpectation,
        socialWeight: debt.socialWeight,
        effectiveAnnualCost: eac,
        monthlyBleed: bleed,
        urgencyTier: financialUrgency,
        financialUrgency,
        relationalUrgency,
        status: 'active',
      },
    });

    console.log(`Created Debt: ${created.lenderName} | EAC: ${created.effectiveAnnualCost}% | FinUrgency: ${created.financialUrgency} | RelUrgency: ${created.relationalUrgency}`);
  }

  // Create an initial payment log for Chit Fund
  const chitFund = await prisma.debt.findFirst({ where: { userId: demoUser.id, lenderName: { contains: 'Chit Fund' } } });
  if (chitFund) {
    await prisma.paymentLog.create({
      data: {
        debtId: chitFund.id,
        amountPaid: 2000,
        notes: 'Initial monthly chit committee installment paid',
      },
    });
  }

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
