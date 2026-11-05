import { useEffect, useRef } from "react";

type HtmlPreviewProps = {
  html: string;
  title?: string;
  className?: string;
  autoHeight?: boolean;
};

function toSrcDoc(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return `<!doctype html><html><head><meta charset="utf-8" /></head><body></body></html>`;
  }
  if (/<!doctype html>|<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>${trimmed}</body>
</html>`;
}

export function HtmlPreview({
  html,
  title = "HTML preview",
  className,
  autoHeight = false,
}: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!autoHeight) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | undefined;

    const sync = () => {
      const root = iframe.contentDocument?.documentElement;
      if (root) iframe.style.height = `${root.scrollHeight}px`;
    };

    const onLoad = () => {
      observer?.disconnect();
      const root = iframe.contentDocument?.documentElement;
      if (!root) return;
      sync();
      observer = new ResizeObserver(sync);
      observer.observe(root);
    };

    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => {
      iframe.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [autoHeight, html]);

  return (
    <iframe
      key={html}
      ref={iframeRef}
      className={className}
      title={title}
      sandbox={autoHeight ? "allow-scripts allow-same-origin" : "allow-scripts"}
      srcDoc={toSrcDoc(html)}
    />
  );
}
