/* ============================================================
   Functional modules: Warehouse, ETL, Reports, Users,
                       Monitor, Audit, Security
   ============================================================ */

/* ---------- helpers ---------- */
const Toolbar = ({ search, setSearch, chips, active, setActive, right, placeholder = 'Tìm kiếm…' }) => (
  <div className="toolbar">
    <div className="search">
      <span className="ic"><Icon name="search" size={14}/></span>
      <input className="input" placeholder={placeholder}
             value={search} onChange={(e) => setSearch(e.target.value)}/>
    </div>
    {chips && chips.map(c => (
      <button key={c} className={"chip" + (active === c ? " active" : "")} onClick={() => setActive(c)}>{c}</button>
    ))}
    {right && <div style={{marginLeft:'auto', display:'flex', gap:8}}>{right}</div>}
  </div>
);

const PageHead = ({ crumb, title, sub, right, label }) => (
  <div className="page-head" data-screen-label={label}>
    <div>
      {crumb && <div className="breadcrumb">{crumb.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span> › </span>}
          {i === crumb.length - 1 ? <b>{c}</b> : c}
        </React.Fragment>
      ))}</div>}
      <h1>{title}</h1>
      {sub && <div style={{fontSize:13, color:'var(--ink-3)', marginTop:2}}>{sub}</div>}
    </div>
    {right && <div className="ph-side">{right}</div>}
  </div>
);

/* ============================================================
   1. WAREHOUSE — table browser
   ============================================================ */
const WAREHOUSE_TREE = [
  { schema: 'wh_quannhan', tables: [
    { n: 'tbl_qn_master',     r: '218.4M', s: '14.2 TB', updated: '14:28' },
    { n: 'tbl_qn_donvi',      r: '12.4K',  s: '128 MB',  updated: '14:28' },
    { n: 'tbl_qn_capbac',     r: '38.2K',  s: '412 MB',  updated: '14:28' },
    { n: 'tbl_qn_chucvu',     r: '4.1K',   s: '52 MB',   updated: '14:28' },
    { n: 'tbl_qn_lichsu',     r: '912.4M', s: '18.8 TB', updated: '14:28' },
  ]},
  { schema: 'wh_dao_tao', tables: [
    { n: 'tbl_dt_hoc_vien',   r: '24.8M',  s: '8.2 TB',  updated: '03:00' },
    { n: 'tbl_dt_lop',        r: '18.4K',  s: '224 MB',  updated: '03:00' },
    { n: 'tbl_dt_diem',       r: '184.2M', s: '12.8 TB', updated: '03:00' },
    { n: 'tbl_dt_chuong_trinh', r: '2.8K', s: '34 MB',   updated: '03:00' },
  ]},
  { schema: 'dl_nckh', tables: [
    { n: 'tbl_nc_de_tai',     r: '184.2K', s: '8.4 GB',  updated: '12 phút' },
    { n: 'tbl_nc_bai_bao',    r: '482.4K', s: '12.2 GB', updated: '12 phút' },
    { n: 'tbl_nc_du_lieu_tn', r: '1.2B',   s: '24.1 TB', updated: '12 phút' },
  ]},
  { schema: 'mart_bao_cao', tables: [
    { n: 'mv_qn_thong_ke_thang', r: '8.4K', s: '124 MB', updated: '06:00' },
    { n: 'mv_dt_diem_trung_binh', r: '124K', s: '684 MB', updated: '06:00' },
    { n: 'mv_nc_kpi_khoa',     r: '2.4K', s: '32 MB',   updated: '06:00' },
  ]},
];

const WarehouseScreen = () => {
  const [open, setOpen] = React.useState({ 'wh_quannhan': true, 'wh_dao_tao': true });
  const [picked, setPicked] = React.useState({ schema: 'wh_quannhan', table: 'tbl_qn_master' });
  const [tab, setTab] = React.useState('preview');

  const pickedTable = WAREHOUSE_TREE.find(s => s.schema === picked.schema)?.tables.find(t => t.n === picked.table);

  const rows = Array.from({length: 8}, (_, i) => ({
    id: 100000 + i * 13,
    ma_qn: `QN-${(2024100 + i * 7).toString()}`,
    ho_ten: ['Nguyễn Văn An', 'Trần Quốc Bình', 'Lê Minh Cường', 'Phạm Đức Duy', 'Hoàng Văn Hùng', 'Vũ Thanh Liêm', 'Đỗ Văn Mạnh', 'Bùi Quang Nam'][i],
    don_vi: ['K1-Đại đội 1', 'K1-Đại đội 2', 'K2-Đại đội 1', 'K3-Đại đội 4', 'K4-Đại đội 2', 'K5-Đại đội 1', 'K5-Đại đội 3', 'K1-Đại đội 4'][i],
    cap_bac: ['Trung úy', 'Thượng úy', 'Đại úy', 'Trung tá', 'Trung úy', 'Thiếu tá', 'Thượng úy', 'Đại úy'][i],
    ngay_sinh: ['1992-03-14', '1989-07-22', '1986-11-08', '1981-02-03', '1991-09-30', '1984-05-17', '1988-12-25', '1985-08-11'][i],
  }));

  return (
    <div data-screen-label="Kho dữ liệu">
      <PageHead
        crumb={['Khai thác dữ liệu', 'Kho dữ liệu']}
        title="Kho dữ liệu"
        sub={<>
          <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>4</b> schemas · <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>18</b> bảng · tổng <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>82.4 TB</b>
        </>}
        right={<>
          <button className="btn"><Icon name="play" size={14}/> Query Editor</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Tạo bảng mới</button>
        </>}
      />

      <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:14}}>
        {/* tree */}
        <div className="card" style={{padding:0, overflow:'hidden', alignSelf:'start'}}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8}}>
            <Icon name="layers" size={15}/>
            <b style={{fontSize:13}}>Schema</b>
            <span style={{marginLeft:'auto', fontSize:11, color:'var(--ink-3)', fontFamily:'var(--font-mono)'}}>{WAREHOUSE_TREE.length}</span>
          </div>
          <div style={{padding:'8px 0', maxHeight: 640, overflow:'auto'}}>
            {WAREHOUSE_TREE.map(s => (
              <div key={s.schema}>
                <div style={{
                  display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
                  cursor:'pointer', fontWeight:600, fontSize:12.5,
                  color: open[s.schema] ? 'var(--ink)' : 'var(--ink-2)'
                }} onClick={() => setOpen(o => ({...o, [s.schema]: !o[s.schema]}))}>
                  <span style={{transform: open[s.schema] ? 'rotate(90deg)' : 'none', transition:'transform 0.15s', display:'inline-flex'}}>
                    <Icon name="chevronRight" size={11}/>
                  </span>
                  <Icon name="folder" size={13}/>
                  <span style={{fontFamily:'var(--font-mono)'}}>{s.schema}</span>
                  <span style={{marginLeft:'auto', fontSize:10, color:'var(--ink-3)'}}>{s.tables.length}</span>
                </div>
                {open[s.schema] && s.tables.map(t => {
                  const isP = picked.schema === s.schema && picked.table === t.n;
                  return (
                    <div key={t.n} onClick={() => setPicked({schema: s.schema, table: t.n})}
                         style={{
                          padding:'6px 14px 6px 38px', fontSize:12, cursor:'pointer',
                          fontFamily:'var(--font-mono)',
                          background: isP ? 'color-mix(in oklab, var(--brand-red) 12%, transparent)' : 'transparent',
                          color: isP ? 'var(--brand-red)' : 'var(--ink-2)',
                          fontWeight: isP ? 600 : 500,
                          borderLeft: isP ? '2px solid var(--brand-red)' : '2px solid transparent',
                         }}>
                      {t.n}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* content */}
        <div className="card">
          <div className="card-h">
            <span className="src-icon" style={{margin:0, width:32, height:32}}>T</span>
            <div>
              <h3 style={{fontFamily:'var(--font-mono)', fontSize:15}}>{picked.schema}.{picked.table}</h3>
              <div className="sub">{pickedTable?.r} dòng · {pickedTable?.s} · cập nhật {pickedTable?.updated}</div>
            </div>
            <div className="spacer"/>
            <span className="tag ok"><span className="dot"/>healthy</span>
            <button className="btn sm"><Icon name="download" size={12}/> Export</button>
          </div>

          <div className="tabs">
            {['preview', 'columns', 'stats', 'sample-query'].map(x => (
              <div key={x} className={"tab" + (tab === x ? " active" : "")} onClick={() => setTab(x)}>
                {{preview:'Xem dữ liệu', columns:'Cấu trúc', stats:'Thống kê', 'sample-query':'Truy vấn mẫu'}[x]}
              </div>
            ))}
          </div>

          {tab === 'preview' && (
            <div style={{overflowX:'auto'}}>
              <table className="tbl" style={{minWidth: 700}}>
                <thead>
                  <tr>
                    <th style={{width:60}}>id</th>
                    <th>ma_qn</th>
                    <th>ho_ten</th>
                    <th>don_vi_id</th>
                    <th>cap_bac</th>
                    <th>ngay_sinh</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td className="num">{r.id}</td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:12.5}}><b>{r.ma_qn}</b></td>
                      <td>{r.ho_ten}</td>
                      <td>{r.don_vi}</td>
                      <td>{r.cap_bac}</td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ink-3)'}}>{r.ngay_sinh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{padding:'10px 0 2px', fontSize:12, color:'var(--ink-3)', display:'flex', alignItems:'center', gap:10}}>
                Hiển thị 1–8 · tổng {pickedTable?.r} dòng
                <div style={{marginLeft:'auto', display:'flex', gap:6}}>
                  <button className="btn sm">‹ Trước</button>
                  <button className="btn sm primary">1</button>
                  <button className="btn sm">2</button>
                  <button className="btn sm">3</button>
                  <button className="btn sm">…</button>
                  <button className="btn sm">Sau ›</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'columns' && (
            <table className="tbl">
              <thead><tr><th>Cột</th><th>Kiểu</th><th>Null</th><th>Index</th><th>Mô tả</th></tr></thead>
              <tbody>
                {[
                  ['id','BIGINT','no','PK', 'Khóa chính'],
                  ['ma_qn','VARCHAR(20)','no','UNIQUE', 'Mã định danh quân nhân'],
                  ['ho_ten','VARCHAR(150)','no','—', 'Họ và tên đầy đủ'],
                  ['ngay_sinh','DATE','yes','—', 'Ngày sinh'],
                  ['don_vi_id','INT','no','FK + B-Tree', 'Đơn vị biên chế'],
                  ['cap_bac','VARCHAR(50)','no','—', 'Cấp bậc hiện tại'],
                  ['chuc_vu','VARCHAR(120)','yes','—', 'Chức vụ'],
                  ['nguon_du_lieu','VARCHAR(80)','no','B-Tree', 'Nguồn nhập liệu'],
                  ['created_at','TIMESTAMP','no','—', 'Thời điểm tạo'],
                  ['updated_at','TIMESTAMP','yes','B-Tree DESC', 'Thời điểm cập nhật'],
                  ['data_hash','CHAR(64)','yes','—', 'SHA-256 toàn bản ghi'],
                ].map(([n,t,nu,idx,d]) => (
                  <tr key={n}>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:12.5}}><b>{n}</b></td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:12, color:'var(--info)'}}>{t}</td>
                    <td><span className={"tag " + (nu === 'no' ? 'mute' : 'info')} style={{fontSize:10}}>{nu}</span></td>
                    <td><span className="tag gold" style={{fontSize:10}}>{idx}</span></td>
                    <td style={{color:'var(--ink-3)'}}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'stats' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16}}>
              {[
                ['Tổng dòng', pickedTable?.r],
                ['Dung lượng', pickedTable?.s],
                ['Phân vùng', '128'],
                ['Replicas', '3'],
                ['Hit cache 24h', '94.2%'],
                ['Query/ngày', '12.4k'],
                ['Avg query time', '47ms'],
                ['Lần cập nhật', pickedTable?.updated],
              ].map(([l, v]) => (
                <div key={l} style={{padding:14, background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8}}>
                  <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--ink-3)', fontWeight:600}}>{l}</div>
                  <div style={{fontFamily:'var(--font-serif)', fontSize:20, fontWeight:600, marginTop:4, fontVariantNumeric:'tabular-nums'}}>{v}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'sample-query' && (
            <div style={{background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8, padding:16, fontFamily:'var(--font-mono)', fontSize:13, lineHeight:1.7}}>
              <div style={{color:'var(--ink-3)'}}>{`-- Đếm quân nhân theo cấp bậc, đơn vị`}</div>
              <div><span style={{color:'var(--brand-red)', fontWeight:600}}>SELECT</span> dv.ten_don_vi, qn.cap_bac, <span style={{color:'var(--info)'}}>COUNT</span>(*) <span style={{color:'var(--brand-red)', fontWeight:600}}>AS</span> so_luong</div>
              <div><span style={{color:'var(--brand-red)', fontWeight:600}}>FROM</span> <span style={{color:'var(--ok)'}}>{picked.schema}.{picked.table}</span> qn</div>
              <div><span style={{color:'var(--brand-red)', fontWeight:600}}>JOIN</span> <span style={{color:'var(--ok)'}}>{picked.schema}.tbl_qn_donvi</span> dv <span style={{color:'var(--brand-red)', fontWeight:600}}>ON</span> qn.don_vi_id = dv.id</div>
              <div><span style={{color:'var(--brand-red)', fontWeight:600}}>WHERE</span> qn.updated_at &gt;= <span style={{color:'var(--warn)'}}>'2025-01-01'</span></div>
              <div><span style={{color:'var(--brand-red)', fontWeight:600}}>GROUP BY</span> dv.ten_don_vi, qn.cap_bac</div>
              <div><span style={{color:'var(--brand-red)', fontWeight:600}}>ORDER BY</span> so_luong <span style={{color:'var(--brand-red)', fontWeight:600}}>DESC</span>;</div>
              <div style={{marginTop:12, paddingTop:12, borderTop:'1px dashed var(--line)', display:'flex', gap:8, alignItems:'center'}}>
                <button className="btn primary sm"><Icon name="play" size={12}/> Chạy</button>
                <span style={{color:'var(--ink-3)', fontSize:11}}>Ước tính ~ 184ms · scan 14.2 MB</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   2. ETL / PIPELINE
   ============================================================ */
const PIPELINES = [
  { id: 'etl_qn_daily',  name: 'etl_quannhan_daily',      type: 'ETL', sched: 'Hàng ngày 02:00', last: '02:00 hôm nay', dur: '14m 22s', status: 'ok',    next: '02:00 mai',     records: '218.4M', owner: 'P. Quân lực' },
  { id: 'sync_dt_rt',    name: 'sync_dao_tao_realtime',   type: 'CDC', sched: 'Liên tục',        last: 'đang chạy',     dur: '—',       status: 'run',   next: '—',             records: '12.8M/24h', owner: 'P. Đào tạo' },
  { id: 'agg_nc_month',  name: 'aggregate_nckh_monthly',  type: 'Aggregate', sched: 'Ngày 1 hàng tháng', last: '01/06 03:00', dur: '38m 12s', status: 'ok', next: '01/07 03:00', records: '482K',  owner: 'P. KHCN' },
  { id: 'ext_ext_sync',  name: 'pl_external_sync',        type: 'Extract', sched: 'Mỗi 6 giờ',   last: '12:00 hôm nay', dur: '—',       status: 'err',   next: '18:00 hôm nay', records: '—',      owner: 'TT. CNTT' },
  { id: 'comp_logs',     name: 'compact_logs_weekly',     type: 'Maintain', sched: 'Chủ nhật 23:00', last: '02/06 23:00', dur: '1h 24m', status: 'ok',    next: '08/06 23:00',   records: '4.2B',   owner: 'TT. CNTT' },
  { id: 'mart_kpi',      name: 'build_mart_kpi_daily',    type: 'ETL', sched: 'Hàng ngày 06:00', last: '06:00 hôm nay', dur: '8m 47s',  status: 'ok',    next: '06:00 mai',     records: '128K',   owner: 'P. KHCN' },
  { id: 'bk_dr_replic',  name: 'replicate_dr_site',       type: 'Replicate', sched: 'Mỗi 15 phút', last: '14:30 hôm nay', dur: '42s',  status: 'warn',  next: '14:45 hôm nay', records: '—',      owner: 'TT. CNTT' },
];

const PipelineScreen = () => {
  const [search, setSearch] = React.useState('');
  const [active, setActive] = React.useState('Tất cả');
  const [open, setOpen] = React.useState(null);

  const filtered = PIPELINES.filter(p =>
    (active === 'Tất cả' || p.type === active) &&
    (search === '' || (p.name + p.owner).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div data-screen-label="ETL Pipeline">
      <PageHead
        crumb={['Khai thác dữ liệu', 'ETL / Pipeline']}
        title="ETL / Pipeline"
        sub={<>
          <b style={{color:'var(--ink)', fontFamily:'var(--font-mono)'}}>{PIPELINES.length}</b> pipeline ·
          <b style={{color:'var(--ok)', marginLeft:4}}>5 ổn định</b> ·
          <b style={{color:'var(--warn)', marginLeft:6}}>1 cảnh báo</b> ·
          <b style={{color:'var(--err)', marginLeft:6}}>1 lỗi</b>
        </>}
        right={<>
          <button className="btn"><Icon name="upload" size={14}/> Import DAG</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Tạo pipeline</button>
        </>}
      />

      <div className="row r-1-1-1" style={{marginBottom:14}}>
        {[
          {lb: 'Đang chạy', v: '3', c: 'var(--info)'},
          {lb: 'Hoàn thành 24h', v: '127', c: 'var(--ok)'},
          {lb: 'Lỗi 24h', v: '2', c: 'var(--err)'},
        ].map(s => (
          <div key={s.lb} className="kpi" style={{borderLeft:`3px solid ${s.c}`}}>
            <div className="k-label">{s.lb}</div>
            <div className="k-value">{s.v}</div>
          </div>
        ))}
      </div>

      <Toolbar search={search} setSearch={setSearch}
               chips={['Tất cả', 'ETL', 'CDC', 'Aggregate', 'Extract', 'Replicate', 'Maintain']}
               active={active} setActive={setActive}
               placeholder="Tìm pipeline, owner…"/>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Pipeline</th>
              <th>Loại</th>
              <th>Lịch chạy</th>
              <th>Lần chạy cuối</th>
              <th>Thời lượng</th>
              <th style={{textAlign:'right'}}>Bản ghi</th>
              <th>Owner</th>
              <th>Trạng thái</th>
              <th style={{width:40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} onClick={() => setOpen(p)} style={{cursor:'pointer'}}>
                <td>
                  <span className="src-icon"><Icon name="flow" size={13}/></span>
                  <b style={{fontFamily:'var(--font-mono)', fontSize:12.5}}>{p.name}</b>
                </td>
                <td><span className="tag mute">{p.type}</span></td>
                <td>{p.sched}</td>
                <td>{p.last}</td>
                <td className="num">{p.dur}</td>
                <td className="num">{p.records}</td>
                <td>{p.owner}</td>
                <td>
                  {p.status === 'ok'  && <span className="tag ok"><span className="dot"/>thành công</span>}
                  {p.status === 'run' && <span className="tag info"><span className="dot"/>đang chạy</span>}
                  {p.status === 'warn'&& <span className="tag warn"><span className="dot"/>cảnh báo</span>}
                  {p.status === 'err' && <span className="tag err"><span className="dot"/>lỗi</span>}
                </td>
                <td><button className="btn icon sm" onClick={(e) => {e.stopPropagation(); setOpen(p);}}><Icon name="moreH" size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <PipelineModal pipeline={open} onClose={() => setOpen(null)}/>}
    </div>
  );
};

/* ---------- DAG visualizer ---------- */
const DAGView = ({ nodes, edges, height = 200 }) => {
  return (
    <svg viewBox={`0 0 800 ${height}`} style={{width:'100%', height}}>
      {/* edges */}
      {edges.map((e, i) => {
        const from = nodes.find(n => n.id === e.from);
        const to = nodes.find(n => n.id === e.to);
        if (!from || !to) return null;
        const fx = from.x + 70, fy = from.y + 22;
        const tx = to.x, ty = to.y + 22;
        const mx = (fx + tx) / 2;
        return (
          <g key={i}>
            <path d={`M${fx} ${fy} C${mx} ${fy} ${mx} ${ty} ${tx} ${ty}`}
                  stroke="var(--brand-red)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow-mk)"/>
          </g>
        );
      })}
      <defs>
        <marker id="arrow-mk" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L7 4 L0 8 Z" fill="var(--brand-red)"/>
        </marker>
      </defs>
      {/* nodes */}
      {nodes.map(n => (
        <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
          <rect width="140" height="44" rx="6"
                fill={n.status === 'ok' ? 'color-mix(in oklab, var(--ok) 14%, var(--panel))' :
                      n.status === 'run' ? 'color-mix(in oklab, var(--info) 14%, var(--panel))' :
                      n.status === 'err' ? 'color-mix(in oklab, var(--err) 14%, var(--panel))' : 'var(--panel-2)'}
                stroke={n.status === 'ok' ? 'var(--ok)' : n.status === 'run' ? 'var(--info)' : n.status === 'err' ? 'var(--err)' : 'var(--line)'}
                strokeWidth="1.5"/>
          <text x="10" y="17" style={{fontSize:9, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', fill:'var(--ink-3)'}}>{n.type}</text>
          <text x="10" y="33" style={{fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, fill:'var(--ink)'}}>{n.label}</text>
        </g>
      ))}
    </svg>
  );
};

const PipelineModal = ({ pipeline, onClose }) => {
  const [tab, setTab] = React.useState('dag');
  const nodes = [
    { id:'s', x:10,  y:80, type:'Source', label:'pg_canbo', status:'ok' },
    { id:'e', x:170, y:30, type:'Extract', label:'cdc_debezium', status:'ok' },
    { id:'k', x:170, y:130, type:'Stream', label:'kafka_topic', status:'ok' },
    { id:'t', x:330, y:80, type:'Transform', label:'spark_norm', status: pipeline.status === 'err' ? 'err' : 'ok' },
    { id:'q', x:490, y:80, type:'Quality', label:'great_expect', status:'ok' },
    { id:'l', x:650, y:80, type:'Load', label:'wh_quannhan', status: pipeline.status === 'run' ? 'run' : (pipeline.status === 'ok' ? 'ok' : 'mute') },
  ];
  const edges = [
    { from:'s', to:'e' }, { from:'s', to:'k' },
    { from:'e', to:'t' }, { from:'k', to:'t' },
    { from:'t', to:'q' }, { from:'q', to:'l' },
  ];

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: 920}}>
        <div className="modal-head">
          <div className="ds-ic"><Icon name="flow" size={16}/></div>
          <div>
            <h3 style={{fontFamily:'var(--font-mono)'}}>{pipeline.name}</h3>
            <div style={{fontSize:12, color:'var(--ink-3)'}}>
              {pipeline.type} · {pipeline.sched} · owner {pipeline.owner}
            </div>
          </div>
          <button className="x" onClick={onClose}><Icon name="x"/></button>
        </div>

        <div className="modal-body">
          <div className="tabs">
            {[['dag','Sơ đồ DAG'], ['runs','Lịch sử chạy'], ['logs','Logs'], ['config','Cấu hình']].map(([k, l]) => (
              <div key={k} className={"tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{l}</div>
            ))}
          </div>

          {tab === 'dag' && (
            <div>
              <div style={{background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8, padding:'8px 12px', marginBottom:14}}>
                <DAGView nodes={nodes} edges={edges} height={200}/>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
                {[
                  ['Lần chạy gần nhất', pipeline.last],
                  ['Thời lượng', pipeline.dur],
                  ['Bản ghi xử lý', pipeline.records],
                  ['Lần chạy kế tiếp', pipeline.next],
                ].map(([l, v]) => (
                  <div key={l} style={{padding:12, background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:6}}>
                    <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink-3)', fontWeight:600}}>{l}</div>
                    <div style={{fontFamily:'var(--font-mono)', fontWeight:600, marginTop:3, fontSize:13}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'runs' && (
            <table className="tbl">
              <thead><tr><th>Thời điểm</th><th>Thời lượng</th><th style={{textAlign:'right'}}>Bản ghi</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {[
                  ['02:00 06/06/2026', '14m 22s', '218,432,891', 'ok'],
                  ['02:00 05/06/2026', '13m 58s', '218,402,114', 'ok'],
                  ['02:00 04/06/2026', '15m 04s', '218,381,924', 'ok'],
                  ['02:00 03/06/2026', '18m 41s', '218,360,447', 'warn'],
                  ['02:00 02/06/2026', '14m 12s', '218,341,002', 'ok'],
                  ['02:00 01/06/2026', '13m 47s', '218,320,558', 'ok'],
                ].map(([t, d, r, s], i) => (
                  <tr key={i}>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:12}}>{t}</td>
                    <td className="num">{d}</td>
                    <td className="num">{r}</td>
                    <td><span className={"tag " + s}><span className="dot"/>{s === 'ok' ? 'thành công' : 'cảnh báo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'logs' && (
            <div style={{background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8, padding:14, fontFamily:'var(--font-mono)', fontSize:11.5, lineHeight:1.7, maxHeight:320, overflow:'auto'}}>
              {[
                ['02:00:01', 'INFO', 'Pipeline started by scheduler airflow-prod'],
                ['02:00:02', 'INFO', 'Source connection established: pg_canbo (10.27.4.12:5432)'],
                ['02:00:14', 'INFO', 'CDC offset acquired: lsn=0/3B4A2C8F1'],
                ['02:01:48', 'INFO', 'Extracted 218,432,891 rows into stage_qn_master'],
                ['02:05:22', 'INFO', 'Transform stage: applied 14 normalization rules'],
                ['02:08:01', 'WARN', 'Data quality: 14 rows failed format check for ngay_sinh — quarantined'],
                ['02:11:33', 'INFO', 'Load stage: merging into wh_quannhan.tbl_qn_master'],
                ['02:14:11', 'INFO', 'Merge complete: 218,432,891 rows (213,847 updated, 4,585,044 inserted)'],
                ['02:14:18', 'INFO', 'Compaction triggered on partition 2026-06'],
                ['02:14:22', 'OK',   'Pipeline completed successfully in 14m 22s'],
              ].map(([t, lv, m], i) => (
                <div key={i} style={{display:'flex', gap:10}}>
                  <span style={{color:'var(--ink-3)'}}>{t}</span>
                  <span style={{
                    color: lv === 'OK' ? 'var(--ok)' : lv === 'WARN' ? 'var(--warn)' : lv === 'ERR' ? 'var(--err)' : 'var(--info)',
                    fontWeight:700, width:40
                  }}>{lv}</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'config' && (
            <div style={{background:'var(--panel-2)', border:'1px solid var(--line-soft)', borderRadius:8, padding:16, fontFamily:'var(--font-mono)', fontSize:12.5, lineHeight:1.8}}>
              <div style={{color:'var(--ink-3)'}}># {pipeline.name}.yaml</div>
              <div><span style={{color:'var(--brand-red)'}}>name</span>: {pipeline.name}</div>
              <div><span style={{color:'var(--brand-red)'}}>schedule</span>: <span style={{color:'var(--warn)'}}>"0 2 * * *"</span></div>
              <div><span style={{color:'var(--brand-red)'}}>owner</span>: {pipeline.owner.toLowerCase().replace(/\. /g, '_').replace(/ /g, '_')}</div>
              <div><span style={{color:'var(--brand-red)'}}>retries</span>: 3</div>
              <div><span style={{color:'var(--brand-red)'}}>timeout</span>: 60m</div>
              <div><span style={{color:'var(--brand-red)'}}>source</span>:</div>
              <div style={{paddingLeft:18}}>type: postgresql</div>
              <div style={{paddingLeft:18}}>conn: pg_canbo</div>
              <div style={{paddingLeft:18}}>query: <span style={{color:'var(--warn)'}}>"SELECT * FROM canbo WHERE updated &gt; :ckpt"</span></div>
              <div><span style={{color:'var(--brand-red)'}}>sink</span>:</div>
              <div style={{paddingLeft:18}}>type: hive</div>
              <div style={{paddingLeft:18}}>table: wh_quannhan.tbl_qn_master</div>
              <div style={{paddingLeft:18}}>mode: merge</div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn"><Icon name="play" size={14}/> Chạy ngay</button>
          <button className="btn"><Icon name="clock" size={14}/> Lên lịch</button>
          <div style={{flex:1}}/>
          <button className="btn" onClick={onClose}>Đóng</button>
          <button className="btn primary"><Icon name="edit" size={14}/> Sửa pipeline</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  Toolbar, PageHead, WarehouseScreen, PipelineScreen, DAGView, PipelineModal,
});
