import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InteractiveWidgetModal({ isOpen, onClose, widgetType, onInsert }) {
  // FlipCard state
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  // Accordion state
  const [accordionTitle, setAccordionTitle] = useState('');
  const [accordionContent, setAccordionContent] = useState('');

  // Tabs state
  const [tabs, setTabs] = useState([{ label: '', content: '' }]);

  useEffect(() => {
    if (isOpen) {
      setFrontText('');
      setBackText('');
      setAccordionTitle('');
      setAccordionContent('');
      setTabs([{ label: '', content: '' }]);
    }
  }, [isOpen, widgetType]);

  if (!isOpen) return null;

  const handleInsert = () => {
    let markdown = '';
    
    if (widgetType === 'FlipCard') {
      if (!frontText || !backText) return;
      markdown = `<flipcard front="${frontText.replace(/"/g, '&quot;')}" back="${backText.replace(/"/g, '&quot;')}" />`;
    } else if (widgetType === 'Accordion') {
      if (!accordionTitle || !accordionContent) return;
      markdown = `<accordion title="${accordionTitle.replace(/"/g, '&quot;')}">\n${accordionContent}\n</accordion>`;
    } else if (widgetType === 'Tabs') {
      const validTabs = tabs.filter(t => t.label && t.content);
      if (validTabs.length === 0) return;
      
      const labelsString = validTabs.map(t => t.label).join(',');
      const contentsString = validTabs.map(t => t.content).join('|');
      
      markdown = `<tabs labels="${labelsString.replace(/"/g, '&quot;')}">|${contentsString}</tabs>`;
    }

    onInsert(markdown);
    onClose();
  };

  const updateTab = (index, field, value) => {
    const updated = [...tabs];
    updated[index][field] = value;
    setTabs(updated);
  };

  const addTab = () => setTabs([...tabs, { label: '', content: '' }]);
  const removeTab = (index) => setTabs(tabs.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6 rounded-[2rem]"
      >
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            Build Interactive {widgetType}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-105 dark:hover:bg-slate-805 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* FLIPCARD UI */}
          {widgetType === 'FlipCard' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Front Text</label>
                <input 
                  type="text" 
                  value={frontText} 
                  onChange={(e) => setFrontText(e.target.value)}
                  placeholder="e.g. Term or Concept"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:border-blue-500 text-slate-800 dark:text-white transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Back Text</label>
                <textarea 
                  value={backText} 
                  onChange={(e) => setBackText(e.target.value)}
                  placeholder="e.g. Definition or Answer"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 text-slate-800 dark:text-white transition-colors min-h-[80px]"
                />
              </div>
            </>
          )}

          {/* ACCORDION UI */}
          {widgetType === 'Accordion' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Accordion Title</label>
                <input 
                  type="text" 
                  value={accordionTitle} 
                  onChange={(e) => setAccordionTitle(e.target.value)}
                  placeholder="e.g. Click here to read more..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:border-blue-500 text-slate-800 dark:text-white transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Hidden Content</label>
                <textarea 
                  value={accordionContent} 
                  onChange={(e) => setAccordionContent(e.target.value)}
                  placeholder="Content that appears when expanded..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-blue-500 text-slate-800 dark:text-white transition-colors min-h-[120px]"
                />
              </div>
            </>
          )}

          {/* TABS UI */}
          {widgetType === 'Tabs' && (
            <>
              {tabs.map((tab, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 relative group">
                  <button 
                    type="button"
                    onClick={() => removeTab(idx)}
                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Tab Label</label>
                    <input 
                      type="text" 
                      value={tab.label} 
                      onChange={(e) => updateTab(idx, 'label', e.target.value)}
                      placeholder="e.g. Overview"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:border-blue-500 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Tab Content</label>
                    <textarea 
                      value={tab.content} 
                      onChange={(e) => updateTab(idx, 'content', e.target.value)}
                      placeholder="Content for this tab..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:border-blue-500 text-slate-800 dark:text-white min-h-[60px]"
                    />
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={addTab}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-slate-200 dark:border-slate-700 border-dashed flex items-center justify-center"
              >
                <Plus size={14} className="mr-1.5" /> Add Another Tab
              </button>
            </>
          )}

        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleInsert}
            className="w-full flex items-center justify-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white font-black py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 text-xs uppercase tracking-wider"
          >
            Insert into Notes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
