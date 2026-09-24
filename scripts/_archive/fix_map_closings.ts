import * as fs from 'fs';
import * as path from 'path';

const settingsPath = path.join(process.cwd(), 'src/components/Settings.tsx');
let content = fs.readFileSync(settingsPath, 'utf8');

// Replacement 1: quota map closing
const oldQuotaClose = `								<div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-semibold">
									<span>Đã dùng: {quota.percent}%</span>
									<span className="text-slate-500">Còn lại: {(100 - quota.percent).toFixed(1)}%</span>
								</div>
							</div>
						}))}`;

const newQuotaClose = `								<div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-semibold">
									<span>Đã dùng: {quota.percent}%</span>
									<span className="text-slate-500">Còn lại: {(100 - quota.percent).toFixed(1)}%</span>
								</div>
							</div>
						))}`;

// Replacement 2: plans map closing
const oldPlanClose = `							<button 
								className={\`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer \${
									plan.active 
										? 'bg-blue-600 hover:bg-blue-700 text-white cursor-default' 
										: 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
								}\`}
								onClick={() => {
									if (!plan.active) {
										alert(\`Hệ thống mô phỏng Sandbox: Bạn đã gửi yêu cầu chuyển đổi lên gói "\${plan.name}". Kỹ sư giải pháp của chúng tôi sẽ liên hệ phê duyệt sớm nhất.\`);
									}
								}}
							>
								{plan.btnText}
							</button>
						</div>
					}))}`;

const newPlanClose = `							<button 
								className={\`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer \${
									plan.active 
										? 'bg-blue-600 hover:bg-blue-700 text-white cursor-default' 
										: 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
								}\`}
								onClick={() => {
									if (!plan.active) {
										alert(\`Hệ thống mô phỏng Sandbox: Bạn đã gửi yêu cầu chuyển đổi lên gói "\${plan.name}". Kỹ sư giải pháp của chúng tôi sẽ liên hệ phê duyệt sớm nhất.\`);
									}
								}}
							>
								{plan.btnText}
							</button>
						</div>
					))}`;

// Replacement 3: invoices map closing
const oldInvoiceClose = `									<tr key={iidx} className="hover:bg-slate-50/50">
										<td className="p-3 font-mono font-bold text-slate-800">{inv.id}</td>
										<td className="p-3 font-semibold text-slate-700">{inv.plan}</td>
										<td className="p-3 text-slate-500">{inv.date}</td>
										<td className="p-3 font-bold text-slate-900">{inv.amount}</td>
										<td className="p-3">
											<span className={"px-2 py-0.5 text-[10px] font-bold rounded-md border " + inv.clr}>
												{inv.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>`;

const newInvoiceClose = `									<tr key={iidx} className="hover:bg-slate-50/50">
										<td className="p-3 font-mono font-bold text-slate-800">{inv.id}</td>
										<td className="p-3 font-semibold text-slate-700">{inv.plan}</td>
										<td className="p-3 text-slate-500">{inv.date}</td>
										<td className="p-3 font-bold text-slate-900">{inv.amount}</td>
										<td className="p-3">
											<span className={"px-2 py-0.5 text-[10px] font-bold rounded-md border " + inv.clr}>
												{inv.status}
											</span>
										</td>
									</tr>
								(No extra brace here)`;

// Let's do replacements
if (content.includes(oldQuotaClose)) {
  console.log('Replacing quota close...');
  content = content.replace(oldQuotaClose, newQuotaClose);
} else {
  console.log('Could not find quota close match');
}

if (content.includes(oldPlanClose)) {
  console.log('Replacing plan close...');
  content = content.replace(oldPlanClose, newPlanClose);
} else {
  console.log('Could not find plan close match');
}

// Let's check for "}))}" occurrences generally
let matches = content.match(/\}\)\)\}/g);
console.log('Total occurrences of "}))}" initially:', matches ? matches.length : 0);

// Let's do a programmatic regex replacement for index maps that have array literals with map
content = content.replace(/\]\s*\.map\(\(([^)]+)\)\s*=>\s*\([\s\S]*?\}\s*\}\)\)\}/g, (match) => {
  console.log('✓ Found a match to safely replace with ))}:', match.substring(match.length - 20));
  return match.substring(0, match.length - 4) + '))}' ;
});

fs.writeFileSync(settingsPath, content, 'utf8');
console.log('Verification check of "}))}" count now:', (content.match(/\}\)\)\}/g) || []).length);
