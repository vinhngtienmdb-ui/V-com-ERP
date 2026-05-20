import fs from 'fs';
let code = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8');

const lines = code.split('\n');
const startMatch = lines.findIndex(l => l.includes('<div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">') && l.includes('gap-3">'));

if (startMatch !== -1) {
    console.log("Found hanging part at line:", startMatch);
    // Find the enclosing } for the old modal, which ends with )}
    // Let's remove from startMatch - 2 (since there's a </div> \n <div...)
    // Actually, looking at the snippet:
    // 254:  </div>
    // 255: 
    // 256:  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
    // ...
    // 283:  )}
    
    let endMatch = startMatch;
    for (let i = startMatch; i < lines.length; i++) {
        if (lines[i].trim() === ')}') {
            endMatch = i;
            break;
        }
    }
    
    // The snippet above shows line 283 is `)}`.
    // We should safely splice from line 254 to 283
    
    lines.splice(253, 31); // remove from line 254 to 284
    
    fs.writeFileSync('src/components/ContractManager.tsx', lines.join('\n'));
    console.log("Removed dangling lines");
}
