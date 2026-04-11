import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, CanvasContent, CanvasContentType } from '../store';
import { Monitor, X } from 'lucide-react';

// ── Main Canvas ────────────────────────────────────
export const Canvas: React.FC = () => {
  const { canvasContent, setCanvasContent } = useStore();

  return (
    <div
      className="h-full w-full rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <AnimatePresence mode="wait">
        {canvasContent ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full flex flex-col"
          >
            {/* Title bar */}
            {canvasContent.title && (
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
              >
                <h2
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--accent)' }}
                >
                  {canvasContent.title}
                </h2>
                <button
                  onClick={() => setCanvasContent(null)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Content area */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6"
              style={{
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}
            >
              <CanvasRenderer content={canvasContent} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center gap-3"
            style={{ color: 'var(--text-muted)' }}
          >
            <Monitor size={48} strokeWidth={1} />
            <p className="text-center">
              Canvas vacio.
              <br />
              <span className="text-sm opacity-70">
                El agente puede presentar contenido aqui.
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Content Renderers ──────────────────────────────
const CanvasRenderer: React.FC<{ content: CanvasContent }> = ({ content }) => {
  switch (content.type) {
    case 'markdown':
      return <MarkdownRenderer content={content.content} />;
    case 'code':
      return (
        <CodeRenderer
          content={content.content}
          language={content.language || 'text'}
        />
      );
    case 'image':
      return <ImageRenderer content={content.content} />;
    case 'html':
      return <HtmlRenderer content={content.content} />;
    case 'table':
      return <TableRenderer content={content.content} />;
    case 'json':
      return <JsonRenderer content={content.content} />;
    case 'pdf':
      return <PdfRenderer content={content.content} />;
    default:
      return <MarkdownRenderer content={content.content} />;
  }
};

// ── Markdown ───────────────────────────────────────
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <div className="prose max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isBlock = String(children).includes('\n');

          if (match && isBlock) {
            return (
              <SyntaxHighlighter
                style={oneDark as any}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: '1em 0',
                  borderRadius: '8px',
                  fontSize: '0.85em',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          }
          return <code className={className} {...props}>{children}</code>;
        },
        img({ src, alt }) {
          return (
            <img
              src={src}
              alt={alt || ''}
              className="max-w-full h-auto rounded-lg"
              loading="lazy"
            />
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-4">
              <table>{children}</table>
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

// ── Code ───────────────────────────────────────────
const CodeRenderer: React.FC<{ content: string; language: string }> = ({
  content,
  language,
}) => (
  <div className="h-full overflow-auto rounded-lg">
    <SyntaxHighlighter
      style={oneDark as any}
      language={language}
      showLineNumbers
      wrapLongLines
      customStyle={{
        margin: 0,
        borderRadius: '8px',
        fontSize: '0.85em',
        minHeight: '100%',
      }}
    >
      {content}
    </SyntaxHighlighter>
  </div>
);

// ── Image ──────────────────────────────────────────
const ImageRenderer: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex items-center justify-center h-full">
    <img
      src={content}
      alt="Canvas content"
      className="max-w-full max-h-full object-contain rounded-lg"
      loading="eager"
      onError={(e) => {
        (e.target as HTMLImageElement).src =
          'data:image/svg+xml,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" font-size="14" fill="#666">Error loading image</text></svg>'
          );
      }}
    />
  </div>
);

// ── HTML (sandboxed iframe) ────────────────────────
const HtmlRenderer: React.FC<{ content: string }> = ({ content }) => {
  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f1117; color: #e4e5ea; font-family: system-ui; padding: 1rem; }
  </style>
</head>
<body>${content}</body>
</html>`;
  }, [content]);

  return (
    <div className="w-full h-full" style={{ minHeight: '400px' }}>
      <iframe
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="w-full h-full border-0 rounded-lg"
        style={{ minHeight: '400px' }}
        title="HTML Canvas"
      />
    </div>
  );
};

// ── Table ──────────────────────────────────────────
const TableRenderer: React.FC<{ content: string }> = ({ content }) => {
  const data = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        const headers = Object.keys(parsed[0]);
        return { headers, rows: parsed };
      }
    } catch {
      // Try CSV-like
    }
    return null;
  }, [content]);

  if (!data) {
    return <MarkdownRenderer content={content} />;
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {data.headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left font-semibold border-b sticky top-0 z-10"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr
              key={i}
              className="transition-colors"
              style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-card)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-card)')
              }
            >
              {data.headers.map((h) => (
                <td
                  key={h}
                  className="px-4 py-2 border-b"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {String(row[h] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── JSON ───────────────────────────────────────────
const JsonRenderer: React.FC<{ content: string }> = ({ content }) => {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }, [content]);

  return (
    <pre
      className="json-viewer overflow-auto h-full rounded-lg p-4 text-sm leading-relaxed"
      style={{ background: 'var(--code-bg)' }}
    >
      <code>{formatted}</code>
    </pre>
  );
};

// ── PDF (embedded) ─────────────────────────────────
const PdfRenderer: React.FC<{ content: string }> = ({ content }) => (
  <div className="w-full h-full" style={{ minHeight: '500px' }}>
    <iframe
      src={content}
      className="w-full h-full border-0 rounded-lg"
      style={{ minHeight: '500px' }}
      title="PDF Viewer"
    />
  </div>
);
