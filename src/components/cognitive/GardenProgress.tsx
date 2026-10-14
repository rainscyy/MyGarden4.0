import {gardenProgress} from '@/lib/cognitive/progression';
import type {Build,Interaction} from '@/lib/cognitive/types';
export default function GardenProgress({id,builds,interactions}:{id:string;builds:Build[];interactions:Interaction[]}){
 const p=gardenProgress(id,builds,interactions);
 return <div className="garden-progress" data-level={p.level}><div><b>Lv.{p.level} · {p.name}</b><span>{p.xp} XP</span></div><progress aria-label="Garden level progress" value={p.percent} max={100}/><small>{p.next?`${p.next.xp-p.xp} XP to ${p.next.unlock.toLowerCase()}`:'All garden upgrades unlocked'}</small><details><summary>How to earn XP</summary><p>Each indexed build +10 · Water a build +5 · Receive water +3 · First visit to another garden or build +2.</p><p>Each visit counts once. Repeat watering does not stack; removing water removes its XP. Demo messages give no XP.</p></details></div>;
}
