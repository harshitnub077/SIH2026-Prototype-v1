const fs = require('fs');

let code = fs.readFileSync('app/upload/page.jsx', 'utf8');

if (!code.includes('import InAppCamera')) {
  code = code.replace("import DynamicLoader from '@/components/DynamicLoader';", "import DynamicLoader from '@/components/DynamicLoader';\nimport InAppCamera from '@/components/InAppCamera';");
}

code = code.replace("const [previews, setPreviews] = useState([]);", "const [previews, setPreviews] = useState([]);\n  const [isCameraOpen, setIsCameraOpen] = useState(false);");

// The replacement logic for injecting the camera
const nativeButtons = `<div className="flex flex-col items-center gap-4 relative z-10 w-full py-8">
                     <span className="text-sm font-semibold text-slate-500 mb-4 text-center px-4">Capture product label clearly. Make sure all text is readable.</span>
                     <div className="flex gap-4 w-full justify-center px-4">
                       
                       <div className="relative overflow-hidden mello-btn-secondary !bg-surface !border-border !px-4 !py-3 flex flex-col items-center gap-2 hover:!border-primary cursor-pointer w-[140px] shadow-sm">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                         <span className="text-[12px] font-medium text-text-primary">Take Photo</span>
                         <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       </div>

                       <div className="relative overflow-hidden mello-btn-secondary !bg-surface !border-border !px-4 !py-3 flex flex-col items-center gap-2 hover:!border-primary cursor-pointer w-[140px] shadow-sm">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                         <span className="text-[12px] font-medium text-text-primary">Gallery</span>
                         <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       </div>

                     </div>
                  </div>`;

const newCamCode = `
                {isCameraOpen ? (
                  <InAppCamera 
                    onCapture={(file) => {
                       const fakeEvent = { target: { files: [file] } };
                       handleFile(fakeEvent);
                       setIsCameraOpen(false);
                    }}
                    onCancel={() => setIsCameraOpen(false)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 relative z-10 w-full py-8">
                     <span className="text-sm font-semibold text-slate-500 mb-4 text-center px-4">Capture product label clearly. Make sure all text is readable.</span>
                     <div className="flex gap-4 w-full justify-center px-4">
                       
                       <button type="button" onClick={() => setIsCameraOpen(true)} className="relative overflow-hidden mello-btn-secondary !bg-surface !border-border !px-4 !py-3 flex flex-col items-center gap-2 hover:!border-primary cursor-pointer w-[140px] shadow-sm">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                         <span className="text-[12px] font-medium text-text-primary">Live Scanner</span>
                       </button>

                       <div className="relative overflow-hidden mello-btn-secondary !bg-surface !border-border !px-4 !py-3 flex flex-col items-center gap-2 hover:!border-primary cursor-pointer w-[140px] shadow-sm">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                         <span className="text-[12px] font-medium text-text-primary">Gallery</span>
                         <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       </div>

                     </div>
                  </div>
                )}`;

code = code.replace(nativeButtons, newCamCode);

// Also fix the preview thumbnails (+ Camera button should trigger Live Scanner instead of native picker)
const oldMiniCam = `<div className="relative h-1/2 rounded-lg border border-border bg-background flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mb-1"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            <span className="text-[10px] font-medium text-text-secondary">+ Camera</span>
                            <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          </div>`;

const newMiniCam = `<button type="button" onClick={() => setIsCameraOpen(true)} className="relative h-1/2 rounded-lg border border-border bg-background flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors w-full">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mb-1"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            <span className="text-[10px] font-medium text-text-secondary">+ Scan</span>
                          </button>`;

code = code.replace(oldMiniCam, newMiniCam);

// Fix the container spacing/padding when camera is open
code = code.replace('className="relative w-full flex-1 min-h-[200px] border-none sm:border-2 sm:border-dashed sm:border-slate-300 sm:hover:border-primary bg-transparent sm:bg-slate-50 flex flex-col items-center justify-center rounded-2xl transition-colors"',
'className={`relative w-full flex-1 min-h-[200px] border-none sm:border-2 sm:border-dashed sm:border-slate-300 sm:hover:border-primary flex flex-col items-center justify-center rounded-2xl transition-colors ${isCameraOpen ? "bg-black border-none" : "bg-transparent sm:bg-slate-50"}`}');

fs.writeFileSync('app/upload/page.jsx', code);
console.log("UPLOAD PAGE CAMERA UPGRADED");
