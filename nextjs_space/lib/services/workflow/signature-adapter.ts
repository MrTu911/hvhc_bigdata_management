/**
 * M13 – Signature Adapter (Phase 1: interface + stub)
 *
 * Thiết kế theo adapter pattern để không phụ thuộc chặt vào nhà cung cấp ký số.
 * Phase 1: chỉ có StubSignatureProvider để test luồng mà không cần tích hợp thật.
 * Phase 2: thêm ViettelSignatureProvider, VNPTSignatureProvider... theo interface này.
 *
 * Nguyên tắc:
 *  - Nếu ký thất bại → ghi WorkflowSignature.status = FAILED, không phá trạng thái workflow
 *  - hashValue + certificateInfoJson là bằng chứng kiểm tra về sau
 *  - providerCode xác định adapter nào được dùng tại runtime
 */

import prisma from '@/lib/db';
import { WorkflowSignatureStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Core interface — mọi provider phải implement
// ---------------------------------------------------------------------------

export interface SignaturePayload {
  /** ID của WorkflowInstance */
  workflowInstanceId: string;
  /** ID của WorkflowStepInstance đang ký */
  stepInstanceId: string;
  /** ID người ký */
  signerId: string;
  /** Nội dung/hash của tài liệu cần ký */
  documentHash: string;
  /** Metadata bổ sung (title, entityType...) */
  context?: Record<string, unknown>;
}

export interface SignatureResult {
  success: boolean;
  hashValue?: string;
  certificateInfoJson?: Record<string, unknown>;
  evidenceFileId?: string;
  errorMessage?: string;
}

export interface SignatureProvider {
  /** Mã định danh của provider, lưu vào WorkflowSignature.providerCode */
  readonly providerCode: string;
  /** Tên hiển thị */
  readonly providerName: string;
  /**
   * Thực hiện ký số.
   * KHÔNG được throw — luôn trả SignatureResult.
   */
  sign(payload: SignaturePayload): Promise<SignatureResult>;
  /**
   * Kiểm tra chữ ký đã ký có còn hợp lệ không (verify).
   */
  verify(hashValue: string, certificateInfoJson: Record<string, unknown>): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Stub Provider — dùng cho Phase 1 và testing
// ---------------------------------------------------------------------------

export class StubSignatureProvider implements SignatureProvider {
  readonly providerCode = 'STUB';
  readonly providerName = 'Stub (Môi trường phát triển)';

  async sign(payload: SignaturePayload): Promise<SignatureResult> {
    // Stub: không ký thật, chỉ sinh hash giả để test luồng
    const fakeHash = `stub-hash-${payload.documentHash.slice(0, 8)}-${Date.now()}`;
    return {
      success: true,
      hashValue: fakeHash,
      certificateInfoJson: {
        provider: 'STUB',
        signedAt: new Date().toISOString(),
        signerId: payload.signerId,
        note: 'Chữ ký stub — không có giá trị pháp lý',
      },
    };
  }

  async verify(_hashValue: string, _cert: Record<string, unknown>): Promise<boolean> {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Registry — chọn provider theo providerCode
// ---------------------------------------------------------------------------

const registry = new Map<string, SignatureProvider>();
registry.set('STUB', new StubSignatureProvider());

export function registerSignatureProvider(provider: SignatureProvider): void {
  registry.set(provider.providerCode, provider);
}

export function getSignatureProvider(providerCode: string): SignatureProvider {
  const provider = registry.get(providerCode);
  if (!provider) {
    throw new Error(`Signature provider không tồn tại: ${providerCode}`);
  }
  return provider;
}

// ---------------------------------------------------------------------------
// SignatureService — orchestrate ký số + ghi WorkflowSignature
// ---------------------------------------------------------------------------

export interface RequestSignatureInput {
  workflowInstanceId: string;
  stepInstanceId: string;
  signerId: string;
  signatureType: string;
  /** Nếu không truyền, dùng STUB (Phase 1) */
  providerCode?: string;
  documentHash: string;
  context?: Record<string, unknown>;
}

class SignatureServiceClass {
  /**
   * Yêu cầu ký số tại một bước.
   * Kết quả luôn được ghi vào WorkflowSignature — thành công hoặc thất bại.
   * Không throw nếu provider lỗi — trả về status FAILED.
   */
  async requestSign(input: RequestSignatureInput): Promise<{
    signatureId: string;
    status: WorkflowSignatureStatus;
    hashValue?: string;
  }> {
    const providerCode = input.providerCode ?? 'STUB';

    // Tạo bản ghi PENDING trước khi gọi provider
    const signature = await prisma.workflowSignature.create({
      data: {
        workflowInstanceId: input.workflowInstanceId,
        stepInstanceId: input.stepInstanceId,
        signerId: input.signerId,
        signatureType: input.signatureType,
        providerCode,
        status: WorkflowSignatureStatus.PENDING,
      },
    });

    let result: SignatureResult;
    try {
      const provider = getSignatureProvider(providerCode);
      result = await provider.sign({
        workflowInstanceId: input.workflowInstanceId,
        stepInstanceId: input.stepInstanceId,
        signerId: input.signerId,
        documentHash: input.documentHash,
        context: input.context,
      });
    } catch (err) {
      result = {
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Lỗi không xác định từ signature provider',
      };
    }

    // Cập nhật kết quả vào WorkflowSignature
    const finalStatus = result.success
      ? WorkflowSignatureStatus.SIGNED
      : WorkflowSignatureStatus.FAILED;

    await prisma.workflowSignature.update({
      where: { id: signature.id },
      data: {
        status: finalStatus,
        signedAt: result.success ? new Date() : null,
        hashValue: result.hashValue ?? null,
        certificateInfoJson: result.certificateInfoJson ?? undefined,
        evidenceFileId: result.evidenceFileId ?? null,
      },
    });

    return {
      signatureId: signature.id,
      status: finalStatus,
      hashValue: result.hashValue,
    };
  }

  /**
   * Kiểm tra lại chữ ký đã lưu có còn hợp lệ không.
   */
  async verifySignature(signatureId: string): Promise<{ valid: boolean; reason?: string }> {
    const sig = await prisma.workflowSignature.findUnique({
      where: { id: signatureId },
      select: {
        status: true,
        providerCode: true,
        hashValue: true,
        certificateInfoJson: true,
      },
    });

    if (!sig) return { valid: false, reason: 'Chữ ký không tồn tại' };
    if (sig.status !== WorkflowSignatureStatus.SIGNED) {
      return { valid: false, reason: `Trạng thái chữ ký: ${sig.status}` };
    }
    if (!sig.hashValue || !sig.providerCode) {
      return { valid: false, reason: 'Thiếu dữ liệu bằng chứng' };
    }

    try {
      const provider = getSignatureProvider(sig.providerCode);
      const isValid = await provider.verify(
        sig.hashValue,
        (sig.certificateInfoJson as Record<string, unknown>) ?? {}
      );
      return { valid: isValid };
    } catch {
      return { valid: false, reason: 'Không tìm thấy provider để verify' };
    }
  }
}

export const SignatureService = new SignatureServiceClass();
