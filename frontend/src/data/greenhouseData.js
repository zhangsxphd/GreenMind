export const demoGreenhouses = [
  {
    id: 1,
    name: 'A区番茄棚 (连栋)',
    crop: '番茄 (开花坐果期)',
    temp: 26.5,
    humidity: 75,
    soilMoisture: 24,
    ec: 2.1,
    status: 'warning',
    location: '江苏省设施农业创新示范基地 · A区',
    area: '1800㎡',
    manager: '李建国',
    deviceHealth: '6/6在线',
    waterStrategy: '滴灌 + 水肥一体机',
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
    location: '江苏省设施农业创新示范基地 · B区',
    area: '1200㎡',
    manager: '李建国',
    deviceHealth: '5/5在线',
    waterStrategy: '脉冲灌溉 + 通风联动',
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
    location: '南京高架草莓试验站 · C区',
    area: '950㎡',
    manager: '王博',
    deviceHealth: '4/5在线',
    waterStrategy: '营养液循环 + EC 闭环控制',
  },
];

const greenhouseDetailMap = {
  1: {
    lastService: '2026-04-02\n17:20',
    targets: {
      temp: '22–28° C',
      humidity: '60–75%',
      soilMoisture: '26–34%',
      ec: '1.8–2.3 mS/cm',
    },
    notes: ['夜间高湿需要优先联动顶窗与侧窗除湿。', '滴灌阀组建议维持早晚双峰补灌策略。'],
    trend: [
      { time: '06:00', temp: 25.2, humidity: 80, soilMoisture: 26, ec: 2.2 },
      { time: '08:00', temp: 26.1, humidity: 78, soilMoisture: 25, ec: 2.2 },
      { time: '10:00', temp: 26.7, humidity: 76, soilMoisture: 24, ec: 2.1 },
      { time: '12:00', temp: 27.9, humidity: 73, soilMoisture: 23, ec: 2.1 },
      { time: '15:00', temp: 28.6, humidity: 71, soilMoisture: 22, ec: 2.1 },
      { time: '18:00', temp: 27.1, humidity: 76, soilMoisture: 24, ec: 2.1 },
    ],
    recentCommands: [
      { id: '1-1', time: '09:48', description: '完成雾化降温巡检', status: '已完成' },
      { id: '1-2', time: '08:35', description: '复核滴灌支路压力', status: '执行中' },
    ],
    devices: {
      irrigation: false,
      ventilation: 35,
      nutrientPump: true,
      fillLight: false,
      shadeScreen: 20,
    },
  },
  2: {
    lastService: '2026-04-03\n08:20',
    targets: {
      temp: '24–29° C',
      humidity: '58–72%',
      soilMoisture: '28–36%',
      ec: '1.6–2.0 mS/cm',
    },
    notes: ['白天蒸腾较强，宜采用短频快补灌。', '高温时优先顶侧通风，避免湿帘长时联动带来病害压力。'],
    trend: [
      { time: '06:00', temp: 24.8, humidity: 69, soilMoisture: 34, ec: 1.9 },
      { time: '08:00', temp: 26.2, humidity: 67, soilMoisture: 33, ec: 1.9 },
      { time: '10:00', temp: 27.4, humidity: 65, soilMoisture: 32, ec: 1.8 },
      { time: '12:00', temp: 28.6, humidity: 63, soilMoisture: 31, ec: 1.8 },
      { time: '15:00', temp: 29.1, humidity: 61, soilMoisture: 30, ec: 1.8 },
      { time: '18:00', temp: 27.5, humidity: 64, soilMoisture: 31, ec: 1.8 },
    ],
    recentCommands: [
      { id: '2-1', time: '09:20', description: '开启顶部通风 35%', status: '已完成' },
      { id: '2-2', time: '07:10', description: '低阈值自动灌溉 15 分钟', status: '已完成' },
    ],
    devices: {
      irrigation: false,
      ventilation: 35,
      nutrientPump: true,
      fillLight: false,
      shadeScreen: 10,
    },
  },
  3: {
    lastService: '2026-04-03\n08:16',
    targets: {
      temp: '18–24° C',
      humidity: '55–68%',
      soilMoisture: '24–32%',
      ec: '1.1–1.5 mS/cm',
    },
    notes: ['高架草莓对夜间温光联动更敏感。', '建议优先保障 EC 传感器冗余与营养液循环稳定。'],
    trend: [
      { time: '06:00', temp: 20.8, humidity: 64, soilMoisture: 29, ec: 1.3 },
      { time: '08:00', temp: 21.6, humidity: 62, soilMoisture: 29, ec: 1.3 },
      { time: '10:00', temp: 22.4, humidity: 60, soilMoisture: 28, ec: 1.2 },
      { time: '12:00', temp: 23.2, humidity: 58, soilMoisture: 27, ec: 1.2 },
      { time: '15:00', temp: 23.9, humidity: 57, soilMoisture: 27, ec: 1.2 },
      { time: '18:00', temp: 22.5, humidity: 60, soilMoisture: 28, ec: 1.2 },
    ],
    recentCommands: [
      { id: '3-1', time: '08:16', description: 'EC 传感器离线恢复', status: '已完成' },
      { id: '3-2', time: '07:40', description: '营养液补给 12 分钟', status: '已完成' },
    ],
    devices: {
      irrigation: true,
      ventilation: 20,
      nutrientPump: true,
      fillLight: true,
      shadeScreen: 0,
    },
  },
};

const demoGreenhouseIds = new Set(demoGreenhouses.map((item) => item.id));

function cloneTrend(trend) {
  return trend.map((item) => ({ ...item }));
}

function cloneCommands(commands) {
  return commands.map((item) => ({ ...item }));
}

function createDefaultGreenhouseDetail(greenhouse) {
  return {
    ...greenhouse,
    lastService: '尚未记录',
    targets: {
      temp: '待配置',
      humidity: '待配置',
      soilMoisture: '待配置',
      ec: '待配置',
    },
    notes: ['请先补充设备台账与控制策略。', '新增棚室后建议完成一次传感器校准。'],
    trend: [
      { time: '06:00', temp: greenhouse.temp, humidity: greenhouse.humidity, soilMoisture: greenhouse.soilMoisture + 1, ec: greenhouse.ec },
      { time: '09:00', temp: greenhouse.temp + 0.6, humidity: greenhouse.humidity - 1, soilMoisture: greenhouse.soilMoisture, ec: greenhouse.ec },
      { time: '12:00', temp: greenhouse.temp + 1.2, humidity: greenhouse.humidity - 3, soilMoisture: greenhouse.soilMoisture - 1, ec: greenhouse.ec },
      { time: '15:00', temp: greenhouse.temp + 0.8, humidity: greenhouse.humidity - 2, soilMoisture: greenhouse.soilMoisture - 1, ec: greenhouse.ec },
    ],
    recentCommands: [{ id: `new-${greenhouse.id}-1`, time: '刚刚', description: '棚室已创建，等待配置控制策略', status: '待处理' }],
    devices: {
      irrigation: false,
      ventilation: 0,
      nutrientPump: false,
      fillLight: false,
      shadeScreen: 0,
    },
  };
}

export function getDemoGreenhouses() {
  return demoGreenhouses.map((item) => ({ ...item }));
}

export function getDemoGreenhouseSummary(greenhouseId) {
  const greenhouse = demoGreenhouses.find((item) => item.id === greenhouseId);
  return greenhouse ? { ...greenhouse } : null;
}

export function getDemoGreenhouseDetail(greenhouseId) {
  const greenhouse = getDemoGreenhouseSummary(greenhouseId);
  const detail = greenhouseDetailMap[greenhouseId];

  if (!greenhouse) {
    return null;
  }

  if (!detail) {
    return createDefaultGreenhouseDetail(greenhouse);
  }

  return {
    ...greenhouse,
    ...detail,
    targets: { ...detail.targets },
    notes: [...detail.notes],
    trend: cloneTrend(detail.trend),
    recentCommands: cloneCommands(detail.recentCommands),
    devices: { ...detail.devices },
  };
}

export function mergeGreenhouseSummaryWithDemo(item) {
  const demo = getDemoGreenhouseSummary(item.id);

  if (!demo) {
    return item;
  }

  return {
    ...demo,
    ...item,
    name: demo.name,
    crop: demo.crop,
    location: demo.location,
    area: demo.area,
    manager: demo.manager,
    deviceHealth: demo.deviceHealth,
    waterStrategy: demo.waterStrategy,
  };
}

export function mergeGreenhouseDetailWithDemo(item) {
  const demo = getDemoGreenhouseDetail(item.id);

  if (!demo) {
    return item;
  }

  return {
    ...item,
    ...demo,
    name: demo.name,
    crop: demo.crop,
    location: demo.location,
    area: demo.area,
    manager: demo.manager,
    deviceHealth: demo.deviceHealth,
    waterStrategy: demo.waterStrategy,
    lastService: demo.lastService,
    targets: { ...demo.targets },
    notes: [...demo.notes],
    trend: cloneTrend(demo.trend),
    recentCommands: cloneCommands(demo.recentCommands),
    devices: item.devices ? { ...demo.devices, ...item.devices } : { ...demo.devices },
  };
}

export function buildVisibleGreenhouses(items = [], additionalIds = []) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const extraIdSet = new Set(additionalIds);

  const visibleDemos = demoGreenhouses.map((greenhouse) => {
    const liveItem = itemMap.get(greenhouse.id);
    return liveItem ? mergeGreenhouseSummaryWithDemo(liveItem) : { ...greenhouse };
  });

  const extraItems = items
    .filter((item) => !demoGreenhouseIds.has(item.id) && extraIdSet.has(item.id))
    .map((item) => ({ ...item }));

  return [...visibleDemos, ...extraItems];
}
