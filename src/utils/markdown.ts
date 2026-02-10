// Simple markdown renderer - converts markdown text to HTML
// Supports: headers, bold, italic, strikethrough, bullet lists, numbered lists, links, inline code

export function renderMarkdown(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const html: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) { html.push('</ul>'); inUl = false; }
    if (inOl) { html.push('</ol>'); inOl = false; }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      closeLists();
      html.push(`<h4>${inlineFormat(trimmed.slice(4))}</h4>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      closeLists();
      html.push(`<h3>${inlineFormat(trimmed.slice(3))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      closeLists();
      html.push(`<h2>${inlineFormat(trimmed.slice(2))}</h2>`);
      continue;
    }

    // Checkboxes
    if (/^- \[[ x]\] /.test(trimmed)) {
      closeLists();
      const checked = trimmed.startsWith('- [x] ');
      const label = trimmed.replace(/^- \[[ x]\] /, '');
      html.push(`<div class="md-checkbox"><span class="md-check ${checked ? 'checked' : ''}">${checked ? '☑' : '☐'}</span> ${inlineFormat(label)}</div>`);
      continue;
    }

    // Bullet lists
    if (/^[-*] /.test(trimmed)) {
      if (inOl) { html.push('</ol>'); inOl = false; }
      if (!inUl) { html.push('<ul>'); inUl = true; }
      html.push(`<li>${inlineFormat(trimmed.slice(2))}</li>`);
      continue;
    }

    // Numbered lists
    if (/^\d+\. /.test(trimmed)) {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (!inOl) { html.push('<ol>'); inOl = true; }
      html.push(`<li>${inlineFormat(trimmed.replace(/^\d+\. /, ''))}</li>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      closeLists();
      html.push('<hr/>');
      continue;
    }

    // Empty line
    if (!trimmed) {
      closeLists();
      html.push('<br/>');
      continue;
    }

    // Regular paragraph
    closeLists();
    html.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  closeLists();
  return html.join('');
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);

  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold + Italic
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Auto-link bare URLs (but not already in href)
  result = result.replace(
    /(?<!")(?<!=)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Check if text has any markdown formatting
export function hasMarkdown(text: string): boolean {
  return /^#{1,3} |^\d+\. |^[-*] |\*\*|~~|`[^`]+`|\[.+\]\(.+\)/.test(text);
}
