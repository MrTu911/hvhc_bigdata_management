/* ============================================================
   Data Sources Module
   ============================================================ */

const DATA_SOURCES = [
  {
    id: 'wh_quannhan', name: 'wh_quannhan',
    title: 'Kho dữ liệu Quân nhân',
    type: 'warehouse', engine: 'Hive', icon: 'QN', iconColor: '',
    status: 'ok', records: 218400000, size: '38.4 TB',
    tables: 142, owner: 'P. Quân lực',
    updated: '14:28 hôm nay',
    health: 96,
    domain: 'Quản lý quân nhân',
    desc: 'Tổng hợp dữ liệu nhân thân, lý lịch, biên chế quân nhân trên toàn Học viện và các đơn vị trực thuộc.',
  },
  {
    id: 'dl_nckh', name: 'dl_nckh',
    title: 'Hồ dữ liệu Nghiên cứu KH',
    type: 'data lake', engine: 'Spark + S3', icon: 'NC', iconColor: 'gold',
    status: 'ok', records: 1284000000, size: '31.7 TB',
    tables: 87, owner: 'P. KHCN',
    updated: '12 phút trước',
    health: 92,
    domain: 'Nghiên cứu khoa học',
    desc: 'Tài liệu, công trình, bài báo, dữ liệu thực nghiệm phục vụ công tác nghiên cứu khoa học.',
  },
  {
    id: 'wh_dao_tao', name: 'wh_dao_tao',
    title: 'Kho dữ liệu Giáo dục Đào tạo',
    type: 'warehouse', engine: 'Trino', icon: 'ĐT', iconColor: 'info',
    status: 'ok', records: 78200000, size: '24.2 TB',
    tables: 96, owner: 'P. Đào tạo',
    updated: '03:00 hôm nay',
    health: 98,
    domain: 'Giáo dục đào tạo',
    desc: 'Điểm số, lịch học, chương trình, kết quả học tập và đào tạo của học viên qua các năm.',
  },
  {
    id: 'ds_canbo', name: 'ds_canbo',
    title: 'CSDL Quản lý Cán bộ',
    type: 'OLTP', engine: 'PostgreSQL', icon: 'CB', iconColor: 'ok',
    status: 'ok', records: 12400, size: '18.6 TB',
    tables: 58, owner: 'P. Cán bộ',
    updated: 'real-time',
    health: 99,
    domain: 'Quản lý cán bộ',
    desc: 'Hồ sơ cán bộ, lịch sử công tác, quá trình đào tạo, đánh giá và bổ nhiệm.',
  },
  {
    id: 'logs_audit', name: 'logs_audit',
    title: 'Nhật ký Audit dài hạn',
    type: 'cold storage', engine: 'HDFS', icon: 'AU', iconColor: '',
    status: 'warn', records: 4280000000, size: '14.1 TB',
    tables: 12, owner: 'TT. CNTT',
    updated: '08:00 hôm nay',
    health: 78,
    domain: 'Hậu cần kỹ thuật',
    desc: 'Lưu trữ bất biến mọi hoạt động truy cập dữ liệu phục vụ kiểm toán theo Luật.',
  },
  {
    id: 'ds_taichinh', name: 'ds_taichinh',
    title: 'CSDL Tài chính Hậu cần',
    type: 'OLTP', engine: 'PostgreSQL', icon: 'TC', iconColor: 'gold',
    status: 'ok', records: 8900000, size: '9.8 TB',
    tables: 42, owner: 'P. Tài chính',
    updated: '15 phút trước',
    health: 94,
    domain: 'Hậu cần kỹ thuật',
    desc: 'Dữ liệu tài chính, chi tiêu, ngân sách hậu cần phục vụ Học viện và đơn vị trực thuộc.',
  },
  {
    id: 'archive_2024', name: 'archive_2024',
    title: 'Lưu trữ năm 2024',
    type: 'cold storage', engine: 'HDFS', icon: 'AR', iconColor: '',
    status: 'ok', records: 942000000, size: '8.4 TB',
    tables: 218, owner: 'TT. Lưu trữ',
    updated: '01/01/2025',
    health: 100,
    domain: 'Khác',
    desc: 'Bản lưu trữ dữ liệu năm 2024 — chỉ đọc, đã đóng băng theo quy định.',
  },
  {
    id: 'rt_kafka', name: 'rt_kafka',
    title: 'Stream sự kiện thời gian thực',
    type: 'stream', engine: 'Kafka', icon: 'RT', iconColor: 'info',
    status: 'ok', records: 0, size: '— (24h)',
    tables: 18, owner: 'TT. CNTT',
    updated: 'live',
    health: 95,
    domain: 'Hậu cần kỹ thuật',
    desc: 'Bus sự kiện thời gian thực phục vụ pipeline ETL và giám sát.',
  },
];

const TYPE_FILTERS = ['Tất cả', 'warehouse', 'data lake', 'OLTP', 'stream', 'cold storage'];
const DOMAIN_FILTERS = ['Tất cả lĩnh vực', 'Nghiên cứu khoa học', 'Giáo dục đào tạo', 'Quản lý cán bộ', 'Quản lý quân nhân', 'Hậu cần kỹ thuật'];

const DataSourcesScreen = () => {
  const [view, setView] = React.useState('grid');
  const [query, setQuery] = React.useState('');
  const [typeF, setTypeF] = React.useState('Tất cả');
  const [domainF, setDomainF] = React.useState('Tất cả lĩnh vực');
  const [open, setOpen] = React.useState(null);

  const filtered = DATA_SOURCES.filter(d =>
    (typeF === 'Tất cả' || d.type === typeF) &&
    (domainF === 'Tất cả lĩnh vực' || d.domain === domainF) &&
    (query === '' || (d.name + d.title + d.desc).toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div data-screen-label="Nguồn dữ liệu">
      <div className="page-head">
        <div>
          <div className="breadcrumb">Khai thác dữ liệu <span>›</span> <b>Nguồn dữ liệu</b></div>
          <h1>Nguồn dữ liệu</h1>
          <div style={{fontSize:13, color:'var(--ink-3)', marginTop:2}}>
            <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>{filtered.length}</b> / {DATA_SOURCES.length} nguồn ·
            tổng <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>248.4 TB</b> ·
            kết nối <b style={{color:'var(--ok)'}}>ổn định</b>
          </div>
        </div>
        <div className="ph-side">
          <button className="btn"><Icon name="upload" size={14}/> Import</button>
          <button className="btn"><Icon name="refresh" size={14}/> Đồng bộ</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Kết nối nguồn mới</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <span className="ic"><Icon name="search" size={14}/></span>
          <input className="input" placeholder="Tìm nguồn dữ liệu, mô tả, owner…"
                 value={query} onChange={(e) => setQuery(e.target.value)}/>
        </div>
        {TYPE_FILTERS.map(t => (
          <button key={t} className={"chip" + (typeF === t ? " active" : "")} onClick={() => setTypeF(t)}>
            {t}
          </button>
        ))}
        <span style={{width:1, height:24, background:'var(--line)', margin:'0 6px'}}/>
        <select className="chip" style={{paddingRight:24, appearance:'menulist'}}
                value={domainF} onChange={(e) => setDomainF(e.target.value)}>
          {DOMAIN_FILTERS.map(d => <option key={d}>{d}</option>)}
        </select>
        <div style={{marginLeft:'auto', display:'flex', gap:0, background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--r)', padding:2}}>
          <button onClick={() => setView('grid')}
                  style={{padding:'6px 10px', borderRadius:5, background: view==='grid'?'var(--brand-red)':'transparent', color: view==='grid'?'#FBF7EC':'var(--ink-2)'}}>
            <Icon name="dashboard" size={14}/>
          </button>
          <button onClick={() => setView('list')}
                  style={{padding:'6px 10px', borderRadius:5, background: view==='list'?'var(--brand-red)':'transparent', color: view==='list'?'#FBF7EC':'var(--ink-2)'}}>
            <Icon name="log" size={14}/>
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="ds-grid">
          {filtered.map(ds => (
            <div key={ds.id} className="ds-card" onClick={() => setOpen(ds)}>
              <div className="ds-head">
                <div className={"ds-ic " + ds.iconColor}>{ds.icon}</div>
                <div style={{flex:1, minWidth:0}}>
                  <h4>{ds.title}</h4>
                  <div className="ds-sub">{ds.name} · {ds.engine}</div>
                </div>
                <span className={"tag " + (ds.status === 'ok' ? 'ok' : ds.status === 'warn' ? 'warn' : 'err')}>
                  <span className="dot"/>{ds.status === 'ok' ? 'ổn định' : ds.status === 'warn' ? 'cảnh báo' : 'lỗi'}
                </span>
              </div>
              <p style={{fontSize:12, color:'var(--ink-3)', margin:'0 0 4px', lineHeight:1.45, height:33, overflow:'hidden'}}>
                {ds.desc}
              </p>
              <div className="ds-stats">
                <div className="ds-stat">
                  <b>{ds.size}</b>
                  <span>Dung lượng</span>
                </div>
                <div className="ds-stat">
                  <b>{formatShort(ds.records)}</b>
                  <span>Bản ghi</span>
                </div>
                <div className="ds-stat">
                  <b>{ds.tables}</b>
                  <span>Bảng / Topic</span>
                </div>
              </div>
              <div className="ds-foot">
                <span className="tag mute">{ds.type}</span>
                <span style={{marginLeft:'auto'}}>{ds.updated}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Nguồn</th>
                <th>Loại</th>
                <th>Lĩnh vực</th>
                <th>Owner</th>
                <th style={{textAlign:'right'}}>Dung lượng</th>
                <th style={{textAlign:'right'}}>Bản ghi</th>
                <th>Health</th>
                <th>Trạng thái</th>
                <th style={{width:40}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ds => (
                <tr key={ds.id} onClick={() => setOpen(ds)} style={{cursor:'pointer'}}>
                  <td>
                    <span className="src-icon">{ds.icon}</span>
                    <span><b>{ds.title}</b><div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-3)'}}>{ds.name}</div></span>
                  </td>
                  <td><span className="tag mute">{ds.type}</span></td>
                  <td>{ds.domain}</td>
                  <td>{ds.owner}</td>
                  <td className="num">{ds.size}</td>
                  <td className="num">{formatShort(ds.records)}</td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:8, minWidth:120}}>
                      <div style={{flex:1, height:5, background:'var(--bg-sub)', borderRadius:3, overflow:'hidden'}}>
                        <div style={{height:'100%', width: ds.health+'%',
                          background: ds.health>=90?'var(--ok)':ds.health>=70?'var(--warn)':'var(--err)'}}/>
                      </div>
                      <span style={{fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, minWidth:30}}>{ds.health}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={"tag " + (ds.status === 'ok' ? 'ok' : ds.status === 'warn' ? 'warn' : 'err')}>
                      <span className="dot"/>{ds.status === 'ok' ? 'ổn định' : ds.status === 'warn' ? 'cảnh báo' : 'lỗi'}
                    </span>
                  </td>
                  <td><button className="btn icon sm" onClick={(e) => {e.stopPropagation(); setOpen(ds);}}><Icon name="moreH" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <DataSourceModal source={open} onClose={() => setOpen(null)}/>}
    </div>
  );
};

/* ---------- Modal: Data Source Detail ---------- */
const DataSourceModal = ({ source, onClose }) => {
  const [tab, setTab] = React.useState('overview');
  const usageData = React.useMemo(() => generateLineData(30, 320, 80, source.id.length * 7), [source.id]);
  const days = Array.from({length: 30}, (_, i) => `${(i+1).toString().padStart(2,'0')}/05`);

  const schema = [
    { k: 'PK', n: 'id',              t: 'BIGINT',       x: 'NOT NULL' },
    { k: '',   n: 'ma_quan_nhan',    t: 'VARCHAR(20)',  x: 'UNIQUE' },
    { k: '',   n: 'ho_ten',          t: 'VARCHAR(150)', x: 'NOT NULL' },
    { k: '',   n: 'ngay_sinh',       t: 'DATE',         x: '' },
    { k: 'FK', n: 'don_vi_id',       t: 'INT',          x: 'INDEXED' },
    { k: '',   n: 'cap_bac_hien_tai',t: 'VARCHAR(50)',  x: '' },
    { k: '',   n: 'chuc_vu',         t: 'VARCHAR(120)', x: '' },
    { k: '',   n: 'nguon_du_lieu',   t: 'VARCHAR(80)',  x: 'INDEXED' },
    { k: '',   n: 'created_at',      t: 'TIMESTAMP',    x: 'NOT NULL' },
    { k: '',   n: 'updated_at',      t: 'TIMESTAMP',    x: '' },
    { k: '',   n: 'data_hash',       t: 'CHAR(64)',     x: 'SHA-256' },
  ];

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className={"ds-ic " + source.iconColor} style={{width:42, height:42, fontSize:14}}>{source.icon}</div>
          <div>
            <h3>{source.title}</h3>
            <div style={{fontSize:12, fontFamily:'var(--font-mono)', color:'var(--ink-3)'}}>
              {source.name} · {source.engine} · owner {source.owner}
            </div>
          </div>
          <button className="x" onClick={onClose}><Icon name="x"/></button>
        </div>

        <div className="modal-body">
          <div className="tabs">
            {['overview', 'schema', 'usage', 'access', 'lineage'].map(t => (
              <div key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
                {{overview:'Tổng quan', schema:'Cấu trúc', usage:'Sử dụng', access:'Phân quyền', lineage:'Truy nguyên'}[t]}
              </div>
            ))}
          </div>

          {tab === 'overview' && (
            <div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18}}>
                {[
                  ['Dung lượng', source.size],
                  ['Bản ghi', formatShort(source.records)],
                  ['Bảng / Topic', source.tables],
                  ['Health', source.health + '%'],
                ].map(([l, v]) => (
                  <div key={l} style={{padding:14, background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8}}>
                    <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--ink-3)', fontWeight:600}}>{l}</div>
                    <div style={{fontFamily:'var(--font-serif)', fontSize:22, fontWeight:600, marginTop:4, fontVariantNumeric:'tabular-nums'}}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{marginBottom:18}}>
                <h4 style={{margin:'0 0 8px', fontSize:12, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--ink-3)', fontWeight:600}}>Mô tả</h4>
                <p style={{fontSize:13.5, lineHeight:1.6, color:'var(--ink-2)', margin:0}}>{source.desc}</p>
              </div>

              <div>
                <h4 style={{margin:'0 0 8px', fontSize:12, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--ink-3)', fontWeight:600}}>Pipeline nạp dữ liệu</h4>
                <div className="pipeline">
                  <div className="node"><div className="nt">Source</div><b>OLTP {source.engine}</b></div>
                  <span className="arrow">→</span>
                  <div className="node"><div className="nt">Extract</div><b>Debezium CDC</b></div>
                  <span className="arrow">→</span>
                  <div className="node"><div className="nt">Stream</div><b>Kafka topic</b></div>
                  <span className="arrow">→</span>
                  <div className="node"><div className="nt">Transform</div><b>Spark Structured</b></div>
                  <span className="arrow">→</span>
                  <div className="node"><div className="nt">Sink</div><b>{source.name}</b></div>
                </div>
              </div>
            </div>
          )}

          {tab === 'schema' && (
            <div>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
                <h4 style={{margin:0, fontSize:13}}>tbl_quannhan_master <span style={{color:'var(--ink-3)', fontFamily:'var(--font-mono)', fontWeight:400, fontSize:11}}>· 11 cột · ~218M rows</span></h4>
                <div style={{marginLeft:'auto'}}>
                  <button className="btn sm"><Icon name="download" size={12}/> DDL</button>
                </div>
              </div>
              <div className="schema">
                {schema.map((c, i) => (
                  <div className="col" key={i}>
                    <span className="k">{c.k}</span>
                    <span className="n">{c.n}</span>
                    <span className="t">{c.t}</span>
                    <span className="x">{c.x}</span>
                  </div>
                ))}
              </div>
              <p style={{fontSize:12, color:'var(--ink-3)', marginTop:12}}>
                Bảng đã được phân vùng theo <code style={{fontFamily:'var(--font-mono)', background:'var(--panel-2)', padding:'1px 6px', borderRadius:3, color:'var(--brand-red)'}}>don_vi_id</code> và sắp xếp theo
                <code style={{fontFamily:'var(--font-mono)', background:'var(--panel-2)', padding:'1px 6px', borderRadius:3, marginLeft:4, color:'var(--brand-red)'}}>updated_at</code>.
                Đã bật RLS (Row-Level Security) theo quyền đơn vị.
              </p>
            </div>
          )}

          {tab === 'usage' && (
            <div>
              <div style={{marginBottom:12, display:'flex', alignItems:'center', gap:10}}>
                <h4 style={{margin:0, fontSize:13}}>Truy vấn / ngày (30d)</h4>
                <span style={{marginLeft:'auto', color:'var(--ink-3)', fontSize:12, fontFamily:'var(--font-mono)'}}>peak {formatShort(Math.max(...usageData))} · avg {formatShort(usageData.reduce((s,v)=>s+v,0)/usageData.length)}</span>
              </div>
              <LineChart
                labels={days}
                height={180}
                series={[{ name:'Truy vấn', color:'var(--brand-red)', data: usageData }]}/>

              <h4 style={{margin:'18px 0 8px', fontSize:13}}>Top người dùng</h4>
              <table className="tbl">
                <thead><tr><th>Người dùng</th><th>Đơn vị</th><th style={{textAlign:'right'}}>Truy vấn</th><th style={{textAlign:'right'}}>Dữ liệu đọc</th></tr></thead>
                <tbody>
                  {[
                    ['trung.dao', 'P. KHCN', 1284, '8.4 GB'],
                    ['linh.nguyen', 'P. Đào tạo', 974, '6.2 GB'],
                    ['hung.le', 'P. Quân lực', 812, '5.1 GB'],
                    ['minh.tran', 'TT. CNTT', 614, '3.8 GB'],
                  ].map(([u,d,q,sz]) => (
                    <tr key={u}><td><b>{u}</b></td><td>{d}</td><td className="num">{q}</td><td className="num">{sz}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'access' && (
            <div>
              <h4 style={{margin:'0 0 10px', fontSize:13}}>Phân quyền truy cập</h4>
              <table className="tbl">
                <thead><tr><th>Vai trò / Nhóm</th><th>Quyền</th><th>Cấp bởi</th><th>Hết hạn</th></tr></thead>
                <tbody>
                  <tr><td><b>SYSADMIN</b><div style={{fontSize:11, color:'var(--ink-3)'}}>Quản trị hệ thống</div></td>
                      <td><span className="tag err">FULL</span></td><td>system</td><td>—</td></tr>
                  <tr><td><b>NHOM_KHCN</b><div style={{fontSize:11, color:'var(--ink-3)'}}>Phòng KH&CN</div></td>
                      <td><span className="tag info">READ</span> <span className="tag gold">QUERY</span></td><td>NH</td><td>31/12/2026</td></tr>
                  <tr><td><b>NHOM_DAO_TAO</b></td>
                      <td><span className="tag info">READ</span></td><td>NH</td><td>31/12/2026</td></tr>
                  <tr><td><b>USER linh.nguyen</b></td>
                      <td><span className="tag info">READ</span> <span className="tag gold">EXPORT</span></td><td>HV</td><td>30/06/2026</td></tr>
                </tbody>
              </table>
              <div style={{marginTop:14, padding:'10px 12px', border:'1px dashed var(--brand-red)', borderRadius:8, background:'color-mix(in oklab, var(--brand-red) 4%, transparent)', fontSize:12, color:'var(--ink-2)', display:'flex', alignItems:'center', gap:8}}>
                <Icon name="shield" size={14}/>
                Dữ liệu nhạy cảm cấp <b style={{color:'var(--brand-red)'}}>MẬT</b> — mọi thao tác đọc/xuất đều được ghi nhật ký không thể chỉnh sửa.
              </div>
            </div>
          )}

          {tab === 'lineage' && (
            <div>
              <h4 style={{margin:'0 0 12px', fontSize:13}}>Quá trình hình thành dữ liệu (Lineage)</h4>
              <div style={{padding:18, background:'var(--panel-2)', borderRadius:8, border:'1px solid var(--line-soft)'}}>
                <div className="pipeline" style={{justifyContent:'space-between'}}>
                  <div className="node"><div className="nt">Source DB</div><b>pg_canbo</b></div>
                  <span className="arrow">→</span>
                  <div className="node"><div className="nt">Source DB</div><b>pg_donvi</b></div>
                  <span className="arrow">→</span>
                  <div className="node"><div className="nt">Join</div><b>etl_qn_merge</b></div>
                  <span className="arrow">→</span>
                  <div className="node" style={{borderColor:'var(--brand-red)', borderWidth:2}}><div className="nt" style={{color:'var(--brand-red)'}}>This</div><b>{source.name}</b></div>
                  <span className="arrow">→</span>
                  <div className="node"><div className="nt">Mart</div><b>mart_qn_bao_cao</b></div>
                </div>
              </div>
              <p style={{fontSize:12, color:'var(--ink-3)', marginTop:12}}>
                Dữ liệu nguồn được đồng bộ qua CDC mỗi <b style={{color:'var(--ink)'}}>5 phút</b>.
                Mọi thay đổi đều có thể truy nguyên tới bản ghi gốc.
              </p>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn"><Icon name="eye" size={14}/> Xem dữ liệu</button>
          <button className="btn"><Icon name="play" size={14}/> Mở Query Editor</button>
          <div style={{flex:1}}/>
          <button className="btn" onClick={onClose}>Đóng</button>
          <button className="btn primary"><Icon name="edit" size={14}/> Chỉnh sửa kết nối</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DataSourcesScreen });
