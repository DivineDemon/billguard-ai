import React, { useState, useRef, useEffect } from 'react';
import { BillAnalysisService } from './services/ai';
import { StorageService } from './services/storage';
import { BillRecord, BillStatus, DisputeGuide, UserInsuranceInput } from './types';

// Icons
const Icons = {
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  AlertTriangle: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  CheckCircle: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Loader: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Copy: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  Briefcase: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  MapPin: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  ZoomIn: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
};

type ViewState = 'dashboard' | 'history' | 'resources' | 'profile' | 'analysis_result' | 'upload_config';

const PAKISTAN_INSURERS = [
  "State Life Insurance",
  "Jubilee Life Insurance",
  "EFU Life Assurance",
  "Adamjee Insurance",
  "Sehat Sahulat Program",
  "TPL Insurance",
  "Askari Insurance",
  "UIC Insurance",
  "Allianz EFU"
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [history, setHistory] = useState<BillRecord[]>([]);
  const [activeBill, setActiveBill] = useState<BillRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingDispute, setIsGeneratingDispute] = useState(false);
  const [disputeData, setDisputeData] = useState<DisputeGuide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  // Upload Flow State
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [insuranceInput, setInsuranceInput] = useState<UserInsuranceInput>({
    hasInsurance: false,
    provider: PAKISTAN_INSURERS[0],
    planName: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedBills = StorageService.getBills();
    setHistory(savedBills);
  }, []);

  // Step 1: Handle File Selection
  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPendingFile(base64);
      setCurrentView('upload_config');
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Handle Configuration & Analysis
  const startAnalysis = async () => {
    if (!pendingFile) return;

    setIsAnalyzing(true);
    setError(null);
    setDisputeData(null);
    setCurrentView('dashboard'); // Show loading state on dashboard or overlay

    try {
      const analysis = await BillAnalysisService.analyzeBill(pendingFile, insuranceInput);
      
      const newBill: BillRecord = {
        ...analysis,
        id: Date.now().toString(),
        status: analysis.issues.length > 0 ? BillStatus.ACTION_REQUIRED : BillStatus.CLEAN,
        uploadDate: new Date().toLocaleDateString(),
        rawImage: pendingFile,
        userInsurance: insuranceInput
      };

      StorageService.saveBill(newBill);
      setHistory(prev => [newBill, ...prev]);
      setActiveBill(newBill);
      setCurrentView('analysis_result');
    } catch (err) {
      setError("Failed to analyze the bill. Please ensure the image is clear and try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
      setPendingFile(null);
    }
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

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    setError(null);
    if (view !== 'analysis_result') {
      setActiveBill(null);
      setDisputeData(null);
    }
  };

  const viewBill = (bill: BillRecord) => {
    setActiveBill(bill);
    setDisputeData(null);
    setCurrentView('analysis_result');
  };

  const formatCurrency = (amount: number | null | undefined, currency: string = 'PKR') => {
    const val = amount || 0;
    return `${currency || 'PKR'} ${val.toLocaleString()}`;
  };

  // --- Views ---

  const UploadConfigView = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Insurance Details</h2>
        <p className="text-gray-500 mb-6">Providing your insurance details helps our AI identify illegal "Balance Billing" and coverage errors.</p>
        
        <div className="space-y-4 mb-8">
           <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
             <input 
               type="checkbox" 
               checked={insuranceInput.hasInsurance} 
               onChange={(e) => setInsuranceInput({...insuranceInput, hasInsurance: e.target.checked})}
               className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
             />
             <span className="text-gray-900 font-medium">I have Health Insurance</span>
           </label>

           {insuranceInput.hasInsurance && (
             <div className="space-y-4 pl-4 border-l-2 border-blue-100 animate-fade-in">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Company</label>
                 <select 
                   value={insuranceInput.provider}
                   onChange={(e) => setInsuranceInput({...insuranceInput, provider: e.target.value})}
                   className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                 >
                   {PAKISTAN_INSURERS.map(p => <option key={p} value={p}>{p}</option>)}
                   <option value="Other">Other</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name / Policy Type</label>
                 <input 
                   type="text" 
                   placeholder="e.g. Gold Plan, Corporate"
                   value={insuranceInput.planName}
                   onChange={(e) => setInsuranceInput({...insuranceInput, planName: e.target.value})}
                   className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                 />
               </div>
             </div>
           )}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => { setPendingFile(null); setCurrentView('dashboard'); }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={startAnalysis}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Analyze Bill
          </button>
        </div>
      </div>
    </div>
  );

  const ResultsView = ({ bill }: { bill: BillRecord }) => {
    const totalPotentialSavings = bill.issues.reduce((acc, issue) => acc + (issue.estimatedOvercharge || 0), 0);
    // Safe calculation for patient pays
    const patientPays = bill.insurance.patientResponsibility !== null && bill.insurance.patientResponsibility !== undefined
        ? bill.insurance.patientResponsibility 
        : bill.totalAmount;

    return (
      <div className="animate-fade-in pb-12">
        <button onClick={() => navigateTo('dashboard')} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4 text-sm font-medium">
          <Icons.ChevronLeft /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{bill.hospitalName}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>{bill.dateOfService}</span>
                    <span className="flex items-center gap-1"><Icons.MapPin /> {bill.locale}</span>
                  </div>
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

              {/* Verification Logic Box */}
              <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-2">
                   <Icons.Search /> AI Verification Process
                </h4>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  {bill.verificationMethodology && bill.verificationMethodology.length > 0 ? (
                    bill.verificationMethodology.map((step, i) => <li key={i}>{step}</li>)
                  ) : (
                    <li>Verified against standard medical billing formats and coding rules.</li>
                  )}
                </ul>
              </div>

              {/* Issues List */}
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
                           ~{formatCurrency(issue.estimatedOvercharge, bill.currency)}
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
            
            {/* Dispute Generator */}
            {bill.issues.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Take Action</h3>
                  {isGeneratingDispute && <span className="text-sm text-blue-600 animate-pulse">Generating strategy...</span>}
                </div>
                
                {!disputeData ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 mb-4">
                      Ready to dispute? Our AI can draft a letter to {bill.insurance.status !== 'Not Found' ? 'your insurance and hospital' : 'the hospital'}.
                    </p>
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
                        className="w-full h-96 p-4 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={disputeData.letter}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-1 space-y-6">
             <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl text-white shadow-lg">
                <p className="text-indigo-100 text-sm uppercase tracking-wider font-semibold mb-1">Total Savings Found</p>
                <p className="text-4xl font-bold">{formatCurrency(totalPotentialSavings, bill.currency)}</p>
                <p className="text-indigo-100 text-xs mt-2 opacity-80">across {bill.issues.length} flagged items</p>
             </div>
             
             {/* Bill Summary - Right Sidebar */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Bill Summary</h4>
                <div className="flex justify-between text-sm py-2 border-b">
                   <span className="text-gray-500">Total Billed</span>
                   <span className="font-medium">{formatCurrency(bill.totalAmount, bill.currency)}</span>
                </div>
                {bill.insurance.coveredAmount !== null && bill.insurance.coveredAmount > 0 && (
                  <div className="flex justify-between text-sm py-2 border-b text-green-600">
                     <span>Insurance Covers</span>
                     <span className="font-medium">-{formatCurrency(bill.insurance.coveredAmount, bill.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-2 pt-3">
                   <span className="text-gray-900 font-bold">Patient Pays</span>
                   <span className="font-bold text-gray-900">{formatCurrency(patientPays, bill.currency)}</span>
                </div>
             </div>

             {/* Original Document Preview with Zoom */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm">Original Document</h4>
                  <button onClick={() => setZoomImage(bill.rawImage)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                    <Icons.ZoomIn /> Full Screen
                  </button>
                </div>
                <div 
                  className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 h-64 flex items-center justify-center relative group cursor-zoom-in"
                  onClick={() => setZoomImage(bill.rawImage)}
                >
                  <img src={bill.rawImage} alt="Bill" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Click to zoom</div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const UploadView = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
        <Icons.Upload />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Hospital Bill</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Upload a scan of your bill. Our AI works with hospital bills from <strong>Pakistan</strong> and international providers, handling insurance and self-pay cases.
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
        onChange={onFileSelect} 
        accept="image/*" 
        className="hidden" 
      />
      <p className="mt-4 text-xs text-gray-400">Supported formats: JPG, PNG</p>
    </div>
  );

  const ResourcesView = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100">
           <h3 className="font-bold text-lg text-gray-900 mb-2">Pakistan Healthcare Rights</h3>
           <p className="text-gray-600 text-sm mb-4">Learn about your rights under the PMDC and Consumer Protection Acts.</p>
           <ul className="list-disc list-inside text-sm text-blue-600 space-y-2">
             <li><a href="https://www.google.com/search?q=Sehat+Sahulat+Program+Pakistan+Coverage+Details" target="_blank" rel="noreferrer" className="hover:underline">Sehat Sahulat Program Details</a></li>
             <li><a href="https://www.google.com/search?q=Consumer+Court+Pakistan+Procedure+Medical+Billing" target="_blank" rel="noreferrer" className="hover:underline">Consumer Court Procedure</a></li>
             <li><a href="https://www.google.com/search?q=Medical+Negligence+Laws+Pakistan" target="_blank" rel="noreferrer" className="hover:underline">Medical Negligence Laws</a></li>
           </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100">
           <h3 className="font-bold text-lg text-gray-900 mb-2">Common Billing Codes (CPT)</h3>
           <p className="text-gray-600 text-sm mb-4">Understanding common procedure codes can help you spot upcoding.</p>
           <ul className="list-disc list-inside text-sm text-blue-600 space-y-2">
             <li><a href="https://www.google.com/search?q=Common+CPT+Codes+Lookup" target="_blank" rel="noreferrer" className="hover:underline">Search CPT Codes</a></li>
             <li><a href="https://www.google.com/search?q=Standard+Medical+Procedure+Rates+Pakistan+2024" target="_blank" rel="noreferrer" className="hover:underline">Standard Rates 2024</a></li>
           </ul>
        </div>
      </div>
    </div>
  );

  const HistoryView = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis History</h2>
      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No history found. Upload your first bill!</p>
          <button onClick={() => navigateTo('dashboard')} className="mt-4 text-blue-600 hover:underline">Go to Dashboard</button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(item => (
            <div key={item.id} onClick={() => viewBill(item)} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row justify-between md:items-center gap-4">
               <div>
                 <h3 className="font-bold text-gray-900 text-lg">{item.hospitalName}</h3>
                 <p className="text-gray-500 text-sm">{item.dateOfService} • {item.issues.length} Issues Found</p>
               </div>
               <div className="text-left md:text-right">
                 <p className="font-bold text-gray-900 text-lg">{formatCurrency(item.totalAmount, item.currency)}</p>
                 <span className={`text-xs px-2 py-1 rounded-full ${item.status === BillStatus.CLEAN ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {item.status}
                 </span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans">
      {/* Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <Icons.X />
          </button>
          <img src={zoomImage} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Icons.Shield />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">BillGuard AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
              <button onClick={() => navigateTo('dashboard')} className={`${currentView === 'dashboard' ? 'text-blue-600' : 'hover:text-gray-900'}`}>Dashboard</button>
              <button onClick={() => navigateTo('history')} className={`${currentView === 'history' ? 'text-blue-600' : 'hover:text-gray-900'}`}>History</button>
              <button onClick={() => navigateTo('resources')} className={`${currentView === 'resources' ? 'text-blue-600' : 'hover:text-gray-900'}`}>Resources</button>
              <button onClick={() => navigateTo('profile')} className={`${currentView === 'profile' ? 'text-blue-600' : 'hover:text-gray-900'}`}>Profile</button>
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

        {currentView === 'upload_config' && <UploadConfigView />}

        {currentView === 'dashboard' && !isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96">
              <UploadView />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Recent Analysis</h3>
                <button onClick={() => navigateTo('history')} className="text-xs text-blue-600 hover:underline">View All</button>
              </div>
              {history.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-400 text-sm">
                  No bills in database.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 3).map(item => (
                    <div key={item.id} onClick={() => viewBill(item)} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group">
                       <div>
                         <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{item.hospitalName}</p>
                         <p className="text-gray-400 text-xs">{item.dateOfService}</p>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-gray-900 text-sm">{formatCurrency(item.totalAmount, item.currency)}</p>
                         <span className={`text-xs ${item.status === BillStatus.CLEAN ? 'text-green-600' : 'text-red-500'}`}>{item.status}</span>
                       </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-blue-900 rounded-xl p-6 text-white mt-8">
                <h4 className="font-bold text-lg mb-2">Pakistan Insurance</h4>
                <p className="text-blue-100 text-sm opacity-90">
                   Check if your provider (State Life, Jubilee, etc.) covers "Balance Billing". It is often illegal for in-network hospitals to charge you the difference.
                </p>
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
             <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
             <h2 className="text-xl font-bold text-gray-900">Analyzing Your Bill...</h2>
             <p className="text-gray-500 mt-2 max-w-md text-center">
               Our AI is verifying charges against {insuranceInput.hasInsurance ? insuranceInput.provider : 'standard'} rates and checking for coding errors.
             </p>
          </div>
        )}

        {currentView === 'analysis_result' && activeBill && (
          <ResultsView bill={activeBill} />
        )}

        {currentView === 'history' && <HistoryView />}
        {currentView === 'resources' && <ResourcesView />}
        
        {currentView === 'profile' && (
           <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-gray-500">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Guest User</h2>
              <p className="text-gray-500 mb-6">Data is stored locally on this device.</p>
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to clear your history?")) {
                    StorageService.clearDB();
                    setHistory([]);
                    navigateTo('dashboard');
                  }
                }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
              >
                Clear History & Data
              </button>
           </div>
        )}

      </main>
      
      <footer className="mt-12 py-6 text-center text-gray-400 text-xs border-t border-gray-200">
        <p>BillGuard AI • Pakistan Edition</p>
        <p className="mt-1">Disclaimer: Information provided is for educational purposes only. Consult with a legal professional or your insurance provider.</p>
      </footer>
    </div>
  );
};

export default App;
