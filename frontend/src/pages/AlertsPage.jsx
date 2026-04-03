import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { useAppShell } from '../hooks/useAppShell';
import {
  fetchAlerts,
  resolveAlertRequest,
  resolveAllAlertsRequest,
} from '../services/alertsApi';
import {
  buildVisibleAlerts,
  getDemoAlerts,
  mergeAlertWithDemo,
  resolveDemoAlerts,
} from '../data/alertData';

const tabs = ['全部', '环境报警', '水肥预警', '设备报警'];

export default function AlertsPage() {
  const { currentUser, showMessage } = useAppShell();
  const [filter, setFilter] = useState('全部');
  const [alertsList, setAlertsList] = useState(() => getDemoAlerts());
  const [isLoading, setIsLoading] = useState(false);
  const [actionKey, setActionKey] = useState('');

  const loadAlerts = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent && alertsList.length === 0) {
        setIsLoading(true);
      }

      try {
        const items = await fetchAlerts();
        setAlertsList(buildVisibleAlerts(items));
      } catch (error) {
        console.error('Failed to load alerts', error);
        setAlertsList((current) => (current.length ? current : getDemoAlerts()));
        showMessage('报警接口暂不可用，已切换到示例数据');
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [alertsList.length, showMessage],
  );

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = useMemo(
    () => alertsList.filter((alert) => filter === '全部' || alert.type === filter),
    [alertsList, filter],
  );

  const handleResolve = async (id) => {
    setAlertsList((current) => resolveDemoAlerts(current, [id]));
    setActionKey(`resolve-${id}`);

    try {
      const item = await resolveAlertRequest(currentUser.id, id);
      setAlertsList((current) => current.map((alert) => (alert.id === id ? mergeAlertWithDemo(item) : alert)));
      showMessage('✅ 报警状态已更新');
    } catch (error) {
      console.error('Failed to resolve alert', error);
      showMessage('✅ 已在示例模式下标记处理');
    } finally {
      setActionKey('');
    }
  };

  const handleMarkAll = async () => {
    const pendingIds = filteredAlerts.filter((alert) => !alert.resolved).map((alert) => alert.id);

    if (!pendingIds.length) {
      showMessage('当前筛选条件下没有待处理报警');
      return;
    }

    setAlertsList((current) => resolveDemoAlerts(current, pendingIds, '批量处置完成'));
    setActionKey('resolve-all');

    try {
      await resolveAllAlertsRequest(currentUser.id, filter);
      showMessage(`✅ 已处理 ${pendingIds.length} 条报警`);
    } catch (error) {
      console.error('Failed to resolve all alerts', error);
      showMessage(`✅ 已在示例模式下处理 ${pendingIds.length} 条报警`);
    } finally {
      setActionKey('');
    }
  };

  const handleExport = async () => {
    setActionKey('export');

    try {
      const csvContent = buildAlertsCsvContent(filteredAlerts);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alerts-${new Date().toISOString().slice(0, 10)}-${filter}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showMessage(`✅ 已导出 ${filteredAlerts.length} 条报警记录`);
    } catch (error) {
      console.error('Failed to export alerts', error);
      showMessage('报警导出失败，请稍后重试');
    } finally {
      setActionKey('');
    }
  };

  return (
    <div className="animate-in fade-in min-h-[70vh] rounded-2xl border border-slate-100 bg-white p-6 shadow-sm duration-500">
      <div className="mb-6 flex flex-col items-start gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={[
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                filter === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={actionKey === 'export'}
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} /> 导出记录
          </button>
          <button
            type="button"
            disabled={actionKey === 'resolve-all'}
            onClick={handleMarkAll}
            className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            全部标记已处理
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-500">
          正在加载报警数据...
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={[
                  'flex flex-col gap-4 rounded-xl border p-4 transition-all hover:shadow-sm lg:flex-row lg:items-center lg:justify-between',
                  alert.resolved
                    ? 'border-slate-200 bg-slate-50'
                    : alert.level === '高'
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-amber-200 bg-amber-50',
                ].join(' ')}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={[
                      'rounded-full p-2',
                      alert.resolved
                        ? 'bg-slate-200 text-slate-500'
                        : alert.level === '高'
                          ? 'bg-rose-200 text-rose-600'
                          : 'bg-amber-200 text-amber-600',
                    ].join(' ')}
                  >
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          'rounded px-2 py-0.5 text-xs font-bold',
                          alert.resolved
                            ? 'bg-slate-200 text-slate-600'
                            : alert.level === '高'
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-500 text-white',
                        ].join(' ')}
                      >
                        {alert.type}
                      </span>
                      <span className="text-sm font-bold text-slate-700">{alert.level}风险</span>
                      <span className="ml-2 text-xs text-slate-500">{alert.time}</span>
                      {alert.greenhouseName ? <span className="text-xs text-slate-400">{alert.greenhouseName}</span> : null}
                    </div>
                    <p className={alert.resolved ? 'text-sm text-slate-500' : 'text-sm font-medium text-slate-800'}>{alert.content}</p>
                    {alert.resolved && alert.resolutionNote ? (
                      <p className="mt-2 text-xs text-slate-400">处理说明：{alert.resolutionNote}</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  {!alert.resolved ? (
                    <button
                      type="button"
                      disabled={actionKey === `resolve-${alert.id}`}
                      onClick={() => handleResolve(alert.id)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      去处理
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <CheckCircle size={16} /> 已解决
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">该分类下暂无报警记录</div>
          )}
        </div>
      )}
    </div>
  );
}

function buildAlertsCsvContent(items) {
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

  return [
    ['ID', '类型', '等级', '状态', '发生时间', '内容', '处理说明'].map(escapeCell).join(','),
    ...items.map((item) =>
      [
        item.id,
        item.type,
        item.level,
        item.resolved ? '已处理' : '待处理',
        item.time,
        item.content,
        item.resolutionNote ?? '',
      ]
        .map(escapeCell)
        .join(','),
    ),
  ].join('\n');
}
