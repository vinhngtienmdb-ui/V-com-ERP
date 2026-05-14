import fs from 'fs';
let lines = fs.readFileSync('src/components/ContractManager.tsx', 'utf-8').split('\n');
const startMatch = lines.findIndex(l => l.includes('<div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">'));
if (startMatch !== -1) {
    let endMatch = startMatch;
    for (let i = startMatch; i < lines.length; i++) {
        if (lines[i].trim() === ')}') {
            endMatch = i;
            break;
        }
    }
    // Remove from the previous `</div>` till the closing `)}`
    lines.splice(startMatch - 2, (endMatch - startMatch) + 3); 
    fs.writeFileSync('src/components/ContractManager.tsx', lines.join('\n'));
    console.log("Spliced correctly");
}
