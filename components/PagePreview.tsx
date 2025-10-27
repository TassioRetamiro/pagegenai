
import React, { useState, useCallback, useEffect } from 'react';
import { PageType, GeneratedPages } from '../types';
import { 
  ArrowDownTrayIcon, ClipboardIcon, CheckIcon, CodeBracketIcon, EyeIcon,
  ComputerDesktopIcon, DeviceTabletIcon, DevicePhoneMobileIcon, CursorArrowRaysIcon, ArchiveBoxIcon,
  MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon
} from './Icons';

// Declare external libraries for TypeScript
declare const prettier: any;
declare const prettierPlugins: any;

interface PagePreviewProps {
  pages: GeneratedPages;
  onCodeChange: (pageType: PageType, newContent: string) => void;
  onUpdateHistory: () => void;
  activeHistoryId: string | null;
}

const ctaHighlightStyle = `
  <style>
    @keyframes pulse-cta {
      0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(6, 182, 212, 0); }
      100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
    }
    a[href]:not([href="#"]), button, input[type='submit'], [role='button'] {
      outline: 2px solid #06b6d4 !important;
      box-shadow: 0 0 8px #06b6d4;
      animation: pulse-cta 2s infinite;
      transition: all 0.3s ease-in-out;
    }
  </style>
`;

const responsiveWidths: { [key: string]: string } = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

type ResponsiveMode = 'desktop' | 'tablet' | 'mobile';

const PagePreview: React.FC<PagePreviewProps> = ({ pages, onCodeChange, onUpdateHistory, activeHistoryId }) => {
  const pageTypes = Object.values(PageType);
  const [activeTab, setActiveTab] = useState<PageType>(pageTypes[0]);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveMode>('desktop');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highlightCtas, setHighlightCtas] = useState(false);
  const [editableCode, setEditableCode] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);
  
  const activePage = pages[activeTab];

  useEffect(() => {
    const formatAndSetCode = async () => {
      if (viewMode === 'code' && activePage?.htmlContent) {
        try {
          if (typeof prettier !== 'undefined' && typeof prettierPlugins !== 'undefined') {
            const formatted = await prettier.format(activePage.htmlContent, {
              parser: 'html',
              plugins: [prettierPlugins.html],
              printWidth: 100,
            });
            setEditableCode(formatted);
          } else {
            setEditableCode(activePage.htmlContent);
          }
        } catch (e) {
          console.error("Error formatting HTML:", e);
          setEditableCode(activePage.htmlContent);
        }
      }
    };
    formatAndSetCode();
  }, [viewMode, activePage]);
  
  // Reset activeTab to the first available page when pages prop changes
  useEffect(() => {
    const availablePages = pageTypes.filter(type => pages[type]);
    if(availablePages.length > 0) {
      setActiveTab(availablePages[0]);
    }
  }, [pages]);


  const handleDownload = useCallback(() => {
    if (!activePage) return;
    const blob = new Blob([activePage.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePage.type.replace(/\s/g, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activePage]);

  const handleCopy = useCallback(() => {
    if (!activePage) return;
    const contentToCopy = viewMode === 'code' ? editableCode : activePage.htmlContent;
    navigator.clipboard.writeText(contentToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  }, [activePage, viewMode, editableCode]);

  const handleZoom = (newZoom: number) => {
    setZoomLevel(Math.max(0.25, Math.min(newZoom, 2)));
  };

  const handleCodeEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setEditableCode(newCode);
    onCodeChange(activeTab, newCode);
  };
  
  const handleUpdate = () => {
    onUpdateHistory();
    setJustUpdated(true);
    setTimeout(() => {
        setJustUpdated(false);
    }, 2500);
  }

  if (!activePage) return null;
  
  const finalHtmlContent = highlightCtas ? ctaHighlightStyle + activePage.htmlContent : activePage.htmlContent;

  return (
    <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between border-b border-gray-700 p-2 md:p-3 gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex space-x-1 border border-gray-700 rounded-md p-1">
                    {pageTypes.map((type) => pages[type] && (
                    <button
                        key={type}
                        onClick={() => setActiveTab(type)}
                        className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-colors ${
                        activeTab === type ? 'bg-cyan-600/80 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {type.split('(')[0].trim()}
                    </button>
                    ))}
                </div>
                {activeHistoryId && (
                    <button 
                        onClick={handleUpdate}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-all ${justUpdated ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                        title="Salvar alterações no histórico"
                        >
                        <ArchiveBoxIcon className="w-4 h-4" />
                        {justUpdated ? 'Salvo!' : 'Salvar Alterações'}
                    </button>
                )}

                <div className="flex space-x-1 border border-gray-700 rounded-md p-1">
                    <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-colors ${viewMode === 'preview' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        <EyeIcon className="w-4 h-4" />
                        Preview
                    </button>
                    <button onClick={() => setViewMode('code')} className={`flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-colors ${viewMode === 'code' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        <CodeBracketIcon className="w-4 h-4" />
                        Código
                    </button>
                </div>
                {viewMode === 'preview' && (
                    <>
                    <div className="flex space-x-1 border border-gray-700 rounded-md p-1">
                        <button onClick={() => setResponsiveMode('desktop')} className={`p-2 rounded-md transition-colors ${responsiveMode === 'desktop' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`} title="Desktop View"><ComputerDesktopIcon className="w-4 h-4" /></button>
                        <button onClick={() => setResponsiveMode('tablet')} className={`p-2 rounded-md transition-colors ${responsiveMode === 'tablet' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`} title="Tablet View"><DeviceTabletIcon className="w-4 h-4" /></button>
                        <button onClick={() => setResponsiveMode('mobile')} className={`p-2 rounded-md transition-colors ${responsiveMode === 'mobile' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`} title="Mobile View"><DevicePhoneMobileIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center space-x-1 border border-gray-700 rounded-md p-1">
                        <button onClick={() => setHighlightCtas(!highlightCtas)} className={`p-2 rounded-md transition-colors ${highlightCtas ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`} title="Highlight CTAs"><CursorArrowRaysIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleZoom(zoomLevel - 0.25)} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors" title="Zoom Out"><MagnifyingGlassMinusIcon className="w-4 h-4" /></button>
                        <span className="text-xs font-mono text-gray-400 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => handleZoom(zoomLevel + 0.25)} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 transition-colors" title="Zoom In"><MagnifyingGlassPlusIcon className="w-4 h-4" /></button>
                    </div>
                    </>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <button onClick={handleCopy} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Copiar Código">
                {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5 text-gray-300" />}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-md hover:bg-gray-600 transition-colors text-xs md:text-sm" title="Baixar HTML">
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span className="hidden md:inline">Baixar HTML</span>
                </button>
            </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-grow overflow-auto bg-gray-900/50 rounded-b-lg">
            {viewMode === 'preview' ? (
            <div className="p-4 md:p-8 w-full min-h-full flex justify-center items-start">
                <div 
                    className="transform origin-top transition-transform duration-300 ease-in-out" 
                    style={{ 
                        transform: `scale(${zoomLevel})`,
                        width: responsiveWidths[responsiveMode],
                        transition: 'width 0.3s ease-in-out',
                    }}
                >
                <iframe
                    srcDoc={finalHtmlContent}
                    title={`${activePage.type} Preview`}
                    className="bg-white shadow-2xl border-4 border-gray-700"
                    style={{
                        width: '100%',
                        height: 'calc(100vh - 280px)',
                    }}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                />
                </div>
            </div>
            ) : (
                <textarea
                value={editableCode}
                onChange={handleCodeEdit}
                className="w-full h-full p-4 bg-[#282c34] text-gray-300 font-mono text-sm border-0 resize-none focus:ring-0"
                spellCheck="false"
                />
            )}
        </div>
    </div>
  );
};

export default PagePreview;
