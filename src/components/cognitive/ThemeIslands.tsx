'use client';
import {useEffect,useRef,useState} from 'react';
import type {Student,Build} from '@/lib/cognitive/types';
import {CharacterAvatar} from './PixelCharacters';
import {Flower} from './Forest';
type Bridge={key:string;d:string;direction:'horizontal'|'vertical'};
export default function ThemeIslands({theme,works,students,tint,onBuild,onSave,saved}:{theme:string;works:Build[];students:Student[];tint:string;onBuild:(b:Build)=>void;onSave:()=>void;saved:boolean}){
 const people=students.filter(s=>works.some(b=>b.studentId===s.id));const grid=useRef<HTMLDivElement>(null);const [bridges,setBridges]=useState<Bridge[]>([]);
 useEffect(()=>{const el=grid.current;if(!el)return;let frame=0;
 const measure=()=>{const base=el.getBoundingClientRect();const cards=Array.from(el.querySelectorAll<HTMLElement>('.theme-island')).map(e=>e.getBoundingClientRect());const paths:Bridge[]=[];
 cards.forEach((a,i)=>{const right=cards.findIndex((b,j)=>j>i&&Math.abs(a.top-b.top)<2&&b.left>a.right);const below=cards.findIndex((b,j)=>j>i&&Math.abs(a.left-b.left)<2&&b.top>a.bottom);
 if(right>=0){const b=cards[right],y=Math.min(a.top+100,a.bottom-25,b.bottom-25)-base.top;paths.push({key:`${i}-${right}`,direction:'horizontal',d:`M${a.right-base.left-5} ${y}H${b.left-base.left+5}`});}
 if(below>=0){const b=cards[below],x=(a.left+a.right)/2-base.left;paths.push({key:`${i}-${below}`,direction:'vertical',d:`M${x} ${a.bottom-base.top-5}V${b.top-base.top+5}`});}});setBridges(paths);};
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};const ro=new ResizeObserver(schedule);ro.observe(el);el.querySelectorAll('.theme-island').forEach(e=>ro.observe(e));document.fonts.ready.then(schedule);schedule();return()=>{ro.disconnect();cancelAnimationFrame(frame);};
 },[theme,works,students]);
 return <section className="theme-neighborhood"><div className="section-title"><h2>{theme}</h2><button className="secondary" disabled={saved||works.length<2} onClick={onSave}>{saved?'Saved ✓':'Save group'}</button></div><p className="theme-key">{people.length} gardens · {works.length} builds · Shared theme</p><div className="linked-islands" ref={grid}><svg className="theme-bridges" aria-hidden="true">{bridges.map(b=><g key={b.key} data-direction={b.direction}><path d={b.d} stroke="#8b7656" strokeWidth="26"/><path d={b.d} stroke="#e1c599" strokeWidth="22"/><path d={b.d} stroke="#b79868" strokeWidth="20" strokeDasharray="2 6"/></g>)}</svg>{people.map(s=><article className="theme-island" key={s.id}><a className="island-owner" href={`/gardens/${s.id}`}><CharacterAvatar id={s.id} variant={s.avatar} role={s.role} size={54}/><span>{s.name}<small>Open garden ↗</small></span></a><div className="island-builds">{works.filter(b=>b.studentId===s.id).map(b=><button key={b.id} onClick={()=>onBuild(b)} aria-label={`Explore ${b.title} by ${s.name}`}><svg viewBox="0 0 58 65" aria-hidden="true"><Flower x={29} y={56} tint={tint} kind={b.week-1} scale={1.1}/></svg><span><small>W{b.week}</small>{b.title}</span></button>)}</div></article>)}</div>{!works.length&&<p className="empty-state">No builds match this theme.</p>}</section>;
}
