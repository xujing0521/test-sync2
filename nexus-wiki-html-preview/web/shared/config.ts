export type HtmlPreviewBlockConfig = {
  html: string;
};

export const DEFAULT_HTML = `
<article class="card">
  <h2>
    <span>Wiki 里也能跑 HTML</span>
    <span class="emoji" aria-hidden="true">✨</span>
  </h2>
  <p>实时预览 · 开箱即用。</p>
</article>

<style>
  .card {
    margin: 0;
    height: 160px;
    display: flex;
    padding: 20px;
    flex-direction: column;
    justify-content: center;
    border-radius: 16px;
    color: #f8fafc;
    box-sizing: border-box;
    font-family: "Segoe UI", system-ui, sans-serif;
    background: linear-gradient(135deg, #0f766e, #1d4ed8 45%, #7c3aed);
  }
  .emoji {
    font-size: 36px;
  }
  .card h2 {
    margin: 0;
    font-size: 22px;
  }
  .card p {
    margin: 0;
    opacity: 0.9;
    line-height: 1.6;
  }
</style>`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readBlockConfig(data: unknown): HtmlPreviewBlockConfig {
  const extensionData = isRecord(data) ? data : {};
  const config = isRecord(extensionData.config) ? extensionData.config : {};
  const html = typeof config.html === "string" ? config.html : "";
  return { html };
}
