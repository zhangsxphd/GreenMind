export const mockUsers = [
  {
    id: 1,
    name: '张秫瑄',
    role: '首席研究员 / 超级管理员',
    park: '江苏省设施农业创新示范基地',
    avatar: '张',
    phone: '17512573435',
  },
  {
    id: 2,
    name: '李建国',
    role: '温室技术总监',
    park: '国家农业科技园区 (A区)',
    avatar: '李',
    phone: '139****1234',
  },
  {
    id: 3,
    name: '王博',
    role: '巡检试验员',
    park: '南京高架草莓试验站',
    avatar: '王',
    phone: '150****5678',
  },
];

export const kpiData = {
  totalGreenhouses: 12,
  onlineDevices: 45,
  activeAlerts: 3,
  todayIrrigations: 8,
};

export const mockAlerts = [
  {
    id: 1,
    time: '10:23',
    type: '环境报警',
    level: '高',
    content: 'A区番茄棚夜间湿度超过85%，灰霉病风险极高',
    resolved: false,
  },
  {
    id: 2,
    time: '09:15',
    type: '水肥预警',
    level: '中',
    content: 'B区黄瓜棚基质水分低于阈值(25%)',
    resolved: false,
  },
  {
    id: 3,
    time: '08:00',
    type: '设备报警',
    level: '低',
    content: 'C区草莓棚2号土壤EC传感器离线',
    resolved: true,
  },
];

export const extendedAlerts = [
  ...mockAlerts,
  {
    id: 4,
    time: '昨天 14:20',
    type: '环境报警',
    level: '中',
    content: 'B区黄瓜棚温度连续2小时高于32℃',
    resolved: true,
  },
  {
    id: 5,
    time: '昨天 09:00',
    type: '水肥预警',
    level: '低',
    content: 'C区草莓棚A液肥罐液位偏低',
    resolved: true,
  },
  {
    id: 6,
    time: '前天 18:30',
    type: '设备报警',
    level: '高',
    content: 'A区番茄棚主水泵电流异常',
    resolved: true,
  },
];

export const mockDecisions = [
  {
    id: 101,
    greenhouse: 'A区番茄棚',
    type: '灌溉建议',
    action: '开启滴灌 20 分钟',
    confidence: '95%',
    reason: '基质含水率连续2小时低于25%，且当前光照辐射强，蒸散需求高。',
    status: 'pending',
  },
  {
    id: 102,
    greenhouse: 'B区黄瓜棚',
    type: '环境调控',
    action: '开启顶侧通风，降湿',
    confidence: '88%',
    reason: '当前湿度88%，且外界温度适宜，通风可有效降低病害风险。',
    status: 'approved',
  },
];

export const mockGreenhouses = [
  {
    id: 1,
    name: 'A区番茄棚 (连栋)',
    crop: '番茄 (开花坐果期)',
    temp: 26.5,
    humidity: 75,
    soilMoisture: 24,
    ec: 2.1,
    status: 'warning',
  },
  {
    id: 2,
    name: 'B区黄瓜棚 (日光)',
    crop: '黄瓜 (结瓜期)',
    temp: 28,
    humidity: 65,
    soilMoisture: 32,
    ec: 1.8,
    status: 'normal',
  },
  {
    id: 3,
    name: 'C区草莓棚 (高架)',
    crop: '草莓 (膨大期)',
    temp: 22.5,
    humidity: 60,
    soilMoisture: 28,
    ec: 1.2,
    status: 'normal',
  },
];

export const analysisWeekData = [
  { date: '03-28', value: 45.2 },
  { date: '03-29', value: 52.8 },
  { date: '03-30', value: 38.5 },
  { date: '03-31', value: 65.1 },
  { date: '04-01', value: 48.0 },
  { date: '04-02', value: 55.4 },
  { date: '04-03', value: 42.6 },
];

export const resourceEfficiency = [
  { label: '水分利用率 (WUE)', score: '优秀', width: '85%', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  { label: '肥料偏生产力 (PFP)', score: '良好', width: '72%', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { label: '环境达标率 (温度/湿度)', score: '需改善', width: '58%', color: 'bg-amber-400', textColor: 'text-amber-500' },
];

export const initialExperiments = [
  {
    id: 1,
    name: '不同灌溉下限对番茄产量及WUE的影响',
    crop: '番茄',
    treatments: 4,
    replicates: 3,
    status: '进行中',
    date: '2026-03-01',
    aiEnabled: false,
  },
  {
    id: 2,
    name: '高架草莓夜间温光耦合调控试验',
    crop: '草莓',
    treatments: 3,
    replicates: 4,
    status: '已归档',
    date: '2025-11-15',
    aiEnabled: false,
  },
];
