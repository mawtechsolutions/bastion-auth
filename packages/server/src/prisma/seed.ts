import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';

import { ARGON2_CONFIG } from '@bastionauth/core';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: ARGON2_CONFIG.MEMORY_COST,
    timeCost: ARGON2_CONFIG.TIME_COST,
    parallelism: ARGON2_CONFIG.PARALLELISM,
    outputLen: ARGON2_CONFIG.HASH_LENGTH,
  });
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bastionauth.dev' },
    update: {},
    create: {
      email: 'admin@bastionauth.dev',
      emailVerified: true,
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      publicMetadata: { role: 'admin' },
      privateMetadata: { isSystemAdmin: true },
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create test user
  const testPassword = await hashPassword('Test123!');
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      emailVerified: true,
      passwordHash: testPassword,
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
    },
  });
  console.log(`✅ Created test user: ${testUser.email}`);

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-inc' },
    update: {},
    create: {
      name: 'Acme Inc',
      slug: 'acme-inc',
      allowedDomains: ['acme.com'],
    },
  });
  console.log(`✅ Created organization: ${org.name}`);

  // Add admin as owner of organization
  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      organizationId: org.id,
      role: 'owner',
      permissions: ['*'],
    },
  });
  console.log(`✅ Added admin as owner of ${org.name}`);

  // Add test user as member
  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: testUser.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      organizationId: org.id,
      role: 'member',
    },
  });
  console.log(`✅ Added test user as member of ${org.name}`);

  // Create custom roles
  await prisma.organizationRole.upsert({
    where: {
      organizationId_key: {
        organizationId: org.id,
        key: 'editor',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Editor',
      key: 'editor',
      description: 'Can edit content but cannot manage members',
      permissions: ['content:read', 'content:write', 'content:delete'],
    },
  });

  await prisma.organizationRole.upsert({
    where: {
      organizationId_key: {
        organizationId: org.id,
        key: 'viewer',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Viewer',
      key: 'viewer',
      description: 'Read-only access',
      permissions: ['content:read'],
      isDefault: true,
    },
  });
  console.log(`✅ Created custom roles for ${org.name}`);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Admin: admin@bastionauth.dev / Admin123!');
  console.log('  User:  test@example.com / Test123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

