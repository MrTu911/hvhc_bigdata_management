/* ============================================================
   PRINT APP — renders all screens stacked for PDF export
   ============================================================ */

const PRINT_USER = {
  name: 'Đ.tá Nguyễn Văn Hùng',
  role: 'Quản trị hệ thống',
  initials: 'NH'
};

const SCREEN_LIST = [
  { key: 'dashboard', title: 'Tổng quan',                 Comp: Dashboard },
  { key: 'sources',   title: 'Nguồn dữ liệu',             Comp: DataSourcesScreen },
  { key: 'warehouse', title: 'Kho dữ liệu',               Comp: WarehouseScreen },
  { key: 'pipeline',  title: 'ETL / Pipeline',            Comp: PipelineScreen },
  { key: 'reports',   title: 'Báo cáo & Thống kê',        Comp: ReportsScreen },
  { key: 'users',     title: 'Người dùng & Phân quyền',   Comp: UsersScreen },
  { key: 'monitor',   title: 'Giám sát hệ thống',         Comp: MonitorScreen },
  { key: 'audit',     title: 'Nhật ký hệ thống',          Comp: AuditScreen },
  { key: 'security',  title: 'An ninh / Bảo mật',         Comp: SecurityScreen },
];

const PrintShell = ({ active, children }) => (
  <div className="print-page">
    <Banner show={true}/>
    <Topbar user={PRINT_USER} onLogout={() => {}}/>
    <div className="app">
      <Sidebar active={active} onNav={() => {}}/>
      <main className="main">{children}</main>
    </div>
  </div>
);

const PrintCover = () => (
  <div className="print-page print-cover">
    <Banner show={true}/>
    <div className="cover-body">
      <span className="eyebrow">
        <span style={{width:6,height:6,background:'var(--mil-red)',borderRadius:'50%', display:'inline-block'}}/>
        Học viện Hậu Cần · Phòng KHCN
      </span>
      <h1 style={{fontFamily:'var(--font-serif)', fontSize:56, lineHeight:1.05, fontWeight:600, margin:'24px 0 12px', letterSpacing:'-0.015em'}}>
        Hệ thống Quản lý <br/>
        <b style={{color:'var(--brand-red)'}}>Cơ sở dữ liệu Bigdata</b>
      </h1>
      <p style={{fontSize:17, color:'var(--ink-2)', maxWidth:720, lineHeight:1.65, margin:'0 0 36px'}}>
        Tài liệu trình bày thiết kế giao diện phần mềm Quản lý CSDL Bigdata phục vụ
        nghiên cứu khoa học, giáo dục đào tạo, quản lý cán bộ và quân nhân của Học viện.
      </p>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24, maxWidth:720, marginBottom:48}}>
        {[
          ['248 TB',  'Dữ liệu quản lý'],
          ['9',       'Module chức năng'],
          ['1.847',   'Dataset'],
        ].map(([v, l]) => (
          <div key={l} style={{borderTop:'3px solid var(--brand-gold)', paddingTop:14}}>
            <div style={{fontFamily:'var(--font-serif)', fontSize:30, fontWeight:600, color:'var(--ink)'}}>{v}</div>
            <div style={{fontSize:12, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600, marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      <h3 style={{margin:'0 0 12px', fontFamily:'var(--font-serif)', fontSize:14, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:600}}>
        Mục lục
      </h3>
      <ol style={{margin:0, padding:0, listStyle:'none', columns:2, columnGap:48, fontSize:14, lineHeight:2, color:'var(--ink-2)'}}>
        {SCREEN_LIST.map((s, i) => (
          <li key={s.key} style={{display:'flex', gap:10, breakInside:'avoid'}}>
            <span style={{fontFamily:'var(--font-mono)', color:'var(--ink-mute)', minWidth:24}}>{String(i+1).padStart(2,'0')}</span>
            <b style={{flex:1, color:'var(--ink)'}}>{s.title}</b>
          </li>
        ))}
      </ol>

      <div style={{position:'absolute', bottom:36, left:48, right:48, display:'flex', justifyContent:'space-between',
                   borderTop:'1px solid var(--line)', paddingTop:14, fontSize:11.5, color:'var(--ink-3)'}}>
        <span>Bản trình bày thiết kế · v4.2 · Tháng 6/2026</span>
        <span style={{fontFamily:'var(--font-mono)'}}>© Học viện Hậu Cần — MAL</span>
      </div>
    </div>
  </div>
);

const PrintApp = () => {
  // apply sky-blue theme tokens at mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-color', 'sky');
  }, []);

  return (
    <>
      <PrintCover/>
      {SCREEN_LIST.map(s => (
        <PrintShell key={s.key} active={s.key}>
          <s.Comp/>
        </PrintShell>
      ))}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<PrintApp/>);

/* Auto-print fires only when ?print=1 is set */
if (new URLSearchParams(location.search).get('print') === '1') {
  (async () => {
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    await new Promise(r => setTimeout(r, 1500));
    window.print();
  })();
}
