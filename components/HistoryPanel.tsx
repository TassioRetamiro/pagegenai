
import React from 'react';
import { HistoryItem } from '../types';
import { ClockIcon, TrashIcon } from './Icons';

interface HistoryPanelProps {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  activeHistoryId: string | null;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onDelete, activeHistoryId }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <ClockIcon className="w-6 h-6 text-gray-400" />
        Histórico
      </h2>
      {history.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>Nenhuma página foi gerada ainda.</p>
          <p className="text-sm">Seu histórico aparecerá aqui.</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {history.map(item => (
            <li key={item.id} className="group flex items-center justify-between gap-2">
              <button
                onClick={() => onLoad(item)}
                className={`flex-grow text-left p-3 rounded-md transition-colors w-full ${
                    item.id === activeHistoryId ? 'bg-cyan-800/50 ring-1 ring-cyan-500' : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
              >
                <p className="font-medium text-gray-200 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-2 rounded-md text-gray-500 hover:bg-red-900/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Apagar item"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPanel;
