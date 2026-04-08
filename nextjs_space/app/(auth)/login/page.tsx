
'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/providers/language-provider';
import { Shield, Languages, ChevronDown, ChevronUp, Users, KeyRound } from 'lucide-react';

// Danh sách tài khoản demo v8.2 - Position-based RBAC
const demoAccounts = [
  { 
    email: 'admin@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'SYSTEM_ADMIN',
    name: 'Nguyen Duc Tu', 
    label: '🔧 Quản trị Hệ thống', 
    labelEn: '🔧 System Admin',
    desc: 'Toàn quyền: RBAC, Users, AI Config, Audit Log'
  },
  { 
    email: 'giamdoc@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'CHI_HUY_HOC_VIEN',
    name: 'Trung tướng, GS, TS Phan Tùng Sơn', 
    label: '⭐ Giám đốc Học viện', 
    labelEn: '⭐ Academy Director',
    desc: 'Dashboard chỉ huy, phê duyệt toàn viện'
  },
  { 
    email: 'truongkhoa.cntt@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'CHI_HUY_KHOA',
    name: '4// PGS.TS Vũ Văn Bân', 
    label: '📋 Chỉ huy Khoa', 
    labelEn: '📋 Department Commander',
    desc: 'Quản lý khoa, GV, CTĐT, NCKH cấp khoa'
  },
  { 
    email: 'truongphong.tchc@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'CHI_HUY_PHONG',
    name: '4// Nguyen Tien Dung', 
    label: '🏛️ Chỉ huy Phòng Chinh Tri', 
    labelEn: '🏛️ Office Commander',
    desc: 'Quản lý nhân sự, chính sách, bảo hiểm'
  },
  { 
    email: 'cnbm.httt@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'CHI_HUY_BO_MON',
    name: '4// Lưu Đức Nhật', 
    label: '📚 Chỉ huy Bộ môn', 
    labelEn: '📚 Subject Commander',
    desc: 'Quản lý bộ môn, duyệt điểm, lịch học'
  },
  { 
    email: 'chihuyhehe1@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'CHI_HUY_HE',
    name: '4// Nguyễn Văn Dũng', 
    label: '👥 Chỉ huy Hệ', 
    labelEn: '👥 System Commander',
    desc: 'Quản lý học viên theo hệ'
  },
  { 
    email: 'giangvien01@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'GIANG_VIEN',
    name: '4//TS Vũ Xuan Tuyen', 
    label: '👨‍🏫 Giảng viên', 
    labelEn: '👨‍🏫 Instructor',
    desc: 'Nhập điểm, quản lý sinh viên hướng dẫn'
  },
  { 
    email: 'nckh01@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'NGHIEN_CUU_VIEN',
    name: '4// TS Nguyen The Giang', 
    label: '🔬 Nghiên cứu viên', 
    labelEn: '🔬 Researcher',
    desc: 'Quản lý đề tài NCKH, công bố khoa học'
  },
  { 
    email: 'troly.tchc@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'TRO_LY',
    name: 'Đại úy Nguyễn Minh Tuấn', 
    label: '📝 Trợ lý', 
    labelEn: '📝 Assistant',
    desc: 'Hỗ trợ nghiệp vụ hành chính'
  },
  { 
    email: 'nhanvien01@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'NHAN_VIEN',
    name: 'Trung úy Lê Thị Hạnh', 
    label: '💼 Nhân viên', 
    labelEn: '💼 Staff',
    desc: 'Nhân viên văn phòng'
  },
  { 
    email: 'hocvien01@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'HOC_VIEN',
    name: 'Trung úy Hoàng Văn An', 
    label: '🎓 Học viên Quân sự', 
    labelEn: '🎓 Military Student',
    desc: 'Xem điểm, lịch học, đăng ký môn'
  },
  { 
    email: 'sinhvien01@hvhc.edu.vn', 
    password: 'Hv@2025', 
    position: 'SINH_VIEN',
    name: 'Nguyễn Thị Lan', 
    label: '🎒 Sinh viên Dân sự', 
    labelEn: '🎒 Civilian Student',
    desc: 'Xem điểm, lịch học, đăng ký môn'
  },
];

// Bước login: 'password' = nhập email+password, 'otp' = nhập OTP (MFA)
type LoginStep = 'password' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<LoginStep>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [demoAccountsEnabled, setDemoAccountsEnabled] = useState(true);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Load trạng thái hiển thị demo accounts từ localStorage
  useEffect(() => {
    const stored = localStorage.getItem('hvhc_show_demo_accounts');
    if (stored !== null) {
      setShowDemoAccounts(stored === 'true');
    }
  }, []);

  // Focus OTP input khi chuyển sang bước OTP
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [step]);

  // Hàm tự động điền tài khoản demo
  const fillDemoAccount = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setOtpCode('');
    setStep('password');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        ...(step === 'otp' && { otpCode }),
        redirect: false,
      });

      if (!result?.error) {
        router.push('/dashboard');
        return;
      }

      // Backend throw 'MFA_REQUIRED' → chuyển sang bước nhập OTP
      if (result.error === 'MFA_REQUIRED') {
        setStep('otp');
        setError('');
        return;
      }

      // Lỗi sai OTP (bước 2)
      if (step === 'otp') {
        setError(
          language === 'vi'
            ? 'Mã OTP không đúng. Vui lòng kiểm tra ứng dụng xác thực.'
            : 'Invalid OTP code. Please check your authenticator app.'
        );
        setOtpCode('');
        return;
      }

      // Lỗi thông thường (sai mật khẩu, tài khoản bị khóa…)
      setError(
        result.error.startsWith('Tài khoản bị khóa')
          ? result.error
          : language === 'vi'
          ? 'Email hoặc mật khẩu không đúng'
          : 'Invalid email or password'
      );
    } catch (err) {
      setError(language === 'vi' ? 'Đã xảy ra lỗi' : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPassword = () => {
    setStep('password');
    setOtpCode('');
    setError('');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2"
        >
          <Languages className="w-4 h-4" />
          {language === 'vi' ? 'English' : 'Tiếng Việt'}
        </Button>
      </div>

      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-4">
        {/* Login Form */}
        <Card className="w-full lg:w-1/2 shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {language === 'vi' ? 'Học viện Hậu cần' : 'Logistics Academy'}
            </CardTitle>
            <CardDescription className="text-base">
              {language === 'vi' 
                ? 'Hệ thống Quản lý BigData' 
                : 'BigData Management System'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 'password' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@hvhc.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {language === 'vi' ? 'Mật khẩu' : 'Password'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </>
              ) : (
                /* Bước 2: nhập OTP */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {language === 'vi'
                        ? 'Mở ứng dụng xác thực (Google/Microsoft Authenticator) và nhập mã 6 chữ số.'
                        : 'Open your authenticator app (Google/Microsoft Authenticator) and enter the 6-digit code.'}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    {language === 'vi' ? 'Đăng nhập với:' : 'Signing in as:'}{' '}
                    <span className="font-medium text-foreground">{email}</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otpCode">
                      {language === 'vi' ? 'Mã xác thực (OTP)' : 'Verification Code (OTP)'}
                    </Label>
                    <Input
                      ref={otpInputRef}
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || (step === 'otp' && otpCode.length !== 6)}
              >
                {isLoading
                  ? (language === 'vi' ? 'Đang xác thực...' : 'Verifying...')
                  : step === 'otp'
                  ? (language === 'vi' ? 'Xác nhận OTP' : 'Verify OTP')
                  : (language === 'vi' ? 'Đăng nhập' : 'Sign in')}
              </Button>

              {step === 'otp' && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleBackToPassword}
                  disabled={isLoading}
                >
                  {language === 'vi' ? '← Quay lại' : '← Back'}
                </Button>
              )}
            </form>

            <div className="mt-6 text-xs text-center text-muted-foreground">
              {language === 'vi'
                ? 'Phiên bản 8.2 - © 2026 Học viện Hậu cần'
                : 'Version 8.2 - © 2026 Logistics Academy'}
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts Panel */}
        {demoAccountsEnabled && (
          <Card className="w-full lg:w-1/2 shadow-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">
                    {language === 'vi' ? 'Tài khoản Demo' : 'Demo Accounts'}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newState = !showDemoAccounts;
                    setShowDemoAccounts(newState);
                    localStorage.setItem('hvhc_show_demo_accounts', String(newState));
                  }}
                  className="p-1 h-8 w-8"
                >
                  {showDemoAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              <CardDescription className="text-xs">
                {language === 'vi' 
                  ? 'Nhấp vào tài khoản để tự động điền' 
                  : 'Click an account to auto-fill'}
              </CardDescription>
            </CardHeader>
            
            {showDemoAccounts && (
              <CardContent className="pt-2">
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {demoAccounts.map((account, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => fillDemoAccount(account)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {language === 'vi' ? account.label : account.labelEn}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                            {account.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {account.email}
                          </div>
                          {'desc' in account && (
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 italic">
                              {account.desc}
                            </div>
                          )}
                        </div>
                        <div className="ml-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {language === 'vi' ? '→ Điền' : '→ Fill'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">🔐</span>
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                      {language === 'vi' 
                        ? 'Mật khẩu chung: Hv@2025 | Position-based RBAC v8.2' 
                        : 'Common password: Hv@2025 | Position-based RBAC v8.2'}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
