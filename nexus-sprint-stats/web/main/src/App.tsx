import { useEffect, useState } from "react";
import { invoke } from "@pc-nexus/bridge";
import type { SprintStatsResult, SprintTypeStat } from "@sprint-stats-types";

const METRICS = [
  { title: "迭代工作日", key: "durationDays" as const, suffix: "天", color: "#6698ff" },
  { title: "总故事点", key: "storyPoints" as const, suffix: "个", color: "#73d897" },
  { title: "总工作项", key: "total" as const, suffix: "个", color: "#5dcfff" },
  { title: "已关闭工作项", key: "closed" as const, suffix: "个", color: "#788cf5" },
];

function pct(completed: number, count: number) {
  return count > 0 ? Math.round((completed / count) * 100) : 0;
}

function TypesTable({ types }: { types: SprintTypeStat[] }) {
  const totalCount = types.reduce((sum, row) => sum + row.count, 0);
  const totalCompleted = types.reduce((sum, row) => sum + row.completed, 0);

  return (
    <section className="panel">
      <div className="panel-title">工作项类型完成情况</div>
      {types.length === 0 ? (
        <p className="center muted">本迭代暂无工作项。</p>
      ) : (
        <table className="stats-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>数量</th>
              <th>已完成数量</th>
              <th>已完成占比</th>
            </tr>
          </thead>
          <tbody>
            {types.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.count}</td>
                <td>{row.completed}</td>
                <td>{pct(row.completed, row.count)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>合计</td>
              <td>{totalCount}</td>
              <td>{totalCompleted}</td>
              <td>{pct(totalCompleted, totalCount)}%</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState<SprintStatsResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    invoke<void, SprintStatsResult>("getSprintStats")
      .then((result) => {
        setStats(result);
        setLoading(false);
      })
      .catch(() => {
        setFailed(true);
        setLoading(false);
      });
  }, [reloadToken]);

  return (
    <div className="page">
      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
          <p className="muted">加载中…</p>
        </div>
      ) : failed ? (
        <div className="banner">
          <p>加载失败</p>
          <button type="button" className="btn" onClick={() => setReloadToken((n) => n + 1)}>
            重试
          </button>
        </div>
      ) : stats ? (
        <div className="stack">
          {stats.summary.overdueRemaining ? (
            <div className="callout">
              有 {stats.summary.overdueRemaining} 个已逾期且未完成的工作项。
            </div>
          ) : null}
          <div className="metric-cards">
            {METRICS.map((card) => (
              <div
                key={card.key}
                className="metric-card"
                style={{
                  color: card.color,
                  borderColor: card.color,
                  backgroundColor: `color-mix(in srgb, ${card.color} 5%, transparent)`,
                }}
              >
                <div className="metric-card-value">
                  {stats.summary[card.key]}
                  {card.suffix ? <span className="metric-card-suffix">{card.suffix}</span> : null}
                </div>
                <div className="metric-card-title">{card.title}</div>
              </div>
            ))}
          </div>
          <TypesTable types={stats.types} />
        </div>
      ) : null}
    </div>
  );
}
