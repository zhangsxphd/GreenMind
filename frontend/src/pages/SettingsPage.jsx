import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  BellRing,
  CloudRain,
  Database,
  History,
  KeyRound,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  Settings2,
  Shield,
  Sliders,
  Smartphone,
  Upload,
  User,
} from 'lucide-react';
import { useAppShell } from '../hooks/useAppShell';
import {
  archiveActivityLogsRequest,
  createBackupRequest,
  createConfigSnapshotRequest,
  exportSettingsPackageRequest,
  fetchSettings,
  restoreConfigSnapshotRequest,
  rotateIntegrationKeyRequest,
  rotateSecurityTokenRequest,
  runHealthCheckRequest,
  saveBasicSettingsRequest,
  saveNotificationSettingsRequest,
  saveOpsSettingsRequest,
  saveRuleSettingsRequest,
  saveSecuritySettingsRequest,
  simulateRuleSettingsRequest,
  testIntegrationRequest,
  testNotificationChannelRequest,
  toggleIntegrationRequest,
} from '../services/settingsApi';

const tabs = [
  { id: 'basic', label: '基本信息', icon: User },
  { id: 'rules', label: '报警与决策', icon: Sliders },
  { id: 'notifications', label: '通知策略', icon: BellRing },
  { id: 'integration', label: '集成中心', icon: Database },
  { id: 'security', label: '数据与安全', icon: Shield },
  { id: 'ops', label: '运维审计', icon: Settings2 },
];

const avatarThemes = [
  { id: 'emerald', label: '翡翠绿', className: 'bg-emerald-100 text-emerald-700' },
  { id: 'blue', label: '深海蓝', className: 'bg-blue-100 text-blue-700' },
  { id: 'amber', label: '日光黄', className: 'bg-amber-100 text-amber-700' },
  { id: 'rose', label: '晨曦红', className: 'bg-rose-100 text-rose-700' },
];

const integrationIconMap = {
  mqtt: Database,
  weather: CloudRain,
  'sensor-cloud': Upload,
};

const rulePresets = {
  balanced: {
    highTemp: 35,
    highHumidity: 85,
    lowSoilMoisture: 25,
    highEc: 2.6,
    autoDecision: true,
    unattendedMode: false,
    weatherLinkage: true,
    severeEscalation: true,
    anomalyWindow: 120,
  },
  conservative: {
    highTemp: 33,
    highHumidity: 82,
    lowSoilMoisture: 28,
    highEc: 2.3,
    autoDecision: true,
    unattendedMode: false,
    weatherLinkage: true,
    severeEscalation: true,
    anomalyWindow: 90,
  },
  aggressive: {
    highTemp: 37,
    highHumidity: 88,
    lowSoilMoisture: 22,
    highEc: 2.9,
    autoDecision: true,
    unattendedMode: true,
    weatherLinkage: true,
    severeEscalation: true,
    anomalyWindow: 150,
  },
};

function createBasicSettings(currentUser) {
  return {
    name: currentUser.name,
    phone: currentUser.phone,
    park: currentUser.park,
    role: currentUser.role,
    email: `${currentUser.avatar.toLowerCase()}@smart-agri.local`,
    title: currentUser.role.split('/')[0].trim(),
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    defaultScope: currentUser.park,
    startPage: '首页',
    avatarTheme: 'emerald',
    compactDashboard: false,
    autoOpenAnalysis: true,
  };
}

function createRuleSettings() {
  return {
    highTemp: 35,
    highHumidity: 85,
    lowSoilMoisture: 25,
    highEc: 2.6,
    autoDecision: true,
    unattendedMode: false,
    weatherLinkage: true,
    severeEscalation: true,
    anomalyWindow: 120,
    notifyLevels: ['高', '中'],
  };
}

function createNotificationSettings() {
  return {
    inApp: true,
    sms: true,
    email: false,
    wecom: true,
    dailyReport: true,
    quietHoursEnabled: true,
    quietStart: '22:00',
    quietEnd: '06:30',
    escalationReceiver: '李建国',
    reportFrequency: '每日 18:00',
    lastTestChannel: '应用内通知',
  };
}

function createIntegrationServices() {
  return [
    {
      id: 'mqtt',
      name: '物联网 MQTT 网关',
      type: 'mqtt',
      icon: Database,
      endpoint: 'mqtt.agri-cloud.net:1883',
      status: 'connected',
      enabled: true,
      latency: '9ms',
      description: '接入环境传感器、阀门与水肥一体机。',
      credentialsVersion: 'v3',
      lastHeartbeat: '2026-04-03 10:25',
    },
    {
      id: 'weather',
      name: '气象局数据接口',
      type: 'api',
      icon: CloudRain,
      endpoint: 'https://weather.agri-cloud.net/v1/forecast',
      status: 'stopped',
      enabled: false,
      latency: '--',
      description: '获取未来 7 天天气并推算 ET0 与病害风险。',
      credentialsVersion: 'v1',
      lastHeartbeat: '未启用',
    },
    {
      id: 'sensor-cloud',
      name: '科研数据同步服务',
      type: 'sync',
      icon: Upload,
      endpoint: 'sync.smart-agri.local/research',
      status: 'connected',
      enabled: true,
      latency: '23ms',
      description: '同步表型、试验设计与多源采集数据。',
      credentialsVersion: 'v2',
      lastHeartbeat: '2026-04-03 09:58',
    },
  ];
}

function attachIntegrationIcons(services) {
  return services.map((service) => ({
    ...service,
    icon: integrationIconMap[service.id] ?? Database,
  }));
}

function createSecuritySettings() {
  return {
    retentionDays: 180,
    backupFrequency: '每日 02:00',
    backupCompression: true,
    mfaRequired: false,
    apiReadOnlyMode: false,
    sessionTimeout: 60,
    autoExportAlerts: true,
    tokenVersion: 'token-v4-20260403',
    lastBackup: '2026-04-03 02:00',
  };
}

function createOperationLogs() {
  return [
    { time: '2026-04-03 10:12', action: '保存报警规则', actor: '张秫瑄', result: '成功' },
    { time: '2026-04-03 09:40', action: '测试 MQTT 网关心跳', actor: '李建国', result: '成功' },
    { time: '2026-04-03 08:30', action: '关闭气象接口同步', actor: '王博', result: '成功' },
    { time: '2026-04-02 18:00', action: '生成日终分析报告', actor: '系统', result: '成功' },
  ];
}

function createOpsSettings() {
  return {
    maintenanceMode: false,
    maintenanceWindow: '周日 23:00 - 23:30',
    autoHealthCheck: true,
    auditActor: '全部',
    auditResult: '全部',
    logKeyword: '',
  };
}

function cloneSettingsBundle(bundle) {
  return {
    basicSettings: { ...bundle.basicSettings },
    ruleSettings: {
      ...bundle.ruleSettings,
      notifyLevels: [...bundle.ruleSettings.notifyLevels],
    },
    notificationSettings: { ...bundle.notificationSettings },
    integrationServices: bundle.integrationServices.map((service) => ({ ...service })),
    securitySettings: { ...bundle.securitySettings },
  };
}

function buildInitialSnapshots(currentUser) {
  const basicSettings = createBasicSettings(currentUser);
  const notificationSettings = createNotificationSettings();
  const integrationServices = createIntegrationServices();
  const securitySettings = createSecuritySettings();

  return [
    {
      id: 'baseline',
      name: '系统初始基线',
      time: '2026-04-03 08:00',
      status: '基线',
      payload: cloneSettingsBundle({
        basicSettings,
        ruleSettings: { ...createRuleSettings(), ...rulePresets.balanced },
        notificationSettings,
        integrationServices,
        securitySettings,
      }),
    },
    {
      id: 'research-safe',
      name: '科研保守模板',
      time: '2026-04-02 18:30',
      status: '推荐',
      payload: cloneSettingsBundle({
        basicSettings,
        ruleSettings: { ...createRuleSettings(), ...rulePresets.conservative },
        notificationSettings: {
          ...notificationSettings,
          email: true,
          reportFrequency: '每日 08:00',
        },
        integrationServices,
        securitySettings: {
          ...securitySettings,
          mfaRequired: true,
        },
      }),
    },
  ];
}

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export default function SettingsPage() {
  const { currentUser, showMessage, refreshUsers } = useAppShell();
  const [activeTab, setActiveTab] = useState('rules');
  const [basicSettings, setBasicSettings] = useState(() => createBasicSettings(currentUser));
  const [ruleSettings, setRuleSettings] = useState(createRuleSettings);
  const [notificationSettings, setNotificationSettings] = useState(createNotificationSettings);
  const [integrationServices, setIntegrationServices] = useState(createIntegrationServices);
  const [securitySettings, setSecuritySettings] = useState(createSecuritySettings);
  const [operationLogs, setOperationLogs] = useState(createOperationLogs);
  const [opsSettings, setOpsSettings] = useState(createOpsSettings);
  const [configSnapshots, setConfigSnapshots] = useState(() => buildInitialSnapshots(currentUser));
  const [lastRulePreset, setLastRulePreset] = useState('balanced');
  const [isLoading, setIsLoading] = useState(true);

  const applySettingsBundle = useCallback((settings) => {
    setBasicSettings(settings.basicSettings);
    setRuleSettings(settings.ruleSettings);
    setNotificationSettings(settings.notificationSettings);
    setIntegrationServices(attachIntegrationIcons(settings.integrationServices));
    setSecuritySettings(settings.securitySettings);
    setOperationLogs(settings.operationLogs);
    setConfigSnapshots(settings.configSnapshots);
    setLastRulePreset(settings.lastRulePreset ?? 'balanced');
    setOpsSettings((current) => ({
      ...current,
      ...settings.opsSettings,
    }));
  }, []);

  const loadSettings = useCallback(async ({ silent = false } = {}) => {
    try {
      setIsLoading(true);
      const settings = await fetchSettings(currentUser.id);
      applySettingsBundle(settings);
    } catch (error) {
      console.error('Failed to load settings', error);
      if (!silent) {
        showMessage('设置加载失败，已回退到本地默认配置');
      }
    } finally {
      setIsLoading(false);
    }
  }, [applySettingsBundle, currentUser.id, showMessage]);

  useEffect(() => {
    loadSettings({ silent: true });
  }, [loadSettings]);

  const settingsHealth = useMemo(() => {
    const enabledIntegrations = integrationServices.filter((item) => item.enabled).length;
    const notificationChannels = [
      notificationSettings.inApp,
      notificationSettings.sms,
      notificationSettings.email,
      notificationSettings.wecom,
    ].filter(Boolean).length;

    return {
      enabledIntegrations,
      notificationChannels,
      unattendedMode: ruleSettings.unattendedMode ? '已开启' : '人工确认',
      backupState: securitySettings.lastBackup,
    };
  }, [integrationServices, notificationSettings, ruleSettings.unattendedMode, securitySettings.lastBackup]);

  const filteredLogs = useMemo(() => {
    return operationLogs.filter((log) => {
      const actorMatched = opsSettings.auditActor === '全部' || log.actor === opsSettings.auditActor;
      const resultMatched = opsSettings.auditResult === '全部' || log.result === opsSettings.auditResult;
      const keywordMatched =
        opsSettings.logKeyword.trim() === '' ||
        `${log.action}${log.actor}${log.result}`.includes(opsSettings.logKeyword.trim());

      return actorMatched && resultMatched && keywordMatched;
    });
  }, [operationLogs, opsSettings.auditActor, opsSettings.auditResult, opsSettings.logKeyword]);

  const persistOpsSettings = useCallback(async (nextOpsSettings, successMessage) => {
    try {
      const settings = await saveOpsSettingsRequest(currentUser.id, currentUser.id, {
        maintenanceMode: nextOpsSettings.maintenanceMode,
        maintenanceWindow: nextOpsSettings.maintenanceWindow,
        autoHealthCheck: nextOpsSettings.autoHealthCheck,
      });
      applySettingsBundle(settings);
      showMessage(successMessage);
    } catch (error) {
      console.error('Failed to save ops settings', error);
      showMessage('运维配置保存失败');
      await loadSettings({ silent: true });
    }
  }, [applySettingsBundle, currentUser.id, loadSettings, showMessage]);

  const saveBasicSettings = async () => {
    try {
      const settings = await saveBasicSettingsRequest(currentUser.id, basicSettings);
      applySettingsBundle(settings);
      await refreshUsers?.(currentUser.id);
      showMessage('✅ 已保存个人资料与显示偏好');
    } catch (error) {
      console.error('Failed to save basic settings', error);
      showMessage('基本信息保存失败');
    }
  };

  const resetBasicSettings = async () => {
    await loadSettings();
    showMessage('已恢复当前账号的基础设置');
  };

  const applyRulePreset = (presetKey) => {
    setRuleSettings((current) => ({
      ...current,
      ...rulePresets[presetKey],
    }));
    setLastRulePreset(presetKey);
    showMessage(`已应用${presetKey === 'balanced' ? '平衡' : presetKey === 'conservative' ? '保守' : '激进'}规则模板`);
  };

  const saveRuleSettings = async () => {
    try {
      const settings = await saveRuleSettingsRequest(currentUser.id, currentUser.id, ruleSettings);
      applySettingsBundle(settings);
      showMessage('✅ 已保存报警阈值、决策规则与联动策略');
    } catch (error) {
      console.error('Failed to save rule settings', error);
      showMessage('规则配置保存失败');
    }
  };

  const testRuleSettings = async () => {
    try {
      const result = await simulateRuleSettingsRequest(currentUser.id, currentUser.id);
      applySettingsBundle(result.settings);
      showMessage(`已完成规则模拟：${result.simulationSummary}`);
    } catch (error) {
      console.error('Failed to simulate rule settings', error);
      showMessage('规则模拟失败');
    }
  };

  const resetRuleSettings = async () => {
    try {
      const settings = await saveRuleSettingsRequest(currentUser.id, currentUser.id, createRuleSettings());
      applySettingsBundle(settings);
      showMessage('已恢复默认报警与决策规则');
    } catch (error) {
      console.error('Failed to reset rule settings', error);
      showMessage('恢复默认规则失败');
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const settings = await saveNotificationSettingsRequest(currentUser.id, currentUser.id, notificationSettings);
      applySettingsBundle(settings);
      showMessage('✅ 已保存通知渠道、静默时段与日报策略');
    } catch (error) {
      console.error('Failed to save notification settings', error);
      showMessage('通知策略保存失败');
    }
  };

  const resetNotificationSettings = async () => {
    try {
      const settings = await saveNotificationSettingsRequest(currentUser.id, currentUser.id, createNotificationSettings());
      applySettingsBundle(settings);
      showMessage('已恢复默认通知策略');
    } catch (error) {
      console.error('Failed to reset notification settings', error);
      showMessage('恢复默认通知策略失败');
    }
  };

  const testNotification = async (channel) => {
    try {
      const settings = await testNotificationChannelRequest(currentUser.id, currentUser.id, channel);
      applySettingsBundle(settings);
      showMessage(`测试通知已发送到：${channel}`);
    } catch (error) {
      console.error('Failed to test notification channel', error);
      showMessage('通知测试失败');
    }
  };

  const toggleIntegration = async (id) => {
    try {
      const settings = await toggleIntegrationRequest(currentUser.id, currentUser.id, id);
      applySettingsBundle(settings);
      showMessage(`已更新 ${id === 'mqtt' ? 'MQTT 网关' : id === 'weather' ? '气象接口' : '科研同步服务'} 状态`);
    } catch (error) {
      console.error('Failed to toggle integration', error);
      showMessage('集成服务状态更新失败');
    }
  };

  const testIntegration = async (id) => {
    try {
      const settings = await testIntegrationRequest(currentUser.id, currentUser.id, id);
      applySettingsBundle(settings);
      showMessage(`已完成 ${id === 'mqtt' ? 'MQTT 网关' : id === 'weather' ? '气象接口' : '科研同步服务'} 连接测试`);
    } catch (error) {
      console.error('Failed to test integration', error);
      showMessage('集成服务连接测试失败');
    }
  };

  const rotateIntegrationKey = async (id) => {
    try {
      const settings = await rotateIntegrationKeyRequest(currentUser.id, currentUser.id, id);
      applySettingsBundle(settings);
      showMessage('已生成新的访问密钥版本');
    } catch (error) {
      console.error('Failed to rotate integration key', error);
      showMessage('访问密钥轮换失败');
    }
  };

  const saveSecuritySettings = async () => {
    try {
      const settings = await saveSecuritySettingsRequest(currentUser.id, currentUser.id, securitySettings);
      applySettingsBundle(settings);
      showMessage('✅ 已保存备份策略、会话安全与只读模式');
    } catch (error) {
      console.error('Failed to save security settings', error);
      showMessage('安全配置保存失败');
    }
  };

  const createBackup = async () => {
    try {
      const settings = await createBackupRequest(currentUser.id, currentUser.id);
      applySettingsBundle(settings);
      showMessage('已创建最新配置备份包');
    } catch (error) {
      console.error('Failed to create backup', error);
      showMessage('创建备份失败');
    }
  };

  const rotateToken = async () => {
    try {
      const settings = await rotateSecurityTokenRequest(currentUser.id, currentUser.id);
      applySettingsBundle(settings);
      showMessage('已生成新的 API Token 版本');
    } catch (error) {
      console.error('Failed to rotate token', error);
      showMessage('Token 轮换失败');
    }
  };

  const createConfigSnapshot = async () => {
    try {
      const settings = await createConfigSnapshotRequest(currentUser.id, currentUser.id);
      applySettingsBundle(settings);
      showMessage('✅ 已生成新的配置快照，可随时回滚');
    } catch (error) {
      console.error('Failed to create config snapshot', error);
      showMessage('配置快照创建失败');
    }
  };

  const restoreConfigSnapshot = async (snapshotId) => {
    try {
      const settings = await restoreConfigSnapshotRequest(currentUser.id, currentUser.id, snapshotId);
      applySettingsBundle(settings);
      showMessage('已恢复所选配置快照');
    } catch (error) {
      console.error('Failed to restore config snapshot', error);
      showMessage('配置快照恢复失败');
    }
  };

  const runHealthCheck = async () => {
    try {
      const settings = await runHealthCheckRequest(currentUser.id, currentUser.id);
      applySettingsBundle(settings);
      showMessage('已完成系统健康巡检，连接状态已刷新');
    } catch (error) {
      console.error('Failed to run health check', error);
      showMessage('系统健康检查失败');
    }
  };

  const toggleMaintenanceMode = async (checked) => {
    const nextOpsSettings = {
      ...opsSettings,
      maintenanceMode: checked,
    };
    setOpsSettings((current) => ({ ...current, maintenanceMode: checked }));
    await persistOpsSettings(
      nextOpsSettings,
      checked ? '维护模式已开启，建议暂停高风险写操作' : '维护模式已关闭，系统恢复常规运行',
    );
  };

  const toggleAutoHealthCheck = async (checked) => {
    const nextOpsSettings = {
      ...opsSettings,
      autoHealthCheck: checked,
    };
    setOpsSettings((current) => ({ ...current, autoHealthCheck: checked }));
    await persistOpsSettings(nextOpsSettings, checked ? '已开启每日自动健康巡检' : '已关闭每日自动健康巡检');
  };

  const updateMaintenanceWindow = async (value) => {
    const nextOpsSettings = {
      ...opsSettings,
      maintenanceWindow: value,
    };
    setOpsSettings((current) => ({ ...current, maintenanceWindow: value }));
    await persistOpsSettings(nextOpsSettings, '已更新维护窗口');
  };

  const exportSettingsPackage = async () => {
    try {
      const settings = await exportSettingsPackageRequest(currentUser.id, currentUser.id);
      applySettingsBundle(settings);
      showMessage('配置包已生成，可用于备份或迁移环境');
    } catch (error) {
      console.error('Failed to export settings package', error);
      showMessage('配置包导出失败');
    }
  };

  const archiveLogs = async () => {
    try {
      const settings = await archiveActivityLogsRequest(currentUser.id, currentUser.id);
      applySettingsBundle(settings);
      showMessage('已归档历史日志');
    } catch (error) {
      console.error('Failed to archive logs', error);
      showMessage('日志归档失败');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex h-full min-h-[56vh] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          正在加载系统设置...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm duration-500 md:flex-row">
      <div className="w-full border-b border-slate-100 bg-slate-50 p-6 md:w-72 md:border-b-0 md:border-r">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">配置总览</p>
          <div className="mt-4 space-y-3 text-sm">
            <OverviewRow label="启用集成" value={`${settingsHealth.enabledIntegrations} 项`} />
            <OverviewRow label="通知渠道" value={`${settingsHealth.notificationChannels} 条`} />
            <OverviewRow label="决策模式" value={settingsHealth.unattendedMode} />
            <OverviewRow label="最近备份" value={settingsHealth.backupState} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:flex-col">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border border-slate-200 bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50',
              ].join(' ')}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8">
        {activeTab === 'basic' ? (
          <div className="animate-in fade-in space-y-6" key={currentUser.id}>
            <SectionHeader
              title="基本信息与显示偏好"
              description="维护当前账号资料、默认园区、起始页与界面偏好。"
            />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold shadow-sm ${avatarThemes.find((item) => item.id === basicSettings.avatarTheme)?.className ?? avatarThemes[0].className}`}>
                    {currentUser.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">头像主题</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {avatarThemes.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setBasicSettings((current) => ({ ...current, avatarTheme: theme.id }))}
                          className={[
                            'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                            basicSettings.avatarTheme === theme.id ? theme.className : 'bg-slate-100 text-slate-600',
                          ].join(' ')}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField label="用户姓名" value={basicSettings.name} onChange={(value) => setBasicSettings((current) => ({ ...current, name: value }))} />
                  <FormField label="联系电话" value={basicSettings.phone} onChange={(value) => setBasicSettings((current) => ({ ...current, phone: value }))} />
                  <FormField label="联系邮箱" value={basicSettings.email} onChange={(value) => setBasicSettings((current) => ({ ...current, email: value }))} />
                  <FormField label="岗位称谓" value={basicSettings.title} onChange={(value) => setBasicSettings((current) => ({ ...current, title: value }))} />
                  <div className="md:col-span-2">
                    <FormField label="所属园区 / 机构" value={basicSettings.park} onChange={(value) => setBasicSettings((current) => ({ ...current, park: value }))} />
                  </div>
                  <SelectField
                    label="默认起始页"
                    value={basicSettings.startPage}
                    options={['首页', '棚室管理', '报警中心', '数据分析', '试验管理']}
                    onChange={(value) => setBasicSettings((current) => ({ ...current, startPage: value }))}
                  />
                  <SelectField
                    label="时区"
                    value={basicSettings.timezone}
                    options={['Asia/Shanghai', 'Asia/Seoul', 'UTC']}
                    onChange={(value) => setBasicSettings((current) => ({ ...current, timezone: value }))}
                  />
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={resetBasicSettings}
                    className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    恢复当前账号设置
                  </button>
                  <button
                    type="button"
                    onClick={saveBasicSettings}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Save size={16} /> 保存更改
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <Card title="界面偏好" description="配置进入系统后的默认体验。">
                  <ToggleRow
                    label="首页显示紧凑布局"
                    description="更适合大屏监控与多卡片概览。"
                    checked={basicSettings.compactDashboard}
                    onChange={(checked) => setBasicSettings((current) => ({ ...current, compactDashboard: checked }))}
                  />
                  <ToggleRow
                    label="进入系统后自动显示分析摘要"
                    description="用于快速查看最近 7 天关键指标。"
                    checked={basicSettings.autoOpenAnalysis}
                    onChange={(checked) => setBasicSettings((current) => ({ ...current, autoOpenAnalysis: checked }))}
                  />
                </Card>

                <Card title="当前账号摘要" description="便于确认当前工作身份与默认上下文。">
                  <SummaryPill label="系统角色" value={basicSettings.role} />
                  <SummaryPill label="默认园区" value={basicSettings.defaultScope} />
                  <SummaryPill label="起始页" value={basicSettings.startPage} />
                  <SummaryPill label="语言" value={basicSettings.language} />
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'rules' ? (
          <div className="animate-in fade-in space-y-6">
            <SectionHeader
              title="报警阈值与决策联动"
              description="配置环境阈值、异常窗口、AI 决策和联动执行边界。"
            />

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <PresetButton label="平衡模板" active={lastRulePreset === 'balanced'} onClick={() => applyRulePreset('balanced')} />
                <PresetButton label="保守模板" active={lastRulePreset === 'conservative'} onClick={() => applyRulePreset('conservative')} />
                <PresetButton label="激进模板" active={lastRulePreset === 'aggressive'} onClick={() => applyRulePreset('aggressive')} />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
                <div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="高温报警阈值 (°C)" type="number" value={String(ruleSettings.highTemp)} onChange={(value) => setRuleSettings((current) => ({ ...current, highTemp: Number(value) }))} />
                    <FormField label="高湿报警阈值 (%)" type="number" value={String(ruleSettings.highHumidity)} onChange={(value) => setRuleSettings((current) => ({ ...current, highHumidity: Number(value) }))} />
                    <FormField label="低水分阈值 (%)" type="number" value={String(ruleSettings.lowSoilMoisture)} onChange={(value) => setRuleSettings((current) => ({ ...current, lowSoilMoisture: Number(value) }))} />
                    <FormField label="高 EC 阈值 (mS/cm)" type="number" value={String(ruleSettings.highEc)} onChange={(value) => setRuleSettings((current) => ({ ...current, highEc: Number(value) }))} step="0.1" />
                    <FormField label="异常判定窗口 (分钟)" type="number" value={String(ruleSettings.anomalyWindow)} onChange={(value) => setRuleSettings((current) => ({ ...current, anomalyWindow: Number(value) }))} />
                    <SelectField
                      label="通知等级"
                      value={ruleSettings.notifyLevels.join(' / ')}
                      options={['高 / 中', '高', '高 / 中 / 低']}
                      onChange={(value) =>
                        setRuleSettings((current) => ({
                          ...current,
                          notifyLevels: value.split(' / '),
                        }))
                      }
                    />
                  </div>

                  <div className="mt-6 space-y-4">
                    <ToggleRow
                      label="低水分自动生成决策建议"
                      description="连续低于阈值时自动推送灌溉建议到首页与报警中心。"
                      checked={ruleSettings.autoDecision}
                      onChange={(checked) => setRuleSettings((current) => ({ ...current, autoDecision: checked }))}
                    />
                    <ToggleRow
                      label="启用天气联动校正"
                      description="结合未来 7 天天气与 ET0 自动修正阈值和补灌策略。"
                      checked={ruleSettings.weatherLinkage}
                      onChange={(checked) => setRuleSettings((current) => ({ ...current, weatherLinkage: checked }))}
                    />
                    <ToggleRow
                      label="高风险自动升级到负责人"
                      description="高风险事件直接升级到负责人并强制发送消息。"
                      checked={ruleSettings.severeEscalation}
                      onChange={(checked) => setRuleSettings((current) => ({ ...current, severeEscalation: checked }))}
                    />
                    <ToggleRow
                      label="全自动无人值守模式"
                      description="系统生成决策后直接执行设备联动，请谨慎启用。"
                      checked={ruleSettings.unattendedMode}
                      onChange={(checked) => setRuleSettings((current) => ({ ...current, unattendedMode: checked }))}
                      danger
                    />
                  </div>
                </div>

                <Card title="规则预览" description="当前策略将如何影响报警与决策流程。">
                  <SummaryPill label="温度报警" value={`>${ruleSettings.highTemp}°C`} />
                  <SummaryPill label="湿度报警" value={`>${ruleSettings.highHumidity}%`} />
                  <SummaryPill label="低水分判定" value={`<${ruleSettings.lowSoilMoisture}%`} />
                  <SummaryPill label="异常窗口" value={`${ruleSettings.anomalyWindow} 分钟`} />
                  <SummaryPill label="决策模式" value={ruleSettings.unattendedMode ? '自动执行' : '人工确认'} />
                  <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                    当前将向 {ruleSettings.notifyLevels.join('、')} 风险等级推送报警，并在{ruleSettings.autoDecision ? '满足低水分条件时自动生成建议' : '人工审核后再生成建议'}。
                  </div>
                </Card>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={resetRuleSettings} className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200">
                  恢复默认
                </button>
                <button type="button" onClick={testRuleSettings} className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                  模拟规则
                </button>
                <button type="button" onClick={saveRuleSettings} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
                  <Save size={16} /> 保存配置
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'notifications' ? (
          <div className="animate-in fade-in space-y-6">
            <SectionHeader
              title="通知策略与静默时段"
              description="按渠道控制消息分发，管理静默时段、升级路径和日报输出。"
            />

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  <NotificationChannelRow
                    icon={BellRing}
                    label="应用内通知"
                    description="用于驾驶舱、报警中心和设置页消息提醒。"
                    checked={notificationSettings.inApp}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, inApp: checked }))}
                    onTest={() => testNotification('应用内通知')}
                  />
                  <NotificationChannelRow
                    icon={Smartphone}
                    label="短信提醒"
                    description="适合高风险报警、停机和关键联动失败。"
                    checked={notificationSettings.sms}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, sms: checked }))}
                    onTest={() => testNotification('短信提醒')}
                  />
                  <NotificationChannelRow
                    icon={Mail}
                    label="邮件摘要"
                    description="每日/每周发送处理概况、异常统计和分析摘要。"
                    checked={notificationSettings.email}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, email: checked }))}
                    onTest={() => testNotification('邮件摘要')}
                  />
                  <NotificationChannelRow
                    icon={MessageSquare}
                    label="企业微信通知"
                    description="向园区运维群发送预警和日报。"
                    checked={notificationSettings.wecom}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, wecom: checked }))}
                    onTest={() => testNotification('企业微信通知')}
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField
                    label="日报发送时间"
                    value={notificationSettings.reportFrequency}
                    options={['每日 08:00', '每日 18:00', '每周一 09:00']}
                    onChange={(value) => setNotificationSettings((current) => ({ ...current, reportFrequency: value }))}
                  />
                  <FormField
                    label="升级接收人"
                    value={notificationSettings.escalationReceiver}
                    onChange={(value) => setNotificationSettings((current) => ({ ...current, escalationReceiver: value }))}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <ToggleRow
                    label="启用静默时段"
                    description="静默时段仅保留高风险报警与系统级故障通知。"
                    checked={notificationSettings.quietHoursEnabled}
                    onChange={(checked) => setNotificationSettings((current) => ({ ...current, quietHoursEnabled: checked }))}
                  />
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="静默开始" type="time" value={notificationSettings.quietStart} onChange={(value) => setNotificationSettings((current) => ({ ...current, quietStart: value }))} />
                    <FormField label="静默结束" type="time" value={notificationSettings.quietEnd} onChange={(value) => setNotificationSettings((current) => ({ ...current, quietEnd: value }))} />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={resetNotificationSettings} className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200">
                    恢复默认
                  </button>
                  <button type="button" onClick={saveNotificationSettings} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
                    <Save size={16} /> 保存策略
                  </button>
                </div>
              </div>

              <Card title="通知摘要" description="帮助确认当前渠道组合与最近测试结果。">
                <SummaryPill label="静默时段" value={notificationSettings.quietHoursEnabled ? `${notificationSettings.quietStart} - ${notificationSettings.quietEnd}` : '未启用'} />
                <SummaryPill label="升级接收人" value={notificationSettings.escalationReceiver} />
                <SummaryPill label="日报频率" value={notificationSettings.reportFrequency} />
                <SummaryPill label="最近测试" value={notificationSettings.lastTestChannel} />
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                  当前高风险事件将保留应用内 + 短信 + 企业微信三路通知，静默时段不拦截高等级消息。
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === 'integration' ? (
          <div className="animate-in fade-in space-y-6">
            <SectionHeader
              title="集成中心与连接健康度"
              description="管理设备网关、天气服务和科研数据同步服务，支持启停、测试和轮换密钥。"
            />

            <div className="space-y-5">
              {integrationServices.map((service) => (
                <div key={service.id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                        <service.icon size={18} className="text-emerald-600" /> {service.name}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{service.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                        <SummaryPill label="地址" value={service.endpoint} compact />
                        <SummaryPill label="延迟" value={service.latency} compact />
                        <SummaryPill label="凭证版本" value={service.credentialsVersion} compact />
                        <SummaryPill label="最近心跳" value={service.lastHeartbeat} compact />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <StatusPill status={service.status} />
                      <button
                        type="button"
                        onClick={() => toggleIntegration(service.id)}
                        className={[
                          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                          service.enabled ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'bg-emerald-600 text-white hover:bg-emerald-700',
                        ].join(' ')}
                      >
                        {service.enabled ? '停止服务' : '启用服务'}
                      </button>
                      <button type="button" onClick={() => testIntegration(service.id)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                        测试连接
                      </button>
                      <button type="button" onClick={() => rotateIntegrationKey(service.id)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                        轮换密钥
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'security' ? (
          <div className="animate-in fade-in space-y-6">
            <SectionHeader
              title="数据治理与访问安全"
              description="管理备份、会话、导出、令牌与操作日志。"
            />

            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="数据保留天数" type="number" value={String(securitySettings.retentionDays)} onChange={(value) => setSecuritySettings((current) => ({ ...current, retentionDays: Number(value) }))} />
                  <SelectField
                    label="备份频率"
                    value={securitySettings.backupFrequency}
                    options={['每日 02:00', '每日 03:00', '每周日 02:00']}
                    onChange={(value) => setSecuritySettings((current) => ({ ...current, backupFrequency: value }))}
                  />
                  <FormField label="会话超时 (分钟)" type="number" value={String(securitySettings.sessionTimeout)} onChange={(value) => setSecuritySettings((current) => ({ ...current, sessionTimeout: Number(value) }))} />
                  <FormField label="Token 版本" value={securitySettings.tokenVersion} onChange={(value) => setSecuritySettings((current) => ({ ...current, tokenVersion: value }))} />
                </div>

                <div className="mt-6 space-y-4">
                  <ToggleRow
                    label="启用压缩备份"
                    description="创建备份时自动压缩历史配置与日志。"
                    checked={securitySettings.backupCompression}
                    onChange={(checked) => setSecuritySettings((current) => ({ ...current, backupCompression: checked }))}
                  />
                  <ToggleRow
                    label="要求二次验证 (MFA)"
                    description="高风险配置变更需二次确认。"
                    checked={securitySettings.mfaRequired}
                    onChange={(checked) => setSecuritySettings((current) => ({ ...current, mfaRequired: checked }))}
                  />
                  <ToggleRow
                    label="API 只读模式"
                    description="启用后禁止外部 API 执行写操作。"
                    checked={securitySettings.apiReadOnlyMode}
                    onChange={(checked) => setSecuritySettings((current) => ({ ...current, apiReadOnlyMode: checked }))}
                  />
                  <ToggleRow
                    label="自动导出报警归档"
                    description="每日自动导出已闭环报警与处理记录。"
                    checked={securitySettings.autoExportAlerts}
                    onChange={(checked) => setSecuritySettings((current) => ({ ...current, autoExportAlerts: checked }))}
                  />
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={createBackup} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    立即备份
                  </button>
                  <button type="button" onClick={rotateToken} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    <KeyRound size={16} /> 轮换 Token
                  </button>
                  <button type="button" onClick={saveSecuritySettings} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
                    <Save size={16} /> 保存安全配置
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <Card title="备份与令牌摘要" description="查看当前备份状态与访问凭证信息。">
                  <SummaryPill label="最近备份" value={securitySettings.lastBackup} />
                  <SummaryPill label="备份频率" value={securitySettings.backupFrequency} />
                  <SummaryPill label="Token 版本" value={securitySettings.tokenVersion} />
                  <SummaryPill label="会话超时" value={`${securitySettings.sessionTimeout} 分钟`} />
                </Card>

                <Card title="最近操作日志" description="展示设置中心内的最近变更动作。">
                  <div className="space-y-3">
                    {operationLogs.map((log) => (
                      <div key={`${log.time}-${log.action}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-800">{log.action}</p>
                            <p className="mt-1 text-xs text-slate-500">{log.time} · {log.actor}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{log.result}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'ops' ? (
          <div className="animate-in fade-in space-y-6">
            <SectionHeader
              title="运维审计与配置快照"
              description="集中处理维护模式、系统巡检、配置快照与日志审计。"
            />

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <Card title="运维开关" description="用于系统维护、巡检与配置导出。">
                  <ToggleRow
                    label="维护模式"
                    description="开启后建议暂停高风险自动写操作，并仅保留必要联动。"
                    checked={opsSettings.maintenanceMode}
                    onChange={toggleMaintenanceMode}
                    danger={opsSettings.maintenanceMode}
                  />
                  <div className="mt-4" />
                  <ToggleRow
                    label="每日自动健康巡检"
                    description="每天检查网关延迟、接口心跳与同步服务状态。"
                    checked={opsSettings.autoHealthCheck}
                    onChange={toggleAutoHealthCheck}
                  />
                  <div className="mt-4">
                    <SelectField
                      label="维护窗口"
                      value={opsSettings.maintenanceWindow}
                      options={['周日 23:00 - 23:30', '周六 22:00 - 23:00', '每日 02:00 - 02:15']}
                      onChange={updateMaintenanceWindow}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={runHealthCheck}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <RefreshCw size={16} /> 执行健康检查
                    </button>
                    <button
                      type="button"
                      onClick={exportSettingsPackage}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Upload size={16} /> 导出配置包
                    </button>
                    <button
                      type="button"
                      onClick={createConfigSnapshot}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                      <Save size={16} /> 生成配置快照
                    </button>
                  </div>
                </Card>

                <Card title="配置快照" description="记录关键配置状态，支持一键回滚。">
                  <div className="space-y-3">
                    {configSnapshots.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-800">{snapshot.name}</p>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                {snapshot.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{snapshot.time}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => restoreConfigSnapshot(snapshot.id)}
                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <ArchiveRestore size={16} /> 恢复此快照
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="审计筛选" description="按操作人、结果和关键字快速定位最近变更。">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectField
                      label="操作人"
                      value={opsSettings.auditActor}
                      options={['全部', ...Array.from(new Set(operationLogs.map((log) => log.actor)))]}
                      onChange={(value) => setOpsSettings((current) => ({ ...current, auditActor: value }))}
                    />
                    <SelectField
                      label="执行结果"
                      value={opsSettings.auditResult}
                      options={['全部', ...Array.from(new Set(operationLogs.map((log) => log.result)))]}
                      onChange={(value) => setOpsSettings((current) => ({ ...current, auditResult: value }))}
                    />
                  </div>
                  <div className="mt-4">
                    <FormField
                      label="关键字检索"
                      value={opsSettings.logKeyword}
                      onChange={(value) => setOpsSettings((current) => ({ ...current, logKeyword: value }))}
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <SummaryPill label="日志总数" value={`${operationLogs.length} 条`} compact />
                    <SummaryPill label="筛选结果" value={`${filteredLogs.length} 条`} compact />
                    <SummaryPill label="配置快照" value={`${configSnapshots.length} 个`} compact />
                    <SummaryPill label="维护模式" value={opsSettings.maintenanceMode ? '开启' : '关闭'} compact />
                  </div>
                  <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={archiveLogs}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <History size={16} /> 归档历史日志
                    </button>
                  </div>
                </Card>

                <Card title="最近审计记录" description="保留设置中心内的最近关键操作轨迹。">
                  <div className="space-y-3">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <div key={`${log.time}-${log.action}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-800">{log.action}</p>
                              <p className="mt-1 text-xs text-slate-500">{log.time} · {log.actor}</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              {log.result}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        当前筛选条件下没有匹配的审计记录
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Card({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function OverviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function SummaryPill({ label, value, compact = false }) {
  return (
    <div className={compact ? 'rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600' : 'rounded-xl bg-slate-50 px-4 py-3 text-sm'}>
      <span className="text-slate-500">{label}：</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function PresetButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-sm font-medium transition-colors',
        active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange, danger = false }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-slate-800">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? (danger ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function NotificationChannelRow({ icon: Icon, label, description, checked, onChange, onTest }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Icon size={16} className="text-blue-600" /> {label}
          </div>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onTest} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            发送测试
          </button>
          <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    connected: 'bg-emerald-100 text-emerald-700',
    stopped: 'bg-slate-200 text-slate-600',
    running: 'bg-blue-100 text-blue-700',
    error: 'bg-rose-100 text-rose-700',
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${map[status] ?? map.stopped}`}>{status}</span>;
}

function FormField({ label, value, onChange, type = 'text', step }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
