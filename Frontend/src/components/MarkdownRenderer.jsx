import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

import FlipCard from './FlipCard';
import Accordion from './Accordion';
import Tabs from './Tabs';

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`markdown-content select-text leading-relaxed text-slate-800 dark:text-slate-200 text-xs sm:text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          flipcard: ({node, ...props}) => <FlipCard frontContent={props.front} backContent={props.back} />,
          accordion: ({node, ...props}) => <Accordion title={props.title}>{props.children}</Accordion>,
          tabs: ({node, ...props}) => {
            try {
              if (props.data) {
                const parsedTabs = JSON.parse(props.data);
                return <Tabs tabs={parsedTabs} />;
              }
              
              if (props.labels) {
                const labels = props.labels.split(',');
                
                const extractText = (child) => {
                  if (typeof child === 'string') return child;
                  if (Array.isArray(child)) return child.map(extractText).join('');
                  if (child && child.props && child.props.children) return extractText(child.props.children);
                  return '';
                };
                
                const contentStr = extractText(props.children);
                const contents = contentStr.split('|').map(s => s.trim()).filter(s => s !== '');
                
                const parsedTabs = labels.map((label, idx) => ({
                  title: label.trim(),
                  content: contents[idx] || ''
                }));
                
                return <Tabs tabs={parsedTabs} />;
              }
              return null;
            } catch(e) {
              console.error(e);
              return <div className="text-red-500 text-xs">Error rendering tabs</div>;
            }
          },
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-4 text-slate-900 dark:text-white" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-3 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-600 dark:text-yellow-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-600 dark:border-yellow-500 pl-4 py-1 mb-4 italic bg-slate-50 dark:bg-slate-900/50 rounded-r-lg text-slate-600 dark:text-slate-400" {...props} />,
          table: ({node, ...props}) => (
            <div className="overflow-x-auto mb-4 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left" {...props} />
            </div>
          ),
          th: ({node, ...props}) => <th className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60" {...props} />,
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const [copied, setCopied] = useState(false);

            const handleCopy = () => {
              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            };

            if (!inline && match) {
              return (
                <div className="relative group my-4 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md shadow-sm transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: '1.25rem', fontSize: '0.8rem' }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400 font-mono text-[0.85em]" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
