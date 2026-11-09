import type { ReactNode } from "react";
import { useState } from "react";
import { NavigationTarget, router } from "@pc-nexus/bridge";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "@pc-nexus/react/router";
import "./app.css";

const NAV_ITEMS = [
  { to: "/page1", label: "page1" },
  { to: "/page2", label: "page2" },
  { to: "/page3", label: "page3" },
  { to: "/bridge-router", label: "bridge router" },
] as const;

function PathMeta() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = `${location.pathname}${location.search}${location.hash}`;

  return (
    <>
      <p className="page-meta">
        当前路径为 <code>{path || "/"}</code>，刷新后仍停留在当前页
      </p>
      <div className="action-row">
        <button
          type="button"
          className="action-btn action-btn-icon"
          onClick={() => {
            navigate(-1);
          }}
        >
          <svg
            className="action-btn-svg"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <g fillRule="evenodd">
              <path
                fill="currentColor"
                transform="rotate(-90 7.995 8)"
                d="M7.3 4.403l-2.789 2.98a.7.7 0 0 1-1.022-.956L7.45 2.194a.698.698 0 0 1 1.085-.067l3.97 4.323a.7.7 0 1 1-1.031.947L8.7 4.375v8.892c0 .456-.309.833-.7.833-.392 0-.7-.377-.7-.833V4.403z"
              />
            </g>
          </svg>
          <span>后退</span>
        </button>
        <button
          type="button"
          className="action-btn action-btn-icon"
          onClick={() => {
            navigate(1);
          }}
        >
          <svg
            className="action-btn-svg"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <g fillRule="evenodd">
              <path
                fill="currentColor"
                transform="rotate(90 7.995 8)"
                d="M7.3 4.403l-2.789 2.98a.7.7 0 0 1-1.022-.956L7.45 2.194a.698.698 0 0 1 1.085-.067l3.97 4.323a.7.7 0 1 1-1.031.947L8.7 4.375v8.892c0 .456-.309.833-.7.833-.392 0-.7-.377-.7-.833V4.403z"
              />
            </g>
          </svg>
          <span>前进</span>
        </button>
      </div>
    </>
  );
}

function PageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="layout-header layout-header-divided">
        <h1 className="layout-header-title">{title}</h1>
      </header>
      <div className="layout-content-main">{children}</div>
    </>
  );
}

function PageOne() {
  return (
    <PageLayout title="page1">
      <section className="content-section">
        <PathMeta />
      </section>
    </PageLayout>
  );
}

function PageTwo() {
  return (
    <PageLayout title="page2">
      <section className="content-section">
        <PathMeta />
      </section>
    </PageLayout>
  );
}

function PageThree() {
  return (
    <PageLayout title="page3">
      <section className="content-section">
        <PathMeta />
      </section>
    </PageLayout>
  );
}

/**
 * Bridge router：宿主级导航，与应用内 BrowserRouter 子路径不同。
 * @see https://developer.pingcode.com/reference/interface/bridge/router
 */
function BridgeRouterPage() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <PageLayout title="bridge router">
      <section className="content-section">
        <div className="action-stack">
          <div className="action-block">
            <p className="action-desc">在当前 Tab 打开开放平台入门文档</p>
            <button
              type="button"
              className="action-btn"
              onClick={() =>
                void run(() =>
                  router.navigate(
                    "https://developer.pingcode.com/guide/started/setup",
                  ),
                )
              }
            >
              navigate
            </button>
          </div>
          <div className="action-block">
            <p className="action-desc">在新标签页打开 Bridge router 文档</p>
            <button
              type="button"
              className="action-btn"
              onClick={() =>
                void run(() =>
                  router.open(
                    "https://developer.pingcode.com/reference/interface/bridge/router",
                  ),
                )
              }
            >
              open
            </button>
          </div>
          <div className="action-block">
            <p className="action-desc">
              将 <code>NavigationLocation</code> 转为宿主 URL
            </p>
            <button
              type="button"
              className="action-btn"
              onClick={() =>
                void run(async () => {
                  const url = await router.generateUrl({
                    target: NavigationTarget.Space,
                    id: "123",
                  });
                  setGeneratedUrl(url.toString());
                })
              }
            >
              generateUrl
            </button>
            {generatedUrl ? (
              <p className="page-meta page-meta-gap">
                结果：<code>{generatedUrl}</code>
              </p>
            ) : null}
          </div>
          <div className="action-block">
            <p className="action-desc">重新加载当前页面</p>
            <button
              type="button"
              className="action-btn"
              onClick={() => void run(() => router.reload())}
            >
              reload
            </button>
          </div>
        </div>
        {error ? (
          <p className="page-meta page-meta-gap page-meta-error">错误：{error}</p>
        ) : null}
      </section>
    </PageLayout>
  );
}

function AppShell() {
  return (
    <div className="layout layout-has-sidebar">
      <aside className="layout-sidebar sidebar-theme-light">
        <div className="sidebar-content">
          <nav className="sidebar-menu" aria-label="应用内导航">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "menu-item menu-item-active" : "menu-item"
                }
              >
                <span className="menu-item-name">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <main className="layout-content">
        <Routes>
          <Route path="/" element={<Navigate to="/page1" replace />} />
          <Route path="/page1" element={<PageOne />} />
          <Route path="/page2" element={<PageTwo />} />
          <Route path="/page3" element={<PageThree />} />
          <Route path="/bridge-router" element={<BridgeRouterPage />} />
          <Route path="*" element={<Navigate to="/page1" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
