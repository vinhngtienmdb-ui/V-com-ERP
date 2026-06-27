import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Save, Eye, Code, Edit3, Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter,
  AlignRight, Link, Image, Quote, Minus, Eraser, Undo, Redo,
  ChevronDown, ExternalLink, Loader2, FileText,
} from 'lucide-react';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';
import { cn } from '../lib/utils';

interface PageData {
  title: string;
  seoDescription: string;
  content: string;
  slug: string;
  url: string;
  updatedAt?: unknown;
}

type ViewMode = 'wysiwyg' | 'html' | 'preview';

interface Props {
  url: string;
  defaultTitle?: string;
  onClose: () => void;
}

// ── Toolbar config ────────────────────────────────────────────────────────────
interface ToolbarBtn {
  icon: React.ElementType;
  label: string;
  action: () => void;
  active?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(url: string) {
  return url.replace(/^\//, '').replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '') || 'home';
}

function wordCount(html: string) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PageEditorModal({ url, defaultTitle = '', onClose }: Props) {
  const slug = slugify(url);
  const editorRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg');
  const [htmlSource, setHtmlSource] = useState('');
  const [title, setTitle] = useState(defaultTitle);
  const [seoDesc, setSeoDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkHref, setLinkHref] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  // ── Load from Firestore ───────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    getDoc(doc(db, 'pages', slug)).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as PageData;
        setTitle(data.title || defaultTitle);
        setSeoDesc(data.seoDescription || '');
        setHtmlSource(data.content || '');
        if (editorRef.current) editorRef.current.innerHTML = data.content || '';
      }
    }).finally(() => setIsLoading(false));
  }, [slug, defaultTitle]);

  // ── execCommand wrapper ───────────────────────────────────────────────────
  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
  }, []);

  const formatBlock = useCallback((tag: string) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
  }, []);

  // ── View mode switches ────────────────────────────────────────────────────
  const switchMode = (mode: ViewMode) => {
    if (viewMode === 'wysiwyg') setHtmlSource(editorRef.current?.innerHTML ?? '');
    if (mode === 'wysiwyg' && editorRef.current) {
      const src = viewMode === 'html' ? htmlSource : editorRef.current.innerHTML;
      editorRef.current.innerHTML = src;
    }
    setViewMode(mode);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    const content = viewMode === 'wysiwyg'
      ? (editorRef.current?.innerHTML ?? '')
      : htmlSource;
    try {
      await setDoc(doc(db, 'pages', slug), {
        title, seoDescription: seoDesc, content, slug, url,
        updatedAt: serverTimestamp(),
      } satisfies Omit<PageData, 'updatedAt'> & { updatedAt: unknown });
      setSaveMsg('Đã lưu!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch {
      setSaveMsg('Lỗi lưu — thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Link insert ───────────────────────────────────────────────────────────
  const openLinkDialog = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      setSavedSelection(sel.getRangeAt(0).cloneRange());
      setLinkText(sel.toString());
    }
    setLinkHref('');
    setShowLinkDialog(true);
  };

  const insertLink = () => {
    if (!linkHref) return;
    editorRef.current?.focus();
    if (savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection);
    }
    if (linkText && !window.getSelection()?.toString()) {
      document.execCommand('insertHTML', false, `<a href="${linkHref}" target="_blank">${linkText || linkHref}</a>`);
    } else {
      document.execCommand('createLink', false, linkHref);
      const a = window.getSelection()?.anchorNode?.parentElement?.closest('a');
      if (a) a.target = '_blank';
    }
    setShowLinkDialog(false);
    setSavedSelection(null);
  };

  // ── Image insert ──────────────────────────────────────────────────────────
  const insertImage = () => {
    if (!imageUrl) return;
    editorRef.current?.focus();
    document.execCommand('insertHTML', false,
      `<img src="${imageUrl}" alt="${imageAlt}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0" />`);
    setShowImageDialog(false);
    setImageUrl(''); setImageAlt('');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false,
        `<img src="${reader.result}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0" />`);
      setShowImageDialog(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Keyboard shortcut: Ctrl+S ─────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Toolbar buttons ───────────────────────────────────────────────────────
  const toolbarGroups: ToolbarBtn[][] = [
    [
      { icon: Undo, label: 'Hoàn tác (Ctrl+Z)', action: () => exec('undo') },
      { icon: Redo, label: 'Làm lại (Ctrl+Y)', action: () => exec('redo') },
    ],
    [
      { icon: Bold, label: 'In đậm (Ctrl+B)', action: () => exec('bold') },
      { icon: Italic, label: 'In nghiêng (Ctrl+I)', action: () => exec('italic') },
      { icon: Underline, label: 'Gạch chân (Ctrl+U)', action: () => exec('underline') },
      { icon: Strikethrough, label: 'Gạch giữa', action: () => exec('strikeThrough') },
    ],
    [
      { icon: Heading1, label: 'Tiêu đề 1', action: () => formatBlock('<h1>') },
      { icon: Heading2, label: 'Tiêu đề 2', action: () => formatBlock('<h2>') },
      { icon: Heading3, label: 'Tiêu đề 3', action: () => formatBlock('<h3>') },
    ],
    [
      { icon: List, label: 'Danh sách bullet', action: () => exec('insertUnorderedList') },
      { icon: ListOrdered, label: 'Danh sách số', action: () => exec('insertOrderedList') },
      { icon: Quote, label: 'Trích dẫn', action: () => formatBlock('<blockquote>') },
    ],
    [
      { icon: AlignLeft, label: 'Căn trái', action: () => exec('justifyLeft') },
      { icon: AlignCenter, label: 'Căn giữa', action: () => exec('justifyCenter') },
      { icon: AlignRight, label: 'Căn phải', action: () => exec('justifyRight') },
    ],
    [
      { icon: Link, label: 'Chèn liên kết', action: openLinkDialog },
      { icon: Image, label: 'Chèn hình ảnh', action: () => setShowImageDialog(true) },
      { icon: Minus, label: 'Đường kẻ ngang', action: () => exec('insertHorizontalRule') },
    ],
    [
      { icon: Eraser, label: 'Xóa định dạng', action: () => exec('removeFormat') },
    ],
  ];

  const currentWords = wordCount(viewMode === 'wysiwyg' ? (editorRef.current?.innerHTML ?? '') : htmlSource);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#1e1e2e] text-white" role="dialog" aria-modal>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#13131f] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-xs font-bold text-white/90">Trình soạn thảo trang</span>
            <span className="ml-2 text-[10px] text-white/40 font-mono">/pages/{slug}</span>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {([['wysiwyg', Edit3, 'Trực quan'], ['html', Code, 'HTML'], ['preview', Eye, 'Xem trước']] as const).map(
            ([mode, Icon, label]) => (
              <button key={mode} onClick={() => switchMode(mode)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all',
                  viewMode === mode ? 'bg-blue-600 text-white shadow' : 'text-white/50 hover:text-white hover:bg-white/10')}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveMsg && <span className="text-xs text-emerald-400 font-bold animate-pulse">{saveMsg}</span>}
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-bold transition-all active:scale-95">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Đang lưu...' : 'Lưu (Ctrl+S)'}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Đóng (Esc)">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Toolbar (WYSIWYG only) ── */}
      {viewMode === 'wysiwyg' && (
        <div className="flex flex-wrap items-center gap-px px-3 py-2 bg-[#16162a] border-b border-white/10 shrink-0">
          {toolbarGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="w-px h-5 bg-white/15 mx-1.5" />}
              {group.map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action} title={label}
                  className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </React.Fragment>
          ))}

          {/* Paragraph/format select */}
          <div className="w-px h-5 bg-white/15 mx-1.5" />
          <select
            onChange={e => { if (e.target.value) { formatBlock(e.target.value); e.target.value = ''; } }}
            defaultValue=""
            className="bg-white/5 border border-white/15 rounded-md text-xs text-white/70 px-2 py-1.5 focus:outline-none hover:bg-white/10 cursor-pointer"
          >
            <option value="" disabled>Định dạng...</option>
            <option value="<p>">Đoạn văn</option>
            <option value="<h1>">Tiêu đề 1</option>
            <option value="<h2>">Tiêu đề 2</option>
            <option value="<h3>">Tiêu đề 3</option>
            <option value="<h4>">Tiêu đề 4</option>
            <option value="<pre>">Code block</option>
            <option value="<blockquote>">Trích dẫn</option>
          </select>

          {/* Font size */}
          <select
            onChange={e => { if (e.target.value) { exec('fontSize', e.target.value); e.target.value = ''; } }}
            defaultValue=""
            className="bg-white/5 border border-white/15 rounded-md text-xs text-white/70 px-2 py-1.5 focus:outline-none hover:bg-white/10 cursor-pointer ml-1"
          >
            <option value="" disabled>Cỡ chữ...</option>
            {['1','2','3','4','5','6','7'].map(s => (
              <option key={s} value={s}>{['8','10','12','14','18','24','36'][+s-1]}px</option>
            ))}
          </select>

          {/* Text color */}
          <div className="flex items-center gap-1 ml-1" title="Màu chữ">
            <input type="color" defaultValue="#000000"
              onChange={e => exec('foreColor', e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent p-0.5" />
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex justify-center bg-[#f5f5f0] min-h-0">
            <div className="w-full max-w-4xl py-6 px-6">

              {/* Page meta */}
              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Tiêu đề trang..."
                  className="w-full text-3xl font-bold text-slate-800 placeholder-slate-300 border-0 border-b-2 border-slate-200 focus:border-blue-500 outline-none bg-transparent pb-2 transition-colors"
                />
                <input
                  type="text"
                  value={seoDesc}
                  onChange={e => setSeoDesc(e.target.value)}
                  placeholder="Mô tả SEO (meta description)..."
                  className="w-full text-sm text-slate-400 placeholder-slate-300 border-0 outline-none bg-transparent"
                />
              </div>

              {/* WYSIWYG editor */}
              {viewMode === 'wysiwyg' && (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {/* realtime word count update */}}
                  className="min-h-[60vh] outline-none text-slate-800 leading-relaxed prose prose-slate max-w-none
                    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2
                    [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2
                    [&_p]:my-3 [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3
                    [&_li]:my-1
                    [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:my-4
                    [&_pre]:bg-slate-900 [&_pre]:text-emerald-400 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:my-4
                    [&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer
                    [&_hr]:border-slate-200 [&_hr]:my-6
                    [&_img]:rounded-lg [&_img]:max-w-full [&_img]:shadow-sm
                    focus:ring-0"
                  data-placeholder="Bắt đầu soạn thảo nội dung trang tại đây..."
                  style={{ '--tw-prose-body': '#1e293b' } as React.CSSProperties}
                />
              )}

              {/* HTML source */}
              {viewMode === 'html' && (
                <textarea
                  value={htmlSource}
                  onChange={e => setHtmlSource(e.target.value)}
                  className="w-full min-h-[60vh] font-mono text-sm bg-slate-900 text-emerald-400 p-5 rounded-lg outline-none border border-slate-700 focus:border-blue-500 resize-none leading-relaxed"
                  placeholder="<!-- Nhập HTML tại đây -->"
                  spellCheck={false}
                />
              )}

              {/* Preview */}
              {viewMode === 'preview' && (
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-[60vh]">
                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <h1 className="text-3xl font-bold text-slate-800">{title || 'Chưa có tiêu đề'}</h1>
                    {seoDesc && <p className="text-sm text-slate-400 mt-1">{seoDesc}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-500 font-mono">{url}</span>
                    </div>
                  </div>
                  <div
                    className="prose prose-slate max-w-none
                      [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold
                      [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500
                      [&_pre]:bg-slate-900 [&_pre]:text-emerald-400 [&_pre]:p-4 [&_pre]:rounded-lg
                      [&_a]:text-blue-600 [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: viewMode === 'preview'
                      ? (editorRef.current?.innerHTML || htmlSource)
                      : htmlSource }}
                  />
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#13131f] border-t border-white/10 text-[10px] text-white/30 shrink-0">
        <div className="flex items-center gap-4">
          <span>URL: <span className="text-white/50 font-mono">{url}</span></span>
          <span>Slug: <span className="text-white/50 font-mono">{slug}</span></span>
          <span>Firestore: <span className="text-white/50 font-mono">pages/{slug}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>{currentWords} từ</span>
          <span>Ctrl+S để lưu • Esc để đóng</span>
        </div>
      </div>

      {/* ── Link dialog ── */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-96 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Link className="w-4 h-4 text-blue-500" />Chèn liên kết</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">URL</label>
              <input autoFocus type="url" value={linkHref} onChange={e => setLinkHref(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && insertLink()}
                placeholder="https://..." className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Văn bản hiển thị</label>
              <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)}
                placeholder="Để trống = dùng văn bản đang chọn"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowLinkDialog(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
              <button onClick={insertLink} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500">Chèn</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image dialog ── */}
      {showImageDialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-sm p-6 w-96 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Image className="w-4 h-4 text-blue-500" />Chèn hình ảnh</h3>

            {/* Upload file */}
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input type="file" id="img-upload-editor" className="hidden" accept="image/*" onChange={handleImageFileUpload} />
              <label htmlFor="img-upload-editor" className="cursor-pointer flex flex-col items-center gap-1">
                <Image className="w-6 h-6 text-slate-300" />
                <span className="text-xs font-bold text-blue-500">Tải lên từ máy tính</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP</span>
              </label>
            </div>

            <div className="flex items-center gap-2 text-slate-300 text-xs"><hr className="flex-1" />hoặc<hr className="flex-1" /></div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">URL hình ảnh</label>
              <input autoFocus type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..." className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mô tả (alt text)</label>
              <input type="text" value={imageAlt} onChange={e => setImageAlt(e.target.value)}
                placeholder="Mô tả hình ảnh..."
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowImageDialog(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
              <button onClick={insertImage} disabled={!imageUrl} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-40">Chèn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
