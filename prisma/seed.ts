import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateEffectiveAnnualCost, calculateMonthlyBleed, calculateUrgencyTier } from '../src/lib/debtMath';

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
      monthlySurplus: 4500.0,
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
      interestType: 'flat_monthly',
      interestRate: 5.0, // 5% per month flat
      durationMonths: 12,
      repaymentExpectation: 'Pay ₹500 interest every month; principal due whenever possible',
      socialWeight: 'low',
    },
    {
      lenderName: 'KreditBee BNPL App',
      lenderType: 'bnpl',
      principalAmount: 8000,
      remainingBalance: 8000,
      interestType: 'compound_monthly',
      interestRate: 3.0, // 3% compound monthly
      durationMonths: 12,
      repaymentExpectation: 'Late fees compounding monthly on active app balance',
      socialWeight: 'low',
    },
    {
      lenderName: 'Gupta Kirana Store',
      lenderType: 'shopkeeper',
      principalAmount: 3500,
      remainingBalance: 3500,
      interestType: 'one_time_flat',
      interestRate: 10.0, // 10% flat fee over 6 months
      durationMonths: 6,
      repaymentExpectation: 'Udhar for daily groceries, pay when next harvest/wage arrives',
      socialWeight: 'medium',
    },
    {
      lenderName: 'Chacha (Ramesh Uncle)',
      lenderType: 'relative',
      principalAmount: 15000,
      remainingBalance: 15000,
      interestType: 'none',
      interestRate: 0.0,
      durationMonths: 12,
      repaymentExpectation: 'Borrowed for hospital emergency. No interest, return when able.',
      socialWeight: 'high',
    },
    {
      lenderName: 'Local Chit Fund Committee',
      lenderType: 'chit_fund',
      principalAmount: 20000,
      remainingBalance: 18000,
      interestType: 'flat_monthly',
      interestRate: 2.0,
      durationMonths: 12,
      repaymentExpectation: 'Monthly auction pool installment',
      socialWeight: 'medium',
    },
  ];

  for (const debt of exampleDebts) {
    const eac = calculateEffectiveAnnualCost(debt.remainingBalance, debt.interestType, debt.interestRate, debt.durationMonths);
    const bleed = calculateMonthlyBleed(debt.remainingBalance, debt.interestType, debt.interestRate, debt.durationMonths);
    const urgency = calculateUrgencyTier(eac);

    const created = await prisma.debt.create({
      data: {
        userId: demoUser.id,
        lenderName: debt.lenderName,
        lenderType: debt.lenderType,
        principalAmount: debt.principalAmount,
        remainingBalance: debt.remainingBalance,
        interestType: debt.interestType,
        interestRate: debt.interestRate,
        durationMonths: debt.durationMonths,
        repaymentExpectation: debt.repaymentExpectation,
        socialWeight: debt.socialWeight,
        effectiveAnnualCost: eac,
        monthlyBleed: bleed,
        urgencyTier: urgency,
        status: 'active',
      },
    });

    console.log(`Created Debt: ${created.lenderName} | EAC: ${created.effectiveAnnualCost}% | Bleed: ₹${created.monthlyBleed}`);
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
