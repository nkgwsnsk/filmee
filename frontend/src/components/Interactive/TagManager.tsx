import React, { useState } from 'react';
import { Tag as TagIcon, X, Edit2, Check, Plus } from 'lucide-react';

export const TagManager = () => {
  const [tags, setTags] = useState([{ id: '1', name: '伏線回収' }]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    setTags([...tags, { id: Date.now().toString(), name: inputValue.trim() }]);
    setInputValue('');
  };

  const handleUpdate = (id: string) => {
    setTags(tags.map(t => t.id === id ? { ...t, name: editValue } : t));
    setEditingId(null);
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-4 shadow-sm">
      <div className="flex gap-2">
        <label htmlFor="tag-input" className="sr-only">タグを追加</label>
        <input
          id="tag-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="タグを追加..."
          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="button" aria-label="タグを追加" onClick={handleAdd} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg">
            {editingId === tag.id ? (
              <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleUpdate(tag.id)} className="w-20 bg-transparent outline-none border-b border-blue-400" autoFocus />
            ) : (
              <span className="text-sm text-blue-700">#{tag.name}</span>
            )}
            <button type="button" aria-label={`タグ「${tag.name}」を編集`} onClick={() => { setEditingId(tag.id); setEditValue(tag.name); }} className="text-blue-300 hover:text-blue-500"><Edit2 size={12}/></button>
            <button type="button" aria-label={`タグ「${tag.name}」を削除`} onClick={() => setTags(tags.filter(t => t.id !== tag.id))} className="text-blue-300 hover:text-red-500"><X size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};