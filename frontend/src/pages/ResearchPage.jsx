import { useState } from 'react';
import { FlaskConical, Plus, X } from 'lucide-react';
import { initialExperiments } from '../data/mockData';
import { useAppShell } from '../hooks/useAppShell';

export default function ResearchPage() {
  const { showMessage } = useAppShell();
  const [experiments, setExperiments] = useState(initialExperiments);
  const [showModal, setShowModal] = useState(false);

  const handleAddExperiment = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newExperiment = {
      id: Date.now(),
      name: formData.get('expName'),
      crop: formData.get('crop') || '未知',
      treatments: Number.parseInt(formData.get('treatments'), 10) || 0,
      replicates: Number.parseInt(formData.get('replicates'), 10) || 0,
      status: '进行中',
      date: new Date().toISOString().split('T')[0],
      aiEnabled: false,
    };

    setExperiments((current) => [newExperiment, ...current]);
    setShowModal(false);
    showMessage('✅ 试验项目创建成功！');
  };

  const toggleAi = (id) => {
    const targetExperiment = experiments.find((experiment) => experiment.id === id);

    if (!targetExperiment || targetExperiment.status !== '进行中') {
      return;
    }

    setExperiments((current) =>
      current.map((experiment) =>
        experiment.id === id ? { ...experiment, aiEnabled: !experiment.aiEnabled } : experiment,
      ),
    );

    if (!targetExperiment.aiEnabled) {
      showMessage(`✅ 已开启 [${targetExperiment.name}] 的AI智慧管控`);
      return;
    }

    showMessage('已关闭智慧管控');
  };

  return (
    <div className="animate-in fade-in relative space-y-6 duration-500">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <FlaskConical className="text-indigo-500" size={20} />
            科研试验与数据追溯
          </h2>
          <p className="mt-1 text-sm text-slate-500">管理试验设计（处理、重复、区组），自动绑定时空环境数据</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => showMessage('💡 请先配置本地数据读取权限，模块对接中...')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            导入表型数据
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus size={16} /> 新建试验项目
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-sm text-slate-600">
              <th className="px-6 py-4 font-medium">试验项目名称</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">研究作物</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">处理数</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">重复数</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">状态</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">智慧管控</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">立项时间</th>
              <th className="whitespace-nowrap px-6 py-4 text-right font-medium">操作</th>
            </tr>
          </thead>

          <tbody className="text-sm text-slate-700">
            {experiments.map((experiment) => (
              <tr key={experiment.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">{experiment.name}</td>
                <td className="whitespace-nowrap px-6 py-4">{experiment.crop}</td>
                <td className="whitespace-nowrap px-6 py-4">{experiment.treatments}</td>
                <td className="whitespace-nowrap px-6 py-4">{experiment.replicates}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={[
                      'rounded px-2 py-1 text-xs font-bold whitespace-nowrap',
                      experiment.status === '进行中' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
                    ].join(' ')}
                  >
                    {experiment.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleAi(experiment.id)}
                      className={[
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        experiment.status !== '进行中'
                          ? 'cursor-not-allowed bg-slate-200 opacity-50'
                          : experiment.aiEnabled
                            ? 'bg-emerald-500'
                            : 'bg-slate-300',
                      ].join(' ')}
                      title={experiment.status === '进行中' ? '开启/关闭 AI 自主管控' : '已归档试验无法操作'}
                    >
                      <span
                        className={[
                          'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                          experiment.aiEnabled ? 'translate-x-5' : 'translate-x-1',
                        ].join(' ')}
                      />
                    </button>
                    {experiment.aiEnabled && experiment.status === '进行中' ? (
                      <span className="ml-2 animate-pulse rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                        AI托管中
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">{experiment.date}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => showMessage('可视化矩阵排布功能开发中...')}
                      className="whitespace-nowrap font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      设计矩阵
                    </button>
                    <button
                      onClick={() => showMessage('数据正在打包，准备导出...')}
                      className="whitespace-nowrap font-medium text-emerald-600 hover:text-emerald-800"
                    >
                      导出数据
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">新建科研试验项目</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 transition-colors hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExperiment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  试验项目名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  name="expName"
                  required
                  type="text"
                  placeholder="如：不同光周期对草莓糖度影响"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  研究作物 <span className="text-rose-500">*</span>
                </label>
                <input
                  name="crop"
                  required
                  type="text"
                  placeholder="如：草莓"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">设置处理数</label>
                  <input
                    name="treatments"
                    required
                    type="number"
                    min="1"
                    defaultValue="1"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">设置重复数</label>
                  <input
                    name="replicates"
                    required
                    type="number"
                    min="1"
                    defaultValue="3"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-slate-100 px-6 py-2 font-medium text-slate-600 transition-colors hover:bg-slate-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
