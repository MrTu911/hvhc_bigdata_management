/* ============================================================
   Icons + shared components
   ============================================================ */
const Icon = ({ name, size = 16, stroke = 2 }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
    database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" /><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" /></>,
    layers: <><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 12 10 5 10-5" /><path d="m2 17 10 5 10-5" /></>,
    flow: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M8 6h8M7 8l4 8M17 8l-4 8" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 4 5-7" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><circle cx="17" cy="9" r="2.5" /><path d="M15 21v-1.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3V21" /></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="m6 11 2.5-3 2 2.5L14 6l4 5" fill="none" /></>,
    log: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
    shield: <><path d="M12 2 4 6v6c0 4.5 3 8 8 10 5-2 8-5.5 8-10V6l-8-4z" /><path d="m9 12 2 2 4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .4-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.4H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.4 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a2 2 0 0 0 3.4 0" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
    chevronDown: <><path d="m6 9 6 6 6-6" /></>,
    chevronRight: <><path d="m9 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    filter: <><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z" /></>,
    download: <><path d="M12 3v12m0 0-4-4m4 4 4-4" /><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" /></>,
    upload: <><path d="M12 21V9m0 0-4 4m4-4 4 4" /><path d="M3 4h18" /></>,
    refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    moreH: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
    arrowUp: <><path d="M12 19V5m0 0-6 6m6-6 6 6" /></>,
    arrowDown: <><path d="M12 5v14m0 0 6-6m-6 6-6-6" /></>,
    check: <><path d="m4 12 6 6L20 6" /></>,
    x: <><path d="M18 6 6 18M6 6l12 12" /></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    key: <><path d="M21 2 13 10" /><path d="m17 6 4 4" /><circle cx="8" cy="16" r="5" /></>,
    server: <><rect x="3" y="3" width="18" height="7" rx="1.5" /><rect x="3" y="14" width="18" height="7" rx="1.5" /><path d="M7 6.5h.01M7 17.5h.01" /></>,
    cloud: <><path d="M18 17a4 4 0 0 0-1-7.9 6 6 0 0 0-11.7 1.6A4 4 0 0 0 6 17h12z" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
    play: <><path d="M5 4v16l14-8z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    star: <><path d="m12 2 3 7 7 .6-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.7L2 9.6 9 9z" /></>,
    folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || null}
    </svg>);

};

/* ============================================================
   Banner + Topbar
   ============================================================ */
const Banner = ({ show }) => {
  if (!show) return null;
  return (
    <div className="banner">
      <img src={window.__resources?.bannerImg || "assets/banner.png"} alt="Học viện Hậu Cần — Military Academy of Logistics" />
    </div>);

};

const Topbar = ({ user, onLogout }) => {
  return (
    <div className="topbar">
      <div className="star" />
      <div className="system-name">
        Hệ thống Quản lý CSDL Bigdata
        <small>BIGDATA · MAL · v4.2</small>
      </div>
      <div className="topbar-search">
        <span style={{ position: 'absolute', left: 10, top: 8, opacity: 0.7 }}><Icon name="search" size={14} /></span>
        <input placeholder="Tìm kiếm dataset, bảng, query, người dùng…" />
        <kbd style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.12)', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
      </div>
      <div className="topbar-spacer" />
      <button className="topbar-action" title="Đồng bộ">
        <Icon name="refresh" size={16} />
      </button>
      <button className="topbar-action" title="Cảnh báo">
        <Icon name="bell" size={16} />
        <span className="dot" />
      </button>
      <button className="topbar-action" title="Cài đặt">
        <Icon name="settings" size={16} />
      </button>
      <button className="topbar-user" onClick={onLogout} title="Đăng xuất">
        <div className="avatar">{user.initials}</div>
        <div className="who">
          <b>{user.name}</b>
          <span>{user.role}</span>
        </div>
        <Icon name="chevronDown" size={14} />
      </button>
    </div>);

};

/* ============================================================
   Sidebar
   ============================================================ */
const NAV = [
{ section: "Khai thác dữ liệu" },
{ key: "dashboard", label: "Tổng quan", icon: "dashboard" },
{ key: "sources", label: "Nguồn dữ liệu", icon: "database", badge: 12 },
{ key: "warehouse", label: "Kho dữ liệu", icon: "layers" },
{ key: "pipeline", label: "ETL / Pipeline", icon: "flow", badge: 3 },
{ key: "reports", label: "Báo cáo & Thống kê", icon: "chart" },
{ section: "Quản trị" },
{ key: "users", label: "Người dùng & Phân quyền", icon: "users" },
{ key: "monitor", label: "Giám sát hệ thống", icon: "monitor" },
{ key: "audit", label: "Nhật ký hệ thống", icon: "log" },
{ key: "security", label: "An ninh / Bảo mật", icon: "shield" }];


const Sidebar = ({ active, onNav }) => {
  return (
    <aside className="sidebar">
      {NAV.map((it, i) => {
        if (it.section) return <div className="sb-section" key={"s" + i}>{it.section}</div>;
        const isA = active === it.key;
        return (
          <div key={it.key}
          className={"sb-item" + (isA ? " active" : "")}
          onClick={() => onNav(it.key)}>
            <span className="sb-icon"><Icon name={it.icon} size={17} /></span>
            <span>{it.label}</span>
            {it.badge != null && <span className="badge">{it.badge}</span>}
          </div>);

      })}
      <div style={{ marginTop: 'auto', padding: 10 }}>
        <div style={{
          background: 'var(--panel-2)', border: '1px solid var(--line-soft)',
          borderRadius: 'var(--r-lg)', padding: '12px', fontSize: 11, color: 'var(--ink-3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ok)', fontWeight: 600, marginBottom: 4 }}>
            <span className="sd ok" style={{ margin: 0 }} />
            Cụm máy: 14/14 nodes
          </div>
          <div>HDFS · Spark · Hive · Trino</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)' }}>Uptime 312d 04h</div>
        </div>
      </div>
    </aside>);

};

Object.assign(window, { Icon, Banner, Topbar, Sidebar, NAV });