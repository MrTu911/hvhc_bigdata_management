/**
 * Ma trận mẫu văn bản hành chính (Nghị định 30/2020/NĐ-CP) theo từng module.
 *
 * Gộp spec từ các file theo module. Mỗi spec sinh ra 1 file .docx + 1 file .html
 * và 1 ReportTemplate (M18). Builder dùng chung cho mọi spec nên thêm module mới
 * chỉ là thêm file spec + import vào đây.
 *
 * Quy ước:
 *   - Skeleton: form trắng đúng thể thức, body là mục + dòng chấm điền tay.
 *   - Entity-bound: gắn 1 thực thể (personnel/party_member/student/scientific_council/
 *     scientist_profile) qua resolver M18.
 *   - Header (tên cơ quan, Quốc hiệu, ngày...) lấy từ buildHeaderContext; văn bản
 *     Đảng (M03) ghi đè tên cơ quan bằng headerCapTren/headerBanHanh.
 */

import type { TemplateSpec } from './types';
import { M02_SPECS } from './specs/m02';
import { M03_SPECS } from './specs/m03';
import { M05_SPECS } from './specs/m05';
import { M09_SPECS } from './specs/m09';
import { M10_SPECS } from './specs/m10';
import { SCIENCE_SPECS } from './specs/science';
import { GENERAL_SPECS } from './specs/general';

export const TEMPLATE_SPECS: TemplateSpec[] = [
  ...M02_SPECS,
  ...M03_SPECS,
  ...M05_SPECS,
  ...M09_SPECS,
  ...M10_SPECS,
  ...SCIENCE_SPECS,
  ...GENERAL_SPECS,
];
