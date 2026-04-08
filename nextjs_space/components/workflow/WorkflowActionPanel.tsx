'use client';

/**
 * M13 – Action Panel
 * Hiển thị các nút hành động cho người được phân công xử lý bước hiện tại.
 * Chỉ hiển thị nếu actor là assignee của bước đang READY/IN_PROGRESS.
 * Comment bắt buộc với REJECT và RETURN.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  AlertCircle,
} from 'lucide-react';

interface WorkflowActionPanelProps {
  workflowInstanceId: string;
  /** Người dùng hiện tại có phải assignee không */
  isAssignee: boolean;
  /** Người dùng hiện tại có phải initiator không */
  isInitiator: boolean;
  /** Instance đã ở trạng thái kết thúc chưa */
  isTerminal: boolean;
  onActionSuccess: () => void;
}

const COMMENT_REQUIRED_ACTIONS = new Set(['REJECT', 'RETURN']);

export function WorkflowActionPanel({
  workflowInstanceId,
  isAssignee,
  isInitiator,
  isTerminal,
  onActionSuccess,
}: WorkflowActionPanelProps) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(
    async (actionCode: string) => {
      setError(null);

      if (COMMENT_REQUIRED_ACTIONS.has(actionCode) && !comment.trim()) {
        setError('Vui lòng nhập lý do trước khi thực hiện hành động này.');
        return;
      }

      setSubmitting(actionCode);
      try {
        const res = await fetch(`/api/workflows/${workflowInstanceId}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionCode,
            comment: comment.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
          return;
        }

        setComment('');
        onActionSuccess();
      } catch {
        setError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
      } finally {
        setSubmitting(null);
      }
    },
    [workflowInstanceId, comment, onActionSuccess]
  );

  if (isTerminal) {
    return (
      <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground text-center">
        Quy trình đã kết thúc.
      </div>
    );
  }

  if (!isAssignee && !isInitiator) {
    return (
      <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Bạn không phải người được phân công xử lý bước này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment */}
      <div className="space-y-1.5">
        <Label htmlFor="wf-comment" className="text-sm">
          Ý kiến / Lý do{' '}
          <span className="text-muted-foreground font-normal">
            (bắt buộc khi từ chối hoặc trả lại)
          </span>
        </Label>
        <Textarea
          id="wf-comment"
          placeholder="Nhập ý kiến hoặc lý do xử lý..."
          rows={3}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            if (error) setError(null);
          }}
          disabled={!!submitting}
          className="resize-none text-sm"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action buttons */}
      {isAssignee && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleAction('APPROVE')}
            disabled={!!submitting}
            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting === 'APPROVE' ? 'Đang xử lý…' : 'Phê duyệt'}
          </Button>

          <Button
            onClick={() => handleAction('REJECT')}
            disabled={!!submitting}
            variant="destructive"
            size="sm"
            className="gap-1.5"
          >
            <XCircle className="h-4 w-4" />
            {submitting === 'REJECT' ? 'Đang xử lý…' : 'Từ chối'}
          </Button>

          <Button
            onClick={() => handleAction('RETURN')}
            disabled={!!submitting}
            variant="outline"
            size="sm"
            className={cn('gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50')}
          >
            <RotateCcw className="h-4 w-4" />
            {submitting === 'RETURN' ? 'Đang xử lý…' : 'Trả lại'}
          </Button>
        </div>
      )}

      {/* CANCEL — chỉ initiator mới cancel được */}
      {isInitiator && !isTerminal && (
        <div className="pt-1 border-t">
          <Button
            onClick={() => handleAction('CANCEL')}
            disabled={!!submitting}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-gray-500 hover:text-gray-700"
          >
            <Ban className="h-3.5 w-3.5" />
            {submitting === 'CANCEL' ? 'Đang hủy…' : 'Hủy quy trình'}
          </Button>
        </div>
      )}
    </div>
  );
}
