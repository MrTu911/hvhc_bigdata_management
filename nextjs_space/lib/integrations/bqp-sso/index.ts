/**
 * M01 – UC-07: BQP SSO Entry Point
 *
 * getSsoAdapter() trả về adapter phù hợp dựa trên env vars.
 * Hiện tại luôn trả về StubBqpSsoAdapter vì chưa có thông tin BQP IdP.
 *
 * Khi có cấu hình thực, thêm điều kiện:
 *   if (process.env.BQP_SSO_CLIENT_ID) return new OidcBqpAdapter();
 */

export type { BqpSsoAdapter, BqpSsoUser, SsoAuthResult } from './types';
export { StubBqpSsoAdapter } from './stub-adapter';

import { StubBqpSsoAdapter } from './stub-adapter';
import type { BqpSsoAdapter } from './types';

let _adapter: BqpSsoAdapter | null = null;

export function getSsoAdapter(): BqpSsoAdapter {
  if (!_adapter) {
    // Future: swap based on BQP_SSO_PROTOCOL env var (oidc | saml | custom)
    _adapter = new StubBqpSsoAdapter();
  }
  return _adapter;
}
