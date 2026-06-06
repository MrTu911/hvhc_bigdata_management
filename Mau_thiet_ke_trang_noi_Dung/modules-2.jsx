/* ============================================================
   Functional modules part 2:
   Reports, Users, Monitor, Audit, Security
   ============================================================ */

/* ============================================================
   3. REPORTS
   ============================================================ */
const REPORTS = [
  { id: 'r1', t: 'Báo cáo Tổng quân số định kỳ', cat: 'Quân lực', icon: 'users',  fmt: ['PDF', 'XLSX'], freq: 'Tháng',   last: '01/06/2026', runs: 124, fav: true },
  { id: 'r2', t: 'Thống kê điểm học viên theo khoa', cat: 'Đào tạo', icon: 'chart', fmt: ['PDF', 'XLSX', 'CSV'], freq: 'Học kỳ', last: '20/05/2026', runs: 87, fav: true },
  { id: 'r3', t: 'Báo cáo công trình NCKH', cat: 'KH&CN', icon: 'file', fmt: ['PDF', 'DOCX'], freq: 'Quý', last: '31/03/2026', runs: 42, fav: false },
  { id: 'r4', t: 'Bảng tổng hợp cán bộ đến hạn nâng lương', cat: 'Cán bộ', icon: 'users', fmt: ['XLSX'], freq: 'Tháng', last: '01/06/2026', runs: 96, fav: true },
  { id: 'r5', t: 'Thống kê tài chính hậu cần', cat: 'Tài chính', icon: 'chart', fmt: ['PDF', 'XLSX'], freq: 'Tháng', last: '31/05/2026', runs: 64, fav: false },
  { id: 'r6', t: 'Báo cáo sử dụng hệ thống Bigdata', cat: 'Hệ thống', icon: 'monitor', fmt: ['PDF'], freq: 'Tuần', last: '02/06/2026', runs: 218, fav: false },
  { id: 'r7', t: 'Danh sách đề tài đang triển khai', cat: 'KH&CN', icon: 'file', fmt: ['XLSX', 'CSV'], freq: 'Tuần', last: '02/06/2026', runs: 38, fav: false },
  { id: 'r8', t: 'Báo cáo audit truy cập dữ liệu mật', cat: 'An ninh', icon: 'shield', fmt: ['PDF'], freq: 'Tháng', last: '01/06/2026', runs: 12, fav: true },
];

const ReportsScreen = () => {
  const [search, setSearch] = React.useState('');
  const [active, setActive] = React.useState('Tất cả');
  const cats = ['Tất cả', ...new Set(REPORTS.map(r => r.cat))];
  const filtered = REPORTS.filter(r =>
    (active === 'Tất cả' || r.cat === active) &&
    (search === '' || r.t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div data-screen-label="Báo cáo">
      <PageHead
        crumb={['Khai thác dữ liệu', 'Báo cáo & Thống kê']}
        title="Báo cáo & Thống kê"
        sub={<><b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>{REPORTS.length}</b> mẫu báo cáo · <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>847</b> lần xuất 30 ngày</>}
        right={<>
          <button className="btn"><Icon name="folder" size={14}/> Báo cáo của tôi</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Tạo mẫu báo cáo</button>
        </>}
      />

      <div className="row r-1-1" style={{marginBottom: 14}}>
        <div className="card">
          <div className="card-h">
            <h3>Lịch xuất sắp tới</h3>
            <div className="spacer"/>
            <span className="tag info">tự động</span>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {[
              { d: 'Hôm nay 18:00', n: 'Báo cáo sử dụng hệ thống Bigdata', who: 'tự động → Lãnh đạo' },
              { d: '07/06 06:00', n: 'Danh sách đề tài đang triển khai', who: 'tự động → P. KHCN' },
              { d: '15/06 09:00', n: 'Thống kê điểm học viên K42', who: 'thủ công · trung.dao' },
            ].map((s, i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8}}>
                <div style={{width:42, height:42, borderRadius:6, background:'color-mix(in oklab, var(--brand-red) 12%, transparent)', color:'var(--brand-red)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <Icon name="clock" size={16}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <b style={{fontSize:13.5, display:'block'}}>{s.n}</b>
                  <span style={{fontSize:11.5, color:'var(--ink-3)'}}>{s.who}</span>
                </div>
                <span style={{fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-2)', fontWeight:600}}>{s.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Tần suất xuất theo lĩnh vực — 30d</h3>
            <div className="spacer"/>
          </div>
          <BarChart height={220} data={[
            { label: 'Quân lực', value: 248 },
            { label: 'Đào tạo', value: 184 },
            { label: 'KH&CN',   value: 142 },
            { label: 'Cán bộ',  value: 124 },
            { label: 'Tài chính', value: 78 },
            { label: 'An ninh', value: 42 },
            { label: 'Hệ thống', value: 29 },
          ]}/>
        </div>
      </div>

      <Toolbar search={search} setSearch={setSearch}
               chips={cats} active={active} setActive={setActive}
               placeholder="Tìm mẫu báo cáo…"/>

      <div className="ds-grid">
        {filtered.map(r => (
          <div key={r.id} className="ds-card">
            <div className="ds-head">
              <div className="ds-ic info"><Icon name={r.icon} size={16}/></div>
              <div style={{flex:1, minWidth:0}}>
                <h4>{r.t}</h4>
                <div className="ds-sub">{r.cat} · {r.freq}</div>
              </div>
              <button className="btn icon sm" style={{color: r.fav ? 'var(--brand-gold)' : 'var(--ink-mute)'}}>
                <Icon name="star" size={15}/>
              </button>
            </div>
            <div className="ds-stats">
              <div className="ds-stat"><b>{r.runs}</b><span>Lần xuất</span></div>
              <div className="ds-stat"><b style={{fontSize:11.5}}>{r.last}</b><span>Cuối</span></div>
              <div className="ds-stat" style={{textAlign:'right'}}>
                {r.fmt.map(f => <span key={f} className="tag mute" style={{fontSize:9.5, marginLeft:3, padding:'1px 5px'}}>{f}</span>)}
              </div>
            </div>
            <div className="ds-foot">
              <button className="btn sm" style={{flex:1, justifyContent:'center'}}><Icon name="eye" size={12}/> Xem trước</button>
              <button className="btn sm primary" style={{flex:1, justifyContent:'center'}}><Icon name="download" size={12}/> Xuất</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   4. USERS & PERMISSIONS
   ============================================================ */
const USERS = [
  { id:'u1', n:'Nguyễn Văn Hùng',    rank:'Đại tá',     u:'admin.bigdata', mail:'hung.nv@hvhc.edu.vn', dv:'TT. CNTT',  role:'SYSADMIN',    status:'active', last:'14:32 hôm nay', mfa:true },
  { id:'u2', n:'Trần Đăng Trung',    rank:'Thượng tá',  u:'trung.dao',     mail:'trung.dao@hvhc.edu.vn', dv:'P. KHCN', role:'DATA_ENGINEER', status:'active', last:'14:28 hôm nay', mfa:true },
  { id:'u3', n:'Lê Thị Linh',        rank:'Đại úy',     u:'linh.nguyen',   mail:'linh.le@hvhc.edu.vn', dv:'P. Đào tạo', role:'ANALYST',     status:'active', last:'14:15 hôm nay', mfa:true },
  { id:'u4', n:'Phạm Minh Đức',      rank:'Thượng úy',  u:'minh.tran',     mail:'duc.pm@hvhc.edu.vn', dv:'TT. CNTT',  role:'OPERATOR',    status:'active', last:'13:48 hôm nay', mfa:true },
  { id:'u5', n:'Hoàng Văn Hùng',     rank:'Trung tá',   u:'hung.le',       mail:'hung.hv@hvhc.edu.vn', dv:'P. Quân lực', role:'ANALYST',   status:'active', last:'12:20 hôm nay', mfa:true },
  { id:'u6', n:'Vũ Thanh Liêm',      rank:'Trung úy',   u:'liem.vu',       mail:'liem.vu@hvhc.edu.vn', dv:'P. Cán bộ',  role:'VIEWER',     status:'inactive', last:'01/06/2026', mfa:false },
  { id:'u7', n:'Đỗ Văn Mạnh',        rank:'Đại úy',     u:'manh.do',       mail:'manh.do@hvhc.edu.vn', dv:'P. Tài chính', role:'ANALYST',  status:'active', last:'14:01 hôm nay', mfa:true },
  { id:'u8', n:'Bùi Quang Nam',      rank:'Thiếu tá',   u:'nam.bui',       mail:'nam.bui@hvhc.edu.vn', dv:'TT. CNTT',  role:'AUDITOR',     status:'pending', last:'—', mfa:false },
];

const ROLE_INFO = {
  SYSADMIN:        { c:'var(--err)',  d:'Quản trị toàn hệ thống' },
  DATA_ENGINEER:   { c:'var(--brand-red)',  d:'Quản lý pipeline & schema' },
  ANALYST:         { c:'var(--info)', d:'Truy vấn & phân tích dữ liệu' },
  OPERATOR:        { c:'var(--warn)', d:'Vận hành hệ thống' },
  VIEWER:          { c:'var(--ink-3)', d:'Chỉ xem' },
  AUDITOR:         { c:'var(--brand-gold)', d:'Kiểm toán nhật ký' },
};

const UsersScreen = () => {
  const [search, setSearch] = React.useState('');
  const [active, setActive] = React.useState('Tất cả');
  const [picked, setPicked] = React.useState(USERS[0]);

  const roles = ['Tất cả', ...Object.keys(ROLE_INFO)];
  const filtered = USERS.filter(u =>
    (active === 'Tất cả' || u.role === active) &&
    (search === '' || (u.n + u.u + u.dv).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div data-screen-label="Người dùng">
      <PageHead
        crumb={['Quản trị', 'Người dùng & Phân quyền']}
        title="Người dùng & Phân quyền"
        sub={<>
          <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>{USERS.filter(u=>u.status==='active').length}</b> đang hoạt động ·
          <b style={{color:'var(--warn)', marginLeft:4}}>{USERS.filter(u=>u.status==='pending').length}</b> chờ duyệt ·
          <b style={{color:'var(--ink-3)', marginLeft:4}}>{USERS.filter(u=>!u.mfa).length}</b> chưa bật MFA
        </>}
        right={<>
          <button className="btn"><Icon name="download" size={14}/> Xuất danh sách</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Cấp tài khoản</button>
        </>}
      />

      <div className="row r-1-1-1" style={{marginBottom:14}}>
        {Object.entries(ROLE_INFO).slice(0, 3).map(([role, info]) => {
          const n = USERS.filter(u => u.role === role).length;
          return (
            <div key={role} className="kpi" style={{borderLeft:`3px solid ${info.c}`}}>
              <div className="k-label" style={{color: info.c}}>{role}</div>
              <div className="k-value">{n} <span className="unit">tài khoản</span></div>
              <div className="k-meta">{info.d}</div>
            </div>
          );
        })}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:14}}>
        <div>
          <Toolbar search={search} setSearch={setSearch}
                   chips={roles} active={active} setActive={setActive}
                   placeholder="Tìm theo tên, username, đơn vị…"/>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Đơn vị</th>
                  <th>Vai trò</th>
                  <th>MFA</th>
                  <th>Truy cập cuối</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const sel = picked.id === u.id;
                  return (
                    <tr key={u.id} onClick={() => setPicked(u)}
                        style={{cursor:'pointer', background: sel ? 'color-mix(in oklab, var(--brand-red) 6%, transparent)' : undefined}}>
                      <td>
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <div style={{
                            width:32, height:32, borderRadius:'50%',
                            background:'linear-gradient(135deg, var(--brand-red), var(--brand-red-deep))',
                            color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                            fontWeight:700, fontSize:11
                          }}>{u.n.split(' ').slice(-1)[0][0]}{u.n.split(' ')[0][0]}</div>
                          <div>
                            <b>{u.rank} {u.n}</b>
                            <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)'}}>{u.u}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.dv}</td>
                      <td><span className="tag" style={{background:`color-mix(in oklab, ${ROLE_INFO[u.role].c} 15%, transparent)`, color:ROLE_INFO[u.role].c}}>{u.role}</span></td>
                      <td>{u.mfa ? <Icon name="check" size={14} stroke={3}/> : <span style={{color:'var(--err)'}}><Icon name="x" size={14} stroke={3}/></span>}</td>
                      <td style={{fontSize:12, color:'var(--ink-3)'}}>{u.last}</td>
                      <td>
                        {u.status === 'active'   && <span className="tag ok"><span className="dot"/>hoạt động</span>}
                        {u.status === 'inactive' && <span className="tag mute"><span className="dot"/>tạm ngưng</span>}
                        {u.status === 'pending'  && <span className="tag warn"><span className="dot"/>chờ duyệt</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* user detail */}
        <div className="card" style={{alignSelf:'start', position:'sticky', top:14}}>
          <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:16}}>
            <div style={{
              width:56, height:56, borderRadius:'50%',
              background:'linear-gradient(135deg, var(--brand-red), var(--brand-red-deep))',
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:18
            }}>{picked.n.split(' ').slice(-1)[0][0]}{picked.n.split(' ')[0][0]}</div>
            <div>
              <b style={{fontSize:15, display:'block'}}>{picked.rank} {picked.n}</b>
              <span style={{fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-3)'}}>{picked.u}</span>
            </div>
          </div>
          <dl style={{margin:0, fontSize:12.5, display:'grid', gridTemplateColumns:'auto 1fr', gap:'8px 14px'}}>
            <dt style={{color:'var(--ink-3)'}}>Email</dt>
            <dd style={{margin:0, fontFamily:'var(--font-mono)', fontSize:12}}>{picked.mail}</dd>
            <dt style={{color:'var(--ink-3)'}}>Đơn vị</dt>
            <dd style={{margin:0}}>{picked.dv}</dd>
            <dt style={{color:'var(--ink-3)'}}>Vai trò</dt>
            <dd style={{margin:0}}><span className="tag" style={{background:`color-mix(in oklab, ${ROLE_INFO[picked.role].c} 15%, transparent)`, color:ROLE_INFO[picked.role].c}}>{picked.role}</span></dd>
            <dt style={{color:'var(--ink-3)'}}>MFA</dt>
            <dd style={{margin:0}}>{picked.mfa ? <span style={{color:'var(--ok)'}}>● Đã bật (TOTP)</span> : <span style={{color:'var(--err)'}}>● Chưa bật</span>}</dd>
            <dt style={{color:'var(--ink-3)'}}>Truy cập cuối</dt>
            <dd style={{margin:0, fontFamily:'var(--font-mono)', fontSize:12}}>{picked.last}</dd>
          </dl>
          <div className="divider"/>
          <b style={{fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.08em'}}>Quyền truy cập dataset</b>
          <div style={{marginTop:10, display:'flex', flexWrap:'wrap', gap:6}}>
            {['wh_quannhan', 'wh_dao_tao', 'dl_nckh', 'ds_canbo', 'mart_bao_cao'].map((d, i) => (
              <span key={d} className={"tag " + (i < (picked.role === 'VIEWER' ? 1 : picked.role === 'SYSADMIN' ? 5 : 3) ? 'ok' : 'mute')}>{d}</span>
            ))}
          </div>
          <div style={{display:'flex', gap:8, marginTop:18}}>
            <button className="btn sm" style={{flex:1, justifyContent:'center'}}><Icon name="key" size={12}/> Reset MK</button>
            <button className="btn sm primary" style={{flex:1, justifyContent:'center'}}><Icon name="edit" size={12}/> Sửa quyền</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   5. MONITOR — real-time system metrics
   ============================================================ */
const MonitorScreen = () => {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => { const id = setInterval(() => setTick(t => t+1), 1800); return () => clearInterval(id); }, []);

  const r = seedRandom(tick * 7 + 1);
  const cpu = Math.round(48 + r() * 22);
  const mem = Math.round(62 + r() * 14);
  const disk = Math.round(72 + r() * 8);
  const net = Math.round(180 + r() * 60);

  const cpuHist  = React.useMemo(() => generateLineData(60, 55, 16, 11 + tick), [Math.floor(tick / 20)]);
  const memHist  = React.useMemo(() => generateLineData(60, 68, 8,  17 + tick), [Math.floor(tick / 20)]);
  const ioHist   = React.useMemo(() => generateLineData(60, 420, 140, 21 + tick), [Math.floor(tick / 20)]);
  const labels = Array.from({length: 60}, (_, i) => `${i - 60}s`);

  const nodes = [
    { n: 'hd-master-01', role: 'NameNode',  cpu: 42, mem: 68, st: 'ok' },
    { n: 'hd-master-02', role: 'NameNode HA', cpu: 38, mem: 64, st: 'ok' },
    { n: 'hd-data-01', role: 'DataNode',  cpu: 71, mem: 82, st: 'warn' },
    { n: 'hd-data-02', role: 'DataNode',  cpu: 58, mem: 74, st: 'ok' },
    { n: 'hd-data-03', role: 'DataNode',  cpu: 64, mem: 78, st: 'ok' },
    { n: 'hd-data-04', role: 'DataNode',  cpu: 49, mem: 70, st: 'ok' },
    { n: 'sp-worker-01', role: 'Spark', cpu: 82, mem: 88, st: 'warn' },
    { n: 'sp-worker-02', role: 'Spark', cpu: 67, mem: 76, st: 'ok' },
    { n: 'sp-worker-03', role: 'Spark', cpu: 55, mem: 72, st: 'ok' },
    { n: 'kf-broker-01', role: 'Kafka', cpu: 34, mem: 56, st: 'ok' },
    { n: 'kf-broker-02', role: 'Kafka', cpu: 36, mem: 58, st: 'ok' },
    { n: 'kf-broker-03', role: 'Kafka', cpu: 31, mem: 54, st: 'ok' },
    { n: 'tr-coord-01', role: 'Trino coord', cpu: 28, mem: 48, st: 'ok' },
    { n: 'tr-worker-01', role: 'Trino', cpu: 71, mem: 70, st: 'ok' },
  ];

  return (
    <div data-screen-label="Giám sát hệ thống">
      <PageHead
        crumb={['Quản trị', 'Giám sát hệ thống']}
        title="Giám sát hệ thống"
        sub={<>
          <span className="tag ok"><span className="dot"/> Live · cập nhật mỗi 2s</span>
          <span style={{marginLeft:10}}>14 nodes · 312 ngày uptime</span>
        </>}
        right={<>
          <button className="btn"><Icon name="bell" size={14}/> Cấu hình cảnh báo</button>
          <button className="btn primary"><Icon name="settings" size={14}/> Cluster manager</button>
        </>}
      />

      <div className="kpi-grid">
        <KPI accent="" label="CPU cụm" value={cpu} unit="%"
             sub="14 nodes" spark={cpuHist.slice(-12)}/>
        <KPI accent="gold" label="RAM cụm" value={mem} unit="%"
             sub="2.1 / 3.2 TB" spark={memHist.slice(-12)} sparkColor="var(--brand-gold)"/>
        <KPI accent="info" label="HDFS dung lượng" value={disk} unit="%"
             sub="248 / 320 TB" spark={generateLineData(12, 72, 4, 33)} sparkColor="var(--info)"/>
        <KPI accent="ok" label="Mạng I/O" value={net} unit="MB/s"
             sub="trung bình 5 phút" spark={ioHist.slice(-12).map(v => v/3)} sparkColor="var(--ok)"/>
      </div>

      <div className="row r-1-1">
        <div className="card">
          <div className="card-h">
            <h3>CPU & RAM — 60 giây</h3>
            <div className="legend">
              <span className="lg-item"><span className="sw" style={{background:'var(--brand-red)'}}/>CPU %</span>
              <span className="lg-item"><span className="sw" style={{background:'var(--brand-gold)'}}/>RAM %</span>
            </div>
            <div className="spacer"/>
            <span className="tag info"><span className="dot"/>live</span>
          </div>
          <LineChart labels={labels} height={210}
            series={[
              { name: 'CPU %', color: 'var(--brand-red)', data: cpuHist },
              { name: 'RAM %', color: 'var(--brand-gold)', data: memHist },
            ]}/>
        </div>
        <div className="card">
          <div className="card-h">
            <h3>Throughput I/O — MB/s</h3>
            <div className="spacer"/>
            <span className="tag info"><span className="dot"/>live</span>
          </div>
          <LineChart labels={labels} height={210}
            series={[{ name: 'I/O', color: 'var(--info)', data: ioHist }]}/>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Nodes cụm máy</h3>
          <div className="spacer"/>
          <span className="tag ok">{nodes.filter(n=>n.st==='ok').length} healthy</span>
          <span className="tag warn">{nodes.filter(n=>n.st==='warn').length} warn</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:10}}>
          {nodes.map(node => (
            <div key={node.n} style={{
              padding:'12px 14px', background:'var(--panel-2)', border:'1px solid var(--line-soft)',
              borderRadius:8, borderLeft:`3px solid ${node.st === 'ok' ? 'var(--ok)' : node.st === 'warn' ? 'var(--warn)' : 'var(--err)'}`
            }}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <Icon name="server" size={14}/>
                <b style={{fontFamily:'var(--font-mono)', fontSize:12.5}}>{node.n}</b>
                <span style={{marginLeft:'auto', fontSize:10, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em'}}>{node.role}</span>
              </div>
              <div style={{display:'flex', gap:12, marginTop:8, fontSize:11, fontFamily:'var(--font-mono)'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{color:'var(--ink-3)'}}>CPU</span><b>{node.cpu}%</b>
                  </div>
                  <div style={{height:3, background:'var(--bg-sub)', borderRadius:2, marginTop:3}}>
                    <div style={{height:'100%', width:node.cpu+'%', background: node.cpu>75 ? 'var(--warn)' : 'var(--info)', borderRadius:2}}/>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{color:'var(--ink-3)'}}>RAM</span><b>{node.mem}%</b>
                  </div>
                  <div style={{height:3, background:'var(--bg-sub)', borderRadius:2, marginTop:3}}>
                    <div style={{height:'100%', width:node.mem+'%', background: node.mem>80 ? 'var(--warn)' : 'var(--ok)', borderRadius:2}}/>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   6. AUDIT LOG
   ============================================================ */
const AUDIT_ACTIONS = ['LOGIN', 'LOGOUT', 'QUERY', 'EXPORT', 'CREATE', 'UPDATE', 'DELETE', 'GRANT', 'REVOKE', 'CONFIG'];
const generateAuditLog = () => {
  const r = seedRandom(31);
  const users = ['admin.bigdata', 'trung.dao', 'linh.nguyen', 'hung.le', 'minh.tran', 'manh.do', 'nam.bui'];
  const objects = ['wh_quannhan.tbl_qn_master', 'dl_nckh.tbl_nc_de_tai', 'wh_dao_tao.tbl_dt_diem', 'ds_canbo', 'pipeline.etl_qn_daily', 'role.ANALYST', 'user.linh.nguyen'];
  const results = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'DENIED', 'SUCCESS', 'FAILED'];
  const ips = ['10.27.4.108', '10.27.4.42', '10.27.5.17', '10.27.4.108', '10.27.6.21', '10.27.5.91'];
  return Array.from({length: 28}, (_, i) => {
    const min = i * 7 + Math.floor(r()*3);
    const h = Math.max(0, 14 - Math.floor(min/60));
    const m = (60 - (min % 60)) % 60;
    const a = AUDIT_ACTIONS[Math.floor(r() * AUDIT_ACTIONS.length)];
    return {
      id: `a${1000 + i}`,
      t: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(Math.floor(r()*60)).padStart(2,'0')}`,
      d: '06/06/2026',
      action: a,
      user: users[Math.floor(r() * users.length)],
      target: objects[Math.floor(r() * objects.length)],
      result: results[Math.floor(r() * results.length)],
      ip: ips[Math.floor(r() * ips.length)],
    };
  });
};

const AuditScreen = () => {
  const [search, setSearch] = React.useState('');
  const [active, setActive] = React.useState('Tất cả');
  const data = React.useMemo(() => generateAuditLog(), []);

  const actions = ['Tất cả', 'LOGIN', 'QUERY', 'EXPORT', 'GRANT', 'CONFIG', 'DELETE'];
  const filtered = data.filter(l =>
    (active === 'Tất cả' || l.action === active) &&
    (search === '' || (l.user + l.target + l.ip).toLowerCase().includes(search.toLowerCase()))
  );

  const counts = AUDIT_ACTIONS.reduce((m, a) => ({ ...m, [a]: data.filter(d => d.action === a).length }), {});

  return (
    <div data-screen-label="Audit log">
      <PageHead
        crumb={['Quản trị', 'Nhật ký hệ thống']}
        title="Nhật ký hệ thống"
        sub={<>Bất biến · lưu 7 năm theo quy định · <b style={{fontFamily:'var(--font-mono)', color:'var(--ink)'}}>{data.length.toLocaleString()}</b> sự kiện 24h</>}
        right={<>
          <button className="btn"><Icon name="download" size={14}/> Xuất CSV</button>
          <button className="btn"><Icon name="shield" size={14}/> Báo cáo tuân thủ</button>
        </>}
      />

      <div className="row r-1-1" style={{marginBottom:14}}>
        <div className="card">
          <div className="card-h">
            <h3>Hoạt động theo loại — 24h</h3>
            <div className="spacer"/>
          </div>
          <BarChart height={200} data={
            AUDIT_ACTIONS.filter(a => counts[a]).map(a => ({ label: a, value: counts[a] + Math.floor(Math.random()*40) }))
          }/>
        </div>
        <div className="card">
          <div className="card-h">
            <h3>Sự kiện đáng chú ý</h3>
            <div className="spacer"/>
            <span className="tag err"><span className="dot"/>3 cần xem</span>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {[
              { lv:'err',  t:'Truy cập bị từ chối: linh.nguyen → dl_nckh.tbl_nc_du_lieu_tn', sub:'10.27.6.21 · 13:48' },
              { lv:'warn', t:'Export khối lượng lớn: trung.dao xuất 8.4 GB', sub:'10.27.4.42 · 12:14' },
              { lv:'warn', t:'Cấp quyền mới: SYSADMIN → nam.bui', sub:'admin.bigdata · 11:02' },
              { lv:'info', t:'Cấu hình thay đổi: tăng RAM Spark worker từ 64 → 96GB', sub:'minh.tran · 09:30' },
            ].map((e, i) => (
              <div key={i} style={{display:'flex', gap:10, padding:'10px 12px', background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8, alignItems:'flex-start'}}>
                <span className={"sd " + e.lv} style={{marginTop:6}}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, color:'var(--ink)', fontWeight:500}}>{e.t}</div>
                  <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2, fontFamily:'var(--font-mono)'}}>{e.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toolbar search={search} setSearch={setSearch}
               chips={actions} active={active} setActive={setActive}
               placeholder="Lọc theo user, đối tượng, IP…"
               right={<>
                 <button className="btn sm"><Icon name="clock" size={12}/> 24 giờ qua</button>
                 <button className="btn sm"><Icon name="filter" size={12}/> Bộ lọc nâng cao</button>
               </>}/>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:120}}>Thời điểm</th>
              <th style={{width:100}}>Hành động</th>
              <th>Người dùng</th>
              <th>Đối tượng</th>
              <th>IP</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 20).map(l => (
              <tr key={l.id}>
                <td style={{fontFamily:'var(--font-mono)', fontSize:12}}><b>{l.t}</b><div style={{color:'var(--ink-3)', fontSize:10.5}}>{l.d}</div></td>
                <td><span className="tag mute" style={{fontFamily:'var(--font-mono)'}}>{l.action}</span></td>
                <td><b>{l.user}</b></td>
                <td style={{fontFamily:'var(--font-mono)', fontSize:12}}>{l.target}</td>
                <td style={{fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-3)'}}>{l.ip}</td>
                <td>
                  {l.result === 'SUCCESS' && <span className="tag ok"><span className="dot"/>OK</span>}
                  {l.result === 'DENIED' && <span className="tag err"><span className="dot"/>DENIED</span>}
                  {l.result === 'FAILED' && <span className="tag warn"><span className="dot"/>FAILED</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============================================================
   7. SECURITY
   ============================================================ */
const SecurityScreen = () => {
  return (
    <div data-screen-label="An ninh bảo mật">
      <PageHead
        crumb={['Quản trị', 'An ninh / Bảo mật']}
        title="An ninh / Bảo mật"
        sub={<><span className="tag ok"><span className="dot"/> Trạng thái: BÌNH THƯỜNG</span><span style={{marginLeft:10}}>Tuân thủ TCVN · Đánh giá cuối: 28/05/2026</span></>}
        right={<>
          <button className="btn"><Icon name="download" size={14}/> Báo cáo bảo mật</button>
          <button className="btn primary"><Icon name="shield" size={14}/> Quét bảo mật</button>
        </>}
      />

      {/* Top KPIs */}
      <div className="kpi-grid">
        <KPI accent="ok"   label="Điểm an ninh" value="94" unit="/100" delta="+2" deltaDir="up" sub="cao hơn tuần trước"/>
        <KPI accent=""     label="Đăng nhập thất bại 24h" value="7" sub="trong ngưỡng an toàn"/>
        <KPI accent="gold" label="Tài khoản chưa MFA" value="2" sub="cần xử lý sớm"/>
        <KPI accent="info" label="Phiên đang mở" value="87" sub="thiết bị đã định danh"/>
      </div>

      <div className="row r-1-1">
        <div className="card">
          <div className="card-h"><h3>Tuân thủ chính sách</h3><div className="spacer"/></div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              { t:'Mã hóa dữ liệu ở rest (AES-256)', s:'ok', d:'Tất cả khối lưu trữ' },
              { t:'Mã hóa truyền dẫn (TLS 1.3 + mTLS)', s:'ok', d:'100% kết nối' },
              { t:'Xác thực 2 lớp (TOTP/FIDO2)', s:'warn', d:'97.6% tài khoản đã bật — 2 chưa bật' },
              { t:'Backup chéo 2 site', s:'ok', d:'RPO 18s · RTO 4 phút' },
              { t:'Audit log bất biến', s:'ok', d:'Lưu 7 năm, hash chained' },
              { t:'Phân vùng mạng theo cấp mật', s:'ok', d:'VLAN tách biệt MẬT/HÀNH CHÍNH' },
              { t:'Quét lỗ hổng định kỳ', s:'ok', d:'Lần cuối 28/05 — 0 critical, 3 medium' },
              { t:'Đào tạo nhận thức an ninh', s:'warn', d:'82% cán bộ đã hoàn thành Q2/2026' },
            ].map((c, i) => (
              <div key={i} style={{display:'flex', gap:12, padding:'10px 12px', background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8, alignItems:'center'}}>
                <span className={"sd " + (c.s === 'ok' ? 'ok' : c.s === 'warn' ? 'warn' : 'err')}/>
                <div style={{flex:1, minWidth:0}}>
                  <b style={{fontSize:13}}>{c.t}</b>
                  <div style={{fontSize:11.5, color:'var(--ink-3)'}}>{c.d}</div>
                </div>
                {c.s === 'ok' ? <Icon name="check" size={16} stroke={3}/> : <span style={{color:'var(--warn)'}}><Icon name="bell" size={14}/></span>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Sự kiện an ninh 7 ngày</h3><div className="spacer"/></div>
          <LineChart height={200} labels={['T2','T3','T4','T5','T6','T7','CN']}
            series={[
              { name:'Login fails', color:'var(--err)',  data:[12, 9, 14, 8, 7, 4, 3] },
              { name:'IP lạ',       color:'var(--warn)', data:[5, 7, 3, 6, 4, 2, 1] },
              { name:'Anomaly',     color:'var(--info)', data:[2, 1, 3, 0, 2, 1, 0] },
            ]}/>

          <div className="divider"/>

          <h4 style={{margin:'0 0 10px', fontSize:13}}>IP truy cập bất thường gần đây</h4>
          <table className="tbl">
            <thead><tr><th>IP</th><th>Vị trí</th><th>Thử</th><th>Trạng thái</th></tr></thead>
            <tbody>
              <tr><td style={{fontFamily:'var(--font-mono)'}}>118.69.42.18</td><td>External</td><td className="num">14</td><td><span className="tag err">BLOCK</span></td></tr>
              <tr><td style={{fontFamily:'var(--font-mono)'}}>10.27.99.4</td><td>Subnet lạ</td><td className="num">8</td><td><span className="tag warn">Theo dõi</span></td></tr>
              <tr><td style={{fontFamily:'var(--font-mono)'}}>192.168.4.211</td><td>VPN ngoài</td><td className="num">3</td><td><span className="tag info">OK (whitelisted)</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><h3>Phân loại dữ liệu theo cấp mật</h3><div className="spacer"/><span className="sub">tổng 248.4 TB</span></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
          {[
            { label:'TUYỆT MẬT',  size:'18.4 TB', count:'42 dataset', c:'var(--err)',          icon:'lock' },
            { label:'MẬT',         size:'68.2 TB', count:'184 dataset', c:'var(--brand-red)',  icon:'shield' },
            { label:'HẠN CHẾ',     size:'82.1 TB', count:'412 dataset', c:'var(--warn)',       icon:'eye' },
            { label:'CÔNG KHAI',   size:'79.7 TB', count:'1.209 dataset', c:'var(--ok)',       icon:'check' },
          ].map((p) => (
            <div key={p.label} style={{padding:'16px 18px', borderRadius:8, border:`1px solid color-mix(in oklab, ${p.c} 30%, var(--line))`,
                                       background:`color-mix(in oklab, ${p.c} 6%, var(--panel))`}}>
              <div style={{display:'flex', alignItems:'center', gap:8, color: p.c, fontWeight:700, fontSize:12, letterSpacing:'0.08em'}}>
                <Icon name={p.icon} size={14}/> {p.label}
              </div>
              <div style={{fontFamily:'var(--font-serif)', fontSize:22, fontWeight:600, marginTop:6, fontVariantNumeric:'tabular-nums'}}>{p.size}</div>
              <div style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>{p.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ReportsScreen, UsersScreen, MonitorScreen, AuditScreen, SecurityScreen, ROLE_INFO });
