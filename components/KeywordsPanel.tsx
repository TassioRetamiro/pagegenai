import React, { useState } from 'react';
import { GeneratedAdCreative, FunnelStageCreative, Sitelink, PageType } from '../types';
import { ClipboardIcon, CheckIcon } from './Icons';

interface AdCreativePanelProps {
  adCreative: GeneratedAdCreative;
  domain: string;
}

const CopyButton: React.FC<{ textToCopy: string; title: string; }> = ({ textToCopy, title }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
          onClick={handleCopy}
          title={title}
          className="p-1.5 rounded-md hover:bg-gray-600 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          disabled={!textToCopy}
        >
          {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
        </button>
    );
};

const AssetList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-semibold text-gray-300">{title} ({items.length})</h4>
            <CopyButton textToCopy={items.join('\n')} title={`Copiar ${items.length} ${title.toLowerCase()}`} />
        </div>
        <div className="bg-gray-900/50 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
            {items.length > 0 ? items.map((item, index) => (
                <p key={index} className="bg-gray-700 text-gray-200 text-sm px-2 py-1 rounded-md">{item}</p>
            )) : <p className="text-sm text-gray-500 italic text-center p-4">Nenhum item gerado.</p>}
        </div>
    </div>
);

const SitelinkList: React.FC<{ sitelinks: Sitelink[] }> = ({ sitelinks }) => (
    <div>
        <h4 className="text-md font-semibold text-gray-300 mb-2">Sitelinks ({sitelinks.length})</h4>
        <div className="bg-gray-900/50 rounded-md p-3 max-h-48 overflow-y-auto space-y-3">
            {sitelinks.length > 0 ? sitelinks.map((sitelink, index) => (
                <div key={index} className="text-sm">
                    <p className="font-semibold text-cyan-400">{sitelink.title}</p>
                    <p className="text-gray-400 pl-2">{sitelink.description1}</p>
                    <p className="text-gray-400 pl-2">{sitelink.description2}</p>
                </div>
            )) : <p className="text-sm text-gray-500 italic text-center p-4">Nenhum sitelink gerado.</p>}
        </div>
    </div>
);

const AdPreview: React.FC<{ assets: FunnelStageCreative; domain: string }> = ({ assets, domain }) => {
    const { headlines, descriptions, sitelinks } = assets.adAssets;
    const previewHeadlines = headlines.slice(0, 3).join(' | ');
    const previewDescription = descriptions.slice(0, 2).join(' ');

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Preview do Anúncio</h3>
            <div className="bg-[#1f2328] p-4 rounded-md font-sans">
                <div className="flex items-center">
                    <span className="font-bold text-sm bg-gray-600 text-white px-1.5 py-0.5 rounded-sm">Anúncio</span>
                    <span className="text-gray-400 text-sm mx-2">·</span>
                    <span className="text-gray-400 text-sm">{domain}</span>
                </div>
                <h2 className="text-xl text-[#8ab4f8] hover:underline cursor-pointer mt-1">
                    {previewHeadlines || "Seu Título Principal Aparece Aqui"}
                </h2>
                <p className="text-sm text-[#bdc1c6] mt-1">
                    {previewDescription || "Sua descrição de anúncio aparecerá aqui, fornecendo mais detalhes sobre seu produto ou serviço para atrair clientes."}
                </p>
                {sitelinks && sitelinks.length > 0 && (
                     <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {sitelinks.slice(0,4).map((link, i) => (
                            <div key={i}>
                                <a href="#" className="text-base text-[#8ab4f8] hover:underline">{link.title}</a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Keywords: React.FC<{ data: FunnelStageCreative['keywords'] }> = ({ data }) => (
    <div className="mt-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Palavras-chave</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AssetList title="Correspondência Ampla" items={data.broad} />
            <AssetList title="Correspondência de Frase" items={data.phrase} />
            <AssetList title="Correspondência Exata" items={data.exact} />
        </div>
    </div>
);

// Helper function to get the correct data key from the PageType enum
const getFunnelStageKey = (stage: PageType): 'tofu' | 'mofu' | 'bofu' => {
  if (stage === PageType.TOFU) return 'tofu';
  if (stage === PageType.MOFU) return 'mofu';
  if (stage === PageType.BOFU) return 'bofu';
  // Fallback, though it should not be reached with proper types
  return 'tofu';
};

const AdCreativePanel: React.FC<AdCreativePanelProps> = ({ adCreative, domain }) => {
    const funnelStages = [PageType.TOFU, PageType.MOFU, PageType.BOFU];
    const [activeFunnelTab, setActiveFunnelTab] = useState<PageType>(PageType.TOFU);

    // Use the reliable helper function to get the data key
    const dataKey = getFunnelStageKey(activeFunnelTab);
    const activeData = adCreative.googleAds[dataKey];

    if (!activeData) {
        return (
            <div className="p-6 text-center text-red-400">
                <p>Dados de criativos não encontrados.</p>
                <p className="text-sm text-gray-400 mt-2">Não foi possível carregar os dados para a etapa '{activeFunnelTab}'.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-gray-700 px-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {funnelStages.map(stage => (
                        <button
                            key={stage}
                            onClick={() => setActiveFunnelTab(stage)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeFunnelTab === stage
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            }`}
                        >
                            {stage}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-gray-900/50">
                <AdPreview assets={activeData} domain={domain} />
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AssetList title="Títulos" items={activeData.adAssets.headlines} />
                        <AssetList title="Descrições" items={activeData.adAssets.descriptions} />
                        <AssetList title="Frases de Destaque" items={activeData.adAssets.callouts} />
                        <SitelinkList sitelinks={activeData.adAssets.sitelinks} />
                    </div>
                    <Keywords data={activeData.keywords} />
                </div>
            </div>
        </div>
    );
};

export default AdCreativePanel;
