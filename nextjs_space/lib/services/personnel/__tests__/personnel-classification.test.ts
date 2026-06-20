/**
 * Kiểm tra phân loại SĨ QUAN / QUÂN NHÂN / DÂN SỰ.
 *
 * Bảo vệ nghiệp vụ: nguồn sự thật là quan hệ thật (officerCareer/soldierProfile)
 * trên Personnel liên kết; keyword quân hàm chỉ là fallback khi chưa liên thông.
 * Đây là regression cho bug "đoán loại bằng từ khóa quân hàm" làm đếm sai
 * (vd quân nhân có soldierProfile nhưng quân hàm không chứa 'sĩ'/'binh').
 */
import { describe, it, expect } from 'vitest';

import {
  classifyPersonnelType,
  type ClassifiableUser,
} from '@/lib/services/personnel/personnel-classification.service';

describe('classifyPersonnelType', () => {
  it('OFFICER khi Personnel liên kết có officerCareer — kể cả khi rank rỗng', () => {
    const user: ClassifiableUser = {
      rank: null,
      personnelProfile: { officerCareer: { id: 'oc1' }, soldierProfile: null },
    };
    expect(classifyPersonnelType(user)).toBe('OFFICER');
  });

  it('SOLDIER khi Personnel liên kết có soldierProfile — kể cả khi rank không chứa từ khóa', () => {
    const user: ClassifiableUser = {
      rank: 'Nhân viên', // không chứa 'sĩ'/'binh' nhưng quan hệ là quân nhân
      personnelProfile: { officerCareer: null, soldierProfile: { id: 'sp1' } },
    };
    expect(classifyPersonnelType(user)).toBe('SOLDIER');
  });

  it('relation thắng keyword: soldierProfile nhưng rank chứa từ khóa sĩ quan vẫn là SOLDIER', () => {
    const user: ClassifiableUser = {
      rank: 'Đại tá', // chứa 'tá' (keyword sĩ quan) nhưng quan hệ là quân nhân
      personnelProfile: { officerCareer: null, soldierProfile: { id: 'sp2' } },
    };
    expect(classifyPersonnelType(user)).toBe('SOLDIER');
  });

  it('fallback keyword OFFICER khi chưa liên kết Personnel', () => {
    const user: ClassifiableUser = { rank: 'Đại tá', personnelProfile: null };
    expect(classifyPersonnelType(user)).toBe('OFFICER');
  });

  it('fallback keyword SOLDIER khi chưa liên kết Personnel', () => {
    const user: ClassifiableUser = { rank: 'Binh nhất', personnelProfile: null };
    expect(classifyPersonnelType(user)).toBe('SOLDIER');
  });

  it('CIVILIAN khi không có quan hệ và quân hàm không khớp từ khóa', () => {
    const user: ClassifiableUser = { rank: 'Chuyên viên', personnelProfile: null };
    expect(classifyPersonnelType(user)).toBe('CIVILIAN');
  });

  it('CIVILIAN khi rank rỗng và không liên kết Personnel', () => {
    const user: ClassifiableUser = { rank: null, personnelProfile: null };
    expect(classifyPersonnelType(user)).toBe('CIVILIAN');
  });
});
