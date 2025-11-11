const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// --- Configuration ---
const USER_COUNTS = {
  regular: 10,
  cashier: 5,
  manager: 3,
  superuser: 2,
};
const PROMOTION_COUNT = 15;
const EVENT_COUNT = 10;
const TRANSACTION_COUNT = 200;
const DEFAULT_PASSWORD = 'password123';
// ---------------------

async function main() {
  console.log('Starting the seeding process...');

  // 1. Clean up existing data
  console.log('Cleaning database...');
  await prisma.transaction.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database cleaned.');

  // 2. Create Users
  console.log('Creating users...');
  const users = [];

  // Create the specific 'adam' superuser
  console.log("Creating 'adam' superuser...");
  const adamPassword = await bcrypt.hash('1234', 10);
  const adamUser = await prisma.user.create({
    data: {
      utorid: 'adam',
      name: 'Adam Sterling',
      email: 'adam.sterling@utoronto.ca',
      password: adamPassword,
      role: 'superuser',
      verified: true,
      points: 5000,
    },
  });
  users.push(adamUser);
  console.log("'adam' superuser created.");

  // Create a specific suspicious cashier
  console.log("Creating 'suspicious_cashier' user...");
  const suspiciousCashierPassword = await bcrypt.hash('password123', 10);
  const suspiciousCashier = await prisma.user.create({
    data: {
      utorid: 'suspicious_cashier',
      name: 'Suspicious Sam',
      email: 'sam.suspicious@utoronto.ca',
      password: suspiciousCashierPassword,
      role: 'cashier',
      verified: true,
      suspicious: true, // Mark this user as suspicious
      points: 0,
    },
  });
  users.push(suspiciousCashier);
  console.log("'suspicious_cashier' user created.");

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  for (const role of ['superuser', 'manager', 'cashier', 'regular']) {
    for (let i = 0; i < USER_COUNTS[role]; i++) {
      const user = await prisma.user.create({
        data: {
          utorid: faker.string.alphanumeric(8).toLowerCase() + i,
          name: faker.person.fullName(),
          email: faker.internet.email({ provider: 'utoronto.ca' }),
          password: hashedPassword,
          role: role,
          verified: true,
          points: faker.number.int({ min: 100, max: 5000 }),
        },
      });
      users.push(user);
      console.log(`Created ${role} user: ${user.name}`);
    }
  }

  const superusers = users.filter(u => u.role === 'superuser');
  const managers = users.filter(u => u.role === 'manager');
  const cashiers = users.filter(u => u.role === 'cashier');
  const regularUsers = users.filter(u => u.role === 'regular');

  // 3. Create Promotions
  console.log('Creating promotions...');
  const promotions = [];
  for (let i = 0; i < PROMOTION_COUNT; i++) {
    const promo = await prisma.promotion.create({
      data: {
        name: faker.commerce.productName() + ' Sale',
        description: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(['one-time', 'fixed', 'percentage']),
        minSpending: faker.helpers.maybe(() => faker.number.int({ min: 10, max: 50 }), { probability: 0.7 }),
        rate: faker.helpers.maybe(() => faker.number.float({ min: 0.05, max: 0.2, multipleOf: 0.01 })),
        points: faker.helpers.maybe(() => faker.number.int({ min: 50, max: 500 })),
        startTime: faker.date.past({ years: 1 }),
        endTime: faker.date.future({ years: 1 }),
      },
    });
    promotions.push(promo);
    console.log(`Created promotion: ${promo.name}`);
  }

  // 4. Create Events
  console.log('Creating events...');
  const events = [];
  for (let i = 0; i < EVENT_COUNT; i++) {
    const organizer = faker.helpers.arrayElement([...managers, ...superusers]);
    const points = faker.number.int({ min: 100, max: 1000 });
    const event = await prisma.event.create({
      data: {
        name: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        location: faker.location.streetAddress(),
        startTime: faker.date.soon({ days: 30 }),
        endTime: faker.date.soon({ days: 32 }),
        capacity: faker.number.int({ min: 20, max: 100 }),
        points: points,
        pointsRemain: points,
        pointsAwarded: 0,
        published: true,
        organizers: {
          connect: { id: organizer.id },
        },
      },
    });
    events.push(event);
    console.log(`Created event: ${event.name}`);
  }

  // 5. Create Transactions
  console.log('Creating transactions...');
  for (let i = 0; i < TRANSACTION_COUNT; i++) {
    const transactionType = faker.helpers.arrayElement(['purchase', 'transfer', 'redemption']);
    const customer = faker.helpers.arrayElement(regularUsers);
    const createdBy = faker.helpers.arrayElement([...cashiers, ...managers]);

    if (transactionType === 'purchase') {
      const spent = faker.number.float({ min: 5, max: 200, multipleOf: 0.01 });
      const earned = Math.round(spent / 0.25); // Base points
      await prisma.transaction.create({
        data: {
          utorid: customer.utorid,
          type: 'purchase',
          spent,
          earned,
          createdBy: createdBy.utorid,
          remark: faker.lorem.sentence(),
        },
      });
    } else if (transactionType === 'transfer' && regularUsers.length > 1) {
      let recipient = faker.helpers.arrayElement(regularUsers);
      while (recipient.id === customer.id) {
        recipient = faker.helpers.arrayElement(regularUsers);
      }
      const amount = faker.number.int({ min: 10, max: 500 });
      // Create sender transaction
      await prisma.transaction.create({
        data: {
          utorid: customer.utorid,
          type: 'transfer',
          amount: -amount,
          relatedId: recipient.id,
          createdBy: customer.utorid,
        },
      });
      // Create recipient transaction
      await prisma.transaction.create({
        data: {
          utorid: recipient.utorid,
          type: 'transfer',
          amount: amount,
          relatedId: customer.id,
          createdBy: customer.utorid,
        },
      });
    } else if (transactionType === 'redemption') {
      const amount = faker.number.int({ min: 100, max: 1000 });
      await prisma.transaction.create({
        data: {
          utorid: customer.utorid,
          type: 'redemption',
          amount: amount,
          redeemed: amount,
          createdBy: customer.utorid,
          processedBy: faker.helpers.maybe(() => faker.helpers.arrayElement(cashiers).utorid, { probability: 0.5 }),
        },
      });
    }
    if ((i + 1) % 20 === 0) {
      console.log(`Created ${i + 1}/${TRANSACTION_COUNT} transactions...`);
    }
  }

  // 6. Create Suspicious Transactions
  console.log('Creating suspicious transactions...');
  const suspiciousTxCount = faker.number.int({ min: 10, max: 20 });
  const regularUsersForSuspiciousTx = users.filter(u => u.role === 'regular');

  if (regularUsersForSuspiciousTx.length > 0) {
    const suspiciousCashier = users.find(u => u.utorid === 'suspicious_cashier');
    for (let i = 0; i < suspiciousTxCount; i++) {
      const customer = faker.helpers.arrayElement(regularUsersForSuspiciousTx);
      const spent = faker.number.float({ min: 100, max: 500, multipleOf: 0.01 });

      await prisma.transaction.create({
        data: {
          utorid: customer.utorid,
          type: 'purchase',
          spent,
          earned: 0, // Suspicious transactions might not earn points
          createdBy: suspiciousCashier.utorid, // Created by our suspicious cashier
          remark: 'A deliberately suspicious transaction.',
          suspicious: true, // Mark the transaction itself as suspicious
        },
      });
    }
    console.log(`Created ${suspiciousTxCount} suspicious transactions.`);
  } else {
    console.log('Skipping suspicious transactions creation as no regular users were found.');
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
