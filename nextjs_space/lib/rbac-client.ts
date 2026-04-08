/**
 * Client-safe RBAC functions v8.3
 * 
 * FUNCTION-BASED RBAC - KHÔNG BYPASS THEO ROLE
 * 
 * Nguyên tắc:
 * 1. KHÔNG bypass theo role string (ADMIN, QUAN_TRI_HE_THONG)
 * 2. Quyền dựa hoàn toàn vào functionCodes từ session/API
 * 3. Các hàm nhận functionCodes trực tiếp, không lookup từ role
 */

/**
 * User roles enum (giữ lại cho backward compatibility với UI)
 * @deprecated v8.3: Không dùng để kiểm tra quyền, chỉ dùng cho UI display
 */
export type UserRoleType = 
  | 'ADMIN'
  | 'QUAN_TRI_HE_THONG'
  | 'CHI_HUY_HOC_VIEN'
  | 'CHI_HUY_KHOA_PHONG'
  | 'CHU_NHIEM_BO_MON'
  | 'GIANG_VIEN'
  | 'NGHIEN_CUU_VIEN'
  | 'HOC_VIEN'
  | 'HOC_VIEN_SINH_VIEN'
  | 'KY_THUAT_VIEN';

/**
 * Route → Function codes mapping
 * Maps routes to required function codes for access
 */
export const ROUTE_FUNCTION_MAP: Record<string, string[]> = {
  // CSDL Quân nhân
  '/dashboard/personnel': ['PERSONNEL.VIEW', 'VIEW_PERSONNEL'],
  '/dashboard/human-resources': ['PERSONNEL.VIEW', 'MANAGE_USERS', 'VIEW_PERSONNEL'],
  
  // CSDL Đào tạo
  '/dashboard/student': ['STUDENT.VIEW', 'VIEW_STUDENT', 'VIEW_GRADE'],
  '/dashboard/training': ['TRAINING.VIEW', 'VIEW_TRAINING', 'VIEW_COURSE'],
  
  // CSDL Giảng viên
  '/dashboard/faculty': ['FACULTY.VIEW', 'VIEW_FACULTY'],
  '/dashboard/faculty/profile': ['FACULTY.VIEW', 'VIEW_FACULTY'],
  '/dashboard/faculty/my-students': ['STUDENT.VIEW', 'VIEW_STUDENT'],
  '/dashboard/faculty/research': ['RESEARCH.VIEW', 'VIEW_RESEARCH'],
  '/dashboard/faculty/teaching-analytics': ['EDUCATION.VIEW_STATS', 'VIEW_TRAINING'],
  
  // CSDL Nghiên cứu
  '/dashboard/research': ['RESEARCH.VIEW', 'VIEW_RESEARCH'],
  
  // CSDL Đảng viên
  '/dashboard/party': ['PARTY.VIEW', 'VIEW_PARTY_MEMBER'],
  
  // CSDL Chính sách
  '/dashboard/policy': ['POLICY.VIEW', 'VIEW_POLICY'],
  
  // CSDL Bảo hiểm
  '/dashboard/insurance': ['INSURANCE.VIEW', 'VIEW_INSURANCE'],
  
  // Dashboard chỉ huy
  '/dashboard/command': ['DASHBOARD.VIEW_COMMAND', 'VIEW_DASHBOARD', 'VIEW_ANALYTICS'],
  
  // Dashboard quản trị
  '/dashboard/admin': ['SYSTEM.MANAGE_USERS', 'SYSTEM.MANAGE_RBAC', 'MANAGE_USERS', 'MANAGE_RBAC'],
  '/dashboard/admin/rbac': ['SYSTEM.MANAGE_RBAC', 'MANAGE_RBAC'],
  '/dashboard/admin/users': ['SYSTEM.MANAGE_USERS', 'MANAGE_USERS'],
  
  // Hệ thống
  '/dashboard/monitoring': ['SYSTEM.VIEW_HEALTH', 'VIEW_SYSTEM_HEALTH'],
  '/dashboard/datalake': ['DATA.VIEW', 'VIEW_DATALAKE'],
  '/dashboard/logs': ['SYSTEM.VIEW_AUDIT', 'VIEW_AUDIT_LOG'],
};

/**
 * Common routes - accessible by ALL authenticated users
 */
const COMMON_ROUTES = [
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/settings',
];

/**
 * Check if user has a function code
 * @param userFunctions - Set hoặc array của function codes từ session
 * @param functionCode - Function code cần kiểm tra
 */
export function hasFunction(
  userFunctions: Set<string> | string[], 
  functionCode: string
): boolean {
  if (!userFunctions) return false;
  
  const functionSet = userFunctions instanceof Set 
    ? userFunctions 
    : new Set(userFunctions);
  
  return functionSet.has(functionCode);
}

/**
 * Check if user can access route based on function codes
 * KHÔNG BYPASS THEO ROLE - Kiểm tra functionCodes thực tế
 * 
 * @param userFunctions - Function codes từ session/API
 * @param routePath - Route cần truy cập
 */
export function canAccessRouteByFunction(
  userFunctions: Set<string> | string[], 
  routePath: string
): boolean {
  if (!userFunctions) return false;
  
  // Common routes - cho phép tất cả authenticated users
  if (COMMON_ROUTES.some(route => routePath === route)) {
    return true;
  }
  
  const functionSet = userFunctions instanceof Set 
    ? userFunctions 
    : new Set(userFunctions);
  
  // Nếu không có function nào, deny
  if (functionSet.size === 0) {
    return false;
  }
  
  // Find matching route pattern
  const matchingRoute = Object.keys(ROUTE_FUNCTION_MAP).find(route => 
    routePath === route || routePath.startsWith(route + '/')
  );
  
  if (!matchingRoute) {
    // Route không có trong map → deny (FAIL-CLOSED)
    // Trừ khi là sub-route của dashboard
    return routePath.startsWith('/dashboard');
  }
  
  const requiredFunctions = ROUTE_FUNCTION_MAP[matchingRoute];
  
  // User cần ít nhất 1 trong các function codes yêu cầu
  return requiredFunctions.some(func => functionSet.has(func));
}

/**
 * Check if user can access route
 * KHÔNG BYPASS THEO ROLE
 * 
 * @deprecated Sử dụng canAccessRouteByFunction với functionCodes từ session
 */
export function canAccessRoute(
  userFunctions: Set<string> | string[], 
  routePath: string
): boolean {
  return canAccessRouteByFunction(userFunctions, routePath);
}

/**
 * Get default dashboard route
 * 
 * v8.3: Luôn trả về /dashboard
 * Dashboard page sẽ tự động hiển thị content phù hợp dựa trên functionCodes
 * 
 * @deprecated Role-based routing không còn được sử dụng
 */
export function getDefaultDashboard(_userRole?: string): string {
  // Middleware v8.3 luôn redirect về /dashboard
  // Dashboard page sẽ render content dựa trên permissions
  return '/dashboard';
}
