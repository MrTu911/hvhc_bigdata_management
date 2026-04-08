const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        militaryId: true,
        rank: true,
        department: true,
      },
      take: 10,
    });
    
    console.log('\n=== DANH SÁCH TÀI KHOẢN TEST ===\n');
    console.log(`Tổng số user: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Trạng thái: ${user.status}`);
      console.log(`   Quân hàm: ${user.rank || 'N/A'}`);
      console.log(`   Đơn vị: ${user.department || 'N/A'}`);
      console.log('');
    });
    
    console.log('\n=== THÔNG TIN ĐĂNG NHẬP ===\n');
    console.log('Tất cả tài khoản có mật khẩu mặc định: password123\n');
    console.log('Ví dụ:');
    console.log('  Email: admin@hvhc.edu.vn');
    console.log('  Password: password123\n');
    
  } catch (error) {
    console.error('Lỗi khi kiểm tra users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
