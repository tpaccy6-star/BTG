import React from 'react';

/**
 * Custom light-weight markdown parser component for React.
 * Designed to safely render headings, bold, italic, bold-italic, underline,
 * lists, tables, code blocks, inline code, quotes, and links.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  // Simple parser that handles lines and structural blocks
  const parseMarkdown = (text) => {
    // Escape HTML tags to prevent XSS
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Handle code blocks: ```lang\ncode\n```
    const codeBlockRegex = /```([\s\S]*?)```/g;
    escaped = escaped.replace(codeBlockRegex, (match, code) => {
      // Clean up leading/trailing line breaks
      const cleanCode = code.trim();
      return `<pre class="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl font-mono text-[11px] overflow-x-auto my-3 border border-slate-200/50 dark:border-slate-800 text-slate-800 dark:text-slate-200"><code>${cleanCode}</code></pre>`;
    });

    // Split text by lines to parse block-level structures
    const lines = escaped.split('\n');
    const parsedBlocks = [];
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let listItems = [];
    let inTable = false;
    let tableRows = [];

    const flushList = () => {
      if (listItems.length > 0) {
        const tag = listType;
        const listHtml = `<${tag} class="${tag === 'ul' ? 'list-disc pl-5' : 'list-decimal pl-5'} space-y-1.5 my-3 text-xs text-slate-700 dark:text-slate-350">${listItems.join('')}</${tag}>`;
        parsedBlocks.push(listHtml);
        listItems = [];
        inList = false;
        listType = null;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        // Find if we have headers
        const hasHeaderDivider = tableRows.length > 1 && tableRows[1].every(cell => cell.trim().startsWith('-'));
        let tableHtml = '<div class="overflow-x-auto my-4 border border-slate-200 dark:border-slate-800 rounded-xl"><table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">';
        
        tableRows.forEach((row, rowIndex) => {
          if (rowIndex === 1 && hasHeaderDivider) return; // skip header divider row

          const isHeader = rowIndex === 0 && hasHeaderDivider;
          const cellTag = isHeader ? 'th' : 'td';
          const rowClass = isHeader 
            ? 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider' 
            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300';

          tableHtml += `<tr class="${rowClass}">`;
          row.forEach(cell => {
            tableHtml += `<${cellTag} class="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 font-medium">${cell.trim()}</${cellTag}>`;
          });
          tableHtml += '</tr>';
        });

        tableHtml += '</table></div>';
        parsedBlocks.push(tableHtml);
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if it's already a code block placeholder
      if (trimmedLine.startsWith('<pre') && trimmedLine.endsWith('</pre>')) {
        flushList();
        flushTable();
        parsedBlocks.push(line);
        continue;
      }

      // Handle Tables: lines starting and ending with |
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        flushList();
        inTable = true;
        // Parse row cells
        const cells = line.split('|').slice(1, -1);
        tableRows.push(cells);
        continue;
      } else {
        flushTable();
      }

      // Handle Headings: #, ##, ###
      if (trimmedLine.startsWith('### ')) {
        flushList();
        parsedBlocks.push(`<h3 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white mt-4 mb-2">${trimmedLine.substring(4)}</h3>`);
        continue;
      }
      if (trimmedLine.startsWith('## ')) {
        flushList();
        parsedBlocks.push(`<h2 class="text-sm font-black text-slate-900 dark:text-white mt-5 mb-2.5 border-b border-slate-150 dark:border-slate-800 pb-1.5">${trimmedLine.substring(3)}</h2>`);
        continue;
      }
      if (trimmedLine.startsWith('# ')) {
        flushList();
        parsedBlocks.push(`<h1 class="text-base font-black text-slate-900 dark:text-white mt-6 mb-3">${trimmedLine.substring(2)}</h1>`);
        continue;
      }

      // Handle Blockquotes: > quote
      if (trimmedLine.startsWith('&gt; ')) {
        flushList();
        parsedBlocks.push(`<blockquote class="border-l-4 border-blue-900 dark:border-yellow-450 pl-4 py-2 my-3 bg-slate-50 dark:bg-slate-955/40 text-slate-600 dark:text-slate-400 italic text-xs rounded-r-xl">${trimmedLine.substring(5)}</blockquote>`);
        continue;
      }

      // Handle Bullet Lists: - item or * item
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(`<li class="leading-relaxed">${trimmedLine.substring(2)}</li>`);
        continue;
      }

      // Handle Numbered Lists: 1. item
      const numListMatch = trimmedLine.match(/^\d+\.\s(.*)/);
      if (numListMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(`<li class="leading-relaxed">${numListMatch[1]}</li>`);
        continue;
      }

      // Regular paragraph or empty line
      flushList();
      if (trimmedLine === '') {
        parsedBlocks.push('<div class="h-2"></div>');
      } else {
        parsedBlocks.push(`<p class="leading-relaxed my-2 text-xs text-slate-600 dark:text-slate-350 font-medium">${line}</p>`);
      }
    }

    // Flush remaining
    flushList();
    flushTable();

    // Recombine and process inline styles
    let parsedHtml = parsedBlocks.join('\n');

    // Inline bold-italic: ***bold-italic***
    parsedHtml = parsedHtml.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>');

    // Inline bold: **bold**
    parsedHtml = parsedHtml.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // Inline italic: *italic*
    parsedHtml = parsedHtml.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Inline underline: __underline__
    parsedHtml = parsedHtml.replace(/__([^_]+)__/g, '<u>$1</u>');

    // Inline code: `code`
    parsedHtml = parsedHtml.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 font-mono text-[10px] rounded border border-slate-200/50 dark:border-slate-800 text-red-655 dark:text-red-400">$1</code>');

    // Links: [text](url)
    parsedHtml = parsedHtml.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-900 dark:text-yellow-450 hover:underline font-bold inline-flex items-center">$1</a>');

    // Images: ![alt](url)
    parsedHtml = parsedHtml.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-2xl max-w-full my-3 border border-slate-200 dark:border-slate-800 shadow-sm" />');

    return parsedHtml;
  };

  const cleanHtml = parseMarkdown(content);

  return (
    <div 
      className={`markdown-content select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
