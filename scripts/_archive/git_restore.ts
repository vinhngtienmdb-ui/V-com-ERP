import { exec } from 'child_process';

exec('git checkout -- src/components/Settings.tsx', (err, stdout, stderr) => {
  if (err) {
    console.error('Git error:', err);
    console.error('stderr:', stderr);
    process.exit(1);
  }
  console.log('✓ Successfully checked out pristine Settings.tsx via Git!');
  console.log('stdout:', stdout);
});
