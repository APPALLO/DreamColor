import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  Download, 
  RefreshCcw, 
  BookOpen, 
  Loader2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { GeneratedImage, GenerationStatus } from './types';
import { generatePagePrompts, generateColoringPage } from './services/geminiService';
import { createColoringBookPDF } from './utils/pdfGenerator';
import { ChatWidget } from './components/ChatWidget';
import { generateCoverPresets, CoverPreset } from './utils/coverUtils';

function App() {
  // --- State ---
  const [theme, setTheme] = useState('');
  const [childName, setChildName] = useState('');
  
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [progress, setProgress] = useState(0);

  // Cover Art State
  const [presets, setPresets] = useState<CoverPreset[]>([]);
  const [selectedCover, setSelectedCover] = useState<string | null>(null); // URL or base64
  const [coverMode, setCoverMode] = useState<'preset' | 'upload'>('preset');

  // --- Effects ---
  useEffect(() => {
    // Load presets on mount
    const p = generateCoverPresets();
    setPresets(p);
  }, []);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!theme || !childName) return;

    setStatus('planning');
    setStatusMessage('Brainstorming page ideas...');
    setGeneratedImages([]);
    setProgress(0);

    try {
      // 1. Generate Prompts
      const prompts = await generatePagePrompts(theme);
      
      setStatus('generating');
      setStatusMessage('Drawing pages...');
      
      const images: GeneratedImage[] = [];
      const total = prompts.length;

      // 2. Generate Images sequentially to show progress
      for (let i = 0; i < total; i++) {
        const prompt = prompts[i];
        setStatusMessage(`Drawing page ${i + 1} of ${total}: "${prompt}"`);
        
        try {
          const base64 = await generateColoringPage(prompt);
          images.push({
            id: `img-${Date.now()}-${i}`,
            url: base64,
            prompt: prompt
          });
          // Update partial results
          setGeneratedImages([...images]);
          setProgress(((i + 1) / total) * 100);
        } catch (err) {
          console.error(`Failed to generate page ${i + 1}`, err);
          // Continue even if one fails
        }
      }

      setStatus('complete');
      setStatusMessage('All done! Ready to print.');

    } catch (error) {
      console.error(error);
      setStatus('error');
      setStatusMessage('Something went wrong. Please try again.');
    }
  };

  const handleDownload = () => {
    if (generatedImages.length === 0) return;
    createColoringBookPDF(childName, theme, generatedImages, selectedCover);
  };

  const handleReset = () => {
    setStatus('idle');
    setGeneratedImages([]);
    setProgress(0);
    setStatusMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedCover(reader.result as string);
        setCoverMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-600 to-indigo-500 z-0" />
      
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12 text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">DreamColor</h1>
          </div>
          <p className="text-indigo-100 text-lg max-w-xl mx-auto font-medium">
            Turn any idea into a magical coloring book for your child in seconds.
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
          
          {/* Input Section */}
          <div className={`p-8 md:p-12 transition-all duration-500 ${status !== 'idle' ? 'border-b border-slate-100 bg-slate-50/50' : ''}`}>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    Child's Name
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Leo"
                    disabled={status !== 'idle' && status !== 'complete'}
                    className="w-full text-lg px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    Theme or Adventure
                  </label>
                  <textarea
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g. Space dinosaurs having a tea party on Mars"
                    rows={3}
                    disabled={status !== 'idle' && status !== 'complete'}
                    className="w-full text-lg px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none"
                  />
                </div>

                {/* Cover Art Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">
                    Cover Art
                  </label>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex gap-2 mb-4 bg-white p-1 rounded-xl border border-slate-200 w-fit">
                        <button 
                          onClick={() => setCoverMode('preset')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${coverMode === 'preset' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          Presets
                        </button>
                         <button 
                          onClick={() => setCoverMode('upload')}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${coverMode === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          Upload
                        </button>
                    </div>

                    {coverMode === 'preset' ? (
                       <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {presets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setSelectedCover(preset.url)}
                            className={`flex-shrink-0 relative w-20 h-28 rounded-lg overflow-hidden border-2 transition-all ${selectedCover === preset.url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent hover:border-indigo-300'}`}
                          >
                             <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                             <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] py-1 text-center font-medium">
                               {preset.name}
                             </div>
                          </button>
                        ))}
                         <button
                            onClick={() => setSelectedCover(null)}
                            className={`flex-shrink-0 w-20 h-28 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors ${selectedCover === null ? 'bg-slate-100' : 'bg-white'}`}
                          >
                             <span className="text-xs font-medium">None</span>
                          </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-indigo-300 transition-all flex items-center gap-2">
                           <Upload className="w-4 h-4" />
                           Choose Image
                           <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                        {selectedCover && coverMode === 'upload' && (
                           <div className="w-12 h-16 rounded-md overflow-hidden border border-slate-200">
                             <img src={selectedCover} alt="Preview" className="w-full h-full object-cover" />
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center h-full space-y-4">
                {status === 'idle' || status === 'complete' ? (
                  <button
                    onClick={status === 'complete' ? handleReset : handleGenerate}
                    disabled={!theme || !childName}
                    className={`w-full py-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                      status === 'complete'
                        ? 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                    }`}
                  >
                    {status === 'complete' ? (
                       <>
                        <RefreshCcw className="w-6 h-6" />
                        Create Another
                       </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Generate Coloring Book
                      </>
                    )}
                  </button>
                ) : (
                   <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-lg text-center space-y-4">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="36" className="stroke-slate-100" strokeWidth="8" fill="none" />
                          <circle 
                            cx="40" cy="40" r="36" 
                            className="stroke-indigo-600 transition-all duration-500 ease-out" 
                            strokeWidth="8" 
                            fill="none" 
                            strokeDasharray="226.19"
                            strokeDashoffset={226.19 - (progress / 100) * 226.19}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600">
                           {Math.round(progress)}%
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg animate-pulse">
                          {status === 'planning' ? 'Planning...' : 'Drawing...'}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">{statusMessage}</p>
                      </div>
                   </div>
                )}

                 {/* Tips */}
                 {(status === 'idle') && (
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Inspiration Ideas
                    </h4>
                    <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
                      <li>Underwater castle with mermaid cats</li>
                      <li>Superheroes saving a vegetable city</li>
                      <li>Friendly monsters baking cookies</li>
                    </ul>
                  </div>
                 )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          {generatedImages.length > 0 && (
            <div className="p-8 md:p-12 bg-slate-50">
              <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Coloring Pages</h2>
                  <p className="text-slate-500">Preview the pages before downloading the PDF.</p>
                </div>
                {status === 'complete' && (
                  <button 
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-200 hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {generatedImages.map((img, idx) => (
                  <div key={img.id} className="group relative aspect-[3/4] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur text-xs p-2 border-t border-slate-100 truncate text-slate-600">
                      Page {idx + 1}
                    </div>
                  </div>
                ))}
                
                {/* Placeholders for pending images */}
                {status === 'generating' && Array.from({ length: 5 - generatedImages.length }).map((_, idx) => (
                   <div key={`placeholder-${idx}`} className="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                     <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Chat */}
      <ChatWidget />
    </div>
  );
}

export default App;
