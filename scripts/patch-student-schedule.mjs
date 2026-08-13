import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/lg/student.jsx';
let s = readFileSync(path, 'utf8');

const oldHome = 'const slots=student?lsG("timetable").filter(tt=>tt.cls===student.cls&&tt.sec===student.sec&&tt.day===today()):[];const ann=lsG("announcements").filter(a=>a.target==="all").slice(0,2);';
const newHome = 'const allSlots=student?lsG("timetable").filter(tt=>student.batch_id?String(tt.batchId)===String(student.batch_id):(tt.cls===student.cls&&tt.sec===student.sec)):[];const slots=allSlots.filter(tt=>tt.day===today());const dayOrder={Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};const scheduleDays=[...new Set(allSlots.map(tt=>tt.day).filter(Boolean))].sort((a,b)=>(dayOrder[a]??99)-(dayOrder[b]??99));const scheduleCode=scheduleDays.map(day=>day[0]).join("");const ann=lsG("announcements").filter(a=>a.target==="all").slice(0,2);';
if (!s.includes(oldHome)) throw new Error('Student home timetable source not found');
s = s.replace(oldHome, newHome);

const oldStats = '{[[`${rate}%`,"Attendance"],[hw.length,"Homework"],[slots.length,"Today"]].map(([v,l])=>';
const newStats = '{[[`${rate}%`,"Attendance"],[hw.length,"Homework"],[slots.length,"Today"],[scheduleCode||"—","Schedule"]].map(([v,l])=>';
if (!s.includes(oldStats)) throw new Error('Student home stats source not found');
s = s.replace(oldStats, newStats);

const oldDays = 'const days=["Monday","Tuesday","Wednesday","Thursday","Friday"];';
const newDays = 'const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];';
if (!s.includes(oldDays)) throw new Error('Student weekday list not found');
s = s.replace(oldDays, newDays);

const oldFilter = 'const slots=student?lsG("timetable").filter(tt=>tt.cls===student.cls&&tt.sec===student.sec):[];';
const newFilter = 'const slots=student?lsG("timetable").filter(tt=>student.batch_id?String(tt.batchId)===String(student.batch_id):(tt.cls===student.cls&&tt.sec===student.sec)):[];';
if (!s.includes(oldFilter)) throw new Error('Student timetable filter not found');
s = s.replace(oldFilter, newFilter);

writeFileSync(path, s);
