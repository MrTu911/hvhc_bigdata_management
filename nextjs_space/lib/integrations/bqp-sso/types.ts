/**
 * M01 – UC-07: BQP SSO Integration Types
 *
 * Scaffold abstraction layer cho tích hợp SSO với hệ thống BQP.
 * Protocol thực tế (OIDC/SAML/custom) chưa xác định — interface này
 * cho phép swap implementation mà không ảnh hưởng logic nghiệp vụ.
 */

export interface BqpSsoUser {
  /** ID duy nhất trong hệ thống BQP */
  bqpId: string;
  /** Quân số / mã định danh quân nhân */
  militaryId: string;
  email: string;
  name: string;
  /** Cấp bậc theo BQP */
  rank?: string;
  /** Đơn vị theo BQP */
  unitCode?: string;
  /** Chức vụ theo BQP */
  positionCode?: string;
  /** Raw claims từ identity provider */
  rawClaims?: Record<string, unknown>;
}

export type SsoAuthResult =
  | {
      success: true;
      user: BqpSsoUser;
      accessToken: string;
      /** Thời điểm hết hạn của access token */
      expiresAt: Date;
    }
  | {
      success: false;
      error: string;
      errorCode: 'INVALID_TOKEN' | 'USER_NOT_FOUND' | 'PROVIDER_ERROR' | 'NOT_CONFIGURED';
    };

export interface BqpSsoAdapter {
  /** Tên adapter để log/debug */
  readonly name: string;
  /** Kiểm tra adapter đã được cấu hình (env vars, certs) */
  isConfigured(): boolean;
  /** Tạo URL redirect đến IdP */
  getAuthorizationUrl(state: string, redirectUri: string): string;
  /** Đổi authorization code lấy user profile */
  exchangeCode(code: string, redirectUri: string): Promise<SsoAuthResult>;
  /** Verify access token và lấy user profile */
  verifyToken(token: string): Promise<SsoAuthResult>;
}
