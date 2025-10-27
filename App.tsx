
import React, { useState, useCallback, useEffect } from 'react';
import { Language, PageType, GeneratedPages, HistoryItem, GeneratedAdCreative } from './types';
import { generateLandingPages } from './services/geminiService';
import InputGroup from './components/InputGroup';
import TextAreaGroup from './components/TextAreaGroup';
import LanguageSelector from './components/LanguageSelector';
import PagePreview from './components/PagePreview';
import ImageUploader from './components/ImageUploader';
import { SparklesIcon, CodeBracketIcon, MegaphoneIcon, EyeIcon } from './components/Icons';
import HistoryPanel from './components/HistoryPanel';
import KeywordsPanel from './components/KeywordsPanel';

type TofuLinkSource = 'main' | 'vsl';
type OutputView = 'pages' | 'keywords';

const App: React.FC = () => {
  const [affiliateLink, setAffiliateLink] = useState('');
  const [vslLink, setVslLink] = useState('');
  const [tofuLinkSource, setTofuLinkSource] = useState<TofuLinkSource>('main');
  const [productInfo, setProductInfo] = useState('');
  const [language, setLanguage] = useState<Language>(Language.PORTUGUESE);
  const [productImage, setProductImage] = useState<string | null>(null); // Base64
  const [productImageUrl, setProductImageUrl] = useState(''); // URL
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPages, setGeneratedPages] = useState<GeneratedPages | null>(null);
  const [generatedAdCreative, setGeneratedAdCreative] = useState<GeneratedAdCreative | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [outputView, setOutputView] = useState<OutputView>('pages');

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('pageGenHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      localStorage.removeItem('pageGenHistory');
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!affiliateLink || !productInfo) {
      setError('O link de afiliado e as informações do produto são obrigatórios.');
      return;
    }
    if (tofuLinkSource === 'vsl' && !vslLink) {
      setError('O link de VSL é obrigatório quando essa opção é selecionada.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedPages(null);
    setGeneratedAdCreative(null);

    try {
      const base64Image = productImage ? productImage.split(',')[1] : undefined;

      const { pages, adCreative } = await generateLandingPages({
        affiliateLink,
        vslLink,
        productInfo,
        language,
        productImage: base64Image,
        productImageUrl: productImageUrl,
        tofuLinkSource,
      });
      setGeneratedPages(pages);
      setGeneratedAdCreative(adCreative);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        name: productInfo.substring(0, 40) + (productInfo.length > 40 ? '...' : ''),
        createdAt: new Date().toISOString(),
        pages: pages,
        adCreative: adCreative,
      };
      setActiveHistoryId(newHistoryItem.id);
      setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory];
        try {
          localStorage.setItem('pageGenHistory', JSON.stringify(updatedHistory));
        } catch (storageError) {
          console.error("Failed to save history to localStorage", storageError);
        }
        return updatedHistory;
      });

    } catch (e) {
      setError('Falha ao gerar as páginas. Tente novamente.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [affiliateLink, vslLink, productInfo, language, productImage, productImageUrl, tofuLinkSource]);
  
  const handleImageRemove = useCallback(() => {
    setProductImage(null);
    setProductImageUrl('');
  }, []);

  const handleTofuLinkSourceChange = (source: TofuLinkSource) => {
    setTofuLinkSource(source);
    if (source === 'main') {
      setVslLink('');
    }
  }
  
  const handleCodeChange = (pageType: PageType, newContent: string) => {
    setGeneratedPages(prevPages => {
        if (!prevPages || !prevPages[pageType]) return prevPages;
        return {
            ...prevPages,
            [pageType]: {
                ...prevPages[pageType]!,
                htmlContent: newContent
            }
        };
    });
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setGeneratedPages(item.pages);
    setGeneratedAdCreative(item.adCreative);
    setActiveHistoryId(item.id);
    setOutputView('pages'); // Default to page view on load
  };

  const handleDeleteHistory = (idToDelete: string) => {
    if (window.confirm('Tem certeza que deseja apagar este item do histórico? Esta ação não pode ser desfeita.')) {
      setHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(item => item.id !== idToDelete);
        try {
          localStorage.setItem('pageGenHistory', JSON.stringify(updatedHistory));
        } catch (error) {
          console.error("Failed to update history in localStorage", error);
        }
        return updatedHistory;
      });
    }
  };

  const handleUpdateHistory = useCallback(() => {
    if (!activeHistoryId || !generatedPages || !generatedAdCreative) return;

    setHistory(prevHistory => {
        const updatedHistory = prevHistory.map(item => 
            item.id === activeHistoryId 
            ? { ...item, pages: generatedPages, adCreative: generatedAdCreative, name: productInfo.substring(0, 40) + (productInfo.length > 40 ? '...' : '') }
            : item
        );
        try {
            localStorage.setItem('pageGenHistory', JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Failed to update history in localStorage", error);
        }
        return updatedHistory;
    });
  }, [activeHistoryId, generatedPages, generatedAdCreative, productInfo]);

  const getDomainFromUrl = (url: string) => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
        return "seu-dominio.com";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">PageGen AI</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6 space-y-6 sticky top-24">
              <h2 className="text-xl font-semibold text-white">Configurações</h2>
              <InputGroup
                label="Link de Afiliado (Principal)"
                id="affiliateLink"
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                placeholder="https://produto.com/afiliado-123"
                required
              />
               <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link para CTA do Topo de Funil (TOFU)
                </label>
                <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => handleTofuLinkSourceChange('main')}
                        className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${tofuLinkSource === 'main' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    >
                        Link Principal
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTofuLinkSourceChange('vsl')}
                        className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${tofuLinkSource === 'vsl' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    >
                        Link VSL
                    </button>
                </div>
              </div>

              {tofuLinkSource === 'vsl' && (
                <InputGroup
                  label="Link de Afiliado para VSL"
                  id="vslLink"
                  value={vslLink}
                  onChange={(e) => setVslLink(e.target.value)}
                  placeholder="https://vsl.com/afiliado-123"
                  required
                />
              )}

               <TextAreaGroup
                label="Informações do Produto"
                id="productInfo"
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                placeholder="Cole aqui os benefícios, descrição e detalhes da página do produtor..."
                required
              />
              <ImageUploader
                imagePreviewUrl={productImage || productImageUrl}
                onImageUpload={(base64) => {
                  setProductImage(base64);
                  setProductImageUrl('');
                }}
                onImageUrlChange={(url) => {
                  setProductImageUrl(url);
                  setProductImage(null);
                }}
                onImageRemove={handleImageRemove}
                imageUrl={productImageUrl}
              />
              <LanguageSelector
                selectedLanguage={language}
                onLanguageChange={setLanguage}
              />
              <HistoryPanel
                history={history}
                onLoad={handleLoadHistory}
                onDelete={handleDeleteHistory}
                activeHistoryId={activeHistoryId}
              />
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg p-8">
                <SparklesIcon className="w-16 h-16 text-cyan-400 animate-pulse" />
                <p className="mt-4 text-xl text-gray-300">Analisando e gerando páginas e criativos de anúncio...</p>
                <p className="text-gray-400">Isso pode levar alguns segundos.</p>
              </div>
            )}
            {error && (
               <div className="flex items-center justify-center h-full bg-red-900/20 border border-red-500 rounded-lg p-8">
                 <p className="text-red-400">{error}</p>
               </div>
            )}
            {!isLoading && !error && generatedPages && (
              <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
                  {/* Output Tabs */}
                  <div className="flex items-center border-b border-gray-700 p-2 md:p-3 gap-x-3">
                      <button
                          onClick={() => setOutputView('pages')}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                              outputView === 'pages' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                          <EyeIcon className="w-5 h-5" />
                          Páginas
                      </button>
                      <button
                          onClick={() => setOutputView('keywords')}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                              outputView === 'keywords' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                          }`}
                      >
                          <MegaphoneIcon className="w-5 h-5" />
                          Anúncios e Palavras-chave
                      </button>
                  </div>
                  <div className="flex-grow overflow-hidden">
                      {outputView === 'pages' ? (
                          <PagePreview
                              pages={generatedPages}
                              onCodeChange={handleCodeChange}
                              onUpdateHistory={handleUpdateHistory}
                              activeHistoryId={activeHistoryId}
                          />
                      ) : (
                          generatedAdCreative && <KeywordsPanel adCreative={generatedAdCreative} domain={getDomainFromUrl(affiliateLink)} />
                      )}
                  </div>
              </div>
            )}
             {!isLoading && !error && !generatedPages && (
              <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                <CodeBracketIcon className="w-16 h-16 text-gray-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-300">Suas páginas e criativos de anúncio aparecerão aqui</h3>
                <p className="mt-1 text-gray-400">Preencha os detalhes à esquerda e clique em "Gerar" para começar.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-gray-900/80 backdrop-blur-md p-4 border-t border-gray-700">
          <div className="container mx-auto flex justify-center items-center">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !affiliateLink || !productInfo || (tofuLinkSource === 'vsl' && !vslLink)}
                className="w-full md:w-1/2 lg:w-1/3 flex items-center justify-center gap-3 bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gerando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6" />
                    Gerar
                  </>
                )}
              </button>
          </div>
      </footer>
    </div>
  );
};

export default App;
