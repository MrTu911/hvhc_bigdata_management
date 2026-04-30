'use client';

import { useState, useCallback } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PlaceholderPanel } from './placeholder-panel';
import { FieldBrowser } from './field-browser';
import { ValidationBar } from './validation-bar';

interface DataMapEditorProps {
  templateId: string;
  entityType: string;
  initialDataMap: Record<string, string>;
  initialPlaceholders: string[];
  onSaved?: () => void;
}

export function DataMapEditor({
  templateId,
  entityType,
  initialDataMap,
  initialPlaceholders,
  onSaved,
}: DataMapEditorProps) {
  const [dataMap, setDataMap] = useState<Record<string, string>>(initialDataMap);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const placeholderItems = initialPlaceholders.map((name) => ({
    name,
    mapped: !!dataMap[name],
    mappedTo: dataMap[name],
  }));

  const mappedCount = placeholderItems.filter((p) => p.mapped).length;
  const unmappedCount = placeholderItems.filter((p) => !p.mapped).length;

  const handleFieldSelect = useCallback(
    (fieldKey: string) => {
      if (!selectedPlaceholder) {
        toast.info('Chọn một placeholder ở bên trái trước');
        return;
      }
      setDataMap((prev) => ({ ...prev, [selectedPlaceholder]: fieldKey }));
      // Auto-advance to next unmapped
      const unmapped = initialPlaceholders.filter((p) => p !== selectedPlaceholder && !dataMap[p]);
      setSelectedPlaceholder(unmapped[0]);
    },
    [selectedPlaceholder, initialPlaceholders, dataMap],
  );

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/datamap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataMap }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi lưu data map');
      toast.success('Đã lưu data map');
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu data map');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ValidationBar
        unmappedCount={unmappedCount}
        mappedCount={mappedCount}
        warnings={
          selectedPlaceholder
            ? [`Placeholder đang chọn: {${selectedPlaceholder}} — click field bên phải để ánh xạ`]
            : []
        }
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Left – placeholders */}
        <div className="border rounded-lg p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Placeholder trong template
          </div>
          <PlaceholderPanel
            placeholders={placeholderItems}
            selectedPlaceholder={selectedPlaceholder}
            onSelect={setSelectedPlaceholder}
          />
        </div>

        {/* Right – field catalog */}
        <div className="border rounded-lg p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Field dữ liệu ({entityType})
          </div>
          <FieldBrowser
            entityType={entityType}
            selectedKey={selectedPlaceholder ? dataMap[selectedPlaceholder] : undefined}
            onSelect={handleFieldSelect}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Lưu Data Map
        </Button>
      </div>
    </div>
  );
}
