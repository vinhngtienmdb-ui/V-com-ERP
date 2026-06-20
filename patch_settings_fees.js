const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Settings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Patch state isSavingFee
const stateTarget = `const [activeModuleTab, setActiveModuleTab] = useState(MODULE_PERMISSIONS[0].id);`;
const stateReplacement = `const [activeModuleTab, setActiveModuleTab] = useState(MODULE_PERMISSIONS[0].id);\n  const [isSavingFee, setIsSavingFee] = useState(false);`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateReplacement);
  console.log("Successfully patched state isSavingFee.");
} else {
  console.error("State target not found!");
}

// 2. Patch useEffect & handleSaveFeeConfig
const handleSaveTarget = `  const handleSave = () => {
  setIsSaving(true);
  setTimeout(() => {
  setIsSaving(false);
  alert('Đã lưu các thay đổi cấu hình thành công!');
  }, 1000);
  };`;

const handleSaveReplacement = `  const handleSave = () => {
  setIsSaving(true);
  setTimeout(() => {
  setIsSaving(false);
  alert('Đã lưu các thay đổi cấu hình thành công!');
  }, 1000);
  };

  useEffect(() => {
    if (activeTab !== 'fees') return;
    
    async function loadFeeConfig() {
      try {
        const { data, error } = await supabase
          .from('tenant_settings')
          .select('data')
          .eq('id', 'config')
          .single();
        if (error) throw error;
        
        if (data?.data?.feeConfig) {
          const fc = data.data.feeConfig;
          if (fc.systemFees) {
            setSystemFees(fc.systemFees);
          }
          if (fc.categoryFees) {
            setCategoryFees(fc.categoryFees);
          }
        }
      } catch (err) {
        console.error("Error loading fee config from Supabase:", err);
      }
    }
    
    loadFeeConfig();
  }, [activeTab]);

  const handleSaveFeeConfig = async () => {
    setIsSavingFee(true);
    try {
      const { data: current, error: getErr } = await supabase
        .from('tenant_settings')
        .select('data')
        .eq('id', 'config')
        .single();
      if (getErr) throw getErr;

      const currentData = current.data || {};
      const updatedData = {
        ...currentData,
        feeConfig: {
          ...currentData.feeConfig,
          systemFees,
          categoryFees,
          commissionRate: 3.5
        }
      };

      const { error: updateErr } = await supabase
        .from('tenant_settings')
        .update({ data: updatedData })
        .eq('id', 'config');

      if (updateErr) throw updateErr;
      addNotification('Đã lưu cấu hình', 'Cấu hình Phí sàn đã được cập nhật lên hệ thống thành công.');
      alert('Đã lưu cấu hình Phí sàn thành công!');
    } catch (err) {
      console.error("Error saving fee config:", err);
      addNotification('Lỗi lưu cấu hình', 'Không thể lưu cấu hình — vui lòng thử lại.');
    } finally {
      setIsSavingFee(false);
    }
  };`;

// We normalize line endings in target comparisons to make it work on any platform
const normalize = (str) => str.replace(/\r\n/g, '\n').trim();

const normalizedContent = content.replace(/\r\n/g, '\n');
const normTarget = normalize(handleSaveTarget);

if (normalizedContent.includes(normTarget)) {
  // Let's replace using regex or index
  const index = normalizedContent.indexOf(normTarget);
  const before = normalizedContent.substring(0, index);
  const after = normalizedContent.substring(index + normTarget.length);
  content = before + handleSaveReplacement + after;
  console.log("Successfully patched useEffect and handleSaveFeeConfig.");
} else {
  console.error("handleSave target not found!");
}

// 3. Patch button in Tab fees
const tabFeesTarget = `  </tbody>
  </table>
  </div>
  </div>
  </div>
  )}

  {activeTab === 'website' && (`;

const tabFeesReplacement = `  </tbody>
  </table>
  </div>
  
  <div className="flex justify-end pt-4">
    <button 
      onClick={handleSaveFeeConfig} 
      disabled={isSavingFee} 
      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
    >
      <Save className="w-4 h-4" />{isSavingFee ? 'Đang lưu...' : 'Lưu cấu hình Phí sàn'}
    </button>
  </div>
  
  </div>
  </div>
  )}

  {activeTab === 'website' && (`;

const currentNormalized = content.replace(/\r\n/g, '\n');
const normTabFeesTarget = normalize(tabFeesTarget);

if (currentNormalized.includes(normTabFeesTarget)) {
  const index = currentNormalized.indexOf(normTabFeesTarget);
  const before = currentNormalized.substring(0, index);
  const after = currentNormalized.substring(index + normTabFeesTarget.length);
  content = before + tabFeesReplacement + after;
  console.log("Successfully patched Save button in Tab fees.");
} else {
  console.error("Tab fees target not found!");
}

// Write back preserving CRLF if the original file had it
// Since we manipulated normalized LF content, let's write it back with CRLF
fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log("Settings.tsx successfully written!");
