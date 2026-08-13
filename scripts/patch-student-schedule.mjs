import { readFileSync } from 'node:fs';

const path = 'src/lg/student.jsx';
const s = readFileSync(path, 'utf8');

// The student timetable implementation is now maintained directly in student.jsx.
// This prebuild hook is intentionally validation-only so it never rewrites or
// breaks a newer implementation during production builds.
const required = [
  'const DAY_SHORT=',
  'const DAY_ORDER=',
  'const studentSlots=',
  'const scheduleCodeFor=',
  'Saturday',
];

const missing = required.filter(token => !s.includes(token));
if (missing.length) {
  throw new Error(`Student schedule implementation is incomplete: ${missing.join(', ')}`);
}

console.log('Student schedule implementation validated; no patch required.');
