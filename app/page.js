'use client';
import{useState,useEffect}from"react";
import{LineChart,Line,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend}from"recharts";
import{supabase}from"../supabase";

const C={white:"#fff",navy:"#0c1a2e",cyan:"#00c9e8",cyanD:"#00a5bf",cyanL:"#e6f9fc",bc:"#1b3254",tl:"#6b7280",bd:"#e5e7eb",bg:"#f3f4f6",r:"#ef4444",g:"#22c55e",amber:"#f59e0b"};
const F="'DM Sans',system-ui,sans-serif";
const GM=["Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen","Goode Motor Group"];
const JA=["Juneau Subaru","Juneau CDJR","Juneau Auto Mall","Juneau Toyota","Juneau Chevrolet","Juneau Honda","Juneau Powersports"];
const CLIENTS=[...GM,...JA];

/* ─── SMALL COMPONENTS ─── */
function Tip({text}){const[s,ss]=useState(false);return(<span onMouseEnter={()=>ss(true)}onMouseLeave={()=>ss(false)}style={{position:"relative",cursor:"help",marginLeft:4,color:C.tl,fontSize:12}}>ⓘ{s&&<span style={{position:"absolute",bottom:"120%",left:"50%",transform:"translateX(-50%)",background:C.navy,color:"#fff",padding:"6px 10px",borderRadius:6,fontSize:11,width:200,textAlign:"center",zIndex:99,pointerEvents:"none"}}>{text}</span>}</span>);}

function Kpi({label,value,sub,tip,color}){return(<div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"16px 20px",flex:1,minWidth:140}}>
  <div style={{fontSize:12,color:C.tl,marginBottom:4,fontFamily:F}}>{label}{tip&&<Tip text={tip}/>}</div>
  <div style={{fontSize:28,fontWeight:800,color:color||C.navy,fontFamily:F}}>{value}</div>
  {sub&&<div style={{fontSize:11,color:C.tl,marginTop:2,fontFamily:F}}>{sub}</div>}
</div>);}

function NavBtn({label,active,onClick}){return(<button onClick={onClick}style={{padding:"8px 14px",background:active?C.cyan:"transparent",color:active?C.navy:C.tl,border:"none",borderRadius:6,fontWeight:active?700:400,cursor:"pointer",fontFamily:F,fontSize:13}}>{label}</button>);}

function Section({title,children}){return(<div style={{marginBottom:28}}><h3 style={{fontFamily:F,fontSize:15,fontWeight:700,color:C.navy,margin:"0 0 12px"}}>{title}</h3>{children}</div>);}

function WinLoss({wins=[],losses=[]}){return(<Section title="Wins & Losses"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{wins.map((w,i)=><div key={i}style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F,color:"#166534"}}>✅ {w}</div>)}{losses.map((l,i)=><div key={i}style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F,color:"#991b1b"}}>⚠️ {l}</div>)}</div></Section>);}

function WorkDone({items=[]}){return(<Section title="Work Completed"><div style={{display:"flex",flexDirection:"column",gap:8}}>{items.map((it,i)=><div key={i}style={{background:C.bg,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F}}><strong>{it.task}</strong> — {it.desc}</div>)}</div></Section>);}

function NextMonth({items=[]}){return(<Section title="What's Coming Next Month"><div style={{display:"flex",flexDirection:"column",gap:6}}>{items.map((it,i)=><div key={i}style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontFamily:F}}><span style={{color:C.cyan}}>→</span>{it}</div>)}</div></Section>);}

/* ─── COMPARISON TOGGLE ─── */
function CompToggle({mode,setMode}){return(<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:20,background:C.cyanL,borderRadius:8,padding:"8px 12px",flexWrap:"wrap"}}>
  <span style={{fontSize:12,color:C.navy,fontWeight:600,fontFamily:F}}>Comparing against:</span>
  {["MoM","YoY","QoQ"].map(m=><button key={m}onClick={()=>setMode(m)}style={{padding:"4px 12px",background:mode===m?C.cyan:"transparent",border:`1px solid ${mode===m?C.cyan:C.bd}`,borderRadius:6,fontWeight:mode===m?700:400,cursor:"pointer",fontFamily:F,fontSize:12,color:mode===m?C.navy:C.tl}}>{m}</button>)}
</div>);}

/* ─── LOGIN PAGE ─── */
function LoginPage(){
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const handleLogin=async()=>{
    if(!email||!password){setError("Please enter your email and password.");return;}
    setLoading(true);setError("");
    const{error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err){setError(err.message);setLoading(false);}
  };
  return(
    <div style={{minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F}}>
      <div style={{background:C.white,borderRadius:16,padding:"48px 40px",width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)",textAlign:"center"}}>
        <div style={{fontSize:28,fontWeight:800,letterSpacing:1,marginBottom:6}}>
          <span style={{color:C.navy}}>TAGGART</span><span style={{color:C.cyan}}> ADVERTISING</span>
        </div>
        <p style={{fontSize:13,color:C.tl,margin:"0 0 28px"}}>Client Report Portal</p>
        <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        {error&&<p style={{fontSize:12,color:C.r,margin:"0 0 10px"}}>{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{width:"100%",padding:"13px",background:C.navy,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>
          {loading?"Signing in…":"Sign In"}
        </button>
      </div>
    </div>
  );
}

/* ─── HEADER ─── */
function Header({client,setClient,dateRange,setDateRange,onLogout}){
  return(
    <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,padding:"0 24px",display:"flex",alignItems:"center",gap:16,height:60,position:"sticky",top:0,zIndex:50}}>
      <div style={{fontSize:18,fontWeight:800,letterSpacing:1,flex:1}}>
        <span style={{color:C.navy}}>TAGGART</span><span style={{color:C.cyan}}> ADVERTISING</span>
        <span style={{fontSize:12,fontWeight:400,color:C.tl,marginLeft:8}}>Report</span>
      </div>
      <select value={client} onChange={e=>setClient(e.target.value)}
        style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.bd}`,fontFamily:F,fontSize:13,outline:"none"}}>
        <optgroup label="Goode Motor Group">{GM.map(c=><option key={c}>{c}</option>)}</optgroup>
        <optgroup label="Juneau Auto Mall">{JA.map(c=><option key={c}>{c}</option>)}</optgroup>
      </select>
      <select value={dateRange} onChange={e=>setDateRange(e.target.value)}
        style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.bd}`,fontFamily:F,fontSize:13,outline:"none"}}>
        <option value="last_month">Last Month</option>
        <option value="this_month">This Month</option>
        <option value="last_quarter">Last Quarter</option>
        <option value="this_year">This Year</option>
        <option value="custom">Custom Range</option>
      </select>
      <button onClick={onLogout}style={{padding:"6px 14px",background:"transparent",border:`1px solid ${C.bd}`,borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:F,color:C.tl}}>Sign Out</button>
    </div>
  );
}

/* ─── TAB NAV ─── */
const TABS=["Dashboard","SEO","Google Business","Google Ads","Meta Ads","Organic Social","Email","Creative","Benchmarks"];

function TabNav({active,setActive}){return(
  <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,padding:"0 24px",display:"flex",gap:4,overflowX:"auto"}}>
    {TABS.map(t=><NavBtn key={t}label={t}active={active===t}onClick={()=>setActive(t)}/>)}
  </div>
);}

/* ─── DASHBOARD PAGE ─── */
const leadTrend=[{m:"Jul",total:212,web:89,tp:78,fb:45},{m:"Aug",total:228,web:95,tp:82,fb:51},{m:"Sep",total:198,web:82,tp:71,fb:45},{m:"Oct",total:241,web:101,tp:86,fb:54},{m:"Nov",total:259,web:108,tp:92,fb:59},{m:"Dec",total:267,web:111,tp:96,fb:60},{m:"Jan",total:243,web:102,tp:87,fb:54},{m:"Feb",total:278,web:116,tp:99,fb:63},{m:"Mar",total:289,web:121,tp:103,fb:65}];

function DashboardPage(){
  const[comp,setComp]=useState("MoM");
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>

    {/* Lead Summary */}
    <Section title="Lead Summary">
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
        {[{l:"Total Leads",v:"289",tip:"All leads across every source this period."},{l:"Website Leads",v:"121",tip:"Leads submitted directly from the dealership website."},{l:"Third-Party Leads",v:"103",tip:"Leads from third-party providers like Cars.com, AutoTrader, etc."},{l:"Facebook Leads",v:"65",tip:"Leads generated from Facebook Lead Ad forms."}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.tip}sub={comp==="MoM"?"+12% vs last month":"+38% vs last year"}/>)}
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Total Sold",v:"47",s:"16.3% close rate"},{l:"Website Sold",v:"22",s:"18.2% close rate"},{l:"Third-Party Sold",v:"15",s:"14.6% close rate"},{l:"Facebook Sold",v:"10",s:"15.4% close rate"}].map(k=><Kpi key={k.l}label={k.l}value={k.v}sub={k.s}color={C.g}/>)}
      </div>
    </Section>

    {/* CallRail */}
    <Section title="Call Tracking (CallRail)">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Total Calls",v:"412",tip:"Total tracked calls this period."},{l:"Calls from Website",v:"198",tip:"Calls attributed to website visits."},{l:"Calls from Ads",v:"142",tip:"Calls attributed to paid ad campaigns."},{l:"Calls from Google Business",v:"72",tip:"Calls from the GBP call button."}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.tip}sub={comp==="MoM"?"+9% vs last month":"+31% vs last year"}/>)}
      </div>
    </Section>

    {/* Annual Trend */}
    <Section title="Annual Lead Trend">
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <ResponsiveContainer width="100%"height={220}>
          <LineChart data={leadTrend}><CartesianGrid strokeDasharray="3 3"stroke={C.bd}/><XAxis dataKey="m"tick={{fontSize:11,fontFamily:F}}/><YAxis tick={{fontSize:11,fontFamily:F}}/><Tooltip/><Legend/>
            <Line type="monotone"dataKey="total"stroke={C.navy}strokeWidth={2}name="Total Leads"/>
            <Line type="monotone"dataKey="web"stroke={C.cyan}strokeWidth={2}name="Website"/>
            <Line type="monotone"dataKey="tp"stroke={C.amber}strokeWidth={2}name="Third Party"/>
            <Line type="monotone"dataKey="fb"stroke="#3b82f6"strokeWidth={2}name="Facebook"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Section>

    {/* Department Cards */}
    <Section title="Department Performance">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[
          {dept:"SEO",color:"#6366f1",kpis:[{l:"Key Conversions",v:"312"},{l:"Organic Traffic",v:"8,420"},{l:"Page 1 Keywords",v:"47"},{l:"CTR",v:"5.2%"},{l:"Impressions",v:"124K"},{l:"GBP Calls",v:"72"}]},
          {dept:"Google Business Profile",color:"#10b981",kpis:[{l:"Profile Views",v:"4,210"},{l:"Search Appearances",v:"9,840"},{l:"Map Views",v:"1,620"},{l:"Website Clicks",v:"387"},{l:"Phone Calls",v:"72"},{l:"Directions",v:"143"}]},
          {dept:"Google Ads",color:"#f59e0b",kpis:[{l:"Conversions",v:"184"},{l:"Cost/Lead",v:"$31"},{l:"Total Spend",v:"$5,720"},{l:"CTR",v:"9.1%"},{l:"CPC",v:"$2.18"},{l:"Impr. Share",v:"68%"}]},
          {dept:"Meta Ads",color:"#3b82f6",kpis:[{l:"Conversions",v:"127"},{l:"Cost/Lead",v:"$24"},{l:"Reach",v:"42.8K"},{l:"CPC",v:"$0.71"},{l:"Frequency",v:"2.4"},{l:"Engagement",v:"4.9%"}]},
          {dept:"Organic Social",color:"#ec4899",kpis:[{l:"Total Reach",v:"89.4K"},{l:"Engagement",v:"6.2%"},{l:"New Followers",v:"248"},{l:"Posts Published",v:"34"},{l:"Videos",v:"12"},{l:"Website Clicks",v:"614"}]},
        ].map(d=><div key={d.dept}style={{background:`linear-gradient(135deg,${d.color}ee,${d.color}cc)`,borderRadius:12,padding:"18px 24px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12,fontFamily:F}}>{d.dept}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12}}>
            {d.kpis.map(k=><div key={k.l}style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:F}}>{k.v}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.8)",fontFamily:F}}>{k.l}</div>
            </div>)}
          </div>
        </div>)}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{dept:"Email Marketing",color:"#8b5cf6",kpis:[{l:"Campaigns Sent",v:"3"},{l:"Total Recipients",v:"4,820"},{l:"Site Visits",v:"284"}]},
            {dept:"Creative Deliverables",color:"#14b8a6",kpis:[{l:"Assets Delivered",v:"18"},{l:"Videos",v:"4"},{l:"Graphics",v:"14"}]}
          ].map(d=><div key={d.dept}style={{background:`linear-gradient(135deg,${d.color}ee,${d.color}cc)`,borderRadius:12,padding:"18px 24px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12,fontFamily:F}}>{d.dept}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {d.kpis.map(k=><div key={k.l}style={{textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:"#fff",fontFamily:F}}>{k.v}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.8)",fontFamily:F}}>{k.l}</div>
              </div>)}
            </div>
          </div>)}
        </div>
      </div>
    </Section>

    {/* Key Highlights */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Section title="Key Highlights">
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {["Organic traffic up 17% MoM — best month this year","GBP calls up 22% — Google Business optimizations paying off","Facebook Ads cost per lead dropped to $24 (industry avg $35)","TikTok account hit 1,000 followers milestone","18 creative assets delivered on time"].map((h,i)=><div key={i}style={{background:C.cyanL,border:`1px solid ${C.cyan}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:F}}>⭐ {h}</div>)}
        </div>
      </Section>
      <Section title="What's Coming Next Month">
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {["Spring sales campaign launch across all paid channels","Service department content series — 4 videos planned","GBP photo refresh for all locations","Meta Ads audience retargeting buildout","Q2 keyword target list expansion (12 new terms)"].map((h,i)=><div key={i}style={{background:C.bg,border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:F}}>→ {h}</div>)}
        </div>
      </Section>
    </div>
  </div>);
}

/* ─── SEO PAGE ─── */
const trafficData=[{m:"Jul",sessions:5820},{m:"Aug",sessions:6140},{m:"Sep",sessions:5690},{m:"Oct",sessions:6480},{m:"Nov",sessions:6920},{m:"Dec",sessions:7110},{m:"Jan",sessions:6830},{m:"Feb",sessions:7640},{m:"Mar",sessions:8420}];
const trafficMix=[{name:"Organic",value:62,color:C.cyan},{name:"Direct",value:18,color:C.navy},{name:"Paid",value:12,color:C.amber},{name:"Social",value:5,color:"#ec4899"},{name:"Other",value:3,color:C.tl}];
const kwDist=[{range:"Position 1",count:12,fill:"#22c55e"},{range:"Pos 2–3",count:28,fill:C.cyan},{range:"Pos 4–10",count:47,fill:C.navy},{range:"Pos 11–20",count:31,fill:C.amber},{range:"Pos 20+",count:14,fill:C.tl}];

function SeoPage(){
  const[comp,setComp]=useState("MoM");
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>
    <Section title="Key Metrics">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <Kpi label="Phone Calls" value="198" tip="Tracked calls from the website via CallRail." sub={comp==="MoM"?"+14% vs last month":"+39% vs last year"} color={C.cyan}/>
        <Kpi label="Form Submissions" value="114" tip="Contact, trade-in, and finance forms submitted via GA4." sub={comp==="MoM"?"+9% vs last month":"+27% vs last year"} color={C.cyan}/>
        <Kpi label="CTR" value="5.2%" tip="Click-through rate from Google Search results. Higher = better title tags and meta descriptions." sub={comp==="MoM"?"+0.4% vs last month":"+1.1% vs last year"}/>
        <Kpi label="Organic Sessions" value="8,420" tip="Total website visits from organic (unpaid) Google search." sub={comp==="MoM"?"+10.2% vs last month":"+44.7% vs last year"}/>
        <Kpi label="Page 1 Keywords" value="47" tip="Number of target keywords ranking on Google page 1." sub={comp==="MoM"?"+5 vs last month":"+18 vs last year"}/>
        <Kpi label="GBP Calls" value="72" tip="Phone calls made directly from the Google Business Profile listing." sub={comp==="MoM"?"+22% vs last month":"+41% vs last year"}/>
      </div>
    </Section>

    <Section title="Secondary Metrics">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <Kpi label="VDP Views" value="3,240" tip="Vehicle Detail Page views — high-intent shoppers looking at specific inventory." sub="MoM +8%"/>
        <Kpi label="Direction Requests" value="143" tip="Users who requested directions to the dealership from GBP." sub="MoM +11%"/>
        <Kpi label="Chat Conversations" value="67" tip="Chat sessions initiated on the website." sub="MoM +5%"/>
      </div>
    </Section>

    <div style={{display:"flex",gap:20,marginBottom:28}}>
      <div style={{flex:2,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:12,fontFamily:F}}>Organic Traffic Trend</div>
        <ResponsiveContainer width="100%"height={180}>
          <LineChart data={trafficData}><CartesianGrid strokeDasharray="3 3"stroke={C.bd}/><XAxis dataKey="m"tick={{fontSize:11,fontFamily:F}}/><YAxis tick={{fontSize:11,fontFamily:F}}/><Tooltip/>
            <Line type="monotone"dataKey="sessions"stroke={C.cyan}strokeWidth={2.5}dot={{fill:C.cyan,r:3}}name="Organic Sessions"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{flex:1,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:8,fontFamily:F}}>Organic % of Total Traffic</div>
        <PieChart width={160}height={160}>
          <Pie data={trafficMix}cx={80}cy={80}innerRadius={45}outerRadius={72}dataKey="value">
            {trafficMix.map((e,i)=><Cell key={i}fill={e.color}/>)}
          </Pie>
          <Tooltip formatter={(v)=>`${v}%`}/>
        </PieChart>
        <div style={{fontSize:28,fontWeight:800,color:C.cyan,fontFamily:F}}>62%</div>
        <div style={{fontSize:11,color:C.tl,fontFamily:F}}>organic-driven</div>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
      <Section title="Top 10 Queries by Clicks">
        <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}>
            <thead><tr style={{background:C.bg}}><th style={{padding:"8px 12px",textAlign:"left",color:C.tl}}>Query</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Clicks</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Position</th></tr></thead>
            <tbody>{[["ford f-150 twin falls",284,"#3"],["buy truck twin falls idaho",198,"#1"],["ford dealer near me",176,"#1"],["goode motor ford",164,"#1"],["ford truck deals idaho",142,"#2"],["twin falls ford service",128,"#4"],["ford explorer for sale",118,"#3"],["twin falls auto dealer",106,"#2"],["certified used ford twin falls",94,"#5"],["ford maverick hybrid idaho",87,"#6"]].map(([q,c,p],i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}>
              <td style={{padding:"8px 12px",color:C.navy}}>{q}</td>
              <td style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>{c}</td>
              <td style={{padding:"8px 12px",textAlign:"right"}}><span style={{background:Number(p.replace("#",""))<=3?"#dcfce7":Number(p.replace("#",""))<=10?C.cyanL:"#fef9c3",color:Number(p.replace("#",""))<=3?"#166534":Number(p.replace("#",""))<=10?C.cyanD:"#854d0e",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{p}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </Section>

      <div>
        <Section title="Top 5 Rising Queries">
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
            {[["ford lightning twin falls","+140%","#8"],["electric truck idaho","+98%","#12"],["ford bronco deals","+76%","#5"],["used trucks under 30000 twin falls","+64%","#9"],["ford service center hours","+51%","#6"]].map(([q,ch,p],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,fontFamily:F}}>
              <span style={{color:C.navy}}>{q}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:C.g,fontWeight:700}}>{ch}</span>
                <span style={{background:C.cyanL,color:C.cyanD,borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600}}>{p}</span>
              </div>
            </div>)}
          </div>
        </Section>
        <Section title="Keyword Position Distribution">
          <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:16}}>
            <ResponsiveContainer width="100%"height={140}>
              <BarChart data={kwDist}layout="vertical">
                <XAxis type="number"tick={{fontSize:11,fontFamily:F}}/>
                <YAxis dataKey="range"type="category"width={80}tick={{fontSize:11,fontFamily:F}}/>
                <Tooltip/><Bar dataKey="count"radius={[0,4,4,0]}>{kwDist.map((e,i)=><Cell key={i}fill={e.fill}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </div>

    <Section title="Competitor Comparison">
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:13}}>
          <thead><tr style={{background:C.bg}}><th style={{padding:"10px 16px",textAlign:"left",color:C.tl}}>Competitor</th><th style={{padding:"10px 16px",textAlign:"right",color:C.tl}}>Est. Traffic</th><th style={{padding:"10px 16px",textAlign:"right",color:C.tl}}>Ranking KWs</th><th style={{padding:"10px 16px",textAlign:"right",color:C.tl}}>Overlap</th></tr></thead>
          <tbody>{[["Goode Motor Ford (You)",8420,132,"—",true],["Magic Valley Ford",5910,98,"42 KWs",false],["Carbaglio's Auto Sales",3240,54,"28 KWs",false],["Twin Falls Toyota",6820,118,"19 KWs",false]].map(([n,t,k,o,me],i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`,background:me?"#f0f9ff":"transparent"}}>
            <td style={{padding:"10px 16px",fontWeight:me?700:400,color:me?C.navy:C.tl}}>{n}{me&&<span style={{marginLeft:6,background:C.cyan,color:C.navy,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700}}>YOU</span>}</td>
            <td style={{padding:"10px 16px",textAlign:"right",fontWeight:600}}>{t.toLocaleString()}</td>
            <td style={{padding:"10px 16px",textAlign:"right"}}>{k}</td>
            <td style={{padding:"10px 16px",textAlign:"right",color:C.tl,fontSize:12}}>{o}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </Section>

    <Section title="Pages Built & Optimized">
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["New Ford F-150 Lightning in Twin Falls","Feb 28","ford lightning twin falls, electric truck idaho"],["Ford Service Special Offers Page","Feb 14","ford service twin falls, oil change twin falls idaho"],["Used Trucks Under $30,000","Feb 7","used trucks twin falls, affordable trucks idaho"]].map(([t,d,kw],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,padding:"12px 16px",fontFamily:F}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <a href="#"style={{color:C.cyan,fontWeight:600,fontSize:13,textDecoration:"none"}}>{t}</a>
            <span style={{fontSize:11,color:C.tl}}>Published {d}</span>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{kw.split(", ").map(k=><span key={k}style={{background:C.cyanL,color:C.cyanD,borderRadius:4,padding:"2px 8px",fontSize:11}}>{k}</span>)}</div>
        </div>)}
      </div>
    </Section>

    <WorkDone items={[{task:"Meta Title & Description Optimization",desc:"Updated 14 VDP and service pages — targeting higher CTR from search results."},{task:"Local Citation Audit",desc:"Found and corrected 6 inconsistent NAP entries across 12 directories."},{task:"March Content Calendar",desc:"Planned and briefed 4 SEO blog posts targeting spring buyers."},{task:"Core Web Vitals Review",desc:"Identified 3 pages with slow LCP — flagged for dev fix next sprint."},{task:"GBP Post Publishing",desc:"Published 8 posts across profile including specials and event updates."}]}/>
    <WinLoss wins={["Organic traffic hit 8,420 — highest month ever","47 page 1 keywords — up 5 from last month","'ford f-150 twin falls' moved from #5 to #3"]}losses={["CTR on service pages below 4% — needs title tag rewrites","3 Core Web Vitals failures on high-traffic pages"]}/>
    <NextMonth items={["Rewrite meta descriptions on 8 underperforming service pages","Publish 4 SEO blogs targeting spring truck buyers","Fix Core Web Vitals failures — coordinate with dev","Launch 'Ford EV' landing page targeting growing EV queries","Expand GBP post cadence to 2x/week"]}/>
  </div>);
}

/* ─── GBP PAGE ─── */
function GbpPage(){
  const[comp,setComp]=useState("MoM");
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>
    <Section title="Key Metrics">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Profile Views",v:"4,210",t:"Total times your GBP profile was seen."},{l:"Search Appearances",v:"9,840",t:"Times your business appeared in Google Search results."},{l:"Map Views",v:"1,620",t:"Times your location appeared in Google Maps."},{l:"Website Clicks",v:"387",t:"Clicks from GBP to your website."},{l:"Phone Calls",v:"72",t:"Calls made directly from the GBP listing."},{l:"Direction Requests",v:"143",t:"Users who requested directions to your dealership."}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.t}sub={comp==="MoM"?"+14% vs last month":"+33% vs last year"}/>)}
      </div>
    </Section>

    <Section title="Reviews">
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <div style={{display:"flex",gap:32,alignItems:"center",marginBottom:20}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:48,fontWeight:800,color:C.navy,fontFamily:F}}>4.7</div><div style={{color:C.amber,fontSize:22}}>★★★★★</div><div style={{fontSize:12,color:C.tl,fontFamily:F}}>312 reviews</div></div>
          <div style={{flex:1,display:"flex",gap:16}}>{[{l:"New Reviews",v:"+8",c:C.g},{l:"Review Responses",v:"8/8",c:C.cyan},{l:"Avg Response Time",v:"4 hrs",c:C.navy},{l:"Photos",v:"24",c:C.tl}].map(k=><Kpi key={k.l}label={k.l}value={k.v}color={k.c}/>)}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[["Mike R.","5","Really impressed with the team here. Jake in sales was upfront and honest.","Feb 22"],["Sarah T.","5","Best car buying experience I've ever had. Will be back for my next vehicle.","Feb 18"],["Tom D.","4","Good service department, quick oil change. Waiting area could use an update.","Feb 11"],["Angela M.","5","They found exactly what I was looking for within my budget. Highly recommend.","Feb 5"]].map(([n,s,r,d],i)=><div key={i}style={{background:C.bg,borderRadius:8,padding:"12px 16px",fontFamily:F}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontWeight:600,color:C.navy,fontSize:13}}>{n}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:C.amber}}>{"★".repeat(Number(s))}</span><span style={{fontSize:11,color:C.tl}}>{d}</span></div>
            </div>
            <p style={{fontSize:12,color:C.tl,margin:0}}>{r}</p>
          </div>)}
        </div>
      </div>
    </Section>

    <Section title="GBP Posts Published">
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}>
          <thead><tr style={{background:C.bg}}><th style={{padding:"8px 12px",textAlign:"left",color:C.tl}}>Post</th><th style={{padding:"8px 12px",color:C.tl}}>Type</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Date</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Views</th></tr></thead>
          <tbody>{[["Presidents Day Sales Event","Event","Feb 12",824],["New F-150 Lightning Arrivals","Update","Feb 9",612],["Service Specials February","Offer","Feb 5",541],["Truck Month — Best Selection in Idaho","Update","Feb 2",498],["Employee Spotlight — Jake Wilson","Update","Jan 29",387],["Finance Specials — 0% APR Offer","Offer","Jan 26",712],["New Inventory Alert — Explorer","Update","Jan 22",334],["Certified Pre-Owned Ford Event","Event","Jan 18",445]].map(([t,ty,d,v],i)=>{const tc={Event:C.amber,Update:C.cyan,Offer:C.g};return(<tr key={i}style={{borderTop:`1px solid ${C.bd}`}}><td style={{padding:"8px 12px",color:C.navy}}>{t}</td><td style={{padding:"8px 12px",textAlign:"center"}}><span style={{background:tc[ty]+"22",color:tc[ty],borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600}}>{ty}</span></td><td style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>{d}</td><td style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>{v.toLocaleString()}</td></tr>);})}
          </tbody>
        </table>
      </div>
    </Section>

    <WorkDone items={[{task:"Weekly GBP Posts",desc:"Published 8 posts covering events, offers, and inventory updates."},{task:"Review Response",desc:"Responded to all 8 new reviews within 4 hours."},{task:"Photo Refresh",desc:"Added 6 new exterior and showroom photos."},{task:"Holiday Hours Update",desc:"Updated Presidents Day hours across the profile."},{task:"Q&A Monitoring",desc:"Answered 3 new customer questions in the Q&A section."}]}/>
    <WinLoss wins={["All 8 reviews responded to — 100% response rate","Profile views up 14% MoM","8 posts published — hit our target cadence"]}losses={["2 unanswered Q&A questions found from January — now resolved"]}/>
    <NextMonth items={["Increase post cadence to 10/month for March","Schedule spring photo shoot — exterior + inventory","Launch QR code cards for in-store review requests","Prepare March Madness themed posts","Audit and update all business categories"]}/>
  </div>);
}

/* ─── GOOGLE ADS PAGE ─── */
const adTrend=[{m:"Oct",conv:124},{m:"Nov",conv:141},{m:"Dec",conv:158},{m:"Jan",conv:147},{m:"Feb",conv:169},{m:"Mar",conv:184}];
function GoogleAdsPage(){
  const[comp,setComp]=useState("MoM");
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>
    <Section title="Key Metrics">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Conversions",v:"184",t:"Total tracked conversions from paid search ads.",c:C.cyan},{l:"Cost / Lead",v:"$31",t:"Average cost to generate one conversion. Industry avg: $25–$45.",c:C.g},{l:"Total Spend",v:"$5,720",t:"Total ad spend this period.",c:C.navy},{l:"CTR",v:"9.1%",t:"Click-through rate. Industry avg: 8.29%."},{l:"Avg CPC",v:"$2.18",t:"Average cost per click. Industry avg: $2.41."},{l:"Impression Share",v:"68%",t:"% of eligible searches you appeared for. Higher = more visibility."}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.t}color={k.c}sub={comp==="MoM"?"+8.9% vs last month":"+32% vs last year"}/>)}
      </div>
    </Section>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:12,fontFamily:F}}>Conversion Trend</div>
        <ResponsiveContainer width="100%"height={160}><LineChart data={adTrend}><CartesianGrid strokeDasharray="3 3"stroke={C.bd}/><XAxis dataKey="m"tick={{fontSize:11,fontFamily:F}}/><YAxis tick={{fontSize:11,fontFamily:F}}/><Tooltip/><Line type="monotone"dataKey="conv"stroke={C.cyan}strokeWidth={2.5}name="Conversions"/></LineChart></ResponsiveContainer>
      </div>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:12,fontFamily:F}}>Performance Max Channel Split</div>
        {[{ch:"Search",pct:42,c:C.navy},{ch:"YouTube",pct:24,c:C.r},{ch:"Display",pct:18,c:C.cyan},{ch:"Maps",pct:10,c:C.g},{ch:"Gmail",pct:6,c:C.amber}].map(r=><div key={r.ch}style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:F,marginBottom:3}}><span>{r.ch}</span><span style={{fontWeight:600}}>{r.pct}%</span></div><div style={{background:C.bd,borderRadius:4,height:8}}><div style={{background:r.c,borderRadius:4,height:8,width:`${r.pct}%`}}/></div></div>)}
      </div>
    </div>
    <Section title="Campaign Breakdown">
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}>
          <thead><tr style={{background:C.bg}}>{["Campaign","Type","Spend","Impressions","Clicks","CTR","CPC","Conv.","Cost/Conv."].map(h=><th key={h}style={{padding:"8px 12px",textAlign:h==="Campaign"||h==="Type"?"left":"right",color:C.tl,fontWeight:500}}>{h}</th>)}</tr></thead>
          <tbody>{[["Search — New Vehicles","Search","$2,140","48,200","4,380","9.1%","$0.49","84","$25.48"],["Performance Max","PMax","$1,820","124,000","3,210","2.6%","$0.57","62","$29.35"],["Vehicle Listing Ads","VLA","$980","38,400","2,940","7.7%","$0.33","24","$40.83"],["Display Remarketing","Display","$480","210,000","1,890","0.9%","$0.25","10","$48.00"],["YouTube Ads","YouTube","$300","18,600","420","2.3%","$0.71","4","$75.00"]].map((r,i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}>{r.map((c,j)=><td key={j}style={{padding:"8px 12px",textAlign:j<=1?"left":"right",color:j===0?C.navy:C.tl,fontWeight:j===0?500:400}}>{c}</td>)}</tr>)}
          <tr style={{borderTop:`2px solid ${C.bd}`,background:C.bg,fontWeight:700}}><td style={{padding:"8px 12px"}}>Totals</td><td style={{padding:"8px 12px"}}></td><td style={{padding:"8px 12px",textAlign:"right"}}>$5,720</td><td style={{padding:"8px 12px",textAlign:"right"}}>438,800</td><td style={{padding:"8px 12px",textAlign:"right"}}>12,840</td><td style={{padding:"8px 12px",textAlign:"right"}}>2.9%</td><td style={{padding:"8px 12px",textAlign:"right"}}>$0.45</td><td style={{padding:"8px 12px",textAlign:"right"}}>184</td><td style={{padding:"8px 12px",textAlign:"right"}}>$31.09</td></tr>
          </tbody>
        </table>
      </div>
    </Section>
    <WorkDone items={[{task:"PMax Asset Refresh",desc:"Uploaded 8 new images and 2 video assets for Performance Max campaigns."},{task:"Negative Keyword Audit",desc:"Added 34 negative keywords to eliminate irrelevant clicks."},{task:"VLA Feed Optimization",desc:"Updated vehicle pricing and descriptions in feed — reduced disapprovals by 12."},{task:"Budget Reallocation",desc:"Shifted $200/mo from Display to Search based on conversion data."},{task:"Ad Copy A/B Test",desc:"Launched test on Search campaign — 4 new headlines, results in 2 weeks."}]}/>
    <WinLoss wins={["CTR at 9.1% — above industry avg of 8.29%","Cost per lead at $31 — within target $25–$45 range","Search campaign producing $25 CPL — best performing"]}losses={["YouTube CPL at $75 — too high; creative needs refresh","Display remarketing showing low engagement — audience list needs rebuild"]}/>
    <NextMonth items={["Refresh YouTube ad creative with new vehicle footage","Rebuild Display remarketing audience lists","Launch spring incentive Search ads for F-150 Lightning","Test higher PMax budget allocation","Optimize VLA titles and descriptions for click-through"]}/>
  </div>);
}

/* ─── META ADS PAGE ─── */
function MetaAdsPage(){
  const[comp,setComp]=useState("MoM");
  const placementData=[{name:"FB Feed",spend:1240,conv:48},{name:"IG Feed",spend:980,conv:36},{name:"Reels",spend:720,conv:24},{name:"Stories",spend:440,conv:11},{name:"Marketplace",spend:220,conv:6},{name:"Messenger",spend:80,conv:2}];
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>
    <Section title="Key Metrics">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Conversions",v:"127",t:"Total tracked conversions from Meta ads.",c:C.cyan},{l:"Cost / Lead",v:"$24",t:"Average cost per lead. Industry avg: $35.",c:C.g},{l:"Reach",v:"42.8K",t:"Unique people who saw your ads."},{l:"Avg CPC",v:"$0.71",t:"Cost per click. Industry avg: ~$0.79."},{l:"Frequency",v:"2.4",t:"Average times each person saw your ad. Over 3.0 = ad fatigue risk."},{l:"Engagement Rate",v:"4.9%",t:"Likes, comments, and shares as a % of reach."}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.t}color={k.c}sub={comp==="MoM"?"+11% vs last month":"+44% vs last year"}/>)}
      </div>
    </Section>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:12,fontFamily:F}}>Placement Performance</div>
        <ResponsiveContainer width="100%"height={180}><BarChart data={placementData}><CartesianGrid strokeDasharray="3 3"stroke={C.bd}/><XAxis dataKey="name"tick={{fontSize:10,fontFamily:F}}/><YAxis tick={{fontSize:11,fontFamily:F}}/><Tooltip/><Legend/><Bar dataKey="spend"fill={C.navy}name="Spend ($)"/><Bar dataKey="conv"fill={C.cyan}name="Conversions"/></BarChart></ResponsiveContainer>
      </div>
      <Section title="Meta-Specific Metrics">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[{l:"Lead Form Completion Rate",v:"68%",t:"Of people who opened a Lead Ad form, 68% submitted it."},{l:"Video Completion Rate (25%)",v:"82%",t:"82% of viewers watched at least 25% of your video ads."},{l:"Video Completion Rate (75%)",v:"41%",t:"41% watched 75% or more."},{l:"Cost per VDP View",v:"$4.20",t:"Cost to get one shopper to view a specific vehicle listing."}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.t}/>)}
        </div>
      </Section>
    </div>
    <Section title="Top Performing Ads">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[["Presidents Day Truck Sale — Video Ad","Video","Reels + FB Feed",420,"6.8%","$18"],["New F-150 Lightning — Inventory Ad","Dynamic","FB Feed + IG",284,"4.1%","$22"],["0% APR Finance Offer — Static","Image","FB Feed",198,"3.9%","$28"],["Service Coupon — Lead Ad","Lead Form","FB Feed + Messenger",142,"8.2%","$14"]].map(([n,ty,pl,eng,er,cpl],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:16,fontFamily:F}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontWeight:600,color:C.navy,fontSize:13}}>{n}</span>
            <div style={{display:"flex",gap:8}}><span style={{background:C.cyanL,color:C.cyanD,borderRadius:4,padding:"2px 8px",fontSize:11}}>{ty}</span><span style={{background:"#f3f4f6",color:C.tl,borderRadius:4,padding:"2px 8px",fontSize:11}}>{pl}</span></div>
          </div>
          <div style={{display:"flex",gap:24,fontSize:12,color:C.tl}}>
            <span>Engagements: <strong style={{color:C.navy}}>{eng.toLocaleString()}</strong></span>
            <span>Eng Rate: <strong style={{color:C.navy}}>{er}</strong></span>
            <span>CPL: <strong style={{color:C.g}}>{cpl}</strong></span>
          </div>
        </div>)}
      </div>
    </Section>
    <WorkDone items={[{task:"Creative Refresh",desc:"Uploaded new F-150 Lightning video ad — swapped in for underperforming static image."},{task:"Audience Rebuild",desc:"Rebuilt retargeting audience based on VDP visitors from last 30 days."},{task:"Lead Ad Optimization",desc:"Reduced form fields from 5 to 3 — completion rate increased from 51% to 68%."},{task:"Budget Reallocation",desc:"Shifted spend toward Reels placements based on CPL data."},{task:"Dynamic Inventory Setup",desc:"Verified vehicle catalog feed — 214 vehicles syncing correctly."}]}/>
    <WinLoss wins={["CPL at $24 — 31% below industry avg of $35","Lead form completion rate at 68% after form simplification","Reels placement showing lowest CPL at $18"]}losses={["Frequency at 2.4 — approaching fatigue threshold, need new creative","Messenger placement underperforming — only 2 conversions"]}/>
    <NextMonth items={["Launch spring truck sale creative package","Pause Messenger placement — reallocate to Reels","Build lookalike audience from recent buyers","Test video testimonial ad format","Expand Dynamic Inventory ads to cover full certified pre-owned stock"]}/>
  </div>);
}

/* ─── ORGANIC SOCIAL PAGE ─── */
const reachData=[{m:"Oct",reach:48200},{m:"Nov",reach:54800},{m:"Dec",reach:61200},{m:"Jan",reach:72400},{m:"Feb",reach:81600},{m:"Mar",reach:89400}];
function SocialPage(){
  const[comp,setComp]=useState("MoM");
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>
    <Section title="Monthly Overview">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Total Reach",v:"89.4K",t:"Unique people who saw your content this month."},{l:"Total Engagement",v:"5,540",t:"Likes, comments, shares, and saves across all platforms."},{l:"New Followers",v:"+248",t:"Net new followers gained this month across all platforms.",c:C.g},{l:"Posts Published",v:"34",t:"Total posts across all platforms this month."},{l:"Videos Published",v:"12",t:"Video posts including Reels, TikTok, and YouTube."},{l:"Website Clicks",v:"614",t:"Clicks from social media to your website.",c:C.cyan}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.t}color={k.c}sub={comp==="MoM"?"+9.6% vs last month":"+86% vs last year"}/>)}
      </div>
    </Section>
    <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:20,marginBottom:28}}>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:12,fontFamily:F}}>Monthly Reach Trend</div>
        <ResponsiveContainer width="100%"height={180}><BarChart data={reachData}><CartesianGrid strokeDasharray="3 3"stroke={C.bd}/><XAxis dataKey="m"tick={{fontSize:11,fontFamily:F}}/><YAxis tick={{fontSize:11,fontFamily:F}}/><Tooltip/><Bar dataKey="reach"fill={C.cyan}radius={[4,4,0,0]}name="Reach"/></BarChart></ResponsiveContainer>
      </div>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,marginBottom:12,fontFamily:F}}>New Followers by Platform</div>
        {[{p:"Instagram",n:98,c:"#e1306c"},{p:"TikTok",n:84,c:"#010101"},{p:"Facebook",n:42,c:"#1877f2"},{p:"YouTube",n:18,c:"#ff0000"},{p:"X / Twitter",n:6,c:"#1da1f2"}].map(r=><div key={r.p}style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:F,marginBottom:3}}><span>{r.p}</span><span style={{fontWeight:700,color:r.c}}>+{r.n}</span></div><div style={{background:C.bd,borderRadius:4,height:7}}><div style={{background:r.c,borderRadius:4,height:7,width:`${(r.n/98)*100}%`}}/></div></div>)}
      </div>
    </div>
    <Section title="Top Performing Content">
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[["Presidents Day Truck Reveal — Lot Walkthrough","Video",{YT:"4,820",FB:"3,210",IG:"7,640",TT:"18,200",X:"420"},"8.2%"],["F-150 Lightning First Drive Reaction","Video",{YT:"2,940",FB:"1,820",IG:"4,110",TT:"12,800",X:"280"},"7.4%"],["Customer Delivery Day — Smile Compilation","Video",{YT:"1,280",FB:"2,640",IG:"3,920",TT:"8,440",X:"180"},"11.2%"],["Truck vs Snow: Idaho Winter Test","Video",{YT:"6,420",FB:"4,180",IG:"5,640",TT:"22,100",X:"540"},"9.8%"],["Trade-In Value — How We Calculate It","Image",{YT:"—",FB:"1,840",IG:"2,280",TT:"—",X:"120"},"5.1%"]].map(([title,type,platforms,er],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:16,fontFamily:F}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontWeight:600,color:C.navy,fontSize:13}}>{title}</span>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{background:type==="Video"?C.cyanL:"#f3f4f6",color:type==="Video"?C.cyanD:C.tl,borderRadius:4,padding:"2px 8px",fontSize:11}}>{type}</span><span style={{fontSize:12,color:C.tl}}>Eng Rate: <strong style={{color:C.navy}}>{er}</strong></span></div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {Object.entries(platforms).map(([p,v])=><div key={p}style={{background:C.bg,borderRadius:6,padding:"4px 10px",textAlign:"center",minWidth:70}}>
              <div style={{fontSize:11,fontWeight:700,color:C.navy}}>{v}</div>
              <div style={{fontSize:10,color:C.tl}}>{p}</div>
            </div>)}
          </div>
        </div>)}
      </div>
    </Section>
    <Section title="Platform Breakdown">
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}>
          <thead><tr style={{background:C.bg}}>{["Platform","Followers","Growth","Views","Engagement","Posts"].map(h=><th key={h}style={{padding:"8px 12px",textAlign:h==="Platform"?"left":"right",color:C.tl,fontWeight:500}}>{h}</th>)}</tr></thead>
          <tbody>{[["YouTube","1,240","+18",14820,"4.8%","8"],["Facebook","3,840","+42",18640,"3.2%","12"],["Instagram","2,180","+98",21480,"6.8%","18"],["TikTok","1,020","+84",34200,"9.4%","10"],["X / Twitter","640","+6",4180,"1.1%","6"]].map((r,i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}>{r.map((c,j)=><td key={j}style={{padding:"8px 12px",textAlign:j===0?"left":"right",color:j===2?C.g:j===0?C.navy:C.tl,fontWeight:j===0||j===2?600:400}}>{c}</td>)}</tr>)}
          <tr style={{borderTop:`2px solid ${C.bd}`,background:C.bg,fontWeight:700}}><td style={{padding:"8px 12px"}}>Totals</td><td style={{padding:"8px 12px",textAlign:"right"}}>8,920</td><td style={{padding:"8px 12px",textAlign:"right",color:C.g}}>+248</td><td style={{padding:"8px 12px",textAlign:"right"}}>93,320</td><td style={{padding:"8px 12px",textAlign:"right"}}>6.2%</td><td style={{padding:"8px 12px",textAlign:"right"}}>54</td></tr>
          </tbody>
        </table>
      </div>
    </Section>
    <WorkDone items={[{task:"Content Production",desc:"Shot and edited 12 videos including lot walkthroughs, delivery days, and F-150 Lightning content."},{task:"Cross-Platform Publishing",desc:"Distributed 34 posts across 5 platforms with platform-specific formatting."},{task:"Community Management",desc:"Responded to 84 comments and DMs across all platforms within 24 hours."},{task:"Hashtag Research",desc:"Updated hashtag sets for Instagram and TikTok — added 6 high-volume automotive tags."},{task:"Analytics Review",desc:"Identified TikTok as highest-reach platform — shifted video-first to TikTok."}]}/>
    <WinLoss wins={["TikTok truck snow test video hit 22K views — best performing single piece","Instagram followers grew 4.7% in one month","Engagement rate at 6.2% — well above automotive avg of 4.8%"]}losses={["X / Twitter consistently underperforming — 1.1% engagement, only +6 followers","YouTube subscriber growth slow despite high view counts"]}/>
    <NextMonth items={["Launch 4-part service department video series","March Madness bracket content — tie to sales event","Push Reels format on Instagram to match TikTok strategy","Create YouTube Shorts versions of top TikTok content","Build March content calendar by Feb 28"]}/>
  </div>);
}

/* ─── EMAIL PAGE ─── */
function EmailPage(){
  const[comp,setComp]=useState("MoM");
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>
    <Section title="Monthly Summary">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Campaigns Sent",v:"3",t:"Total email campaigns deployed this month."},{l:"Total Recipients",v:"4,820",t:"Total emails delivered across all campaigns."},{l:"Website Visits from Email",v:"284",t:"GA4-tracked sessions attributed to email campaigns via UTM links.",c:C.cyan},{l:"Conversions from Email",v:"18",t:"Form submissions or calls tracked from email-originated sessions.",c:C.g}].map(k=><Kpi key={k.l}label={k.l}value={k.v}tip={k.t}color={k.c}sub={comp==="MoM"?"+12% vs last month":"+28% vs last year"}/>)}
      </div>
    </Section>
    <Section title="Aggregate Trends">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[{l:"Total Recipients YTD",v:"14,460",sub:"vs 11,200 same period last year"},{l:"Website Visits from Email YTD",v:"842",sub:"vs 590 same period last year"},{l:"Conversions from Email YTD",v:"54",sub:"vs 38 same period last year"}].map(k=><Kpi key={k.l}label={k.l}value={k.v}sub={k.sub}/>)}
      </div>
    </Section>
    <Section title="Campaign Showcase">
      {[{name:"Presidents Day Truck Sale",date:"Feb 12",recipients:2240,visits:142,conv:8,subject:"🏆 Presidents Day | Best Deals on New & Used Trucks"},
        {name:"February Finance Specials",date:"Feb 5",recipients:1580,visits:86,conv:6,subject:"0% APR for 60 Months | Limited Time Offer"},
        {name:"Service Coupon — Winter Tune-Up",date:"Jan 28",recipients:1000,visits:56,conv:4,subject:"Save $40 on Your Winter Service Appointment"}].map((c,i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div><div style={{fontSize:15,fontWeight:700,color:C.navy,fontFamily:F}}>{c.name}</div><div style={{fontSize:12,color:C.tl,fontFamily:F,marginTop:2}}>Subject: {c.subject}</div></div>
          <div style={{fontSize:12,color:C.tl,fontFamily:F}}>{c.date}</div>
        </div>
        <div style={{display:"flex",gap:12,marginBottom:16}}>
          <Kpi label="Recipients" value={c.recipients.toLocaleString()}/>
          <Kpi label="Site Visits" value={c.visits} color={C.cyan}/>
          <Kpi label="Conversions" value={c.conv} color={C.g}/>
        </div>
        <div style={{background:C.bg,borderRadius:8,padding:16,textAlign:"center",fontSize:13,color:C.tl,fontFamily:F,fontStyle:"italic"}}>[Email creative displayed here — upload via admin panel]</div>
      </div>)}
    </Section>
    <WorkDone items={[{task:"Presidents Day Campaign",desc:"Designed, built, and deployed email to 2,240 truck-segment contacts."},{task:"Finance Special Blast",desc:"Segmented list to finance-qualified leads — 1,580 recipients."},{task:"Service Coupon",desc:"Service customer segment — 1,000 recipients. UTM links configured."},{task:"UTM Tagging",desc:"All 3 campaigns tagged with UTM parameters for GA4 tracking."}]}/>
    <WinLoss wins={["All 3 campaigns delivered without errors","Presidents Day email drove 142 website visits in 48 hours","UTM tracking live on all campaigns — conversion attribution now measurable"]}losses={["No CRM open rate data available — implementing tracking next month"]}/>
    <NextMonth items={["St. Patrick's Day special — target service customers","Spring EV announcement campaign — Lightning buyers list","Implement CRM open rate tracking","Build subscriber segment for commercial fleet customers"]}/>
  </div>);
}

/* ─── CREATIVE PAGE ─── */
function CreativePage(){
  const[comp,setComp]=useState("MoM");
  return(<div style={{padding:24}}>
    <CompToggle mode={comp} setMode={setComp}/>
    <Section title="Monthly Summary">
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[{l:"Total Assets Delivered",v:"18"},{l:"Videos Produced",v:"4"},{l:"Graphics / Statics",v:"11"},{l:"Print Pieces",v:"3"}].map(k=><Kpi key={k.l}label={k.l}value={k.v}sub={comp==="MoM"?"+6 vs last month":"+7 vs last year"}/>)}
      </div>
    </Section>
    <Section title="Deliverables Timeline">
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["Feb 28","Presidents Day Video — Lot Walkthrough","Video","TikTok, Instagram Reels, YouTube"],["Feb 26","F-150 Lightning Feature Graphic","Graphic","Instagram, Facebook, GBP"],["Feb 24","Presidents Day Email Header","Graphic","Email Campaign"],["Feb 21","Service Department Banner — Website","Banner","Website"],["Feb 19","Trade-In Process Explainer Video","Video","YouTube, Facebook"],["Feb 16","February Specials Social Graphics (set of 4)","Graphic","All Social Platforms"],["Feb 12","Presidents Day Direct Mailer","Print","Direct Mail — 8,000 households"],["Feb 10","New Arrivals Reel — F-150 Stock","Video","Instagram Reels, TikTok"],["Feb 7","GBP Post Graphics (set of 4)","Graphic","Google Business Profile"],["Feb 5","Finance Special Email Creative","Graphic","Email Campaign"],["Feb 3","Used Truck Feature Video","Video","YouTube, Facebook, TikTok"],["Jan 30","March Content Calendar Storyboards","Print","Internal Planning"],["Jan 28","Service Coupon Print Ad","Print","Print Media"],["Jan 25","Social Story Templates (set of 6)","Graphic","Instagram, Facebook Stories"]].map(([d,n,ty,dest],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,padding:"12px 16px",fontFamily:F,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:70,textAlign:"center",background:C.bg,borderRadius:6,padding:"4px 0",flexShrink:0}}>
            <div style={{fontSize:10,color:C.tl}}>{d.split(" ")[0]}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{d.split(" ").slice(1).join(" ")}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,color:C.navy,fontSize:13,marginBottom:4}}>{n}</div>
            <div style={{fontSize:11,color:C.tl}}>→ {dest}</div>
          </div>
          <span style={{background:{Video:C.cyanL,Graphic:"#fef3c7",Banner:"#ede9fe",Print:"#fce7f3"}[ty],color:{Video:C.cyanD,Graphic:C.amber,Banner:"#7c3aed",Print:"#be185d"}[ty],borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,flexShrink:0}}>{ty}</span>
        </div>)}
      </div>
    </Section>
    <NextMonth items={["Spring campaign creative package — 6 graphics + 2 videos","Service reminder postcard — 10,000 household direct mail","March Madness social series — 8 posts","F-150 Lightning landing page hero image","GBP photo shoot — interior, exterior, team"]}/>
  </div>);
}

/* ─── BENCHMARKS PAGE ─── */
function BenchmarksPage(){
  const bms=[
    {dept:"SEO",metrics:[["Organic CTR","5.2%","2.0–4.0%","Above"],["Page 1 Keywords","47","30–50","Within"],["MoM Traffic Growth","+10.2%","5–8%","Above"],["GBP Call Volume","72","40–80","Within"],["Review Rating","4.7","4.5+","Above"],["Review Response Rate","100%","70–90%","Above"]]},
    {dept:"Google Ads",metrics:[["CTR","9.1%","8.29%","Above"],["CPC","$2.18","$2.41","Above"],["Conversion Rate","3.2%","2.5–4%","Within"],["Cost Per Lead","$31","$25–$45","Within"],["Impression Share","68%","60–75%","Within"],["Return on Ad Spend","4.2x","3–5x","Within"]]},
    {dept:"Meta Ads",metrics:[["CPC","$0.71","$0.79","Above"],["Cost Per Lead","$24","$25–$45","Above"],["Engagement Rate","4.9%","3–5%","Within"],["Reach / Spend","$0.083/reach","$0.10–$0.15","Above"],["Lead Form Completion","68%","40–60%","Above"],["Frequency","2.4","1.5–3.0","Within"]]},
    {dept:"Organic Social",metrics:[["Instagram Engagement","6.8%","4.8%","Above"],["TikTok Engagement","9.4%","5–10%","Within"],["Facebook Engagement","3.2%","1–3%","Above"],["Follower Growth Rate","2.9%","1–3%","Within"],["Video Completion Rate (25%)","82%","60–75%","Above"],["Post Frequency","54/mo","30–60","Within"]]},
    {dept:"GBP",metrics:[["Review Rating","4.7","4.0+","Above"],["Review Response Rate","100%","70%+","Above"],["Monthly Profile Views","4,210","2,000–5,000","Within"],["Monthly Phone Calls","72","40–100","Within"],["Direction Requests","143","80–200","Within"],["Photo Count","24","20+","Above"]]},
    {dept:"Email",metrics:[["Campaign Frequency","3/mo","2–4","Within"],["Site Visits per Campaign","94.7","50–150","Within"],["Conv. Rate from Email","6.3%","2–8%","Within"],["List Growth","Stable","Stable","Within"],["UTM Tracking","100%","100%","Above"],["Delivery Rate","99%","95%+","Above"]]},
  ];
  const statusColor={Above:{bg:"#dcfce7",c:"#166534"},Within:{bg:"#fef9c3",c:"#854d0e"},Below:{bg:"#fee2e2",c:"#991b1b"}};
  const above=bms.flatMap(b=>b.metrics).filter(m=>m[3]==="Above").length;
  const within=bms.flatMap(b=>b.metrics).filter(m=>m[3]==="Within").length;
  return(<div style={{padding:24}}>
    <Section title="Performance Scorecard">
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
        {[{l:"Above Benchmark",v:above,c:C.g},{l:"Within Benchmark",v:within,c:C.amber},{l:"Below Benchmark",v:0,c:C.r}].map(k=><Kpi key={k.l}label={k.l}value={k.v}color={k.c}/>)}
      </div>
    </Section>
    {bms.map(b=><Section key={b.dept}title={`${b.dept} Benchmarks`}>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}>
          <thead><tr style={{background:C.bg}}>{["Metric","Your Number","Industry Benchmark","Status"].map(h=><th key={h}style={{padding:"8px 12px",textAlign:h==="Status"?"center":"left",color:C.tl,fontWeight:500}}>{h}</th>)}</tr></thead>
          <tbody>{b.metrics.map(([met,you,ind,stat],i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}>
            <td style={{padding:"8px 12px",color:C.navy,fontWeight:500}}>{met}</td>
            <td style={{padding:"8px 12px",fontWeight:700,color:C.navy}}>{you}</td>
            <td style={{padding:"8px 12px",color:C.tl}}>{ind}</td>
            <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{background:statusColor[stat].bg,color:statusColor[stat].c,borderRadius:4,padding:"2px 10px",fontSize:11,fontWeight:600}}>{stat}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
    </Section>)}
  </div>);
}

/* ─── ROOT APP ─── */
export default function App(){
  const[session,setSession]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[client,setClient]=useState(CLIENTS[0]);
  const[dateRange,setDateRange]=useState("last_month");
  const[tab,setTab]=useState("Dashboard");

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setAuthLoading(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setSession(session);setAuthLoading(false);});
    return()=>subscription.unsubscribe();
  },[]);

  const handleLogout=async()=>{await supabase.auth.signOut();setSession(null);};

  if(authLoading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,color:C.tl}}>Loading…</div>);
  if(!session)return<LoginPage/>;

  const pages={Dashboard:<DashboardPage/>,SEO:<SeoPage/>,"Google Business":<GbpPage/>,"Google Ads":<GoogleAdsPage/>,"Meta Ads":<MetaAdsPage/>,"Organic Social":<SocialPage/>,"Email":<EmailPage/>,Creative:<CreativePage/>,Benchmarks:<BenchmarksPage/>};

  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:F}}>
    <Header client={client}setClient={setClient}dateRange={dateRange}setDateRange={setDateRange}onLogout={handleLogout}/>
    <TabNav active={tab}setActive={setTab}/>
    <div style={{maxWidth:1280,margin:"0 auto"}}>{pages[tab]||<DashboardPage/>}</div>
  </div>);
}
