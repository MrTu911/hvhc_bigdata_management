const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log('\n=== CẬP NHẬT MẬT KHẨU ===\n');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Update all users to use the new password
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword,
      },
    });
    
    console.log(`✅ Đã cập nhật mật khẩu cho ${result.count} users\n`);
    console.log('Mật khẩu mới cho tất cả tài khoản: password123\n');
    
    console.log('=== THÔNG TIN ĐĂNG NHẬP ===\n');
    console.log('Tài khoản Admin:');
    console.log('  Email: admin@hvhc.edu.vn');
    console.log('  Password: password123\n');
    
    console.log('Tài khoản Giảng viên:');
    console.log('  Email: gv.haucan@hvhc.edu.vn');
    console.log('  Password: password123\n');
    
    console.log('Tài khoản Học viên:');
    console.log('  Email: hv.quansu01@hvhc.edu.vn');
    console.log('  Password: password123\n');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();
