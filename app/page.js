'use client';
import{useState,useEffect}from"react";
import{LineChart,Line,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell}from"recharts";
import{supabase}from"../supabase";

const C={white:"#fff",navy:"#0c1a2e",cyan:"#00c9e8",cyanD:"#00a5bf",cyanL:"#e6f9fc",bc:"#1b3254",bl:"#243e63",bb:"#2d5080",t:"#1a1a2e",tm:"#0c1a2e",tl:"#6b7280",bd:"#d0d5dd",bl2:"#e4e7ec",g:"#10b981",gL:"#ecfdf5",r:"#ef4444",o:"#f59e0b",p:"#8b5cf6",sh:"0 2px 6px rgba(0,0,0,0.08)"};
const F="Inter,system-ui,sans-serif";
const CLIENT_ORDER=["Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen","Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet","Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"];
const PR=[{l:"This Month",v:"tm",c:["vs Last Month","vs Same Month Last Year"]},{l:"Last Month",v:"lm",c:["vs Prior Month","vs Same Month Last Year"]},{l:"Last 90 Days",v:"l90",c:["vs Prior 90 Days","vs Same Period Last Year"]},{l:"This Quarter",v:"tq",c:["vs Last Quarter","vs Same Quarter Last Year"]},{l:"Last Quarter",v:"lq",c:["vs Prior Quarter","vs Same Quarter Last Year"]},{l:"This Year",v:"ty",c:["vs Last Year"]},{l:"Custom",v:"cu",c:["vs Prior Period","vs Same Period Last Year"]}];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const GOODE_MOTOR_GROUP="Goode Motor Group";
const JUNEAU_OEM_LABEL={"Juneau Auto Mall":"OEM","Juneau Subaru":"Subaru","Juneau CDJR":"CDJR","Juneau Toyota":"Toyota","Juneau Chevrolet":"Chevrolet","Juneau Honda":"Honda"};

// ─── MAP SUPABASE report_data ROWS → LIVE DATA SHAPE ───
function mapReportData(rd,clientName){
  if(!rd)return null;
  const n=(dept,key)=>{const v=rd[dept]?.[key];return(v!==undefined&&v!==null&&v!=='')? Number(v):null;};
  const s=(dept,key)=>rd[dept]?.[key]||null;
  const isGoode=clientName===GOODE_MOTOR_GROUP;
  const oemLabel=JUNEAU_OEM_LABEL[clientName]||null;
  const isJuneau=!!oemLabel;

  // Leads mapping
  let leadsData;
  if(isGoode){
    const fl=n('leads','ford_leads'),fs=n('leads','ford_sold');
    const ml=n('leads','mazda_leads'),ms=n('leads','mazda_sold');
    const vl=n('leads','vw_leads'),vs=n('leads','vw_sold');
    leadsData={
      _goode:true,
      tl:n('leads','total_leads'),ts:n('leads','total_sold'),
      ford_leads:fl,ford_sold:fs,ford_pct:fl>0&&fs!==null?Math.round((fs/fl)*1000)/10:null,
      mazda_leads:ml,mazda_sold:ms,mazda_pct:ml>0&&ms!==null?Math.round((ms/ml)*1000)/10:null,
      vw_leads:vl,vw_sold:vs,vw_pct:vl>0&&vs!==null?Math.round((vs/vl)*1000)/10:null,
      notes:s('leads','notes'),
    };
  }else if(isJuneau){
    const wb=n('leads','website_leads'),ws=n('leads','website_sold');
    const ol=n('leads','oem_leads'),os=n('leads','oem_sold');
    const fb=n('leads','facebook_leads'),fs=n('leads','facebook_sold');
    leadsData={
      _oemLabel:oemLabel,
      tl:n('leads','total_leads'),wb,ol,fb,
      wS:ws,oS:os,fS:fs,pS:n('leads','phone_sold'),
      wP:wb>0&&ws!==null?Math.round((ws/wb)*1000)/10:null,
      oP:ol>0&&os!==null?Math.round((os/ol)*1000)/10:null,
      fP:fb>0&&fs!==null?Math.round((fs/fb)*1000)/10:null,
    };
  }else{
    const wb=n('leads','website_leads'),ws=n('leads','website_sold');
    const tp=n('leads','third_party'),ts=n('leads','third_party_sold');
    const fb=n('leads','facebook_leads'),fs=n('leads','facebook_sold');
    leadsData={
      tl:n('leads','total_leads'),wb,tp,fb,
      wS:ws,tS:ts,fS:fs,pS:n('leads','phone_sold'),
      wP:wb>0&&ws!==null?Math.round((ws/wb)*1000)/10:null,
      tP:tp>0&&ts!==null?Math.round((ts/tp)*1000)/10:null,
      fP:fb>0&&fs!==null?Math.round((fs/fb)*1000)/10:null,
      pP:null,
    };
  }
  return{
    _live:true,
    seo:{
      ca:n('seo','phone_calls'),fo:n('seo','form_submissions'),
      ctr:n('seo','ctr'),tr:n('seo','organic_sessions'),
      kw:n('seo','page1_keywords'),im:n('seo','impressions'),
      w:s('seo','top_query'),gV:n('seo','vdp_views'),
      gCa:n('gbp','phone_calls'),
      work_completed:s('seo','work_completed'),wins:s('seo','wins'),
      losses:s('seo','losses'),next_month:s('seo','next_month'),
    },
    gbp:{
      vi:n('gbp','profile_views'),se:n('gbp','search_appearances'),
      ma:n('gbp','map_views'),wc:n('gbp','website_clicks'),
      ca:n('gbp','phone_calls'),di:n('gbp','direction_requests'),
      rv:n('gbp','review_count'),ra:n('gbp','avg_rating'),
      nr:n('gbp','new_reviews'),ph:n('gbp','photo_count'),
      work_completed:s('gbp','work_completed'),wins:s('gbp','wins'),
      losses:s('gbp','losses'),next_month:s('gbp','next_month'),
    },
    gads:{
      ca:n('google_ads','conversions'),sp:n('google_ads','total_spend'),
      cpl:n('google_ads','cost_per_lead'),ctr:n('google_ads','ctr'),
      cpc:n('google_ads','cpc'),is:n('google_ads','impression_share'),
      tp:s('google_ads','top_campaign'),
      work_completed:s('google_ads','work_completed'),wins:s('google_ads','wins'),
      losses:s('google_ads','losses'),next_month:s('google_ads','next_month'),
    },
    meta:{
      ca:n('meta_ads','conversions'),re:n('meta_ads','reach'),
      cpc:n('meta_ads','cpc'),cpl:n('meta_ads','cost_per_lead'),
      fr:n('meta_ads','frequency'),er:n('meta_ads','engagement_rate'),
      tp:s('meta_ads','top_ad'),
      work_completed:s('meta_ads','work_completed'),wins:s('meta_ads','wins'),
      losses:s('meta_ads','losses'),next_month:s('meta_ads','next_month'),
    },
    so:{
      po:n('social','posts_published'),vi:n('social','videos_published'),
      re:n('social','total_reach'),en:n('social','total_engagement'),
      fl:n('social','new_followers'),wc:n('social','website_clicks'),
      tv:s('social','top_video'),tvV:n('social','top_video_views'),
      work_completed:s('social','work_completed'),wins:s('social','wins'),
      losses:s('social','losses'),next_month:s('social','next_month'),
    },
    cr:{
      tl:n('callrail','total_calls'),ws:n('callrail','website_calls'),
      ad:n('callrail','ads_calls'),gm:n('callrail','gbp_calls'),
    },
    em:{
      cp:n('email','campaigns_sent'),rc:n('email','total_recipients'),
      vs:n('email','site_visits'),
      work_completed:s('email','work_completed'),wins:s('email','wins'),
      losses:s('email','losses'),next_month:s('email','next_month'),
    },
    cv:{
      tl:n('creative','total_assets'),gr:n('creative','graphics'),
      ba:n('creative','banners'),pr:n('creative','print'),
      vi:n('creative','videos'),next_month:s('creative','next_month'),
    },
    le:leadsData,
  };
}

// ─── DISPLAY HELPERS ───
// fmt: show value or "N/A". pre/suf only added when value exists.
const fmt=(v,pre='',suf='')=>v!==null&&v!==undefined?`${pre}${typeof v==='number'?v.toLocaleString():v}${suf}`:'N/A';
const fmtPct=(v)=>v!==null&&v!==undefined?`${v}%`:'N/A';
const fmtDollar=(v)=>v!==null&&v!==undefined?`$${typeof v==='number'?v.toLocaleString():v}`:'N/A';

const ts={background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,fontSize:12,color:C.t,fontFamily:F};
const Arr=({v,s="%",z=13})=><span style={{display:"inline-flex",alignItems:"center",gap:3,color:v>0?C.g:v<0?C.r:C.tl,fontSize:z,fontWeight:700,fontFamily:F}}>{v>0?"▲":v<0?"▼":"—"} {Math.abs(v)}{s}</span>;
const SH=({title,sub})=><div style={{marginBottom:10}}><h2 style={{fontSize:16,fontWeight:700,color:C.t,margin:0,fontFamily:F}}>{title}</h2>{sub&&<p style={{fontSize:11,color:C.tl,margin:"2px 0 0",fontFamily:F}}>{sub}</p>}</div>;
const Sc=({children,s})=><div style={{background:C.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.bd}`,boxShadow:C.sh,marginBottom:16,...s}}>{children}</div>;
const Tip=({text})=>{const[s,ss]=useState(false);return<span onMouseEnter={()=>ss(true)}onMouseLeave={()=>ss(false)}style={{position:"relative",cursor:"help",marginLeft:4,color:C.tl,fontSize:12}}>&#9432;{s&&<span style={{position:"absolute",bottom:"120%",left:"50%",transform:"translateX(-50%)",background:C.navy,color:"#fff",padding:"6px 10px",borderRadius:6,fontSize:11,width:200,textAlign:"center",zIndex:99,pointerEvents:"none",fontWeight:400,lineHeight:1.4}}>{text}</span>}</span>;};

const KpiCard=({label,value,tip,sub,color})=><div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"18px 20px",flex:1,minWidth:140,boxShadow:C.sh,textAlign:"center"}}><div style={{fontSize:11,color:C.tl,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{label}{tip&&<Tip text={tip}/>}</div><div style={{fontSize:32,fontWeight:700,color:value==='N/A'?C.tl:color||C.t,fontFamily:F,lineHeight:1.1,marginBottom:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:C.tl,marginTop:2,fontFamily:F}}>{sub}</div>}</div>;

const DKpi=({label,value,tip,sub,color})=><div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"16px 20px",flex:1,minWidth:140,boxShadow:C.sh}}><div style={{fontSize:11,color:C.tl,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{label}{tip&&<Tip text={tip}/>}</div><div style={{fontSize:28,fontWeight:800,color:value==='N/A'?C.tl:color||C.t,fontFamily:F}}>{value}</div>{sub&&<div style={{fontSize:11,color:C.tl,marginTop:2,fontFamily:F}}>{sub}</div>}</div>;

const BM=({l,v})=><div style={{flex:1,minWidth:100,textAlign:"center",padding:"12px 6px"}}><div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,fontFamily:F}}>{l}</div><div style={{fontSize:24,fontWeight:700,color:v==='N/A'?"rgba(255,255,255,0.35)":"#fff",fontFamily:F,lineHeight:1.1}}>{v}</div></div>;

const BC=({ic,la,hl,ch})=><div style={{background:`linear-gradient(135deg,${C.bc},${C.bl})`,borderRadius:12,padding:"18px 22px",border:`1px solid ${C.bb}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:18}}>{ic}</span><span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:F}}>{la}</span></div>{ch}{hl&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.1)",fontSize:12}}><span style={{color:"rgba(255,255,255,0.4)",fontSize:10,textTransform:"uppercase",fontWeight:700,fontFamily:F}}>Highlight: </span><span style={{color:"#fff",fontWeight:600,fontFamily:F}}>{hl}</span></div>}</div>;

const SecWrap=({title,children})=><div style={{marginBottom:24}}><h3 style={{fontSize:15,fontWeight:700,color:C.t,margin:"0 0 10px",fontFamily:F}}>{title}</h3>{children}</div>;

const WinLoss=({wins,losses})=>{
  const wList=wins?wins.split('\n').filter(l=>l.trim()):[];
  const lList=losses?losses.split('\n').filter(l=>l.trim()):[];
  if(!wList.length&&!lList.length)return null;
  return<SecWrap title="Wins &amp; Losses"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
    <div>{wList.map((w,i)=><div key={i}style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F,color:"#166534",marginBottom:6}}>✅ {w}</div>)}</div>
    <div>{lList.map((l,i)=><div key={i}style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F,color:"#991b1b",marginBottom:6}}>⚠️ {l}</div>)}</div>
  </div></SecWrap>;
};

const WorkDone=({text})=>{
  if(!text)return null;
  const items=text.split('\n').filter(l=>l.trim());
  if(!items.length)return null;
  return<SecWrap title="Work Completed"><div style={{display:"flex",flexDirection:"column",gap:8}}>{items.map((it,i)=><div key={i}style={{background:"#f8fafc",border:`1px solid ${C.bd}`,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F}}>{it}</div>)}</div></SecWrap>;
};

const NextMonth=({text})=>{
  if(!text)return null;
  const items=text.split('\n').filter(l=>l.trim());
  if(!items.length)return null;
  return<SecWrap title="What's Coming Next Month"><div style={{display:"flex",flexDirection:"column",gap:6}}>{items.map((it,i)=><div key={i}style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontFamily:F,padding:"6px 0"}}><span style={{color:C.cyan,fontWeight:700}}>→</span>{it}</div>)}</div></SecWrap>;
};

/* ─── NO REPORT PLACEHOLDER ─── */
const NoReport=({month})=><div style={{textAlign:"center",padding:"80px 40px"}}>
  <div style={{fontSize:56,marginBottom:16}}>📋</div>
  <h2 style={{fontSize:22,fontWeight:700,color:C.t,fontFamily:F,margin:"0 0 8px"}}>Report Coming Soon</h2>
  <p style={{fontSize:14,color:C.tl,fontFamily:F,maxWidth:360,margin:"0 auto"}}>
    {month?`The ${month} report hasn't been published yet.`:"No published reports yet."} Check back after the second Tuesday of the month.
  </p>
</div>;

/* ─── DASHBOARD ─── */
function Dashboard({d,month}){
  if(!d)return<NoReport month={month}/>;
  const isGoode=d.le._goode;
  const oemLabel=d.le._oemLabel||null;
  const tpLabel=oemLabel||"Third Party";
  const tpLeads=oemLabel?d.le.ol:d.le.tp;
  const tpSold=oemLabel?d.le.oS:d.le.tS;
  const tpPct=oemLabel?d.le.oP:d.le.tP;
  return<>
    <SH title="Lead Summary" sub="Total leads across all channels"/>
    {isGoode?(
      <>
        <div style={{background:C.cyanL,border:`1px solid ${C.cyan}44`,borderRadius:8,padding:"8px 14px",marginBottom:14,fontSize:12,color:C.cyanD,fontFamily:F}}>
          ℹ️ Goode Motor Group lead data is tracked by brand — Ford, Mazda, and Volkswagen are shown separately.
        </div>
        <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
          <KpiCard label="Total Leads" value={fmt(d.le.tl)} tip="Combined leads across all three brands."/>
          <KpiCard label="Total Sold" value={fmt(d.le.ts)} tip="Combined sold across all three brands."/>
        </div>
        <div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}>
          {[{l:"Ford",leads:d.le.ford_leads,sold:d.le.ford_sold,pct:d.le.ford_pct,c:"#003478"},{l:"Mazda",leads:d.le.mazda_leads,sold:d.le.mazda_sold,pct:d.le.mazda_pct,c:"#910A2D"},{l:"Volkswagen",leads:d.le.vw_leads,sold:d.le.vw_sold,pct:d.le.vw_pct,c:"#001E50"}].map((b,i)=>(
            <div key={i} style={{flex:1,minWidth:180,background:C.white,borderRadius:10,border:`1px solid ${C.bd}`,padding:"18px 20px",boxShadow:C.sh,textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.tl,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8,fontFamily:F}}>{b.l}</div>
              <div style={{fontSize:32,fontWeight:700,color:b.pct!==null?b.c:C.tl,fontFamily:F,marginBottom:4}}>{fmtPct(b.pct)}</div>
              <div style={{display:"flex",justifyContent:"center",gap:16,fontSize:12,color:C.tl,fontFamily:F}}>
                <span>{fmt(b.leads)} leads</span>
                <span>{fmt(b.sold)} sold</span>
              </div>
            </div>
          ))}
        </div>
      </>
    ):(
      <>
        <div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}>
          <KpiCard label="Total Leads" value={fmt(d.le.tl)} tip="All leads across every source this period."/>
          <KpiCard label="Website" value={fmt(d.le.wb)} tip="Leads from the dealership website."/>
          <KpiCard label={tpLabel} value={fmt(tpLeads)} tip={oemLabel?`Leads from the ${oemLabel} OEM program.`:"Leads from third-party providers."}/>
          <KpiCard label="Facebook" value={fmt(d.le.fb)} tip="Leads from Facebook Lead Ads."/>
        </div>
        <div style={{display:"flex",gap:14,marginBottom:22,flexWrap:"wrap"}}>
          <Sc s={{flex:1,minWidth:280}}><SH title="Sold % by Source"/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[{l:"Website",p:d.le.wP,s:d.le.wS,ld:d.le.wb,c:C.cyan},{l:tpLabel,p:tpPct,s:tpSold,ld:tpLeads,c:C.p},{l:"Facebook",p:d.le.fP,s:d.le.fS,ld:d.le.fb,c:C.g},{l:"Phone",p:d.le.pP,s:d.le.pS,ld:d.cr.tl,c:C.o}].map((src,i)=><div key={i}style={{flex:1,minWidth:110,background:C.white,borderRadius:10,padding:"14px 12px",border:`1px solid ${C.bd}`,boxShadow:C.sh,textAlign:"center"}}><div style={{fontSize:10,color:C.tl,fontWeight:700,textTransform:"uppercase",marginBottom:3,fontFamily:F}}>{src.l}</div><div style={{fontSize:28,fontWeight:700,color:src.p!==null?src.c:C.tl,fontFamily:F}}>{fmtPct(src.p)}</div><div style={{fontSize:9,color:C.tl,marginTop:2,fontFamily:F}}>{fmt(src.s)} sold / {fmt(src.ld)} leads</div></div>)}
            </div>
          </Sc>
        </div>
      </>
    )}
    <SH title="Phone Calls (CallRail)"/>
    <div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}>
      <KpiCard label="Total Calls" value={fmt(d.cr.tl)} tip="Total tracked calls this period."/>
      <KpiCard label="From Website" value={fmt(d.cr.ws)} tip="Calls attributed to website visits."/>
      <KpiCard label="From Ads" value={fmt(d.cr.ad)} tip="Calls attributed to paid ad campaigns."/>
      <KpiCard label="From Google Business" value={fmt(d.cr.gm)} tip="Calls from the GBP call button."/>
    </div>
    <SH title="Department Performance"/>
    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
      <BC ic="🔍" la="SEO" hl={d.seo.w||undefined} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions" v={fmt(d.seo.ca!==null&&d.seo.fo!==null?d.seo.ca+d.seo.fo:d.seo.ca??d.seo.fo)}/><BM l="Traffic" v={fmt(d.seo.tr)}/><BM l="Page 1 KWs" v={fmt(d.seo.kw)}/><BM l="Impressions" v={fmt(d.seo.im)}/><BM l="GBP Views" v={fmt(d.seo.gV)}/><BM l="GBP Calls" v={fmt(d.seo.gCa)}/></div>}/>
      <BC ic="📍" la="Google Business Profile" ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Views" v={fmt(d.gbp.vi)}/><BM l="Searches" v={fmt(d.gbp.se)}/><BM l="Map Views" v={fmt(d.gbp.ma)}/><BM l="Web Clicks" v={fmt(d.gbp.wc)}/><BM l="Calls" v={fmt(d.gbp.ca)}/><BM l="Directions" v={fmt(d.gbp.di)}/></div>}/>
      <BC ic="📢" la="Google Ads" hl={d.gads.tp?`Top: ${d.gads.tp}`:undefined} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions" v={fmt(d.gads.ca)}/><BM l="Cost/Lead" v={fmtDollar(d.gads.cpl)}/><BM l="Spend" v={fmtDollar(d.gads.sp)}/><BM l="CTR" v={fmtPct(d.gads.ctr)}/><BM l="CPC" v={fmtDollar(d.gads.cpc)}/><BM l="Imp Share" v={fmtPct(d.gads.is)}/></div>}/>
      <BC ic="📱" la="Meta Ads" hl={d.meta.tp?`Top: ${d.meta.tp}`:undefined} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions" v={fmt(d.meta.ca)}/><BM l="Cost/Lead" v={fmtDollar(d.meta.cpl)}/><BM l="Reach" v={fmt(d.meta.re)}/><BM l="CPC" v={fmtDollar(d.meta.cpc)}/><BM l="Frequency" v={fmt(d.meta.fr)}/><BM l="Eng Rate" v={fmtPct(d.meta.er)}/></div>}/>
      <BC ic="🎬" la="Organic Social" hl={d.so.tv?`${d.so.tv}${d.so.tvV!==null?' — '+d.so.tvV.toLocaleString()+' views':''}`:undefined} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Reach" v={fmt(d.so.re)}/><BM l="Engagement" v={fmt(d.so.en)}/><BM l="Followers" v={d.so.fl!==null?`+${d.so.fl}`:'N/A'}/><BM l="Posts" v={fmt(d.so.po)}/><BM l="Videos" v={fmt(d.so.vi)}/><BM l="Web Clicks" v={fmt(d.so.wc)}/></div>}/>
      <div style={{display:"flex",gap:12}}>
        <BC ic="✉️" la="Email" ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Campaigns" v={fmt(d.em.cp)}/><BM l="Recipients" v={fmt(d.em.rc)}/><BM l="Site Visits" v={fmt(d.em.vs)}/></div>}/>
        <BC ic="🎨" la="Creative" ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Delivered" v={fmt(d.cv.tl)}/><BM l="Videos" v={fmt(d.cv.vi)}/><BM l="Graphics" v={fmt(d.cv.gr)}/><BM l="Banners" v={fmt(d.cv.ba)}/><BM l="Print" v={fmt(d.cv.pr)}/></div>}/>
      </div>
    </div>
  </>;
}

/* ─── SEO ─── */
function SeoPage({d}){
  if(!d)return<NoReport/>;
  return<div>
  <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Phone Calls" value={fmt(d.seo.ca)} tip="Tracked calls from the website via CallRail." color={C.cyan}/>
    <DKpi label="Form Submissions" value={fmt(d.seo.fo)} tip="Contact, trade-in, and finance forms via GA4." color={C.cyan}/>
    <DKpi label="CTR" value={fmtPct(d.seo.ctr)} tip="Click-through rate from Google Search. Higher = stronger title tags and meta descriptions."/>
    <DKpi label="Organic Sessions" value={fmt(d.seo.tr)} tip="Website visits from organic (unpaid) Google search."/>
    <DKpi label="Page 1 Keywords" value={fmt(d.seo.kw)} tip="Number of target keywords ranking on Google page 1."/>
    <DKpi label="Impressions" value={fmt(d.seo.im)} tip="Total impressions in Google Search."/>
  </div></SecWrap>
  <SecWrap title="Secondary Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="VDP Views" value={fmt(d.seo.gV)} tip="Vehicle Detail Page views — high-intent shoppers looking at specific inventory."/>
    <DKpi label="GBP Calls" value={fmt(d.seo.gCa)} tip="Phone calls made directly from the Google Business Profile listing." color={C.cyan}/>
    {d.seo.w&&<DKpi label="Top Query" value={d.seo.w} tip="Best performing search query this month."/>}
  </div></SecWrap>
  <WorkDone text={d.seo.work_completed}/>
  <WinLoss wins={d.seo.wins} losses={d.seo.losses}/>
  <NextMonth text={d.seo.next_month}/>
</div>;}

/* ─── GBP ─── */
function GbpPage({d}){
  if(!d)return<NoReport/>;
  return<div>
  <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Profile Views" value={fmt(d.gbp.vi)} tip="Total times your GBP profile was seen."/>
    <DKpi label="Search Appearances" value={fmt(d.gbp.se)} tip="Times your business appeared in Google Search."/>
    <DKpi label="Map Views" value={fmt(d.gbp.ma)} tip="Times your location appeared in Google Maps."/>
    <DKpi label="Website Clicks" value={fmt(d.gbp.wc)} tip="Clicks from GBP to your website."/>
    <DKpi label="Phone Calls" value={fmt(d.gbp.ca)} tip="Calls made directly from the GBP listing." color={C.cyan}/>
    <DKpi label="Direction Requests" value={fmt(d.gbp.di)} tip="Users who requested directions to your dealership."/>
  </div></SecWrap>
  <SecWrap title="Reviews"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Avg Rating" value={d.gbp.ra!==null?`${d.gbp.ra} ⭐`:'N/A'} tip="Current Google review rating."/>
    <DKpi label="Total Reviews" value={fmt(d.gbp.rv)} tip="Total number of Google reviews."/>
    <DKpi label="New Reviews" value={d.gbp.nr!==null?`+${d.gbp.nr}`:'N/A'} tip="New reviews received this month." color={C.g}/>
    <DKpi label="Photos" value={fmt(d.gbp.ph)} tip="Total photos on the GBP listing."/>
  </div></SecWrap>
  <WorkDone text={d.gbp.work_completed}/>
  <WinLoss wins={d.gbp.wins} losses={d.gbp.losses}/>
  <NextMonth text={d.gbp.next_month}/>
</div>;}

/* ─── GOOGLE ADS ─── */
function GoogleAdsPage({d}){
  if(!d)return<NoReport/>;
  return<div>
  <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Conversions" value={fmt(d.gads.ca)} tip="Total tracked conversions from Google Ads." color={C.cyan}/>
    <DKpi label="Cost / Lead" value={fmtDollar(d.gads.cpl)} tip="Average cost per conversion. Industry avg: $25-$45." color={d.gads.cpl!==null?C.g:undefined}/>
    <DKpi label="Total Spend" value={fmtDollar(d.gads.sp)} tip="Total ad spend this period."/>
    <DKpi label="CTR" value={fmtPct(d.gads.ctr)} tip="Click-through rate. Industry avg: 8.29%."/>
    <DKpi label="Avg CPC" value={fmtDollar(d.gads.cpc)} tip="Average cost per click. Industry avg: $2.41."/>
    <DKpi label="Impression Share" value={fmtPct(d.gads.is)} tip="% of eligible searches you appeared for."/>
  </div></SecWrap>
  {d.gads.tp&&<SecWrap title="Top Campaign"><div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",fontFamily:F,fontSize:14,color:C.t,boxShadow:C.sh}}>🏆 {d.gads.tp}</div></SecWrap>}
  <WorkDone text={d.gads.work_completed}/>
  <WinLoss wins={d.gads.wins} losses={d.gads.losses}/>
  <NextMonth text={d.gads.next_month}/>
</div>;}

/* ─── META ADS ─── */
function MetaAdsPage({d}){
  if(!d)return<NoReport/>;
  return<div>
  <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Conversions" value={fmt(d.meta.ca)} tip="Total tracked conversions from Meta ads." color={C.cyan}/>
    <DKpi label="Cost / Lead" value={fmtDollar(d.meta.cpl)} tip="Average cost per lead. Industry avg: $35." color={d.meta.cpl!==null?C.g:undefined}/>
    <DKpi label="Reach" value={fmt(d.meta.re)} tip="Unique people who saw your ads."/>
    <DKpi label="Avg CPC" value={fmtDollar(d.meta.cpc)} tip="Cost per click. Industry avg: ~$0.79."/>
    <DKpi label="Frequency" value={fmt(d.meta.fr)} tip="Average times each person saw your ad. Over 3.0 = ad fatigue risk."/>
    <DKpi label="Engagement Rate" value={fmtPct(d.meta.er)} tip="Likes, comments, and shares as a % of reach."/>
  </div></SecWrap>
  {d.meta.tp&&<SecWrap title="Top Ad"><div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",fontFamily:F,fontSize:14,color:C.t,boxShadow:C.sh}}>🏆 {d.meta.tp}</div></SecWrap>}
  <WorkDone text={d.meta.work_completed}/>
  <WinLoss wins={d.meta.wins} losses={d.meta.losses}/>
  <NextMonth text={d.meta.next_month}/>
</div>;}

/* ─── ORGANIC SOCIAL ─── */
function SocialPage({d}){
  if(!d)return<NoReport/>;
  return<div>
  <SecWrap title="Monthly Overview"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Total Reach" value={fmt(d.so.re)} tip="Unique people who saw your content."/>
    <DKpi label="Total Engagement" value={fmt(d.so.en)} tip="Likes, comments, shares, and saves." color={C.cyan}/>
    <DKpi label="New Followers" value={d.so.fl!==null?`+${d.so.fl}`:'N/A'} tip="Net new followers across all platforms." color={C.g}/>
    <DKpi label="Posts Published" value={fmt(d.so.po)} tip="Total posts across all platforms this month."/>
    <DKpi label="Videos Published" value={fmt(d.so.vi)} tip="Video posts including Reels, TikTok, and YouTube."/>
    <DKpi label="Website Clicks" value={fmt(d.so.wc)} tip="Clicks from social media to your website."/>
  </div></SecWrap>
  {(d.so.tv||d.so.tvV!==null)&&<SecWrap title="Top Video">
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"14px 18px",fontFamily:F,fontSize:14,color:C.t,boxShadow:C.sh}}>
      🎬 {d.so.tv||'—'}{d.so.tvV!==null?` — ${d.so.tvV.toLocaleString()} views`:''}
    </div>
  </SecWrap>}
  <WorkDone text={d.so.work_completed}/>
  <WinLoss wins={d.so.wins} losses={d.so.losses}/>
  <NextMonth text={d.so.next_month}/>
</div>;}

/* ─── EMAIL ─── */
function EmailPage({d}){
  if(!d)return<NoReport/>;
  return<div>
  <SecWrap title="Monthly Summary"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Campaigns Sent" value={fmt(d.em.cp)} tip="Total email campaigns deployed this month."/>
    <DKpi label="Total Recipients" value={fmt(d.em.rc)} tip="Total emails delivered across all campaigns."/>
    <DKpi label="Site Visits from Email" value={fmt(d.em.vs)} tip="GA4-tracked sessions from email campaigns via UTM links." color={C.cyan}/>
  </div></SecWrap>
  <WorkDone text={d.em.work_completed}/>
  <WinLoss wins={d.em.wins} losses={d.em.losses}/>
  <NextMonth text={d.em.next_month}/>
</div>;}

/* ─── CREATIVE ─── */
function CreativePage({d}){
  if(!d)return<NoReport/>;
  return<div>
  <SecWrap title="Monthly Summary"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Total Assets Delivered" value={fmt(d.cv.tl)}/>
    <DKpi label="Videos Produced" value={fmt(d.cv.vi)} color={C.cyan}/>
    <DKpi label="Graphics / Statics" value={fmt(d.cv.gr)}/>
    <DKpi label="Banners" value={fmt(d.cv.ba)}/>
    <DKpi label="Print Pieces" value={fmt(d.cv.pr)}/>
  </div></SecWrap>
  <NextMonth text={d.cv.next_month}/>
</div>;}

/* ─── BENCHMARKS ─── */
function BenchmarksPage({d}){
  if(!d)return<NoReport/>;
  // Benchmarks page is narrative/qualitative — show a placeholder message
  return<div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:12,padding:"40px",textAlign:"center",boxShadow:C.sh}}>
    <div style={{fontSize:40,marginBottom:12}}>🎯</div>
    <h3 style={{fontSize:18,fontWeight:700,color:C.t,fontFamily:F,margin:"0 0 8px"}}>Benchmarks</h3>
    <p style={{fontSize:13,color:C.tl,fontFamily:F,maxWidth:400,margin:"0 auto"}}>Industry benchmark comparisons will be included with your full monthly report.</p>
  </div>;
}

/* ─── LOGIN ─── */
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
        <img src="/Taggart_Advertising_Logo.png" alt="Taggart Advertising" style={{height:56,width:"auto",marginBottom:24}}/>
        <h1 style={{fontSize:22,fontWeight:700,color:C.navy,margin:"0 0 6px",fontFamily:F}}>Client Portal</h1>
        <p style={{fontSize:13,color:C.tl,margin:"0 0 28px",fontFamily:F}}>Sign in to view your report.</p>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        {error&&<p style={{fontSize:12,color:C.r,margin:"0 0 10px",fontFamily:F}}>{error}</p>}
        <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"12px",background:C.navy,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>{loading?"Signing in...":"Sign In"}</button>
      </div>
    </div>
  );
}

/* ─── ROOT APP ─── */
export default function App(){
  const[session,setSession]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[clients,setClients]=useState([]);
  const[clientsLoading,setClientsLoading]=useState(false);
  const[cl,sCl]=useState(null);
  const[pg,sPg]=useState("db");
  const[cm,sCm]=useState(false);
  // Live data state
  const[liveData,setLiveData]=useState(null);
  const[liveMonthLabel,setLiveMonthLabel]=useState(null);
  const[availableMonths,setAvailableMonths]=useState([]);
  const[selectedMonth,setSelectedMonth]=useState(null);
  const[dataLoading,setDataLoading]=useState(false);
  const[hm,sHm]=useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setAuthLoading(false);});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setSession(session);setAuthLoading(false);});
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session)return;
    const fetchClients=async()=>{
      setClientsLoading(true);
      const{data:profile}=await supabase.from("user_profiles").select("role").eq("id",session.user.id).single();
      const isAdmin=["admin","editor","account_manager"].includes(profile?.role?.toLowerCase());
      let data,error;
      if(isAdmin){
        ({data,error}=await supabase.from("clients").select("id,name,group_name").eq("active",true));
      }else{
        const{data:access}=await supabase.from("user_client_access").select("client_id").eq("user_id",session.user.id);
        const ids=access?.map(r=>r.client_id)||[];
        ({data,error}=await supabase.from("clients").select("id,name,group_name").eq("active",true).in("id",ids));
      }
      if(!error&&data){
        const sorted=data.sort((a,b)=>{const ai=CLIENT_ORDER.indexOf(a.name),bi=CLIENT_ORDER.indexOf(b.name);if(ai!==-1&&bi!==-1)return ai-bi;if(ai!==-1)return -1;if(bi!==-1)return 1;return a.name.localeCompare(b.name);});
        setClients(sorted);if(sorted.length>0)sCl(sorted[0]);
      }
      setClientsLoading(false);
    };
    fetchClients();
  },[session]);

  // Load available published months when client changes
  useEffect(()=>{
    if(!cl)return;
    setLiveData(null);setLiveMonthLabel(null);setAvailableMonths([]);setSelectedMonth(null);
    const fetchMonths=async()=>{
      const{data}=await supabase.from("monthly_reports").select("month").eq("client_id",cl.id).eq("status","published").order("month",{ascending:false});
      const months=(data||[]).map(r=>r.month);
      setAvailableMonths(months);
      if(months[0])setSelectedMonth(months[0]);
    };
    fetchMonths();
  },[cl]);

  // Load report data when selected month changes
  useEffect(()=>{
    if(!cl||!selectedMonth)return;
    const fetchData=async()=>{
      setDataLoading(true);
      const{data}=await supabase.from("report_data").select("department,data").eq("client_id",cl.id).eq("month",selectedMonth);
      const merged={};
      (data||[]).forEach(row=>{merged[row.department]=row.data;});
      setLiveData(mapReportData(merged,cl?.name));
      const[y,m]=selectedMonth.split('-');
      setLiveMonthLabel(`${MONTHS[parseInt(m)-1]} ${y}`);
      setDataLoading(false);
    };
    fetchData();
  },[cl,selectedMonth]);

  const handleLogout=async()=>{await supabase.auth.signOut();setSession(null);setClients([]);sCl(null);setLiveData(null);};

  if(authLoading)return<div style={{minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#fff",fontFamily:F,fontSize:16}}>Loading...</div></div>;
  if(!session)return<LoginPage/>;
  if(clientsLoading)return<div style={{minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#fff",fontFamily:F,fontSize:16}}>Loading clients...</div></div>;
  if(clients.length===0)return(
    <div style={{minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:16,padding:"48px 40px",maxWidth:400,textAlign:"center",fontFamily:F}}>
        <div style={{fontSize:48,marginBottom:16}}>🚫</div>
        <h2 style={{color:C.navy,fontFamily:F}}>No Access</h2>
        <p style={{color:C.tl,fontFamily:F}}>Your account doesn't have access to any clients. Contact Taggart Advertising.</p>
        <button onClick={handleLogout} style={{marginTop:16,padding:"10px 24px",background:C.navy,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:F}}>Sign Out</button>
      </div>
    </div>
  );

  const currentClient=cl||clients[0];
  const tbs=[{id:"db",l:"Dashboard"},{id:"seo",l:"🔍 SEO"},{id:"gbp",l:"📍 Google Business"},{id:"ga",l:"📢 Google Ads"},{id:"ma",l:"📱 Meta Ads"},{id:"so",l:"🎬 Organic Social"},{id:"em",l:"✉️ Email"},{id:"cr",l:"🎨 Creative"},{id:"bm",l:"🎯 Benchmarks"}];
  const groups=[...new Set(clients.map(c=>c.group_name))];
  const pages={
    db:<Dashboard d={liveData} month={liveMonthLabel}/>,
    seo:<SeoPage d={liveData}/>,
    gbp:<GbpPage d={liveData}/>,
    ga:<GoogleAdsPage d={liveData}/>,
    ma:<MetaAdsPage d={liveData}/>,
    so:<SocialPage d={liveData}/>,
    em:<EmailPage d={liveData}/>,
    cr:<CreativePage d={liveData}/>,
    bm:<BenchmarksPage d={liveData}/>,
  };

  return(
    <div style={{minHeight:"100vh",fontFamily:F,backgroundColor:"#f0f2f5",backgroundImage:`url("data:image/svg+xml,%3Csvg width='120' height='60' viewBox='0 0 120 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='1' y='1' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3Crect x='61' y='31' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3Crect x='-59' y='31' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3C/svg%3E")`}}>
      {/* Header */}
      <div style={{background:C.white,padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{height:44,width:"auto"}}/>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:24,color:C.navy}}>TAGGART</span>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:24,color:C.cyan}}>ADVERTISING</span>
          {clients.length>1&&<>
            <div style={{width:1,height:30,background:C.bd,margin:"0 8px"}}/>
            <div style={{position:"relative"}}>
              <button onClick={()=>{sCm(!cm);sHm(false);}} style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 16px",color:C.t,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:F}}>{currentClient.name} <span style={{fontSize:10,color:C.tl}}>▼</span></button>
              {cm&&<div style={{position:"absolute",top:"calc(100% + 5px)",left:0,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"6px 0",zIndex:200,width:260,maxHeight:400,overflowY:"auto",boxShadow:"0 8px 30px rgba(0,0,0,0.12)"}}>
                {groups.map(g=><div key={g}><div style={{padding:"8px 14px",fontSize:10,fontWeight:700,color:C.tl,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:F}}>{g}</div>{clients.filter(c=>c.group_name===g).map(c=><button key={c.id} onClick={()=>{sCl(c);sCm(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",border:"none",cursor:"pointer",background:c.id===currentClient.id?C.cyanL:"transparent",color:c.id===currentClient.id?C.cyanD:C.t,fontSize:13,fontWeight:600,fontFamily:F}}>{c.name}</button>)}</div>)}
              </div>}
            </div>
          </>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:C.tl,fontFamily:F}}>{session?.user?.email}</span>
          {/* Month picker — shown when at least 1 published month exists */}
          {availableMonths.length>0&&<div style={{position:"relative"}}>
            <button onClick={()=>{sHm(!hm);sCm(false);}} style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 16px",color:C.t,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:F}}>📅 {liveMonthLabel||'Select Month'}{availableMonths.length>1&&<span style={{fontSize:10,color:C.tl}}>▼</span>}</button>
            {hm&&availableMonths.length>1&&<div style={{position:"absolute",top:"calc(100% + 5px)",right:0,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"6px 0",zIndex:200,width:200,boxShadow:"0 8px 30px rgba(0,0,0,0.12)"}}>
              {availableMonths.map(m=>{const[y,mo]=m.split('-');const label=`${MONTHS[parseInt(mo)-1]} ${y}`;return<button key={m} onClick={()=>{setSelectedMonth(m);sHm(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",border:"none",cursor:"pointer",background:m===selectedMonth?C.cyanL:"transparent",color:m===selectedMonth?C.cyanD:C.t,fontSize:13,fontWeight:600,fontFamily:F}}>{label}</button>;})}
            </div>}
          </div>}
          <button onClick={handleLogout} style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 14px",color:C.t,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>Sign Out</button>
          <button style={{background:C.navy,border:"none",borderRadius:8,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>📄 Export PDF</button>
        </div>
      </div>
      {/* Tabs */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,padding:"0 24px",display:"flex",overflowX:"auto"}}>
        {tbs.map(t=><button key={t.id} onClick={()=>sPg(t.id)} style={{padding:"11px 16px",border:"none",cursor:"pointer",background:"transparent",fontSize:13,fontWeight:600,color:pg===t.id?C.cyanD:C.tl,borderBottom:pg===t.id?`2px solid ${C.cyan}`:"2px solid transparent",whiteSpace:"nowrap",fontFamily:F}}>{t.l}</button>)}
      </div>
      {/* Status bar */}
      {liveData&&<div style={{background:"rgba(16,185,129,0.08)",padding:"7px 24px",borderBottom:"1px solid #bbf7d0",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:12,color:"#059669",fontWeight:700,fontFamily:F}}>✓ Live Report — {liveMonthLabel}</span>
      </div>}
      {/* Content */}
      <div style={{padding:"22px 24px",maxWidth:1200,margin:"0 auto"}} onClick={()=>{sCm(false);sHm(false);}}>
        <div style={{marginBottom:18}}>
          <h1 style={{fontSize:26,fontWeight:700,color:C.t,margin:0,fontFamily:F}}>{currentClient.name}</h1>
          <p style={{fontSize:13,color:C.tl,margin:"3px 0 0",fontFamily:F}}>
            Performance Overview{liveMonthLabel?` — ${liveMonthLabel}`:''}
          </p>
        </div>
        {dataLoading
          ?<div style={{textAlign:"center",padding:"60px 0",color:C.tl,fontFamily:F,fontSize:15}}>Loading report data...</div>
          :(pages[pg]||<Dashboard d={liveData} month={liveMonthLabel}/>)
        }
      </div>
      {/* Footer */}
      <div style={{padding:"18px 24px",textAlign:"center",marginTop:30,background:C.white,borderTop:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart" style={{height:28,width:"auto"}}/>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:15,color:C.navy}}>TAGGART</span>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:15,color:C.cyan}}>ADVERTISING</span>
        </div>
      </div>
    </div>
  );
}
