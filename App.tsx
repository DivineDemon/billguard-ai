import React, { useState, useRef, useEffect } from 'react';
import { BillAnalysisService } from './services/ai';
import { BillRecord, BillStatus, AnalysisResult, DisputeGuide } from './types';

// Icons as components for cleaner usage
const Icons = {
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Loader: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  )
};

const App: React.FC = () => {
  const [history, setHistory] = useState<BillRecord[]>([]);
  const [activeBill, setActiveBill] = useState<BillRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingDispute, setIsGeneratingDispute] = useState(false);
  const [disputeData, setDisputeData] = useState<DisputeGuide | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load fake history on mount if empty
  useEffect(() => {
    // In a real app, load from LocalStorage or API
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setDisputeData(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      try {
        // Call AI Service
        const analysis = await BillAnalysisService.analyzeBill(base64);
        
        const newBill: BillRecord = {
          ...analysis,
          id: Date.now().toString(),
          status: analysis.issues.length > 0 ? BillStatus.ACTION_REQUIRED : BillStatus.CLEAN,
          uploadDate: new Date().toLocaleDateString(),
          rawImage: base64
        };

        setHistory(prev => [newBill, ...prev]);
        setActiveBill(newBill);
      } catch (err) {
        setError("Failed to analyze the bill. Please ensure the image is clear and try again.");
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateDispute = async () => {
    if (!activeBill) return;
    setIsGeneratingDispute(true);
    try {
      const guide = await BillAnalysisService.generateDisputeGuide(activeBill);
      setDisputeData(guide);
    } catch (err) {
      setError("Failed to generate dispute guide.");
    } finally {
      setIsGeneratingDispute(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const resetView = () => {
    setActiveBill(null);
    setDisputeData(null);
    setError(null);
  };

  // --- Views ---

  // 1. Upload View
  const UploadView = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
        <Icons.Upload />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Medical Bill</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Take a photo or upload a scan. Our AI will analyze it for errors, upcoding, and duplicate charges instantly.
      </p>
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isAnalyzing}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
      >
        {isAnalyzing ? <Icons.Loader /> : <Icons.Upload />}
        {isAnalyzing ? "Analyzing Bill..." : "Select Bill Image"}
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
      <p className="mt-4 text-xs text-gray-400">Supported formats: JPG, PNG</p>
    </div>
  );

  // 2. Results View
  const ResultsView = ({ bill }: { bill: BillRecord }) => {
    const totalPotentialSavings = bill.issues.reduce((acc, issue) => acc + (issue.estimatedOvercharge || 0), 0);

    return (
      <div className="animate-fade-in">
        <button onClick={resetView} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4 text-sm font-medium">
          <Icons.ChevronLeft /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Analysis Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{bill.hospitalName}</h1>
                  <p className="text-gray-500 text-sm">Date of Service: {bill.dateOfService}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bill.status === BillStatus.ACTION_REQUIRED 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {bill.status}
                </span>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <p className="text-gray-700 text-sm italic">"{bill.summary}"</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.AlertTriangle /> Identified Issues ({bill.issues.length})
                </h3>
                
                {bill.issues.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-green-50 rounded-lg border border-green-100">
                    <Icons.CheckCircle />
                    <p className="mt-2">No obvious billing errors found.</p>
                  </div>
                ) : (
                  bill.issues.map((issue, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition-colors">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-900">{issue.title}</span>
                        <span className="text-red-600 font-bold">
                           ~${issue.estimatedOvercharge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{issue.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          issue.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{issue.severity} Severity</span>
                      </div>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Dispute Generator Section */}
            {bill.issues.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Take Action</h3>
                  {isGeneratingDispute && <span className="text-sm text-blue-600 animate-pulse">Generating strategy...</span>}
                </div>
                
                {!disputeData ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">Ready to fight these charges? Our AI can draft a professional dispute letter for you.</p>
                    <button 
                      onClick={handleGenerateDispute}
                      disabled={isGeneratingDispute}
                      className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto"
                    >
                      {isGeneratingDispute ? "Drafting Letter..." : "Generate Dispute Letter"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                        {disputeData.steps.map((step, i) => <li key={i}>{step}</li>)}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-900">Draft Letter</h4>
                        <button 
                          onClick={() => copyToClipboard(disputeData.letter)}
                          className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline"
                        >
                          <Icons.Copy /> Copy Text
                        </button>
                      </div>
                      <textarea 
                        readOnly 
                        className="w-full h-64 p-4 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={disputeData.letter}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar / Bill Preview */}
          <div className="md:col-span-1 space-y-6">
             <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl text-white shadow-lg">
                <p className="text-indigo-100 text-sm uppercase tracking-wider font-semibold mb-1">Total Savings Found</p>
                <p className="text-4xl font-bold">${totalPotentialSavings}</p>
                <p className="text-indigo-100 text-xs mt-2 opacity-80">across {bill.issues.length} flagged items</p>
             </div>

             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Original Document</h4>
                <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 h-64 flex items-center justify-center relative group">
                  <img src={bill.rawImage} alt="Bill" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all cursor-pointer" />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={resetView}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Icons.Shield />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">BillGuard AI</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-gray-900">History</a>
              <a href="#" className="hover:text-gray-900">Resources</a>
              <a href="#" className="hover:text-gray-900">Profile</a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Icons.AlertTriangle />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-sm underline">Dismiss</button>
          </div>
        )}

        {activeBill ? (
          <ResultsView bill={activeBill} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Column: Upload */}
             <div className="lg:col-span-2 h-96">
                <UploadView />
             </div>

             {/* Right Column: Recent Activity (Mock) */}
             <div className="space-y-4">
               <h3 className="font-semibold text-gray-700 mb-2">Recent Analysis</h3>
               {history.length === 0 ? (
                 <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-400 text-sm">
                   No recent bills. Upload one to get started.
                 </div>
               ) : (
                 <div className="space-y-3">
                   {history.map(item => (
                     <div key={item.id} onClick={() => setActiveBill(item)} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.hospitalName}</p>
                          <p className="text-gray-400 text-xs">{item.dateOfService}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">${item.totalAmount}</p>
                          <span className={`text-xs ${item.status === BillStatus.CLEAN ? 'text-green-600' : 'text-red-500'}`}>{item.status}</span>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
               
               <div className="bg-blue-900 rounded-xl p-6 text-white mt-8">
                 <h4 className="font-bold text-lg mb-2">Did you know?</h4>
                 <p className="text-blue-100 text-sm opacity-90">
                   Up to 80% of medical bills contain errors. The most common is "unbundling" - separating tests that should be billed together.
                 </p>
               </div>
             </div>
          </div>
        )}
      </main>
      
      {/* Disclaimer Footer */}
      <footer className="mt-12 py-6 text-center text-gray-400 text-xs border-t border-gray-200">
        <p>BillGuard AI provides information for educational purposes only and does not constitute legal or medical advice.</p>
        <p>&copy; 2024 BillGuard AI. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
