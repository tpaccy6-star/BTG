import React from 'react';
import FlipCard from './FlipCard';
import Accordion from './Accordion';
import Tabs from './Tabs';
import MarkdownRenderer from './MarkdownRenderer';

export default function BlockRenderer({ blocksData }) {
  let blocks = [];
  try {
    if (typeof blocksData === 'string') {
      const parsed = JSON.parse(blocksData);
      if (Array.isArray(parsed)) {
        blocks = parsed;
      } else {
        // Fallback for non-array JSON
        blocks = [{ id: 'fallback', type: 'markdown', content: blocksData }];
      }
    } else if (Array.isArray(blocksData)) {
      blocks = blocksData;
    }
  } catch (e) {
    // If it's not JSON, it must be the old raw Markdown string
    blocks = [{ id: 'legacy', type: 'markdown', content: blocksData }];
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        if (block.type === 'paragraph') {
          return <p key={block.id || idx} className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-sm whitespace-pre-wrap">{block.content}</p>;
        }
        if (block.type === 'markdown') {
          return <MarkdownRenderer key={block.id || idx} content={block.content} className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-sm space-y-4" />;
        }
        if (block.type === 'flipcard') {
          return <FlipCard key={block.id || idx} frontContent={block.front} backContent={block.back} />;
        }
        if (block.type === 'accordion') {
          return (
            <Accordion key={block.id || idx} title={block.title}>
              <div className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{block.content}</div>
            </Accordion>
          );
        }
        if (block.type === 'tabs') {
          const tabLabels = block.tabs?.map(t => t.label).join(',') || '';
          const tabContents = block.tabs?.map(t => t.content) || [];
          return (
            <Tabs key={block.id || idx} labels={tabLabels}>
              {tabContents.map((content, tIdx) => (
                <div key={tIdx} className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 p-2">{content}</div>
              ))}
            </Tabs>
          );
        }
        return null;
      })}
    </div>
  );
}
