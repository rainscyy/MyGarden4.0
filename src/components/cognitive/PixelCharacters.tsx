// Original grid-drawn interface sprites. References inform silhouettes, not copied image assets.
export const characterPalettes=[
 {coat:'#db8965',light:'#ffc790',dark:'#a75d4e'},
 {coat:'#9294bb',light:'#d0c3e3',dark:'#69698e'},
 {coat:'#6da898',light:'#bde0ba',dark:'#467e78'},
 {coat:'#ccad5b',light:'#f7dc89',dark:'#9a803f'},
 {coat:'#c5839e',light:'#f0bdc6',dark:'#965b7a'},
 {coat:'#78a4b9',light:'#c0dbe2',dark:'#567d97'},
];
export function characterIndex(id:string){return Array.from(id).reduce((n,c)=>n*31+c.charCodeAt(0),7)>>>0;}
function Pixels({rows,palette}:{rows:string[];palette:Record<string,string>}){
 return <>{rows.flatMap((row,y)=>Array.from(row).map((key,x)=>key==='.'?null:<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={palette[key]}/>))}</>;
}
const staffCharacters:Record<string,{variant:number;palette:number}>={
 'pattie-maes':{variant:2,palette:0},'valdemar-danry':{variant:0,palette:2},
 'chitralekha-gupta':{variant:0,palette:5},'rachel-poonsiriwong':{variant:1,palette:4},'sheer-karny':{variant:6,palette:2},'wazeer-zulfikar':{variant:4,palette:3},'yasith-samaradivakara':{variant:7,palette:1}
};
export const characterNames=['Rabbit','Bear','Fox','Hamster','Koala','Chick','Cat','Puppy'];
// A shared 20 x 26 pixel grid keeps every resident in the same visual language.
function residentHead(v:number){
 const pixels=Array.from({length:17},()=>Array<string>(20).fill('.'));
 const fill=(x:number,y:number,w:number,h:number,c:string)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(pixels[j]?.[i]!==undefined)pixels[j][i]=c;};
 // Rounded cheek silhouette with species-specific ears drawn into the head.
 fill(5,4,10,1,'f');fill(3,5,14,2,'f');fill(2,7,16,6,'f');fill(3,13,14,2,'f');fill(5,15,10,1,'f');
 if(v===0){fill(4,0,3,6,'f');fill(13,0,3,6,'f');fill(5,1,1,4,'i');fill(14,1,1,4,'i');}
 if(v===1||v===3){fill(3,2,4,4,'f');fill(13,2,4,4,'f');fill(4,3,2,2,'i');fill(14,3,2,2,'i');}
 if(v===2||v===6){fill(3,1,2,5,'f');fill(5,3,2,3,'f');fill(15,1,2,5,'f');fill(13,3,2,3,'f');fill(4,3,1,2,'i');fill(15,3,1,2,'i');}
 if(v===4){fill(1,3,5,5,'f');fill(14,3,5,5,'f');fill(2,4,3,3,'m');fill(15,4,3,3,'m');}
 if(v===5){fill(8,2,2,3,'f');fill(10,1,2,4,'f');fill(12,3,2,2,'f');}
 if(v===7){fill(1,5,4,6,'s');fill(15,5,4,6,'s');fill(2,6,2,3,'f');fill(16,6,2,3,'f');}
 // Warm lower-face patches, small highlights and separate eye shapes.
 fill(5,11,10,4,'m');fill(3,11,3,2,'m');fill(14,11,3,2,'m');
 fill(4,12,2,1,'i');fill(14,12,2,1,'i');
 if(v===2){fill(3,9,3,2,'m');fill(14,9,3,2,'m');}
 if(v===6){fill(9,5,2,3,'s');fill(6,5,1,2,'s');fill(13,5,1,2,'s');}
 if(v===3){fill(3,8,2,3,'s');fill(15,8,2,3,'s');}
 fill(6,9,2,2,'o');fill(12,9,2,2,'o');fill(6,9,1,1,'h');fill(12,9,1,1,'h');fill(9,12,2,1,v===5?'b':'n');fill(9,13,1,1,'o');fill(10,14,2,1,'o');
 if(v===4)fill(9,11,2,3,'o');
 // One-pixel stepped outline, not a smooth vector stroke.
 const outlined=pixels.map(row=>[...row]);
 for(let y=0;y<17;y++)for(let x=0;x<20;x++)if(pixels[y][x]==='.'&&[[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy])=>pixels[y+dy]?.[x+dx]&&pixels[y+dy][x+dx]!=='.'))outlined[y][x]='o';
 return outlined.map(row=>row.join(''));
}
export function PersonSprite({id,role='student',variant,x=0,y=0,scale=1}:{id:string;role?:'student'|'teacher'|'ta';variant?:number;x?:number;y?:number;scale?:number}){
 const n=characterIndex(id),staff=staffCharacters[id],p=characterPalettes[staff?.palette??n%characterPalettes.length],v=(variant??staff?.variant??(n>>>4)%8)%8;
 const fur=['#f3efdc','#b9a6bd','#d8a06f','#d1b180','#b2bcb9','#e6cb79','#aec5c1','#c8a282'][v];
 const shade=['#b2c6b0','#948395','#b67d58','#ae8963','#8b9f9d','#caa956','#7f9e9c','#9f795e'][v];
 const body=['.....occcccccco.....','....occhcchcccco....','...ofoccccccccofo...','...ofocclllcccofo...','....oocclllccoo.....','.....occcccccco.....','......ooooooo.......','......ob..bo........','.....ooo..ooo.......'];
 return <g className="resident-sprite" data-character={characterNames[v]} transform={`translate(${x-10*scale} ${y-26*scale}) scale(${scale})`} shapeRendering="crispEdges">
 <ellipse cx="10" cy="26" rx="8" ry="2" fill="#496743" opacity=".18"/>
 <Pixels rows={[...residentHead(v),...body]} palette={{o:'#4e4c48',f:fur,s:shade,m:'#f3e8cc',i:'#d9a6a0',h:'#fff4dd',n:'#88635c',b:'#aa7657',c:p.coat,l:p.light}}/>
 {role==='teacher'&&<><path d="M5 8h4v4H5ZM11 8h4v4h-4Z M9 10h2" fill="none" stroke="#665d51" strokeWidth="1"/><path d="M15 19h3v5h-3Z" fill="#f8e6b8" stroke="#a38c60" strokeWidth=".6"/></>}
 {id==='valdemar-danry'&&<g className="resident-moustache" fill="#796153"><path d="M6 12h3v1h2v-1h3v1h-1v1h-2v-1H9v1H7v-1H6Z"/><path d="M8 15h1v1H8Z M10 15h2v1h-2Z" fill="#a18a73"/></g>}
 {role==='ta'&&<><rect x="11" y="19" width="3" height="2" fill="#fff1ac"/><rect x="12" y="19" width="1" height="1" fill="#9b955d"/></>}
 </g>;
}
export function AgentSprite({id,x=0,y=0,scale=1}:{id:string;x?:number;y?:number;scale?:number}){
 const n=characterIndex(id),p=characterPalettes[n%characterPalettes.length];
 const rows=['......oooo......','....oolllloo....','...ollllllllo...','...ollllllllo...','..olllllllcllo..','..olloolloolco..','..ollllllllcco..','.olllllmmlllcco.','.olcllllllllcco.','olcccllllllcccco','olccccccccccccco','.oooooooooooooo.'];
 return <g transform={`translate(${x-8*scale} ${y-12*scale}) scale(${scale})`} shapeRendering="crispEdges">
 <ellipse cx="8" cy="13" rx="8" ry="2" fill="#496743" opacity=".17"/>
 <Pixels rows={rows} palette={{o:'#495648',l:p.light,c:p.coat,m:p.dark}}/>
 {n%3===0&&<><rect x="10" y="3" width="2" height="2" fill="#fff5cf"/><rect x="9" y="4" width="4" height="1" fill="#fff5cf"/></>}
 {n%3===1&&<><rect x="3" y="9" width="2" height="1" fill={p.dark}/><rect x="11" y="9" width="2" height="1" fill={p.dark}/></>}
 </g>;
}
export function CharacterAvatar({id,kind='human',role='student',variant,size=48}:{id:string;kind?:'human'|'agent';role?:'student'|'teacher'|'ta';variant?:number;size?:number}){
 return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="character-avatar">{kind==='human'?<PersonSprite id={id} role={role} variant={variant} x={16} y={31} scale={1.05}/>:<AgentSprite id={id} x={16} y={24} scale={1.4}/>}</svg>;
}
