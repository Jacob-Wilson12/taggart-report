'use client';
import{useState,useEffect}from"react";
import{LineChart,Line,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend}from"recharts";
import{supabase}from"../supabase";

const C={white:"#fff",navy:"#0c1a2e",cyan:"#00c9e8",cyanD:"#00a5bf",cyanL:"#e6f9fc",bc:"#1b3254",bl:"#243e63",bb:"#2d5080",t:"#1a1a2e",tm:"#0c1a2e",tl:"#6b7280",bd:"#d0d5dd",bl2:"#e4e7ec",g:"#10b981",gL:"#ecfdf5",r:"#ef4444",o:"#f59e0b",p:"#8b5cf6",sh:"0 2px 6px rgba(0,0,0,0.08)"};
const F="Inter,system-ui,sans-serif";
const CLIENT_ORDER=["Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen","Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet","Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"];
const PR=[{l:"This Month",v:"tm",c:["vs Last Month","vs Same Month Last Year"]},{l:"Last Month",v:"lm",c:["vs Prior Month","vs Same Month Last Year"]},{l:"Last 90 Days",v:"l90",c:["vs Prior 90 Days","vs Same Period Last Year"]},{l:"This Quarter",v:"tq",c:["vs Last Quarter","vs Same Quarter Last Year"]},{l:"Last Quarter",v:"lq",c:["vs Prior Quarter","vs Same Quarter Last Year"]},{l:"This Year",v:"ty",c:["vs Last Year"]},{l:"Custom",v:"cu",c:["vs Prior Period","vs Same Period Last Year"]}];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── SAMPLE / FALLBACK DATA ───
const D={seo:{ca:142,fo:67,ctr:5.2,ctrC:[0.8,2.1],tr:8420,trC:[17.3,42.7],kw:47,kwC:[8,22],im:124500,imC:[15.1,38.4],w:'"F-150 Twin Falls" \u2192 Pos 1',gV:3240,gVC:[18.2,38.2],gCa:89,gCaC:[14.1,44.2],td:[{m:"Mar",v:5200},{m:"Apr",v:5800},{m:"May",v:6100},{m:"Jun",v:5900},{m:"Jul",v:6400},{m:"Aug",v:6800},{m:"Sep",v:7100},{m:"Oct",v:7400},{m:"Nov",v:7180},{m:"Dec",v:7600},{m:"Jan",v:7900},{m:"Feb",v:8420}]},
gbp:{vi:3240,viC:[16.5,38.2],se:8920,seC:[16.6,42.1],ma:2180,maC:[12.3,28.8],wc:456,wcC:[18.4,34.5],ca:89,caC:[20.3,44.2],di:156,diC:[13.0,28.5],rv:142,ra:4.7,nr:8,ph:24},
gads:{ca:89,fo:34,cC:[22.8,52.1],sp:4850,cpl:39.43,cplC:[-8.7,-14.2],ctr:9.1,ctrC:[4.6,12.3],cpc:2.18,cpcC:[-3.1,-8.4],is:72,isC:[6,15],tp:"New F-150 Search"},
meta:{ca:23,fo:41,le:28,cC:[25.9,48.3],re:34500,reC:[18.4,42.1],cpc:.72,cpcC:[-5.3,-12.1],cpl:23.91,cplC:[-12.3,-18.7],fr:2.4,frC:[8.2,14.5],er:4.2,erC:[11.4,22.8],tp:"Instagram Reels"},
so:{po:34,vi:18,re:89400,reC:[24.0,56.2],en:4280,enC:[38.1,72.4],fl:186,flC:[12.4,34.8],wc:342,wcC:[15.8,41.2],tv:"2026 F-150 Walkaround",tvV:12300},
cr:{tl:234,tlC:[18.2,39.3],ws:78,wsC:[20.0,50.0],ad:89,adC:[23.6,45.9],gm:67,gmC:[9.8,21.8]},
em:{cp:3,rc:4280,vs:312,vsC:[27.3,44.1]},
cv:{tl:12,gr:6,ba:3,pr:2},
le:{tl:198,tlC:[15.1,33.8],wb:89,wbC:[20.3,43.5],tp:62,tpC:[6.9,21.6],fb:47,fbC:[17.5,34.3],wS:21,tS:14,fS:7,pS:18,wP:23.6,wPC:[2.4,4.1],tP:22.6,tPC:[1.8,3.2],fP:14.9,fPC:[2.8,5.1],pP:23.1,pPC:[0.7,2.9],td:[{m:"Mar",l:145,s:28},{m:"Apr",l:152,s:30},{m:"May",l:161,s:33},{m:"Jun",l:158,s:31},{m:"Jul",l:164,s:35},{m:"Aug",l:170,s:34},{m:"Sep",l:168,s:36},{m:"Oct",l:175,s:37},{m:"Nov",l:172,s:36},{m:"Dec",l:180,s:38},{m:"Jan",l:188,s:40},{m:"Feb",l:198,s:42}]}};

// ─── MAP SUPABASE report_data ROWS → D SHAPE ───
function mapReportData(rd){
  if(!rd)return null;
  const n=(dept,key,fb=null)=>{const v=rd[dept]?.[key];return(v!==undefined&&v!==null&&v!=='')? Number(v):fb;};
  const s=(dept,key,fb='')=>rd[dept]?.[key]||fb;
  return{
    _live:true,
    seo:{
      ca:n('seo','phone_calls',D.seo.ca),fo:n('seo','form_submissions',D.seo.fo),
      ctr:n('seo','ctr',D.seo.ctr),ctrC:D.seo.ctrC,
      tr:n('seo','organic_sessions',D.seo.tr),trC:D.seo.trC,
      kw:n('seo','page1_keywords',D.seo.kw),kwC:D.seo.kwC,
      im:n('seo','impressions',D.seo.im),imC:D.seo.imC,
      w:s('seo','top_query',D.seo.w),
      gV:n('seo','vdp_views',D.seo.gV),gVC:D.seo.gVC,
      gCa:n('gbp','phone_calls',D.seo.gCa),gCaC:D.seo.gCaC,
      td:D.seo.td,
      work_completed:s('seo','work_completed'),wins:s('seo','wins'),losses:s('seo','losses'),next_month:s('seo','next_month'),
    },
    gbp:{
      vi:n('gbp','profile_views',D.gbp.vi),viC:D.gbp.viC,
      se:n('gbp','search_appearances',D.gbp.se),seC:D.gbp.seC,
      ma:n('gbp','map_views',D.gbp.ma),maC:D.gbp.maC,
      wc:n('gbp','website_clicks',D.gbp.wc),wcC:D.gbp.wcC,
      ca:n('gbp','phone_calls',D.gbp.ca),caC:D.gbp.caC,
      di:n('gbp','direction_requests',D.gbp.di),diC:D.gbp.diC,
      rv:n('gbp','review_count',D.gbp.rv),ra:n('gbp','avg_rating',D.gbp.ra),
      nr:n('gbp','new_reviews',D.gbp.nr),ph:n('gbp','photo_count',D.gbp.ph),
      work_completed:s('gbp','work_completed'),wins:s('gbp','wins'),losses:s('gbp','losses'),next_month:s('gbp','next_month'),
    },
    gads:{
      ca:n('google_ads','conversions',D.gads.ca),fo:0,cC:D.gads.cC,
      sp:n('google_ads','total_spend',D.gads.sp),
      cpl:n('google_ads','cost_per_lead',D.gads.cpl),cplC:D.gads.cplC,
      ctr:n('google_ads','ctr',D.gads.ctr),ctrC:D.gads.ctrC,
      cpc:n('google_ads','cpc',D.gads.cpc),cpcC:D.gads.cpcC,
      is:n('google_ads','impression_share',D.gads.is),isC:D.gads.isC,
      tp:s('google_ads','top_campaign',D.gads.tp),
      work_completed:s('google_ads','work_completed'),wins:s('google_ads','wins'),losses:s('google_ads','losses'),next_month:s('google_ads','next_month'),
    },
    meta:{
      ca:n('meta_ads','conversions',D.meta.ca),fo:0,le:0,cC:D.meta.cC,
      re:n('meta_ads','reach',D.meta.re),reC:D.meta.reC,
      cpc:n('meta_ads','cpc',D.meta.cpc),cpcC:D.meta.cpcC,
      cpl:n('meta_ads','cost_per_lead',D.meta.cpl),cplC:D.meta.cplC,
      fr:n('meta_ads','frequency',D.meta.fr),frC:D.meta.frC,
      er:n('meta_ads','engagement_rate',D.meta.er),erC:D.meta.erC,
      tp:s('meta_ads','top_ad',D.meta.tp),
      work_completed:s('meta_ads','work_completed'),wins:s('meta_ads','wins'),losses:s('meta_ads','losses'),next_month:s('meta_ads','next_month'),
    },
    so:{
      po:n('social','posts_published',D.so.po),vi:n('social','videos_published',D.so.vi),
      re:n('social','total_reach',D.so.re),reC:D.so.reC,
      en:n('social','total_engagement',D.so.en),enC:D.so.enC,
      fl:n('social','new_followers',D.so.fl),flC:D.so.flC,
      wc:n('social','website_clicks',D.so.wc),wcC:D.so.wcC,
      tv:s('social','top_video',D.so.tv),tvV:n('social','top_video_views',D.so.tvV),
      work_completed:s('social','work_completed'),wins:s('social','wins'),losses:s('social','losses'),next_month:s('social','next_month'),
    },
    cr:{
      tl:n('callrail','total_calls',D.cr.tl),tlC:D.cr.tlC,
      ws:n('callrail','website_calls',D.cr.ws),wsC:D.cr.wsC,
      ad:n('callrail','ads_calls',D.cr.ad),adC:D.cr.adC,
      gm:n('callrail','gbp_calls',D.cr.gm),gmC:D.cr.gmC,
    },
    em:{
      cp:n('email','campaigns_sent',D.em.cp),rc:n('email','total_recipients',D.em.rc),
      vs:n('email','site_visits',D.em.vs),vsC:D.em.vsC,
      work_completed:s('email','work_completed'),wins:s('email','wins'),losses:s('email','losses'),next_month:s('email','next_month'),
    },
    cv:{
      tl:n('creative','total_assets',D.cv.tl),gr:n('creative','graphics',D.cv.gr),
      ba:n('creative','banners',D.cv.ba),pr:n('creative','print',D.cv.pr),
      vi:n('creative','videos',0),next_month:s('creative','next_month'),
    },
    le:{
      tl:n('leads','total_leads',D.le.tl),tlC:D.le.tlC,
      wb:n('leads','website_leads',D.le.wb),wbC:D.le.wbC,
      tp:n('leads','third_party',D.le.tp),tpC:D.le.tpC,
      fb:n('leads','facebook_leads',D.le.fb),fbC:D.le.fbC,
      wS:n('leads','website_sold',D.le.wS),tS:n('leads','third_party_sold',D.le.tS),
      fS:n('leads','facebook_sold',D.le.fS),pS:n('leads','phone_sold',D.le.pS),
      wP:rd['leads']?.website_leads>0?Math.round((n('leads','website_sold',0)/n('leads','website_leads',1))*1000)/10:D.le.wP,wPC:D.le.wPC,
      tP:rd['leads']?.third_party>0?Math.round((n('leads','third_party_sold',0)/n('leads','third_party',1))*1000)/10:D.le.tP,tPC:D.le.tPC,
      fP:rd['leads']?.facebook_leads>0?Math.round((n('leads','facebook_sold',0)/n('leads','facebook_leads',1))*1000)/10:D.le.fP,fPC:D.le.fPC,
      pP:D.le.pP,pPC:D.le.pPC,td:D.le.td,
    },
  };
}

// ─── SHARED UI COMPONENTS ───
const ts={background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,fontSize:12,color:C.t,fontFamily:F};
const Arr=({v,s="%",z=13})=><span style={{display:"inline-flex",alignItems:"center",gap:3,color:v>0?C.g:v<0?C.r:C.tl,fontSize:z,fontWeight:700,fontFamily:F}}>{v>0?"▲":v<0?"▼":"—"} {Math.abs(v)}{s}</span>;
const SH=({title,sub})=><div style={{marginBottom:10}}><h2 style={{fontSize:16,fontWeight:700,color:C.t,margin:0,fontFamily:F}}>{title}</h2>{sub&&<p style={{fontSize:11,color:C.tl,margin:"2px 0 0",fontFamily:F}}>{sub}</p>}</div>;
const Sc=({children,s})=><div style={{background:C.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.bd}`,boxShadow:C.sh,marginBottom:16,...s}}>{children}</div>;
const Tip=({text})=>{const[s,ss]=useState(false);return<span onMouseEnter={()=>ss(true)}onMouseLeave={()=>ss(false)}style={{position:"relative",cursor:"help",marginLeft:4,color:C.tl,fontSize:12}}>&#9432;{s&&<span style={{position:"absolute",bottom:"120%",left:"50%",transform:"translateX(-50%)",background:C.navy,color:"#fff",padding:"6px 10px",borderRadius:6,fontSize:11,width:200,textAlign:"center",zIndex:99,pointerEvents:"none",fontWeight:400,lineHeight:1.4}}>{text}</span>}</span>;};
const LC=({l,v,ch,cl,tip})=><div style={{background:C.white,borderRadius:10,padding:"18px 20px",border:`1px solid ${C.bd}`,flex:1,minWidth:140,boxShadow:C.sh,textAlign:"center"}}><div style={{fontSize:11,color:C.tl,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{l}{tip&&<Tip text={tip}/>}</div><div style={{fontSize:32,fontWeight:700,color:C.t,fontFamily:F,lineHeight:1.1,marginBottom:6}}>{typeof v==="number"?v.toLocaleString():v}</div><div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}>{ch?.[0]!==undefined&&cl?.[0]&&<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:C.tl,fontWeight:600,fontFamily:F}}>{cl[0]}</span><Arr v={ch[0]}z={12}/></div>}{ch?.[1]!==undefined&&cl?.[1]&&<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:C.tl,fontWeight:600,fontFamily:F}}>{cl[1]}</span><Arr v={ch[1]}z={12}/></div>}</div></div>;
const CC=({l,v,ch,ci,cl,tip})=>{const c=ch?.[ci];return<div style={{background:C.white,borderRadius:10,padding:"18px 20px",border:`1px solid ${C.bd}`,flex:1,minWidth:140,boxShadow:C.sh,textAlign:"center"}}><div style={{fontSize:11,color:C.tl,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{l}{tip&&<Tip text={tip}/>}</div><div style={{fontSize:32,fontWeight:700,color:C.t,fontFamily:F,lineHeight:1.1,marginBottom:6}}>{typeof v==="number"?v.toLocaleString():v}</div>{c!==undefined&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><span style={{fontSize:9,color:C.tl,fontWeight:600,fontFamily:F}}>{cl}</span><Arr v={c}z={12}/></div>}</div>;};
const BM=({l,v,ch,pre="",suf="",ci})=>{const c=ch?ch[ci]:undefined;return<div style={{flex:1,minWidth:100,textAlign:"center",padding:"12px 6px"}}><div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,fontFamily:F}}>{l}</div><div style={{fontSize:24,fontWeight:700,color:"#fff",fontFamily:F,lineHeight:1.1,marginBottom:4}}>{pre}{typeof v==="number"?v.toLocaleString():v}{suf}</div>{c!==undefined&&<span style={{fontSize:12,fontWeight:700,fontFamily:F,color:c>0?"#6ee7b7":c<0?"#fca5a5":"rgba(255,255,255,0.4)"}}>{c>0?"▲":c<0?"▼":"—"} {Math.abs(c)}%</span>}</div>;};
const BC=({ic,la,hl,ch})=><div style={{background:`linear-gradient(135deg,${C.bc},${C.bl})`,borderRadius:12,padding:"18px 22px",border:`1px solid ${C.bb}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:18}}>{ic}</span><span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:F}}>{la}</span></div>{ch}{hl&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.1)",fontSize:12}}><span style={{color:"rgba(255,255,255,0.4)",fontSize:10,textTransform:"uppercase",fontWeight:700,fontFamily:F}}>Highlight: </span><span style={{color:"#fff",fontWeight:600,fontFamily:F}}>{hl}</span></div>}</div>;
const SecWrap=({title,children})=><div style={{marginBottom:24}}><h3 style={{fontSize:15,fontWeight:700,color:C.t,margin:"0 0 10px",fontFamily:F}}>{title}</h3>{children}</div>;
const DKpi=({label,value,tip,sub,color})=><div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"16px 20px",flex:1,minWidth:140,boxShadow:C.sh}}><div style={{fontSize:11,color:C.tl,fontWeight:700,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{label}{tip&&<Tip text={tip}/>}</div><div style={{fontSize:28,fontWeight:800,color:color||C.t,fontFamily:F}}>{value}</div>{sub&&<div style={{fontSize:11,color:C.tl,marginTop:2,fontFamily:F}}>{sub}</div>}</div>;

// Live text renderers — used when real data has notes/wins/losses
const LiveLines=({text,bg,border,color,icon})=>{
  if(!text)return null;
  const items=text.split('\n').filter(l=>l.trim());
  if(!items.length)return null;
  return<>{items.map((item,i)=><div key={i}style={{background:bg,border:`1px solid ${border}`,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F,color,marginBottom:6}}>{icon} {item}</div>)}</>;
};

const WinLoss=({wins=[],losses=[],liveWins,liveLosses})=>{
  if(liveWins||liveLosses){
    return<SecWrap title="Wins &amp; Losses">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><LiveLines text={liveWins} bg="#f0fdf4" border="#bbf7d0" color="#166534" icon="✅"/></div>
        <div><LiveLines text={liveLosses} bg="#fef2f2" border="#fecaca" color="#991b1b" icon="⚠️"/></div>
      </div>
    </SecWrap>;
  }
  return<SecWrap title="Wins &amp; Losses"><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{wins.map((w,i)=><div key={i}style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F,color:"#166534"}}>&#x2705; {w}</div>)}{losses.map((l,i)=><div key={i}style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F,color:"#991b1b"}}>&#x26A0;&#xFE0F; {l}</div>)}</div></SecWrap>;
};

const WorkDone=({items=[],liveText})=>{
  if(liveText){
    return<SecWrap title="Work Completed"><div style={{display:"flex",flexDirection:"column",gap:8}}>{liveText.split('\n').filter(l=>l.trim()).map((it,i)=><div key={i}style={{background:"#f8fafc",border:`1px solid ${C.bd}`,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F}}>{it}</div>)}</div></SecWrap>;
  }
  return<SecWrap title="Work Completed"><div style={{display:"flex",flexDirection:"column",gap:8}}>{items.map((it,i)=><div key={i}style={{background:"#f8fafc",border:`1px solid ${C.bd}`,borderRadius:8,padding:"10px 14px",fontSize:13,fontFamily:F}}><strong>{it.task}</strong> — {it.desc}</div>)}</div></SecWrap>;
};

const NextMonth=({items=[],liveText})=>{
  const list=liveText?liveText.split('\n').filter(l=>l.trim()):items;
  return<SecWrap title="What's Coming Next Month"><div style={{display:"flex",flexDirection:"column",gap:6}}>{list.map((it,i)=><div key={i}style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontFamily:F,padding:"6px 0"}}><span style={{color:C.cyan,fontWeight:700}}>&#x2192;</span>{it}</div>)}</div></SecWrap>;
};

/* ─── DASHBOARD ─── */
function Dashboard({ci,cls,d}){
  const dd=d||D;
  return<>
    <SH title="Lead Summary" sub="Total leads across all channels"/>
    <div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}>
      <LC l="Total Leads" v={dd.le.tl} ch={dd.le.tlC} cl={cls} tip="All leads across every source this period."/>
      <LC l="Website" v={dd.le.wb} ch={dd.le.wbC} cl={cls} tip="Leads submitted directly from the dealership website."/>
      <LC l="Third Party" v={dd.le.tp} ch={dd.le.tpC} cl={cls} tip="Leads from third-party providers like Cars.com, AutoTrader, etc."/>
      <LC l="Facebook" v={dd.le.fb} ch={dd.le.fbC} cl={cls} tip="Leads generated from Facebook Lead Ad forms."/>
    </div>
    <SH title="Phone Calls (CallRail)"/>
    <div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}>
      <CC l="Total Calls" v={dd.cr.tl} ch={dd.cr.tlC} ci={ci} cl={cls[ci]} tip="Total tracked calls this period."/>
      <CC l="From Website" v={dd.cr.ws} ch={dd.cr.wsC} ci={ci} cl={cls[ci]} tip="Calls attributed to website visits."/>
      <CC l="From Ads" v={dd.cr.ad} ch={dd.cr.adC} ci={ci} cl={cls[ci]} tip="Calls attributed to paid ad campaigns."/>
      <CC l="From Google Business" v={dd.cr.gm} ch={dd.cr.gmC} ci={ci} cl={cls[ci]} tip="Calls from the GBP call button."/>
    </div>
    <div style={{display:"flex",gap:14,marginBottom:22,flexWrap:"wrap"}}>
      <div style={{flex:3,minWidth:340,background:C.white,borderRadius:10,padding:"18px 20px",border:`1px solid ${C.bd}`,boxShadow:C.sh}}>
        <SH title="Annual Lead Trend"/>
        <ResponsiveContainer width="100%"height={200}><LineChart data={dd.le.td}><CartesianGrid strokeDasharray="3 3"stroke={C.bl2}/><XAxis dataKey="m"tick={{fontSize:11,fill:C.tl}}/><YAxis tick={{fontSize:11,fill:C.tl}}/><Tooltip contentStyle={ts}/><Line type="monotone"dataKey="l"stroke={C.cyan}strokeWidth={2.5}dot={{r:3,fill:C.cyan,stroke:C.white,strokeWidth:2}}name="Leads"/><Line type="monotone"dataKey="s"stroke={C.g}strokeWidth={2.5}dot={{r:3,fill:C.g,stroke:C.white,strokeWidth:2}}name="Sold"/></LineChart></ResponsiveContainer>
      </div>
      <div style={{flex:2,minWidth:280,display:"flex",flexDirection:"column",gap:10}}>
        <SH title="Sold % by Source"/>
        <div style={{display:"flex",gap:10,flex:1,flexWrap:"wrap"}}>
          {[{l:"Website",p:dd.le.wP,ch:dd.le.wPC,s:dd.le.wS,ld:dd.le.wb,c:C.cyan},{l:"Third Party",p:dd.le.tP,ch:dd.le.tPC,s:dd.le.tS,ld:dd.le.tp,c:C.p},{l:"Facebook",p:dd.le.fP,ch:dd.le.fPC,s:dd.le.fS,ld:dd.le.fb,c:C.g},{l:"Phone",p:dd.le.pP,ch:dd.le.pPC,s:dd.le.pS,ld:dd.cr.tl,c:C.o}].map((s,i)=><div key={i}style={{flex:1,minWidth:120,background:C.white,borderRadius:10,padding:"14px 12px",border:`1px solid ${C.bd}`,boxShadow:C.sh,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><div style={{fontSize:10,color:C.tl,fontWeight:700,textTransform:"uppercase",marginBottom:3,fontFamily:F}}>{s.l}</div><div style={{fontSize:28,fontWeight:700,color:s.c,fontFamily:F}}>{s.p}%</div>{s.ch?.[ci]!==undefined&&<div style={{marginTop:3}}><Arr v={s.ch[ci]}s=" pts"z={12}/></div>}<div style={{fontSize:9,color:C.tl,marginTop:2,fontFamily:F}}>{s.s} sold / {s.ld} leads</div></div>)}
        </div>
      </div>
    </div>
    <SH title="Department Performance"/>
    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
      <BC ic="&#x1F50D;"la="SEO"hl={dd.seo.w}ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions"v={dd.seo.ca+dd.seo.fo}ch={[21.8,48.7]}ci={ci}/><BM l="Traffic"v={dd.seo.tr}ch={dd.seo.trC}ci={ci}/><BM l="Page 1 KWs"v={dd.seo.kw}ch={dd.seo.kwC}ci={ci}/><BM l="Impressions"v={dd.seo.im}ch={dd.seo.imC}ci={ci}/><BM l="GBP Views"v={dd.seo.gV}ch={dd.seo.gVC}ci={ci}/><BM l="GBP Calls"v={dd.seo.gCa}ch={dd.seo.gCaC}ci={ci}/></div>}/>
      <BC ic="&#x1F4CD;"la="Google Business Profile"ch={<><div style={{display:"flex",flexWrap:"wrap"}}><BM l="Views"v={dd.gbp.vi}ch={dd.gbp.viC}ci={ci}/><BM l="Searches"v={dd.gbp.se}ch={dd.gbp.seC}ci={ci}/><BM l="Map Views"v={dd.gbp.ma}ch={dd.gbp.maC}ci={ci}/><BM l="Web Clicks"v={dd.gbp.wc}ch={dd.gbp.wcC}ci={ci}/><BM l="Calls"v={dd.gbp.ca}ch={dd.gbp.caC}ci={ci}/><BM l="Directions"v={dd.gbp.di}ch={dd.gbp.diC}ci={ci}/></div><div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}><span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:F}}>&#x2B50; <strong style={{color:"#fbbf24"}}>{dd.gbp.ra}</strong> ({dd.gbp.rv} reviews)</span><span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:F}}>+{dd.gbp.nr} new</span></div></>}/>
      <BC ic="&#x1F4E2;"la="Google Ads"hl={"Top: "+dd.gads.tp}ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions"v={dd.gads.ca+dd.gads.fo}ch={dd.gads.cC}ci={ci}/><BM l="Cost/Lead"v={dd.gads.cpl}ch={dd.gads.cplC}pre="$"ci={ci}/><BM l="Spend"v={dd.gads.sp}pre="$"ci={ci}/><BM l="CTR"v={dd.gads.ctr}ch={dd.gads.ctrC}suf="%"ci={ci}/><BM l="CPC"v={dd.gads.cpc}ch={dd.gads.cpcC}pre="$"ci={ci}/><BM l="Imp Share"v={dd.gads.is}ch={dd.gads.isC}suf="%"ci={ci}/></div>}/>
      <BC ic="&#x1F4F1;"la="Meta Ads"hl={"Top: "+dd.meta.tp}ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions"v={dd.meta.ca+dd.meta.fo+dd.meta.le}ch={dd.meta.cC}ci={ci}/><BM l="Cost/Lead"v={dd.meta.cpl}ch={dd.meta.cplC}pre="$"ci={ci}/><BM l="Reach"v={dd.meta.re}ch={dd.meta.reC}ci={ci}/><BM l="CPC"v={dd.meta.cpc}ch={dd.meta.cpcC}pre="$"ci={ci}/><BM l="Frequency"v={dd.meta.fr}ch={dd.meta.frC}ci={ci}/><BM l="Eng Rate"v={dd.meta.er}ch={dd.meta.erC}suf="%"ci={ci}/></div>}/>
      <BC ic="&#x1F3AC;"la="Organic Social"hl={"&#x1F3AC; "+dd.so.tv+" \u2014 "+(dd.so.tvV||0).toLocaleString()+" views"}ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Reach"v={dd.so.re}ch={dd.so.reC}ci={ci}/><BM l="Engagement"v={dd.so.en}ch={dd.so.enC}ci={ci}/><BM l="Followers"v={dd.so.fl}ch={dd.so.flC}pre="+"ci={ci}/><BM l="Posts"v={dd.so.po}ci={ci}/><BM l="Videos"v={dd.so.vi}ci={ci}/><BM l="Web Clicks"v={dd.so.wc}ch={dd.so.wcC}ci={ci}/></div>}/>
      <div style={{display:"flex",gap:12}}>
        <BC ic="&#x2709;&#xFE0F;"la="Email"ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Campaigns"v={dd.em.cp}ci={ci}/><BM l="Recipients"v={dd.em.rc}ci={ci}/><BM l="Site Visits"v={dd.em.vs}ch={dd.em.vsC}ci={ci}/></div>}/>
        <BC ic="&#x1F3A8;"la="Creative"ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Delivered"v={dd.cv.tl}ci={ci}/><BM l="Graphics"v={dd.cv.gr}ci={ci}/><BM l="Banners"v={dd.cv.ba}ci={ci}/><BM l="Print"v={dd.cv.pr}ci={ci}/></div>}/>
      </div>
    </div>
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Sc s={{flex:1,minWidth:260}}><SH title="Key Highlights"/><div style={{display:"flex",flexDirection:"column",gap:6}}>{[{i:"&#x1F50D;",t:'"F-150 Twin Falls" Pos 1'},{i:"&#x1F4E2;",t:"Ads CPL dropped 8.7%"},{i:"&#x1F4DE;",t:"CallRail up 18.2%"},{i:"&#x1F3AC;",t:"Social engagement up 38.1%"},{i:"&#x26A0;&#xFE0F;",t:"Rob Green Ford growing"}].map((h,i)=><div key={i}style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",borderRadius:6,background:"rgba(232,236,242,0.7)"}}><span style={{fontSize:14}}dangerouslySetInnerHTML={{__html:h.i}}/><span style={{fontSize:12,color:C.tm,lineHeight:1.4,fontFamily:F,fontWeight:600}}>{h.t}</span></div>)}</div></Sc>
      <Sc s={{flex:1,minWidth:260}}><SH title="Coming Next Month"/><div style={{display:"flex",flexDirection:"column",gap:5}}>{[{d:"SEO",t:"Maverick page + competitor analysis"},{d:"GBP",t:"Posting 3x/week"},{d:"Ads",t:"VLA used inventory"},{d:"Meta",t:"Reels spring event"},{d:"Social",t:"Service video series"},{d:"Email",t:"Spring Service Special"}].map((x,i)=><div key={i}style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",borderRadius:6,background:"rgba(232,236,242,0.7)"}}><span style={{fontSize:10,fontWeight:700,color:C.cyanD,background:C.cyanL,padding:"2px 7px",borderRadius:3,flexShrink:0,marginTop:1,fontFamily:F}}>{x.d}</span><span style={{fontSize:12,color:C.tm,lineHeight:1.4,fontFamily:F,fontWeight:600}}>{x.t}</span></div>)}</div></Sc>
    </div>
  </>;
}

/* ─── SEO ─── */
const seoTd=[{m:"Mar",v:5200},{m:"Apr",v:5800},{m:"May",v:6100},{m:"Jun",v:5900},{m:"Jul",v:6400},{m:"Aug",v:6800},{m:"Sep",v:7100},{m:"Oct",v:7400},{m:"Nov",v:7180},{m:"Dec",v:7600},{m:"Jan",v:7900},{m:"Feb",v:8420}];
const tmix=[{name:"Organic",value:62,color:"#00c9e8"},{name:"Direct",value:18,color:"#0c1a2e"},{name:"Paid",value:12,color:"#f59e0b"},{name:"Social",value:5,color:"#ec4899"},{name:"Other",value:3,color:"#9ca3af"}];
const kwD=[{range:"Position 1",count:12,fill:"#22c55e"},{range:"Pos 2-3",count:28,fill:"#00c9e8"},{range:"Pos 4-10",count:47,fill:"#0c1a2e"},{range:"Pos 11-20",count:31,fill:"#f59e0b"},{range:"Pos 20+",count:14,fill:"#9ca3af"}];
function SeoPage({d}){
  const dd=d||D;
  return<div>
  <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Phone Calls" value={dd.seo.ca} tip="Tracked calls from the website via CallRail." sub="▲ 20.3% MoM · ▲ 44.9% YoY" color={C.cyan}/>
    <DKpi label="Form Submissions" value={dd.seo.fo} tip="Contact, trade-in, and finance forms via GA4." sub="▲ 24.1% MoM · ▲ 59.5% YoY" color={C.cyan}/>
    <DKpi label="CTR" value={`${dd.seo.ctr}%`} tip="Click-through rate from Google Search. Higher = stronger title tags and meta descriptions." sub="▲ 0.8% MoM · Industry avg 2-4%"/>
    <DKpi label="Organic Sessions" value={(dd.seo.tr).toLocaleString()} tip="Website visits from organic (unpaid) Google search." sub="▲ 17.3% MoM · ▲ 42.7% YoY"/>
    <DKpi label="Page 1 Keywords" value={dd.seo.kw} tip="Number of target keywords ranking on Google page 1." sub="▲ 8 MoM · ▲ 22 YoY"/>
    <DKpi label="GBP Calls" value={dd.seo.gCa} tip="Phone calls made directly from the Google Business Profile listing." sub="▲ 14.1% MoM · ▲ 44.2% YoY"/>
  </div></SecWrap>
  <SecWrap title="Secondary Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="VDP Views" value={(dd.seo.gV).toLocaleString()} tip="Vehicle Detail Page views — high-intent shoppers looking at specific inventory." sub="▲ 18.2% MoM"/>
    <DKpi label="Direction Requests" value={dd.gbp?.di||156} tip="Users who requested directions to the dealership from GBP." sub="▲ 13.0% MoM"/>
    <DKpi label="Chat Conversations" value="41" tip="Chat sessions initiated on the website." sub="▲ 5% MoM"/>
  </div></SecWrap>
  <div style={{display:"flex",gap:20,marginBottom:24,flexWrap:"wrap"}}>
    <div style={{flex:2,minWidth:300,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t,marginBottom:12,fontFamily:F}}>Organic Traffic Trend</div>
      <ResponsiveContainer width="100%"height={180}><LineChart data={dd.seo.td||seoTd}><CartesianGrid strokeDasharray="3 3"stroke={C.bl2}/><XAxis dataKey="m"tick={{fontSize:11,fill:C.tl}}/><YAxis tick={{fontSize:11,fill:C.tl}}/><Tooltip contentStyle={ts}/><Line type="monotone"dataKey="v"stroke={C.cyan}strokeWidth={2.5}dot={{r:3,fill:C.cyan,stroke:C.white,strokeWidth:2}}name="Sessions"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{flex:1,minWidth:200,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t,marginBottom:8,fontFamily:F}}>Organic % of Total Traffic</div>
      <PieChart width={150}height={150}><Pie data={tmix}cx={75}cy={75}innerRadius={40}outerRadius={68}dataKey="value">{tmix.map((e,i)=><Cell key={i}fill={e.color}/>)}</Pie><Tooltip formatter={v=>`${v}%`}/></PieChart>
      <div style={{fontSize:28,fontWeight:800,color:C.cyan,fontFamily:F}}>62%</div>
      <div style={{fontSize:11,color:C.tl,fontFamily:F}}>organic-driven</div>
    </div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
    <SecWrap title="Top 10 Queries by Clicks">
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden",boxShadow:C.sh}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}><thead><tr style={{background:"#f8fafc"}}><th style={{padding:"8px 12px",textAlign:"left",color:C.tl}}>Query</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Clicks</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Pos</th></tr></thead>
        <tbody>{[["ford f-150 twin falls",284,1],["buy truck twin falls idaho",198,1],["ford dealer near me",176,1],["goode motor ford",164,1],["ford truck deals idaho",142,2],["twin falls ford service",128,4],["ford explorer for sale",118,3],["twin falls auto dealer",106,2],["certified used ford twin falls",94,5],["ford maverick hybrid idaho",87,6]].map(([q,c,p],i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}><td style={{padding:"8px 12px",color:C.t}}>{q}</td><td style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>{c}</td><td style={{padding:"8px 12px",textAlign:"right"}}><span style={{background:p<=3?"#dcfce7":p<=10?C.cyanL:"#fef9c3",color:p<=3?"#166534":p<=10?C.cyanD:"#854d0e",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>#{p}</span></td></tr>)}</tbody></table>
      </div>
    </SecWrap>
    <div>
      <SecWrap title="Top 5 Rising Queries">
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[["ford lightning twin falls","+140%","#8"],["electric truck idaho","+98%","#12"],["ford bronco deals","+76%","#5"],["used trucks under 30000 twin falls","+64%","#9"],["ford service center hours","+51%","#6"]].map(([q,ch,p],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,fontFamily:F,boxShadow:C.sh}}><span style={{color:C.t}}>{q}</span><div style={{display:"flex",gap:8}}><span style={{color:C.g,fontWeight:700}}>{ch}</span><span style={{background:C.cyanL,color:C.cyanD,borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600}}>{p}</span></div></div>)}
        </div>
      </SecWrap>
      <SecWrap title="Keyword Position Distribution">
        <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:16,boxShadow:C.sh}}>
          <ResponsiveContainer width="100%"height={140}><BarChart data={kwD}layout="vertical"><XAxis type="number"tick={{fontSize:11,fill:C.tl}}/><YAxis dataKey="range"type="category"width={75}tick={{fontSize:11,fill:C.tl}}/><Tooltip/><Bar dataKey="count"radius={[0,4,4,0]}>{kwD.map((e,i)=><Cell key={i}fill={e.fill}/>)}</Bar></BarChart></ResponsiveContainer>
        </div>
      </SecWrap>
    </div>
  </div>
  <SecWrap title="Competitor Comparison">
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden",boxShadow:C.sh}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:13}}><thead><tr style={{background:"#f8fafc"}}><th style={{padding:"10px 16px",textAlign:"left",color:C.tl}}>Competitor</th><th style={{padding:"10px 16px",textAlign:"right",color:C.tl}}>Est. Traffic</th><th style={{padding:"10px 16px",textAlign:"right",color:C.tl}}>Ranking KWs</th><th style={{padding:"10px 16px",textAlign:"right",color:C.tl}}>Overlap</th></tr></thead>
      <tbody>{[["Goode Motor Ford (You)",8420,132,"—",true],["Magic Valley Ford",5910,98,"42 KWs",false],["Carbaglio's Auto Sales",3240,54,"28 KWs",false],["Twin Falls Toyota",6820,118,"19 KWs",false]].map(([n,t,k,o,me],i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`,background:me?"#f0f9ff":"transparent"}}><td style={{padding:"10px 16px",fontWeight:me?700:400,color:me?C.t:C.tl}}>{n}{me&&<span style={{marginLeft:6,background:C.cyan,color:C.navy,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700}}>YOU</span>}</td><td style={{padding:"10px 16px",textAlign:"right",fontWeight:600}}>{t.toLocaleString()}</td><td style={{padding:"10px 16px",textAlign:"right"}}>{k}</td><td style={{padding:"10px 16px",textAlign:"right",color:C.tl,fontSize:12}}>{o}</td></tr>)}</tbody></table>
    </div>
  </SecWrap>
  <SecWrap title="Pages Built & Optimized">
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {[["New Ford F-150 Lightning in Twin Falls","Feb 28","ford lightning twin falls, electric truck idaho"],["Ford Service Special Offers Page","Feb 14","ford service twin falls, oil change twin falls idaho"],["Used Trucks Under $30,000","Feb 7","used trucks twin falls, affordable trucks idaho"]].map(([t,dt,kw],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,padding:"12px 16px",fontFamily:F,boxShadow:C.sh}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><a href="#"style={{color:C.cyan,fontWeight:600,fontSize:13,textDecoration:"none"}}>{t}</a><span style={{fontSize:11,color:C.tl}}>Published {dt}</span></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{kw.split(", ").map(k=><span key={k}style={{background:C.cyanL,color:C.cyanD,borderRadius:4,padding:"2px 8px",fontSize:11}}>{k}</span>)}</div></div>)}
    </div>
  </SecWrap>
  <WorkDone liveText={dd.seo?.work_completed} items={[{task:"Meta Title & Description Optimization",desc:"Updated 14 VDP and service pages targeting higher CTR."},{task:"Local Citation Audit",desc:"Found and corrected 6 inconsistent NAP entries across 12 directories."},{task:"March Content Calendar",desc:"Planned and briefed 4 SEO blog posts targeting spring buyers."},{task:"Core Web Vitals Review",desc:"Identified 3 pages with slow LCP — flagged for dev."},{task:"GBP Post Publishing",desc:"Published 8 posts including specials and event updates."}]}/>
  <WinLoss liveWins={dd.seo?.wins} liveLosses={dd.seo?.losses} wins={["Organic traffic at 8,420 — highest month ever","47 page 1 keywords — up 5 from last month",'"F-150 Twin Falls" moved to #1']}losses={["CTR on service pages below 4% — needs meta description rewrites","3 Core Web Vitals failures on high-traffic pages"]}/>
  <NextMonth liveText={dd.seo?.next_month} items={["Rewrite meta descriptions on 8 underperforming service pages","Publish 4 SEO blogs targeting spring truck buyers","Fix Core Web Vitals failures","Launch Ford EV landing page","Expand GBP post cadence to 3x/week"]}/>
</div>;}

/* ─── GBP ─── */
function GbpPage({d}){
  const dd=d||D;
  return<div>
  <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Profile Views" value={(dd.gbp.vi).toLocaleString()} tip="Total times your GBP profile was seen." sub="▲ 16.5% MoM · ▲ 38.2% YoY"/>
    <DKpi label="Search Appearances" value={(dd.gbp.se).toLocaleString()} tip="Times your business appeared in Google Search." sub="▲ 16.6% MoM · ▲ 42.1% YoY"/>
    <DKpi label="Map Views" value={(dd.gbp.ma).toLocaleString()} tip="Times your location appeared in Google Maps." sub="▲ 12.3% MoM · ▲ 28.8% YoY"/>
    <DKpi label="Website Clicks" value={(dd.gbp.wc).toLocaleString()} tip="Clicks from GBP to your website." sub="▲ 18.4% MoM · ▲ 34.5% YoY"/>
    <DKpi label="Phone Calls" value={dd.gbp.ca} tip="Calls made directly from the GBP listing." sub="▲ 20.3% MoM · ▲ 44.2% YoY" color={C.cyan}/>
    <DKpi label="Direction Requests" value={dd.gbp.di} tip="Users who requested directions to your dealership." sub="▲ 13.0% MoM · ▲ 28.5% YoY"/>
  </div></SecWrap>
  <SecWrap title="Reviews">
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh}}>
      <div style={{display:"flex",gap:32,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:48,fontWeight:800,color:C.t,fontFamily:F}}>{dd.gbp.ra}</div><div style={{color:C.o,fontSize:22}}>&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</div><div style={{fontSize:12,color:C.tl,fontFamily:F}}>{dd.gbp.rv} reviews</div></div>
        <div style={{display:"flex",gap:12,flex:1,flexWrap:"wrap"}}><DKpi label="New Reviews" value={`+${dd.gbp.nr}`} color={C.g}/><DKpi label="Response Rate" value="100%" color={C.cyan}/><DKpi label="Avg Response" value="4 hrs"/><DKpi label="Photos" value={dd.gbp.ph}/></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["Mike R.",5,"Really impressed with the team here. Jake in sales was upfront and honest.","Feb 22"],["Sarah T.",5,"Best car buying experience I've ever had. Will be back for my next vehicle.","Feb 18"],["Tom D.",4,"Good service department, quick oil change. Waiting area could use an update.","Feb 11"],["Angela M.",5,"They found exactly what I was looking for within my budget. Highly recommend.","Feb 5"]].map(([n,s,r,dt],i)=><div key={i}style={{background:"#f8fafc",borderRadius:8,padding:"12px 16px",fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontWeight:600,color:C.t,fontSize:13}}>{n}</span><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:C.o}}>{"★".repeat(s)}</span><span style={{fontSize:11,color:C.tl}}>{dt}</span></div></div><p style={{fontSize:12,color:C.tl,margin:0}}>{r}</p></div>)}
      </div>
    </div>
  </SecWrap>
  <SecWrap title="GBP Posts Published">
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden",boxShadow:C.sh}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}><thead><tr style={{background:"#f8fafc"}}><th style={{padding:"8px 12px",textAlign:"left",color:C.tl}}>Post</th><th style={{padding:"8px 12px",textAlign:"center",color:C.tl}}>Type</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Date</th><th style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>Views</th></tr></thead>
      <tbody>{[["Presidents Day Sales Event","Event","Feb 12",824],["New F-150 Lightning Arrivals","Update","Feb 9",612],["Service Specials February","Offer","Feb 5",541],["Truck Month — Best Selection in Idaho","Update","Feb 2",498],["Employee Spotlight","Update","Jan 29",387],["Finance Specials — 0% APR","Offer","Jan 26",712],["New Inventory Alert — Explorer","Update","Jan 22",334],["Certified Pre-Owned Ford Event","Event","Jan 18",445]].map(([t,ty,dt,v],i)=>{const tc={Event:C.o,Update:C.cyan,Offer:C.g};return<tr key={i}style={{borderTop:`1px solid ${C.bd}`}}><td style={{padding:"8px 12px",color:C.t}}>{t}</td><td style={{padding:"8px 12px",textAlign:"center"}}><span style={{background:tc[ty]+"22",color:tc[ty],borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600}}>{ty}</span></td><td style={{padding:"8px 12px",textAlign:"right",color:C.tl}}>{dt}</td><td style={{padding:"8px 12px",textAlign:"right",fontWeight:600}}>{v.toLocaleString()}</td></tr>;})}</tbody></table>
    </div>
  </SecWrap>
  <WorkDone liveText={dd.gbp?.work_completed} items={[{task:"Weekly GBP Posts",desc:"Published 8 posts covering events, offers, and inventory updates."},{task:"Review Response",desc:"Responded to all 8 new reviews within 4 hours."},{task:"Photo Refresh",desc:"Added 6 new exterior and showroom photos."},{task:"Holiday Hours Update",desc:"Updated Presidents Day hours across the profile."},{task:"Q&A Monitoring",desc:"Answered 3 new customer questions."}]}/>
  <WinLoss liveWins={dd.gbp?.wins} liveLosses={dd.gbp?.losses} wins={["100% review response rate","Profile views up 16.5% MoM","8 posts published — hit our target cadence"]}losses={["2 unanswered Q&A questions found from January — now resolved"]}/>
  <NextMonth liveText={dd.gbp?.next_month} items={["Increase post cadence to 10/month","Schedule spring photo shoot","Launch QR code review cards","Prepare March Madness themed posts","Audit and update all business categories"]}/>
</div>;}

/* ─── GOOGLE ADS ─── */
const adTd=[{m:"Oct",conv:108},{m:"Nov",conv:118},{m:"Dec",conv:124},{m:"Jan",conv:116},{m:"Feb",conv:123}];
function GoogleAdsPage({d}){
  const dd=d||D;
  return<div>
  <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Conversions" value={dd.gads.ca} tip="Total tracked conversions from Google Ads." sub="▲ 22.8% MoM · ▲ 52.1% YoY" color={C.cyan}/>
    <DKpi label="Cost / Lead" value={`$${dd.gads.cpl}`} tip="Average cost per conversion. Industry avg: $25-$45." sub="▼ 8.7% MoM (better)" color={C.g}/>
    <DKpi label="Total Spend" value={`$${(dd.gads.sp).toLocaleString()}`} tip="Total ad spend this period." sub="Budget: $5,000"/>
    <DKpi label="CTR" value={`${dd.gads.ctr}%`} tip="Click-through rate. Industry avg: 8.29%." sub="▲ 4.6% MoM"/>
    <DKpi label="Avg CPC" value={`$${dd.gads.cpc}`} tip="Average cost per click. Industry avg: $2.41." sub="▼ 3.1% MoM (better)"/>
    <DKpi label="Impression Share" value={`${dd.gads.is}%`} tip="% of eligible searches you appeared for. Higher = more visibility." sub="▲ 6% MoM"/>
  </div></SecWrap>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t,marginBottom:12,fontFamily:F}}>Conversion Trend</div>
      <ResponsiveContainer width="100%"height={160}><LineChart data={adTd}><CartesianGrid strokeDasharray="3 3"stroke={C.bl2}/><XAxis dataKey="m"tick={{fontSize:11,fill:C.tl}}/><YAxis tick={{fontSize:11,fill:C.tl}}/><Tooltip contentStyle={ts}/><Line type="monotone"dataKey="conv"stroke={C.cyan}strokeWidth={2.5}name="Conversions"/></LineChart></ResponsiveContainer>
    </div>
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t,marginBottom:12,fontFamily:F}}>Performance Max Channel Split</div>
      {[{ch:"Search",pct:42,c:C.navy},{ch:"YouTube",pct:24,c:"#ef4444"},{ch:"Display",pct:18,c:C.cyan},{ch:"Maps",pct:10,c:C.g},{ch:"Gmail",pct:6,c:C.o}].map(r=><div key={r.ch}style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:F,marginBottom:3}}><span>{r.ch}</span><span style={{fontWeight:600}}>{r.pct}%</span></div><div style={{background:C.bl2,borderRadius:4,height:8}}><div style={{background:r.c,borderRadius:4,height:8,width:`${r.pct}%`}}/></div></div>)}
    </div>
  </div>
  <SecWrap title="Campaign Breakdown">
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden",boxShadow:C.sh}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}><thead><tr style={{background:"#f8fafc"}}>{["Campaign","Type","Spend","CTR","CPC","Conv.","Cost/Conv."].map(h=><th key={h}style={{padding:"8px 12px",textAlign:h==="Campaign"||h==="Type"?"left":"right",color:C.tl,fontWeight:500}}>{h}</th>)}</tr></thead>
      <tbody>{[["Search — New Vehicles","Search","$2,140","9.1%","$0.49","84","$25.48"],["Performance Max","PMax","$1,820","2.6%","$0.57","62","$29.35"],["Vehicle Listing Ads","VLA","$980","7.7%","$0.33","24","$40.83"],["Display Remarketing","Display","$480","0.9%","$0.25","10","$48.00"],["YouTube Ads","YouTube","$300","2.3%","$0.71","4","$75.00"]].map((r,i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}>{r.map((c,j)=><td key={j}style={{padding:"8px 12px",textAlign:j<=1?"left":"right",color:j===0?C.t:C.tl}}>{c}</td>)}</tr>)}
      <tr style={{borderTop:`2px solid ${C.bd}`,background:"#f8fafc",fontWeight:700}}><td style={{padding:"8px 12px"}}>Totals</td><td/><td style={{padding:"8px 12px",textAlign:"right"}}>$5,720</td><td style={{padding:"8px 12px",textAlign:"right"}}>—</td><td style={{padding:"8px 12px",textAlign:"right"}}>$0.45</td><td style={{padding:"8px 12px",textAlign:"right"}}>184</td><td style={{padding:"8px 12px",textAlign:"right"}}>$31.09</td></tr></tbody></table>
    </div>
  </SecWrap>
  <WorkDone liveText={dd.gads?.work_completed} items={[{task:"PMax Asset Refresh",desc:"Uploaded 8 new images and 2 video assets."},{task:"Negative Keyword Audit",desc:"Added 34 negative keywords to cut irrelevant clicks."},{task:"VLA Feed Optimization",desc:"Updated vehicle pricing — reduced disapprovals by 12."},{task:"Budget Reallocation",desc:"Shifted $200/mo from Display to Search."},{task:"Ad Copy A/B Test",desc:"Launched test with 4 new headlines."}]}/>
  <WinLoss liveWins={dd.gads?.wins} liveLosses={dd.gads?.losses} wins={["CTR at 9.1% — above industry avg of 8.29%","Cost per lead within $25-$45 target range","Search campaign hitting $25 CPL"]}losses={["YouTube CPL at $75 — creative needs refresh","Display remarketing showing low engagement"]}/>
  <NextMonth liveText={dd.gads?.next_month} items={["Refresh YouTube ad creative with new vehicle footage","Rebuild Display remarketing audiences","Launch spring incentive Search ads for Lightning","Test higher PMax budget allocation","Optimize VLA titles and descriptions"]}/>
</div>;}

/* ─── META ADS ─── */
function MetaAdsPage({d}){
  const dd=d||D;
  const pd=[{name:"FB Feed",conv:48},{name:"IG Feed",conv:36},{name:"Reels",conv:24},{name:"Stories",conv:11},{name:"Marketplace",conv:6},{name:"Messenger",conv:2}];
  return<div>
    <SecWrap title="Key Metrics"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
      <DKpi label="Conversions" value={dd.meta.ca} tip="Total tracked conversions from Meta ads." sub="▲ 25.9% MoM · ▲ 48.3% YoY" color={C.cyan}/>
      <DKpi label="Cost / Lead" value={`$${dd.meta.cpl}`} tip="Average cost per lead. Industry avg: $35." sub="▼ 12.3% MoM (better)" color={C.g}/>
      <DKpi label="Reach" value={(dd.meta.re).toLocaleString()} tip="Unique people who saw your ads." sub="▲ 18.4% MoM"/>
      <DKpi label="Avg CPC" value={`$${dd.meta.cpc}`} tip="Cost per click. Industry avg: ~$0.79." sub="▼ 5.3% MoM (better)"/>
      <DKpi label="Frequency" value={dd.meta.fr} tip="Average times each person saw your ad. Over 3.0 = ad fatigue risk." sub="▲ 8.2% MoM"/>
      <DKpi label="Engagement Rate" value={`${dd.meta.er}%`} tip="Likes, comments, and shares as a % of reach." sub="▲ 11.4% MoM"/>
    </div></SecWrap>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh}}>
        <div style={{fontSize:13,fontWeight:600,color:C.t,marginBottom:12,fontFamily:F}}>Conversions by Placement</div>
        <ResponsiveContainer width="100%"height={180}><BarChart data={pd}><CartesianGrid strokeDasharray="3 3"stroke={C.bl2}/><XAxis dataKey="name"tick={{fontSize:10,fill:C.tl}}/><YAxis tick={{fontSize:11,fill:C.tl}}/><Tooltip contentStyle={ts}/><Bar dataKey="conv"fill={C.cyan}radius={[4,4,0,0]}name="Conversions"/></BarChart></ResponsiveContainer>
      </div>
      <SecWrap title="Meta-Specific Metrics">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <DKpi label="Lead Form Completion" value="68%" tip="Of people who opened a Lead Ad form, 68% submitted it." sub="Up from 51% after form simplification"/>
          <DKpi label="Video Completion (25%)" value="82%" tip="82% of viewers watched at least 25% of your video ads."/>
          <DKpi label="Video Completion (75%)" value="41%" tip="41% watched 75% or more."/>
          <DKpi label="Cost per VDP View" value="$4.20" tip="Cost to get one shopper to a specific vehicle listing page."/>
        </div>
      </SecWrap>
    </div>
    <SecWrap title="Top Performing Ads">
      {[["Presidents Day Truck Sale — Video","Video","Reels + FB Feed",420,"6.8%","$18"],["F-150 Lightning — Inventory Ad","Dynamic","FB Feed + IG",284,"4.1%","$22"],["0% APR Finance Offer","Image","FB Feed",198,"3.9%","$28"],["Service Coupon — Lead Ad","Lead Form","FB + Messenger",142,"8.2%","$14"]].map(([n,ty,pl,eng,er,cpl],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:16,marginBottom:10,boxShadow:C.sh,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontWeight:600,color:C.t,fontSize:13}}>{n}</span><div style={{display:"flex",gap:8}}><span style={{background:C.cyanL,color:C.cyanD,borderRadius:4,padding:"2px 8px",fontSize:11}}>{ty}</span><span style={{background:"#f3f4f6",color:C.tl,borderRadius:4,padding:"2px 8px",fontSize:11}}>{pl}</span></div></div><div style={{display:"flex",gap:24,fontSize:12,color:C.tl}}><span>Engagements: <strong style={{color:C.t}}>{eng.toLocaleString()}</strong></span><span>Eng Rate: <strong style={{color:C.t}}>{er}</strong></span><span>CPL: <strong style={{color:C.g}}>{cpl}</strong></span></div></div>)}
    </SecWrap>
    <WorkDone liveText={dd.meta?.work_completed} items={[{task:"Creative Refresh",desc:"New F-150 Lightning video swapped for underperforming static image."},{task:"Audience Rebuild",desc:"Rebuilt retargeting based on VDP visitors last 30 days."},{task:"Lead Ad Optimization",desc:"Reduced form fields from 5 to 3 — completion up from 51% to 68%."},{task:"Budget Reallocation",desc:"Shifted spend toward Reels based on CPL data."},{task:"Dynamic Inventory",desc:"Verified vehicle catalog feed — 214 vehicles syncing correctly."}]}/>
    <WinLoss liveWins={dd.meta?.wins} liveLosses={dd.meta?.losses} wins={["CPL at $23.91 — 32% below industry avg of $35","Lead form completion at 68% after simplification","Reels showing lowest CPL at $18"]}losses={["Frequency at 2.4 — approaching fatigue threshold","Messenger placement: only 2 conversions"]}/>
    <NextMonth liveText={dd.meta?.next_month} items={["Launch spring truck sale creative package","Pause Messenger — reallocate to Reels","Build lookalike audience from recent buyers","Test video testimonial ad format","Expand Dynamic Inventory to full CPO stock"]}/>
  </div>;
}

/* ─── ORGANIC SOCIAL ─── */
const rTd=[{m:"Oct",reach:48200},{m:"Nov",reach:54800},{m:"Dec",reach:61200},{m:"Jan",reach:72400},{m:"Feb",reach:81600},{m:"Mar",reach:89400}];
function SocialPage({d}){
  const dd=d||D;
  return<div>
  <SecWrap title="Monthly Overview"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Total Reach" value={(dd.so.re).toLocaleString()} tip="Unique people who saw your content." sub="▲ 24.0% MoM · ▲ 56.2% YoY"/>
    <DKpi label="Total Engagement" value={(dd.so.en).toLocaleString()} tip="Likes, comments, shares, and saves." sub="▲ 38.1% MoM · ▲ 72.4% YoY" color={C.cyan}/>
    <DKpi label="New Followers" value={`+${dd.so.fl}`} tip="Net new followers across all platforms." sub="▲ 12.4% MoM" color={C.g}/>
    <DKpi label="Posts Published" value={dd.so.po} tip="Total posts across all platforms this month."/>
    <DKpi label="Videos Published" value={dd.so.vi} tip="Video posts including Reels, TikTok, and YouTube."/>
    <DKpi label="Website Clicks" value={(dd.so.wc).toLocaleString()} tip="Clicks from social media to your website." sub="▲ 15.8% MoM"/>
  </div></SecWrap>
  <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:20,marginBottom:24}}>
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t,marginBottom:12,fontFamily:F}}>Monthly Reach Trend</div>
      <ResponsiveContainer width="100%"height={180}><BarChart data={rTd}><CartesianGrid strokeDasharray="3 3"stroke={C.bl2}/><XAxis dataKey="m"tick={{fontSize:11,fill:C.tl}}/><YAxis tick={{fontSize:11,fill:C.tl}}/><Tooltip contentStyle={ts}/><Bar dataKey="reach"fill={C.cyan}radius={[4,4,0,0]}name="Reach"/></BarChart></ResponsiveContainer>
    </div>
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,boxShadow:C.sh}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t,marginBottom:12,fontFamily:F}}>New Followers by Platform</div>
      {[{p:"Instagram",n:98,c:"#e1306c"},{p:"TikTok",n:84,c:"#333"},{p:"Facebook",n:42,c:"#1877f2"},{p:"YouTube",n:18,c:"#ff0000"},{p:"X / Twitter",n:6,c:"#1da1f2"}].map(r=><div key={r.p}style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:F,marginBottom:3}}><span>{r.p}</span><span style={{fontWeight:700,color:r.c}}>+{r.n}</span></div><div style={{background:C.bl2,borderRadius:4,height:7}}><div style={{background:r.c,borderRadius:4,height:7,width:`${(r.n/98)*100}%`}}/></div></div>)}
    </div>
  </div>
  <SecWrap title="Top Performing Content">
    {[["2026 F-150 Walkaround","Video",{YT:"4,820",FB:"3,210",IG:"7,640",TT:"18,200",X:"420"},"8.2%"],["F-150 Lightning First Drive","Video",{YT:"2,940",FB:"1,820",IG:"4,110",TT:"12,800",X:"280"},"7.4%"],["Customer Delivery Day Compilation","Video",{YT:"1,280",FB:"2,640",IG:"3,920",TT:"8,440",X:"180"},"11.2%"],["Truck vs Snow: Idaho Winter Test","Video",{YT:"6,420",FB:"4,180",IG:"5,640",TT:"22,100",X:"540"},"9.8%"],["Trade-In Value — How We Calculate It","Image",{YT:"—",FB:"1,840",IG:"2,280",TT:"—",X:"120"},"5.1%"]].map(([title,type,platforms,er],i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:16,marginBottom:10,boxShadow:C.sh,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontWeight:600,color:C.t,fontSize:13}}>{title}</span><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{background:type==="Video"?C.cyanL:"#f3f4f6",color:type==="Video"?C.cyanD:C.tl,borderRadius:4,padding:"2px 8px",fontSize:11}}>{type}</span><span style={{fontSize:12,color:C.tl}}>Eng: <strong style={{color:C.t}}>{er}</strong></span></div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.entries(platforms).map(([p,v])=><div key={p}style={{background:"#f8fafc",borderRadius:6,padding:"4px 10px",textAlign:"center",minWidth:60,border:`1px solid ${C.bd}`}}><div style={{fontSize:11,fontWeight:700,color:C.t}}>{v}</div><div style={{fontSize:10,color:C.tl}}>{p}</div></div>)}</div></div>)}
  </SecWrap>
  <SecWrap title="Platform Breakdown">
    <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden",boxShadow:C.sh}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}><thead><tr style={{background:"#f8fafc"}}>{["Platform","Followers","Growth","Views","Engagement","Posts"].map(h=><th key={h}style={{padding:"8px 12px",textAlign:h==="Platform"?"left":"right",color:C.tl,fontWeight:500}}>{h}</th>)}</tr></thead>
      <tbody>{[["YouTube","1,240","+18","14,820","4.8%","8"],["Facebook","3,840","+42","18,640","3.2%","12"],["Instagram","2,180","+98","21,480","6.8%","18"],["TikTok","1,020","+84","34,200","9.4%","10"],["X / Twitter","640","+6","4,180","1.1%","6"]].map((r,i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}>{r.map((c,j)=><td key={j}style={{padding:"8px 12px",textAlign:j===0?"left":"right",color:j===2?C.g:j===0?C.t:C.tl,fontWeight:j===0||j===2?600:400}}>{c}</td>)}</tr>)}
      <tr style={{borderTop:`2px solid ${C.bd}`,background:"#f8fafc",fontWeight:700}}><td style={{padding:"8px 12px"}}>Totals</td><td style={{padding:"8px 12px",textAlign:"right"}}>8,920</td><td style={{padding:"8px 12px",textAlign:"right",color:C.g}}>+248</td><td style={{padding:"8px 12px",textAlign:"right"}}>93,320</td><td style={{padding:"8px 12px",textAlign:"right"}}>6.2%</td><td style={{padding:"8px 12px",textAlign:"right"}}>54</td></tr></tbody></table>
    </div>
  </SecWrap>
  <WorkDone liveText={dd.so?.work_completed} items={[{task:"Content Production",desc:"Shot and edited 18 videos — lot walkthroughs, delivery days, Lightning."},{task:"Cross-Platform Publishing",desc:"34 posts distributed across 5 platforms with platform-specific formatting."},{task:"Community Management",desc:"Responded to 84 comments and DMs within 24 hours."},{task:"Hashtag Research",desc:"Updated hashtag sets — added 6 high-volume automotive tags."},{task:"Analytics Review",desc:"Identified TikTok as highest-reach platform."}]}/>
  <WinLoss liveWins={dd.so?.wins} liveLosses={dd.so?.losses} wins={["TikTok snow test video hit 22K views","Instagram followers grew 4.7% in one month","Engagement rate 6.2% — above automotive avg of 4.8%"]}losses={["X / Twitter at 1.1% engagement — consistently underperforming","YouTube subscriber growth slow despite high view counts"]}/>
  <NextMonth liveText={dd.so?.next_month} items={["Launch 4-part service department video series","March Madness content tied to sales event","Push Reels format on Instagram","Create YouTube Shorts from top TikTok content","Build March content calendar by Feb 28"]}/>
</div>;}

/* ─── EMAIL ─── */
function EmailPage({d}){
  const dd=d||D;
  return<div>
  <SecWrap title="Monthly Summary"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Campaigns Sent" value={dd.em.cp} tip="Total email campaigns deployed this month."/>
    <DKpi label="Total Recipients" value={(dd.em.rc).toLocaleString()} tip="Total emails delivered across all campaigns."/>
    <DKpi label="Site Visits from Email" value={dd.em.vs} tip="GA4-tracked sessions from email campaigns via UTM links." sub="▲ 27.3% MoM · ▲ 44.1% YoY" color={C.cyan}/>
    <DKpi label="Conversions from Email" value="19" tip="Form submissions or calls from email-originated sessions." color={C.g}/>
  </div></SecWrap>
  <SecWrap title="Aggregate Trends (YTD)"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Total Recipients YTD" value="14,460" sub="vs 11,200 same period last year"/>
    <DKpi label="Site Visits YTD" value="842" sub="vs 590 same period last year"/>
    <DKpi label="Conversions YTD" value="54" sub="vs 38 same period last year"/>
  </div></SecWrap>
  <SecWrap title="Campaign Showcase">
    {[{name:"Presidents Day Truck Sale",date:"Feb 12",recipients:2240,visits:142,conv:8,subject:"Presidents Day | Best Deals on New & Used Trucks"},{name:"February Finance Specials",date:"Feb 5",recipients:1580,visits:86,conv:6,subject:"0% APR for 60 Months | Limited Time Offer"},{name:"Service Coupon — Winter Tune-Up",date:"Jan 28",recipients:1000,visits:56,conv:4,subject:"Save $40 on Your Winter Service Appointment"}].map((camp,i)=><div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:20,marginBottom:14,boxShadow:C.sh}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div><div style={{fontSize:15,fontWeight:700,color:C.t,fontFamily:F}}>{camp.name}</div><div style={{fontSize:12,color:C.tl,fontFamily:F,marginTop:2}}>Subject: {camp.subject}</div></div><div style={{fontSize:12,color:C.tl,fontFamily:F}}>{camp.date}</div></div><div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}><DKpi label="Recipients" value={camp.recipients.toLocaleString()}/><DKpi label="Site Visits" value={camp.visits} color={C.cyan}/><DKpi label="Conversions" value={camp.conv} color={C.g}/></div><div style={{background:"#f8fafc",borderRadius:8,padding:16,textAlign:"center",fontSize:13,color:C.tl,fontFamily:F,fontStyle:"italic",border:`1px solid ${C.bd}`}}>[Email creative displayed here — upload via admin panel]</div></div>)}
  </SecWrap>
  <WorkDone liveText={dd.em?.work_completed} items={[{task:"Presidents Day Campaign",desc:"Designed and deployed to 2,240 truck-segment contacts."},{task:"Finance Special Blast",desc:"Segmented to finance-qualified leads — 1,580 recipients."},{task:"Service Coupon",desc:"Service segment — 1,000 recipients. UTM links configured."},{task:"UTM Tagging",desc:"All 3 campaigns tagged with UTM parameters for GA4 tracking."}]}/>
  <WinLoss liveWins={dd.em?.wins} liveLosses={dd.em?.losses} wins={["All 3 campaigns delivered without errors","Presidents Day email drove 142 site visits in 48 hours","UTM tracking live — conversion attribution measurable"]}losses={["No CRM open rate data available yet — implementing next month"]}/>
  <NextMonth liveText={dd.em?.next_month} items={["St. Patrick's Day special — target service customers","Spring EV announcement — Lightning buyers list","Implement CRM open rate tracking","Build commercial fleet subscriber segment"]}/>
</div>;}

/* ─── CREATIVE ─── */
function CreativePage({d}){
  const dd=d||D;
  return<div>
  <SecWrap title="Monthly Summary"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
    <DKpi label="Total Assets Delivered" value={dd.cv.tl}/>
    <DKpi label="Videos Produced" value={dd.cv.vi||4} color={C.cyan}/>
    <DKpi label="Graphics / Statics" value={dd.cv.gr}/>
    <DKpi label="Banners" value={dd.cv.ba}/>
    <DKpi label="Print Pieces" value={dd.cv.pr}/>
  </div></SecWrap>
  <SecWrap title="Deliverables Timeline">
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {[["Feb 28","Presidents Day Video — Lot Walkthrough","Video","TikTok, Instagram Reels, YouTube"],["Feb 26","F-150 Lightning Feature Graphic","Graphic","Instagram, Facebook, GBP"],["Feb 24","Presidents Day Email Header","Graphic","Email Campaign"],["Feb 21","Service Department Banner","Banner","Website"],["Feb 19","Trade-In Process Explainer Video","Video","YouTube, Facebook"],["Feb 16","February Specials Social Graphics (x4)","Graphic","All Social Platforms"],["Feb 12","Presidents Day Direct Mailer","Print","Direct Mail — 8,000 households"],["Feb 10","New Arrivals Reel — F-150 Stock","Video","Instagram Reels, TikTok"],["Feb 7","GBP Post Graphics (x4)","Graphic","Google Business Profile"],["Feb 5","Finance Special Email Creative","Graphic","Email Campaign"],["Feb 3","Used Truck Feature Video","Video","YouTube, Facebook, TikTok"],["Jan 30","March Content Calendar Storyboards","Print","Internal Planning"]].map(([dt,n,ty,dest],i)=>{const tc={Video:C.cyan,Graphic:C.o,Banner:C.p,Print:"#ec4899"};return<div key={i}style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,padding:"12px 16px",display:"flex",gap:12,alignItems:"center",boxShadow:C.sh,fontFamily:F}}><div style={{width:64,textAlign:"center",background:"#f8fafc",borderRadius:6,padding:"6px 4px",flexShrink:0,border:`1px solid ${C.bd}`}}><div style={{fontSize:9,color:C.tl,fontWeight:600}}>{dt.split(" ")[0]}</div><div style={{fontSize:13,fontWeight:700,color:C.t}}>{dt.split(" ").slice(1).join(" ")}</div></div><div style={{flex:1}}><div style={{fontWeight:600,color:C.t,fontSize:13,marginBottom:3}}>{n}</div><div style={{fontSize:11,color:C.tl}}>&#x2192; {dest}</div></div><span style={{background:tc[ty]+"22",color:tc[ty],borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,flexShrink:0}}>{ty}</span></div>;})}
    </div>
  </SecWrap>
  <NextMonth liveText={dd.cv?.next_month} items={["Spring campaign creative — 6 graphics + 2 videos","Service reminder postcard — 10,000 household mailer","March Madness social series — 8 posts","F-150 Lightning landing page hero image","GBP photo shoot — interior, exterior, team"]}/>
</div>;}

/* ─── BENCHMARKS ─── */
function BenchmarksPage(){
  const bms=[
    {dept:"SEO",metrics:[["Organic CTR","5.2%","2.0-4.0%","Above"],["Page 1 Keywords","47","30-50","Within"],["MoM Traffic Growth","+17.3%","5-8%","Above"],["GBP Call Volume","89","40-80","Above"],["Review Rating","4.7","4.5+","Above"],["Review Response Rate","100%","70-90%","Above"]]},
    {dept:"Google Ads",metrics:[["CTR","9.1%","8.29%","Above"],["CPC","$2.18","$2.41","Above"],["Conversion Rate","3.2%","2.5-4%","Within"],["Cost Per Lead","$39.43","$25-$45","Within"],["Impression Share","72%","60-75%","Within"],["ROAS","4.2x","3-5x","Within"]]},
    {dept:"Meta Ads",metrics:[["CPC","$0.72","$0.79","Above"],["Cost Per Lead","$23.91","$25-$45","Above"],["Engagement Rate","4.2%","3-5%","Within"],["Lead Form Completion","68%","40-60%","Above"],["Frequency","2.4","1.5-3.0","Within"],["Reach / $1k Spend","13.9K","8-12K","Above"]]},
    {dept:"Organic Social",metrics:[["Instagram Engagement","6.8%","4.8%","Above"],["TikTok Engagement","9.4%","5-10%","Within"],["Facebook Engagement","3.2%","1-3%","Above"],["Follower Growth Rate","2.9%","1-3%","Within"],["Video Completion (25%)","82%","60-75%","Above"],["Post Frequency","34/mo","30-60","Within"]]},
    {dept:"GBP",metrics:[["Review Rating","4.7","4.0+","Above"],["Response Rate","100%","70%+","Above"],["Monthly Profile Views","3,240","2,000-5,000","Within"],["Monthly Phone Calls","89","40-100","Within"],["Direction Requests","156","80-200","Within"],["Photo Count","24","20+","Above"]]},
    {dept:"Email",metrics:[["Campaign Frequency","3/mo","2-4","Within"],["Site Visits per Campaign","104","50-150","Within"],["Conv. Rate from Email","6.1%","2-8%","Within"],["Delivery Rate","99%","95%+","Above"],["UTM Tracking","100%","100%","Above"],["List Health","Stable","Stable","Within"]]},
  ];
  const ss={Above:{bg:"#dcfce7",c:"#166534"},Within:{bg:"#fef9c3",c:"#854d0e"},Below:{bg:"#fee2e2",c:"#991b1b"}};
  const all=bms.flatMap(b=>b.metrics);
  return<div>
    <SecWrap title="Performance Scorecard"><div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
      <DKpi label="Above Benchmark" value={all.filter(m=>m[3]==="Above").length} color={C.g} sub="Exceeding industry average"/>
      <DKpi label="Within Benchmark" value={all.filter(m=>m[3]==="Within").length} color={C.o} sub="Meeting industry standard"/>
      <DKpi label="Below Benchmark" value={all.filter(m=>m[3]==="Below").length} color={C.r} sub="Opportunity to improve"/>
    </div></SecWrap>
    {bms.map(b=><SecWrap key={b.dept}title={`${b.dept} Benchmarks`}>
      <div style={{background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,overflow:"hidden",boxShadow:C.sh}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,fontSize:12}}><thead><tr style={{background:"#f8fafc"}}>{["Metric","Your Number","Industry Avg","Status"].map(h=><th key={h}style={{padding:"8px 12px",textAlign:h==="Status"?"center":"left",color:C.tl,fontWeight:500}}>{h}</th>)}</tr></thead>
        <tbody>{b.metrics.map(([met,you,ind,stat],i)=><tr key={i}style={{borderTop:`1px solid ${C.bd}`}}><td style={{padding:"8px 12px",color:C.t,fontWeight:500}}>{met}</td><td style={{padding:"8px 12px",fontWeight:700,color:C.t}}>{you}</td><td style={{padding:"8px 12px",color:C.tl}}>{ind}</td><td style={{padding:"8px 12px",textAlign:"center"}}><span style={{background:ss[stat].bg,color:ss[stat].c,borderRadius:4,padding:"2px 10px",fontSize:11,fontWeight:600}}>{stat}</span></td></tr>)}</tbody></table>
      </div>
    </SecWrap>)}
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
        <img src="/Taggart_Advertising_Logo.png"alt="Taggart Advertising"style={{height:56,width:"auto",marginBottom:24}}/>
        <h1 style={{fontSize:22,fontWeight:700,color:C.navy,margin:"0 0 6px",fontFamily:F}}>Client Portal</h1>
        <p style={{fontSize:13,color:C.tl,margin:"0 0 28px",fontFamily:F}}>Sign in to view your report.</p>
        <input type="email"placeholder="Email"value={email}onChange={e=>setEmail(e.target.value)}style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        <input type="password"placeholder="Password"value={password}onChange={e=>setPassword(e.target.value)}onKeyDown={e=>e.key==="Enter"&&handleLogin()}style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        {error&&<p style={{fontSize:12,color:C.r,margin:"0 0 10px",fontFamily:F}}>{error}</p>}
        <button onClick={handleLogin}disabled={loading}style={{width:"100%",padding:"12px",background:C.navy,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>{loading?"Signing in...":"Sign In"}</button>
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
  const[dt,sDt]=useState("lm");
  const[pg,sPg]=useState("db");
  const[cm,sCm]=useState(false);
  const[dm,sDm]=useState(false);
  const[ci,sCi]=useState(0);
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
      const mapped=mapReportData(merged);
      setLiveData(mapped);
      const[y,m]=selectedMonth.split('-');
      setLiveMonthLabel(`${MONTHS[parseInt(m)-1]} ${y}`);
      setDataLoading(false);
    };
    fetchData();
  },[cl,selectedMonth]);

  useEffect(()=>{sCi(0);},[dt]);
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
        <button onClick={handleLogout}style={{marginTop:16,padding:"10px 24px",background:C.navy,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:F}}>Sign Out</button>
      </div>
    </div>
  );

  const currentClient=cl||clients[0];
  const pr=PR.find(p=>p.v===dt)||PR[1];
  const dl=liveMonthLabel||(dt==="lm"?"February 2026":pr.l);
  const cls=pr.c.map(x=>x.replace("vs ",""));
  const tbs=[{id:"db",l:"Dashboard"},{id:"seo",l:"🔍 SEO"},{id:"gbp",l:"📍 Google Business"},{id:"ga",l:"📢 Google Ads"},{id:"ma",l:"📱 Meta Ads"},{id:"so",l:"🎬 Organic Social"},{id:"em",l:"✉️ Email"},{id:"cr",l:"🎨 Creative"},{id:"bm",l:"🎯 Benchmarks"}];
  const groups=[...new Set(clients.map(c=>c.group_name))];
  const activeData=liveData||null;
  const pages={db:<Dashboard ci={ci}cls={cls}d={activeData}/>,seo:<SeoPage d={activeData}/>,gbp:<GbpPage d={activeData}/>,ga:<GoogleAdsPage d={activeData}/>,ma:<MetaAdsPage d={activeData}/>,so:<SocialPage d={activeData}/>,em:<EmailPage d={activeData}/>,cr:<CreativePage d={activeData}/>,bm:<BenchmarksPage/>};

  return(
    <div style={{minHeight:"100vh",fontFamily:F,backgroundColor:"#f0f2f5",backgroundImage:`url("data:image/svg+xml,%3Csvg width='120' height='60' viewBox='0 0 120 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='1' y='1' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3Crect x='61' y='31' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3Crect x='-59' y='31' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3C/svg%3E")`}}>
      {/* Header */}
      <div style={{background:C.white,padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/Taggart_Advertising_Logo.png"alt="Taggart"style={{height:44,width:"auto"}}/>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:24,color:C.navy}}>TAGGART</span>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:24,color:C.cyan}}>ADVERTISING</span>
          {clients.length>1&&<>
            <div style={{width:1,height:30,background:C.bd,margin:"0 8px"}}/>
            <div style={{position:"relative"}}>
              <button onClick={()=>{sCm(!cm);sDm(false);sHm(false);}}style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 16px",color:C.t,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:F}}>{currentClient.name} <span style={{fontSize:10,color:C.tl}}>&#x25BC;</span></button>
              {cm&&<div style={{position:"absolute",top:"calc(100% + 5px)",left:0,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"6px 0",zIndex:200,width:260,maxHeight:400,overflowY:"auto",boxShadow:"0 8px 30px rgba(0,0,0,0.12)"}}>
                {groups.map(g=><div key={g}><div style={{padding:"8px 14px",fontSize:10,fontWeight:700,color:C.tl,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:F}}>{g}</div>{clients.filter(c=>c.group_name===g).map(c=><button key={c.id}onClick={()=>{sCl(c);sCm(false);}}style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",border:"none",cursor:"pointer",background:c.id===currentClient.id?C.cyanL:"transparent",color:c.id===currentClient.id?C.cyanD:C.t,fontSize:13,fontWeight:600,fontFamily:F}}>{c.name}</button>)}</div>)}
              </div>}
            </div>
          </>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:C.tl,fontFamily:F}}>{session?.user?.email}</span>
          {/* Month history picker — only shown when >1 published month exists */}
          {availableMonths.length>1&&<div style={{position:"relative"}}>
            <button onClick={()=>{sHm(!hm);sDm(false);sCm(false);}}style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 16px",color:C.t,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:F}}>&#x1F4C5; {liveMonthLabel} <span style={{fontSize:10,color:C.tl}}>&#x25BC;</span></button>
            {hm&&<div style={{position:"absolute",top:"calc(100% + 5px)",right:0,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"6px 0",zIndex:200,width:200,boxShadow:"0 8px 30px rgba(0,0,0,0.12)"}}>
              {availableMonths.map(m=>{const[y,mo]=m.split('-');const label=`${MONTHS[parseInt(mo)-1]} ${y}`;return<button key={m}onClick={()=>{setSelectedMonth(m);sHm(false);}}style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",border:"none",cursor:"pointer",background:m===selectedMonth?C.cyanL:"transparent",color:m===selectedMonth?C.cyanD:C.t,fontSize:13,fontWeight:600,fontFamily:F}}>{label}</button>;})}
            </div>}
          </div>}
          {/* Period comparison picker — only shown when no live published data */}
          {!liveData&&<div style={{position:"relative"}}>
            <button onClick={()=>{sDm(!dm);sCm(false);sHm(false);}}style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 16px",color:C.t,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:F}}>&#x1F4C5; {dl} <span style={{fontSize:10,color:C.tl}}>&#x25BC;</span></button>
            {dm&&<div style={{position:"absolute",top:"calc(100% + 5px)",right:0,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"6px 0",zIndex:200,width:220,boxShadow:"0 8px 30px rgba(0,0,0,0.12)"}}>
              {PR.map(p=><button key={p.v}onClick={()=>{sDt(p.v);sDm(false);}}style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",border:"none",cursor:"pointer",background:p.v===dt?C.cyanL:"transparent",color:p.v===dt?C.cyanD:C.t,fontSize:13,fontWeight:600,fontFamily:F}}>{p.l}<div style={{fontSize:10,color:C.tl,marginTop:1,fontFamily:F}}>{p.c.join(" \u2022 ")}</div></button>)}
            </div>}
          </div>}
          <button onClick={handleLogout}style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 14px",color:C.t,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>Sign Out</button>
          <button style={{background:C.navy,border:"none",borderRadius:8,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>&#x1F4C4; Export PDF</button>
        </div>
      </div>
      {/* Tabs */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,padding:"0 24px",display:"flex",overflowX:"auto"}}>
        {tbs.map(t=><button key={t.id}onClick={()=>sPg(t.id)}style={{padding:"11px 16px",border:"none",cursor:"pointer",background:"transparent",fontSize:13,fontWeight:600,color:pg===t.id?C.cyanD:C.tl,borderBottom:pg===t.id?`2px solid ${C.cyan}`:"2px solid transparent",whiteSpace:"nowrap",fontFamily:F}}>{t.l}</button>)}
      </div>
      {/* Comparison bar — shown when using sample/fallback data */}
      {!liveData&&<div style={{background:"rgba(230,249,252,0.92)",padding:"7px 24px",borderBottom:`1px solid ${C.bd}`,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:12,color:C.cyanD,fontWeight:700,fontFamily:F}}>&#x1F4CA; Comparing:</span>
        {pr.c.map((x,i)=><button key={i}onClick={()=>sCi(i)}style={{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:6,cursor:"pointer",background:ci===i?C.cyanD:C.white,color:ci===i?"#fff":C.t,border:`1px solid ${ci===i?C.cyanD:C.bd}`,fontFamily:F}}>{x}</button>)}
      </div>}
      {/* Live report indicator */}
      {liveData&&<div style={{background:"rgba(16,185,129,0.08)",padding:"7px 24px",borderBottom:"1px solid #bbf7d0",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:12,color:"#059669",fontWeight:700,fontFamily:F}}>✓ Live Report — {liveMonthLabel}</span>
        {dataLoading&&<span style={{fontSize:12,color:C.tl,fontFamily:F}}>Refreshing...</span>}
      </div>}
      {/* Content */}
      <div style={{padding:"22px 24px",maxWidth:1200,margin:"0 auto"}}onClick={()=>{sCm(false);sDm(false);sHm(false);}}>
        <div style={{marginBottom:18}}>
          <h1 style={{fontSize:26,fontWeight:700,color:C.t,margin:0,fontFamily:F}}>{currentClient.name}</h1>
          <p style={{fontSize:13,color:C.tl,margin:"3px 0 0",fontFamily:F}}>Performance Overview &#x2014; {dl}</p>
        </div>
        {dataLoading
          ?<div style={{textAlign:"center",padding:"60px 0",color:C.tl,fontFamily:F,fontSize:15}}>Loading report data...</div>
          :(pages[pg]||<Dashboard ci={ci}cls={cls}d={activeData}/>)
        }
      </div>
      {/* Footer */}
      <div style={{padding:"18px 24px",textAlign:"center",marginTop:30,background:C.white,borderTop:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <img src="/Taggart_Advertising_Logo.png"alt="Taggart"style={{height:28,width:"auto"}}/>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:15,color:C.navy}}>TAGGART</span>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:15,color:C.cyan}}>ADVERTISING</span>
        </div>
      </div>
    </div>
  );
}
