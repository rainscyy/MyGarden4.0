import GardenApp from '@/components/cognitive/GardenApp';
import {readState} from '@/lib/cognitive/storage';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{studentId:string}>}){
 const {studentId}=await params;
 const state=await readState();
 if(!state.students.some(s=>s.id===studentId))notFound();
 return <GardenApp key={studentId} initialGardenId={studentId}/>;
}
