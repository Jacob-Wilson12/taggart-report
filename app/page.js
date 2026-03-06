'use client';
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../supabase";

const C={white:"#fff",navy:"#0c1a2e",cyan:"#00c9e8",cyanD:"#00a5bf",cyanL:"#e6f9fc",bc:"#1b3254",bl:"#243e63",bb:"#2d5080",t:"#1a1a2e",tm:"#0c1a2e",tl:"#0c1a2e",bd:"#d0d5dd",bl2:"#e4e7ec",g:"#10b981",gL:"#ecfdf5",gB:"#d1fae5",r:"#ef4444",rL:"#fef2f2",rB:"#fecaca",o:"#f59e0b",p:"#8b5cf6",sh:"0 2px 6px rgba(0,0,0,0.08)"};
const F="Inter, system-ui, sans-serif";

const CLIENT_ORDER=["Goode Motor Group","Goode Motor Ford","Goode Motor Mazda","Twin Falls Volkswagen","Juneau Auto Mall","Juneau Subaru","Juneau CDJR","Juneau Toyota","Juneau Chevrolet","Juneau Honda","Juneau Powersports","Cassia Car Rental","Explore Juneau"];

const PR=[{l:"This Month",v:"tm",c:["vs Last Month","vs Same Month Last Year"]},{l:"Last Month",v:"lm",c:["vs Prior Month","vs Same Month Last Year"]},{l:"Last 90 Days",v:"l90",c:["vs Prior 90 Days","vs Same Period Last Year"]},{l:"This Quarter",v:"tq",c:["vs Last Quarter","vs Same Quarter Last Year"]},{l:"Last Quarter",v:"lq",c:["vs Prior Quarter","vs Same Quarter Last Year"]},{l:"This Year",v:"ty",c:["vs Last Year"]},{l:"Custom",v:"cu",c:["vs Prior Period","vs Same Period Last Year"]}];

const D={seo:{ca:142,caC:[20.3,44.9],fo:67,foC:[24.1,59.5],ctr:5.2,ctrC:[0.8,2.1],tr:8420,trC:[17.3,42.7],kw:47,kwC:[8,22],im:124500,imC:[15.1,38.4],w:'"F-150 Twin Falls" → Pos 1',gV:3240,gVC:[18.2,38.2],gCa:89,gCaC:[14.1,44.2],td:[{m:"Mar",v:5200},{m:"Apr",v:5800},{m:"May",v:6100},{m:"Jun",v:5900},{m:"Jul",v:6400},{m:"Aug",v:6800},{m:"Sep",v:7100},{m:"Oct",v:7400},{m:"Nov",v:7180},{m:"Dec",v:7600},{m:"Jan",v:7900},{m:"Feb",v:8420}]},
gbp:{vi:3240,viC:[16.5,38.2],se:8920,seC:[16.6,42.1],ma:2180,maC:[12.3,28.8],wc:456,wcC:[18.4,34.5],ca:89,caC:[20.3,44.2],di:156,diC:[13.0,28.5],rv:142,ra:4.7,nr:8,ph:24},
gads:{ca:89,fo:34,cC:[22.8,52.1],sp:4850,bu:5000,cpl:39.43,cplC:[-8.7,-14.2],ctr:9.1,ctrC:[4.6,12.3],cpc:2.18,cpcC:[-3.1,-8.4],is:72,isC:[6,15],tp:"New F-150 Search",caC:[23.6,45.9],foC:[21.4,42.1]},
meta:{ca:23,fo:41,le:28,cC:[25.9,48.3],re:34500,reC:[18.4,42.1],cpc:.72,cpcC:[-5.3,-12.1],cpl:23.91,cplC:[-12.3,-18.7],fr:2.4,frC:[8.2,14.5],er:4.2,erC:[11.4,22.8],tp:"Instagram Reels",caC:[18.2,38.4],foC:[22.1,44.8],leC:[32.4,56.2]},
so:{po:34,vi:18,re:89400,reC:[24.0,56.2],en:4280,enC:[38.1,72.4],fl:186,flC:[12.4,34.8],wc:342,wcC:[15.8,41.2],tv:"2026 F-150 Walkaround",tvV:12300},
cr:{tl:234,tlC:[18.2,39.3],ws:78,wsC:[20.0,50.0],ad:89,adC:[23.6,45.9],gm:67,gmC:[9.8,21.8]},
em:{cp:3,rc:4280,vs:312,vsC:[27.3,44.1]},
cv:{tl:12,gr:6,ba:3,pr:2},
le:{tl:198,tlC:[15.1,33.8],wb:89,wbC:[20.3,43.5],tp:62,tpC:[6.9,21.6],fb:47,fbC:[17.5,34.3],wS:21,tS:14,fS:7,pS:18,wP:23.6,wPC:[2.4,4.1],tP:22.6,tPC:[1.8,3.2],fP:14.9,fPC:[2.8,5.1],pP:23.1,pPC:[0.7,2.9],td:[{m:"Mar",l:145,s:28},{m:"Apr",l:152,s:30},{m:"May",l:161,s:33},{m:"Jun",l:158,s:31},{m:"Jul",l:164,s:35},{m:"Aug",l:170,s:34},{m:"Sep",l:168,s:36},{m:"Oct",l:175,s:37},{m:"Nov",l:172,s:36},{m:"Dec",l:180,s:38},{m:"Jan",l:188,s:40},{m:"Feb",l:198,s:42}]}};

const ts={background:C.white,border:`1px solid ${C.bd}`,borderRadius:8,fontSize:12,color:C.t,fontFamily:F};
const A=({v,s="%",z=13})=><span style={{display:"inline-flex",alignItems:"center",gap:3,color:v>0?C.g:v<0?C.r:C.tl,fontSize:z,fontWeight:700,fontFamily:F}}>{v>0?"▲":v<0?"▼":"—"} {Math.abs(v)}{s}</span>;
const SH=({title,sub})=><div style={{marginBottom:10}}><h2 style={{fontSize:16,fontWeight:700,color:C.t,margin:0,fontFamily:F}}>{title}</h2>{sub&&<p style={{fontSize:11,color:C.tl,margin:"2px 0 0",fontFamily:F}}>{sub}</p>}</div>;
const Sc=({children,s})=><div style={{background:C.white,borderRadius:10,padding:"16px 18px",border:`1px solid ${C.bd}`,boxShadow:C.sh,marginBottom:16,...s}}>{children}</div>;

const LC=({l,v,ch,cl})=><div style={{background:C.white,borderRadius:10,padding:"18px 20px",border:`1px solid ${C.bd}`,flex:1,minWidth:140,boxShadow:C.sh,textAlign:"center"}}><div style={{fontSize:11,color:C.tl,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{l}</div><div style={{fontSize:32,fontWeight:700,color:C.t,fontFamily:F,lineHeight:1.1,marginBottom:6}}>{v.toLocaleString()}</div><div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}>{ch?.[0]!==undefined&&cl?.[0]&&<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:C.tl,fontWeight:600,fontFamily:F}}>{cl[0]}</span><A v={ch[0]} z={12}/></div>}{ch?.[1]!==undefined&&cl?.[1]&&<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,color:C.tl,fontWeight:600,fontFamily:F}}>{cl[1]}</span><A v={ch[1]} z={12}/></div>}</div></div>;

const CC=({l,v,ch,ci,cl})=>{const c=ch?.[ci];return<div style={{background:C.white,borderRadius:10,padding:"18px 20px",border:`1px solid ${C.bd}`,flex:1,minWidth:140,boxShadow:C.sh,textAlign:"center"}}><div style={{fontSize:11,color:C.tl,fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:F}}>{l}</div><div style={{fontSize:32,fontWeight:700,color:C.t,fontFamily:F,lineHeight:1.1,marginBottom:6}}>{v.toLocaleString()}</div>{c!==undefined&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><span style={{fontSize:9,color:C.tl,fontWeight:600,fontFamily:F}}>{cl}</span><A v={c} z={12}/></div>}</div>};

const BM=({l,v,ch,pre="",suf="",ci})=>{const c=ch?ch[ci]:undefined;return<div style={{flex:1,minWidth:100,textAlign:"center",padding:"12px 6px"}}><div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,fontFamily:F}}>{l}</div><div style={{fontSize:24,fontWeight:700,color:"#fff",fontFamily:F,lineHeight:1.1,marginBottom:4}}>{pre}{typeof v==="number"?v.toLocaleString():v}{suf}</div>{c!==undefined&&<span style={{fontSize:12,fontWeight:700,fontFamily:F,color:c>0?"#6ee7b7":c<0?"#fca5a5":"rgba(255,255,255,0.4)"}}>{c>0?"▲":c<0?"▼":"—"} {Math.abs(c)}%</span>}</div>};

const BC=({ic,la,hl,ch})=><div style={{background:`linear-gradient(135deg,${C.bc},${C.bl})`,borderRadius:12,padding:"18px 22px",border:`1px solid ${C.bb}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:18}}>{ic}</span><span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:F}}>{la}</span></div>{ch}{hl&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.1)",fontSize:12}}><span style={{color:"rgba(255,255,255,0.4)",fontSize:10,textTransform:"uppercase",fontWeight:700,fontFamily:F}}>Highlight: </span><span style={{color:"#fff",fontWeight:600,fontFamily:F}}>{hl}</span></div>}</div>;

function Dashboard({ci,cls}){
  return<>
    <SH title="Lead Summary" sub="Total leads across all channels"/>
    <div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}><LC l="Total Leads" v={D.le.tl} ch={D.le.tlC} cl={cls}/><LC l="Website" v={D.le.wb} ch={D.le.wbC} cl={cls}/><LC l="Third Party" v={D.le.tp} ch={D.le.tpC} cl={cls}/><LC l="Facebook" v={D.le.fb} ch={D.le.fbC} cl={cls}/></div>
    <SH title="Phone Calls (CallRail)"/><div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}><CC l="Total Calls" v={D.cr.tl} ch={D.cr.tlC} ci={ci} cl={cls[ci]}/><CC l="From Website" v={D.cr.ws} ch={D.cr.wsC} ci={ci} cl={cls[ci]}/><CC l="From Ads" v={D.cr.ad} ch={D.cr.adC} ci={ci} cl={cls[ci]}/><CC l="From Google Business" v={D.cr.gm} ch={D.cr.gmC} ci={ci} cl={cls[ci]}/></div>
    <div style={{display:"flex",gap:14,marginBottom:22,flexWrap:"wrap"}}>
      <div style={{flex:3,minWidth:340,background:C.white,borderRadius:10,padding:"18px 20px",border:`1px solid ${C.bd}`,boxShadow:C.sh}}><SH title="Annual Lead Trend"/><ResponsiveContainer width="100%" height={200}><LineChart data={D.le.td}><CartesianGrid strokeDasharray="3 3" stroke={C.bl2}/><XAxis dataKey="m" tick={{fontSize:11,fill:C.tl}}/><YAxis tick={{fontSize:11,fill:C.tl}}/><Tooltip contentStyle={ts}/><Line type="monotone" dataKey="l" stroke={C.cyan} strokeWidth={2.5} dot={{r:3,fill:C.cyan,stroke:C.white,strokeWidth:2}} name="Leads"/><Line type="monotone" dataKey="s" stroke={C.g} strokeWidth={2.5} dot={{r:3,fill:C.g,stroke:C.white,strokeWidth:2}} name="Sold"/></LineChart></ResponsiveContainer></div>
      <div style={{flex:2,minWidth:280,display:"flex",flexDirection:"column",gap:10}}><SH title="Sold % by Source"/><div style={{display:"flex",gap:10,flex:1,flexWrap:"wrap"}}>{[{l:"Website",p:D.le.wP,ch:D.le.wPC,s:D.le.wS,ld:D.le.wb,c:C.cyan},{l:"Third Party",p:D.le.tP,ch:D.le.tPC,s:D.le.tS,ld:D.le.tp,c:C.p},{l:"Facebook",p:D.le.fP,ch:D.le.fPC,s:D.le.fS,ld:D.le.fb,c:C.g},{l:"Phone",p:D.le.pP,ch:D.le.pPC,s:D.le.pS,ld:D.cr.tl,c:C.o}].map((s,i)=><div key={i} style={{flex:1,minWidth:120,background:C.white,borderRadius:10,padding:"14px 12px",border:`1px solid ${C.bd}`,boxShadow:C.sh,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center"}}><div style={{fontSize:10,color:C.tl,fontWeight:700,textTransform:"uppercase",marginBottom:3,fontFamily:F}}>{s.l}</div><div style={{fontSize:28,fontWeight:700,color:s.c,fontFamily:F}}>{s.p}%</div>{s.ch?.[ci]!==undefined&&<div style={{marginTop:3}}><A v={s.ch[ci]} s=" pts" z={12}/></div>}<div style={{fontSize:9,color:C.tl,marginTop:2,fontFamily:F}}>{s.s} sold / {s.ld} leads</div></div>)}</div></div>
    </div>
    <SH title="Department Performance"/>
    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
      <BC ic="🔍" la="SEO" hl={D.seo.w} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions" v={D.seo.ca+D.seo.fo} ch={[21.8,48.7]} ci={ci}/><BM l="Traffic" v={D.seo.tr} ch={D.seo.trC} ci={ci}/><BM l="Page 1 KWs" v={D.seo.kw} ch={D.seo.kwC} ci={ci}/><BM l="Impressions" v={D.seo.im} ch={D.seo.imC} ci={ci}/><BM l="GBP Views" v={D.seo.gV} ch={D.seo.gVC} ci={ci}/><BM l="GBP Calls" v={D.seo.gCa} ch={D.seo.gCaC} ci={ci}/></div>}/>
      <BC ic="📍" la="Google Business Profile" ch={<><div style={{display:"flex",flexWrap:"wrap"}}><BM l="Views" v={D.gbp.vi} ch={D.gbp.viC} ci={ci}/><BM l="Searches" v={D.gbp.se} ch={D.gbp.seC} ci={ci}/><BM l="Map Views" v={D.gbp.ma} ch={D.gbp.maC} ci={ci}/><BM l="Web Clicks" v={D.gbp.wc} ch={D.gbp.wcC} ci={ci}/><BM l="Calls" v={D.gbp.ca} ch={D.gbp.caC} ci={ci}/><BM l="Directions" v={D.gbp.di} ch={D.gbp.diC} ci={ci}/></div><div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap"}}><span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:F}}>⭐ <strong style={{color:"#fbbf24"}}>{D.gbp.ra}</strong> ({D.gbp.rv} reviews)</span><span style={{fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:F}}>+{D.gbp.nr} new</span></div></>}/>
      <BC ic="📢" la="Google Ads" hl={"Top: "+D.gads.tp} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions" v={D.gads.ca+D.gads.fo} ch={D.gads.cC} ci={ci}/><BM l="Cost/Lead" v={D.gads.cpl} ch={D.gads.cplC} pre="$" ci={ci}/><BM l="Spend" v={D.gads.sp} pre="$" ci={ci}/><BM l="CTR" v={D.gads.ctr} ch={D.gads.ctrC} suf="%" ci={ci}/><BM l="CPC" v={D.gads.cpc} ch={D.gads.cpcC} pre="$" ci={ci}/><BM l="Imp Share" v={D.gads.is} ch={D.gads.isC} suf="%" ci={ci}/></div>}/>
      <BC ic="📱" la="Meta Ads" hl={"Top: "+D.meta.tp} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Conversions" v={D.meta.ca+D.meta.fo+D.meta.le} ch={D.meta.cC} ci={ci}/><BM l="Cost/Lead" v={D.meta.cpl} ch={D.meta.cplC} pre="$" ci={ci}/><BM l="Reach" v={D.meta.re} ch={D.meta.reC} ci={ci}/><BM l="CPC" v={D.meta.cpc} ch={D.meta.cpcC} pre="$" ci={ci}/><BM l="Frequency" v={D.meta.fr} ch={D.meta.frC} ci={ci}/><BM l="Eng Rate" v={D.meta.er} ch={D.meta.erC} suf="%" ci={ci}/></div>}/>
      <BC ic="🎬" la="Organic Social" hl={"🎬 "+D.so.tv+" — "+D.so.tvV.toLocaleString()+" views"} ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Reach" v={D.so.re} ch={D.so.reC} ci={ci}/><BM l="Engagement" v={D.so.en} ch={D.so.enC} ci={ci}/><BM l="Followers" v={D.so.fl} ch={D.so.flC} pre="+" ci={ci}/><BM l="Posts" v={D.so.po} ci={ci}/><BM l="Videos" v={D.so.vi} ci={ci}/><BM l="Web Clicks" v={D.so.wc} ch={D.so.wcC} ci={ci}/></div>}/>
      <div style={{display:"flex",gap:12}}><BC ic="✉️" la="Email" ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Campaigns" v={D.em.cp} ci={ci}/><BM l="Recipients" v={D.em.rc} ci={ci}/><BM l="Site Visits" v={D.em.vs} ch={D.em.vsC} ci={ci}/></div>}/><BC ic="🎨" la="Creative" ch={<div style={{display:"flex",flexWrap:"wrap"}}><BM l="Delivered" v={D.cv.tl} ci={ci}/><BM l="Graphics" v={D.cv.gr} ci={ci}/><BM l="Banners" v={D.cv.ba} ci={ci}/><BM l="Print" v={D.cv.pr} ci={ci}/></div>}/></div>
    </div>
    <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
      <Sc s={{flex:1,minWidth:260}}><SH title="Key Highlights"/><div style={{display:"flex",flexDirection:"column",gap:6}}>{[{i:"🔍",t:'"F-150 Twin Falls" Pos 1'},{i:"📢",t:"Ads CPL dropped 8.7%"},{i:"📞",t:"CallRail up 18.2%"},{i:"🎬",t:"Social engagement up 38.1%"},{i:"⚠️",t:"Rob Green Ford growing"}].map((h,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",borderRadius:6,background:"rgba(232,236,242,0.7)"}}><span style={{fontSize:14}}>{h.i}</span><span style={{fontSize:12,color:C.tm,lineHeight:1.4,fontFamily:F,fontWeight:600}}>{h.t}</span></div>)}</div></Sc>
      <Sc s={{flex:1,minWidth:260}}><SH title="Coming Next Month"/><div style={{display:"flex",flexDirection:"column",gap:5}}>{[{d:"SEO",t:"Maverick page + competitor analysis"},{d:"GBP",t:"Posting 3x/week"},{d:"Ads",t:"VLA used inventory"},{d:"Meta",t:"Reels spring event"},{d:"Social",t:"Service video series"},{d:"Email",t:"Spring Service Special"}].map((x,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",borderRadius:6,background:"rgba(232,236,242,0.7)"}}><span style={{fontSize:10,fontWeight:700,color:C.cyanD,background:C.cyanL,padding:"2px 7px",borderRadius:3,flexShrink:0,marginTop:1,fontFamily:F}}>{x.d}</span><span style={{fontSize:12,color:C.tm,lineHeight:1.4,fontFamily:F,fontWeight:600}}>{x.t}</span></div>)}</div></Sc>
    </div>
  </>;
}

function DetailPage({icon,title,msg}){
  return<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:44,marginBottom:14}}>{icon}</div><h2 style={{fontSize:22,fontWeight:700,color:C.t,margin:"0 0 6px",fontFamily:F}}>{title}</h2><p style={{fontSize:13,color:C.tl,fontFamily:F}}>{msg||"Full detail page — data loads from Supabase when connected."}</p></div>;
}

function LoginPage({onLogin}){
  const[password,setPassword]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const handleLogin=async()=>{
    if(!email||!password){setError("Please enter email and password.");return;}
    setLoading(true);setError("");
    const{error:err}=await supabase.auth.signInWithPassword({email,password});
    if(err){setError(err.message);setLoading(false);}
    else{setLoading(false);}
  };
  return(
    <div style={{minHeight:"100vh",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F}}>
      <div style={{background:C.white,borderRadius:16,padding:"48px 40px",width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.3)",textAlign:"center"}}>
        <img src="/Taggart_Advertising_Logo.png" alt="Taggart Advertising" style={{height:56,width:"auto",marginBottom:24}}/>
        <h1 style={{fontSize:22,fontWeight:700,color:C.navy,margin:"0 0 6px",fontFamily:F}}>Client Portal</h1>
        <p style={{fontSize:13,color:C.tl,margin:"0 0 28px",fontFamily:F}}>Sign in to view your reports.</p>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${C.bd}`,fontSize:14,fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
        {error&&<p style={{fontSize:12,color:C.r,margin:"0 0 10px",fontFamily:F}}>{error}</p>}
        <button onClick={handleLogin} disabled={loading} style={{width:"100%",padding:"12px",background:C.navy,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>{loading?"Signing in...":"Sign In"}</button>
      </div>
    </div>
  );
}



export default function App(){
  const[session,setSession]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[emailSent,setEmailSent]=useState("");
  const[clients,setClients]=useState([]);
  const[clientsLoading,setClientsLoading]=useState(false);
  const[cl,sCl]=useState(null);
  const[dt,sDt]=useState("lm");
  const[pg,sPg]=useState("db");
  const[cm,sCm]=useState(false);
  const[dm,sDm]=useState(false);
  const[ci,sCi]=useState(0);

useEffect(()=>{
    // Handle magic link token from URL hash
    if(window.location.hash&&window.location.hash.includes("access_token")){
      supabase.auth.getSession().then(({data:{session}})=>{
        if(session){setSession(session);setAuthLoading(false);window.history.replaceState(null,"",window.location.pathname);}
      });
    } else {
      supabase.auth.getSession().then(({data:{session}})=>{setSession(session);setAuthLoading(false);});
    }
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setSession(session);setAuthLoading(false);});
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!session)return;
    const fetchClients=async()=>{
      setClientsLoading(true);

      // Check if user is admin or editor
      const{data:profile}=await supabase
        .from("user_profiles")
        .select("role")
        .eq("id",session.user.id)
        .single();

      const isAdmin=profile?.role?.toLowerCase()==="admin"||profile?.role?.toLowerCase()==="editor";

      let data,error;
      if(isAdmin){
        // Admins load all active clients
        ({data,error}=await supabase
          .from("clients")
          .select("id, name, group_name")
          .eq("active",true));
      } else {
        // Regular users load only assigned clients
        ({data,error}=await supabase
          .from("clients")
          .select("id, name, group_name")
          .eq("active",true)
          .in("id",(await supabase.from("user_client_access").select("client_id").eq("user_id",session.user.id)).data?.map(r=>r.client_id)||[]));
      }

      if(!error&&data){
        const sorted=data.sort((a,b)=>{
          const ai=CLIENT_ORDER.indexOf(a.name);
          const bi=CLIENT_ORDER.indexOf(b.name);
          if(ai!==-1&&bi!==-1)return ai-bi;
          if(ai!==-1)return -1;
          if(bi!==-1)return 1;
          return a.name.localeCompare(b.name);
        });
        setClients(sorted);
        if(sorted.length>0)sCl(sorted[0]);
      }
      setClientsLoading(false);
    };
    fetchClients();
  },[session]);

  useEffect(()=>{sCi(0);},[dt]);

  const handleLogout=async()=>{await supabase.auth.signOut();setSession(null);setClients([]);sCl(null);};

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
  const pr=PR.find(p=>p.v===dt)||PR[1];
  const dl=dt==="lm"?"February 2026":pr.l;
  const cls=pr.c.map(x=>x.replace("vs ",""));
  const tbs=[{id:"db",l:"Dashboard",i:""},{id:"seo",l:"SEO",i:"🔍"},{id:"gbp",l:"Google Business",i:"📍"},{id:"ga",l:"Google Ads",i:"📢"},{id:"ma",l:"Meta Ads",i:"📱"},{id:"so",l:"Organic Social",i:"🎬"},{id:"em",l:"Email",i:"✉️"},{id:"cr",l:"Creative",i:"🎨"},{id:"bm",l:"Benchmarks",i:"🎯"}];
  const groups=[...new Set(clients.map(c=>c.group_name))];

  return(
    <div style={{minHeight:"100vh",fontFamily:F,fontWeight:600,backgroundColor:"#f0f2f5",backgroundImage:`url("data:image/svg+xml,%3Csvg width='120' height='60' viewBox='0 0 120 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='1' y='1' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3Crect x='61' y='31' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3Crect x='-59' y='31' width='118' height='28' rx='1' fill='none' stroke='rgba(180,180,180,0.15)' stroke-width='1'/%3E%3C/svg%3E")`}}>

      {/* Header */}
      <div style={{background:C.white,padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart Advertising" style={{height:44,width:"auto"}}/>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:24,color:C.navy}}>TAGGART</span>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:24,color:C.cyan}}>ADVERTISING</span>
          {clients.length>1&&<>
            <div style={{width:1,height:30,background:C.bd,margin:"0 8px"}}/>
            <div style={{position:"relative"}}>
              <button onClick={()=>{sCm(!cm);sDm(false);}} style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 16px",color:C.t,fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:F}}>{currentClient.name} <span style={{fontSize:10,color:C.tl}}>▼</span></button>
              {cm&&<div style={{position:"absolute",top:"calc(100% + 5px)",left:0,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"6px 0",zIndex:200,width:260,maxHeight:400,overflowY:"auto",boxShadow:"0 8px 30px rgba(0,0,0,0.12)"}}>{groups.map(g=><div key={g}><div style={{padding:"8px 14px",fontSize:10,fontWeight:700,color:C.tl,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:F}}>{g}</div>{clients.filter(c=>c.group_name===g).map(c=><button key={c.id} onClick={()=>{sCl(c);sCm(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",border:"none",cursor:"pointer",background:c.id===currentClient.id?C.cyanL:"transparent",color:c.id===currentClient.id?C.cyanD:C.t,fontSize:13,fontWeight:600,fontFamily:F}}>{c.name}</button>)}</div>)}</div>}
            </div>
          </>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:C.tl,fontFamily:F}}>{session?.user?.email}</span>
          <div style={{position:"relative"}}>
            <button onClick={()=>{sDm(!dm);sCm(false);}} style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 16px",color:C.t,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:F}}>📅 {dl} <span style={{fontSize:10,color:C.tl}}>▼</span></button>
            {dm&&<div style={{position:"absolute",top:"calc(100% + 5px)",right:0,background:C.white,border:`1px solid ${C.bd}`,borderRadius:10,padding:"6px 0",zIndex:200,width:220,boxShadow:"0 8px 30px rgba(0,0,0,0.12)"}}>{PR.map(p=><button key={p.v} onClick={()=>{sDt(p.v);sDm(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 14px",border:"none",cursor:"pointer",background:p.v===dt?C.cyanL:"transparent",color:p.v===dt?C.cyanD:C.t,fontSize:13,fontWeight:600,fontFamily:F}}>{p.l}<div style={{fontSize:10,color:C.tl,marginTop:1,fontFamily:F}}>{p.c.join(" • ")}</div></button>)}</div>}
          </div>
          <button onClick={handleLogout} style={{background:"#f0f2f5",border:`1px solid ${C.bd}`,borderRadius:8,padding:"8px 14px",color:C.t,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F}}>Sign Out</button>
          <button style={{background:C.navy,border:"none",borderRadius:8,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>📄 Export PDF</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,padding:"0 24px",display:"flex",overflowX:"auto"}}>{tbs.map(t=><button key={t.id} onClick={()=>sPg(t.id)} style={{padding:"11px 16px",border:"none",cursor:"pointer",background:"transparent",fontSize:13,fontWeight:600,color:pg===t.id?C.cyanD:C.tl,borderBottom:pg===t.id?`2px solid ${C.cyan}`:"2px solid transparent",whiteSpace:"nowrap",fontFamily:F}}>{t.i?t.i+" ":""}{t.l}</button>)}</div>

      {/* Comparison bar */}
      <div style={{background:"rgba(230,249,252,0.92)",padding:"7px 24px",borderBottom:`1px solid ${C.bd}`,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:12,color:C.cyanD,fontWeight:700,fontFamily:F}}>📊 Comparing:</span>{pr.c.map((x,i)=><button key={i} onClick={()=>sCi(i)} style={{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:6,cursor:"pointer",background:ci===i?C.cyanD:C.white,color:ci===i?"#fff":C.t,border:`1px solid ${ci===i?C.cyanD:C.bd}`,fontFamily:F}}>{x}</button>)}</div>

      {/* Content */}
      <div style={{padding:"22px 24px",maxWidth:1200,margin:"0 auto"}} onClick={()=>{sCm(false);sDm(false);}}>
        <div style={{marginBottom:18}}>
          <h1 style={{fontSize:26,fontWeight:700,color:C.t,margin:0,fontFamily:F}}>{currentClient.name}</h1>
          <p style={{fontSize:13,color:C.tl,margin:"3px 0 0",fontFamily:F}}>Performance Overview — {dl}</p>
        </div>
        {pg==="db"&&<Dashboard ci={ci} cls={cls}/>}
        {pg==="seo"&&<DetailPage icon="🔍" title="SEO Performance" msg="SEO detail page with queries, keywords, competitors, and traffic data."/>}
        {pg==="gbp"&&<DetailPage icon="📍" title="Google Business Profile" msg="Reviews, posts, profile views, and engagement data."/>}
        {pg==="ga"&&<DetailPage icon="📢" title="Google Ads" msg="Campaigns, spend, conversions, and Performance Max breakdown."/>}
        {pg==="ma"&&<DetailPage icon="📱" title="Meta Ads" msg="Campaigns, placements, reach, and conversion tracking."/>}
        {pg==="so"&&<DetailPage icon="🎬" title="Organic Social" msg="Cross-platform content performance and follower growth."/>}
        {pg==="em"&&<DetailPage icon="✉️" title="Email Marketing" msg="Campaign showcase with open rates and site visits."/>}
        {pg==="cr"&&<DetailPage icon="🎨" title="Creative Deliverables" msg="Asset timeline with deliverables and destinations."/>}
        {pg==="bm"&&<DetailPage icon="🎯" title="Industry Benchmarks" msg="36 metrics compared against automotive industry averages."/>}
      </div>

      {/* Footer */}
      <div style={{padding:"18px 24px",textAlign:"center",marginTop:30,background:C.white,borderTop:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <img src="/Taggart_Advertising_Logo.png" alt="Taggart Advertising" style={{height:28,width:"auto"}}/>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:15,color:C.navy}}>TAGGART</span>
          <span style={{fontFamily:"'Permanent Marker',cursive",fontSize:15,color:C.cyan}}>ADVERTISING</span>
        </div>
      </div>
    </div>
  );
}
