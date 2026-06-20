/**
 * Test chiếu trường mô tả nhân thân từ User sang Personnel (liên thông M02).
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { projectUserPatchToPersonnel } from '@/lib/services/personnel/personnel-projection.service';
import type { Prisma } from '@prisma/client';

function makeTx() {
  const update = vi.fn();
  return { update, tx: { personnel: { update } } as unknown as Prisma.TransactionClient };
}

describe('projectUserPatchToPersonnel', () => {
  it('chiếu các trường có trong map sang Personnel', async () => {
    const { update, tx } = makeTx();
    const n = await projectUserPatchToPersonnel(tx, 'p1', {
      birthPlace: 'Thái Bình',
      educationLevel: 'Đại học',
      // phone không nằm trong map → bỏ qua
      phone: '0900',
    });
    expect(n).toBe(2);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { birthPlace: 'Thái Bình', educationLevel: 'Đại học' },
    });
  });

  it('bỏ qua khi account chưa gắn Personnel (personnelId null)', async () => {
    const { update, tx } = makeTx();
    const n = await projectUserPatchToPersonnel(tx, null, { birthPlace: 'X' });
    expect(n).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });

  it('không gọi update khi không có trường nào thuộc map', async () => {
    const { update, tx } = makeTx();
    const n = await projectUserPatchToPersonnel(tx, 'p1', { aliasName: 'Bí danh', phone: '0900' });
    expect(n).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });
});
