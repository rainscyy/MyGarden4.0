'use client';
import {useEffect,useRef,useState} from 'react';
import type {Student,Build,Pair,Interaction} from '@/lib/cognitive/types';
import {gardenProgress} from '@/lib/cognitive/progression';
import {PersonSprite,AgentSprite,CharacterAvatar} from './PixelCharacters';
const color:Record<string,string>={Reflection:'#d8838d',Memory:'#a798d8',Creativity:'#efa777',Attention:'#86aaa0',Learning:'#d3ba55',Environments:'#79a66d','Social connection':'#d8838d'};
export function Flower({x=0,y=0,tint='#d8838d',kind=0,scale=1}:{x?:number;y?:number;tint?:string;kind?:number;scale?:number}){
 const variants=[['...pp...','..pllp..','.plcclp.','..pllp..','...pp...'],['.p....p.','.pl..lp.','.pllllp.','..pllp..','...pp...'],['...pp...','..pllp..','...pp...','..pllp..','.pllllp.','..pllp..'],['...pp...','..pllp..','.plcclp.','.plcclp.','..pllp..','...pp...'],['..p..p..','.plpplp.','..pllp..','...pp...']];
 const petals=variants[kind%variants.length],palette:Record<string,string>={p:tint,l:'#ffe4bd',c:'#bd9250'};
 return <g transform={`translate(${x} ${y}) scale(${scale})`} shapeRendering="crispEdges"><ellipse cx="0" cy="1" rx="10" ry="3" fill="#4d6748" opacity=".12"/><path d="M-2 0V-25H2V0Z M-2-9H-9V-13H-13V-18H-7V-14H-2 M2-15H7V-19H12V-24H7V-20H2" fill="#548876"/><path d="M-9-13V-18H-13V-21H-7V-18H-4V-13Z M3-16H7V-20H12V-24H7V-21H3" fill="#82ab78"/>{petals.flatMap((row,j)=>Array.from(row).map((c,i)=>c==='.'?null:<rect key={`${i}-${j}`} x={(i-4)*3} y={-40+j*3} width="3" height="3" fill={palette[c]}/>))}</g>;
}
function Tree({x,y,size=1,fruit=false}:{x:number;y:number;size?:number;fruit?:boolean}){
 return <g transform={`translate(${x} ${y}) scale(${size})`} shapeRendering="crispEdges"><ellipse cx="0" cy="3" rx="14" ry="5" fill="#6b965c" opacity=".4"/><path d="M-3-1V-22H4V-2H8V2H-6V-1Z" fill="#94755d"/><path d="M-14-13H-18V-26H-15V-34H-9V-39H3V-37H11V-33H16V-26H19V-15H15V-10H6V-8H-8V-10H-14Z" fill="#4d7959"/><path d="M-14-17V-29H-10V-35H-3V-38H3V-34H10V-29H15V-17H10V-13H-7V-17Z" fill="#81a66b"/><path d="M-9-27V-32H-3V-35H3V-32H8V-26H3V-23H-4V-26Z M-12-21H-8V-18H-12Z M7-19H11V-16H7Z" fill="#adc17a"/><path d="M0-9v9h2v-11Z M-3-3h2v3h-2Z" fill="#715d45"/><path d="M-14-27h4v3h-4Z M-6-19h5v3h-5Z M8-28h4v3H8Z M2-13h5v2H2Z" fill="#96b875"/>{fruit&&<path d="M-12-22H-7V-17H-12Z M6-24H11V-19H6Z M0-13H5V-8H0Z" fill="#ecb47c"/>}</g>;
}
function Fence({x,y,length=45}:{x:number;y:number;length?:number}){return <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges"><path d={`M0-5H${length}V-2H0Z M0-10H${length}V-8H0Z`} fill="#ba976b"/>{Array.from({length:Math.ceil(length/9)+1},(_,i)=><path key={i} d={`M${i*9}-13h3v2h1v15h-5v-15h1Z`} fill="#d8b78a" stroke="#a38260" strokeWidth=".6"/>)}</g>}
const parcels=[{x:10,y:20,w:144,h:126},{x:171,y:8,w:140,h:132},{x:330,y:26,w:146,h:126},{x:15,y:176,w:144,h:129},{x:176,y:164,w:142,h:132},{x:336,y:182,w:140,h:123}];
function shore(w:number,h:number,i:number){return i%2===0?`M12 0H${w-25}V6H${w-10}V18H${w}V${h-21}H${w-6}V${h-7}H${w-19}V${h}H12V${h-8}H0V24H6V10H12Z`:`M20 0H${w-12}V10H${w}V${h-18}H${w-9}V${h-6}H${w-23}V${h}H10V${h-12}H0V19H9V7H20Z`;}
function Bridge({points}:{points:[number,number][]}){const d=points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ');return <g shapeRendering="crispEdges"><path d={d} fill="none" stroke="#567e69" strokeWidth="14"/><path d={d} fill="none" stroke="#9a815e" strokeWidth="12"/><path d={d} fill="none" stroke="#debd88" strokeWidth="9"/><path d={d} fill="none" stroke="#b49166" strokeWidth="9" strokeDasharray="1 4"/></g>;}
export default function Forest({students,builds,pairs,interactions,agents=[],viewer,focus,week,onSelect,onBuildSelect}:{students:Student[];builds:Build[];pairs:Pair[];interactions:Interaction[];agents?:{studentId:string;name:string}[];viewer:string;focus:string|null;week:number;onSelect:(id:string)=>void;onBuildSelect?:(b:Build)=>void}){
 const [page,setPage]=useState(0);const pageRef=useRef(0);pageRef.current=page;const pan=useRef<HTMLDivElement>(null);const drag=useRef<{x:number;scroll:number;active:boolean}|null>(null);const dragged=useRef(false);
 useEffect(()=>{const el=pan.current;if(!el)return;const wheel=(e:WheelEvent)=>{if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;e.preventDefault();el.scrollLeft+=e.deltaY;};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[]);

 useEffect(()=>{const el=pan.current,slide=el?.querySelector<HTMLElement>('.world-slide');if(!el||!slide)return;let width=slide.getBoundingClientRect().width;const observer=new ResizeObserver(()=>{const next=slide.getBoundingClientRect().width;if(Math.abs(next-width)<1)return;width=next;el.scrollLeft=pageRef.current*next;});observer.observe(slide);return()=>observer.disconnect();},[]);
 // Stable placement does not jump when a search or theme filter hides flowers.
 const curated=['raine','jad','egemen','matti','leticia','fatak'];
 const rank=(s:Student)=>curated.includes(s.id)?curated.indexOf(s.id):curated.length;
 const staff=students.filter(s=>s.role==='teacher'||s.role==='ta');
 const indexedOwners=new Set(builds.filter(b=>b.week>=1&&b.week<=13).map(b=>b.studentId));
 const awaitingIndex=(s:Student)=>!indexedOwners.has(s.id);
 const ordered=students.filter(s=>!s.role||s.role==='student').sort((a,b)=>Number(awaitingIndex(a))-Number(awaitingIndex(b))||rank(a)-rank(b)||a.name.localeCompare(b.name));
 const neighborhoods=Math.max(1,Math.ceil(ordered.length/6));
 const base=Math.floor(ordered.length/neighborhoods),extra=ordered.length%neighborhoods;
 const groups=Array.from({length:neighborhoods},(_,i)=>{const start=i*base+Math.min(i,extra);return ordered.slice(start,start+base+(i<extra?1:0));});
 const hubIndex=staff.length?0:-1;
 if(staff.length)groups.splice(hubIndex,0,staff);
 const pages=groups.length;
 useEffect(()=>{const i=!focus&&staff.length?hubIndex:groups.findIndex(group=>group.some(s=>s.id===(focus||viewer)));if(i>=0){setPage(i);pan.current?.scrollTo({left:i*(pan.current.querySelector<HTMLElement>('.world-slide')?.getBoundingClientRect().width||pan.current.clientWidth),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}},[focus,viewer,students.length]);
 const visible=groups[Math.min(page,pages-1)]||[];
 const keyboard=(e:React.KeyboardEvent,fn:()=>void)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}};
 return <div className="pixel-world">
 <div className="world-toolbar"><span className="viewing-garden">{page===hubIndex?'Classroom island':visible.length>0&&visible.every(awaitingIndex)?'Awaiting indexing':`Neighborhood ${page>hubIndex&&hubIndex>=0?page:page+1} / ${neighborhoods}`}</span>{staff.length>0&&<button className="classroom-jump" onClick={()=>onSelect(staff[0].id)}>Blackboard</button>}<span className="pan-hint">↔ Drag to explore</span></div>
 <div className="world-pan" ref={pan} role="region" tabIndex={0} aria-label="World map. Drag or swipe horizontally to explore gardens."
 onScroll={e=>setPage(Math.max(0,Math.min(pages-1,Math.round(e.currentTarget.scrollLeft/(e.currentTarget.querySelector<HTMLElement>('.world-slide')?.getBoundingClientRect().width||e.currentTarget.clientWidth)))))}
 onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.currentTarget.scrollBy({left:(e.key==='ArrowRight'?1:-1)*e.currentTarget.clientWidth,behavior:'smooth'});}}}
 onPointerDown={e=>{if(e.pointerType!=='mouse'||e.button!==0)return;dragged.current=false;drag.current={x:e.clientX,scroll:e.currentTarget.scrollLeft,active:false};}}
 onPointerMove={e=>{const d=drag.current;if(!d)return;const delta=e.clientX-d.x;if(Math.abs(delta)>6&&!d.active){d.active=true;dragged.current=true;e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.classList.add('is-dragging');}if(d.active)e.currentTarget.scrollLeft=d.scroll-delta;}}
 onPointerUp={e=>{drag.current=null;e.currentTarget.classList.remove('is-dragging');if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 onPointerCancel={e=>{drag.current=null;e.currentTarget.classList.remove('is-dragging');}}
 onClickCapture={e=>{if(dragged.current){e.preventDefault();e.stopPropagation();dragged.current=false;}}}
 >{groups.map((visible,groupIndex)=><div className="world-slide" key={groupIndex}>
 <svg viewBox="0 0 490 322" className="forest-scene pixel-landscape" role="group" aria-label="Individual gardens separated by rivers. Bridges connect each garden entrance.">
 <defs><filter id={`garden-selection-glow-${groupIndex}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter><pattern id={`water-ripples-${groupIndex}`} width="29" height="19" patternUnits="userSpaceOnUse"><rect width="29" height="19" fill="#93c9bb"/><path d="M4 5h5v1H4Z M19 13h7v1h-7Z" fill="#c2e4ce"/><path d="M12 2h2v1h-2Z" fill="#7fbbac"/></pattern><pattern id={`grass-specks-${groupIndex}`} width="37" height="31" patternUnits="userSpaceOnUse"><rect width="37" height="31" fill="#c6d88b"/><path d="M8 7h3v2H8Z M27 22h2v2h-2Z M25 21h2v1h-2Z" fill="#b4cb7c"/><path d="M17 26h2v1h-2Z M2 18h1v2H2Z M4 17h1v2H4Z M33 5h2v1h-2Z" fill="#e1e6a5"/><path d="M11 14v2h1v-1h1v-2h1v3h-4v-2Z M30 28h2v1h-2Z" fill="#9cba70"/></pattern></defs>
 <rect width="490" height="322" fill={`url(#water-ripples-${groupIndex})`}/>
 {groupIndex===hubIndex?<ClassroomIsland staff={staff} selected={focus||viewer} onSelect={onSelect} hasPrevious={groupIndex>0} hasNext={groupIndex<groups.length-1} grassId={`grass-specks-${groupIndex}`}/>:<>
 {/* Bridge endpoints are derived from actual island gates. No decorative dead ends. */}
 {visible.map((s,i)=>{const p=parcels[i];return <g key={'land-'+s.id} transform={`translate(${p.x} ${p.y})`}><path d={shore(p.w,p.h,i)} fill="#688a61" transform="translate(0 5)"/><path d={shore(p.w,p.h,i)} fill={`url(#grass-specks-${groupIndex})`} stroke="#e1e4a4" strokeWidth="2"/><path d={shore(p.w,p.h,i)} fill="none" stroke="#709d76" strokeWidth=".7" strokeDasharray="2 5"/></g>;})}
 {[[0,1],[1,2],[3,4],[4,5]].filter(([a,b])=>visible[a]&&visible[b]).map(([a,b])=>{const p=parcels[a],q=parcels[b],x=(p.x+p.w+q.x)/2;return <Bridge key={`${a}-${b}`} points={[[p.x+p.w-9,p.y+90],[x,p.y+90],[x,q.y+90],[q.x+9,q.y+90]]}/>;})}
 {[[0,3],[1,4],[2,5]].filter(([a,b])=>visible[a]&&visible[b]).map(([a,b])=>{const p=parcels[a],q=parcels[b],y=(p.y+p.h+q.y)/2;return <Bridge key={`${a}-${b}`} points={[[p.x+18,p.y+p.h-6],[p.x+18,y],[q.x+18,y],[q.x+18,q.y+6]]}/>;})}
 {/* Bridges cross scene boundaries at shared y coordinates, including the bottom row. */}
 {groupIndex>0&&[0,3].filter(i=>visible[i]).map(i=>{const p=parcels[i];return <Bridge key={`in-${i}`} points={[[0,p.y+90],[p.x+9,p.y+90]]}/>;})}
 {groupIndex<groups.length-1&&[Math.min(2,visible.length-1),visible.length-1].filter((i,k,arr)=>i>=0&&(k===0||i>=3&&i!==arr[0])).map(i=>{const p=parcels[i],next=parcels[i<3?0:3];return <Bridge key={`out-${i}`} points={[[p.x+p.w-9,p.y+90],[486,p.y+90],[486,next.y+90],[490,next.y+90]]}/>;})}
 {visible.map((s,i)=>{const p=parcels[i],level=gardenProgress(s.id,builds,interactions).level,active=(focus||viewer)===s.id,own=builds.filter(b=>b.studentId===s.id&&(!week||b.week===week)),connected=agents.some(a=>a.studentId===s.id);return <g key={s.id} className="garden-parcel" data-student-id={s.id} data-awaiting-index={awaitingIndex(s)} transform={`translate(${p.x} ${p.y})`}>
 {active&&<g className="selected-island"><path d={shore(p.w,p.h,i)} fill="none" stroke="#fff6b2" strokeWidth="5" opacity=".42" filter={`url(#garden-selection-glow-${groupIndex})`}/><path d={shore(p.w,p.h,i)} fill="#fff6b2" fillOpacity=".07" stroke="#fff5b7" strokeOpacity=".8" strokeWidth="1.2"/></g>}
 {level>=2&&<g aria-label="Flowering fence"><Flower x={45} y={84} scale={.24}/><Flower x={82} y={84} tint="#efbb54" scale={.24}/></g>}
 {level>=3&&<g aria-label="Garden lanterns" fill="#6f7850"><path d="M24 100v-12h2v12Z M86 100v-12h2v12Z"/><path d="M22 85h6v6h-6Z M84 85h6v6h-6Z" fill="#ffe2a1" stroke="#987a50"/></g>}
 {level>=4&&<g aria-label="Pond"><path d="M74 14h16v4h5v8H78v-3h-4Z" fill="#7ebaaa" stroke="#88a269" strokeWidth="2"/><path d="M79 19h7m2 4h4" stroke="#d2ead0"/></g>}
 <path d={`M18 ${i<3?33:6}V${i<3&&visible[i+3]?p.h-6:90} M${i%3===0&&groupIndex===0?18:7} 90H${(i%3<2&&visible[i+1])||(groupIndex<groups.length-1&&(i===2||i===visible.length-1))?p.w-9:60} M18 33H52 M60 90V78`} fill="none" stroke="#b9c181" strokeWidth="10"/><path d={`M18 ${i<3?33:6}V${i<3&&visible[i+3]?p.h-6:90} M${i%3===0&&groupIndex===0?18:7} 90H${(i%3<2&&visible[i+1])||(groupIndex<groups.length-1&&(i===2||i===visible.length-1))?p.w-9:60} M18 33H52 M60 90V78`} fill="none" stroke="#e8d7a8" strokeWidth="7"/>
 <Tree x={p.w-17} y={34} size={.76} fruit={i%2===0}/><Tree x={p.w-42} y={21} size={.6}/>

 <g aria-hidden="true"><path d={`M${p.w-15} 52h7v3h3v6h-15v-6h5Z`} fill="#8eab6f" stroke="#668d61" strokeWidth=".8"/><path d={`M${p.w-13} 53h4v3h-4Z`} fill="#b9cb87"/>
 <path d={`M${p.w-16} 71h6l3 3v4h-12v-3Z`} fill="#8d9e7f"/><path d={`M${p.w-14} 71h4v3h-7Z`} fill="#c8cead"/>
 <path d={`M8 ${p.h-27}h3v3H8Z M5 ${p.h-24}h9v2H5Z M8 ${p.h-22}h3v3H8Z`} fill="#fff1c9"/><rect x="8" y={p.h-24} width="3" height="2" fill="#d8b367"/>
 <path d={`M${p.w-8} ${p.h-30}v-10m-3 10v-7m6 7v-6`} stroke="#749a67" strokeWidth="1.4"/>
 <path d="M65 16h6v4h-6Z M62 19h12v5H62Z" fill="#819c63"/><path d="M65 16h6v3h-6Z" fill="#aec681"/>
 </g>
 <g transform="translate(33 13)" shapeRendering="crispEdges"><rect width="25" height="20" fill="#efe1b2" stroke="#a68d62"/><path d="M-3 0v-4h4v-4h4v-4h13v4h4v4h6v4Z" fill={['#87a27a','#a193af','#c1996d'][i%3]} stroke="#698467" strokeWidth="1"/><path d="M2-4h21M7-8h12M8-8v4m8 0v4" stroke="#ffffff" strokeOpacity=".2" strokeWidth=".8"/><path d="M1 15h12m-12 4h12M2 2h19" stroke="#d1bf90" strokeWidth=".7"/><rect x="4" y="6" width="6" height="6" fill="#9fc5b3" stroke="#faf1cf"/><rect x="15" y="8" width="7" height="12" fill="#b6a17a"/><path d="M17 10v9m2-9v9" stroke="#a48a62" strokeWidth=".6"/><rect x="20" y="15" width="1" height="1" fill="#685a41"/><path d="M14 21h9v2h-9Z" fill="#c7bf91"/></g>

 <Fence x={38} y={84} length={5}/><Fence x={76} y={84} length={Math.max(12,p.w-89)}/>
 <g role="button" tabIndex={0} aria-label={`${s.name}, ${own.length} indexed builds`} aria-pressed={active} onClick={()=>onSelect(s.id)} onKeyDown={e=>keyboard(e,()=>onSelect(s.id))} className="world-person"><title>{s.name}</title><rect className="person-hit" x="23" y="38" width="27" height="43" fill="transparent"/><g className="resident-walk" style={{animationDelay:`-${i*3}s`}}><PersonSprite id={s.id} role={s.role} variant={s.avatar} x={35} y={76} scale={1.15}/></g><g className="agent-walk" style={{animationDelay:`-${i*2}s`}} opacity={connected?1:.65}><AgentSprite id={s.id} x={35} y={91} scale={.8}/></g></g>
 {Array.from({length:13},(_,k)=>{const w=k+1,x=54+(k%4)*13,y=40+Math.floor(k/4)*10,works=own.filter(b=>b.week===w);return <g key={w}><rect x={x} y={y} width="11" height="8" fill={works.length?'#b49669':'#aabf7e'} stroke={works.length?'#997c53':'#95ad6d'} strokeWidth=".8"/>{works.map((b,j)=><g key={b.id} role="button" tabIndex={0} className="world-flower" aria-label={`Open flower: ${b.title}`} onClick={()=>onBuildSelect?.(b)} onKeyDown={e=>keyboard(e,()=>onBuildSelect?.(b))}><title>W{w}: {b.title}</title><rect x={x-1} y={y-8} width="13" height="17" fill="transparent"/><Flower x={x+5+j*2} y={y+5} tint={color[b.themes[0]]} kind={w-1} scale={.32}/>{interactions.some(it=>it.kind==='water'&&it.target===b.id)&&<rect x={x+9} y={y-2} width="2" height="2" fill="#609bab"/>}</g>)}</g>;})}
 {awaitingIndex(s)&&<g className="pending-index-sign" role="img" aria-label="Weekly work awaiting indexing" shapeRendering="crispEdges"><title>{s.sourceCoverage?.worksWithoutWeek?.length?'Public project found; week not yet assigned':'Weekly work awaiting indexing'}</title><path d="M76 63h3v11h-3Z M96 63h3v11h-3Z" fill="#9f8059"/><rect x="56" y="46" width="51" height="18" fill="#f5e6bc" stroke="#a28b5e" strokeWidth="1"/><path d="M58 48h47M58 62h47" stroke="#dbc798" strokeWidth=".7"/><text x="81.5" y="57" textAnchor="middle" fontFamily="GardenPixel,monospace" fontSize="5.2" fill="#776647">To be indexed</text></g>}
 <a href={`/gardens/${s.id}`} aria-label={`Enter ${s.name}'s garden`} className="island-sign"><rect x="28" y={p.h-22} width={p.w-36} height="16" fill={active?'#fff1c3':'#f1e1b9'} stroke={active?'#768947':'#a39369'} strokeWidth="1"/><text x={p.w/2+10} y={p.h-12} fontSize="7.5" fontFamily="GardenPixel,monospace" fill="#606c49" textAnchor="middle">{s.name.split(' ')[0]} · {new Set(own.map(b=>b.week).filter(w=>w>=1&&w<=13)).size}/13 ↗</text></a>
 </g>;})}
 </>}
 </svg></div>)}</div>
 <div className="neighborhood-roster">{visible.map((s,i)=><button key={s.id} onClick={()=>onSelect(s.id)} aria-pressed={(focus||viewer)===s.id}><span className="roster-number">{i+1}</span><CharacterAvatar id={s.id} variant={s.avatar} role={s.role} size={40}/><span>{s.name}<small>{s.role==='teacher'?'Teacher':s.role==='ta'?'TA':s.id===viewer?'You':'Student'}</small></span></button>)}</div>

 </div>;
}

function ClassroomIsland({staff,selected,onSelect,grassId,hasPrevious,hasNext}:{staff:Student[];selected:string;onSelect:(id:string)=>void;grassId:string;hasPrevious:boolean;hasNext:boolean}){
 const positions=[[190,142],[300,142],[135,212],[245,212],[355,212],[190,270],[300,270]];
 return <g className="classroom-island" aria-label="Shared classroom island for teachers and teaching assistants" shapeRendering="crispEdges">
 <path d={shore(330,282,0)} transform="translate(80 25)" fill="#688a61"/>
 <path d={shore(330,282,0)} transform="translate(80 20)" fill={`url(#${grassId})`} stroke="#e1e4a4" strokeWidth="2"/>
 {[110,266].map(y=><g key={y}>{hasPrevious&&<Bridge points={[[0,y],[88,y]]}/ >}{hasNext&&<Bridge points={[[402,y],[490,y]]}/ >}</g>)}
 <path d={`M${hasPrevious?88:110} 110H${hasNext?402:380}M110 110V266H${hasNext?402:380}M${hasPrevious?88:110} 266H110M380 110V266M245 110V264`} fill="none" stroke="#b7c080" strokeWidth="12"/>
 <path d={`M${hasPrevious?88:110} 110H${hasNext?402:380}M110 110V266H${hasNext?402:380}M${hasPrevious?88:110} 266H110M380 110V266M245 110V264`} fill="none" stroke="#e8d7a8" strokeWidth="8"/>
 <Tree x={113} y={78} size={.9}/><Tree x={378} y={78} size={.9}/>
 <g aria-label="Blackboard"><path d="M166 80v20h5V80M319 80v20h5V80" fill="#9e805a"/><rect x="161" y="33" width="168" height="55" fill="#b29164" stroke="#806c50" strokeWidth="2"/><rect x="167" y="39" width="156" height="42" fill="#4f6e5d"/><text x="245" y="57" textAnchor="middle" fontFamily="GardenPixel,monospace" fontSize="10" fill="#eceacb">MAS.S60</text><path d="M180 66h42m-42 5h27m43-5h29m6 0h19" stroke="#b7cbb2" strokeWidth="1.5"/><rect x="161" y="82" width="168" height="5" fill="#c1a176"/><path d="M294 80h7v2h-7Z" fill="#f4e9c9"/><rect x="309" y="79" width="9" height="4" fill="#7e775c"/></g>
 <g fill="#d8b78a" stroke="#a38260" strokeWidth="1"><path d="M160 171h57v7h-57Z M273 171h57v7h-57Z"/><path d="M165 178v5m47-5v5m66-5v5m47-5v5" strokeWidth="3"/></g>
 {staff.map((s,i)=>{const [x,y]=positions[i]||[120+(i%4)*80,240];return <g key={s.id} className="world-person classroom-person" role="button" tabIndex={0} aria-label={`${s.name}, ${s.role==='teacher'?'Teacher':'TA'}, classroom island`} aria-pressed={selected===s.id} onClick={()=>onSelect(s.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(s.id);}}}>
 <rect x={x-44} y={y-33} width="88" height="51" fill="transparent"/>
 {selected===s.id&&<ellipse cx={x} cy={y+1} rx="14" ry="4" fill="#fff1af" opacity=".8"/>}
 <g className="resident-walk" style={{animationDelay:`-${i*3}s`}}><PersonSprite id={s.id} variant={s.avatar} role={s.role} x={x} y={y} scale={1.25}/></g>
 <text x={x} y={y+12} textAnchor="middle" fontFamily="GardenPixel,monospace" fontSize="6.5" fill="#506647">{s.name.split(' ')[0]} · {s.role==='teacher'?'Teacher':'TA'}</text>
 </g>;})}
 </g>;
}
