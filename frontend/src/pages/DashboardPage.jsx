import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle,
  ChevronRight,
  CloudRain,
  Droplet,
  Sprout,
  Thermometer,
  Wind,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../components/common/KpiCard';
import SensorMetric from '../components/common/SensorMetric';
import { kpiData, mockAlerts, mockDecisions, mockGreenhouses } from '../data/mockData';
import { useAppShell } from '../hooks/useAppShell';
import { approveDecisionRequest, ignoreDecisionRequest } from '../services/decisionsApi';
import { fetchDashboard } from '../services/dashboardApi';

const EMPTY_DASHBOARD = {
  kpis: kpiData,
  decisions: mockDecisions,
  alerts: mockAlerts,
  greenhouses: mockGreenhouses,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, showMessage } = useAppShell();
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(false);
  const [actionKey, setActionKey] = useState('');

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent && !dashboard.decisions.length && !dashboard.alerts.length && !dashboard.greenhouses.length) {
        setIsLoading(true);
      }

      try {
        const data = await fetchDashboard();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard', error);
        setDashboard(EMPTY_DASHBOARD);
        showMessage('首页接口暂不可用，已切换到示例数据');
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [dashboard.alerts.length, dashboard.decisions.length, dashboard.greenhouses.length, showMessage],
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleExecute = async (id) => {
    setActionKey(`approve-${id}`);

    try {
      await approveDecisionRequest(currentUser.id, id);
      await loadDashboard({ silent: true });
      showMessage('✅ 指令已自动下发至执行设备');
    } catch (error) {
      console.error('Failed to approve decision', error);
      showMessage('决策执行失败，请稍后重试');
    } finally {
      setActionKey('');
    }
  };

  const handleIgnore = async (id) => {
    setActionKey(`ignore-${id}`);

    try {
      await ignoreDecisionRequest(currentUser.id, id);
      await loadDashboard({ silent: true });
      showMessage('已忽略该调控建议');
    } catch (error) {
      console.error('Failed to ignore decision', error);
      showMessage('决策状态更新失败，请稍后重试');
    } finally {
      setActionKey('');
    }
  };

  const { kpis, decisions, alerts, greenhouses } = dashboard;

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Sprout} label="管理棚室总数" value={kpis.totalGreenhouses} color="text-emerald-600" bg="bg-emerald-100" />
        <KpiCard icon={Activity} label="在线设备数" value={kpis.onlineDevices} color="text-blue-600" bg="bg-blue-100" />
        <KpiCard icon={BellRing} label="待处理预警" value={kpis.activeAlerts} color="text-rose-600" bg="bg-rose-100" />
        <KpiCard icon={Droplet} label="今日灌溉次数" value={kpis.todayIrrigations} color="text-cyan-600" bg="bg-cyan-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <CloudRain className="text-emerald-500" size={20} />
              协同决策建议 (待确认)
            </h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">人机协同模式</span>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              正在加载首页决策数据...
            </div>
          ) : decisions.length ? (
            <div className="space-y-4">
              {decisions.map((decision) => {
                const isActing = actionKey === `approve-${decision.id}` || actionKey === `ignore-${decision.id}`;

                return (
                  <div key={decision.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-shadow hover:shadow-md">
                    <div className="mb-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-800">{decision.greenhouse}</span>
                          <span className="rounded border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            {decision.type}
                          </span>
                          <span className="rounded border border-purple-200 bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                            置信度 {decision.confidence}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-emerald-700">{decision.action}</p>
                      </div>

                      {decision.status === 'pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleExecute(decision.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircle size={16} /> 执行
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleIgnore(decision.id)}
                            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <XCircle size={16} /> 忽略
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-slate-400">
                          <CheckCircle size={16} /> 已执行
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-600">
                      <Activity size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <p>
                        <strong>决策依据：</strong>
                        {decision.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              当前没有待确认的协同决策建议。
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <AlertTriangle className="text-rose-500" size={20} />
              实时风险预警
            </h2>
            <button type="button" onClick={() => navigate('/alerts')} className="flex items-center text-sm text-slate-500 hover:text-emerald-600">
              全部 <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {alerts.length ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={[
                    'rounded-xl border-l-4 p-3',
                    alert.resolved
                      ? 'border-slate-300 bg-slate-50 opacity-60'
                      : alert.level === '高'
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-amber-400 bg-amber-50',
                  ].join(' ')}
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <span
                      className={[
                        'rounded px-2 py-0.5 text-xs font-bold',
                        alert.resolved
                          ? 'bg-slate-200 text-slate-600'
                          : alert.level === '高'
                            ? 'bg-rose-200 text-rose-700'
                            : 'bg-amber-200 text-amber-800',
                      ].join(' ')}
                    >
                      {alert.type}
                    </span>
                    <span className="text-xs text-slate-500">{alert.time}</span>
                  </div>
                  <p className={alert.resolved ? 'mt-2 text-sm text-slate-500 line-through' : 'mt-2 text-sm text-slate-700'}>
                    {alert.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                当前没有风险预警。
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">棚室实时监测快照</h2>
          <button type="button" onClick={() => navigate('/greenhouses')} className="flex items-center text-sm text-slate-500 hover:text-emerald-600">
            进入详细管理 <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {greenhouses.map((greenhouse) => (
            <button
              key={greenhouse.id}
              type="button"
              onClick={() => navigate('/greenhouses')}
              className="flex flex-col rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800">{greenhouse.name}</h3>
                  <p className="text-xs text-slate-500">{greenhouse.crop}</p>
                </div>
                <div
                  className={[
                    'h-3 w-3 rounded-full',
                    greenhouse.status === 'normal'
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'animate-pulse bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
                  ].join(' ')}
                />
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                <SensorMetric icon={Thermometer} label="气温" value={`${greenhouse.temp}°C`} />
                <SensorMetric icon={Wind} label="空气湿度" value={`${greenhouse.humidity}%`} />
                <SensorMetric
                  icon={Droplet}
                  label="基质水分"
                  value={`${greenhouse.soilMoisture}%`}
                  isWarning={greenhouse.soilMoisture < 25}
                />
                <SensorMetric icon={Activity} label="土壤EC" value={`${greenhouse.ec} mS/cm`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
