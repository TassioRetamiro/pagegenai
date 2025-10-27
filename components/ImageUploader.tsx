import React, { useRef, useCallback, useState } from 'react';
import { PhotoIcon, XCircleIcon, LinkIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (base64Image: string) => void;
  onImageRemove: () => void;
  onImageUrlChange: (url: string) => void;
  imagePreviewUrl: string | null;
  imageUrl: string;
}

type Tab = 'upload' | 'url';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  onImageRemove, 
  onImageUrlChange,
  imagePreviewUrl, 
  imageUrl 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        alert("O arquivo é muito grande. Por favor, selecione uma imagem com menos de 4MB.");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        onImageUpload(base64);
      } catch (error) {
        console.error("Erro ao converter arquivo para base64", error);
        alert("Não foi possível processar o arquivo de imagem.");
      }
    }
  }, [onImageUpload]);

  const handleRemoveImage = useCallback(() => {
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  }, [onImageRemove]);

  const TabButton: React.FC<{tab: Tab; label: string}> = ({ tab, label }) => (
      <button
          type="button"
          onClick={() => setActiveTab(tab)}
          className={`w-1/2 py-2 text-sm font-medium transition-colors ${
              activeTab === tab 
              ? 'text-cyan-400 border-b-2 border-cyan-400' 
              : 'text-gray-400 hover:text-white border-b-2 border-transparent'
          }`}
      >
          {label}
      </button>
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Imagem do Produto (Opcional)
      </label>
      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 p-0 relative bg-gray-700/50">
        {imagePreviewUrl ? (
          <div className="p-6">
            <img src={imagePreviewUrl} alt="Preview" className="max-h-40 rounded-lg object-contain" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Remove image"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex border-b border-gray-600">
                <TabButton tab="upload" label="Carregar Arquivo" />
                <TabButton tab="url" label="Usar URL" />
            </div>
            <div className="p-6">
                {activeTab === 'upload' && (
                    <div className="text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-400">
                        <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-gray-800 font-semibold text-cyan-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-cyan-300 px-1"
                        >
                            <span>Carregar um arquivo</span>
                            <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/png, image/jpeg, image/webp"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500">PNG, JPG, WEBP até 4MB</p>
                    </div>
                )}
                {activeTab === 'url' && (
                    <div className="space-y-2">
                        <label htmlFor="image-url" className="sr-only">Image URL</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <LinkIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                id="image-url"
                                placeholder="https://exemplo.com/imagem.jpg"
                                value={imageUrl}
                                onChange={(e) => onImageUrlChange(e.target.value)}
                                className="block w-full bg-gray-800 border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm p-3 pl-10"
                            />
                        </div>
                         <p className="text-xs text-center text-gray-500">Cole a URL de uma imagem da web.</p>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;