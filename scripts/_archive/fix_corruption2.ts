import fs from 'fs';

let reqHub = fs.readFileSync('src/components/RequestHub.tsx', 'utf-8');
reqHub = reqHub.replace('onClick={() => {\n e.stopPropagation();', 'onClick={(e) => {\n e.stopPropagation();')
               .replace('onClick={() => { e.stopPropagation();', 'onClick={(e) => { e.stopPropagation();')
               .replace('onClick={() => {\n  e.stopPropagation()', 'onClick={(e) => {\n  e.stopPropagation()');

fs.writeFileSync('src/components/RequestHub.tsx', reqHub);
