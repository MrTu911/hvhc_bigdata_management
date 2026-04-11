-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('SO_YEU_LY_LICH', 'ANH_THE', 'QUYET_DINH_BO_NHIEM', 'BANG_CAP', 'HO_SO_KHAC');

-- CreateEnum
CREATE TYPE "ResearchWorkflowStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GradeWorkflowStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'QUAN_TRI_HE_THONG', 'CHI_HUY_HOC_VIEN', 'CHI_HUY_KHOA_PHONG', 'CHI_HUY_HE', 'CHI_HUY_TIEU_DOAN', 'CHI_HUY_BAN', 'CHI_HUY_BO_MON', 'CHU_NHIEM_BO_MON', 'GIANG_VIEN', 'NGHIEN_CUU_VIEN', 'HOC_VIEN', 'HOC_VIEN_SINH_VIEN', 'TRO_LY', 'NHAN_VIEN', 'KY_THUAT_VIEN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PersonnelCategory" AS ENUM ('CAN_BO_CHI_HUY', 'GIANG_VIEN', 'NGHIEN_CUU_VIEN', 'CONG_NHAN_VIEN', 'HOC_VIEN_QUAN_SU', 'SINH_VIEN_DAN_SU');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'RETIRED', 'SUSPENDED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "ManagementLevel" AS ENUM ('TRUNG_UONG', 'QUAN_CHUNG', 'HOC_VIEN', 'DON_VI');

-- CreateEnum
CREATE TYPE "ManagementCategory" AS ENUM ('CAN_BO', 'QUAN_LUC');

-- CreateEnum
CREATE TYPE "PermissionModule" AS ENUM ('DASHBOARD', 'USER_MANAGEMENT', 'DATA_LAKE', 'ML_TRAINING', 'RESEARCH', 'ANALYTICS', 'REPORTS', 'SYSTEM_CONFIG', 'AUDIT_LOGS', 'FILES', 'DATASETS', 'TRAINING', 'GOVERNANCE');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'APPROVE', 'MANAGE', 'EXECUTE');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('ALL', 'DEPARTMENT', 'OWN');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('POSTGRESQL', 'MINIO', 'AIRFLOW', 'CLICKHOUSE', 'PROMETHEUS', 'SUPERSET', 'KAFKA', 'HADOOP', 'SPARK', 'GRAFANA', 'ZOOKEEPER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DagStatus" AS ENUM ('SUCCESS', 'FAILED', 'RUNNING', 'QUEUED', 'PAUSED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "LogCategory" AS ENUM ('AUTH', 'USER_MANAGEMENT', 'SERVICE_MONITORING', 'DATA_PROCESSING', 'SYSTEM', 'SECURITY', 'TRAINING');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('RESEARCH_PAPER', 'DATASET', 'MODEL', 'REPORT', 'PRESENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ClassificationLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET');

-- CreateEnum
CREATE TYPE "AccessAction" AS ENUM ('VIEW', 'DOWNLOAD', 'EDIT', 'DELETE', 'SHARE');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QueryType" AS ENUM ('POSTGRESQL', 'CLICKHOUSE', 'HADOOP', 'SPARK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('CLASSIFICATION', 'REGRESSION', 'CLUSTERING', 'NEURAL_NETWORK', 'DEEP_LEARNING', 'NLP', 'COMPUTER_VISION', 'TIME_SERIES', 'REINFORCEMENT_LEARNING', 'OTHER');

-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('DRAFT', 'TRAINING', 'TRAINED', 'VALIDATING', 'DEPLOYED', 'DEPRECATED', 'FAILED');

-- CreateEnum
CREATE TYPE "ModelFramework" AS ENUM ('TENSORFLOW', 'PYTORCH', 'KERAS', 'SCIKIT_LEARN', 'XGBOOST', 'LIGHTGBM', 'CATBOOST', 'HUGGINGFACE', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DatasetType" AS ENUM ('CSV', 'JSON', 'PARQUET', 'AVRO', 'XML', 'TEXT', 'BINARY');

-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'UPLOAD', 'DOWNLOAD', 'EXPORT', 'SHARE', 'PERMISSION_CHANGE', 'CONFIG_CHANGE', 'FAILED_LOGIN', 'UNAUTHORIZED_ACCESS', 'DATA_BREACH_ATTEMPT');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('DAI_HOC', 'THAC_SI', 'TIEN_SI', 'CU_NHAN_NGOAI_NGU', 'KHAC');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('GIAO_TRINH', 'TAI_LIEU', 'BAI_TAP', 'BAI_BAO', 'SANG_KIEN', 'DE_TAI', 'GIAO_TRINH_DT');

-- CreateEnum
CREATE TYPE "PublicationRole" AS ENUM ('CHU_BIEN', 'THAM_GIA', 'DONG_TAC_GIA');

-- CreateEnum
CREATE TYPE "ResearchRole" AS ENUM ('CHU_NHIEM', 'THAM_GIA', 'THANH_VIEN');

-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('KHEN_THUONG', 'KY_LUAT');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('THEORY', 'LAB', 'COMPUTER', 'LANGUAGE', 'LIBRARY', 'SEMINAR', 'WORKSHOP');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('UNDERGRADUATE', 'GRADUATE', 'VOCATIONAL', 'SHORT_COURSE', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ARCHIVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('REQUIRED', 'ELECTIVE', 'CORE', 'GENERAL', 'SPECIALIZED', 'THESIS', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "ClassSectionStatus" AS ENUM ('OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'WITHDRAWN', 'COMPLETED', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('THEORY', 'PRACTICE', 'LAB', 'SEMINAR', 'EXAM', 'REVIEW');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED', 'MAKEUP');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE', 'EARLY_LEAVE');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('MIDTERM', 'FINAL', 'QUIZ', 'PRACTICAL', 'ORAL');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('PENDING', 'GRADED', 'PUBLISHED', 'APPEALED', 'FINALIZED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AcademicWarningLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InfraConfigType" AS ENUM ('NAS', 'TRAINING_SERVER', 'BACKUP_SERVER');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('UPLOAD', 'DOWNLOAD', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CareerEventType" AS ENUM ('ENLISTMENT', 'PROMOTION', 'APPOINTMENT', 'TRANSFER', 'TRAINING', 'AWARD', 'DISCIPLINE', 'RETIREMENT', 'DISCHARGE', 'OTHER', 'RANK_DEMOTION', 'SECONDMENT', 'STUDY_LEAVE', 'RETURN', 'RETIREMENT_PREP', 'UNIT_CHANGE', 'POSITION_CHANGE');

-- CreateEnum
CREATE TYPE "PartyOrganizationType" AS ENUM ('DANG_UY', 'CHI_BO', 'DANG_BO_BO_PHAN', 'TO_DANG');

-- CreateEnum
CREATE TYPE "PartyOrgLevel" AS ENUM ('DANG_UY_HOC_VIEN', 'DANG_BO', 'CHI_BO_CO_SO', 'CHI_BO_GHEP');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('THUONG_KY', 'BAT_THUONG', 'MO_RONG', 'CHUYEN_DE', 'KIEM_DIEM_CUOI_NAM', 'BAU_CU');

-- CreateEnum
CREATE TYPE "ReviewGrade" AS ENUM ('HTXSNV', 'HTTNV', 'HTNV', 'KHNV');

-- CreateEnum
CREATE TYPE "ReviewSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisciplineSeverity" AS ENUM ('KHIEN_TRACH', 'CANH_CAO', 'CACH_CHUC', 'KHAI_TRU_KHOI_DANG');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('CHUYEN_SINH_HOAT_TAM_THOI', 'CHUYEN_DANG_CHINH_THUC');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('KIEM_TRA_DINH_KY', 'KIEM_TRA_KHI_CO_DAU_HIEU', 'GIAM_SAT_CHUYEN_DE', 'PHUC_KET_KY_LUAT');

-- CreateEnum
CREATE TYPE "PartyPosition" AS ENUM ('BI_THU', 'PHO_BI_THU', 'CAP_UY_VIEN', 'DANG_VIEN', 'BI_THU_CHI_BO', 'PHO_BI_THU_CHI_BO', 'TO_TRUONG_TO_DANG', 'TO_PHO_TO_DANG');

-- CreateEnum
CREATE TYPE "PartyHistoryType" AS ENUM ('ADMITTED', 'OFFICIAL_CONFIRMED', 'TRANSFER_IN', 'TRANSFER_OUT', 'APPOINTED', 'REMOVED_POSITION', 'STATUS_CHANGED', 'SUSPENDED', 'EXPELLED', 'RESTORED', 'OTHER');

-- CreateEnum
CREATE TYPE "PartyMemberStatus" AS ENUM ('QUAN_CHUNG', 'CAM_TINH', 'DOI_TUONG', 'DU_BI', 'CHINH_THUC', 'CHUYEN_DI', 'XOA_TEN_TU_NGUYEN', 'KHAI_TRU', 'ACTIVE', 'TRANSFERRED', 'SUSPENDED', 'EXPELLED');

-- CreateEnum
CREATE TYPE "PartyLifecycleEventType" AS ENUM ('STATUS_TRANSITION', 'DEADLINE_COMPUTED', 'DEADLINE_ALERT', 'DEADLINE_OVERDUE', 'DEADLINE_RESOLVED');

-- CreateEnum
CREATE TYPE "PartyLifecycleAlertType" AS ENUM ('DU_BI_DUE_SOON', 'DU_BI_OVERDUE');

-- CreateEnum
CREATE TYPE "RecruitmentStep" AS ENUM ('THEO_DOI', 'HOC_CAM_TINH', 'DOI_TUONG', 'CHI_BO_XET', 'CAP_TREN_DUYET', 'DA_KET_NAP');

-- CreateEnum
CREATE TYPE "PartyActivityType" AS ENUM ('MEETING', 'STUDY', 'CRITICISM', 'VOLUNTEER', 'EVALUATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AwardWorkflowStatus" AS ENUM ('PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PolicyRecordType" AS ENUM ('EMULATION', 'REWARD', 'DISCIPLINE');

-- CreateEnum
CREATE TYPE "PolicyLevel" AS ENUM ('STATE', 'GOVERNMENT', 'NATIONAL', 'MINISTRY', 'ACADEMY', 'UNIT', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "PolicyForm" AS ENUM ('LAO_DONG_TIEN_TIEN', 'CHIEN_SI_THI_DUA_CO_SO', 'CHIEN_SI_THI_DUA_CAP_BO', 'DON_VI_TIEN_TIEN', 'DON_VI_QUYET_THANG', 'GIAY_KHEN', 'BANG_KHEN', 'HUY_CHUONG', 'HUAN_CHUONG', 'KHEN_THUONG_DOT_XUAT', 'KHIEN_TRACH', 'CANH_CAO', 'HA_BAC_LUONG', 'GIANG_CHUC', 'CACH_CHUC', 'TUOC_DANH_HIEU', 'BUOC_THOI_VIEC', 'OTHER');

-- CreateEnum
CREATE TYPE "PolicyRecordStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "MedicalRecordType" AS ENUM ('ANNUAL_CHECK', 'TREATMENT', 'VACCINATION', 'INJURY', 'OTHER');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('DANG_HOC', 'TAM_NGHI', 'DINH_CHI', 'NGHI_HOC', 'TOT_NGHIEP', 'CHUYEN_TRUONG');

-- CreateEnum
CREATE TYPE "FamilyRelationType" AS ENUM ('FATHER', 'MOTHER', 'SPOUSE', 'CHILD', 'SIBLING', 'FATHER_IN_LAW', 'MOTHER_IN_LAW', 'OTHER');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('PERSONNEL_VIEW', 'PERSONNEL_EDIT', 'PERSONNEL_EDIT_SENSITIVE', 'PERSONNEL_EXPORT', 'PERSONNEL_DELETE', 'PERSONNEL_APPROVE');

-- CreateEnum
CREATE TYPE "PermissionScopeType" AS ENUM ('ALL', 'UNIT', 'PERSONNEL', 'SELF');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIAnalysisType" AS ENUM ('STABILITY_INDEX', 'PROMOTION_FORECAST', 'HEALTH_TREND', 'PERFORMANCE_INSIGHT', 'ATTRITION_RISK', 'CAREER_PATH');

-- CreateEnum
CREATE TYPE "ManagingOrgan" AS ENUM ('BAN_CAN_BO', 'BAN_QUAN_LUC', 'PHONG_DAO_TAO', 'PHONG_CHINH_TRI');

-- CreateEnum
CREATE TYPE "PersonnelStatus" AS ENUM ('DANG_CONG_TAC', 'NGHI_HUU', 'CHUYEN_CONG_TAC', 'DI_HOC', 'TAM_NGHI', 'XUAT_NGU', 'TU_TRAN');

-- CreateEnum
CREATE TYPE "PersonnelEventType" AS ENUM ('CREATED', 'UPDATED', 'CAREER_CHANGE', 'UNIT_CHANGE', 'PARTY_STATUS', 'INSURANCE_UPDATE', 'FAMILY_UPDATE', 'POLICY_RECORD', 'ACCOUNT_CREATED', 'ACCOUNT_DISABLED', 'RANK_PROMOTION', 'EDUCATION_UPDATE');

-- CreateEnum
CREATE TYPE "ConflictSeverity" AS ENUM ('WARN', 'BLOCK');

-- CreateEnum
CREATE TYPE "PolicyRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PolicyWorkflowAction" AS ENUM ('CREATE', 'UPDATE', 'SUBMIT', 'REVIEW', 'APPROVE', 'REJECT', 'CANCEL', 'COMPLETE', 'REOPEN');

-- CreateEnum
CREATE TYPE "InsuranceTransactionType" AS ENUM ('CONTRIBUTION', 'BENEFIT', 'ADJUSTMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "InsuranceBenefitType" AS ENUM ('SICK_LEAVE', 'MATERNITY', 'RETIREMENT', 'DEATH', 'OCCUPATIONAL', 'UNEMPLOYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DependentRelationship" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDPARENT', 'GRANDCHILD', 'OTHER');

-- CreateEnum
CREATE TYPE "DependentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "PositionScope" AS ENUM ('SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY');

-- CreateEnum
CREATE TYPE "FunctionScope" AS ENUM ('SELF', 'UNIT', 'DEPARTMENT', 'ACADEMY');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'SUBMIT');

-- CreateEnum
CREATE TYPE "OfficerRank" AS ENUM ('DAI_TUONG', 'THUONG_TUONG', 'TRUNG_TUONG', 'THIEU_TUONG', 'DAI_TA', 'THUONG_TA', 'TRUNG_TA', 'THIEU_TA', 'DAI_UY', 'THUONG_UY', 'TRUNG_UY', 'THIEU_UY');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('THANG_CAP', 'BO_NHIEM', 'DIEU_DONG', 'LUAN_CHUYEN', 'GIANG_CHUC', 'CACH_CHUC', 'NGHI_HUU', 'XUAT_NGU');

-- CreateEnum
CREATE TYPE "PromotionSpecialCaseType" AS ENUM ('CHIEN_SI_THI_DUA_TOAN_QUAN', 'TIEN_SI', 'THANH_TICH_DAC_BIET', 'NGHI_QUYET_CAP_TREN', 'KHAC');

-- CreateEnum
CREATE TYPE "SoldierRank" AS ENUM ('THUONG_SI', 'TRUNG_SI', 'HA_SI', 'BINH_NHAT', 'BINH_NHI');

-- CreateEnum
CREATE TYPE "SoldierCategory" AS ENUM ('QNCN', 'CNVQP', 'HSQ', 'CHIEN_SI');

-- CreateEnum
CREATE TYPE "SoldierServiceType" AS ENUM ('NGHIA_VU', 'HOP_DONG', 'CHUYEN_NGHIEP');

-- CreateEnum
CREATE TYPE "InsuranceClaimType" AS ENUM ('SICK_LEAVE', 'MATERNITY', 'OCCUPATIONAL_DISEASE', 'WORK_ACCIDENT', 'RETIREMENT', 'SURVIVORSHIP', 'UNEMPLOYMENT', 'MEDICAL_EXPENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MedicalFacilityType" AS ENUM ('MILITARY_HOSPITAL', 'CENTRAL_HOSPITAL', 'PROVINCIAL_HOSPITAL', 'DISTRICT_HOSPITAL', 'CLINIC', 'HEALTH_CENTER', 'OTHER');

-- CreateEnum
CREATE TYPE "ExamPlanType" AS ENUM ('MIDTERM', 'FINAL', 'SUPPLEMENTARY', 'MAKEUP', 'ENTRANCE', 'GRADUATION');

-- CreateEnum
CREATE TYPE "ExamPlanStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExamFormat" AS ENUM ('WRITTEN', 'MULTIPLE_CHOICE', 'ORAL', 'PRACTICAL', 'PROJECT', 'MIXED');

-- CreateEnum
CREATE TYPE "ExamSessionStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "ExamRegStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'ABSENT', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "QuestionContentType" AS ENUM ('TEXT', 'RICH_TEXT', 'IMAGE', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MATCHING', 'ESSAY', 'LONG_ESSAY', 'CALCULATION', 'CODE');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REVIEW', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('DOCUMENT', 'PRESENTATION', 'VIDEO', 'AUDIO', 'IMAGE', 'SPREADSHEET', 'CODE', 'INTERACTIVE', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialAccessLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "LabType" AS ENUM ('COMPUTER', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ELECTRONICS', 'MECHANICAL', 'SIMULATION', 'LANGUAGE', 'MILITARY', 'OTHER');

-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLOSED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('COMPUTER', 'SERVER', 'NETWORK', 'PROJECTOR', 'PRINTER', 'SCANNER', 'CAMERA', 'AUDIO', 'LAB_INSTRUMENT', 'MEASURING', 'MILITARY_EQUIP', 'FURNITURE', 'OTHER');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'DEGRADED', 'UNDER_REPAIR', 'OUT_OF_SERVICE', 'RETIRED');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ROUTINE', 'REPAIR', 'UPGRADE', 'INSPECTION', 'CALIBRATION');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabSessionStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdministrativeLevel" AS ENUM ('PROVINCE', 'DISTRICT', 'WARD');

-- CreateEnum
CREATE TYPE "ProvinceType" AS ENUM ('TINH', 'THANH_PHO');

-- CreateEnum
CREATE TYPE "CommuneType" AS ENUM ('XA', 'PHUONG', 'DAC_KHU');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('DONG_BAC_BO', 'TAY_BAC_BO', 'DONG_BANG_SONG_HONG', 'BAC_TRUNG_BO', 'DUYEN_HAI_NAM_TRUNG_BO', 'TAY_NGUYEN', 'DONG_NAM_BO', 'DONG_BANG_SONG_CUU_LONG');

-- CreateEnum
CREATE TYPE "MdCacheType" AS ENUM ('STATIC', 'SEMI', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "MdSourceType" AS ENUM ('LOCAL', 'BQP', 'NATIONAL', 'ISO');

-- CreateEnum
CREATE TYPE "MdSyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "MdChangeType" AS ENUM ('CREATE', 'UPDATE', 'DEACTIVATE', 'REACTIVATE');

-- CreateEnum
CREATE TYPE "NckhProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NckhProjectPhase" AS ENUM ('PROPOSAL', 'CONTRACT', 'EXECUTION', 'MIDTERM_REVIEW', 'FINAL_REVIEW', 'ACCEPTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NckhCategory" AS ENUM ('CAP_HOC_VIEN', 'CAP_TONG_CUC', 'CAP_BO_QUOC_PHONG', 'CAP_NHA_NUOC', 'SANG_KIEN_CO_SO');

-- CreateEnum
CREATE TYPE "NckhType" AS ENUM ('CO_BAN', 'UNG_DUNG', 'TRIEN_KHAI', 'SANG_KIEN_KINH_NGHIEM');

-- CreateEnum
CREATE TYPE "NckhField" AS ENUM ('HOC_THUAT_QUAN_SU', 'HAU_CAN_KY_THUAT', 'KHOA_HOC_XA_HOI', 'KHOA_HOC_TU_NHIEN', 'CNTT', 'Y_DUOC', 'KHAC');

-- CreateEnum
CREATE TYPE "NckhMemberRole" AS ENUM ('CHU_NHIEM', 'THU_KY_KHOA_HOC', 'THANH_VIEN_CHINH', 'CONG_TAC_VIEN');

-- CreateEnum
CREATE TYPE "NckhMilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NckhReviewType" AS ENUM ('THAM_DINH_DE_CUONG', 'KIEM_TRA_GIUA_KY', 'NGHIEM_THU_CO_SO', 'NGHIEM_THU_CAP_HV', 'NGHIEM_THU_CAP_TREN');

-- CreateEnum
CREATE TYPE "NckhReviewDecision" AS ENUM ('PASSED', 'FAILED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "NckhPublicationType" AS ENUM ('BAI_BAO_QUOC_TE', 'BAI_BAO_TRONG_NUOC', 'SACH_CHUYEN_KHAO', 'GIAO_TRINH', 'SANG_KIEN', 'PATENT', 'BAO_CAO_KH', 'LUAN_VAN', 'LUAN_AN');

-- CreateEnum
CREATE TYPE "NckhPublicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EduStudentStatus" AS ENUM ('ACTIVE', 'TEMP_SUSPENDED', 'STUDY_DELAY', 'REPEATING', 'DROPPED_OUT', 'GRADUATED', 'RESERVED');

-- CreateEnum
CREATE TYPE "ProgramVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ThesisStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'DEFENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GraduationAuditStatus" AS ENUM ('PENDING', 'ELIGIBLE', 'INELIGIBLE', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkflowVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowStepType" AS ENUM ('START', 'TASK', 'APPROVAL', 'SIGNATURE', 'END');

-- CreateEnum
CREATE TYPE "WorkflowInstanceStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('WAITING', 'READY', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'RETURNED', 'SKIPPED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkflowActionCode" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'RETURN', 'CANCEL', 'SIGN', 'COMMENT', 'REASSIGN', 'ESCALATE', 'SYSTEM_TIMEOUT');

-- CreateEnum
CREATE TYPE "WorkflowSignatureStatus" AS ENUM ('PENDING', 'SIGNED', 'FAILED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EisTrend" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "WorkloadAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AcademicPerformanceStatus" AS ENUM ('NORMAL', 'WARNING', 'PROBATION', 'SUSPENDED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'HOC_VIEN',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "militaryId" TEXT,
    "rank" TEXT,
    "department" TEXT,
    "unit" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "employeeId" TEXT,
    "endDate" TIMESTAMP(3),
    "personnelType" "PersonnelCategory",
    "position" TEXT,
    "startDate" TIMESTAMP(3),
    "unitId" TEXT,
    "educationLevel" TEXT,
    "joinDate" TIMESTAMP(3),
    "placeOfOrigin" TEXT,
    "specialization" TEXT,
    "workStatus" "WorkStatus" NOT NULL DEFAULT 'ACTIVE',
    "birthPlace" TEXT,
    "bloodType" "BloodType",
    "citizenId" TEXT,
    "dischargeDate" TIMESTAMP(3),
    "enlistmentDate" TIMESTAMP(3),
    "ethnicity" TEXT,
    "managementLevel" "ManagementLevel",
    "militaryIdNumber" TEXT,
    "officerIdCard" TEXT,
    "permanentAddress" TEXT,
    "religion" TEXT,
    "temporaryAddress" TEXT,
    "personnelId" TEXT,
    "managementCategory" "ManagementCategory",
    "partyJoinDate" TIMESTAMP(3),
    "partyPosition" TEXT,
    "academicTitle" TEXT,
    "technicalPosition" TEXT,
    "technicalCertNumber" TEXT,
    "technicalCertDate" TIMESTAMP(3),
    "technicalCertIssuer" TEXT,
    "positionId" TEXT,
    "ethnicityId" TEXT,
    "religionId" TEXT,
    "specializationId" TEXT,
    "birthPlaceId" TEXT,
    "placeOfOriginId" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'LOCAL',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lastSsoLoginAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT,
    "academicRank" TEXT,
    "academicDegree" TEXT,
    "specialization" TEXT,
    "teachingSubjects" JSONB,
    "researchInterests" TEXT,
    "researchProjects" INTEGER NOT NULL DEFAULT 0,
    "publications" INTEGER NOT NULL DEFAULT 0,
    "citations" INTEGER NOT NULL DEFAULT 0,
    "teachingExperience" INTEGER NOT NULL DEFAULT 0,
    "industryExperience" INTEGER NOT NULL DEFAULT 0,
    "biography" TEXT,
    "achievements" JSONB,
    "certifications" JSONB,
    "linkedinUrl" TEXT,
    "googleScholarUrl" TEXT,
    "researchGateUrl" TEXT,
    "orcidId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "unitId" TEXT,
    "personnelId" TEXT,
    "teachingPosition" TEXT,
    "teachingStart" TIMESTAMP(3),
    "weeklyHoursLimit" DOUBLE PRECISION NOT NULL DEFAULT 16,

    CONSTRAINT "faculty_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "fullName" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bigdata_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "url" TEXT,
    "username" TEXT,
    "password" TEXT,
    "lastChecked" TIMESTAMP(3),
    "uptime" DOUBLE PRECISION DEFAULT 0,
    "version" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bigdata_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_metrics" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "cpuUsage" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "diskUsage" DOUBLE PRECISION,
    "networkIn" DOUBLE PRECISION,
    "networkOut" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_alerts" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "service_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airflow_dags" (
    "id" TEXT NOT NULL,
    "dagId" TEXT NOT NULL,
    "dagName" TEXT NOT NULL,
    "description" TEXT,
    "status" "DagStatus" NOT NULL,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "lastRunTime" TIMESTAMP(3),
    "nextRunTime" TIMESTAMP(3),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airflow_dags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dag_runs" (
    "id" TEXT NOT NULL,
    "dagId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "status" "DagStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "logUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "dag_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "level" "LogLevel" NOT NULL,
    "category" "LogCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_files" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" "FileType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "fileUrl" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "department" TEXT,
    "researchArea" TEXT,
    "tags" TEXT[],
    "status" "FileStatus" NOT NULL DEFAULT 'UPLOADING',
    "title" TEXT,
    "description" TEXT,
    "keywords" TEXT[],
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checksum" TEXT,
    "classification" "ClassificationLevel" NOT NULL DEFAULT 'INTERNAL',
    "digitalSignature" TEXT,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "research_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_access_logs" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AccessAction" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_queries" (
    "id" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "queryType" "QueryType" NOT NULL,
    "executedBy" TEXT NOT NULL,
    "department" TEXT,
    "status" "QueryStatus" NOT NULL DEFAULT 'PENDING',
    "executionTime" DOUBLE PRECISION,
    "rowsReturned" INTEGER,
    "dataSize" DOUBLE PRECISION,
    "resultUrl" TEXT,
    "errorMessage" TEXT,
    "parameters" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "data_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_summaries" (
    "id" TEXT NOT NULL,
    "summaryType" TEXT NOT NULL,
    "summaryDate" TIMESTAMP(3) NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "newUsers" INTEGER NOT NULL,
    "totalServices" INTEGER NOT NULL,
    "healthyServices" INTEGER NOT NULL,
    "downServices" INTEGER NOT NULL,
    "totalFiles" INTEGER NOT NULL,
    "totalQueries" INTEGER NOT NULL,
    "totalStorage" DOUBLE PRECISION NOT NULL,
    "dataUploaded" DOUBLE PRECISION NOT NULL,
    "queriesExecuted" INTEGER NOT NULL,
    "avgQueryTime" DOUBLE PRECISION NOT NULL,
    "avgCpuUsage" DOUBLE PRECISION NOT NULL,
    "avgMemoryUsage" DOUBLE PRECISION NOT NULL,
    "avgDiskUsage" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modelType" "ModelType" NOT NULL,
    "framework" "ModelFramework" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "department" TEXT,
    "researchArea" TEXT,
    "classification" "ClassificationLevel" NOT NULL DEFAULT 'INTERNAL',
    "trainingDatasetId" TEXT,
    "validationDatasetId" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "parentId" TEXT,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "bucketName" TEXT,
    "modelPath" TEXT,
    "configPath" TEXT,
    "hyperparameters" JSONB,
    "trainingConfig" JSONB,
    "accuracy" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1Score" DOUBLE PRECISION,
    "loss" DOUBLE PRECISION,
    "customMetrics" JSONB,
    "status" "ModelStatus" NOT NULL DEFAULT 'DRAFT',
    "trainingStartedAt" TIMESTAMP(3),
    "trainingCompletedAt" TIMESTAMP(3),
    "trainingDuration" DOUBLE PRECISION,
    "deployedAt" TIMESTAMP(3),
    "deploymentUrl" TEXT,
    "predictionCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_jobs" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "jobType" TEXT NOT NULL DEFAULT 'training',
    "config" JSONB,
    "hyperparameters" JSONB,
    "trainingDataset" TEXT,
    "validationDataset" TEXT,
    "testDataset" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "gpuAllocated" INTEGER,
    "cpuAllocated" INTEGER,
    "memoryAllocated" DOUBLE PRECISION,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentEpoch" INTEGER,
    "totalEpochs" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "finalMetrics" JSONB,
    "logPath" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_predictions" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "userId" TEXT,
    "inputData" JSONB NOT NULL,
    "outputData" JSONB NOT NULL,
    "inferenceTime" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "isCorrect" BOOLEAN,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_pipelines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pipelineType" TEXT NOT NULL,
    "inputDataset" TEXT NOT NULL,
    "outputDataset" TEXT,
    "steps" JSONB NOT NULL,
    "parameters" JSONB,
    "status" "PipelineStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "recordsProcessed" INTEGER,
    "errorCount" INTEGER,
    "logPath" TEXT,
    "errorMessage" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_artifacts" (
    "id" VARCHAR(255) NOT NULL,
    "experiment_id" VARCHAR(255) NOT NULL,
    "artifact_name" VARCHAR(255) NOT NULL,
    "artifact_type" VARCHAR(50),
    "artifact_path" TEXT,
    "file_size" BIGINT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_metrics" (
    "id" VARCHAR(255) NOT NULL,
    "experiment_id" VARCHAR(255) NOT NULL,
    "metric_name" VARCHAR(255) NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "step" INTEGER DEFAULT 0,
    "epoch" INTEGER DEFAULT 0,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_experiments" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "model_id" VARCHAR(255),
    "parameters" JSONB DEFAULT '{}',
    "tags" JSONB DEFAULT '[]',
    "status" VARCHAR(50) DEFAULT 'pending',
    "results" JSONB DEFAULT '{}',
    "start_time" TIMESTAMP(6),
    "end_time" TIMESTAMP(6),
    "created_by" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_workflows" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "model_id" VARCHAR(255),
    "steps" JSONB DEFAULT '[]',
    "schedule" JSONB DEFAULT '{}',
    "parameters" JSONB DEFAULT '{}',
    "status" VARCHAR(50) DEFAULT 'draft',
    "created_by" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_versions" (
    "id" VARCHAR(255) NOT NULL,
    "model_id" VARCHAR(255) NOT NULL,
    "version_number" INTEGER NOT NULL,
    "description" TEXT,
    "experiment_id" VARCHAR(255),
    "metrics" JSONB DEFAULT '{}',
    "artifact_path" TEXT,
    "tags" JSONB DEFAULT '[]',
    "stage" VARCHAR(50) DEFAULT 'development',
    "status" VARCHAR(50) DEFAULT 'draft',
    "notes" TEXT,
    "created_by" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" VARCHAR(255) NOT NULL,
    "workflow_id" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "parameters" JSONB DEFAULT '{}',
    "current_step" INTEGER DEFAULT 0,
    "progress" INTEGER DEFAULT 0,
    "results" JSONB DEFAULT '{}',
    "error" TEXT,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "started_by" VARCHAR(255),

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "commanderId" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "path" TEXT,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_attachments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileType" "AttachmentType" NOT NULL,
    "mimeType" TEXT,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "personnel_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingSubject" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectCode" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "semester" TEXT,
    "academicYear" TEXT,
    "department" TEXT,
    "description" TEXT,
    "syllabus" TEXT,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectCode" TEXT,
    "field" TEXT,
    "level" TEXT,
    "fundingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startYear" TEXT,
    "endYear" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Đang thực hiện',
    "description" TEXT,
    "outcomes" TEXT,
    "publications" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approverNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewerNote" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "workflowStatus" "ResearchWorkflowStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hoc_vien" (
    "id" TEXT NOT NULL,
    "maHocVien" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "ngaySinh" TIMESTAMP(3),
    "gioiTinh" TEXT,
    "lop" TEXT,
    "khoaHoc" TEXT,
    "nganh" TEXT,
    "giangVienHuongDanId" TEXT,
    "email" TEXT,
    "dienThoai" TEXT,
    "diaChi" TEXT,
    "diemTrungBinh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trangThai" TEXT NOT NULL DEFAULT 'Đang học',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cohortId" TEXT,
    "classId" TEXT,
    "majorId" TEXT,
    "userId" TEXT,
    "academicStatus" "AcademicPerformanceStatus" NOT NULL DEFAULT 'NORMAL',
    "currentStatus" "EduStudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "studyMode" TEXT,
    "currentProgramVersionId" TEXT,
    "heDaoTao" TEXT,
    "khoaQuanLy" TEXT,
    "trungDoi" TEXT,
    "daiDoi" TEXT,
    "xepLoaiHocLuc" TEXT,
    "tongTinChi" INTEGER,
    "tinChiTichLuy" INTEGER,
    "ngayNhapHoc" TIMESTAMP(3),
    "ngayTotNghiep" TIMESTAMP(3),
    "lyDoNghiHoc" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "hoc_vien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ket_qua_hoc_tap" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "monHoc" TEXT NOT NULL,
    "maMon" TEXT,
    "diem" DOUBLE PRECISION,
    "diemQuaTrinh" DOUBLE PRECISION,
    "diemThi" DOUBLE PRECISION,
    "hocKy" TEXT,
    "namHoc" TEXT,
    "ketQua" TEXT,
    "xepLoai" TEXT,
    "nhanXet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diemBaiTap" DOUBLE PRECISION,
    "diemChuyenCan" DOUBLE PRECISION,
    "diemGiuaKy" DOUBLE PRECISION,
    "diemTongKet" DOUBLE PRECISION,
    "giangVienId" TEXT,
    "heSoMonHocId" TEXT,
    "soTinChi" INTEGER NOT NULL DEFAULT 3,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "workflowStatus" "GradeWorkflowStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "ket_qua_hoc_tap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_conduct_records" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semesterCode" TEXT NOT NULL,
    "conductScore" DOUBLE PRECISION NOT NULL,
    "conductGrade" TEXT,
    "rewardSummary" TEXT,
    "disciplineSummary" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_conduct_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_histories" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "changedBy" TEXT,
    "oldValues" JSONB NOT NULL,
    "newValues" JSONB NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_warnings" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semesterCode" TEXT NOT NULL,
    "warningLevel" "AcademicWarningLevel" NOT NULL,
    "warningReasonJson" JSONB,
    "suggestedAction" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "he_so_mon_hoc" (
    "id" TEXT NOT NULL,
    "maMon" TEXT NOT NULL,
    "tenMon" TEXT NOT NULL,
    "heSoChuyenCan" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "heSoGiuaKy" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "heSoBaiTap" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "heSoThi" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "soTinChi" INTEGER NOT NULL DEFAULT 3,
    "loaiMon" TEXT,
    "khoa" TEXT,
    "moTa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "he_so_mon_hoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_analyses" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT,
    "text" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "keywords" JSONB NOT NULL,
    "summary" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentiment_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "targetId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "pdfPath" TEXT,
    "excelPath" TEXT,
    "summary" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_api_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestData" JSONB,
    "responseData" JSONB,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_registry" (
    "id" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "inputData" JSONB NOT NULL,
    "predictionData" JSONB NOT NULL,
    "actualData" JSONB,
    "confidence" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "feedbackScore" INTEGER,
    "feedbackText" TEXT,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_configurations" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'abacus',
    "apiKeyHash" TEXT,
    "baseUrl" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4-turbo-preview',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "offlineMode" BOOLEAN NOT NULL DEFAULT false,
    "lastTokenRefresh" TIMESTAMP(3),
    "tokenExpiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "level" "EducationLevel" NOT NULL,
    "trainingSystem" TEXT,
    "studyMode" TEXT,
    "major" TEXT,
    "institution" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "gpa" DOUBLE PRECISION,
    "thesisTitle" TEXT,
    "supervisor" TEXT,
    "certificateCode" TEXT,
    "certificateDate" TIMESTAMP(3),
    "defenseDate" TIMESTAMP(3),
    "defenseLocation" TEXT,
    "examSubject" TEXT,
    "classification" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_status_history" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "fromStatus" "WorkStatus",
    "toStatus" "WorkStatus" NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "decisionNumber" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_experience" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_publications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PublicationType" NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "role" "PublicationRole" NOT NULL,
    "publisher" TEXT,
    "organization" TEXT,
    "issueNumber" TEXT,
    "pageNumbers" TEXT,
    "targetUsers" TEXT,
    "coAuthors" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scientific_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_research" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "role" "ResearchRole" NOT NULL,
    "level" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "institution" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scientific_research_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AwardType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "awardedBy" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awards_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "summary" TEXT,
    "pdfPath" TEXT,
    "lastExported" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scientific_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foreign_language_certs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "certType" TEXT NOT NULL,
    "certLevel" TEXT,
    "framework" TEXT,
    "certNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "issuer" TEXT,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foreign_language_certs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certType" TEXT NOT NULL,
    "certName" TEXT NOT NULL,
    "certNumber" TEXT,
    "classification" TEXT,
    "issueDate" TIMESTAMP(3),
    "issuer" TEXT,
    "decisionNumber" TEXT,
    "decisionDate" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "departmentId" TEXT,
    "facultyId" TEXT,
    "semester" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "roomId" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "syllabus" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT,
    "floor" INTEGER,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "roomType" "RoomType" NOT NULL DEFAULT 'THEORY',
    "equipment" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL DEFAULT 'FINAL',
    "examDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 90,
    "roomId" TEXT,
    "invigilatorId" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "instructions" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_records" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "midtermScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "assignmentScore" DOUBLE PRECISION,
    "attendanceScore" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "letterGrade" TEXT,
    "status" "GradeStatus" NOT NULL DEFAULT 'PENDING',
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "termNumber" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationStart" TIMESTAMP(3),
    "registrationEnd" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "programType" "ProgramType" NOT NULL DEFAULT 'UNDERGRADUATE',
    "degreeLevel" TEXT,
    "totalCredits" INTEGER NOT NULL DEFAULT 120,
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "unitId" TEXT,
    "description" TEXT,
    "objectives" TEXT,
    "learningOutcomes" TEXT,
    "admissionReqs" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_versions" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "versionCode" TEXT NOT NULL,
    "effectiveFromCohort" TEXT NOT NULL,
    "totalCredits" INTEGER,
    "requiredCoursesJson" JSONB,
    "status" "ProgramVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "programVersionId" TEXT,
    "academicYearId" TEXT,
    "cohort" TEXT,
    "totalCredits" INTEGER NOT NULL DEFAULT 120,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "curriculum_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_courses" (
    "id" TEXT NOT NULL,
    "curriculumPlanId" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "theoryHours" INTEGER NOT NULL DEFAULT 30,
    "practiceHours" INTEGER NOT NULL DEFAULT 15,
    "labHours" INTEGER NOT NULL DEFAULT 0,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "courseType" "CourseType" NOT NULL DEFAULT 'REQUIRED',
    "prerequisiteIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "learningOutcomes" TEXT,
    "assessmentMethod" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sections" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "curriculumCourseId" TEXT,
    "termId" TEXT NOT NULL,
    "facultyId" TEXT,
    "roomId" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "schedule" TEXT,
    "dayOfWeek" INTEGER,
    "startPeriod" INTEGER,
    "endPeriod" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "ClassSectionStatus" NOT NULL DEFAULT 'OPEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" TEXT NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "withdrawReason" TEXT,
    "attendanceScore" DOUBLE PRECISION,
    "assignmentScore" DOUBLE PRECISION,
    "midtermScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "passFlag" BOOLEAN,
    "letterGrade" TEXT,
    "gradeStatus" "GradeStatus" NOT NULL DEFAULT 'PENDING',
    "gradedBy" TEXT,
    "gradedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "sessionType" "SessionType" NOT NULL DEFAULT 'THEORY',
    "topic" TEXT,
    "roomId" TEXT,
    "facultyId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isMakeup" BOOLEAN NOT NULL DEFAULT false,
    "originalSessionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attendances" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,
    "attendanceType" "AttendanceType" NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT[],
    "ipWhitelist" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "dailyLimit" INTEGER NOT NULL DEFAULT 10000,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_api_logs" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "requestBody" TEXT,
    "responseSize" INTEGER,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infrastructure_configs" (
    "id" TEXT NOT NULL,
    "configType" "InfraConfigType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "connectionUrl" TEXT NOT NULL,
    "protocol" TEXT,
    "port" INTEGER,
    "username" TEXT,
    "passwordHash" TEXT,
    "sshKeyPath" TEXT,
    "basePath" TEXT,
    "gpuCount" INTEGER,
    "gpuType" TEXT,
    "memoryGB" INTEGER,
    "storageGB" INTEGER,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "syncInterval" INTEGER,
    "syncDirection" "SyncDirection",
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" "HealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "healthMessage" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infrastructure_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "filesUploaded" INTEGER NOT NULL DEFAULT 0,
    "filesDownloaded" INTEGER NOT NULL DEFAULT 0,
    "bytesTransferred" BIGINT NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "actorIp" TEXT,
    "actorUserAgent" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "changedFields" TEXT[],
    "requestId" TEXT NOT NULL,
    "endpoint" TEXT,
    "httpMethod" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "eventType" "CareerEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "reason" TEXT,
    "title" TEXT,
    "decisionAuthority" TEXT,
    "oldPosition" TEXT,
    "newPosition" TEXT,
    "oldRank" TEXT,
    "newRank" TEXT,
    "oldUnit" TEXT,
    "newUnit" TEXT,
    "trainingName" TEXT,
    "trainingInstitution" TEXT,
    "trainingResult" TEXT,
    "certificateNumber" TEXT,
    "decisionNumber" TEXT,
    "decisionDate" TIMESTAMP(3),
    "signerName" TEXT,
    "signerPosition" TEXT,
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deletionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "career_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_organizations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "organizationType" "PartyOrganizationType" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "orgLevel" "PartyOrgLevel" NOT NULL DEFAULT 'CHI_BO_CO_SO',
    "parentId" TEXT,
    "linkedUnitId" TEXT,
    "unitId" TEXT,
    "secretaryUserId" TEXT,
    "deputySecretaryUserId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "establishedDate" TIMESTAMP(3),
    "dissolvedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "partyCardNumber" TEXT,
    "partyRole" TEXT,
    "joinDate" TIMESTAMP(3),
    "officialDate" TIMESTAMP(3),
    "partyCell" TEXT,
    "partyCommittee" TEXT,
    "recommender1" TEXT,
    "recommender2" TEXT,
    "currentReviewGrade" TEXT,
    "currentDebtAmount" DOUBLE PRECISION DEFAULT 0,
    "confidentialNote" TEXT,
    "currentPosition" "PartyPosition",
    "status" "PartyMemberStatus" NOT NULL DEFAULT 'QUAN_CHUNG',
    "statusChangeDate" TIMESTAMP(3),
    "statusChangeReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_meetings" (
    "id" TEXT NOT NULL,
    "partyOrgId" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "agenda" TEXT,
    "minutesUrl" TEXT,
    "resolutionUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_meeting_attendances" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "attendanceStatus" TEXT NOT NULL,
    "absenceReason" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_meeting_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_fee_payments" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "paymentMonth" TEXT NOT NULL,
    "expectedAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "debtAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_annual_reviews" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "reviewYear" INTEGER NOT NULL,
    "grade" "ReviewGrade" NOT NULL,
    "comments" TEXT,
    "evidenceUrl" TEXT,
    "submissionStatus" "ReviewSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_annual_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_awards" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "decisionNo" TEXT,
    "decisionDate" TIMESTAMP(3),
    "issuer" TEXT,
    "note" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_disciplines" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "severity" "DisciplineSeverity" NOT NULL,
    "decisionNo" TEXT,
    "decisionDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "issuer" TEXT,
    "reason" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_transfers" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "transferType" "TransferType" NOT NULL,
    "fromPartyOrgId" TEXT NOT NULL,
    "toPartyOrgId" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "introductionLetterNo" TEXT,
    "confirmStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_inspection_targets" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT,
    "partyOrgId" TEXT,
    "inspectionType" "InspectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "findings" TEXT,
    "recommendation" TEXT,
    "decisionRef" TEXT,
    "attachmentUrl" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_inspection_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_recruitment_pipelines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" "RecruitmentStep" NOT NULL DEFAULT 'THEO_DOI',
    "targetPartyOrgId" TEXT NOT NULL,
    "camTinhDate" TIMESTAMP(3),
    "doiTuongDate" TIMESTAMP(3),
    "chiBoProposalDate" TIMESTAMP(3),
    "capTrenApprovalDate" TIMESTAMP(3),
    "joinedDate" TIMESTAMP(3),
    "assistantMember1" TEXT,
    "assistantMember2" TEXT,
    "dossierStatus" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_recruitment_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_activities" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "activityType" "PartyActivityType" NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "result" TEXT,
    "evaluationYear" INTEGER,
    "evaluationGrade" TEXT,
    "evaluationNotes" TEXT,
    "attachmentUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_member_histories" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "organizationId" TEXT,
    "historyType" "PartyHistoryType" NOT NULL,
    "position" "PartyPosition",
    "decisionNumber" TEXT,
    "decisionDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "fromOrganization" TEXT,
    "toOrganization" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_member_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_lifecycle_events" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "eventType" "PartyLifecycleEventType" NOT NULL,
    "fromStatus" "PartyMemberStatus",
    "toStatus" "PartyMemberStatus",
    "stage" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "note" TEXT,
    "triggeredBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_lifecycle_alerts" (
    "id" TEXT NOT NULL,
    "partyMemberId" TEXT NOT NULL,
    "alertType" "PartyLifecycleAlertType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "daysToDue" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "message" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_lifecycle_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT,
    "recordType" "PolicyRecordType" NOT NULL,
    "form" "PolicyForm",
    "level" "PolicyLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "decisionNumber" TEXT,
    "decisionDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "signerName" TEXT,
    "signerPosition" TEXT,
    "issuingUnit" TEXT,
    "departmentName" TEXT,
    "attachmentUrl" TEXT,
    "status" "PolicyRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "isCollective" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER,
    "durationMonths" INTEGER,
    "achievementSummary" TEXT,
    "violationSummary" TEXT,
    "legalBasis" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approverNote" TEXT,
    "proposedAt" TIMESTAMP(3),
    "proposedBy" TEXT,
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewerNote" TEXT,
    "workflowStatus" "AwardWorkflowStatus" NOT NULL DEFAULT 'PROPOSED',

    CONSTRAINT "policy_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_infos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insuranceNumber" TEXT,
    "insuranceStartDate" TIMESTAMP(3),
    "insuranceEndDate" TIMESTAMP(3),
    "healthInsuranceNumber" TEXT,
    "healthInsuranceStartDate" TIMESTAMP(3),
    "healthInsuranceEndDate" TIMESTAMP(3),
    "healthInsuranceHospital" TEXT,
    "beneficiaryName" TEXT,
    "beneficiaryRelation" TEXT,
    "beneficiaryPhone" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordType" "MedicalRecordType" NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "bloodType" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "healthGrade" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "hospital" TEXT,
    "doctorName" TEXT,
    "result" TEXT,
    "recommendations" TEXT,
    "followUpDate" TIMESTAMP(3),
    "attachmentUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maHocVien" TEXT,
    "lop" TEXT,
    "khoaHoc" TEXT,
    "nganh" TEXT,
    "heDaoTao" TEXT,
    "khoaQuanLy" TEXT,
    "trungDoi" TEXT,
    "daiDoi" TEXT,
    "diemTrungBinh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "xepLoaiHocLuc" TEXT,
    "tongTinChi" INTEGER NOT NULL DEFAULT 0,
    "tinChiTichLuy" INTEGER NOT NULL DEFAULT 0,
    "giangVienHuongDanId" TEXT,
    "trangThai" "StudentStatus" NOT NULL DEFAULT 'DANG_HOC',
    "ngayNhapHoc" TIMESTAMP(3),
    "ngayTotNghiep" TIMESTAMP(3),
    "lyDoNghiHoc" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_relations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personnelId" TEXT,
    "relation" "FamilyRelationType" NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "citizenId" TEXT,
    "phoneNumber" TEXT,
    "occupation" TEXT,
    "workplace" TEXT,
    "address" TEXT,
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "deceasedDate" TIMESTAMP(3),
    "dependentFlag" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "inputHash" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "scopeType" "PermissionScopeType" NOT NULL,
    "unitId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "grantedById" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permission_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_grant_personnel" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permission_grant_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_ai_analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analysisType" "AIAnalysisType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" JSONB,
    "recommendations" JSONB,
    "insights" JSONB,
    "predictedValue" DOUBLE PRECISION,
    "predictedDate" TIMESTAMP(3),
    "modelVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "dataRange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" TEXT NOT NULL,
    "personnelCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "placeOfOrigin" TEXT,
    "birthPlace" TEXT,
    "ethnicity" TEXT,
    "religion" TEXT,
    "category" "PersonnelCategory",
    "managingOrgan" "ManagingOrgan",
    "managingOrganAssignedBy" TEXT,
    "managingOrganAssignedAt" TIMESTAMP(3),
    "managingOrganReason" TEXT,
    "unitId" TEXT,
    "status" "PersonnelStatus" NOT NULL DEFAULT 'DANG_CONG_TAC',
    "militaryIdNumber" TEXT,
    "militaryRank" TEXT,
    "position" TEXT,
    "enlistmentDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "studentIdNumber" TEXT,
    "employeeIdNumber" TEXT,
    "educationLevel" TEXT,
    "specialization" TEXT,
    "fullNameEn" TEXT,
    "permanentAddress" TEXT,
    "temporaryAddress" TEXT,
    "bloodType" "BloodType",
    "rankDate" TIMESTAMP(3),
    "positionDate" TIMESTAMP(3),
    "politicalTheory" TEXT,
    "academicTitle" TEXT,
    "academicDegree" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "positionId" TEXT,
    "ethnicityId" TEXT,
    "religionId" TEXT,
    "specializationId" TEXT,
    "birthPlaceAdminId" TEXT,
    "placeOfOriginAdminId" TEXT,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitive_identities" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "citizenIdEncrypted" TEXT,
    "officerIdEncrypted" TEXT,
    "insuranceNumEncrypted" TEXT,
    "healthInsNumEncrypted" TEXT,
    "partyCardNumEncrypted" TEXT,
    "bankAccountEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensitive_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_events" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "eventType" "PersonnelEventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "summary" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "positionScope" "PositionScope" NOT NULL DEFAULT 'UNIT',
    "level" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "functions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL DEFAULT 'VIEW',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position_functions" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "scope" "FunctionScope" NOT NULL DEFAULT 'SELF',
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "unitId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "appointmentDoc" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_position_aliases" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_position_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_conflicts" (
    "id" TEXT NOT NULL,
    "functionCodeA" TEXT NOT NULL,
    "functionCodeB" TEXT NOT NULL,
    "description" TEXT,
    "severity" "ConflictSeverity" NOT NULL DEFAULT 'BLOCK',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvalLevels" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reason" TEXT,
    "requestedAmount" DECIMAL(15,2),
    "approvedAmount" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "PolicyRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewerNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approverNote" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_attachments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "cloudStoragePath" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_workflow_logs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" "PolicyWorkflowAction" NOT NULL,
    "fromStatus" "PolicyRequestStatus",
    "toStatus" "PolicyRequestStatus" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performerName" TEXT,
    "performerRole" TEXT,
    "note" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_workflow_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_histories" (
    "id" TEXT NOT NULL,
    "insuranceInfoId" TEXT NOT NULL,
    "transactionType" "InsuranceTransactionType" NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "baseSalary" DECIMAL(15,2),
    "amount" DECIMAL(15,2) NOT NULL,
    "employeeShare" DECIMAL(15,2),
    "employerShare" DECIMAL(15,2),
    "benefitType" "InsuranceBenefitType",
    "benefitReason" TEXT,
    "benefitPeriod" INTEGER,
    "documentNumber" TEXT,
    "documentDate" TIMESTAMP(3),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_dependents" (
    "id" TEXT NOT NULL,
    "insuranceInfoId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationship" "DependentRelationship" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "citizenId" TEXT,
    "healthInsuranceNumber" TEXT,
    "healthInsuranceStartDate" TIMESTAMP(3),
    "healthInsuranceEndDate" TIMESTAMP(3),
    "healthInsuranceHospital" TEXT,
    "status" "DependentStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusReason" TEXT,
    "documentNumber" TEXT,
    "documentDate" TIMESTAMP(3),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_dependents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "officer_careers" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "officerIdNumber" TEXT,
    "currentRank" "OfficerRank",
    "currentPosition" TEXT,
    "commissionedDate" TIMESTAMP(3),
    "lastEvaluationDate" TIMESTAMP(3),
    "lastEvaluationResult" TEXT,
    "evaluationHistory" JSONB,
    "commandHistory" JSONB,
    "trainingHistory" JSONB,
    "awardHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "healthCategory" TEXT,
    "healthNotes" TEXT,
    "lastHealthCheckDate" TIMESTAMP(3),

    CONSTRAINT "officer_careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "officer_promotions" (
    "id" TEXT NOT NULL,
    "officerCareerId" TEXT NOT NULL,
    "promotionType" "PromotionType" NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "decisionNumber" TEXT,
    "decisionDate" TIMESTAMP(3),
    "previousRank" "OfficerRank",
    "newRank" "OfficerRank",
    "previousPosition" TEXT,
    "newPosition" TEXT,
    "previousUnitId" TEXT,
    "newUnitId" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "officer_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_special_cases" (
    "id" TEXT NOT NULL,
    "officerCareerId" TEXT,
    "soldierProfileId" TEXT,
    "caseType" "PromotionSpecialCaseType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reductionMonths" INTEGER NOT NULL,
    "decisionNumber" TEXT,
    "decisionDate" TIMESTAMP(3),
    "issuedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "promotion_special_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soldier_profiles" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "soldierIdNumber" TEXT,
    "soldierCategory" "SoldierCategory",
    "currentRank" "SoldierRank",
    "serviceType" "SoldierServiceType",
    "enlistmentDate" TIMESTAMP(3),
    "expectedDischargeDate" TIMESTAMP(3),
    "actualDischargeDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "skillCertificates" JSONB,
    "trainingCourses" JSONB,
    "specialSkills" TEXT,
    "healthCategory" TEXT,
    "lastHealthCheckDate" TIMESTAMP(3),
    "healthNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "lastRankDate" TIMESTAMP(3),

    CONSTRAINT "soldier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soldier_service_records" (
    "id" TEXT NOT NULL,
    "soldierProfileId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "decisionNumber" TEXT,
    "previousRank" "SoldierRank",
    "newRank" "SoldierRank",
    "previousUnit" TEXT,
    "newUnit" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "soldier_service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" TEXT NOT NULL,
    "insuranceInfoId" TEXT NOT NULL,
    "claimType" "InsuranceClaimType" NOT NULL,
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(15,2),
    "calculatedAmount" DECIMAL(15,2),
    "benefitDays" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "reason" TEXT,
    "description" TEXT,
    "documentNumber" TEXT,
    "documentDate" TIMESTAMP(3),
    "hospitalName" TEXT,
    "diagnosisCode" TEXT,
    "diagnosis" TEXT,
    "attachments" TEXT[],
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "paymentReference" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_facilities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MedicalFacilityType" NOT NULL,
    "address" TEXT,
    "province" TEXT,
    "district" TEXT,
    "phone" TEXT,
    "level" INTEGER DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "military_salary_grades" (
    "id" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "rankCode" TEXT NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "rankAllowance" DECIMAL(15,2),
    "positionAllowance" DECIMAL(15,2),
    "seniorityRate" DECIMAL(5,3),
    "insuranceRate" DECIMAL(5,3) NOT NULL DEFAULT 0.105,
    "healthInsRate" DECIMAL(5,3) NOT NULL DEFAULT 0.045,
    "unemploymentRate" DECIMAL(5,3) NOT NULL DEFAULT 0.01,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "military_salary_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "examType" "ExamPlanType" NOT NULL DEFAULT 'FINAL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationDeadline" TIMESTAMP(3),
    "description" TEXT,
    "rules" TEXT,
    "status" "ExamPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "examPlanId" TEXT NOT NULL,
    "classSectionId" TEXT,
    "subjectCode" TEXT,
    "subjectName" TEXT,
    "examDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 90,
    "roomId" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "supervisorId" TEXT,
    "assistantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "examFormat" "ExamFormat" NOT NULL DEFAULT 'WRITTEN',
    "status" "ExamSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "instructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_registrations" (
    "id" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "seatNumber" TEXT,
    "status" "ExamRegStatus" NOT NULL DEFAULT 'REGISTERED',
    "checkInTime" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_banks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "unitId" TEXT,
    "description" TEXT,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "questionBankId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "QuestionContentType" NOT NULL DEFAULT 'TEXT',
    "questionType" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" JSONB,
    "correctAnswer" TEXT,
    "explanation" TEXT,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "chapter" TEXT,
    "topic" TEXT,
    "learningOutcome" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION,
    "status" "QuestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_materials" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectCode" TEXT,
    "subjectName" TEXT,
    "materialType" "MaterialType" NOT NULL DEFAULT 'DOCUMENT',
    "format" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "duration" INTEGER,
    "thumbnailUrl" TEXT,
    "unitId" TEXT,
    "authorId" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "chapter" TEXT,
    "topic" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "accessLevel" "MaterialAccessLevel" NOT NULL DEFAULT 'INTERNAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "labType" "LabType" NOT NULL DEFAULT 'COMPUTER',
    "building" TEXT,
    "floor" INTEGER,
    "roomNumber" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "area" DOUBLE PRECISION,
    "unitId" TEXT,
    "managerId" TEXT,
    "description" TEXT,
    "regulations" TEXT,
    "equipment" TEXT,
    "status" "LabStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_equipments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "equipmentType" "EquipmentType" NOT NULL DEFAULT 'COMPUTER',
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "purchasePrice" DECIMAL(15,2),
    "currentValue" DECIMAL(15,2),
    "specifications" JSONB,
    "location" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "condition" "EquipmentCondition" NOT NULL DEFAULT 'GOOD',
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "maintenanceNotes" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_maintenances" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "maintenanceType" "MaintenanceType" NOT NULL DEFAULT 'ROUTINE',
    "performedDate" TIMESTAMP(3) NOT NULL,
    "performedBy" TEXT,
    "description" TEXT,
    "cost" DECIMAL(15,2),
    "findings" TEXT,
    "actions" TEXT,
    "partsReplaced" TEXT,
    "nextScheduled" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "classSectionId" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "topic" TEXT,
    "description" TEXT,
    "supervisorId" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "status" "LabSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_statistics" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "termId" TEXT,
    "academicYearId" TEXT,
    "totalCourses" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "avgAttendanceRate" DOUBLE PRECISION,
    "avgPassRate" DOUBLE PRECISION,
    "avgGrade" DOUBLE PRECISION,
    "totalHours" INTEGER NOT NULL DEFAULT 0,
    "evaluationScore" DOUBLE PRECISION,
    "evaluationCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ethnicities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ethnicities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "religions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "religions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialization_catalogs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialization_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrative_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "level" "AdministrativeLevel" NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administrative_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_classes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "majorId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" CHAR(5) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "shortName" VARCHAR(50) NOT NULL,
    "type" "ProvinceType" NOT NULL,
    "region" "RegionType",
    "capital" VARCHAR(100),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "mergedFrom" TEXT[],
    "effectiveDate" DATE NOT NULL DEFAULT '2025-07-01'::date,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commune_units" (
    "id" VARCHAR(10) NOT NULL,
    "provinceId" CHAR(5) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "shortName" VARCHAR(100),
    "type" "CommuneType" NOT NULL,
    "legacyDistrictName" VARCHAR(100),
    "mergedFrom" TEXT[],
    "effectiveDate" DATE NOT NULL DEFAULT '2025-07-01'::date,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commune_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "military_ranks" (
    "id" VARCHAR(10) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "shortCode" VARCHAR(10) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "orderNo" SMALLINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "military_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_types" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "shortName" VARCHAR(30),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "personnel_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_statuses" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "color" VARCHAR(10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "work_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_types" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "level" SMALLINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "unit_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_titles" (
    "id" VARCHAR(10) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "shortName" VARCHAR(10),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "academic_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_degrees" (
    "id" VARCHAR(10) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "shortName" VARCHAR(10),
    "level" SMALLINT NOT NULL,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "academic_degrees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "majors" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "shortName" VARCHAR(30),
    "fieldGroup" VARCHAR(50),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_institutions" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "shortName" VARCHAR(50),
    "country" TEXT NOT NULL DEFAULT 'Việt Nam',
    "type" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "training_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "degree_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "degree_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_categories" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "subject_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_scales" (
    "id" VARCHAR(10) NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "maxScore" DECIMAL(5,2) NOT NULL,
    "passingScore" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_evaluation_ranks" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "shortCode" VARCHAR(10) NOT NULL,
    "color" VARCHAR(10),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "annual_evaluation_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_org_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "party_org_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_transfer_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "party_transfer_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "shortName" VARCHAR(10),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "insurance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowance_types" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "calcBasis" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "allowance_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "maxDays" SMALLINT,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award_form_types" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "award_form_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_types" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "severity" SMALLINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "discipline_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merit_titles" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "merit_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_type_catalog" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "level" VARCHAR(20) NOT NULL,
    "maxBudget" BIGINT,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "research_type_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_fields" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "research_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "scoreWeight" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "publication_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_statuses" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "color" VARCHAR(10),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "research_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_groups" (
    "id" VARCHAR(10) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "icon" VARCHAR(30),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "module_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "function_code_master" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "moduleId" VARCHAR(10),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "function_code_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_scopes" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "level" SMALLINT NOT NULL,
    "description" TEXT,

    CONSTRAINT "access_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_classifications" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "color" VARCHAR(10),
    "level" SMALLINT NOT NULL,
    "description" TEXT,

    CONSTRAINT "data_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_types" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "icon" VARCHAR(30),
    "priority" SMALLINT NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_types" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "moduleId" VARCHAR(10),
    "steps" SMALLINT NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workflow_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_member_types" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "orderNo" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "family_member_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_backgrounds" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "family_backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_categories" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parentId" VARCHAR(30),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_status_catalog" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "color" VARCHAR(10),
    "orderNo" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "equipment_status_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_type_catalog" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "periodDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "maintenance_type_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_versions" (
    "id" SERIAL NOT NULL,
    "tableName" VARCHAR(60) NOT NULL,
    "version" VARCHAR(10) NOT NULL DEFAULT '1.0',
    "recordCount" INTEGER,
    "lastUpdated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" VARCHAR(100),
    "notes" TEXT,

    CONSTRAINT "master_data_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT,
    "groupTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cacheType" "MdCacheType" NOT NULL DEFAULT 'STATIC',
    "sourceType" "MdSourceType" NOT NULL DEFAULT 'LOCAL',

    CONSTRAINT "master_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_items" (
    "id" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT,
    "shortName" TEXT,
    "parentCode" TEXT,
    "level" INTEGER,
    "externalCode" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_data_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_change_logs" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedBy" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeType" "MdChangeType" NOT NULL,

    CONSTRAINT "master_data_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "moduleSource" TEXT[],
    "outputFormats" TEXT[],
    "fileKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "rbacCode" TEXT NOT NULL,
    "dataMap" JSONB NOT NULL DEFAULT '{}',
    "placeholders" JSONB,
    "changeNote" TEXT,
    "category" TEXT,
    "parentId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "entityIds" TEXT[],
    "entityType" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "outputKey" TEXT,
    "signedUrl" TEXT,
    "urlExpiresAt" TIMESTAMP(3),
    "callerType" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "parentJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_schedules" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "filterJson" JSONB NOT NULL DEFAULT '{}',
    "cronExpression" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "recipientEmails" TEXT[],
    "zipName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_import_analyses" (
    "id" TEXT NOT NULL,
    "uploadedFileKey" TEXT NOT NULL,
    "detectedPlaceholders" JSONB NOT NULL DEFAULT '[]',
    "confirmedMappings" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ANALYZING',
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_import_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_analytics_daily" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalExports" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "avgRenderMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_analytics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_sync_logs" (
    "id" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "syncSource" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "deactivatedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "logDetail" JSONB,
    "triggeredBy" TEXT NOT NULL,
    "errorSummary" JSONB,
    "finishedAt" TIMESTAMP(3),
    "syncStatus" "MdSyncStatus" NOT NULL DEFAULT 'PARTIAL',

    CONSTRAINT "master_data_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_flush_logs" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "flushedBy" TEXT NOT NULL,
    "keyCount" INTEGER NOT NULL DEFAULT 0,
    "flushedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_data_flush_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_projects" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "abstract" TEXT,
    "keywords" TEXT[],
    "category" "NckhCategory" NOT NULL,
    "field" "NckhField" NOT NULL,
    "researchType" "NckhType" NOT NULL,
    "status" "NckhProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "phase" "NckhProjectPhase" NOT NULL DEFAULT 'PROPOSAL',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "budgetRequested" DOUBLE PRECISION,
    "budgetApproved" DOUBLE PRECISION,
    "budgetUsed" DOUBLE PRECISION,
    "budgetYear" INTEGER,
    "principalInvestigatorId" TEXT NOT NULL,
    "unitId" TEXT,
    "bqpProjectCode" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approverNote" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectReason" TEXT,
    "completionScore" DOUBLE PRECISION,
    "completionGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "sensitivity" TEXT NOT NULL DEFAULT 'NORMAL',
    "fundSourceId" TEXT,

    CONSTRAINT "nckh_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "NckhMemberRole" NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaveDate" TIMESTAMP(3),
    "contribution" DOUBLE PRECISION,

    CONSTRAINT "nckh_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_milestones" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "NckhMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nckh_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_reviews" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewType" "NckhReviewType" NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION,
    "grade" TEXT,
    "comments" TEXT,
    "decision" "NckhReviewDecision" NOT NULL,
    "minutesUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nckh_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_publications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "abstract" TEXT,
    "doi" TEXT,
    "isbn" TEXT,
    "issn" TEXT,
    "pubType" "NckhPublicationType" NOT NULL,
    "scopusQ" TEXT,
    "isISI" BOOLEAN NOT NULL DEFAULT false,
    "isScopus" BOOLEAN NOT NULL DEFAULT false,
    "journal" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "pages" TEXT,
    "publishedYear" INTEGER,
    "publisher" TEXT,
    "publishedAt" TIMESTAMP(3),
    "projectId" TEXT,
    "authorId" TEXT NOT NULL,
    "coAuthors" TEXT,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "fullTextUrl" TEXT,
    "status" "NckhPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "advisorName" TEXT,
    "authorsText" TEXT,
    "conferenceName" TEXT,
    "decisionNumber" TEXT,
    "defenseScore" DOUBLE PRECISION,
    "impactFactor" DOUBLE PRECISION,
    "keywords" TEXT[],
    "patentGrantDate" TIMESTAMP(3),
    "patentNumber" TEXT,
    "proceedingName" TEXT,
    "ranking" TEXT,
    "storageLocation" TEXT,

    CONSTRAINT "nckh_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_publication_authors" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorOrder" INTEGER NOT NULL,
    "affiliation" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "nckh_publication_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_scientist_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hIndex" INTEGER NOT NULL DEFAULT 0,
    "i10Index" INTEGER NOT NULL DEFAULT 0,
    "totalCitations" INTEGER NOT NULL DEFAULT 0,
    "totalPublications" INTEGER NOT NULL DEFAULT 0,
    "primaryField" TEXT,
    "secondaryFields" TEXT[],
    "researchKeywords" TEXT[],
    "orcidId" TEXT,
    "scopusAuthorId" TEXT,
    "googleScholarId" TEXT,
    "bio" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "academicRank" TEXT,
    "awards" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "degree" TEXT,
    "projectLeadCount" INTEGER NOT NULL DEFAULT 0,
    "projectMemberCount" INTEGER NOT NULL DEFAULT 0,
    "researchFields" TEXT[],
    "researchVector" TEXT,
    "specialization" TEXT,
    "sensitivityLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "researchAreaIds" TEXT[],

    CONSTRAINT "nckh_scientist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_scientist_education" (
    "id" TEXT NOT NULL,
    "scientistId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Việt Nam',
    "yearFrom" INTEGER NOT NULL,
    "yearTo" INTEGER NOT NULL,
    "thesisTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nckh_scientist_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_scientist_career" (
    "id" TEXT NOT NULL,
    "scientistId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "yearFrom" INTEGER NOT NULL,
    "yearTo" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nckh_scientist_career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_scientist_awards" (
    "id" TEXT NOT NULL,
    "scientistId" TEXT NOT NULL,
    "awardName" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "projectId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nckh_scientist_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_duplicate_check_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keywords" TEXT[],
    "excludeId" TEXT,
    "risk" TEXT NOT NULL,
    "matchCount" INTEGER NOT NULL,
    "checkedCount" INTEGER NOT NULL,
    "matches" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nckh_duplicate_check_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thesis_projects" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "thesisType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "advisorId" TEXT,
    "reviewerId" TEXT,
    "defenseDate" TIMESTAMP(3),
    "defenseScore" DOUBLE PRECISION,
    "status" "ThesisStatus" NOT NULL DEFAULT 'DRAFT',
    "repositoryFileUrl" TEXT,
    "abstractText" TEXT,
    "keywords" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "thesis_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graduation_audits" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "totalCreditsEarned" INTEGER,
    "gpa" DOUBLE PRECISION,
    "conductEligible" BOOLEAN NOT NULL DEFAULT false,
    "thesisEligible" BOOLEAN NOT NULL DEFAULT false,
    "languageEligible" BOOLEAN NOT NULL DEFAULT false,
    "graduationEligible" BOOLEAN NOT NULL DEFAULT false,
    "failureReasonsJson" JSONB,
    "status" "GraduationAuditStatus" NOT NULL DEFAULT 'PENDING',
    "decisionNo" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "graduation_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diploma_records" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "graduationAuditId" TEXT,
    "diplomaNo" TEXT,
    "diplomaType" TEXT NOT NULL,
    "classification" TEXT,
    "graduationDate" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "issuedBy" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diploma_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_repository_items" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT,
    "itemType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "metadataJson" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "academic_repository_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_templates" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "moduleKey" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wf_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "versionNo" SMALLINT NOT NULL,
    "status" "WorkflowVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" VARCHAR(36),
    "definitionJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wf_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_step_templates" (
    "id" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "stepType" "WorkflowStepType" NOT NULL,
    "orderIndex" SMALLINT NOT NULL,
    "slaHours" SMALLINT,
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB,

    CONSTRAINT "wf_step_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_transition_templates" (
    "id" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "fromStepCode" VARCHAR(60) NOT NULL,
    "actionCode" VARCHAR(40) NOT NULL,
    "toStepCode" VARCHAR(60) NOT NULL,
    "conditionExpression" VARCHAR(500),
    "priority" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "wf_transition_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_instances" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(36) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "summary" TEXT,
    "status" "WorkflowInstanceStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStepCode" VARCHAR(60),
    "initiatorId" VARCHAR(36) NOT NULL,
    "currentAssigneeId" VARCHAR(36),
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wf_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_step_instances" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "stepCode" VARCHAR(60) NOT NULL,
    "status" "WorkflowStepStatus" NOT NULL DEFAULT 'WAITING',
    "assigneeId" VARCHAR(36),
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "actedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "wf_step_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_actions" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "actionCode" "WorkflowActionCode" NOT NULL,
    "actionBy" VARCHAR(36) NOT NULL,
    "actionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "payloadJson" JSONB,

    CONSTRAINT "wf_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_signatures" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "signerId" VARCHAR(36) NOT NULL,
    "signatureType" VARCHAR(40) NOT NULL,
    "providerCode" VARCHAR(40),
    "signedAt" TIMESTAMP(3),
    "status" "WorkflowSignatureStatus" NOT NULL DEFAULT 'PENDING',
    "certificateInfoJson" JSONB,
    "evidenceFileId" VARCHAR(36),
    "hashValue" VARCHAR(500),

    CONSTRAINT "wf_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_notifications" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "recipientId" VARCHAR(36) NOT NULL,
    "channel" VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    "eventType" VARCHAR(60) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wf_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_escalations" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "stepInstanceId" TEXT NOT NULL,
    "escalatedBy" VARCHAR(36) NOT NULL,
    "escalatedTo" VARCHAR(36),
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wf_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_audit_logs" (
    "id" TEXT NOT NULL,
    "workflowInstanceId" TEXT NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "performedBy" VARCHAR(36) NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromStatus" VARCHAR(40),
    "toStatus" VARCHAR(40),
    "ipAddress" VARCHAR(45),
    "sessionId" VARCHAR(100),
    "comment" TEXT,
    "payloadJson" JSONB,

    CONSTRAINT "wf_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_eis_scores" (
    "id" TEXT NOT NULL,
    "facultyProfileId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semesterCode" TEXT NOT NULL,
    "teachingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "researchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mentoringScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "innovationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "developmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEIS" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trend" "EisTrend",
    "recommendations" JSONB,
    "sourceDataJson" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_eis_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_workload_snapshots" (
    "id" TEXT NOT NULL,
    "facultyProfileId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semesterCode" TEXT NOT NULL,
    "totalClasses" INTEGER NOT NULL DEFAULT 0,
    "totalHoursWeekly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHoursTerm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overloadHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyHoursLimit" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "advisingCount" INTEGER NOT NULL DEFAULT 0,
    "thesisCount" INTEGER NOT NULL DEFAULT 0,
    "builtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_workload_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_workload_alerts" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "status" "WorkloadAlertStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_workload_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_gpa_histories" (
    "id" TEXT NOT NULL,
    "hocVienId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semesterCode" TEXT NOT NULL,
    "semesterGpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cumulativeGpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditsEarned" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsAccumulated" INTEGER NOT NULL DEFAULT 0,
    "academicStatus" "AcademicPerformanceStatus" NOT NULL DEFAULT 'NORMAL',
    "builtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_gpa_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "science_catalogs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "path" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "science_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "science_id_sequences" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "science_id_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nckh_project_workflow_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "fromPhase" TEXT,
    "toPhase" TEXT,
    "actionById" TEXT NOT NULL,
    "comment" TEXT,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nckh_project_workflow_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_works" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "isbn" TEXT,
    "issn" TEXT,
    "doi" TEXT,
    "publisherId" TEXT,
    "journalName" TEXT,
    "year" INTEGER NOT NULL,
    "edition" INTEGER NOT NULL DEFAULT 1,
    "sensitivity" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scientific_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_work_authors" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "scientistId" TEXT,
    "authorName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "orderNum" INTEGER NOT NULL,
    "affiliation" TEXT,

    CONSTRAINT "scientific_work_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_items" (
    "id" TEXT NOT NULL,
    "workId" TEXT,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL DEFAULT 'NORMAL',
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "indexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_access_logs" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_budgets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fundSourceId" TEXT NOT NULL,
    "totalApproved" BIGINT NOT NULL,
    "totalSpent" BIGINT NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_line_items" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "plannedAmount" BIGINT NOT NULL,
    "spentAmount" BIGINT NOT NULL DEFAULT 0,
    "period" TEXT,

    CONSTRAINT "budget_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_councils" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "chairmanId" TEXT NOT NULL,
    "secretaryId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3),
    "result" TEXT,
    "overallScore" DOUBLE PRECISION,
    "conclusionText" TEXT,
    "minutesFilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scientific_councils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_council_members" (
    "id" TEXT NOT NULL,
    "councilId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "vote" TEXT,

    CONSTRAINT "scientific_council_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scientific_council_reviews" (
    "id" TEXT NOT NULL,
    "councilId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scientific_council_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_militaryId_key" ON "users"("militaryId");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "users_personnelId_key" ON "users"("personnelId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_militaryId_idx" ON "users"("militaryId");

-- CreateIndex
CREATE INDEX "users_employeeId_idx" ON "users"("employeeId");

-- CreateIndex
CREATE INDEX "users_personnelType_idx" ON "users"("personnelType");

-- CreateIndex
CREATE INDEX "users_unitId_idx" ON "users"("unitId");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_workStatus_idx" ON "users"("workStatus");

-- CreateIndex
CREATE INDEX "users_personnelId_idx" ON "users"("personnelId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_sessions_token_idx" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_isActive_idx" ON "auth_sessions"("isActive");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx" ON "auth_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_userId_key" ON "faculty_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_personnelId_key" ON "faculty_profiles"("personnelId");

-- CreateIndex
CREATE INDEX "faculty_profiles_userId_idx" ON "faculty_profiles"("userId");

-- CreateIndex
CREATE INDEX "faculty_profiles_departmentId_idx" ON "faculty_profiles"("departmentId");

-- CreateIndex
CREATE INDEX "faculty_profiles_unitId_idx" ON "faculty_profiles"("unitId");

-- CreateIndex
CREATE INDEX "faculty_profiles_academicRank_idx" ON "faculty_profiles"("academicRank");

-- CreateIndex
CREATE INDEX "faculty_profiles_academicDegree_idx" ON "faculty_profiles"("academicDegree");

-- CreateIndex
CREATE INDEX "faculty_profiles_personnelId_idx" ON "faculty_profiles"("personnelId");

-- CreateIndex
CREATE INDEX "faculty_profiles_teachingPosition_idx" ON "faculty_profiles"("teachingPosition");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_parentId_idx" ON "departments"("parentId");

-- CreateIndex
CREATE INDEX "bigdata_services_type_idx" ON "bigdata_services"("type");

-- CreateIndex
CREATE INDEX "bigdata_services_status_idx" ON "bigdata_services"("status");

-- CreateIndex
CREATE INDEX "service_metrics_serviceId_idx" ON "service_metrics"("serviceId");

-- CreateIndex
CREATE INDEX "service_metrics_metricName_idx" ON "service_metrics"("metricName");

-- CreateIndex
CREATE INDEX "service_metrics_timestamp_idx" ON "service_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "service_alerts_serviceId_idx" ON "service_alerts"("serviceId");

-- CreateIndex
CREATE INDEX "service_alerts_status_idx" ON "service_alerts"("status");

-- CreateIndex
CREATE INDEX "service_alerts_severity_idx" ON "service_alerts"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "airflow_dags_dagId_key" ON "airflow_dags"("dagId");

-- CreateIndex
CREATE INDEX "airflow_dags_dagId_idx" ON "airflow_dags"("dagId");

-- CreateIndex
CREATE INDEX "airflow_dags_status_idx" ON "airflow_dags"("status");

-- CreateIndex
CREATE UNIQUE INDEX "dag_runs_runId_key" ON "dag_runs"("runId");

-- CreateIndex
CREATE INDEX "dag_runs_dagId_idx" ON "dag_runs"("dagId");

-- CreateIndex
CREATE INDEX "dag_runs_status_idx" ON "dag_runs"("status");

-- CreateIndex
CREATE INDEX "dag_runs_startDate_idx" ON "dag_runs"("startDate");

-- CreateIndex
CREATE INDEX "system_logs_userId_idx" ON "system_logs"("userId");

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_category_idx" ON "system_logs"("category");

-- CreateIndex
CREATE INDEX "system_logs_createdAt_idx" ON "system_logs"("createdAt");

-- CreateIndex
CREATE INDEX "user_activities_userId_idx" ON "user_activities"("userId");

-- CreateIndex
CREATE INDEX "user_activities_timestamp_idx" ON "user_activities"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");

-- CreateIndex
CREATE INDEX "research_files_uploadedBy_idx" ON "research_files"("uploadedBy");

-- CreateIndex
CREATE INDEX "research_files_fileType_idx" ON "research_files"("fileType");

-- CreateIndex
CREATE INDEX "research_files_department_idx" ON "research_files"("department");

-- CreateIndex
CREATE INDEX "research_files_status_idx" ON "research_files"("status");

-- CreateIndex
CREATE INDEX "research_files_classification_idx" ON "research_files"("classification");

-- CreateIndex
CREATE INDEX "research_files_parentId_idx" ON "research_files"("parentId");

-- CreateIndex
CREATE INDEX "research_files_uploadedAt_idx" ON "research_files"("uploadedAt");

-- CreateIndex
CREATE INDEX "file_access_logs_fileId_idx" ON "file_access_logs"("fileId");

-- CreateIndex
CREATE INDEX "file_access_logs_userId_idx" ON "file_access_logs"("userId");

-- CreateIndex
CREATE INDEX "file_access_logs_action_idx" ON "file_access_logs"("action");

-- CreateIndex
CREATE INDEX "file_access_logs_timestamp_idx" ON "file_access_logs"("timestamp");

-- CreateIndex
CREATE INDEX "data_queries_executedBy_idx" ON "data_queries"("executedBy");

-- CreateIndex
CREATE INDEX "data_queries_queryType_idx" ON "data_queries"("queryType");

-- CreateIndex
CREATE INDEX "data_queries_status_idx" ON "data_queries"("status");

-- CreateIndex
CREATE INDEX "data_queries_submittedAt_idx" ON "data_queries"("submittedAt");

-- CreateIndex
CREATE INDEX "analytics_summaries_summaryType_idx" ON "analytics_summaries"("summaryType");

-- CreateIndex
CREATE INDEX "analytics_summaries_summaryDate_idx" ON "analytics_summaries"("summaryDate");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_summaries_summaryType_summaryDate_key" ON "analytics_summaries"("summaryType", "summaryDate");

-- CreateIndex
CREATE INDEX "ml_models_ownerId_idx" ON "ml_models"("ownerId");

-- CreateIndex
CREATE INDEX "ml_models_modelType_idx" ON "ml_models"("modelType");

-- CreateIndex
CREATE INDEX "ml_models_framework_idx" ON "ml_models"("framework");

-- CreateIndex
CREATE INDEX "ml_models_status_idx" ON "ml_models"("status");

-- CreateIndex
CREATE INDEX "ml_models_classification_idx" ON "ml_models"("classification");

-- CreateIndex
CREATE INDEX "ml_models_createdAt_idx" ON "ml_models"("createdAt");

-- CreateIndex
CREATE INDEX "training_jobs_modelId_idx" ON "training_jobs"("modelId");

-- CreateIndex
CREATE INDEX "training_jobs_status_idx" ON "training_jobs"("status");

-- CreateIndex
CREATE INDEX "training_jobs_startedAt_idx" ON "training_jobs"("startedAt");

-- CreateIndex
CREATE INDEX "model_predictions_modelId_idx" ON "model_predictions"("modelId");

-- CreateIndex
CREATE INDEX "model_predictions_userId_idx" ON "model_predictions"("userId");

-- CreateIndex
CREATE INDEX "model_predictions_timestamp_idx" ON "model_predictions"("timestamp");

-- CreateIndex
CREATE INDEX "data_pipelines_status_idx" ON "data_pipelines"("status");

-- CreateIndex
CREATE INDEX "data_pipelines_createdBy_idx" ON "data_pipelines"("createdBy");

-- CreateIndex
CREATE INDEX "data_pipelines_createdAt_idx" ON "data_pipelines"("createdAt");

-- CreateIndex
CREATE INDEX "idx_artifacts_experiment" ON "experiment_artifacts"("experiment_id");

-- CreateIndex
CREATE INDEX "idx_metrics_experiment" ON "experiment_metrics"("experiment_id");

-- CreateIndex
CREATE INDEX "idx_metrics_name" ON "experiment_metrics"("metric_name");

-- CreateIndex
CREATE INDEX "idx_experiments_created" ON "ml_experiments"("created_at");

-- CreateIndex
CREATE INDEX "idx_experiments_model" ON "ml_experiments"("model_id");

-- CreateIndex
CREATE INDEX "idx_experiments_status" ON "ml_experiments"("status");

-- CreateIndex
CREATE INDEX "idx_workflows_model" ON "ml_workflows"("model_id");

-- CreateIndex
CREATE INDEX "idx_workflows_status" ON "ml_workflows"("status");

-- CreateIndex
CREATE INDEX "idx_versions_created" ON "model_versions"("created_at");

-- CreateIndex
CREATE INDEX "idx_versions_model" ON "model_versions"("model_id");

-- CreateIndex
CREATE INDEX "idx_versions_stage" ON "model_versions"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "model_versions_model_id_version_number_key" ON "model_versions"("model_id", "version_number");

-- CreateIndex
CREATE INDEX "idx_executions_status" ON "workflow_executions"("status");

-- CreateIndex
CREATE INDEX "idx_executions_workflow" ON "workflow_executions"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE INDEX "units_code_idx" ON "units"("code");

-- CreateIndex
CREATE INDEX "units_type_idx" ON "units"("type");

-- CreateIndex
CREATE INDEX "units_parentId_idx" ON "units"("parentId");

-- CreateIndex
CREATE INDEX "units_commanderId_idx" ON "units"("commanderId");

-- CreateIndex
CREATE INDEX "units_path_idx" ON "units"("path");

-- CreateIndex
CREATE INDEX "personnel_attachments_userId_idx" ON "personnel_attachments"("userId");

-- CreateIndex
CREATE INDEX "personnel_attachments_fileType_idx" ON "personnel_attachments"("fileType");

-- CreateIndex
CREATE INDEX "TeachingSubject_facultyId_idx" ON "TeachingSubject"("facultyId");

-- CreateIndex
CREATE INDEX "TeachingSubject_academicYear_idx" ON "TeachingSubject"("academicYear");

-- CreateIndex
CREATE INDEX "ResearchProject_facultyId_idx" ON "ResearchProject"("facultyId");

-- CreateIndex
CREATE INDEX "ResearchProject_status_idx" ON "ResearchProject"("status");

-- CreateIndex
CREATE INDEX "ResearchProject_level_idx" ON "ResearchProject"("level");

-- CreateIndex
CREATE INDEX "ResearchProject_workflowStatus_idx" ON "ResearchProject"("workflowStatus");

-- CreateIndex
CREATE UNIQUE INDEX "hoc_vien_maHocVien_key" ON "hoc_vien"("maHocVien");

-- CreateIndex
CREATE UNIQUE INDEX "hoc_vien_userId_key" ON "hoc_vien"("userId");

-- CreateIndex
CREATE INDEX "hoc_vien_maHocVien_idx" ON "hoc_vien"("maHocVien");

-- CreateIndex
CREATE INDEX "hoc_vien_userId_idx" ON "hoc_vien"("userId");

-- CreateIndex
CREATE INDEX "hoc_vien_lop_idx" ON "hoc_vien"("lop");

-- CreateIndex
CREATE INDEX "hoc_vien_khoaHoc_idx" ON "hoc_vien"("khoaHoc");

-- CreateIndex
CREATE INDEX "hoc_vien_nganh_idx" ON "hoc_vien"("nganh");

-- CreateIndex
CREATE INDEX "hoc_vien_giangVienHuongDanId_idx" ON "hoc_vien"("giangVienHuongDanId");

-- CreateIndex
CREATE INDEX "hoc_vien_cohortId_idx" ON "hoc_vien"("cohortId");

-- CreateIndex
CREATE INDEX "hoc_vien_classId_idx" ON "hoc_vien"("classId");

-- CreateIndex
CREATE INDEX "hoc_vien_majorId_idx" ON "hoc_vien"("majorId");

-- CreateIndex
CREATE INDEX "hoc_vien_currentStatus_idx" ON "hoc_vien"("currentStatus");

-- CreateIndex
CREATE INDEX "hoc_vien_currentProgramVersionId_idx" ON "hoc_vien"("currentProgramVersionId");

-- CreateIndex
CREATE INDEX "hoc_vien_deletedAt_idx" ON "hoc_vien"("deletedAt");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_hocVienId_idx" ON "ket_qua_hoc_tap"("hocVienId");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_maMon_idx" ON "ket_qua_hoc_tap"("maMon");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_hocKy_idx" ON "ket_qua_hoc_tap"("hocKy");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_namHoc_idx" ON "ket_qua_hoc_tap"("namHoc");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_giangVienId_idx" ON "ket_qua_hoc_tap"("giangVienId");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_namHoc_hocKy_idx" ON "ket_qua_hoc_tap"("namHoc", "hocKy");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_diemTongKet_idx" ON "ket_qua_hoc_tap"("diemTongKet");

-- CreateIndex
CREATE INDEX "ket_qua_hoc_tap_workflowStatus_idx" ON "ket_qua_hoc_tap"("workflowStatus");

-- CreateIndex
CREATE INDEX "student_conduct_records_hocVienId_idx" ON "student_conduct_records"("hocVienId");

-- CreateIndex
CREATE INDEX "student_conduct_records_academicYear_semesterCode_idx" ON "student_conduct_records"("academicYear", "semesterCode");

-- CreateIndex
CREATE UNIQUE INDEX "student_conduct_records_hocVienId_academicYear_semesterCode_key" ON "student_conduct_records"("hocVienId", "academicYear", "semesterCode");

-- CreateIndex
CREATE INDEX "score_histories_enrollmentId_idx" ON "score_histories"("enrollmentId");

-- CreateIndex
CREATE INDEX "score_histories_changedAt_idx" ON "score_histories"("changedAt");

-- CreateIndex
CREATE INDEX "academic_warnings_hocVienId_idx" ON "academic_warnings"("hocVienId");

-- CreateIndex
CREATE INDEX "academic_warnings_academicYear_semesterCode_idx" ON "academic_warnings"("academicYear", "semesterCode");

-- CreateIndex
CREATE INDEX "academic_warnings_warningLevel_idx" ON "academic_warnings"("warningLevel");

-- CreateIndex
CREATE INDEX "academic_warnings_isResolved_idx" ON "academic_warnings"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "academic_warnings_hocVienId_academicYear_semesterCode_key" ON "academic_warnings"("hocVienId", "academicYear", "semesterCode");

-- CreateIndex
CREATE UNIQUE INDEX "he_so_mon_hoc_maMon_key" ON "he_so_mon_hoc"("maMon");

-- CreateIndex
CREATE INDEX "he_so_mon_hoc_maMon_idx" ON "he_so_mon_hoc"("maMon");

-- CreateIndex
CREATE INDEX "he_so_mon_hoc_khoa_idx" ON "he_so_mon_hoc"("khoa");

-- CreateIndex
CREATE INDEX "ai_insights_targetType_targetId_idx" ON "ai_insights"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ai_insights_type_generatedAt_idx" ON "ai_insights"("type", "generatedAt");

-- CreateIndex
CREATE INDEX "ai_insights_validUntil_idx" ON "ai_insights"("validUntil");

-- CreateIndex
CREATE INDEX "sentiment_analyses_sentiment_idx" ON "sentiment_analyses"("sentiment");

-- CreateIndex
CREATE INDEX "sentiment_analyses_analyzedAt_idx" ON "sentiment_analyses"("analyzedAt");

-- CreateIndex
CREATE INDEX "sentiment_analyses_feedbackId_idx" ON "sentiment_analyses"("feedbackId");

-- CreateIndex
CREATE INDEX "monthly_reports_year_month_idx" ON "monthly_reports"("year", "month");

-- CreateIndex
CREATE INDEX "monthly_reports_reportType_idx" ON "monthly_reports"("reportType");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_reportType_targetId_year_month_key" ON "monthly_reports"("reportType", "targetId", "year", "month");

-- CreateIndex
CREATE INDEX "ai_api_logs_provider_createdAt_idx" ON "ai_api_logs"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "ai_api_logs_success_idx" ON "ai_api_logs"("success");

-- CreateIndex
CREATE INDEX "ai_api_logs_userId_idx" ON "ai_api_logs"("userId");

-- CreateIndex
CREATE INDEX "model_registry_modelType_targetId_idx" ON "model_registry"("modelType", "targetId");

-- CreateIndex
CREATE INDEX "model_registry_createdAt_idx" ON "model_registry"("createdAt");

-- CreateIndex
CREATE INDEX "education_history_userId_idx" ON "education_history"("userId");

-- CreateIndex
CREATE INDEX "education_history_personnelId_idx" ON "education_history"("personnelId");

-- CreateIndex
CREATE INDEX "education_history_level_idx" ON "education_history"("level");

-- CreateIndex
CREATE INDEX "personnel_status_history_personnelId_idx" ON "personnel_status_history"("personnelId");

-- CreateIndex
CREATE INDEX "personnel_status_history_effectiveDate_idx" ON "personnel_status_history"("effectiveDate");

-- CreateIndex
CREATE INDEX "work_experience_userId_idx" ON "work_experience"("userId");

-- CreateIndex
CREATE INDEX "work_experience_startDate_idx" ON "work_experience"("startDate");

-- CreateIndex
CREATE INDEX "scientific_publications_userId_idx" ON "scientific_publications"("userId");

-- CreateIndex
CREATE INDEX "scientific_publications_type_idx" ON "scientific_publications"("type");

-- CreateIndex
CREATE INDEX "scientific_publications_year_idx" ON "scientific_publications"("year");

-- CreateIndex
CREATE INDEX "scientific_research_userId_idx" ON "scientific_research"("userId");

-- CreateIndex
CREATE INDEX "scientific_research_year_idx" ON "scientific_research"("year");

-- CreateIndex
CREATE INDEX "scientific_research_level_idx" ON "scientific_research"("level");

-- CreateIndex
CREATE INDEX "awards_records_userId_idx" ON "awards_records"("userId");

-- CreateIndex
CREATE INDEX "awards_records_type_idx" ON "awards_records"("type");

-- CreateIndex
CREATE INDEX "awards_records_year_idx" ON "awards_records"("year");

-- CreateIndex
CREATE UNIQUE INDEX "scientific_profiles_userId_key" ON "scientific_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scientific_profiles_personnelId_key" ON "scientific_profiles"("personnelId");

-- CreateIndex
CREATE INDEX "scientific_profiles_userId_idx" ON "scientific_profiles"("userId");

-- CreateIndex
CREATE INDEX "scientific_profiles_personnelId_idx" ON "scientific_profiles"("personnelId");

-- CreateIndex
CREATE INDEX "scientific_profiles_createdAt_idx" ON "scientific_profiles"("createdAt");

-- CreateIndex
CREATE INDEX "foreign_language_certs_userId_idx" ON "foreign_language_certs"("userId");

-- CreateIndex
CREATE INDEX "foreign_language_certs_language_idx" ON "foreign_language_certs"("language");

-- CreateIndex
CREATE INDEX "technical_certificates_userId_idx" ON "technical_certificates"("userId");

-- CreateIndex
CREATE INDEX "technical_certificates_certType_idx" ON "technical_certificates"("certType");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_code_idx" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_facultyId_idx" ON "courses"("facultyId");

-- CreateIndex
CREATE INDEX "courses_semester_year_idx" ON "courses"("semester", "year");

-- CreateIndex
CREATE INDEX "courses_departmentId_idx" ON "courses"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "rooms_code_idx" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "rooms_building_idx" ON "rooms"("building");

-- CreateIndex
CREATE INDEX "rooms_roomType_idx" ON "rooms"("roomType");

-- CreateIndex
CREATE INDEX "registrations_hocVienId_idx" ON "registrations"("hocVienId");

-- CreateIndex
CREATE INDEX "registrations_courseId_idx" ON "registrations"("courseId");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE INDEX "registrations_registeredAt_idx" ON "registrations"("registeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_hocVienId_courseId_key" ON "registrations"("hocVienId", "courseId");

-- CreateIndex
CREATE INDEX "exams_courseId_idx" ON "exams"("courseId");

-- CreateIndex
CREATE INDEX "exams_examDate_idx" ON "exams"("examDate");

-- CreateIndex
CREATE INDEX "exams_roomId_idx" ON "exams"("roomId");

-- CreateIndex
CREATE INDEX "exams_invigilatorId_idx" ON "exams"("invigilatorId");

-- CreateIndex
CREATE UNIQUE INDEX "grade_records_registrationId_key" ON "grade_records"("registrationId");

-- CreateIndex
CREATE INDEX "grade_records_status_idx" ON "grade_records"("status");

-- CreateIndex
CREATE INDEX "grade_records_letterGrade_idx" ON "grade_records"("letterGrade");

-- CreateIndex
CREATE INDEX "grade_records_gradedAt_idx" ON "grade_records"("gradedAt");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_code_key" ON "academic_years"("code");

-- CreateIndex
CREATE INDEX "academic_years_code_idx" ON "academic_years"("code");

-- CreateIndex
CREATE INDEX "academic_years_isCurrent_idx" ON "academic_years"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "terms_code_key" ON "terms"("code");

-- CreateIndex
CREATE INDEX "terms_code_idx" ON "terms"("code");

-- CreateIndex
CREATE INDEX "terms_academicYearId_idx" ON "terms"("academicYearId");

-- CreateIndex
CREATE INDEX "terms_isCurrent_idx" ON "terms"("isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE INDEX "programs_code_idx" ON "programs"("code");

-- CreateIndex
CREATE INDEX "programs_programType_idx" ON "programs"("programType");

-- CreateIndex
CREATE INDEX "programs_unitId_idx" ON "programs"("unitId");

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");

-- CreateIndex
CREATE INDEX "program_versions_programId_idx" ON "program_versions"("programId");

-- CreateIndex
CREATE INDEX "program_versions_status_idx" ON "program_versions"("status");

-- CreateIndex
CREATE INDEX "program_versions_effectiveFromCohort_idx" ON "program_versions"("effectiveFromCohort");

-- CreateIndex
CREATE UNIQUE INDEX "program_versions_programId_versionCode_key" ON "program_versions"("programId", "versionCode");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_plans_code_key" ON "curriculum_plans"("code");

-- CreateIndex
CREATE INDEX "curriculum_plans_programId_idx" ON "curriculum_plans"("programId");

-- CreateIndex
CREATE INDEX "curriculum_plans_programVersionId_idx" ON "curriculum_plans"("programVersionId");

-- CreateIndex
CREATE INDEX "curriculum_plans_academicYearId_idx" ON "curriculum_plans"("academicYearId");

-- CreateIndex
CREATE INDEX "curriculum_plans_cohort_idx" ON "curriculum_plans"("cohort");

-- CreateIndex
CREATE INDEX "curriculum_plans_status_idx" ON "curriculum_plans"("status");

-- CreateIndex
CREATE INDEX "curriculum_courses_curriculumPlanId_idx" ON "curriculum_courses"("curriculumPlanId");

-- CreateIndex
CREATE INDEX "curriculum_courses_subjectCode_idx" ON "curriculum_courses"("subjectCode");

-- CreateIndex
CREATE INDEX "curriculum_courses_semester_idx" ON "curriculum_courses"("semester");

-- CreateIndex
CREATE INDEX "curriculum_courses_courseType_idx" ON "curriculum_courses"("courseType");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_courses_curriculumPlanId_subjectCode_key" ON "curriculum_courses"("curriculumPlanId", "subjectCode");

-- CreateIndex
CREATE UNIQUE INDEX "class_sections_code_key" ON "class_sections"("code");

-- CreateIndex
CREATE INDEX "class_sections_curriculumCourseId_idx" ON "class_sections"("curriculumCourseId");

-- CreateIndex
CREATE INDEX "class_sections_termId_idx" ON "class_sections"("termId");

-- CreateIndex
CREATE INDEX "class_sections_facultyId_idx" ON "class_sections"("facultyId");

-- CreateIndex
CREATE INDEX "class_sections_roomId_idx" ON "class_sections"("roomId");

-- CreateIndex
CREATE INDEX "class_sections_status_idx" ON "class_sections"("status");

-- CreateIndex
CREATE INDEX "class_sections_termId_dayOfWeek_startPeriod_endPeriod_idx" ON "class_sections"("termId", "dayOfWeek", "startPeriod", "endPeriod");

-- CreateIndex
CREATE INDEX "class_sections_termId_roomId_idx" ON "class_sections"("termId", "roomId");

-- CreateIndex
CREATE INDEX "class_sections_termId_facultyId_idx" ON "class_sections"("termId", "facultyId");

-- CreateIndex
CREATE INDEX "class_enrollments_classSectionId_idx" ON "class_enrollments"("classSectionId");

-- CreateIndex
CREATE INDEX "class_enrollments_hocVienId_idx" ON "class_enrollments"("hocVienId");

-- CreateIndex
CREATE INDEX "class_enrollments_status_idx" ON "class_enrollments"("status");

-- CreateIndex
CREATE INDEX "class_enrollments_gradeStatus_idx" ON "class_enrollments"("gradeStatus");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_classSectionId_hocVienId_key" ON "class_enrollments"("classSectionId", "hocVienId");

-- CreateIndex
CREATE INDEX "training_sessions_classSectionId_idx" ON "training_sessions"("classSectionId");

-- CreateIndex
CREATE INDEX "training_sessions_termId_idx" ON "training_sessions"("termId");

-- CreateIndex
CREATE INDEX "training_sessions_sessionDate_idx" ON "training_sessions"("sessionDate");

-- CreateIndex
CREATE INDEX "training_sessions_status_idx" ON "training_sessions"("status");

-- CreateIndex
CREATE INDEX "session_attendances_sessionId_idx" ON "session_attendances"("sessionId");

-- CreateIndex
CREATE INDEX "session_attendances_enrollmentId_idx" ON "session_attendances"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendances_sessionId_enrollmentId_key" ON "session_attendances"("sessionId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "external_api_keys_keyHash_key" ON "external_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "external_api_keys_keyPrefix_idx" ON "external_api_keys"("keyPrefix");

-- CreateIndex
CREATE INDEX "external_api_keys_status_idx" ON "external_api_keys"("status");

-- CreateIndex
CREATE INDEX "external_api_logs_apiKeyId_idx" ON "external_api_logs"("apiKeyId");

-- CreateIndex
CREATE INDEX "external_api_logs_createdAt_idx" ON "external_api_logs"("createdAt");

-- CreateIndex
CREATE INDEX "external_api_logs_endpoint_idx" ON "external_api_logs"("endpoint");

-- CreateIndex
CREATE INDEX "infrastructure_configs_configType_idx" ON "infrastructure_configs"("configType");

-- CreateIndex
CREATE INDEX "infrastructure_configs_isEnabled_idx" ON "infrastructure_configs"("isEnabled");

-- CreateIndex
CREATE INDEX "sync_logs_configId_idx" ON "sync_logs"("configId");

-- CreateIndex
CREATE INDEX "sync_logs_createdAt_idx" ON "sync_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_requestId_idx" ON "audit_logs"("requestId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "career_histories_userId_idx" ON "career_histories"("userId");

-- CreateIndex
CREATE INDEX "career_histories_personnelId_idx" ON "career_histories"("personnelId");

-- CreateIndex
CREATE INDEX "career_histories_eventType_idx" ON "career_histories"("eventType");

-- CreateIndex
CREATE INDEX "career_histories_eventDate_idx" ON "career_histories"("eventDate");

-- CreateIndex
CREATE INDEX "career_histories_deletedAt_idx" ON "career_histories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "party_organizations_code_key" ON "party_organizations"("code");

-- CreateIndex
CREATE INDEX "party_organizations_code_idx" ON "party_organizations"("code");

-- CreateIndex
CREATE INDEX "party_organizations_parentId_idx" ON "party_organizations"("parentId");

-- CreateIndex
CREATE INDEX "party_organizations_orgLevel_idx" ON "party_organizations"("orgLevel");

-- CreateIndex
CREATE INDEX "party_organizations_linkedUnitId_idx" ON "party_organizations"("linkedUnitId");

-- CreateIndex
CREATE INDEX "party_organizations_unitId_idx" ON "party_organizations"("unitId");

-- CreateIndex
CREATE INDEX "party_organizations_secretaryUserId_idx" ON "party_organizations"("secretaryUserId");

-- CreateIndex
CREATE INDEX "party_organizations_deputySecretaryUserId_idx" ON "party_organizations"("deputySecretaryUserId");

-- CreateIndex
CREATE INDEX "party_organizations_organizationType_idx" ON "party_organizations"("organizationType");

-- CreateIndex
CREATE INDEX "party_organizations_isActive_idx" ON "party_organizations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "party_members_userId_key" ON "party_members"("userId");

-- CreateIndex
CREATE INDEX "party_members_userId_idx" ON "party_members"("userId");

-- CreateIndex
CREATE INDEX "party_members_organizationId_idx" ON "party_members"("organizationId");

-- CreateIndex
CREATE INDEX "party_members_status_idx" ON "party_members"("status");

-- CreateIndex
CREATE INDEX "party_members_deletedAt_idx" ON "party_members"("deletedAt");

-- CreateIndex
CREATE INDEX "party_meetings_partyOrgId_idx" ON "party_meetings"("partyOrgId");

-- CreateIndex
CREATE INDEX "party_meetings_meetingDate_idx" ON "party_meetings"("meetingDate");

-- CreateIndex
CREATE INDEX "party_meetings_meetingType_idx" ON "party_meetings"("meetingType");

-- CreateIndex
CREATE INDEX "party_meetings_status_idx" ON "party_meetings"("status");

-- CreateIndex
CREATE INDEX "party_meetings_createdBy_idx" ON "party_meetings"("createdBy");

-- CreateIndex
CREATE INDEX "party_meeting_attendances_meetingId_idx" ON "party_meeting_attendances"("meetingId");

-- CreateIndex
CREATE INDEX "party_meeting_attendances_partyMemberId_idx" ON "party_meeting_attendances"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_meeting_attendances_attendanceStatus_idx" ON "party_meeting_attendances"("attendanceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "party_meeting_attendances_meetingId_partyMemberId_key" ON "party_meeting_attendances"("meetingId", "partyMemberId");

-- CreateIndex
CREATE INDEX "party_fee_payments_partyMemberId_idx" ON "party_fee_payments"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_fee_payments_paymentMonth_idx" ON "party_fee_payments"("paymentMonth");

-- CreateIndex
CREATE INDEX "party_fee_payments_status_idx" ON "party_fee_payments"("status");

-- CreateIndex
CREATE INDEX "party_fee_payments_paymentDate_idx" ON "party_fee_payments"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "party_fee_payments_partyMemberId_paymentMonth_key" ON "party_fee_payments"("partyMemberId", "paymentMonth");

-- CreateIndex
CREATE INDEX "party_annual_reviews_partyMemberId_idx" ON "party_annual_reviews"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_annual_reviews_reviewYear_idx" ON "party_annual_reviews"("reviewYear");

-- CreateIndex
CREATE INDEX "party_annual_reviews_grade_idx" ON "party_annual_reviews"("grade");

-- CreateIndex
CREATE INDEX "party_annual_reviews_submissionStatus_idx" ON "party_annual_reviews"("submissionStatus");

-- CreateIndex
CREATE INDEX "party_annual_reviews_approvedAt_idx" ON "party_annual_reviews"("approvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "party_annual_reviews_partyMemberId_reviewYear_key" ON "party_annual_reviews"("partyMemberId", "reviewYear");

-- CreateIndex
CREATE INDEX "party_awards_partyMemberId_idx" ON "party_awards"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_awards_decisionDate_idx" ON "party_awards"("decisionDate");

-- CreateIndex
CREATE INDEX "party_awards_issuer_idx" ON "party_awards"("issuer");

-- CreateIndex
CREATE INDEX "party_disciplines_partyMemberId_idx" ON "party_disciplines"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_disciplines_severity_idx" ON "party_disciplines"("severity");

-- CreateIndex
CREATE INDEX "party_disciplines_decisionDate_idx" ON "party_disciplines"("decisionDate");

-- CreateIndex
CREATE INDEX "party_disciplines_expiryDate_idx" ON "party_disciplines"("expiryDate");

-- CreateIndex
CREATE INDEX "party_transfers_partyMemberId_idx" ON "party_transfers"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_transfers_transferType_idx" ON "party_transfers"("transferType");

-- CreateIndex
CREATE INDEX "party_transfers_fromPartyOrgId_idx" ON "party_transfers"("fromPartyOrgId");

-- CreateIndex
CREATE INDEX "party_transfers_toPartyOrgId_idx" ON "party_transfers"("toPartyOrgId");

-- CreateIndex
CREATE INDEX "party_transfers_transferDate_idx" ON "party_transfers"("transferDate");

-- CreateIndex
CREATE INDEX "party_transfers_confirmStatus_idx" ON "party_transfers"("confirmStatus");

-- CreateIndex
CREATE INDEX "party_inspection_targets_partyMemberId_idx" ON "party_inspection_targets"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_inspection_targets_partyOrgId_idx" ON "party_inspection_targets"("partyOrgId");

-- CreateIndex
CREATE INDEX "party_inspection_targets_inspectionType_idx" ON "party_inspection_targets"("inspectionType");

-- CreateIndex
CREATE INDEX "party_inspection_targets_openedAt_idx" ON "party_inspection_targets"("openedAt");

-- CreateIndex
CREATE INDEX "party_inspection_targets_closedAt_idx" ON "party_inspection_targets"("closedAt");

-- CreateIndex
CREATE INDEX "party_inspection_targets_createdBy_idx" ON "party_inspection_targets"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "party_recruitment_pipelines_userId_key" ON "party_recruitment_pipelines"("userId");

-- CreateIndex
CREATE INDEX "party_recruitment_pipelines_currentStep_idx" ON "party_recruitment_pipelines"("currentStep");

-- CreateIndex
CREATE INDEX "party_recruitment_pipelines_targetPartyOrgId_idx" ON "party_recruitment_pipelines"("targetPartyOrgId");

-- CreateIndex
CREATE INDEX "party_recruitment_pipelines_createdAt_idx" ON "party_recruitment_pipelines"("createdAt");

-- CreateIndex
CREATE INDEX "party_activities_partyMemberId_idx" ON "party_activities"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_activities_activityType_idx" ON "party_activities"("activityType");

-- CreateIndex
CREATE INDEX "party_activities_activityDate_idx" ON "party_activities"("activityDate");

-- CreateIndex
CREATE INDEX "party_activities_deletedAt_idx" ON "party_activities"("deletedAt");

-- CreateIndex
CREATE INDEX "party_member_histories_partyMemberId_idx" ON "party_member_histories"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_member_histories_organizationId_idx" ON "party_member_histories"("organizationId");

-- CreateIndex
CREATE INDEX "party_member_histories_historyType_idx" ON "party_member_histories"("historyType");

-- CreateIndex
CREATE INDEX "party_member_histories_effectiveDate_idx" ON "party_member_histories"("effectiveDate");

-- CreateIndex
CREATE INDEX "party_lifecycle_events_partyMemberId_idx" ON "party_lifecycle_events"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_lifecycle_events_eventType_idx" ON "party_lifecycle_events"("eventType");

-- CreateIndex
CREATE INDEX "party_lifecycle_events_eventDate_idx" ON "party_lifecycle_events"("eventDate");

-- CreateIndex
CREATE INDEX "party_lifecycle_alerts_partyMemberId_idx" ON "party_lifecycle_alerts"("partyMemberId");

-- CreateIndex
CREATE INDEX "party_lifecycle_alerts_alertType_idx" ON "party_lifecycle_alerts"("alertType");

-- CreateIndex
CREATE INDEX "party_lifecycle_alerts_status_idx" ON "party_lifecycle_alerts"("status");

-- CreateIndex
CREATE INDEX "party_lifecycle_alerts_dueDate_idx" ON "party_lifecycle_alerts"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "party_lifecycle_alerts_partyMemberId_alertType_dueDate_key" ON "party_lifecycle_alerts"("partyMemberId", "alertType", "dueDate");

-- CreateIndex
CREATE INDEX "policy_records_userId_idx" ON "policy_records"("userId");

-- CreateIndex
CREATE INDEX "policy_records_unitId_idx" ON "policy_records"("unitId");

-- CreateIndex
CREATE INDEX "policy_records_recordType_idx" ON "policy_records"("recordType");

-- CreateIndex
CREATE INDEX "policy_records_form_idx" ON "policy_records"("form");

-- CreateIndex
CREATE INDEX "policy_records_level_idx" ON "policy_records"("level");

-- CreateIndex
CREATE INDEX "policy_records_status_idx" ON "policy_records"("status");

-- CreateIndex
CREATE INDEX "policy_records_workflowStatus_idx" ON "policy_records"("workflowStatus");

-- CreateIndex
CREATE INDEX "policy_records_year_idx" ON "policy_records"("year");

-- CreateIndex
CREATE INDEX "policy_records_decisionDate_idx" ON "policy_records"("decisionDate");

-- CreateIndex
CREATE INDEX "policy_records_effectiveDate_idx" ON "policy_records"("effectiveDate");

-- CreateIndex
CREATE INDEX "policy_records_deletedAt_idx" ON "policy_records"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_infos_userId_key" ON "insurance_infos"("userId");

-- CreateIndex
CREATE INDEX "insurance_infos_userId_idx" ON "insurance_infos"("userId");

-- CreateIndex
CREATE INDEX "insurance_infos_deletedAt_idx" ON "insurance_infos"("deletedAt");

-- CreateIndex
CREATE INDEX "medical_records_userId_idx" ON "medical_records"("userId");

-- CreateIndex
CREATE INDEX "medical_records_recordType_idx" ON "medical_records"("recordType");

-- CreateIndex
CREATE INDEX "medical_records_recordDate_idx" ON "medical_records"("recordDate");

-- CreateIndex
CREATE INDEX "medical_records_deletedAt_idx" ON "medical_records"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_maHocVien_key" ON "student_profiles"("maHocVien");

-- CreateIndex
CREATE INDEX "student_profiles_userId_idx" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_maHocVien_idx" ON "student_profiles"("maHocVien");

-- CreateIndex
CREATE INDEX "student_profiles_lop_idx" ON "student_profiles"("lop");

-- CreateIndex
CREATE INDEX "student_profiles_khoaHoc_idx" ON "student_profiles"("khoaHoc");

-- CreateIndex
CREATE INDEX "student_profiles_trangThai_idx" ON "student_profiles"("trangThai");

-- CreateIndex
CREATE INDEX "student_profiles_deletedAt_idx" ON "student_profiles"("deletedAt");

-- CreateIndex
CREATE INDEX "family_relations_userId_idx" ON "family_relations"("userId");

-- CreateIndex
CREATE INDEX "family_relations_personnelId_idx" ON "family_relations"("personnelId");

-- CreateIndex
CREATE INDEX "family_relations_relation_idx" ON "family_relations"("relation");

-- CreateIndex
CREATE INDEX "family_relations_deletedAt_idx" ON "family_relations"("deletedAt");

-- CreateIndex
CREATE INDEX "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "user_permission_grants_userId_idx" ON "user_permission_grants"("userId");

-- CreateIndex
CREATE INDEX "user_permission_grants_permission_idx" ON "user_permission_grants"("permission");

-- CreateIndex
CREATE INDEX "user_permission_grants_scopeType_idx" ON "user_permission_grants"("scopeType");

-- CreateIndex
CREATE INDEX "user_permission_grants_expiresAt_idx" ON "user_permission_grants"("expiresAt");

-- CreateIndex
CREATE INDEX "user_permission_grants_isRevoked_idx" ON "user_permission_grants"("isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_grants_userId_permission_scopeType_unitId_key" ON "user_permission_grants"("userId", "permission", "scopeType", "unitId");

-- CreateIndex
CREATE INDEX "user_permission_grant_personnel_grantId_idx" ON "user_permission_grant_personnel"("grantId");

-- CreateIndex
CREATE INDEX "user_permission_grant_personnel_personnelId_idx" ON "user_permission_grant_personnel"("personnelId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_grant_personnel_grantId_personnelId_key" ON "user_permission_grant_personnel"("grantId", "personnelId");

-- CreateIndex
CREATE INDEX "personnel_ai_analyses_userId_idx" ON "personnel_ai_analyses"("userId");

-- CreateIndex
CREATE INDEX "personnel_ai_analyses_analysisType_idx" ON "personnel_ai_analyses"("analysisType");

-- CreateIndex
CREATE INDEX "personnel_ai_analyses_riskLevel_idx" ON "personnel_ai_analyses"("riskLevel");

-- CreateIndex
CREATE INDEX "personnel_ai_analyses_createdAt_idx" ON "personnel_ai_analyses"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_personnelCode_key" ON "personnel"("personnelCode");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_militaryIdNumber_key" ON "personnel"("militaryIdNumber");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_studentIdNumber_key" ON "personnel"("studentIdNumber");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_employeeIdNumber_key" ON "personnel"("employeeIdNumber");

-- CreateIndex
CREATE INDEX "personnel_personnelCode_idx" ON "personnel"("personnelCode");

-- CreateIndex
CREATE INDEX "personnel_category_idx" ON "personnel"("category");

-- CreateIndex
CREATE INDEX "personnel_managingOrgan_idx" ON "personnel"("managingOrgan");

-- CreateIndex
CREATE INDEX "personnel_unitId_idx" ON "personnel"("unitId");

-- CreateIndex
CREATE INDEX "personnel_status_idx" ON "personnel"("status");

-- CreateIndex
CREATE INDEX "personnel_militaryIdNumber_idx" ON "personnel"("militaryIdNumber");

-- CreateIndex
CREATE INDEX "personnel_studentIdNumber_idx" ON "personnel"("studentIdNumber");

-- CreateIndex
CREATE INDEX "personnel_employeeIdNumber_idx" ON "personnel"("employeeIdNumber");

-- CreateIndex
CREATE INDEX "personnel_fullName_idx" ON "personnel"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "sensitive_identities_personnelId_key" ON "sensitive_identities"("personnelId");

-- CreateIndex
CREATE INDEX "personnel_events_personnelId_idx" ON "personnel_events"("personnelId");

-- CreateIndex
CREATE INDEX "personnel_events_eventType_idx" ON "personnel_events"("eventType");

-- CreateIndex
CREATE INDEX "personnel_events_eventDate_idx" ON "personnel_events"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "positions_code_key" ON "positions"("code");

-- CreateIndex
CREATE INDEX "positions_code_idx" ON "positions"("code");

-- CreateIndex
CREATE INDEX "positions_positionScope_idx" ON "positions"("positionScope");

-- CreateIndex
CREATE UNIQUE INDEX "functions_code_key" ON "functions"("code");

-- CreateIndex
CREATE INDEX "functions_code_idx" ON "functions"("code");

-- CreateIndex
CREATE INDEX "functions_module_idx" ON "functions"("module");

-- CreateIndex
CREATE INDEX "functions_actionType_idx" ON "functions"("actionType");

-- CreateIndex
CREATE INDEX "position_functions_positionId_idx" ON "position_functions"("positionId");

-- CreateIndex
CREATE INDEX "position_functions_functionId_idx" ON "position_functions"("functionId");

-- CreateIndex
CREATE INDEX "position_functions_scope_idx" ON "position_functions"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "position_functions_positionId_functionId_key" ON "position_functions"("positionId", "functionId");

-- CreateIndex
CREATE INDEX "user_positions_userId_idx" ON "user_positions"("userId");

-- CreateIndex
CREATE INDEX "user_positions_positionId_idx" ON "user_positions"("positionId");

-- CreateIndex
CREATE INDEX "user_positions_unitId_idx" ON "user_positions"("unitId");

-- CreateIndex
CREATE INDEX "user_positions_startDate_endDate_idx" ON "user_positions"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "user_positions_isPrimary_idx" ON "user_positions"("isPrimary");

-- CreateIndex
CREATE INDEX "unit_position_aliases_unitId_idx" ON "unit_position_aliases"("unitId");

-- CreateIndex
CREATE INDEX "unit_position_aliases_positionId_idx" ON "unit_position_aliases"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_position_aliases_unitId_positionId_key" ON "unit_position_aliases"("unitId", "positionId");

-- CreateIndex
CREATE INDEX "permission_conflicts_functionCodeA_idx" ON "permission_conflicts"("functionCodeA");

-- CreateIndex
CREATE INDEX "permission_conflicts_functionCodeB_idx" ON "permission_conflicts"("functionCodeB");

-- CreateIndex
CREATE UNIQUE INDEX "permission_conflicts_functionCodeA_functionCodeB_key" ON "permission_conflicts"("functionCodeA", "functionCodeB");

-- CreateIndex
CREATE UNIQUE INDEX "policy_categories_code_key" ON "policy_categories"("code");

-- CreateIndex
CREATE INDEX "policy_categories_code_idx" ON "policy_categories"("code");

-- CreateIndex
CREATE INDEX "policy_categories_parentId_idx" ON "policy_categories"("parentId");

-- CreateIndex
CREATE INDEX "policy_categories_isActive_idx" ON "policy_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "policy_requests_requestNumber_key" ON "policy_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "policy_requests_requestNumber_idx" ON "policy_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "policy_requests_requesterId_idx" ON "policy_requests"("requesterId");

-- CreateIndex
CREATE INDEX "policy_requests_categoryId_idx" ON "policy_requests"("categoryId");

-- CreateIndex
CREATE INDEX "policy_requests_status_idx" ON "policy_requests"("status");

-- CreateIndex
CREATE INDEX "policy_requests_createdAt_idx" ON "policy_requests"("createdAt");

-- CreateIndex
CREATE INDEX "policy_requests_deletedAt_idx" ON "policy_requests"("deletedAt");

-- CreateIndex
CREATE INDEX "policy_attachments_requestId_idx" ON "policy_attachments"("requestId");

-- CreateIndex
CREATE INDEX "policy_workflow_logs_requestId_idx" ON "policy_workflow_logs"("requestId");

-- CreateIndex
CREATE INDEX "policy_workflow_logs_action_idx" ON "policy_workflow_logs"("action");

-- CreateIndex
CREATE INDEX "policy_workflow_logs_performedBy_idx" ON "policy_workflow_logs"("performedBy");

-- CreateIndex
CREATE INDEX "policy_workflow_logs_createdAt_idx" ON "policy_workflow_logs"("createdAt");

-- CreateIndex
CREATE INDEX "insurance_histories_insuranceInfoId_idx" ON "insurance_histories"("insuranceInfoId");

-- CreateIndex
CREATE INDEX "insurance_histories_transactionType_idx" ON "insurance_histories"("transactionType");

-- CreateIndex
CREATE INDEX "insurance_histories_periodYear_periodMonth_idx" ON "insurance_histories"("periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "insurance_histories_deletedAt_idx" ON "insurance_histories"("deletedAt");

-- CreateIndex
CREATE INDEX "insurance_dependents_insuranceInfoId_idx" ON "insurance_dependents"("insuranceInfoId");

-- CreateIndex
CREATE INDEX "insurance_dependents_relationship_idx" ON "insurance_dependents"("relationship");

-- CreateIndex
CREATE INDEX "insurance_dependents_status_idx" ON "insurance_dependents"("status");

-- CreateIndex
CREATE INDEX "insurance_dependents_deletedAt_idx" ON "insurance_dependents"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "officer_careers_personnelId_key" ON "officer_careers"("personnelId");

-- CreateIndex
CREATE UNIQUE INDEX "officer_careers_officerIdNumber_key" ON "officer_careers"("officerIdNumber");

-- CreateIndex
CREATE INDEX "officer_careers_personnelId_idx" ON "officer_careers"("personnelId");

-- CreateIndex
CREATE INDEX "officer_careers_currentRank_idx" ON "officer_careers"("currentRank");

-- CreateIndex
CREATE INDEX "officer_careers_officerIdNumber_idx" ON "officer_careers"("officerIdNumber");

-- CreateIndex
CREATE INDEX "officer_promotions_officerCareerId_idx" ON "officer_promotions"("officerCareerId");

-- CreateIndex
CREATE INDEX "officer_promotions_effectiveDate_idx" ON "officer_promotions"("effectiveDate");

-- CreateIndex
CREATE INDEX "officer_promotions_promotionType_idx" ON "officer_promotions"("promotionType");

-- CreateIndex
CREATE INDEX "promotion_special_cases_officerCareerId_idx" ON "promotion_special_cases"("officerCareerId");

-- CreateIndex
CREATE INDEX "promotion_special_cases_soldierProfileId_idx" ON "promotion_special_cases"("soldierProfileId");

-- CreateIndex
CREATE INDEX "promotion_special_cases_isActive_idx" ON "promotion_special_cases"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "soldier_profiles_personnelId_key" ON "soldier_profiles"("personnelId");

-- CreateIndex
CREATE UNIQUE INDEX "soldier_profiles_soldierIdNumber_key" ON "soldier_profiles"("soldierIdNumber");

-- CreateIndex
CREATE INDEX "soldier_profiles_personnelId_idx" ON "soldier_profiles"("personnelId");

-- CreateIndex
CREATE INDEX "soldier_profiles_soldierCategory_idx" ON "soldier_profiles"("soldierCategory");

-- CreateIndex
CREATE INDEX "soldier_profiles_soldierIdNumber_idx" ON "soldier_profiles"("soldierIdNumber");

-- CreateIndex
CREATE INDEX "soldier_profiles_serviceType_idx" ON "soldier_profiles"("serviceType");

-- CreateIndex
CREATE INDEX "soldier_service_records_soldierProfileId_idx" ON "soldier_service_records"("soldierProfileId");

-- CreateIndex
CREATE INDEX "soldier_service_records_eventDate_idx" ON "soldier_service_records"("eventDate");

-- CreateIndex
CREATE INDEX "soldier_service_records_eventType_idx" ON "soldier_service_records"("eventType");

-- CreateIndex
CREATE INDEX "insurance_claims_insuranceInfoId_idx" ON "insurance_claims"("insuranceInfoId");

-- CreateIndex
CREATE INDEX "insurance_claims_claimType_idx" ON "insurance_claims"("claimType");

-- CreateIndex
CREATE INDEX "insurance_claims_status_idx" ON "insurance_claims"("status");

-- CreateIndex
CREATE INDEX "insurance_claims_startDate_idx" ON "insurance_claims"("startDate");

-- CreateIndex
CREATE INDEX "insurance_claims_deletedAt_idx" ON "insurance_claims"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "medical_facilities_code_key" ON "medical_facilities"("code");

-- CreateIndex
CREATE INDEX "medical_facilities_type_idx" ON "medical_facilities"("type");

-- CreateIndex
CREATE INDEX "medical_facilities_province_idx" ON "medical_facilities"("province");

-- CreateIndex
CREATE INDEX "medical_facilities_isActive_idx" ON "medical_facilities"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "military_salary_grades_rankCode_key" ON "military_salary_grades"("rankCode");

-- CreateIndex
CREATE INDEX "military_salary_grades_rankCode_idx" ON "military_salary_grades"("rankCode");

-- CreateIndex
CREATE INDEX "military_salary_grades_isActive_idx" ON "military_salary_grades"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "exam_plans_code_key" ON "exam_plans"("code");

-- CreateIndex
CREATE INDEX "exam_plans_termId_idx" ON "exam_plans"("termId");

-- CreateIndex
CREATE INDEX "exam_plans_examType_idx" ON "exam_plans"("examType");

-- CreateIndex
CREATE INDEX "exam_plans_status_idx" ON "exam_plans"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_sessions_code_key" ON "exam_sessions"("code");

-- CreateIndex
CREATE INDEX "exam_sessions_examPlanId_idx" ON "exam_sessions"("examPlanId");

-- CreateIndex
CREATE INDEX "exam_sessions_examDate_idx" ON "exam_sessions"("examDate");

-- CreateIndex
CREATE INDEX "exam_sessions_roomId_idx" ON "exam_sessions"("roomId");

-- CreateIndex
CREATE INDEX "exam_sessions_status_idx" ON "exam_sessions"("status");

-- CreateIndex
CREATE INDEX "exam_registrations_examSessionId_idx" ON "exam_registrations"("examSessionId");

-- CreateIndex
CREATE INDEX "exam_registrations_hocVienId_idx" ON "exam_registrations"("hocVienId");

-- CreateIndex
CREATE INDEX "exam_registrations_status_idx" ON "exam_registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_registrations_examSessionId_hocVienId_key" ON "exam_registrations"("examSessionId", "hocVienId");

-- CreateIndex
CREATE UNIQUE INDEX "question_banks_code_key" ON "question_banks"("code");

-- CreateIndex
CREATE INDEX "question_banks_subjectCode_idx" ON "question_banks"("subjectCode");

-- CreateIndex
CREATE INDEX "question_banks_unitId_idx" ON "question_banks"("unitId");

-- CreateIndex
CREATE INDEX "questions_questionBankId_idx" ON "questions"("questionBankId");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_questionType_idx" ON "questions"("questionType");

-- CreateIndex
CREATE INDEX "questions_chapter_idx" ON "questions"("chapter");

-- CreateIndex
CREATE UNIQUE INDEX "questions_questionBankId_code_key" ON "questions"("questionBankId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "learning_materials_code_key" ON "learning_materials"("code");

-- CreateIndex
CREATE INDEX "learning_materials_subjectCode_idx" ON "learning_materials"("subjectCode");

-- CreateIndex
CREATE INDEX "learning_materials_materialType_idx" ON "learning_materials"("materialType");

-- CreateIndex
CREATE INDEX "learning_materials_unitId_idx" ON "learning_materials"("unitId");

-- CreateIndex
CREATE INDEX "learning_materials_authorId_idx" ON "learning_materials"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "labs_code_key" ON "labs"("code");

-- CreateIndex
CREATE INDEX "labs_labType_idx" ON "labs"("labType");

-- CreateIndex
CREATE INDEX "labs_unitId_idx" ON "labs"("unitId");

-- CreateIndex
CREATE INDEX "labs_status_idx" ON "labs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lab_equipments_code_key" ON "lab_equipments"("code");

-- CreateIndex
CREATE INDEX "lab_equipments_labId_idx" ON "lab_equipments"("labId");

-- CreateIndex
CREATE INDEX "lab_equipments_equipmentType_idx" ON "lab_equipments"("equipmentType");

-- CreateIndex
CREATE INDEX "lab_equipments_status_idx" ON "lab_equipments"("status");

-- CreateIndex
CREATE INDEX "equipment_maintenances_equipmentId_idx" ON "equipment_maintenances"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_maintenances_performedDate_idx" ON "equipment_maintenances"("performedDate");

-- CreateIndex
CREATE UNIQUE INDEX "lab_sessions_code_key" ON "lab_sessions"("code");

-- CreateIndex
CREATE INDEX "lab_sessions_labId_idx" ON "lab_sessions"("labId");

-- CreateIndex
CREATE INDEX "lab_sessions_sessionDate_idx" ON "lab_sessions"("sessionDate");

-- CreateIndex
CREATE INDEX "lab_sessions_status_idx" ON "lab_sessions"("status");

-- CreateIndex
CREATE INDEX "teaching_statistics_facultyId_idx" ON "teaching_statistics"("facultyId");

-- CreateIndex
CREATE INDEX "teaching_statistics_termId_idx" ON "teaching_statistics"("termId");

-- CreateIndex
CREATE INDEX "teaching_statistics_academicYearId_idx" ON "teaching_statistics"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_statistics_facultyId_termId_key" ON "teaching_statistics"("facultyId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "ethnicities_code_key" ON "ethnicities"("code");

-- CreateIndex
CREATE INDEX "ethnicities_code_idx" ON "ethnicities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "religions_code_key" ON "religions"("code");

-- CreateIndex
CREATE INDEX "religions_code_idx" ON "religions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "specialization_catalogs_code_key" ON "specialization_catalogs"("code");

-- CreateIndex
CREATE INDEX "specialization_catalogs_code_idx" ON "specialization_catalogs"("code");

-- CreateIndex
CREATE INDEX "specialization_catalogs_parentId_idx" ON "specialization_catalogs"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "administrative_units_code_key" ON "administrative_units"("code");

-- CreateIndex
CREATE INDEX "administrative_units_code_idx" ON "administrative_units"("code");

-- CreateIndex
CREATE INDEX "administrative_units_parentId_idx" ON "administrative_units"("parentId");

-- CreateIndex
CREATE INDEX "administrative_units_level_idx" ON "administrative_units"("level");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_code_key" ON "cohorts"("code");

-- CreateIndex
CREATE INDEX "cohorts_code_idx" ON "cohorts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_code_key" ON "student_classes"("code");

-- CreateIndex
CREATE INDEX "student_classes_cohortId_idx" ON "student_classes"("cohortId");

-- CreateIndex
CREATE INDEX "student_classes_majorId_idx" ON "student_classes"("majorId");

-- CreateIndex
CREATE INDEX "commune_units_provinceId_idx" ON "commune_units"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "military_ranks_shortCode_key" ON "military_ranks"("shortCode");

-- CreateIndex
CREATE INDEX "military_ranks_category_idx" ON "military_ranks"("category");

-- CreateIndex
CREATE INDEX "function_code_master_moduleId_idx" ON "function_code_master"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "master_categories_code_key" ON "master_categories"("code");

-- CreateIndex
CREATE INDEX "master_categories_groupTag_idx" ON "master_categories"("groupTag");

-- CreateIndex
CREATE INDEX "master_categories_isActive_idx" ON "master_categories"("isActive");

-- CreateIndex
CREATE INDEX "master_data_items_categoryCode_idx" ON "master_data_items"("categoryCode");

-- CreateIndex
CREATE INDEX "master_data_items_code_idx" ON "master_data_items"("code");

-- CreateIndex
CREATE INDEX "master_data_items_parentCode_idx" ON "master_data_items"("parentCode");

-- CreateIndex
CREATE INDEX "master_data_items_isActive_categoryCode_idx" ON "master_data_items"("isActive", "categoryCode");

-- CreateIndex
CREATE INDEX "master_data_items_externalCode_idx" ON "master_data_items"("externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_items_categoryCode_code_key" ON "master_data_items"("categoryCode", "code");

-- CreateIndex
CREATE INDEX "master_data_change_logs_itemId_idx" ON "master_data_change_logs"("itemId");

-- CreateIndex
CREATE INDEX "master_data_change_logs_changedBy_idx" ON "master_data_change_logs"("changedBy");

-- CreateIndex
CREATE INDEX "master_data_change_logs_createdAt_idx" ON "master_data_change_logs"("createdAt");

-- CreateIndex
CREATE INDEX "report_templates_code_idx" ON "report_templates"("code");

-- CreateIndex
CREATE INDEX "report_templates_category_idx" ON "report_templates"("category");

-- CreateIndex
CREATE INDEX "report_templates_isActive_idx" ON "report_templates"("isActive");

-- CreateIndex
CREATE INDEX "report_templates_isLatest_idx" ON "report_templates"("isLatest");

-- CreateIndex
CREATE INDEX "report_templates_createdBy_idx" ON "report_templates"("createdBy");

-- CreateIndex
CREATE INDEX "report_templates_deletedAt_idx" ON "report_templates"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_code_version_key" ON "report_templates"("code", "version");

-- CreateIndex
CREATE INDEX "export_jobs_requestedBy_idx" ON "export_jobs"("requestedBy");

-- CreateIndex
CREATE INDEX "export_jobs_templateId_idx" ON "export_jobs"("templateId");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE INDEX "export_jobs_createdAt_idx" ON "export_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "export_jobs_parentJobId_idx" ON "export_jobs"("parentJobId");

-- CreateIndex
CREATE INDEX "template_schedules_templateId_idx" ON "template_schedules"("templateId");

-- CreateIndex
CREATE INDEX "template_schedules_isActive_idx" ON "template_schedules"("isActive");

-- CreateIndex
CREATE INDEX "template_schedules_createdBy_idx" ON "template_schedules"("createdBy");

-- CreateIndex
CREATE INDEX "template_import_analyses_requestedBy_idx" ON "template_import_analyses"("requestedBy");

-- CreateIndex
CREATE INDEX "template_import_analyses_status_idx" ON "template_import_analyses"("status");

-- CreateIndex
CREATE INDEX "template_import_analyses_expiresAt_idx" ON "template_import_analyses"("expiresAt");

-- CreateIndex
CREATE INDEX "template_analytics_daily_date_idx" ON "template_analytics_daily"("date");

-- CreateIndex
CREATE INDEX "template_analytics_daily_templateId_idx" ON "template_analytics_daily"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "template_analytics_daily_templateId_date_key" ON "template_analytics_daily"("templateId", "date");

-- CreateIndex
CREATE INDEX "master_data_sync_logs_categoryCode_idx" ON "master_data_sync_logs"("categoryCode");

-- CreateIndex
CREATE INDEX "master_data_sync_logs_syncedAt_idx" ON "master_data_sync_logs"("syncedAt");

-- CreateIndex
CREATE INDEX "master_data_sync_logs_syncStatus_idx" ON "master_data_sync_logs"("syncStatus");

-- CreateIndex
CREATE INDEX "master_data_flush_logs_flushedAt_idx" ON "master_data_flush_logs"("flushedAt");

-- CreateIndex
CREATE UNIQUE INDEX "nckh_projects_projectCode_key" ON "nckh_projects"("projectCode");

-- CreateIndex
CREATE INDEX "nckh_projects_principalInvestigatorId_idx" ON "nckh_projects"("principalInvestigatorId");

-- CreateIndex
CREATE INDEX "nckh_projects_submittedBy_idx" ON "nckh_projects"("submittedBy");

-- CreateIndex
CREATE INDEX "nckh_projects_unitId_idx" ON "nckh_projects"("unitId");

-- CreateIndex
CREATE INDEX "nckh_projects_status_idx" ON "nckh_projects"("status");

-- CreateIndex
CREATE INDEX "nckh_projects_phase_idx" ON "nckh_projects"("phase");

-- CreateIndex
CREATE INDEX "nckh_projects_category_idx" ON "nckh_projects"("category");

-- CreateIndex
CREATE INDEX "nckh_projects_field_idx" ON "nckh_projects"("field");

-- CreateIndex
CREATE INDEX "nckh_projects_budgetYear_idx" ON "nckh_projects"("budgetYear");

-- CreateIndex
CREATE INDEX "nckh_projects_fundSourceId_idx" ON "nckh_projects"("fundSourceId");

-- CreateIndex
CREATE INDEX "nckh_members_projectId_idx" ON "nckh_members"("projectId");

-- CreateIndex
CREATE INDEX "nckh_members_userId_idx" ON "nckh_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "nckh_members_projectId_userId_key" ON "nckh_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "nckh_milestones_projectId_idx" ON "nckh_milestones"("projectId");

-- CreateIndex
CREATE INDEX "nckh_milestones_status_idx" ON "nckh_milestones"("status");

-- CreateIndex
CREATE INDEX "nckh_reviews_projectId_idx" ON "nckh_reviews"("projectId");

-- CreateIndex
CREATE INDEX "nckh_reviews_reviewType_idx" ON "nckh_reviews"("reviewType");

-- CreateIndex
CREATE INDEX "nckh_publications_authorId_idx" ON "nckh_publications"("authorId");

-- CreateIndex
CREATE INDEX "nckh_publications_projectId_idx" ON "nckh_publications"("projectId");

-- CreateIndex
CREATE INDEX "nckh_publications_pubType_idx" ON "nckh_publications"("pubType");

-- CreateIndex
CREATE INDEX "nckh_publications_publishedYear_idx" ON "nckh_publications"("publishedYear");

-- CreateIndex
CREATE INDEX "nckh_publications_isISI_idx" ON "nckh_publications"("isISI");

-- CreateIndex
CREATE INDEX "nckh_publications_isScopus_idx" ON "nckh_publications"("isScopus");

-- CreateIndex
CREATE INDEX "nckh_publications_unitId_idx" ON "nckh_publications"("unitId");

-- CreateIndex
CREATE INDEX "nckh_publication_authors_publicationId_idx" ON "nckh_publication_authors"("publicationId");

-- CreateIndex
CREATE INDEX "nckh_publication_authors_userId_idx" ON "nckh_publication_authors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "nckh_scientist_profiles_userId_key" ON "nckh_scientist_profiles"("userId");

-- CreateIndex
CREATE INDEX "nckh_scientist_profiles_userId_idx" ON "nckh_scientist_profiles"("userId");

-- CreateIndex
CREATE INDEX "nckh_scientist_education_scientistId_idx" ON "nckh_scientist_education"("scientistId");

-- CreateIndex
CREATE INDEX "nckh_scientist_career_scientistId_idx" ON "nckh_scientist_career"("scientistId");

-- CreateIndex
CREATE INDEX "nckh_scientist_awards_scientistId_idx" ON "nckh_scientist_awards"("scientistId");

-- CreateIndex
CREATE INDEX "nckh_scientist_awards_year_idx" ON "nckh_scientist_awards"("year");

-- CreateIndex
CREATE INDEX "nckh_duplicate_check_logs_userId_idx" ON "nckh_duplicate_check_logs"("userId");

-- CreateIndex
CREATE INDEX "nckh_duplicate_check_logs_createdAt_idx" ON "nckh_duplicate_check_logs"("createdAt");

-- CreateIndex
CREATE INDEX "thesis_projects_hocVienId_idx" ON "thesis_projects"("hocVienId");

-- CreateIndex
CREATE INDEX "thesis_projects_status_idx" ON "thesis_projects"("status");

-- CreateIndex
CREATE INDEX "thesis_projects_defenseDate_idx" ON "thesis_projects"("defenseDate");

-- CreateIndex
CREATE INDEX "thesis_projects_advisorId_idx" ON "thesis_projects"("advisorId");

-- CreateIndex
CREATE INDEX "graduation_audits_hocVienId_idx" ON "graduation_audits"("hocVienId");

-- CreateIndex
CREATE INDEX "graduation_audits_status_idx" ON "graduation_audits"("status");

-- CreateIndex
CREATE INDEX "graduation_audits_auditDate_idx" ON "graduation_audits"("auditDate");

-- CreateIndex
CREATE INDEX "graduation_audits_graduationEligible_idx" ON "graduation_audits"("graduationEligible");

-- CreateIndex
CREATE UNIQUE INDEX "diploma_records_graduationAuditId_key" ON "diploma_records"("graduationAuditId");

-- CreateIndex
CREATE UNIQUE INDEX "diploma_records_diplomaNo_key" ON "diploma_records"("diplomaNo");

-- CreateIndex
CREATE INDEX "diploma_records_hocVienId_idx" ON "diploma_records"("hocVienId");

-- CreateIndex
CREATE INDEX "diploma_records_diplomaNo_idx" ON "diploma_records"("diplomaNo");

-- CreateIndex
CREATE INDEX "diploma_records_graduationDate_idx" ON "diploma_records"("graduationDate");

-- CreateIndex
CREATE INDEX "academic_repository_items_hocVienId_idx" ON "academic_repository_items"("hocVienId");

-- CreateIndex
CREATE INDEX "academic_repository_items_itemType_idx" ON "academic_repository_items"("itemType");

-- CreateIndex
CREATE INDEX "academic_repository_items_indexedAt_idx" ON "academic_repository_items"("indexedAt");

-- CreateIndex
CREATE UNIQUE INDEX "wf_templates_code_key" ON "wf_templates"("code");

-- CreateIndex
CREATE INDEX "wf_templates_moduleKey_idx" ON "wf_templates"("moduleKey");

-- CreateIndex
CREATE INDEX "wf_templates_isActive_idx" ON "wf_templates"("isActive");

-- CreateIndex
CREATE INDEX "wf_template_versions_templateId_status_idx" ON "wf_template_versions"("templateId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wf_template_versions_templateId_versionNo_key" ON "wf_template_versions"("templateId", "versionNo");

-- CreateIndex
CREATE INDEX "wf_step_templates_templateVersionId_idx" ON "wf_step_templates"("templateVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "wf_step_templates_templateVersionId_code_key" ON "wf_step_templates"("templateVersionId", "code");

-- CreateIndex
CREATE INDEX "wf_transition_templates_templateVersionId_fromStepCode_idx" ON "wf_transition_templates"("templateVersionId", "fromStepCode");

-- CreateIndex
CREATE INDEX "wf_instances_status_idx" ON "wf_instances"("status");

-- CreateIndex
CREATE INDEX "wf_instances_initiatorId_idx" ON "wf_instances"("initiatorId");

-- CreateIndex
CREATE INDEX "wf_instances_currentAssigneeId_idx" ON "wf_instances"("currentAssigneeId");

-- CreateIndex
CREATE INDEX "wf_instances_entityType_entityId_idx" ON "wf_instances"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "wf_instances_templateId_status_idx" ON "wf_instances"("templateId", "status");

-- CreateIndex
CREATE INDEX "wf_instances_startedAt_idx" ON "wf_instances"("startedAt");

-- CreateIndex
CREATE INDEX "wf_step_instances_workflowInstanceId_idx" ON "wf_step_instances"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "wf_step_instances_assigneeId_status_idx" ON "wf_step_instances"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "wf_step_instances_dueAt_status_idx" ON "wf_step_instances"("dueAt", "status");

-- CreateIndex
CREATE INDEX "wf_actions_workflowInstanceId_idx" ON "wf_actions"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "wf_actions_actionBy_idx" ON "wf_actions"("actionBy");

-- CreateIndex
CREATE INDEX "wf_actions_actionAt_idx" ON "wf_actions"("actionAt");

-- CreateIndex
CREATE INDEX "wf_signatures_workflowInstanceId_idx" ON "wf_signatures"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "wf_signatures_signerId_idx" ON "wf_signatures"("signerId");

-- CreateIndex
CREATE INDEX "wf_notifications_recipientId_readAt_idx" ON "wf_notifications"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "wf_notifications_recipientId_channel_idx" ON "wf_notifications"("recipientId", "channel");

-- CreateIndex
CREATE INDEX "wf_notifications_workflowInstanceId_idx" ON "wf_notifications"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "wf_notifications_scheduledAt_status_idx" ON "wf_notifications"("scheduledAt", "status");

-- CreateIndex
CREATE INDEX "wf_escalations_workflowInstanceId_idx" ON "wf_escalations"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "wf_escalations_createdAt_idx" ON "wf_escalations"("createdAt");

-- CreateIndex
CREATE INDEX "wf_audit_logs_workflowInstanceId_idx" ON "wf_audit_logs"("workflowInstanceId");

-- CreateIndex
CREATE INDEX "wf_audit_logs_performedBy_performedAt_idx" ON "wf_audit_logs"("performedBy", "performedAt");

-- CreateIndex
CREATE INDEX "faculty_eis_scores_facultyProfileId_idx" ON "faculty_eis_scores"("facultyProfileId");

-- CreateIndex
CREATE INDEX "faculty_eis_scores_academicYear_semesterCode_idx" ON "faculty_eis_scores"("academicYear", "semesterCode");

-- CreateIndex
CREATE INDEX "faculty_eis_scores_totalEIS_idx" ON "faculty_eis_scores"("totalEIS");

-- CreateIndex
CREATE INDEX "faculty_eis_scores_trend_idx" ON "faculty_eis_scores"("trend");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_eis_scores_facultyProfileId_academicYear_semesterCo_key" ON "faculty_eis_scores"("facultyProfileId", "academicYear", "semesterCode");

-- CreateIndex
CREATE INDEX "faculty_workload_snapshots_facultyProfileId_idx" ON "faculty_workload_snapshots"("facultyProfileId");

-- CreateIndex
CREATE INDEX "faculty_workload_snapshots_academicYear_semesterCode_idx" ON "faculty_workload_snapshots"("academicYear", "semesterCode");

-- CreateIndex
CREATE INDEX "faculty_workload_snapshots_totalHoursWeekly_idx" ON "faculty_workload_snapshots"("totalHoursWeekly");

-- CreateIndex
CREATE INDEX "faculty_workload_snapshots_overloadHours_idx" ON "faculty_workload_snapshots"("overloadHours");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_workload_snapshots_facultyProfileId_academicYear_se_key" ON "faculty_workload_snapshots"("facultyProfileId", "academicYear", "semesterCode");

-- CreateIndex
CREATE INDEX "faculty_workload_alerts_snapshotId_idx" ON "faculty_workload_alerts"("snapshotId");

-- CreateIndex
CREATE INDEX "faculty_workload_alerts_status_idx" ON "faculty_workload_alerts"("status");

-- CreateIndex
CREATE INDEX "faculty_workload_alerts_alertType_idx" ON "faculty_workload_alerts"("alertType");

-- CreateIndex
CREATE INDEX "student_gpa_histories_hocVienId_idx" ON "student_gpa_histories"("hocVienId");

-- CreateIndex
CREATE INDEX "student_gpa_histories_academicYear_semesterCode_idx" ON "student_gpa_histories"("academicYear", "semesterCode");

-- CreateIndex
CREATE INDEX "student_gpa_histories_cumulativeGpa_idx" ON "student_gpa_histories"("cumulativeGpa");

-- CreateIndex
CREATE INDEX "student_gpa_histories_academicStatus_idx" ON "student_gpa_histories"("academicStatus");

-- CreateIndex
CREATE UNIQUE INDEX "student_gpa_histories_hocVienId_academicYear_semesterCode_key" ON "student_gpa_histories"("hocVienId", "academicYear", "semesterCode");

-- CreateIndex
CREATE UNIQUE INDEX "science_catalogs_code_key" ON "science_catalogs"("code");

-- CreateIndex
CREATE INDEX "science_catalogs_type_isActive_idx" ON "science_catalogs"("type", "isActive");

-- CreateIndex
CREATE INDEX "science_catalogs_parentId_idx" ON "science_catalogs"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "science_id_sequences_entityType_year_key" ON "science_id_sequences"("entityType", "year");

-- CreateIndex
CREATE INDEX "nckh_project_workflow_logs_projectId_idx" ON "nckh_project_workflow_logs"("projectId");

-- CreateIndex
CREATE INDEX "nckh_project_workflow_logs_actedAt_idx" ON "nckh_project_workflow_logs"("actedAt");

-- CreateIndex
CREATE UNIQUE INDEX "scientific_works_code_key" ON "scientific_works"("code");

-- CreateIndex
CREATE UNIQUE INDEX "scientific_works_doi_key" ON "scientific_works"("doi");

-- CreateIndex
CREATE INDEX "scientific_works_type_year_idx" ON "scientific_works"("type", "year");

-- CreateIndex
CREATE INDEX "scientific_works_isDeleted_idx" ON "scientific_works"("isDeleted");

-- CreateIndex
CREATE INDEX "scientific_works_publisherId_idx" ON "scientific_works"("publisherId");

-- CreateIndex
CREATE INDEX "scientific_work_authors_workId_idx" ON "scientific_work_authors"("workId");

-- CreateIndex
CREATE INDEX "scientific_work_authors_scientistId_idx" ON "scientific_work_authors"("scientistId");

-- CreateIndex
CREATE UNIQUE INDEX "scientific_work_authors_workId_orderNum_key" ON "scientific_work_authors"("workId", "orderNum");

-- CreateIndex
CREATE INDEX "library_items_sensitivity_isDeleted_idx" ON "library_items"("sensitivity", "isDeleted");

-- CreateIndex
CREATE INDEX "library_items_workId_idx" ON "library_items"("workId");

-- CreateIndex
CREATE INDEX "library_items_createdById_idx" ON "library_items"("createdById");

-- CreateIndex
CREATE INDEX "library_access_logs_itemId_accessedAt_idx" ON "library_access_logs"("itemId", "accessedAt");

-- CreateIndex
CREATE INDEX "library_access_logs_userId_idx" ON "library_access_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "research_budgets_projectId_key" ON "research_budgets"("projectId");

-- CreateIndex
CREATE INDEX "research_budgets_fundSourceId_idx" ON "research_budgets"("fundSourceId");

-- CreateIndex
CREATE INDEX "research_budgets_year_status_idx" ON "research_budgets"("year", "status");

-- CreateIndex
CREATE INDEX "budget_line_items_budgetId_idx" ON "budget_line_items"("budgetId");

-- CreateIndex
CREATE INDEX "scientific_councils_projectId_idx" ON "scientific_councils"("projectId");

-- CreateIndex
CREATE INDEX "scientific_councils_type_idx" ON "scientific_councils"("type");

-- CreateIndex
CREATE INDEX "scientific_council_members_userId_idx" ON "scientific_council_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scientific_council_members_councilId_userId_key" ON "scientific_council_members"("councilId", "userId");

-- CreateIndex
CREATE INDEX "scientific_council_reviews_councilId_idx" ON "scientific_council_reviews"("councilId");

-- CreateIndex
CREATE INDEX "scientific_council_reviews_memberId_idx" ON "scientific_council_reviews"("memberId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_birthPlaceId_fkey" FOREIGN KEY ("birthPlaceId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "ethnicities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_placeOfOriginId_fkey" FOREIGN KEY ("placeOfOriginId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "religions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "specialization_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_metrics" ADD CONSTRAINT "service_metrics_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "bigdata_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_alerts" ADD CONSTRAINT "service_alerts_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "bigdata_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_runs" ADD CONSTRAINT "dag_runs_dagId_fkey" FOREIGN KEY ("dagId") REFERENCES "airflow_dags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_access_logs" ADD CONSTRAINT "file_access_logs_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "research_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_jobs" ADD CONSTRAINT "training_jobs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ml_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_predictions" ADD CONSTRAINT "model_predictions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ml_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_artifacts" ADD CONSTRAINT "experiment_artifacts_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "ml_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_metrics" ADD CONSTRAINT "experiment_metrics_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "ml_experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "ml_experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "ml_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_attachments" ADD CONSTRAINT "personnel_attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSubject" ADD CONSTRAINT "TeachingSubject_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoc_vien" ADD CONSTRAINT "hoc_vien_classId_fkey" FOREIGN KEY ("classId") REFERENCES "student_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoc_vien" ADD CONSTRAINT "hoc_vien_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoc_vien" ADD CONSTRAINT "hoc_vien_giangVienHuongDanId_fkey" FOREIGN KEY ("giangVienHuongDanId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoc_vien" ADD CONSTRAINT "hoc_vien_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "specialization_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoc_vien" ADD CONSTRAINT "hoc_vien_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hoc_vien" ADD CONSTRAINT "hoc_vien_currentProgramVersionId_fkey" FOREIGN KEY ("currentProgramVersionId") REFERENCES "program_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ket_qua_hoc_tap" ADD CONSTRAINT "ket_qua_hoc_tap_heSoMonHocId_fkey" FOREIGN KEY ("heSoMonHocId") REFERENCES "he_so_mon_hoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ket_qua_hoc_tap" ADD CONSTRAINT "ket_qua_hoc_tap_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_conduct_records" ADD CONSTRAINT "student_conduct_records_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_histories" ADD CONSTRAINT "score_histories_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "class_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_warnings" ADD CONSTRAINT "academic_warnings_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_history" ADD CONSTRAINT "education_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_history" ADD CONSTRAINT "education_history_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_status_history" ADD CONSTRAINT "personnel_status_history_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_experience" ADD CONSTRAINT "work_experience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_publications" ADD CONSTRAINT "scientific_publications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_research" ADD CONSTRAINT "scientific_research_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards_records" ADD CONSTRAINT "awards_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_profiles" ADD CONSTRAINT "scientific_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_profiles" ADD CONSTRAINT "scientific_profiles_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_language_certs" ADD CONSTRAINT "foreign_language_certs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_certificates" ADD CONSTRAINT "technical_certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_invigilatorId_fkey" FOREIGN KEY ("invigilatorId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_records" ADD CONSTRAINT "grade_records_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_versions" ADD CONSTRAINT "program_versions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_plans" ADD CONSTRAINT "curriculum_plans_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_plans" ADD CONSTRAINT "curriculum_plans_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_plans" ADD CONSTRAINT "curriculum_plans_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "program_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_curriculumPlanId_fkey" FOREIGN KEY ("curriculumPlanId") REFERENCES "curriculum_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_curriculumCourseId_fkey" FOREIGN KEY ("curriculumCourseId") REFERENCES "curriculum_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "class_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_api_logs" ADD CONSTRAINT "external_api_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "external_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_configId_fkey" FOREIGN KEY ("configId") REFERENCES "infrastructure_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_histories" ADD CONSTRAINT "career_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_histories" ADD CONSTRAINT "career_histories_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_organizations" ADD CONSTRAINT "party_organizations_deputySecretaryUserId_fkey" FOREIGN KEY ("deputySecretaryUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_organizations" ADD CONSTRAINT "party_organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "party_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_organizations" ADD CONSTRAINT "party_organizations_secretaryUserId_fkey" FOREIGN KEY ("secretaryUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_organizations" ADD CONSTRAINT "party_organizations_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "party_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_members" ADD CONSTRAINT "party_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_meetings" ADD CONSTRAINT "party_meetings_partyOrgId_fkey" FOREIGN KEY ("partyOrgId") REFERENCES "party_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_meetings" ADD CONSTRAINT "party_meetings_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_meeting_attendances" ADD CONSTRAINT "party_meeting_attendances_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "party_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_meeting_attendances" ADD CONSTRAINT "party_meeting_attendances_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_fee_payments" ADD CONSTRAINT "party_fee_payments_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_annual_reviews" ADD CONSTRAINT "party_annual_reviews_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_awards" ADD CONSTRAINT "party_awards_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_disciplines" ADD CONSTRAINT "party_disciplines_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_transfers" ADD CONSTRAINT "party_transfers_fromPartyOrgId_fkey" FOREIGN KEY ("fromPartyOrgId") REFERENCES "party_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_transfers" ADD CONSTRAINT "party_transfers_toPartyOrgId_fkey" FOREIGN KEY ("toPartyOrgId") REFERENCES "party_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_transfers" ADD CONSTRAINT "party_transfers_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_inspection_targets" ADD CONSTRAINT "party_inspection_targets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_inspection_targets" ADD CONSTRAINT "party_inspection_targets_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_inspection_targets" ADD CONSTRAINT "party_inspection_targets_partyOrgId_fkey" FOREIGN KEY ("partyOrgId") REFERENCES "party_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_recruitment_pipelines" ADD CONSTRAINT "party_recruitment_pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_recruitment_pipelines" ADD CONSTRAINT "party_recruitment_pipelines_targetPartyOrgId_fkey" FOREIGN KEY ("targetPartyOrgId") REFERENCES "party_organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_activities" ADD CONSTRAINT "party_activities_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_member_histories" ADD CONSTRAINT "party_member_histories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "party_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_member_histories" ADD CONSTRAINT "party_member_histories_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_lifecycle_events" ADD CONSTRAINT "party_lifecycle_events_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_lifecycle_alerts" ADD CONSTRAINT "party_lifecycle_alerts_partyMemberId_fkey" FOREIGN KEY ("partyMemberId") REFERENCES "party_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_records" ADD CONSTRAINT "policy_records_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_records" ADD CONSTRAINT "policy_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_infos" ADD CONSTRAINT "insurance_infos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relations" ADD CONSTRAINT "family_relations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relations" ADD CONSTRAINT "family_relations_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_grants" ADD CONSTRAINT "user_permission_grants_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_grants" ADD CONSTRAINT "user_permission_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_grant_personnel" ADD CONSTRAINT "user_permission_grant_personnel_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "user_permission_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_ai_analyses" ADD CONSTRAINT "personnel_ai_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_birthPlaceAdminId_fkey" FOREIGN KEY ("birthPlaceAdminId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "ethnicities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_placeOfOriginAdminId_fkey" FOREIGN KEY ("placeOfOriginAdminId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "religions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "specialization_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensitive_identities" ADD CONSTRAINT "sensitive_identities_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_events" ADD CONSTRAINT "personnel_events_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_functions" ADD CONSTRAINT "position_functions_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_functions" ADD CONSTRAINT "position_functions_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_positions" ADD CONSTRAINT "user_positions_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_positions" ADD CONSTRAINT "user_positions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_positions" ADD CONSTRAINT "user_positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_position_aliases" ADD CONSTRAINT "unit_position_aliases_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_position_aliases" ADD CONSTRAINT "unit_position_aliases_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_categories" ADD CONSTRAINT "policy_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "policy_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_requests" ADD CONSTRAINT "policy_requests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "policy_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_requests" ADD CONSTRAINT "policy_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_attachments" ADD CONSTRAINT "policy_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "policy_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_workflow_logs" ADD CONSTRAINT "policy_workflow_logs_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "policy_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_histories" ADD CONSTRAINT "insurance_histories_insuranceInfoId_fkey" FOREIGN KEY ("insuranceInfoId") REFERENCES "insurance_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_dependents" ADD CONSTRAINT "insurance_dependents_insuranceInfoId_fkey" FOREIGN KEY ("insuranceInfoId") REFERENCES "insurance_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officer_careers" ADD CONSTRAINT "officer_careers_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "officer_promotions" ADD CONSTRAINT "officer_promotions_officerCareerId_fkey" FOREIGN KEY ("officerCareerId") REFERENCES "officer_careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_special_cases" ADD CONSTRAINT "promotion_special_cases_officerCareerId_fkey" FOREIGN KEY ("officerCareerId") REFERENCES "officer_careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_special_cases" ADD CONSTRAINT "promotion_special_cases_soldierProfileId_fkey" FOREIGN KEY ("soldierProfileId") REFERENCES "soldier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soldier_profiles" ADD CONSTRAINT "soldier_profiles_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soldier_service_records" ADD CONSTRAINT "soldier_service_records_soldierProfileId_fkey" FOREIGN KEY ("soldierProfileId") REFERENCES "soldier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_insuranceInfoId_fkey" FOREIGN KEY ("insuranceInfoId") REFERENCES "insurance_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_plans" ADD CONSTRAINT "exam_plans_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_examPlanId_fkey" FOREIGN KEY ("examPlanId") REFERENCES "exam_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_registrations" ADD CONSTRAINT "exam_registrations_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_registrations" ADD CONSTRAINT "exam_registrations_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_equipments" ADD CONSTRAINT "lab_equipments_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_maintenances" ADD CONSTRAINT "equipment_maintenances_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "lab_equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_sessions" ADD CONSTRAINT "lab_sessions_labId_fkey" FOREIGN KEY ("labId") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specialization_catalogs" ADD CONSTRAINT "specialization_catalogs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "specialization_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_units" ADD CONSTRAINT "administrative_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "specialization_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commune_units" ADD CONSTRAINT "commune_units_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_categories" ADD CONSTRAINT "equipment_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "equipment_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_data_items" ADD CONSTRAINT "master_data_items_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "master_categories"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_data_change_logs" ADD CONSTRAINT "master_data_change_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "master_data_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_parentJobId_fkey" FOREIGN KEY ("parentJobId") REFERENCES "export_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_schedules" ADD CONSTRAINT "template_schedules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_analytics_daily" ADD CONSTRAINT "template_analytics_daily_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_data_sync_logs" ADD CONSTRAINT "master_data_sync_logs_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "master_categories"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_projects" ADD CONSTRAINT "nckh_projects_principalInvestigatorId_fkey" FOREIGN KEY ("principalInvestigatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_projects" ADD CONSTRAINT "nckh_projects_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_projects" ADD CONSTRAINT "nckh_projects_fundSourceId_fkey" FOREIGN KEY ("fundSourceId") REFERENCES "science_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_members" ADD CONSTRAINT "nckh_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "nckh_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_members" ADD CONSTRAINT "nckh_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_milestones" ADD CONSTRAINT "nckh_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "nckh_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_reviews" ADD CONSTRAINT "nckh_reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "nckh_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_publications" ADD CONSTRAINT "nckh_publications_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_publications" ADD CONSTRAINT "nckh_publications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "nckh_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_publication_authors" ADD CONSTRAINT "nckh_publication_authors_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "nckh_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_publication_authors" ADD CONSTRAINT "nckh_publication_authors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_scientist_profiles" ADD CONSTRAINT "nckh_scientist_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_scientist_education" ADD CONSTRAINT "nckh_scientist_education_scientistId_fkey" FOREIGN KEY ("scientistId") REFERENCES "nckh_scientist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_scientist_career" ADD CONSTRAINT "nckh_scientist_career_scientistId_fkey" FOREIGN KEY ("scientistId") REFERENCES "nckh_scientist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_scientist_awards" ADD CONSTRAINT "nckh_scientist_awards_scientistId_fkey" FOREIGN KEY ("scientistId") REFERENCES "nckh_scientist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_duplicate_check_logs" ADD CONSTRAINT "nckh_duplicate_check_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_projects" ADD CONSTRAINT "thesis_projects_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_projects" ADD CONSTRAINT "thesis_projects_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thesis_projects" ADD CONSTRAINT "thesis_projects_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "faculty_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graduation_audits" ADD CONSTRAINT "graduation_audits_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diploma_records" ADD CONSTRAINT "diploma_records_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diploma_records" ADD CONSTRAINT "diploma_records_graduationAuditId_fkey" FOREIGN KEY ("graduationAuditId") REFERENCES "graduation_audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_repository_items" ADD CONSTRAINT "academic_repository_items_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_template_versions" ADD CONSTRAINT "wf_template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "wf_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_step_templates" ADD CONSTRAINT "wf_step_templates_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "wf_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_transition_templates" ADD CONSTRAINT "wf_transition_templates_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "wf_template_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_instances" ADD CONSTRAINT "wf_instances_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "wf_template_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_step_instances" ADD CONSTRAINT "wf_step_instances_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "wf_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_actions" ADD CONSTRAINT "wf_actions_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "wf_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_actions" ADD CONSTRAINT "wf_actions_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "wf_step_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_actions" ADD CONSTRAINT "wf_actions_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_signatures" ADD CONSTRAINT "wf_signatures_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "wf_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_notifications" ADD CONSTRAINT "wf_notifications_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "wf_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_escalations" ADD CONSTRAINT "wf_escalations_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "wf_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_audit_logs" ADD CONSTRAINT "wf_audit_logs_workflowInstanceId_fkey" FOREIGN KEY ("workflowInstanceId") REFERENCES "wf_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_eis_scores" ADD CONSTRAINT "faculty_eis_scores_facultyProfileId_fkey" FOREIGN KEY ("facultyProfileId") REFERENCES "faculty_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_workload_snapshots" ADD CONSTRAINT "faculty_workload_snapshots_facultyProfileId_fkey" FOREIGN KEY ("facultyProfileId") REFERENCES "faculty_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_workload_alerts" ADD CONSTRAINT "faculty_workload_alerts_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "faculty_workload_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_gpa_histories" ADD CONSTRAINT "student_gpa_histories_hocVienId_fkey" FOREIGN KEY ("hocVienId") REFERENCES "hoc_vien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "science_catalogs" ADD CONSTRAINT "science_catalogs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "science_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "science_catalogs" ADD CONSTRAINT "science_catalogs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_project_workflow_logs" ADD CONSTRAINT "nckh_project_workflow_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "nckh_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nckh_project_workflow_logs" ADD CONSTRAINT "nckh_project_workflow_logs_actionById_fkey" FOREIGN KEY ("actionById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_work_authors" ADD CONSTRAINT "scientific_work_authors_workId_fkey" FOREIGN KEY ("workId") REFERENCES "scientific_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_workId_fkey" FOREIGN KEY ("workId") REFERENCES "scientific_works"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_access_logs" ADD CONSTRAINT "library_access_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "library_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_access_logs" ADD CONSTRAINT "library_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_budgets" ADD CONSTRAINT "research_budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "nckh_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_budgets" ADD CONSTRAINT "research_budgets_fundSourceId_fkey" FOREIGN KEY ("fundSourceId") REFERENCES "science_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_budgets" ADD CONSTRAINT "research_budgets_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "research_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_councils" ADD CONSTRAINT "scientific_councils_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "nckh_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_councils" ADD CONSTRAINT "scientific_councils_chairmanId_fkey" FOREIGN KEY ("chairmanId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_councils" ADD CONSTRAINT "scientific_councils_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_council_members" ADD CONSTRAINT "scientific_council_members_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "scientific_councils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_council_members" ADD CONSTRAINT "scientific_council_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scientific_council_reviews" ADD CONSTRAINT "scientific_council_reviews_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "scientific_councils"("id") ON DELETE CASCADE ON UPDATE CASCADE;

