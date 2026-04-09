// Stub cho 'server-only' trong môi trường Vitest.
// Next.js dùng package này để ném lỗi khi import Server-only code vào Client Component.
// Trong test environment không có runtime Next.js → stub thành no-op.
export {};
