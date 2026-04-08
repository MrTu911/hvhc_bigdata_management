/**
 * M01 – UC-07: BQP SSO Stub Adapter
 *
 * Placeholder adapter dùng trong development / khi chưa có cấu hình thực.
 * Tất cả method đều trả về lỗi NOT_CONFIGURED — không bao giờ dùng trên production.
 *
 * Khi có thông tin BQP IdP, tạo OidcBqpAdapter hoặc SamlBqpAdapter
 * implement cùng interface BqpSsoAdapter và swap qua getSsoAdapter().
 */

import type { BqpSsoAdapter, SsoAuthResult } from './types';

export class StubBqpSsoAdapter implements BqpSsoAdapter {
  readonly name = 'stub';

  isConfigured(): boolean {
    return false;
  }

  getAuthorizationUrl(_state: string, _redirectUri: string): string {
    throw new Error('BQP SSO chưa được cấu hình. Liên hệ admin để thiết lập BQP_SSO_* env vars.');
  }

  async exchangeCode(_code: string, _redirectUri: string): Promise<SsoAuthResult> {
    return {
      success: false,
      error: 'BQP SSO chưa được cấu hình',
      errorCode: 'NOT_CONFIGURED',
    };
  }

  async verifyToken(_token: string): Promise<SsoAuthResult> {
    return {
      success: false,
      error: 'BQP SSO chưa được cấu hình',
      errorCode: 'NOT_CONFIGURED',
    };
  }
}
