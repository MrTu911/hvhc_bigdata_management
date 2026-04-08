'use client';

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const TYPE_LABELS: Record<string, string> = {
  KIEM_TRA_DINH_KY: 'Kiểm tra định kỳ',
  KIEM_TRA_KHI_CO_DAU_HIEU: 'Khi có dấu hiệu',
  GIAM_SAT_CHUYEN_DE: 'Giám sát chuyên đề',
  PHUC_KET_KY_LUAT: 'Phúc kết kỷ luật',
};

function Item({ label, value }: { label: string; value: any }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <div className="col-span-1 text-muted-foreground">{label}</div>
      <div className="col-span-2 font-medium break-words">{value || '-'}</div>
    </div>
  );
}

export function InspectionDetailDrawer({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
}) {
  const type = String(item?.inspectionType || '').toUpperCase();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{item?.title || 'Chi tiết hồ sơ kiểm tra'}</DrawerTitle>
          <DrawerDescription>Thông tin đợt kiểm tra/giám sát UBKT</DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="px-4 pb-6">
          <div className="space-y-3 rounded-md border p-4">
            <Item label="Loại kiểm tra" value={<Badge variant="outline">{TYPE_LABELS[type] || type || '-'}</Badge>} />
            <Item label="Đối tượng" value={item?.partyMember?.user?.name || item?.partyOrg?.name || '-'} />
            <Item label="Ngày mở" value={item?.openedAt ? new Date(item.openedAt).toLocaleDateString('vi-VN') : '-'} />
            <Item label="Ngày đóng" value={item?.closedAt ? new Date(item.closedAt).toLocaleDateString('vi-VN') : '-'} />
            <Item label="Người tạo" value={item?.creator?.name || '-'} />
            <Item label="Văn bản" value={item?.decisionRef || '-'} />
            <Item label="Kết luận" value={item?.findings || '-'} />
            <Item label="Kiến nghị" value={item?.recommendation || '-'} />
            <Item
              label="Hồ sơ đính kèm"
              value={
                item?.attachmentUrl ? (
                  <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    Mở tệp đính kèm
                  </a>
                ) : (
                  '-'
                )
              }
            />
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
