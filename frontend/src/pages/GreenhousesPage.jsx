import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Droplet,
  Fan,
  Filter,
  Lightbulb,
  Plus,
  Search,
  SlidersHorizontal,
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react';
import ModalShell from '../components/common/ModalShell';
import SensorMetric from '../components/common/SensorMetric';
import { useAppShell } from '../hooks/useAppShell';
import {
  createGreenhouseRequest,
  fetchGreenhouseDetail,
  fetchGreenhouses,
  updateGreenhouseControlRequest,
} from '../services/greenhousesApi';

const statusOptions = [
  { key: 'all', label: '全部棚室' },
  { key: 'normal', label: '运行正常' },
  { key: 'warning', label: '存在异常' },
  { key: 'maintenance', label: '检修中' },
  { key: 'offline', label: '离线' },
];

const statusBadgeMap = {
  normal: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-rose-100 text-rose-700',
  maintenance: 'bg-amber-100 text-amber-700',
  offline: 'bg-slate-200 text-slate-600',
};

const statusLabelMap = {
  normal: '运行正常',
  warning: '存在异常',
  maintenance: '检修中',
  offline: '设备离线',
};

function buildMetricCard(label, value) {
  return { label, value };
}

export default function GreenhousesPage() {
  const { currentUser, showMessage } = useAppShell();
  const [greenhouses, setGreenhouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [controlId, setControlId] = useState(null);
  const [controlItem, setControlItem] = useState(null);
  const [controlDraft, setControlDraft] = useState(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [savingControl, setSavingControl] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [creatingGreenhouse, setCreatingGreenhouse] = useState(false);

  const loadGreenhouses = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setIsLoading(true);
      }

      try {
        const items = await fetchGreenhouses();
        setGreenhouses(items);
      } catch (error) {
        console.error('Failed to load greenhouses', error);
        showMessage('棚室数据加载失败，请稍后重试');
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [showMessage],
  );

  useEffect(() => {
    loadGreenhouses();
  }, [loadGreenhouses]);

  const filteredGreenhouses = useMemo(() => {
    return greenhouses.filter((greenhouse) => {
      const matchesStatus = statusFilter === 'all' || greenhouse.status === statusFilter;
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        greenhouse.name.toLowerCase().includes(keyword) ||
        greenhouse.crop.toLowerCase().includes(keyword) ||
        greenhouse.location.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [greenhouses, searchKeyword, statusFilter]);

  const statusCountMap = useMemo(() => {
    return greenhouses.reduce(
      (result, greenhouse) => {
        result.all += 1;
        result[greenhouse.status] += 1;
        return result;
      },
      { all: 0, normal: 0, warning: 0, maintenance: 0, offline: 0 },
    );
  }, [greenhouses]);

  const selectedGreenhouseName = (id) => greenhouses.find((item) => item.id === id)?.name ?? '棚室';

  const openDetailModal = async (greenhouseId) => {
    setDetailId(greenhouseId);
    setDetailLoading(true);
    setDetailItem(null);

    try {
      const item = await fetchGreenhouseDetail(greenhouseId);
      setDetailItem(item);
    } catch (error) {
      console.error('Failed to load greenhouse detail', error);
      showMessage('棚室详情加载失败，请稍后重试');
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const openControlModal = async (greenhouseId) => {
    setControlId(greenhouseId);
    setControlLoading(true);
    setControlItem(null);
    setControlDraft(null);

    try {
      const item = await fetchGreenhouseDetail(greenhouseId);
      setControlItem(item);
      setControlDraft({ ...item.devices });
    } catch (error) {
      console.error('Failed to load greenhouse control detail', error);
      showMessage('设备控制数据加载失败，请稍后重试');
      setControlId(null);
    } finally {
      setControlLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailId(null);
    setDetailItem(null);
    setDetailLoading(false);
  };

  const closeControlModal = () => {
    setControlId(null);
    setControlItem(null);
    setControlDraft(null);
    setControlLoading(false);
    setSavingControl(false);
  };

  const handleSaveControl = async () => {
    if (!controlItem || !controlDraft) {
      return;
    }

    setSavingControl(true);

    try {
      await updateGreenhouseControlRequest(currentUser.id, controlItem.id, controlDraft);
      await loadGreenhouses({ silent: true });
      closeControlModal();
      showMessage(`已保存 ${controlItem.name} 的设备控制参数`);
    } catch (error) {
      console.error('Failed to save greenhouse control', error);
      showMessage('设备控制保存失败，请稍后重试');
    } finally {
      setSavingControl(false);
    }
  };

  const handleAddGreenhouse = async (event) => {
    event.preventDefault();
    setCreatingGreenhouse(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      greenhouseName: String(formData.get('greenhouseName') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      crop: String(formData.get('crop') || '').trim(),
      stage: String(formData.get('stage') || '').trim(),
      manager: String(formData.get('manager') || '').trim(),
      strategy: String(formData.get('strategy') || '').trim(),
      area: Number(formData.get('area')),
      deviceCount: Number(formData.get('deviceCount')),
      temp: Number(formData.get('temp')),
      humidity: Number(formData.get('humidity')),
      soilMoisture: Number(formData.get('soilMoisture')),
      ec: Number(formData.get('ec')),
      status: String(formData.get('status') || 'normal'),
    };

    try {
      const item = await createGreenhouseRequest(currentUser.id, payload);
      await loadGreenhouses({ silent: true });
      setAddModalOpen(false);
      showMessage(`已新增棚室：${item.name}`);
    } catch (error) {
      console.error('Failed to create greenhouse', error);
      showMessage('新增棚室失败，请检查名称是否重复');
    } finally {
      setCreatingGreenhouse(false);
    }
  };

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFilterPanelOpen((current) => !current)}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
            >
              <Filter size={16} /> 筛选状态
            </button>
            <div className="relative min-w-[220px] flex-1 xl:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="搜索棚室名称 / 作物 / 位置"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus size={16} /> 新增棚室
          </button>
        </div>

        {filterPanelOpen ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <SlidersHorizontal size={16} /> 按运行状态筛选
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setStatusFilter(option.key)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    statusFilter === option.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {option.label} ({statusCountMap[option.key]})
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          正在加载棚室数据...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredGreenhouses.map((greenhouse) => (
              <div key={greenhouse.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{greenhouse.name}</h3>
                    <p className="mt-1 text-sm font-medium text-emerald-600">{greenhouse.crop}</p>
                    <p className="mt-2 text-xs text-slate-500">{greenhouse.location}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeMap[greenhouse.status]}`}>
                    {statusLabelMap[greenhouse.status]}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <SensorMetric icon={Thermometer} label="空气温度" value={`${greenhouse.temp}°C`} />
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <SensorMetric icon={Wind} label="空气湿度" value={`${greenhouse.humidity}%`} />
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <SensorMetric
                      icon={Droplet}
                      label="基质水分"
                      value={`${greenhouse.soilMoisture}%`}
                      isWarning={greenhouse.soilMoisture < 25}
                    />
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <SensorMetric icon={Activity} label="土壤EC" value={`${greenhouse.ec} mS/cm`} />
                  </div>
                </div>

                <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">水肥策略</span>
                    <span className="text-emerald-600">{greenhouse.waterStrategy}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    {[
                      buildMetricCard('负责人', greenhouse.manager),
                      buildMetricCard('面积', greenhouse.area),
                      buildMetricCard('设备健康', greenhouse.deviceHealth),
                    ].map((item) => (
                      <span key={item.label} className="rounded-full bg-white px-3 py-1">
                        {item.label}: {item.value}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openDetailModal(greenhouse.id)}
                    className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    详细数据
                  </button>
                  <button
                    type="button"
                    onClick={() => openControlModal(greenhouse.id)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    设备控制
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredGreenhouses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              当前筛选条件下没有匹配的棚室，试试切换状态或搜索关键词。
            </div>
          ) : null}
        </>
      )}

      {detailId ? (
        <ModalShell
          title={`${selectedGreenhouseName(detailId)} · 详细数据`}
          description="查看棚室运行概况、目标阈值、趋势快照与最近执行记录。"
          onClose={closeDetailModal}
          size="max-w-5xl"
        >
          {detailLoading || !detailItem ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
              正在加载棚室详情...
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    buildMetricCard('位置', detailItem.location),
                    buildMetricCard('面积', detailItem.area),
                    buildMetricCard('负责人', detailItem.manager),
                    buildMetricCard('最近检修', detailItem.lastService),
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h4 className="text-sm font-bold text-slate-700">日内趋势快照</h4>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {detailItem.trend.map((point) => (
                      <div key={point.time} className="rounded-2xl border border-slate-100 bg-white p-4">
                        <div className="text-xs font-bold text-slate-400">{point.time}</div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>温度</span>
                            <span className="font-semibold text-slate-800">{point.temp}°C</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>湿度</span>
                            <span className="font-semibold text-slate-800">{point.humidity}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>基质水分</span>
                            <span className="font-semibold text-slate-800">{point.soilMoisture}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-slate-600">
                            <span>EC</span>
                            <span className="font-semibold text-slate-800">{point.ec} mS/cm</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-700">目标阈值</h4>
                  <div className="mt-4 space-y-3 text-sm">
                    {Object.entries(detailItem.targets).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <span className="text-slate-500">{key}</span>
                        <span className="font-semibold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-700">运行建议</h4>
                  <div className="mt-4 space-y-3">
                    {detailItem.notes.map((note) => (
                      <div key={note} className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-700">最近执行记录</h4>
                  <div className="mt-4 space-y-3">
                    {detailItem.recentCommands.map((item) => (
                      <div key={`${item.id}-${item.time}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{item.description}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.time}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalShell>
      ) : null}

      {controlId ? (
        <ModalShell
          title={`${selectedGreenhouseName(controlId)} · 设备控制`}
          description="调整灌溉、通风、补光和遮阳等控制参数，并即时同步到当前棚室状态。"
          onClose={closeControlModal}
          size="max-w-3xl"
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeControlModal}
                className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                取消
              </button>
              <button
                type="button"
                disabled={controlLoading || savingControl || !controlDraft}
                onClick={handleSaveControl}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                保存控制参数
              </button>
            </div>
          }
        >
          {controlLoading || !controlDraft ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
              正在加载设备控制参数...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ControlSwitchCard
                  icon={Droplet}
                  label="灌溉主阀"
                  description="开启后将执行一轮短脉冲补灌。"
                  checked={controlDraft.irrigation}
                  onChange={(checked) => setControlDraft((current) => ({ ...current, irrigation: checked }))}
                />
                <ControlSwitchCard
                  icon={Waves}
                  label="营养液泵"
                  description="控制水肥一体机营养液循环状态。"
                  checked={controlDraft.nutrientPump}
                  onChange={(checked) => setControlDraft((current) => ({ ...current, nutrientPump: checked }))}
                />
                <ControlSwitchCard
                  icon={Lightbulb}
                  label="补光系统"
                  description="夜间或阴天时辅助维持光周期。"
                  checked={controlDraft.fillLight}
                  onChange={(checked) => setControlDraft((current) => ({ ...current, fillLight: checked }))}
                />
                <RangeCard
                  icon={Fan}
                  label="顶部通风开度"
                  value={controlDraft.ventilation}
                  suffix="%"
                  onChange={(value) => setControlDraft((current) => ({ ...current, ventilation: Number(value) }))}
                />
              </div>

              <RangeCard
                icon={Wind}
                label="遮阳 / 保温幕开度"
                value={controlDraft.shadeScreen}
                suffix="%"
                onChange={(value) => setControlDraft((current) => ({ ...current, shadeScreen: Number(value) }))}
              />
            </div>
          )}
        </ModalShell>
      ) : null}

      {addModalOpen ? (
        <ModalShell
          title="新增棚室"
          description="新增后会立即出现在棚室列表中，并自动生成默认的监测与控制配置。"
          onClose={() => setAddModalOpen(false)}
          size="max-w-3xl"
        >
          <form onSubmit={handleAddGreenhouse} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="棚室名称" name="greenhouseName" placeholder="如：M区番茄棚 (玻璃温室)" required />
              <FormField label="位置" name="location" placeholder="如：江苏省设施农业创新示范基地 · M区" required />
              <FormField label="作物" name="crop" placeholder="如：番茄" required />
              <FormField label="生育期" name="stage" placeholder="如：转色期" required />
              <FormField label="负责人" name="manager" placeholder="如：李建国" required />
              <FormField label="水肥策略" name="strategy" placeholder="如：滴灌 + AI辅助补灌" required />
              <FormField label="棚室面积 (㎡)" name="area" type="number" defaultValue="1200" required />
              <FormField label="在线设备数" name="deviceCount" type="number" defaultValue="4" required />
              <FormField label="空气温度 (°C)" name="temp" type="number" step="0.1" defaultValue="25.0" required />
              <FormField label="空气湿度 (%)" name="humidity" type="number" defaultValue="68" required />
              <FormField label="基质水分 (%)" name="soilMoisture" type="number" defaultValue="30" required />
              <FormField label="土壤 EC" name="ec" type="number" step="0.1" defaultValue="1.8" required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">运行状态</label>
              <select
                name="status"
                defaultValue="normal"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="normal">运行正常</option>
                <option value="warning">存在异常</option>
                <option value="maintenance">检修中</option>
                <option value="offline">离线</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={creatingGreenhouse}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                创建棚室
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}

function ControlSwitchCard({ icon: Icon, label, description, checked, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Icon size={16} className="text-emerald-600" /> {label}
          </div>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function RangeCard({ icon: Icon, label, value, suffix, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Icon size={16} className="text-blue-600" /> {label}
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
          {value}
          {suffix}
        </span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(event.target.value)} className="mt-4 w-full accent-emerald-600" />
    </div>
  );
}

function FormField({ label, name, placeholder, required = false, type = 'text', defaultValue, step }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        step={step}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}
