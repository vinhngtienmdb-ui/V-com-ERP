import fs from 'fs';
import readline from 'readline';

const transcriptPath = 'C:\\Users\\vinhn\\.gemini\\antigravity\\brain\\1b6b94e2-e93f-446e-a263-b71a47b3375d\\.system_generated\\logs\\transcript.jsonl';

async function search() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("=== Matching Lines in Transcript ===");
  for await (const line of rl) {
    if (line.toLowerCase().includes('nexthub') || line.toLowerCase().includes('store-retail') || line.toLowerCase().includes('hệ thống cũ') || line.toLowerCase().includes('cũ')) {
      try {
        const step = JSON.parse(line);
        if (step.type === 'USER_INPUT') {
          console.log(`[Step ${step.step_index}] Prompt: ${step.content}`);
        } else if (step.type === 'PLANNER_RESPONSE' && step.content) {
          // print snippet of planner responses
          console.log(`[Step ${step.step_index}] Agent: ${step.content.substring(0, 150)}...`);
        }
      } catch (e) {
        // Ignored
      }
    }
  }
}

search();
