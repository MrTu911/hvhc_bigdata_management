
import { PrismaClient, UserRole, ServiceType, ServiceStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Mật khẩu demo chung cho tất cả tài khoản demo
const DEMO_PASSWORD = 'Hv@2025';

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password helper
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
  };

  const demoPasswordHash = await hashPassword(DEMO_PASSWORD);

  // 1. Create Departments
  console.log('Creating departments...');
  const departments = [
    {
      code: 'HVHC',
      name: 'Học viện Hậu cần',
      shortName: 'HVHC',
      fullName: 'Học viện Hậu cần - Bộ Quốc phòng',
      level: 1,
      address: 'Km 10, Đường Hồ Chí Minh, Hà Nội',
      phone: '024-3835-0000',
      email: 'info@hvhc.edu.vn',
      latitude: 21.0285,
      longitude: 105.8542,
      sortOrder: 1,
      isActive: true
    },
    {
      code: 'KHCL',
      name: 'Khoa Hậu cần',
      shortName: 'Khoa HC',
      fullName: 'Khoa Hậu cần quân sự',
      level: 2,
      sortOrder: 2,
      isActive: true
    },
    {
      code: 'KVHK',
      name: 'Khoa Vận tải - Hóa chất',
      shortName: 'Khoa VT-HC',
      fullName: 'Khoa Vận tải và Hóa chất',
      level: 2,
      sortOrder: 3,
      isActive: true
    },
    {
      code: 'KTXD',
      name: 'Khoa Kỹ thuật Xây dựng',
      shortName: 'Khoa KTXD',
      fullName: 'Khoa Kỹ thuật Xây dựng',
      level: 2,
      sortOrder: 4,
      isActive: true
    },
    {
      code: 'KTC',
      name: 'Khoa Tài chính',
      shortName: 'Khoa TC',
      fullName: 'Khoa Tài chính quân sự',
      level: 2,
      sortOrder: 5,
      isActive: true
    },
    {
      code: 'KCNTT',
      name: 'Khoa Công nghệ thông tin',
      shortName: 'Khoa CNTT',
      fullName: 'Khoa Công nghệ thông tin và Truyền thông',
      level: 2,
      sortOrder: 6,
      isActive: true
    }
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept
    });
  }
  console.log('✓ Departments created');

  // 2. Create Demo Users with all roles
  console.log('Creating demo users with full RBAC...');
  
  // ========== ADMIN - QUẢN TRỊ HỆ THỐNG ==========
  // Test account (REQUIRED by system)
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {
      password: await hashPassword('johndoe123'),
      name: 'System Administrator',
      role: UserRole.QUAN_TRI_HE_THONG,
      status: 'ACTIVE'
    },
    create: {
      email: 'john@doe.com',
      name: 'System Administrator',
      password: await hashPassword('johndoe123'),
      role: UserRole.QUAN_TRI_HE_THONG,
      militaryId: 'AD001',
      rank: 'Đại tá',
      department: 'HVHC',
      unit: 'Ban Giám đốc',
      phone: '0912000001',
      status: 'ACTIVE'
    }
  });

  // Demo admin account
  await prisma.user.upsert({
    where: { email: 'admin@hvhc.edu.vn' },
    update: {
      password: demoPasswordHash,
      role: UserRole.QUAN_TRI_HE_THONG,
      status: 'ACTIVE'
    },
    create: {
      email: 'admin@hvhc.edu.vn',
      name: 'Nguyễn Văn Quản',
      password: demoPasswordHash,
      role: UserRole.QUAN_TRI_HE_THONG,
      militaryId: 'QT001',
      rank: 'Thượng tá',
      department: 'HVHC',
      unit: 'Phòng Công nghệ thông tin',
      phone: '0912000002',
      status: 'ACTIVE'
    }
  });
  console.log('✓ Admin accounts created');

  // ========== CHI HUY HOC VIEN - GIÁM ĐỐC ==========
  await prisma.user.upsert({
    where: { email: 'giamdoc@hvhc.edu.vn' },
    update: {
      password: demoPasswordHash,
      role: UserRole.CHI_HUY_HOC_VIEN,
      status: 'ACTIVE'
    },
    create: {
      email: 'giamdoc@hvhc.edu.vn',
      name: 'Đại tá Phan Tùng Sơn',
      password: demoPasswordHash,
      role: UserRole.CHI_HUY_HOC_VIEN,
      militaryId: 'GD001',
      rank: 'Đại tá',
      department: 'HVHC',
      unit: 'Ban Giám đốc',
      phone: '0912100001',
      status: 'ACTIVE'
    }
  });

  await prisma.user.upsert({
    where: { email: 'pgd@hvhc.edu.vn' },
    update: {
      password: demoPasswordHash,
      role: UserRole.CHI_HUY_HOC_VIEN,
      status: 'ACTIVE'
    },
    create: {
      email: 'pgd@hvhc.edu.vn',
      name: 'Đại tá Nguyễn Hoàng Nam',
      password: demoPasswordHash,
      role: UserRole.CHI_HUY_HOC_VIEN,
      militaryId: 'PGD001',
      rank: 'Đại tá',
      department: 'HVHC',
      unit: 'Ban Giám đốc',
      phone: '0912100002',
      status: 'ACTIVE'
    }
  });
  console.log('✓ Command accounts created');

  // ========== CHI HUY KHOA PHONG - TRƯỞNG KHOA/PHÒNG ==========
  const departmentHeads = [
    { email: 'truongkhoa.hc@hvhc.edu.vn', name: 'Thượng tá Vũ Nhật Văn', militaryId: 'TK001', department: 'KHCL', unit: 'Khoa Hậu cần' },
    { email: 'truongkhoa.cntt@hvhc.edu.vn', name: 'Thượng tá Trần Đức Minh', militaryId: 'TK002', department: 'KCNTT', unit: 'Khoa CNTT' },
    { email: 'truongkhoa.tc@hvhc.edu.vn', name: 'Trung tá Lê Văn Hùng', militaryId: 'TK003', department: 'KTC', unit: 'Khoa Tài chính' },
    { email: 'truongphong.daotao@hvhc.edu.vn', name: 'Thượng tá Phạm Văn Đạt', militaryId: 'TP001', department: 'HVHC', unit: 'Phòng Đào tạo' },
  ];

  for (const head of departmentHeads) {
    await prisma.user.upsert({
      where: { email: head.email },
      update: {
        password: demoPasswordHash,
        role: UserRole.CHI_HUY_KHOA_PHONG,
        status: 'ACTIVE'
      },
      create: {
        ...head,
        password: demoPasswordHash,
        role: UserRole.CHI_HUY_KHOA_PHONG,
        rank: head.militaryId.startsWith('TK') ? 'Thượng tá' : 'Trung tá',
        phone: '0912200000',
        status: 'ACTIVE'
      }
    });
  }
  console.log('✓ Department head accounts created');

  // ========== CHU NHIEM BO MON ==========
  const subjectHeads = [
    { email: 'cnbm.quansu@hvhc.edu.vn', name: 'Trung tá Lưu Đức Nhật', militaryId: 'BM001', department: 'KHCL', unit: 'Bộ môn Quân sự' },
    { email: 'cnbm.kinhte@hvhc.edu.vn', name: 'Thiếu tá Nguyễn Văn Kinh', militaryId: 'BM002', department: 'KTC', unit: 'Bộ môn Kinh tế' },
    { email: 'cnbm.laptrình@hvhc.edu.vn', name: 'Trung tá Hoàng Minh Tuấn', militaryId: 'BM003', department: 'KCNTT', unit: 'Bộ môn Lập trình' },
  ];

  for (const head of subjectHeads) {
    await prisma.user.upsert({
      where: { email: head.email },
      update: {
        password: demoPasswordHash,
        role: UserRole.CHU_NHIEM_BO_MON,
        status: 'ACTIVE'
      },
      create: {
        ...head,
        password: demoPasswordHash,
        role: UserRole.CHU_NHIEM_BO_MON,
        rank: 'Trung tá',
        phone: '0912300000',
        status: 'ACTIVE'
      }
    });
  }
  console.log('✓ Subject head accounts created');

  // ========== GIANG VIEN ==========
  const teachers = [
    { email: 'giangvien01@hvhc.edu.vn', name: 'PGS.TS Vũ Văn Bân', militaryId: 'GV001', department: 'KHCL', unit: 'Khoa Hậu cần' },
    { email: 'giangvien02@hvhc.edu.vn', name: 'TS Trần Minh Hậu', militaryId: 'GV002', department: 'KTXD', unit: 'Khoa KTXD' },
    { email: 'giangvien03@hvhc.edu.vn', name: 'ThS Phạm Thị Lan', militaryId: 'GV003', department: 'KCNTT', unit: 'Khoa CNTT' },
    { email: 'giangvien04@hvhc.edu.vn', name: 'TS Nguyễn Hoài Nam', militaryId: 'GV004', department: 'KTC', unit: 'Khoa Tài chính' },
  ];

  for (const teacher of teachers) {
    await prisma.user.upsert({
      where: { email: teacher.email },
      update: {
        password: demoPasswordHash,
        role: UserRole.GIANG_VIEN,
        status: 'ACTIVE'
      },
      create: {
        ...teacher,
        password: demoPasswordHash,
        role: UserRole.GIANG_VIEN,
        rank: 'Thiếu tá',
        phone: '0913000000',
        status: 'ACTIVE'
      }
    });
  }
  console.log('✓ Instructor accounts created');

  // ========== NGHIEN CUU VIEN ==========
  const researchers = [
    { email: 'nckh01@hvhc.edu.vn', name: 'GS.TS Vũ Đức Thành', militaryId: 'NC001', department: 'HVHC', unit: 'Viện Nghiên cứu' },
    { email: 'nckh02@hvhc.edu.vn', name: 'PGS.TS Trần Văn Khoa', militaryId: 'NC002', department: 'KCNTT', unit: 'Viện Nghiên cứu' },
  ];

  for (const researcher of researchers) {
    await prisma.user.upsert({
      where: { email: researcher.email },
      update: {
        password: demoPasswordHash,
        role: UserRole.NGHIEN_CUU_VIEN,
        status: 'ACTIVE'
      },
      create: {
        ...researcher,
        password: demoPasswordHash,
        role: UserRole.NGHIEN_CUU_VIEN,
        rank: 'Đại tá',
        phone: '0914000000',
        status: 'ACTIVE'
      }
    });
  }
  console.log('✓ Researcher accounts created');

  // ========== KY THUAT VIEN ==========
  const technicians = [
    { email: 'kythuatvien@hvhc.edu.vn', name: 'Đại úy Nguyễn Minh Kỹ', militaryId: 'KT001', department: 'KCNTT', unit: 'Phòng CNTT' },
  ];

  for (const tech of technicians) {
    await prisma.user.upsert({
      where: { email: tech.email },
      update: {
        password: demoPasswordHash,
        role: UserRole.KY_THUAT_VIEN,
        status: 'ACTIVE'
      },
      create: {
        ...tech,
        password: demoPasswordHash,
        role: UserRole.KY_THUAT_VIEN,
        rank: 'Đại úy',
        phone: '0915000000',
        status: 'ACTIVE'
      }
    });
  }
  console.log('✓ Technician accounts created');

  // ========== HOC VIEN / SINH VIEN ==========
  const students = [
    { email: 'hocvien01@hvhc.edu.vn', name: 'Trung úy Hoàng Văn An', militaryId: 'HV001', rank: 'Trung úy', department: 'KHCL', unit: 'Lớp K45-Hậu cần' },
    { email: 'hocvien02@hvhc.edu.vn', name: 'Thượng úy Đỗ Minh Bình', militaryId: 'HV002', rank: 'Thượng úy', department: 'KVHK', unit: 'Lớp K45-Vận tải' },
    { email: 'sinhvien01@hvhc.edu.vn', name: 'Nguyễn Thị Cúc', militaryId: null, rank: null, department: 'KCNTT', unit: 'Lớp CNTT-K20' },
    { email: 'sinhvien02@hvhc.edu.vn', name: 'Trần Văn Dũng', militaryId: null, rank: null, department: 'KTC', unit: 'Lớp TC-K20' },
  ];

  for (const student of students) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {
        password: demoPasswordHash,
        role: UserRole.HOC_VIEN_SINH_VIEN,
        status: 'ACTIVE'
      },
      create: {
        ...student,
        password: demoPasswordHash,
        role: UserRole.HOC_VIEN_SINH_VIEN,
        phone: '0916000000',
        status: 'ACTIVE'
      }
    });
  }
  console.log('✓ Student accounts created');

  // 3. Create BigData Services
  console.log('Creating BigData services...');
  const services = [
    {
      name: 'PostgreSQL Database',
      type: ServiceType.POSTGRESQL,
      host: 'localhost',
      port: 55432,
      url: 'postgresql://hvhc_admin:Hv2025_Postgres@localhost:55432/hvhc_oltp',
      username: 'hvhc_admin',
      password: 'Hv2025_Postgres',
      description: 'Primary OLTP database for HVHC BigData system',
      version: '14.0'
    },
    {
      name: 'MinIO Object Storage',
      type: ServiceType.MINIO,
      host: 'localhost',
      port: 19000,
      url: 'http://localhost:19000',
      username: 'hvhc_minio',
      password: 'Hv2025_Minio',
      description: 'Object storage for data lake',
      version: 'latest'
    },
    {
      name: 'Apache Airflow',
      type: ServiceType.AIRFLOW,
      host: 'localhost',
      port: 18082,
      url: 'http://localhost:18082',
      username: 'admin',
      password: 'admin',
      description: 'Workflow orchestration and DAG management',
      version: '2.5.1'
    },
    {
      name: 'ClickHouse OLAP',
      type: ServiceType.CLICKHOUSE,
      host: 'localhost',
      port: 8123,
      url: 'http://localhost:8123',
      username: 'hvhc_click',
      password: 'Hv2025_Click',
      description: 'Analytical database for big data queries',
      version: 'latest'
    },
    {
      name: 'Prometheus Monitoring',
      type: ServiceType.PROMETHEUS,
      host: 'localhost',
      port: 19090,
      url: 'http://localhost:19090',
      description: 'Metrics collection and monitoring',
      version: 'latest'
    },
    {
      name: 'Apache Superset',
      type: ServiceType.SUPERSET,
      host: 'localhost',
      port: 18088,
      url: 'http://localhost:18088',
      username: 'admin',
      password: 'admin',
      description: 'Business Intelligence and data visualization',
      version: 'latest'
    },
    {
      name: 'Apache Kafka',
      type: ServiceType.KAFKA,
      host: 'localhost',
      port: 19092,
      url: 'localhost:19092',
      description: 'Message streaming platform',
      version: 'latest'
    },
    {
      name: 'Hadoop HDFS',
      type: ServiceType.HADOOP,
      host: 'localhost',
      port: 9870,
      url: 'http://localhost:9870',
      description: 'Distributed file system',
      version: '3.2.1'
    },
    {
      name: 'Apache Spark',
      type: ServiceType.SPARK,
      host: 'localhost',
      port: 8081,
      url: 'http://localhost:8081',
      description: 'Distributed data processing engine',
      version: '3.5.0'
    },
    {
      name: 'Grafana Dashboard',
      type: ServiceType.GRAFANA,
      host: 'localhost',
      port: 13000,
      url: 'http://localhost:13000',
      username: 'admin',
      description: 'Metrics visualization and alerting',
      version: 'latest'
    }
  ];

  for (const service of services) {
    const existing = await prisma.bigDataService.findFirst({
      where: { 
        name: service.name,
        type: service.type
      }
    });

    if (existing) {
      await prisma.bigDataService.update({
        where: { id: existing.id },
        data: service
      });
    } else {
      await prisma.bigDataService.create({
        data: {
          ...service,
          status: ServiceStatus.UNKNOWN,
          uptime: 0,
          isActive: true
        }
      });
    }
  }
  console.log('✓ BigData services configured');

  // 4. Create System Configurations
  console.log('Creating system configurations...');
  const configs = [
    {
      key: 'SYSTEM_NAME',
      value: 'Hệ thống Quản lý BigData HVHC',
      category: 'GENERAL',
      description: 'System display name'
    },
    {
      key: 'SYSTEM_VERSION',
      value: '1.0.0',
      category: 'GENERAL',
      description: 'Current system version'
    },
    {
      key: 'DEFAULT_LANGUAGE',
      value: 'vi',
      category: 'LOCALIZATION',
      description: 'Default system language (vi/en)'
    },
    {
      key: 'METRICS_RETENTION_DAYS',
      value: '30',
      category: 'MONITORING',
      description: 'Days to retain service metrics'
    },
    {
      key: 'ALERT_EMAIL_ENABLED',
      value: 'true',
      category: 'ALERTING',
      description: 'Enable email alerts'
    },
    {
      key: 'HEALTH_CHECK_INTERVAL',
      value: '60',
      category: 'MONITORING',
      description: 'Health check interval in seconds'
    }
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config
    });
  }
  console.log('✓ System configurations created');

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
