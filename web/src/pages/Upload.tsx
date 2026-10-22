import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClaim } from '../context/ClaimContext';

type MediaFile = {
id: string;
file: File;
preview: string;
status: 'pending' | 'passed' | 'failed' | 'fraud';
message?: string;
};

export default function UploadPage() {
const navigate = useNavigate();
const { claim, uploadAndAssess, busy, error, clearError } = useClaim();

const [media, setMedia] = useState<MediaFile[]>([]);
const [dragOver, setDragOver] = useState(false);
const inputRef = useRef<HTMLInputElement>(null);

const canAddMore = media.length < 6;

const processFiles = useCallback((files: FileList | File[]) => {
const newMedia: MediaFile[] = [];
const remaining = 6 - media.length;
const list = Array.from(files).slice(0, remaining);

for (const file of list) {
if (file.type.startsWith('video/') && newMedia.some((m) => m.file.type.startsWith('video/'))) continue;
newMedia.push({
id: crypto.randomUUID(),
file,
preview: URL.createObjectURL(file),
status: 'pending',
});
}
setMedia((prev) => [...prev, ...newMedia]);
}, [media.length]);

const handleDrop = useCallback((e: React.DragEvent) => {
e.preventDefault();
setDragOver(false);
if (!canAddMore) return;
const files = e.dataTransfer.files;
const imageOrVideo = Array.from(files).filter(
(f) => f.type.startsWith('image/') || f.type.startsWith('video/')
);
if (imageOrVideo.length) processFiles(imageOrVideo);
}, [canAddMore, processFiles]);

const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
if (e.target.files?.length) processFiles(e.target.files);
}, [processFiles]);

const removeMedia = useCallback((id: string) => {
setMedia((prev) => prev.filter((m) => m.id !== id));
}, []);

const analyze = useCallback(async () => {
if (!claim) return;
clearError();
try {
const files = media.map((m) => m.file);
await uploadAndAssess(files);
navigate(`/claims/${claim.id}/result`);
} catch (err) {
console.error("Failed to analyze:", err);
}
}, [media, claim, uploadAndAssess, navigate, clearError]);

const hasVideo = media.some((m) => m.file.type.startsWith('video/'));
const canAnalyze = media.length > 0 && !busy;

return (
<div className="max-w-2xl mx-auto p-6 space-y-6">
<h1 className="text-2xl font-bold">Upload Photos / Video</h1>

{canAddMore && (
<div
onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
onDragLeave={() => setDragOver(false)}
onDrop={handleDrop}
onClick={() => inputRef.current?.click()}
className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
}`}
>
<p className="text-gray-600">
{hasVideo
? 'Only images can be added when a video is present'
: 'Drop up to 6 photos or 1 short video here, or click to browse'}
</p>
<input
ref={inputRef}
type="file"
accept={hasVideo ? 'image/*' : 'image/*,video/*'}
multiple={!hasVideo}
hidden
onChange={handleInput}
/>
</div>
)}

{error && (
<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-medium">
{error}
</div>
)}

{media.length > 0 && (
<div className="grid grid-cols-3 gap-3">
{media.map((m) => (
<div key={m.id} className="relative group border rounded overflow-hidden">
{m.file.type.startsWith('video/') ? (
<video src={m.preview} className="w-full h-28 object-cover" />
) : (
<img src={m.preview} alt="" className="w-full h-28 object-cover" />
)}
<button
onClick={() => removeMedia(m.id)}
className="absolute top-1 right-1 bg-black/60 text-white text-xs w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
>
✕
</button>
</div>
))}
</div>
)}

{canAnalyze && (
<button
onClick={analyze}
className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
>
Analyze damage
</button>
)}

{busy && (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
<div className="bg-white rounded-xl p-8 text-center space-y-4 shadow-xl">
<div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
<p className="text-lg font-medium">
Uploading to AI Assessor...
</p>
</div>
</div>
)}
</div>
);
}