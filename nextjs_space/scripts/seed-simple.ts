
/**
 * Script tạo dữ liệu mẫu đơn giản hơn
 * Sử dụng các giá trị role đã tồn tại trong database
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Tạo 50 users mẫu...');
  
  const password = await bcrypt.hash('Password123!', 10);
  const roles = ['QUAN_TRI_HE_THONG', 'GIANG_VIEN', 'HOC_VIEN_SINH_VIEN', 'NGHIEN_CUU_VIEN'];

  const users = [];
  for (let i = 1; i <= 50; i++) {
    users.push({
      email: `testuser${i}@hvhc.edu.vn`,
      name: `Test User ${i}`,
      password,
      role: roles[i % roles.length] as any,
      status: 'ACTIVE' as any,
      militaryId: `TEST${String(i).padStart(4, '0')}`,
    });
  }

  await prisma.user.createMany({ data: users, skipDuplicates: true });
  console.log('✅ Đã tạo users');
}

async function seedServices() {
  console.log('🌱 Tạo 20 services mẫu...');
  
  const types = ['POSTGRESQL', 'MINIO', 'AIRFLOW', 'CLICKHOUSE', 'PROMETHEUS'];
  const services = [];
  
  for (let i = 1; i <= 20; i++) {
    services.push({
      name: `Service-${i}`,
      type: types[i % types.length] as any,
      status: ['HEALTHY', 'DEGRADED', 'DOWN'][i % 3] as any,
      host: `server${i}.hvhc.local`,
      port: 3000 + i,
      isActive: true,
      uptime: 95 + (i % 5),
    });
  }

  await prisma.bigDataService.createMany({ data: services, skipDuplicates: true });
  console.log('✅ Đã tạo services');
}

async function seedLogs() {
  console.log('🌱 Tạo 100 system logs...');
  
  const users = await prisma.user.findMany({ take: 10 });
  const logs = [];

  for (let i = 1; i <= 100; i++) {
    const user = users[i % users.length];
    logs.push({
      userId: user?.id,
      level: ['INFO', 'WARNING', 'ERROR'][i % 3] as any,
      category: ['AUTH', 'SYSTEM', 'DATA_PROCESSING'][i % 3] as any,
      action: 'test_action',
      description: `Test log ${i}`,
      ipAddress: `192.168.1.${i}`,
      createdAt: new Date(Date.now() - i * 3600000),
    });
  }

  await prisma.systemLog.createMany({ data: logs });
  console.log('✅ Đã tạo system logs');
}

async function main() {
  console.log('🚀 Bắt đầu tạo dữ liệu mẫu...\n');

  try {
    await seedUsers();
    await seedServices();
    await seedLogs();

    console.log('\n✅ Hoàn thành!');
  } catch (error) {
    console.error('❌ Lỗi:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
