import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownBlockProps {
  content: string;
  className?: string;
}

export function MarkdownBlock({ content, className = '' }: MarkdownBlockProps) {
  // Split out "Connection:" sections for special rendering
  const connectionMatch = content.match(/Connection:\s*(.*)/s);
  const mainContent = connectionMatch ? content.replace(/Connection:\s*.*/s, '').trim() : content;
  const connectionText = connectionMatch ? connectionMatch[1].trim() : null;

  return (
    <div className={className}>
      <div className="prose prose-sm max-w-none" style={{ color: 'var(--color-text-secondary)' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent-primary)' }}
                className="hover:underline"
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong style={{ color: 'var(--color-text-primary)' }}>{children}</strong>
            ),
            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
          }}
        >
          {mainContent}
        </ReactMarkdown>
      </div>
      {connectionText && (
        <div
          className="mt-2 pl-3 py-2 text-sm rounded-r-md"
          style={{
            borderLeft: '3px solid var(--color-accent-book)',
            backgroundColor: 'color-mix(in srgb, var(--color-accent-book) 8%, transparent)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span className="font-semibold text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-accent-book)' }}>
            Connection
          </span>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            p: ({ children }) => <p className="mb-0">{children}</p>,
            strong: ({ children }) => <strong style={{ color: 'var(--color-text-primary)' }}>{children}</strong>,
          }}>
            {connectionText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
