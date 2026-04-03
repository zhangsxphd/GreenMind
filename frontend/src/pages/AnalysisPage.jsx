import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Download, Gauge, LineChart, PieChart, TrendingUp } from 'lucide-react';
import { analysisMetricOptions, analysisScopes } from '../data/analysisData';
import { useAppShell } from '../hooks/useAppShell';

const toneClassMap = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  violet: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
};

export default function AnalysisPage() {
  const { showMessage } = useAppShell();
  const [scopeId, setScopeId] = useState('park-overview');
  const [metricKey, setMetricKey] = useState('waterUsage');
  const [riskFilter, setRiskFilter] = useState('全部');

  const activeScope = useMemo(
    () => analysisScopes.find((scope) => scope.id === scopeId) ?? analysisScopes[0],
    [scopeId],
  );
  const activeMetric = useMemo(
    () => analysisMetricOptions.find((metric) => metric.key === metricKey) ?? analysisMetricOptions[0],
    [metricKey],
  );
  const activeSeries = activeScope.series[metricKey];
  const seriesMax = Math.max(...activeSeries) * 1.15;
  const filteredRisks = activeScope.risks.filter((risk) => riskFilter === '全部' || risk.level === riskFilter);

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <TrendingUp size={20} className="text-emerald-600" /> 多维数据分析中心
            </h2>
            <p className="mt-1 text-sm text-slate-500">围绕水肥效率、环境稳定性、风险事件和能耗强度做联动分析。</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={scopeId}
              onChange={(event) => setScopeId(event.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {analysisScopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => showMessage(`已导出 ${activeScope.label} 的分析简报`)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download size={16} /> 导出分析简报
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {analysisMetricOptions.map((metric) => (
            <button
              key={metric.key}
              onClick={() => setMetricKey(metric.key)}
              className={[
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                metric.key === metricKey ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {activeScope.summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-3xl font-bold text-slate-800">{card.value}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClassMap[card.tone]}`}>
                {card.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <BarChart3 size={20} className={activeMetric.textColor} /> {activeScope.label} · {activeMetric.label}趋势
              </h3>
              <p className="mt-1 text-sm text-slate-500">{activeMetric.description}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activeMetric.textColor} bg-slate-50`}>
              指标单位：{activeMetric.unit}
            </span>
          </div>

          <div className="mt-6 flex h-64 items-end gap-3 border-b border-slate-100 pb-3">
            {activeSeries.map((value, index) => (
              <div key={`${activeScope.id}-${metricKey}-${activeScope.axisLabels[index]}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="group relative flex h-full w-full items-end rounded-t-2xl bg-slate-50 transition-colors hover:bg-slate-100">
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {value} {activeMetric.unit}
                  </div>
                  <div
                    className={`w-full rounded-t-2xl ${activeMetric.color} transition-all duration-700`}
                    style={{ height: `${(value / seriesMax) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">{activeScope.axisLabels[index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <PieChart size={20} className="text-emerald-500" /> 资源效率诊断
          </div>
          <div className="mt-5 space-y-5">
            {activeScope.efficiency.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <span className={`font-bold ${item.textColor}`}>{item.score}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Gauge size={16} /> 当前分析焦点
            </div>
            <p className="mt-2 text-sm text-emerald-800">{activeScope.recommendations[0]}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <LineChart size={20} className="text-blue-500" /> {activeScope.comparisonTitle}
          </div>
          <div className="mt-5 space-y-4">
            {activeScope.comparisonRows.map((row) => (
              <div key={row.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{row.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.primary}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.secondary}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{row.tag}</span>
                    <div className="mt-3 h-2 w-28 rounded-full bg-slate-200 sm:ml-auto">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${row.score}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-blue-600">综合得分 {row.score}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              <AlertTriangle size={20} className="text-rose-500" /> 风险事件追踪
            </h3>
            <div className="flex gap-2">
              {['全部', '高', '中', '低'].map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    riskFilter === level ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {filteredRisks.map((risk) => (
              <div key={`${risk.time}-${risk.title}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'rounded-full px-2.5 py-1 text-xs font-bold',
                          risk.level === '高'
                            ? 'bg-rose-500 text-white'
                            : risk.level === '中'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-300 text-slate-700',
                        ].join(' ')}
                      >
                        {risk.level}风险
                      </span>
                      <span className="text-xs text-slate-500">{risk.time}</span>
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">{risk.title}</p>
                    <p className="mt-1 text-sm text-slate-500">责任人：{risk.owner}</p>
                    <p className="mt-3 text-sm text-slate-700">{risk.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-bold text-slate-800">
          <TrendingUp size={20} className="text-emerald-500" /> 分析建议输出
        </h3>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {activeScope.recommendations.map((recommendation) => (
            <div key={recommendation} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              {recommendation}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
