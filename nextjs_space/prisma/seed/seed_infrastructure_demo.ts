import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const NAS_PASSWORD = 'nas@hvhc2024';
const SERVER_PASSWORD = 'server@hvhc2024';

async function seedInfrastructure() {
  console.log('🔧 Seeding infrastructure configurations...');

  const adminUser = await prisma.user.findFirst({
    where: { role: 'QUAN_TRI_HE_THONG' },
    select: { id: true },
  });

  if (!adminUser) {
    throw new Error('Không tìm thấy user QUAN_TRI_HE_THONG để seed infrastructure');
  }

  const nasPasswordHash = await bcrypt.hash(NAS_PASSWORD, 10);
  const serverPasswordHash = await bcrypt.hash(SERVER_PASSWORD, 10);

  // NAS chính – lưu trữ dữ liệu học viên và hồ sơ
  const nas1 = await prisma.infrastructureConfig.upsert({
    where: { id: 'infra-nas-main-001' },
    update: {},
    create: {
      id: 'infra-nas-main-001',
      configType: 'NAS',
      name: 'NAS Chính - Kho dữ liệu học viên',
      description: 'NAS Synology DS1823xs+ - Lưu trữ hồ sơ học viên, tài liệu đào tạo',
      isEnabled: true,
      connectionUrl: '192.168.10.50',
      protocol: 'SMB',
      port: 445,
      username: 'hvhc_admin',
      passwordHash: nasPasswordHash,
      basePath: '/volume1/hvhc-data',
      storageGB: 24000,
      syncEnabled: true,
      syncInterval: 30,
      syncDirection: 'BIDIRECTIONAL',
      healthStatus: 'HEALTHY',
      healthMessage: 'Kết nối ổn định, dung lượng sử dụng 61%',
      lastHealthCheck: new Date(Date.now() - 15 * 60 * 1000), // 15 phút trước
      lastSyncAt: new Date(Date.now() - 35 * 60 * 1000),
      lastSyncStatus: 'SUCCESS',
      createdById: adminUser.id,
    },
  });

  // NAS backup – sao lưu offsite
  const nas2 = await prisma.infrastructureConfig.upsert({
    where: { id: 'infra-nas-backup-002' },
    update: {},
    create: {
      id: 'infra-nas-backup-002',
      configType: 'NAS',
      name: 'NAS Sao lưu - Lưu trữ offsite',
      description: 'NAS QNAP TS-873A - Backup dự phòng ngoài khu vực chính',
      isEnabled: true,
      connectionUrl: '192.168.10.51',
      protocol: 'NFS',
      port: 2049,
      username: 'backup_user',
      passwordHash: nasPasswordHash,
      basePath: '/exports/hvhc-backup',
      storageGB: 32000,
      syncEnabled: true,
      syncInterval: 60,
      syncDirection: 'UPLOAD',
      healthStatus: 'HEALTHY',
      healthMessage: 'Đồng bộ tự động hoạt động bình thường',
      lastHealthCheck: new Date(Date.now() - 10 * 60 * 1000),
      lastSyncAt: new Date(Date.now() - 65 * 60 * 1000),
      lastSyncStatus: 'SUCCESS',
      createdById: adminUser.id,
    },
  });

  // Training Server GPU
  const gpuServer = await prisma.infrastructureConfig.upsert({
    where: { id: 'infra-gpu-server-001' },
    update: {},
    create: {
      id: 'infra-gpu-server-001',
      configType: 'TRAINING_SERVER',
      name: 'GPU Server A100 - Huấn luyện AI',
      description: 'Dell PowerEdge R750xa - 2x NVIDIA A100 80GB - Chạy mô hình NLP/ML cho hệ thống',
      isEnabled: true,
      connectionUrl: '192.168.20.10',
      protocol: 'SSH',
      port: 22,
      username: 'ml_runner',
      passwordHash: serverPasswordHash,
      basePath: '/home/ml_runner/workspaces',
      gpuCount: 2,
      gpuType: 'NVIDIA A100 80GB',
      memoryGB: 256,
      storageGB: 8000,
      syncEnabled: false,
      healthStatus: 'HEALTHY',
      healthMessage: 'GPU utilization 34%, temperature 68°C',
      lastHealthCheck: new Date(Date.now() - 5 * 60 * 1000),
      createdById: adminUser.id,
    },
  });

  // Training Server nhỏ hơn cho dev
  const devServer = await prisma.infrastructureConfig.upsert({
    where: { id: 'infra-dev-server-002' },
    update: {},
    create: {
      id: 'infra-dev-server-002',
      configType: 'TRAINING_SERVER',
      name: 'Dev Server - Kiểm thử mô hình',
      description: 'HP ProLiant DL380 Gen10 - RTX 4090 - Môi trường phát triển và kiểm thử',
      isEnabled: true,
      connectionUrl: '192.168.20.11',
      protocol: 'SSH',
      port: 22,
      username: 'dev_ml',
      passwordHash: serverPasswordHash,
      basePath: '/workspace/dev',
      gpuCount: 1,
      gpuType: 'NVIDIA RTX 4090',
      memoryGB: 128,
      storageGB: 4000,
      syncEnabled: true,
      syncInterval: 120,
      syncDirection: 'DOWNLOAD',
      healthStatus: 'DEGRADED',
      healthMessage: 'GPU memory gần đầy (87%), khuyến nghị giải phóng bộ nhớ',
      lastHealthCheck: new Date(Date.now() - 8 * 60 * 1000),
      createdById: adminUser.id,
    },
  });

  // Backup Server
  const backupServer = await prisma.infrastructureConfig.upsert({
    where: { id: 'infra-backup-server-001' },
    update: {},
    create: {
      id: 'infra-backup-server-001',
      configType: 'BACKUP_SERVER',
      name: 'Backup Server - PostgreSQL Cold Backup',
      description: 'Veeam Backup - Sao lưu lạnh PostgreSQL và file hệ thống hàng ngày',
      isEnabled: true,
      connectionUrl: '192.168.30.5',
      protocol: 'SFTP',
      port: 22,
      username: 'veeam_agent',
      passwordHash: serverPasswordHash,
      basePath: '/backup/hvhc-db',
      storageGB: 12000,
      syncEnabled: true,
      syncInterval: 1440, // mỗi 24 giờ
      syncDirection: 'UPLOAD',
      healthStatus: 'UNKNOWN',
      healthMessage: null,
      lastHealthCheck: null,
      createdById: adminUser.id,
    },
  });

  // Seed sync logs cho NAS chính
  const syncLogsData = [
    {
      configId: nas1.id,
      syncType: 'SCHEDULED',
      direction: 'BIDIRECTIONAL',
      status: 'SUCCESS',
      filesUploaded: 47,
      filesDownloaded: 12,
      bytesTransferred: BigInt(185_430_528),
      duration: 23,
    },
    {
      configId: nas1.id,
      syncType: 'MANUAL',
      direction: 'UPLOAD',
      status: 'SUCCESS',
      filesUploaded: 120,
      filesDownloaded: 0,
      bytesTransferred: BigInt(524_288_000),
      duration: 45,
    },
    {
      configId: nas2.id,
      syncType: 'SCHEDULED',
      direction: 'UPLOAD',
      status: 'SUCCESS',
      filesUploaded: 89,
      filesDownloaded: 0,
      bytesTransferred: BigInt(1_073_741_824),
      duration: 82,
    },
    {
      configId: nas2.id,
      syncType: 'SCHEDULED',
      direction: 'UPLOAD',
      status: 'FAILED',
      filesUploaded: 0,
      filesDownloaded: 0,
      bytesTransferred: BigInt(0),
      duration: 5,
      errorMessage: 'Connection timeout sau 5s - kiểm tra lại mạng nội bộ',
    },
    {
      configId: devServer.id,
      syncType: 'SCHEDULED',
      direction: 'DOWNLOAD',
      status: 'SUCCESS',
      filesUploaded: 0,
      filesDownloaded: 35,
      bytesTransferred: BigInt(2_147_483_648),
      duration: 134,
    },
    {
      configId: backupServer.id,
      syncType: 'SCHEDULED',
      direction: 'UPLOAD',
      status: 'SUCCESS',
      filesUploaded: 1,
      filesDownloaded: 0,
      bytesTransferred: BigInt(8_589_934_592),
      duration: 1842,
    },
  ];

  // Insert sync logs với timestamps khác nhau
  const now = Date.now();
  for (let i = 0; i < syncLogsData.length; i++) {
    const hoursAgo = [0.5, 1.5, 2, 6, 12, 24][i] * 60 * 60 * 1000;
    await prisma.syncLog.create({
      data: {
        ...syncLogsData[i],
        createdAt: new Date(now - hoursAgo),
      },
    });
  }

  console.log('✅ Infrastructure configs created:');
  console.log('   - NAS Chính (HEALTHY)');
  console.log('   - NAS Sao lưu (HEALTHY)');
  console.log('   - GPU Server A100 (HEALTHY)');
  console.log('   - Dev Server RTX 4090 (DEGRADED)');
  console.log('   - Backup Server (UNKNOWN)');
  console.log(`✅ Seeded ${syncLogsData.length} sync logs`);
}

seedInfrastructure()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
