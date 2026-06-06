/* ============================================================
   Charts
   ============================================================ */

/* ---------- Sparkline ---------- */
const Sparkline = ({ data, color, width = 70, height = 28, fill = true }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 2) - 1]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const fillPath = path + ` L${width} ${height} L0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={fillPath} fill={color} opacity="0.15"/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
};

/* ---------- KPI Card ---------- */
const KPI = ({ accent, label, value, unit, delta, deltaDir, sub, spark, sparkColor }) => {
  return (
    <div className={"kpi " + (accent || "")}>
      <div className="k-label">{label}</div>
      <div className="k-value">{value}{unit && <span className="unit">{unit}</span>}</div>
      <div className="k-meta">
        {delta != null && (
          <span className={"delta " + (deltaDir === 'up' ? 'up' : deltaDir === 'down' ? 'down' : '')}>
            {deltaDir === 'up' && '▲ '}
            {deltaDir === 'down' && '▼ '}
            {delta}
          </span>
        )}
        <span>{sub}</span>
      </div>
      {spark && (
        <div className="k-spark">
          <Sparkline data={spark} color={sparkColor || 'var(--brand-red)'} width={70} height={28}/>
        </div>
      )}
    </div>
  );
};

/* ---------- Line / Area Chart ---------- */
const LineChart = ({ series, labels, height = 220, areas = true }) => {
  const W = 720, H = height, P = { l: 36, r: 12, t: 14, b: 24 };
  const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all) * 1.1, min = 0;
  const range = max - min || 1;
  const n = labels.length;
  const x = i => P.l + (i / (n - 1)) * innerW;
  const y = v => P.t + innerH - ((v - min) / range) * innerH;
  const ticks = 4;
  const tickVals = Array.from({length: ticks+1}, (_, i) => max * i / ticks);

  const [hover, setHover] = React.useState(null);

  return (
    <div className="chart-wrap" onMouseLeave={() => setHover(null)}>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* grid */}
        <g className="chart-grid">
          {tickVals.map((v, i) => (
            <line key={i} x1={P.l} y1={y(v)} x2={W - P.r} y2={y(v)}/>
          ))}
        </g>
        {/* y-axis labels */}
        <g className="chart-axis">
          {tickVals.map((v, i) => (
            <text key={i} x={P.l - 6} y={y(v)+3} textAnchor="end">{formatShort(v)}</text>
          ))}
        </g>
        {/* x-axis labels */}
        <g className="chart-axis">
          {labels.map((l, i) => (
            (i % Math.max(1, Math.floor(n/8)) === 0) &&
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle">{l}</text>
          ))}
        </g>
        {/* areas */}
        {areas && series.map((s, si) => {
          const pts = s.data.map((v, i) => [x(i), y(v)]);
          const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
                  + ` L${x(n-1)} ${y(0)} L${x(0)} ${y(0)} Z`;
          return <path key={si} d={d} fill={s.color} opacity="0.12"/>;
        })}
        {/* lines */}
        {series.map((s, si) => {
          const d = s.data.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
          return <path key={si} d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>;
        })}
        {/* hover line + dots */}
        {hover != null && (
          <>
            <line x1={x(hover)} y1={P.t} x2={x(hover)} y2={P.t + innerH} stroke="var(--ink-mute)" strokeDasharray="3 3" strokeWidth="1"/>
            {series.map((s, si) => (
              <circle key={si} cx={x(hover)} cy={y(s.data[hover])} r="4" fill="var(--panel)" stroke={s.color} strokeWidth="2"/>
            ))}
          </>
        )}
        {/* invisible hit rects */}
        {labels.map((_, i) => (
          <rect key={i} x={x(i) - innerW/n/2} y={P.t} width={innerW/n} height={innerH}
                fill="transparent" onMouseEnter={() => setHover(i)} style={{cursor:'crosshair'}}/>
        ))}
      </svg>
      {hover != null && (
        <div className="chart-tooltip" style={{left: `${(x(hover)/W)*100}%`, top: 0, transform:'translate(-50%, -100%)'}}>
          <div style={{fontSize:11, opacity:0.7, marginBottom:2}}>{labels[hover]}</div>
          {series.map((s, si) => (
            <div key={si} style={{display:'flex', gap:8}}>
              <span style={{color:s.color}}>● {s.name}</span>
              <b>{formatShort(s.data[hover])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const formatShort = (n) => {
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
  return n.toFixed(0);
};

/* ---------- Bar Chart ---------- */
const BarChart = ({ data, height = 220 }) => {
  const W = 720, H = height, P = { l: 40, r: 12, t: 14, b: 50 };
  const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const ticks = 4;
  const n = data.length;
  const bw = innerW / n * 0.6;
  const tickVals = Array.from({length: ticks+1}, (_, i) => max * i / ticks);
  const x = i => P.l + (i + 0.5) * (innerW / n);
  const y = v => P.t + innerH - (v / max) * innerH;
  const [hover, setHover] = React.useState(null);

  return (
    <div className="chart-wrap" onMouseLeave={() => setHover(null)}>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`}>
        <g className="chart-grid">
          {tickVals.map((v, i) => (
            <line key={i} x1={P.l} y1={y(v)} x2={W - P.r} y2={y(v)}/>
          ))}
        </g>
        <g className="chart-axis">
          {tickVals.map((v, i) => (
            <text key={i} x={P.l - 6} y={y(v)+3} textAnchor="end">{formatShort(v)}</text>
          ))}
        </g>
        {data.map((d, i) => (
          <g key={i}>
            <rect x={x(i) - bw/2} y={y(d.value)} width={bw} height={innerH - (y(d.value) - P.t)}
                  fill={hover === i ? 'var(--brand-red-deep)' : 'var(--brand-red)'}
                  rx="2"
                  onMouseEnter={() => setHover(i)}
                  style={{cursor:'pointer', transition:'fill 0.1s'}}/>
            <text className="chart-axis" x={x(i)} y={H - 28} textAnchor="middle"
                  style={{fontSize:10, fill:'var(--ink-3)'}}>{d.label}</text>
            {d.sub && <text x={x(i)} y={H - 16} textAnchor="middle"
                  style={{fontSize:9, fill:'var(--ink-mute)', fontFamily:'var(--font-mono)'}}>{d.sub}</text>}
          </g>
        ))}
      </svg>
      {hover != null && (
        <div className="chart-tooltip" style={{left: `${(x(hover)/W)*100}%`, top: y(data[hover].value) * (300/height), transform:'translate(-50%, -120%)'}}>
          <div style={{fontSize:11, opacity:0.7}}>{data[hover].label}</div>
          <b>{formatShort(data[hover].value)} {data[hover].unit || ''}</b>
        </div>
      )}
    </div>
  );
};

/* ---------- Donut Chart ---------- */
const Donut = ({ data, size = 140, thickness = 22 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size/2, ri = r - thickness;
  let acc = 0;
  return (
    <div className="donut-row">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const start = (acc / total) * Math.PI * 2 - Math.PI/2;
          acc += d.value;
          const end = (acc / total) * Math.PI * 2 - Math.PI/2;
          const large = end - start > Math.PI ? 1 : 0;
          const x1 = r + r * Math.cos(start), y1 = r + r * Math.sin(start);
          const x2 = r + r * Math.cos(end),   y2 = r + r * Math.sin(end);
          const x3 = r + ri * Math.cos(end),  y3 = r + ri * Math.sin(end);
          const x4 = r + ri * Math.cos(start),y4 = r + ri * Math.sin(start);
          return (
            <path key={i}
                  d={`M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z`}
                  fill={d.color}/>
          );
        })}
        <text x={r} y={r-2} textAnchor="middle" style={{fontFamily:'var(--font-serif)', fontWeight:600, fontSize:18, fill:'var(--ink)'}}>
          {formatShort(total)}
        </text>
        <text x={r} y={r+14} textAnchor="middle" style={{fontSize:10, fill:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600}}>
          tổng
        </text>
      </svg>
      <div className="legend">
        {data.map((d, i) => (
          <div className="lg-item" key={i}>
            <span className="nm"><span className="sw" style={{background:d.color}}/>{d.label}</span>
            <span className="v">{formatShort(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Heatmap (7 days x 24 hours) ---------- */
const Heatmap = ({ data }) => {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  return (
    <div>
      <div className="heatmap">
        {days.map((d, di) => (
          <React.Fragment key={d}>
            <div className="hm-label">{d}</div>
            {Array.from({length: 24}).map((_, hi) => {
              const v = data[di][hi];
              const lv = v >= 0.85 ? 5 : v >= 0.65 ? 4 : v >= 0.4 ? 3 : v >= 0.2 ? 2 : v >= 0.05 ? 1 : 0;
              return <div key={hi} className={"hm-cell " + (lv > 0 ? "l"+lv : "")} title={`${d} ${hi}:00 · ${Math.round(v*100)}%`}/>;
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="heatmap-axis">
        <div/>
        {Array.from({length: 24}).map((_, i) => (
          <div key={i}>{i%4 === 0 ? (i<10?'0'+i:i) : ''}</div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Realtime stream ---------- */
const RealtimeStream = ({ lines }) => {
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.scrollTop = 0; }, [lines]);
  return (
    <div className="stream" ref={ref}>
      {lines.map((ln, i) => (
        <div className="ln" key={ln.id}>
          <span className="t">{ln.t}</span>
          <span className={"lv " + ln.lv}>{ln.lv}</span>
          <span className="msg">{ln.msg}</span>
        </div>
      ))}
    </div>
  );
};

/* ---------- VN Military Regions Map (stylized) ---------- */
/* 7 military regions of Vietnam — abstract grid shapes with data overlays */
const VN_REGIONS = [
  // path values describe abstract region shapes positioned to evoke Vietnam's geography
  { id: 'qk1', name: 'Quân khu 1', sub: 'Đông Bắc',  d: 'M 178 60 L 232 50 L 248 80 L 230 110 L 195 105 L 175 85 Z',  cx: 208, cy: 80 },
  { id: 'qk2', name: 'Quân khu 2', sub: 'Tây Bắc',   d: 'M 95 40 L 178 60 L 175 110 L 130 130 L 90 110 L 75 75 Z',     cx: 130, cy: 85 },
  { id: 'qk3', name: 'Quân khu 3', sub: 'Đồng bằng', d: 'M 175 110 L 230 110 L 238 145 L 210 165 L 175 158 L 165 130 Z', cx: 200, cy: 138 },
  { id: 'qk4', name: 'Quân khu 4', sub: 'Bắc Trung Bộ', d: 'M 165 158 L 215 160 L 232 215 L 198 250 L 168 235 L 155 195 Z', cx: 190, cy: 200 },
  { id: 'qk5', name: 'Quân khu 5', sub: 'Nam Trung Bộ', d: 'M 168 250 L 232 255 L 250 320 L 220 365 L 180 360 L 158 305 Z', cx: 205, cy: 308 },
  { id: 'qk7', name: 'Quân khu 7', sub: 'Đông Nam Bộ',  d: 'M 158 360 L 220 365 L 235 410 L 210 432 L 168 420 L 150 395 Z', cx: 190, cy: 395 },
  { id: 'qk9', name: 'Quân khu 9', sub: 'Tây Nam Bộ',   d: 'M 110 405 L 168 420 L 175 460 L 138 475 L 100 460 L 92 430 Z', cx: 138, cy: 442 },
];

const VNMap = ({ data, active, onSelect }) => {
  const W = 320, H = 520;
  const max = Math.max(...Object.values(data));
  return (
    <div className="vn-map">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        <defs>
          <radialGradient id="seaG">
            <stop offset="0%" stopColor="var(--panel-2)" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>
        <ellipse cx="160" cy="260" rx="180" ry="260" fill="url(#seaG)"/>
        {/* Hoang Sa / Truong Sa markers */}
        <g style={{fontFamily:'var(--font-mono)', fontSize:8, fill:'var(--ink-3)'}}>
          <rect x="278" y="180" width="22" height="14" rx="2" fill="var(--panel)" stroke="var(--line)"/>
          <text x="289" y="190" textAnchor="middle">HS</text>
          <rect x="265" y="350" width="22" height="14" rx="2" fill="var(--panel)" stroke="var(--line)"/>
          <text x="276" y="360" textAnchor="middle">TS</text>
        </g>
        {VN_REGIONS.map((r) => {
          const v = data[r.id] || 0;
          const intensity = v / max;
          const fill = `color-mix(in oklab, var(--brand-red) ${Math.round(intensity * 65) + 10}%, var(--panel-2))`;
          return (
            <g key={r.id} style={{cursor:'pointer'}} onClick={() => onSelect(r.id)}>
              <path d={r.d}
                    className={"region" + (active === r.id ? " active" : "")}
                    style={{fill}}/>
              <circle className="pin-pulse" cx={r.cx} cy={r.cy} r="6"/>
              <circle className="pin" cx={r.cx} cy={r.cy} r="3.5"/>
              <text x={r.cx} y={r.cy - 10} textAnchor="middle"
                    style={{fontFamily:'var(--font-sans)', fontSize:10, fontWeight:600, fill:'var(--ink)'}}>
                {r.name.replace('Quân khu ', 'QK')}
              </text>
              <text x={r.cx} y={r.cy + 18} textAnchor="middle"
                    style={{fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, fill:'var(--brand-red-deep)'}}>
                {formatShort(v)}
              </text>
            </g>
          );
        })}
      </svg>
      {active && (
        <div style={{
          position:'absolute', top:10, right:10,
          background:'var(--panel)', border:'1px solid var(--line)',
          borderRadius:'var(--r)', padding:'10px 12px',
          fontSize:12, boxShadow:'var(--shadow-2)', minWidth: 160
        }}>
          {(() => {
            const r = VN_REGIONS.find(x => x.id === active);
            return (
              <>
                <b style={{display:'block', fontSize:13, color:'var(--brand-red)'}}>{r.name}</b>
                <span style={{color:'var(--ink-3)', fontSize:11}}>{r.sub}</span>
                <div style={{borderTop:'1px solid var(--line-soft)', marginTop:6, paddingTop:6}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={{color:'var(--ink-3)'}}>Bản ghi</span>
                    <b style={{fontFamily:'var(--font-mono)'}}>{formatShort(data[r.id])}</b>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { Sparkline, KPI, LineChart, BarChart, Donut, Heatmap, RealtimeStream, VNMap, VN_REGIONS, formatShort });
