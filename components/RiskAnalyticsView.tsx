
import React, { useState } from 'react';
import { BarChart3, ExternalLink, Filter, Download, RefreshCw, Loader2 } from 'lucide-react';

const RiskAnalyticsView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // NOTE: This is a public Google Demo Report URL (Google Merchandise Store). 
  // In a real application, you would replace this with your specific SecureThird Risk Report URL
  // connected to your BigQuery or Firestore data source.
  const REPORT_EMBED_URL = "https://lookerstudio.google.com/embed/reporting/0B_U5RNpwhcE6QXg4SXFBVGUwMjg/page/6zXD"; 

  const handleRefresh = () => {
      setIsLoading(true);
      const frame = document.getElementById('risk-report-frame') as HTMLIFrameElement;
      if(frame) {
          frame.src = frame.src;
      }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in space-y-6">
       {/* Header Toolbar */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 gap-4 flex-shrink-0">
          <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-indigo-600"/>
                  Risk Analytics Dashboard
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                  Comprehensive visualization of third-party risk posture, assessment trends, and compliance metrics.
                  <span className="hidden md:inline"> Data sourced from BigQuery.</span>
              </p>
          </div>
          <div className="flex flex-wrap gap-2">
               <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
                   <Filter className="w-4 h-4"/> Filter
               </button>
               <button 
                 onClick={handleRefresh}
                 className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
               >
                   <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/> Refresh
               </button>
               <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
                   <Download className="w-4 h-4"/> Export PDF
               </button>
               <a 
                 href="https://lookerstudio.google.com" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
               >
                   Open in Studio <ExternalLink className="w-4 h-4"/>
               </a>
          </div>
       </div>

       {/* Embed Container */}
       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[600px] flex flex-col">
           <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report View: Executive Summary</span>
               <div className="flex gap-2">
                   <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                   <span className="w-3 h-3 rounded-full bg-slate-300"></span>
               </div>
           </div>
           
           <div className="relative flex-1 bg-slate-50 w-full h-full">
               {isLoading && (
                   <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50">
                       <div className="flex flex-col items-center gap-3 text-slate-400">
                           <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                           <span className="text-sm font-medium text-slate-500">Loading Dashboard Data...</span>
                       </div>
                   </div>
               )}
               <iframe 
                   id="risk-report-frame"
                   src={REPORT_EMBED_URL} 
                   frameBorder="0" 
                   style={{border:0, opacity: isLoading ? 0 : 1}} 
                   allowFullScreen 
                   className="absolute inset-0 w-full h-full transition-opacity duration-500"
                   title="Risk Analytics Report"
                   sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                   onLoad={() => setIsLoading(false)}
               ></iframe>
           </div>
       </div>
    </div>
  );
};

export default RiskAnalyticsView;
