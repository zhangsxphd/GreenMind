export const analysisMetricOptions = [
  { key: 'waterUsage', label: '耗水量', unit: 'm³', color: 'bg-blue-500', textColor: 'text-blue-600', description: '追踪灌溉与补液总量' },
  { key: 'envCompliance', label: '环境达标率', unit: '%', color: 'bg-emerald-500', textColor: 'text-emerald-600', description: '评估温湿度与基质状态稳定性' },
  { key: 'riskEvents', label: '预警数量', unit: '次', color: 'bg-rose-500', textColor: 'text-rose-600', description: '统计高频风险事件分布' },
  { key: 'energyIntensity', label: '能耗强度', unit: 'kWh', color: 'bg-amber-500', textColor: 'text-amber-600', description: '观察设备运行能耗趋势' },
];

export const analysisScopes = [
  {
    id: 'park-overview',
    label: '全园区',
    summaryCards: [
      { label: '温度达标率', value: '82%', trend: '+3.4%', tone: 'emerald' },
      { label: '预警处置率', value: '89%', trend: '+5件已闭环', tone: 'blue' },
      { label: 'AI建议执行率', value: '76%', trend: '+12%', tone: 'violet' },
      { label: '单位产出耗水', value: '18.4 L/kg', trend: '-1.7%', tone: 'amber' },
    ],
    series: {
      waterUsage: [45.2, 52.8, 38.5, 65.1, 48, 55.4, 42.6],
      envCompliance: [78, 81, 79, 75, 84, 86, 82],
      riskEvents: [3, 2, 4, 3, 2, 1, 3],
      energyIntensity: [118, 124, 110, 132, 121, 126, 119],
    },
    axisLabels: ['03-28', '03-29', '03-30', '03-31', '04-01', '04-02', '04-03'],
    efficiency: [
      { label: '水分利用率 (WUE)', score: '优秀', percent: 85, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
      { label: '肥料偏生产力 (PFP)', score: '良好', percent: 72, color: 'bg-blue-500', textColor: 'text-blue-600' },
      { label: '环境达标率', score: '需改善', percent: 58, color: 'bg-amber-400', textColor: 'text-amber-500' },
    ],
    comparisonTitle: '棚室绩效排行',
    comparisonRows: [
      { name: 'A区番茄棚', primary: 'WUE 85%', secondary: 'AI执行率 92%', score: 88, tag: '控湿优先' },
      { name: 'B区黄瓜棚', primary: '环境达标 79%', secondary: '处置闭环 95%', score: 83, tag: '通风稳定' },
      { name: 'C区草莓棚', primary: 'EC稳定 81%', secondary: '异常设备 1项', score: 78, tag: '补传感器冗余' },
      { name: 'H区番茄棚2号', primary: '预警 3次', secondary: '土壤水分偏低', score: 69, tag: '需补灌' },
    ],
    risks: [
      { level: '高', title: 'A区番茄棚夜间高湿', time: '04-03 10:23', owner: '李建国', action: '建议优先联动顶侧通风和除湿策略' },
      { level: '中', title: 'B区黄瓜棚基质水分低于阈值', time: '04-03 09:15', owner: '李建国', action: '建议执行 15-20 分钟短脉冲补灌' },
      { level: '中', title: 'D区育苗棚夜温偏低', time: '04-03 06:45', owner: '王博', action: '建议开启保温幕并提高清晨热风机阈值' },
      { level: '低', title: 'C区草莓棚 EC 传感器恢复后待复核', time: '04-03 08:16', owner: '王博', action: '建议复测 2 轮并记录偏差' },
    ],
    recommendations: [
      '将 A 区番茄棚夜间通风策略由单阈值调整为湿度 + 露点双阈值联动。',
      '对 H 区番茄棚 2 号启用 AI 辅助补灌策略，优先降低连续低水分风险。',
      '对高频预警棚室建立每周一次的设备巡检和阈值校准机制。',
    ],
  },
  {
    id: 'greenhouse-tomato',
    label: 'A区番茄棚',
    summaryCards: [
      { label: '温度达标率', value: '79%', trend: '+1.8%', tone: 'emerald' },
      { label: '高湿时长', value: '3.5h', trend: '-0.6h', tone: 'blue' },
      { label: 'AI建议响应', value: '92%', trend: '2条待确认', tone: 'violet' },
      { label: '单位面积耗水', value: '2.9 m³/亩', trend: '+0.3', tone: 'amber' },
    ],
    series: {
      waterUsage: [6.8, 7.2, 5.9, 8.1, 6.4, 7.5, 6.1],
      envCompliance: [72, 75, 74, 68, 78, 80, 79],
      riskEvents: [1, 1, 2, 1, 2, 1, 2],
      energyIntensity: [22, 24, 21, 28, 23, 27, 25],
    },
    axisLabels: ['03-28', '03-29', '03-30', '03-31', '04-01', '04-02', '04-03'],
    efficiency: [
      { label: '滴灌水分利用率', score: '良好', percent: 78, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
      { label: '夜间环境稳定性', score: '需改善', percent: 61, color: 'bg-amber-400', textColor: 'text-amber-500' },
      { label: '设备响应效率', score: '优秀', percent: 91, color: 'bg-blue-500', textColor: 'text-blue-600' },
    ],
    comparisonTitle: '关键子系统拆解',
    comparisonRows: [
      { name: '滴灌阀组', primary: '今日累计 2.4 m³', secondary: '响应时延 0.8s', score: 92, tag: '稳定' },
      { name: '顶侧通风', primary: '夜间启停 4 次', secondary: '高湿削减 12%', score: 74, tag: '需优化联动' },
      { name: '遮阳保温幕', primary: '清晨闭合 1 次', secondary: '温差缓冲 1.4°C', score: 81, tag: '表现正常' },
      { name: '补光系统', primary: '未启用', secondary: '对夜间策略无影响', score: 66, tag: '可评估必要性' },
    ],
    risks: [
      { level: '高', title: '夜间高湿持续 2 小时', time: '04-03 10:23', owner: '李建国', action: '建议提高夜间最低通风角度至 18%' },
      { level: '中', title: '基质水分连续逼近下限', time: '04-03 09:40', owner: 'AI决策引擎', action: '建议执行 20 分钟滴灌建议' },
      { level: '低', title: '清晨棚内温差偏大', time: '04-02 06:20', owner: '王博', action: '建议复核保温幕开闭时机' },
    ],
    recommendations: [
      '建立夜间湿度超阈值后的分阶段除湿策略，避免一次性大幅开窗。',
      '将早晨第一轮补灌提前 15 分钟，以减少 10:00 前低水分风险。',
      '结合果实负载情况重新标定滴灌触发阈值，提高 WUE。',
    ],
  },
  {
    id: 'greenhouse-cucumber',
    label: 'B区黄瓜棚',
    summaryCards: [
      { label: '温度达标率', value: '84%', trend: '+2.1%', tone: 'emerald' },
      { label: '补灌及时率', value: '91%', trend: '+1次自动触发', tone: 'blue' },
      { label: '病害风险指数', value: '中', trend: '稳定', tone: 'violet' },
      { label: '单位面积耗水', value: '2.5 m³/亩', trend: '-0.2', tone: 'amber' },
    ],
    series: {
      waterUsage: [5.9, 6.4, 5.6, 6.8, 6.2, 6.5, 6.1],
      envCompliance: [80, 82, 79, 83, 85, 86, 84],
      riskEvents: [1, 1, 1, 2, 1, 1, 1],
      energyIntensity: [18, 19, 17, 21, 18, 20, 19],
    },
    axisLabels: ['03-28', '03-29', '03-30', '03-31', '04-01', '04-02', '04-03'],
    efficiency: [
      { label: '脉冲灌溉效率', score: '优秀', percent: 83, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
      { label: '通风调控效率', score: '良好', percent: 77, color: 'bg-blue-500', textColor: 'text-blue-600' },
      { label: '环境稳定性', score: '良好', percent: 74, color: 'bg-amber-400', textColor: 'text-amber-500' },
    ],
    comparisonTitle: '控制策略拆解',
    comparisonRows: [
      { name: '脉冲灌溉', primary: '日均 5 次', secondary: '单次 12-15 分钟', score: 87, tag: '稳定' },
      { name: '顶部通风', primary: '平均开度 35%', secondary: '湿度削减 9%', score: 79, tag: '适中' },
      { name: '病害监测', primary: '风险 1 次', secondary: '闭环 100%', score: 90, tag: '表现优秀' },
    ],
    risks: [
      { level: '中', title: '基质水分接近下限', time: '04-03 09:15', owner: 'AI决策引擎', action: '建议自动补灌 15 分钟' },
      { level: '低', title: '午后温度短时上扬', time: '04-02 14:20', owner: '李建国', action: '建议保留 20% 顶窗开度' },
    ],
    recommendations: [
      '保持脉冲灌溉频次，但缩短单次时长以减少基质波动。',
      '将病害高风险时段的通风策略前移到 13:30。',
      '针对晴热天单独建立一套高温高湿双控策略。',
    ],
  },
  {
    id: 'greenhouse-strawberry',
    label: 'C区草莓棚',
    summaryCards: [
      { label: '温度达标率', value: '88%', trend: '+4.2%', tone: 'emerald' },
      { label: '营养液稳定度', value: '81%', trend: 'EC已恢复', tone: 'blue' },
      { label: '补光策略命中', value: '73%', trend: '+1次优化', tone: 'violet' },
      { label: '单位面积耗水', value: '1.8 m³/亩', trend: '-0.1', tone: 'amber' },
    ],
    series: {
      waterUsage: [4.2, 4.6, 4.1, 4.9, 4.4, 4.7, 4.3],
      envCompliance: [83, 85, 87, 84, 88, 89, 88],
      riskEvents: [1, 0, 1, 1, 0, 1, 1],
      energyIntensity: [15, 16, 15, 17, 16, 16, 15],
    },
    axisLabels: ['03-28', '03-29', '03-30', '03-31', '04-01', '04-02', '04-03'],
    efficiency: [
      { label: '营养液循环效率', score: '良好', percent: 79, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
      { label: '补光利用效率', score: '良好', percent: 75, color: 'bg-blue-500', textColor: 'text-blue-600' },
      { label: '设备健康度', score: '需关注', percent: 68, color: 'bg-amber-400', textColor: 'text-amber-500' },
    ],
    comparisonTitle: '试验站运维拆解',
    comparisonRows: [
      { name: '营养液泵组', primary: '循环 6 次', secondary: 'EC 波动 ±0.12', score: 82, tag: '稳定' },
      { name: '补光系统', primary: '夜间补光 2 小时', secondary: '糖度预测 +0.4', score: 76, tag: '可继续优化' },
      { name: '传感器冗余', primary: 'EC 传感器 1 个离线史', secondary: '建议增加备件', score: 64, tag: '需补齐' },
    ],
    risks: [
      { level: '中', title: 'EC 传感器离线后待稳定性复核', time: '04-03 08:16', owner: '王博', action: '建议记录未来 24 小时偏差曲线' },
      { level: '低', title: '夜间补光窗口仍有优化空间', time: '04-02 21:30', owner: 'AI分析模块', action: '建议缩短无效补光区间 30 分钟' },
    ],
    recommendations: [
      '建立 EC 传感器冗余与巡检清单，避免单点失效影响试验连续性。',
      '将补光与夜间温度策略联动，提高温光耦合控制效率。',
      '围绕草莓糖度与膨大期建立周度分析模板。',
    ],
  },
];
