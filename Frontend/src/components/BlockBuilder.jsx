import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, AlignLeft, Layers, Columns, Image, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlockBuilder({ blocks, setBlocks }) {
  const addBlock = (type) => {
    const newBlock = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type };
    if (type === 'paragraph') newBlock.content = '';
    if (type === 'flipcard') { newBlock.front = ''; newBlock.back = ''; }
    if (type === 'accordion') { newBlock.title = ''; newBlock.content = ''; }
    if (type === 'tabs') { newBlock.tabs = [{ label: '', content: '' }]; }
    if (type === 'markdown') { newBlock.content = ''; }
    if (type === 'video') { newBlock.url = ''; }
    setBlocks([...(blocks || []), newBlock]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    if (index + direction < 0 || index + direction >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setBlocks(newBlocks);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {(blocks || []).map((block, index) => (
          <motion.div 
            key={block.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all"
          >
            {/* Block Controls */}
            <div className="absolute right-4 top-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-1">
              <button type="button" onClick={() => moveBlock(index, -1)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                <ChevronUp size={16} />
              </button>
              <button type="button" onClick={() => moveBlock(index, 1)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
                <ChevronDown size={16} />
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1"></div>
              <button type="button" onClick={() => removeBlock(block.id)} className="p-1 text-slate-400 hover:text-red-500 rounded">
                <Trash2 size={16} />
              </button>
            </div>

            {/* Block Icon/Label */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                {block.type === 'paragraph' && <AlignLeft size={14} />}
                {block.type === 'markdown' && <AlignLeft size={14} />}
                {block.type === 'flipcard' && <Layers size={14} />}
                {block.type === 'accordion' && <Columns size={14} />}
                {block.type === 'tabs' && <Columns size={14} />}
                {block.type === 'video' && <Image size={14} />}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {block.type} Block
              </span>
            </div>

            {/* Block Editors */}
            {block.type === 'paragraph' && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                placeholder="Type your text here..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:border-blue-500 text-slate-800 dark:text-white min-h-[100px]"
              />
            )}
            
            {block.type === 'markdown' && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                placeholder="Legacy Markdown text..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-mono focus:border-blue-500 text-slate-800 dark:text-white min-h-[150px]"
              />
            )}

            {block.type === 'video' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Video URL (YouTube)</label>
                  <input
                    value={block.url}
                    onChange={(e) => updateBlock(block.id, 'url', e.target.value)}
                    placeholder="E.g. https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {block.type === 'flipcard' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Front Side</label>
                  <input
                    value={block.front}
                    onChange={(e) => updateBlock(block.id, 'front', e.target.value)}
                    placeholder="E.g. Action Verbs"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Back Side</label>
                  <textarea
                    value={block.back}
                    onChange={(e) => updateBlock(block.id, 'back', e.target.value)}
                    placeholder="E.g. Strong verbs used to describe accomplishments..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 text-slate-800 dark:text-white min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {block.type === 'accordion' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Accordion Title</label>
                  <input
                    value={block.title}
                    onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                    placeholder="Click to expand..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Hidden Content</label>
                  <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                    placeholder="Details revealed when clicked..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 text-slate-800 dark:text-white min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {block.type === 'tabs' && (
              <div className="space-y-3">
                {block.tabs?.map((t, tIdx) => (
                  <div key={tIdx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 relative group/tab">
                    <button 
                      type="button"
                      onClick={() => {
                        const newTabs = [...block.tabs];
                        newTabs.splice(tIdx, 1);
                        updateBlock(block.id, 'tabs', newTabs);
                      }}
                      className="absolute right-2 top-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/tab:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div>
                      <input
                        value={t.label}
                        onChange={(e) => {
                          const newTabs = [...block.tabs];
                          newTabs[tIdx].label = e.target.value;
                          updateBlock(block.id, 'tabs', newTabs);
                        }}
                        placeholder="Tab Label (e.g. Overview)"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold focus:border-blue-500 text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <textarea
                        value={t.content}
                        onChange={(e) => {
                          const newTabs = [...block.tabs];
                          newTabs[tIdx].content = e.target.value;
                          updateBlock(block.id, 'tabs', newTabs);
                        }}
                        placeholder="Tab content..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:border-blue-500 text-slate-800 dark:text-white min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, 'tabs', [...(block.tabs || []), { label: '', content: '' }])}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center space-x-1"
                >
                  <Plus size={14} /> <span>Add Tab</span>
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add New Block Menu */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center">
        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">Add Content Block</h4>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => addBlock('paragraph')} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1 shadow-sm">
            <AlignLeft size={14} /> <span>Paragraph</span>
          </button>
          <button type="button" onClick={() => addBlock('video')} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1 shadow-sm">
            <Video size={14} /> <span>Video</span>
          </button>
          <button type="button" onClick={() => addBlock('flipcard')} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1 shadow-sm">
            <Layers size={14} /> <span>Flip Card</span>
          </button>
          <button type="button" onClick={() => addBlock('accordion')} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1 shadow-sm">
            <Columns size={14} /> <span>Accordion</span>
          </button>
          <button type="button" onClick={() => addBlock('tabs')} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1 shadow-sm">
            <Columns size={14} /> <span>Tabs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
