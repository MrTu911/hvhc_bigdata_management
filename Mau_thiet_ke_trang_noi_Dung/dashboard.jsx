/* ============================================================
   Dashboard Screen
   ============================================================ */

const DOMAIN_COLORS = {
  'Nghiên cứu khoa học':  'var(--brand-red)',
  'Giáo dục đào tạo':     'var(--brand-gold)',
  'Quản lý cán bộ':       'var(--info)',
  'Quản lý quân nhân':    'var(--ok)',
  'Hậu cần kỹ thuật':     '#8B5A2B',
  'Khác':                 'var(--ink-mute)',
};

const seedRandom = (seed) => {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};

const generateLineData = (n, base, vol, seed) => {
  const r = seedRandom(seed);
  let v = base;
  const out = [];
  for (let i = 0; i < n; i++) {
    v += (r() - 0.45) * vol;
    v = Math.max(base * 0.4, v);
    out.push(Math.round(v));
  }
  return out;
};

const generateHeatData = () => {
  const r = seedRandom(42);
  const days = [];
  for (let d = 0; d < 7; d++) {
    const row = [];
    for (let h = 0; h < 24; h++) {
      // Working hours load
      const isWorking = h >= 7 && h <= 18;
      const isLunch = h >= 11 && h <= 13;
      const isWeekend = d >= 5;
      let v = isWorking ? (isLunch ? 0.4 : 0.7) : 0.08;
      if (isWeekend) v *= 0.4;
      v += (r() - 0.5) * 0.25;
      row.push(Math.max(0, Math.min(1, v)));
    }
    days.push(row);
  }
  return days;
};

const Dashboard = () => {
  const [tab, setTab] = React.useState('7d');
  const [activeRegion, setActiveRegion] = React.useState('qk1');
  const [stream, setStream] = React.useState(() => [
    { id: 1, t: '14:32:08', lv: 'OK', msg: 'ETL_QUAN_NHAN_DAILY: 248,191 rows merged into wh_qn_master (3.2s)' },
    { id: 2, t: '14:32:05', lv: 'I',  msg: 'Query #q8a7f from user trung.dao executed on ds_canbo (47ms)' },
    { id: 3, t: '14:32:01', lv: 'I',  msg: 'Snapshot dl_research_2025q2 published — 12.4 TB · checksum verified' },
    { id: 4, t: '14:31:55', lv: 'W',  msg: 'Slow query detected: SELECT * FROM ds_dao_tao.lich_su_diem (8.7s)' },
    { id: 5, t: '14:31:48', lv: 'OK', msg: 'Spark job spark_ds_aggregate_004 completed: 8/8 stages' },
    { id: 6, t: '14:31:40', lv: 'I',  msg: 'Kafka topic events.dao_tao consumed: 12,884 msgs in last min' },
    { id: 7, t: '14:31:32', lv: 'E',  msg: 'Pipeline pl_external_sync failed at extract step — retry scheduled' },
    { id: 8, t: '14:31:25', lv: 'I',  msg: 'User le.minh authenticated via mTLS from 10.27.4.108' },
  ]);

  // Tick stream every 2s
  React.useEffect(() => {
    const id = setInterval(() => {
      const samples = [
        { lv: 'I',  msg: 'Query executed on dataset ds_nckh_papers (32ms · 1,204 rows)' },
        { lv: 'OK', msg: 'Compaction completed on partition wh_canbo/2025-06 (412 MB reclaimed)' },
        { lv: 'I',  msg: 'Snapshot replication to DR-site finished — RPO 18s' },
        { lv: 'W',  msg: 'Cache hit ratio dropped to 71.2% on hot-node hd-04' },
        { lv: 'I',  msg: 'New ingestion batch from dao_tao: 4,219 records · 2.1 MB' },
        { lv: 'OK', msg: 'Hive metastore backup completed (size 184 MB)' },
        { lv: 'I',  msg: 'Trino worker registered: node-trino-09 · 32 vCPU · 128GB RAM' },
      ];
      const pick = samples[Math.floor(Math.random() * samples.length)];
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      setStream(s => [{ id: Date.now(), t, ...pick }, ...s].slice(0, 9));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const heatData = React.useMemo(() => generateHeatData(), []);

  // Line data: ingestion (TB) + queries (k) over 30 days
  const days = Array.from({length: 30}, (_, i) => `${(i+1).toString().padStart(2,'0')}/05`);
  const ingestionSeries = generateLineData(30, 8200, 1400, 17);
  const querySeries     = generateLineData(30, 48000, 9000, 31);

  // Bar: top datasets by storage (TB)
  const topDatasets = [
    { label: 'wh_quannhan', sub: 'warehouse', value: 38.4, unit: 'TB' },
    { label: 'dl_nckh',     sub: 'data lake', value: 31.7, unit: 'TB' },
    { label: 'wh_dao_tao',  sub: 'warehouse', value: 24.2, unit: 'TB' },
    { label: 'ds_canbo',    sub: 'OLTP',      value: 18.6, unit: 'TB' },
    { label: 'logs_audit',  sub: 'cold',      value: 14.1, unit: 'TB' },
    { label: 'ds_taichinh', sub: 'OLTP',      value: 9.8,  unit: 'TB' },
    { label: 'archive_2024',sub: 'cold',      value: 8.4,  unit: 'TB' },
  ];

  // Donut: storage by domain
  const domainData = [
    { label: 'Nghiên cứu khoa học', value: 84, color: DOMAIN_COLORS['Nghiên cứu khoa học'] },
    { label: 'Quản lý quân nhân',   value: 62, color: DOMAIN_COLORS['Quản lý quân nhân'] },
    { label: 'Giáo dục đào tạo',    value: 48, color: DOMAIN_COLORS['Giáo dục đào tạo'] },
    { label: 'Quản lý cán bộ',      value: 32, color: DOMAIN_COLORS['Quản lý cán bộ'] },
    { label: 'Hậu cần kỹ thuật',    value: 14, color: DOMAIN_COLORS['Hậu cần kỹ thuật'] },
    { label: 'Khác',                value:  8, color: DOMAIN_COLORS['Khác'] },
  ];

  // VN region data
  const regionData = {
    qk1: 18.4e6, qk2: 12.1e6, qk3: 34.7e6, qk4: 21.5e6,
    qk5: 16.8e6, qk7: 28.3e6, qk9: 14.2e6
  };

  return (
    <div data-screen-label="Dashboard">
      <div className="page-head">
        <div>
          <div className="breadcrumb">Khai thác dữ liệu <span>›</span> <b>Tổng quan</b></div>
          <h1>Dashboard điều hành</h1>
          <div style={{fontSize:13, color:'var(--ink-3)', marginTop:2}}>
            Cập nhật lúc <span style={{fontFamily:'var(--font-mono)', color:'var(--ink-2)'}}>14:32:08 · 06/06/2026</span>
            <span style={{margin:'0 8px'}}>·</span>
            <span className="tag ok"><span className="dot"/> Realtime</span>
          </div>
        </div>
        <div className="ph-side">
          <div style={{display:'flex', background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--r)', padding:2}}>
            {['24h', '7d', '30d', '90d'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                      className={"btn sm" + (tab === t ? " primary" : "")}
                      style={{border:0, background: tab===t? 'var(--brand-red)':'transparent', padding:'5px 12px'}}>
                {t}
              </button>
            ))}
          </div>
          <button className="btn"><Icon name="download" size={14}/> Xuất báo cáo</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Tạo dataset</button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="kpi-grid">
        <KPI accent="" label="Tổng dung lượng"
             value="248.4" unit="TB"
             delta="+4.2 TB" deltaDir="up" sub="vs 7 ngày trước"
             spark={ingestionSeries.slice(-12)} sparkColor="var(--brand-red)"/>
        <KPI accent="gold" label="Bản ghi quản lý"
             value="1.84" unit="tỷ"
             delta="+12.7M" deltaDir="up" sub="trong 7 ngày"
             spark={querySeries.slice(-12)} sparkColor="var(--brand-gold)"/>
        <KPI accent="info" label="Truy vấn / ngày"
             value="58.2" unit="k"
             delta="+3.1%" deltaDir="up" sub="247 ms trung bình"
             spark={generateLineData(12, 50000, 8000, 5)} sparkColor="var(--info)"/>
        <KPI accent="ok" label="Người dùng hoạt động"
             value="412" unit=""
             delta="−14" deltaDir="down" sub="đang đăng nhập 87"
             spark={generateLineData(12, 400, 60, 9)} sparkColor="var(--ok)"/>
      </div>

      {/* Main row */}
      <div className="row r-2-1">
        <div className="card">
          <div className="card-h">
            <h3>Lượng dữ liệu nạp & truy vấn theo ngày</h3>
            <div className="legend">
              <span className="lg-item"><span className="sw" style={{background:'var(--brand-red)'}}/>Dữ liệu nạp (GB)</span>
              <span className="lg-item"><span className="sw" style={{background:'var(--brand-gold)'}}/>Truy vấn</span>
            </div>
            <div className="spacer"/>
            <span className="tag mute">30 ngày gần nhất</span>
          </div>
          <LineChart
            labels={days}
            height={240}
            series={[
              { name: 'Dữ liệu nạp (GB)', color: 'var(--brand-red)', data: ingestionSeries },
              { name: 'Truy vấn',          color: 'var(--brand-gold)', data: querySeries },
            ]}/>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Phân bố theo lĩnh vực</h3>
            <div className="spacer"/>
            <span className="sub">TB</span>
          </div>
          <Donut data={domainData}/>
        </div>
      </div>

      {/* Map + Bar */}
      <div className="row r-1-2">
        <div className="card">
          <div className="card-h">
            <h3>Phân bố dữ liệu theo Quân khu</h3>
            <div className="spacer"/>
            <span className="sub">bản ghi</span>
          </div>
          <VNMap data={regionData} active={activeRegion} onSelect={setActiveRegion}/>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Top dataset theo dung lượng</h3>
            <div className="spacer"/>
            <button className="btn sm">Xem tất cả</button>
          </div>
          <BarChart data={topDatasets} height={240}/>

          <div style={{marginTop:14}}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Truy vấn chạy lâu nhất hôm nay</th>
                  <th style={{width:120}}>Người dùng</th>
                  <th style={{width:80, textAlign:'right'}}>Thời gian</th>
                  <th style={{width:60}}></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="src-icon">SQL</span><b>SELECT * FROM wh_quannhan JOIN ...</b></td>
                  <td>trung.dao</td>
                  <td className="num">12.4s</td>
                  <td><span className="tag warn"><span className="dot"/>chậm</span></td>
                </tr>
                <tr>
                  <td><span className="src-icon">SQL</span><b>SELECT COUNT(*) FROM dl_nckh.papers WHERE ...</b></td>
                  <td>linh.nguyen</td>
                  <td className="num">8.7s</td>
                  <td><span className="tag warn"><span className="dot"/>chậm</span></td>
                </tr>
                <tr>
                  <td><span className="src-icon">SQL</span><b>WITH t AS (SELECT khoa, COUNT(...) FROM ...)</b></td>
                  <td>hung.le</td>
                  <td className="num">5.2s</td>
                  <td><span className="tag info"><span className="dot"/>bt</span></td>
                </tr>
                <tr>
                  <td><span className="src-icon">SQL</span><b>SELECT student_id, AVG(diem) FROM ds_dao_tao...</b></td>
                  <td>minh.tran</td>
                  <td className="num">3.9s</td>
                  <td><span className="tag info"><span className="dot"/>bt</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Heatmap + Stream */}
      <div className="row r-1-1">
        <div className="card">
          <div className="card-h">
            <h3>Cường độ truy cập theo giờ</h3>
            <div className="legend" style={{fontSize:11}}>
              <span style={{color:'var(--ink-3)'}}>Thấp</span>
              {[0,1,2,3,4,5].map(l => (
                <div key={l} className={"hm-cell " + (l>0?"l"+l:"")} style={{width:12, height:12, borderRadius:2}}/>
              ))}
              <span style={{color:'var(--ink-3)'}}>Cao</span>
            </div>
            <div className="spacer"/>
            <span className="sub">7 ngày · 24h</span>
          </div>
          <Heatmap data={heatData}/>
          <div style={{marginTop:14, fontSize:12, color:'var(--ink-3)', display:'flex', gap:14}}>
            <span><b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>09:00–11:00</b> · Giờ cao điểm</span>
            <span><b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>14:00–16:30</b> · Giờ cao điểm</span>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Hoạt động hệ thống — thời gian thực</h3>
            <span className="tag ok"><span className="dot"/> Live</span>
            <div className="spacer"/>
            <button className="btn sm"><Icon name="filter" size={12}/> Lọc</button>
          </div>
          <RealtimeStream lines={stream}/>
        </div>
      </div>

      {/* Bottom: Pipelines + Security */}
      <div className="row r-1-1">
        <div className="card">
          <div className="card-h">
            <h3>Pipeline đang chạy</h3>
            <span className="tag info">3 active</span>
            <div className="spacer"/>
            <button className="btn sm">Quản lý</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              { name: 'etl_quannhan_daily', stage: 'Transform', progress: 72, eta: '3m 12s', tag: 'ok' },
              { name: 'sync_dao_tao_realtime', stage: 'Load', progress: 94, eta: '24s', tag: 'ok' },
              { name: 'aggregate_nckh_monthly', stage: 'Extract', progress: 31, eta: '11m 40s', tag: 'info' },
            ].map(p => (
              <div key={p.name} style={{padding:'10px 12px', background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8}}>
                <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
                  <Icon name="flow" size={14}/>
                  <b style={{fontFamily:'var(--font-mono)', fontSize:12.5}}>{p.name}</b>
                  <span className={"tag " + p.tag} style={{fontSize:10}}>{p.stage}</span>
                  <span style={{marginLeft:'auto', fontSize:11, color:'var(--ink-3)', fontFamily:'var(--font-mono)'}}>{p.progress}% · còn {p.eta}</span>
                </div>
                <div style={{height:5, background:'var(--bg-sub)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{height:'100%', width:p.progress+'%', background:'var(--brand-red)', borderRadius:3, transition:'width 0.3s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>An ninh hệ thống — 24h</h3>
            <span className="tag ok"><span className="dot"/> Bình thường</span>
            <div className="spacer"/>
            <button className="btn sm">Báo cáo bảo mật</button>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            {[
              { lv:'ok',  n:'412', l:'Đăng nhập thành công' },
              { lv:'err', n:'7',   l:'Đăng nhập thất bại' },
              { lv:'warn',n:'3',   l:'Truy cập từ IP lạ (block)' },
              { lv:'info',n:'1,284', l:'Yêu cầu kiểm tra quyền' },
            ].map(it => (
              <div key={it.l} style={{padding:14, background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8}}>
                <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink-3)', fontWeight:600}}>
                  <span className={"sd " + it.lv}/>{it.l}
                </div>
                <div style={{fontFamily:'var(--font-serif)', fontSize:24, fontWeight:600, marginTop:4, fontVariantNumeric:'tabular-nums'}}>{it.n}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14, padding:'10px 12px', border:'1px solid var(--line-soft)', borderRadius:8, fontSize:12, color:'var(--ink-2)'}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, color:'var(--ok)', fontWeight:600}}>
              <Icon name="shield" size={14}/> Tuân thủ chính sách bảo mật cấp Quân đội
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:11.5}}>
              <span>● Mã hóa dữ liệu AES-256</span>
              <span>● Xác thực 2 lớp (TOTP/FIDO2)</span>
              <span>● Audit log bất biến</span>
              <span>● Backup chéo 2 site</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

Object.assign(window, { Dashboard, DOMAIN_COLORS });
