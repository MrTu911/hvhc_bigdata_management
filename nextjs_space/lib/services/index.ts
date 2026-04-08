/**
 * Service Layer Exports
 * Cung cấp các services với scope-based filtering
 */

export { BaseService, type ScopedQueryOptions, type PaginationOptions, type ServiceResult } from './base-service';
export { PersonnelService, type PersonnelWithRelations, type PersonnelFilters } from './personnel-service';
export { StudentService, type StudentWithRelations, type StudentFilters } from './student-service';
export { FacultyService, type FacultyWithRelations, type FacultyFilters } from './faculty-service';
export { AdminService, type UserWithRelations, type UserFilters, type AuditFilters } from './admin-service';
export { PolicyService, type PolicyRecordWithRelations, type PolicyFilters } from './policy-service';
