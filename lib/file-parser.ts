export interface ParsedFile {
  path: string;
  content: string;
  type: string;
}

const FILE_DELIMITER_REGEX = /^===FILE:\s*(.+?)\s*===$/gm;

export function parseMultiFileResponse(response: string): ParsedFile[] {
  const files: ParsedFile[] = [];

  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let codeContent = '';
  let match;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const lang = match[1];
    const code = match[2];

    if (code.includes('===FILE:')) {
      codeContent = code;
      break;
    }

    if (lang === 'html' && (code.includes('<html') || code.includes('<body') || code.includes('<!DOCTYPE'))) {
      if (!code.includes('===FILE:')) {
        files.push({
          path: 'index.html',
          content: code.trim(),
          type: 'html',
        });
        return files;
      }
    }
  }

  if (!codeContent) {
    codeContent = response;
  }

  const parts = codeContent.split(FILE_DELIMITER_REGEX);

  if (parts.length < 3) {
    const singleHtml = extractSingleHtml(response);
    if (singleHtml) {
      return [{ path: 'index.html', content: singleHtml, type: 'html' }];
    }
    return files;
  }

  for (let i = 1; i < parts.length; i += 2) {
    const filePath = parts[i].trim();
    const content = (parts[i + 1] || '').trim();
    if (filePath && content) {
      files.push({
        path: filePath,
        content,
        type: getFileType(filePath),
      });
    }
  }

  return files;
}

function extractSingleHtml(response: string): string | null {
  const htmlBlockRegex = /```html\n([\s\S]*?)```/;
  const match = htmlBlockRegex.exec(response);
  if (match) return match[1].trim();
  return null;
}

function getFileType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, string> = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    ts: 'typescript',
    json: 'json',
    md: 'markdown',
    txt: 'text',
    svg: 'svg',
  };
  return typeMap[ext] || 'text';
}

export function assembleProjectHtml(files: ParsedFile[]): string {
  const htmlFile = files.find(f => f.path === 'index.html' || f.type === 'html');
  if (!htmlFile) return '';

  let html = htmlFile.content;

  const cssFiles = files.filter(f => f.type === 'css');
  const jsFiles = files.filter(f => f.type === 'javascript');

  for (const css of cssFiles) {
    const linkTag = `<link rel="stylesheet" href="${css.path}">`;
    const styleTag = `<style>/* ${css.path} */\n${css.content}\n</style>`;
    if (html.includes(linkTag)) {
      html = html.replace(linkTag, styleTag);
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', `${styleTag}\n</head>`);
    }
  }

  for (const js of jsFiles) {
    const scriptSrc = `<script src="${js.path}"></script>`;
    const scriptTag = `<script>/* ${js.path} */\n${js.content}\n</script>`;
    if (html.includes(scriptSrc)) {
      html = html.replace(scriptSrc, scriptTag);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    }
  }

  return html;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40)
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36).slice(-4);
}
