import "@vitejs/plugin-react/preamble";
import { useEffect, useMemo, useState } from "react";
import { view } from "@pc-nexus/bridge";
import { DEFAULT_HTML, readBlockConfig } from "../../shared/config.js";
import { HtmlPreview } from "../../shared/HtmlPreview.js";

export default function App() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const context = await view.getContext();
        if (cancelled) return;
        const existing = readBlockConfig(context.extension.data);
        if (existing.html.trim()) setHtml(existing.html);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSave = useMemo(
    () => !loading && html.trim().length > 0 && !saving,
    [loading, html, saving],
  );

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const saved = await view.submit({
        config: {
          html: html.trim(),
        },
      });
      if (!saved) {
        setErrorMessage("HTML 内容保存失败。");
        setSaving(false);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "HTML 内容保存失败。");
      setSaving(false);
    }
  }

  async function onCancel() {
    await view.close();
  }

  return (
    <div className="editor" data-iframe-size>
      {errorMessage ? (
        <p className="editor-banner preview-status preview-status-error">{errorMessage}</p>
      ) : null}

      <div className="editor-panes">
        <section className="editor-pane editor-pane-source">
          <h2 className="editor-pane-label">HTML</h2>
          <textarea
            className="source-input"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            spellCheck={false}
            aria-label="HTML 源码"
            placeholder="请输入 HTML，例如 <h1>Hello</h1>"
          />
        </section>

        <section className="editor-pane editor-pane-preview">
          <h2 className="editor-pane-label">预览</h2>
          <div className="editor-pane-body preview-body">
            {loading ? (
              <p className="preview-status">正在加载…</p>
            ) : (
              <HtmlPreview html={html} className="html-preview-frame" title="HTML 预览" />
            )}
          </div>
        </section>
      </div>
      <div className="editor-toolbar">
        <button type="button" className="button-link" onClick={() => void onCancel()} disabled={saving}>
          取消
        </button>
        <button
          type="button"
          className="button-primary"
          onClick={() => void onSave()}
          disabled={!canSave}
        >
          {saving ? "正在保存…" : "保存"}
        </button>
      </div>
    </div>
  );
}
