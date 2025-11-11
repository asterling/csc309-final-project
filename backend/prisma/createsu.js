const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const [,, utorid, email, password] = process.argv;

  if (!utorid || !email || !password) {
    console.error('Please provide utorid, email, and password as command-line arguments.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.user.create({
      data: {
        utorid,
        email,
        password: hashedPassword,
        role: 'superuser',
        verified: true,
        name: 'Super User',
      },
    });
    console.log('Superuser created successfully:', newUser);
  } catch (error) {
    console.error('Error creating superuser:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
