const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'admin@hvhc.edu.vn';
    const password = 'password123';
    
    console.log('\n=== KIỂM TRA ĐĂNG NHẬP ===\n');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log('❌ Không tìm thấy user với email này!\n');
      return;
    }
    
    console.log('✅ Tìm thấy user:');
    console.log(`   Tên: ${user.name}`);
    console.log(`   Vai trò: ${user.role}`);
    console.log(`   Trạng thái: ${user.status}\n`);
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Mật khẩu đúng!\n');
      console.log('=== ĐĂNG NHẬP THÀNH CÔNG ===\n');
    } else {
      console.log('❌ Mật khẩu không đúng!\n');
      console.log('Kiểm tra lại mật khẩu đã được hash trong database.\n');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
