import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import rehypeExternalLinks from 'rehype-external-links';
import { markdownSanitizeSchema } from '../markdown/sanitize-schema';

interface Props {
  content: string;
}

function plainTextFromReactNodes(nodes: unknown): string {
  if (nodes == null || typeof nodes === 'boolean') return '';
  if (typeof nodes === 'string' || typeof nodes === 'number') return String(nodes);
  if (Array.isArray(nodes)) return nodes.map(plainTextFromReactNodes).join('');
  if (typeof nodes === 'object' && 'props' in nodes) {
    const props = (nodes as { props?: { children?: unknown } }).props;
    return plainTextFromReactNodes(props?.children);
  }
  return '';
}

function extractLanguage(className?: string | null): string | undefined {
  if (!className) return undefined;
  const m = className.match(/language-([A-Za-z0-9_-]+)/);
  return m?.[1];
}

function stripHighlightClasses(className?: string): string | undefined {
  if (!className) return className;
  const kept = className
    .split(/\s+/)
    .filter(Boolean)
    // 行内 code 不应该带 highlight.js 的 class，否则会覆盖行内背景色
    .filter((c) => c !== 'hljs')
    .filter((c) => !c.startsWith('language-'));
  return kept.length ? kept.join(' ') : undefined;
}

function CodeFence({
  codeClassName,
  codeChildren,
}: {
  codeClassName?: string;
  codeChildren: unknown;
}) {
  const [copied, setCopied] = useState(false);

  const codeText = useMemo(() => {
    const t = plainTextFromReactNodes(codeChildren);
    // ReactMarkdown 里 code fences 的文本通常会包含换行，这里保持原样但去掉首尾空行影响
    return t.replace(/^\n+/, '').replace(/\n+$/, '');
  }, [codeChildren]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const lang = extractLanguage(codeClassName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
    } catch {
      // 兜底：禁用 clipboard 权限时，用 textarea 复制
      const ta = document.createElement('textarea');
      ta.value = codeText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }
  };

  return (
    <div className="code-block">
      <div className="code-block-header">
        <div className="code-block-header-left">
          {lang ? <span className="code-block-lang">{lang}</span> : null}
        </div>
        <button
          type="button"
          className={`code-block-copy ${copied ? 'active' : ''}`}
          onClick={() => void handleCopy()}
          aria-label="复制代码"
          title={copied ? '已复制' : '复制代码'}
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre>
        {codeChildren}
      </pre>
    </div>
  );
}

export function MarkdownContent({ content }: Props) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { throwOnError: false, strict: 'ignore' }],
          rehypeHighlight,
          [rehypeSanitize, markdownSanitizeSchema],
          [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
        ]}
        components={{
          code({ inline, className, children, ...props }) {
            // 行内 code：不包复制按钮，且避免带 hljs class 覆盖行内背景色
            if (inline) {
              return (
                <code className={stripHighlightClasses(className)} {...props}>
                  {children}
                </code>
              );
            }
            // fenced code：交给 pre 组件包裹（复制按钮只对独立代码块显示）
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            // 仅对 fenced code 的 <pre><code> 做复制包装；其它 pre 退回默认行为
            const childArr = Array.isArray(children) ? children : [children];
            const codeNode = childArr.find(
              (c) => c && typeof c === 'object' && 'props' in c && (c as any).props?.className,
            ) as any;
            const codeClassName = codeNode?.props?.className as string | undefined;
            if (!codeNode) {
              return <pre>{children}</pre>;
            }
            return <CodeFence codeClassName={codeClassName} codeChildren={children} />;
          },
          table({ children, ...props }) {
            return (
              <div className="markdown-table-wrap">
                <table {...props}>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
