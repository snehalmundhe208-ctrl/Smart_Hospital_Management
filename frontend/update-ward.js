const fs = require('fs');
const file = 'frontend/src/pages/WardsBedsDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace bg-white rounded-[2rem] shadow-sm border border-slate-200 with admin glassmorphism
content = content.replace(/bg-white rounded-\[2rem\] shadow-sm border border-slate-200/g, 'bg-slate-900/60 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/10 text-white');

// Replace top bar stat card
content = content.replace(/bg-white border border-slate-200/g, 'bg-slate-900/60 backdrop-blur-xl border border-white/10 text-white');
content = content.replace(/text-slate-500/g, 'text-slate-400');
content = content.replace(/text-slate-800/g, 'text-white');
content = content.replace(/text-slate-700/g, 'text-slate-200');

// Replace specific list item styling
content = content.replace(/bg-white hover:bg-slate-50 border-slate-200 text-slate-700/g, 'bg-slate-800/50 hover:bg-slate-700/50 border-white/10 text-slate-200');
content = content.replace(/bg-slate-50 rounded-2xl/g, 'bg-slate-900/40 rounded-2xl border border-white/10');
content = content.replace(/bg-white hover:bg-slate-50/g, 'bg-slate-800/50 hover:bg-slate-700/50');
content = content.replace(/hover:bg-slate-200/g, 'hover:bg-slate-700');

// Replace bed grid cards
content = content.replace(/bg-white\s+hover:shadow-md/g, 'bg-slate-800/50 hover:shadow-lg hover:border-white/30');

// Fix text colors in modals
content = content.replace(/text-slate-900/g, 'text-white');

fs.writeFileSync(file, content);
console.log('Updated WardsBedsDashboard');
