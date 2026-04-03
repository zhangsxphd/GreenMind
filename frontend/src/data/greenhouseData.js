function buildTrend(greenhouse) {
  const offsets = [
    { time: '06:00', temp: -1.3, humidity: 5, soilMoisture: 2.2, ec: 0.1 },
    { time: '08:00', temp: -0.4, humidity: 3, soilMoisture: 1.2, ec: 0.1 },
    { time: '10:00', temp: 0.2, humidity: 1, soilMoisture: 0.4, ec: 0.05 },
    { time: '12:00', temp: 1.4, humidity: -2, soilMoisture: -0.8, ec: 0.05 },
    { time: '15:00', temp: 2.1, humidity: -4, soilMoisture: -1.6, ec: 0 },
    { time: '18:00', temp: 0.6, humidity: 1, soilMoisture: -0.4, ec: 0 },
  ];

  return offsets.map((offset) => ({
    time: offset.time,
    temp: Number((greenhouse.temp + offset.temp).toFixed(1)),
    humidity: Math.max(35, Math.round(greenhouse.humidity + offset.humidity)),
    soilMoisture: Math.max(10, Math.round(greenhouse.soilMoisture + offset.soilMoisture)),
    ec: Number((greenhouse.ec + offset.ec).toFixed(1)),
  }));
}

export const greenhouseProfiles = {
  1: {
    location: '江苏省设施农业创新示范基地 · A区',
    area: '1800㎡',
    manager: '李建国',
    deviceHealth: '6/6在线',
    waterStrategy: '滴灌 + 水肥一体机',
    lastService: '2026-04-02 17:20',
    targets: {
      temp: '22-28°C',
      humidity: '60-75%',
      soilMoisture: '26-34%',
      ec: '1.8-2.3 mS/cm',
    },
    notes: ['夜间高湿需要优先联动顶窗与侧窗除湿。', '滴灌阀组建议维持早晚双峰补灌策略。'],
    recentCommands: [
      { time: '09:48', description: '完成雾化降温巡检', status: '已完成' },
      { time: '08:35', description: '复核滴灌支路压力', status: '执行中' },
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
    location: '江苏省设施农业创新示范基地 · B区',
    area: '1200㎡',
    manager: '李建国',
    deviceHealth: '5/5在线',
    waterStrategy: '脉冲灌溉 + 通风联动',
    lastService: '2026-04-03 08:20',
    targets: {
      temp: '24-29°C',
      humidity: '58-72%',
      soilMoisture: '28-36%',
      ec: '1.6-2.0 mS/cm',
    },
    notes: ['白天蒸腾较强，宜采用短频快补灌。', '高温时优先顶侧通风，避免连开湿帘造成病害压力。'],
    recentCommands: [
      { time: '09:20', description: '开启顶部通风 35%', status: '已完成' },
      { time: '07:10', description: '低阈值自动灌溉 15 分钟', status: '已完成' },
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
    location: '南京高架草莓试验站 · C区',
    area: '950㎡',
    manager: '王博',
    deviceHealth: '4/5在线',
    waterStrategy: '营养液循环 + EC 闭环控制',
    lastService: '2026-04-03 08:16',
    targets: {
      temp: '18-24°C',
      humidity: '55-68%',
      soilMoisture: '24-32%',
      ec: '1.1-1.5 mS/cm',
    },
    notes: ['高架草莓对夜间温光联动更敏感。', '建议优先保障 EC 传感器冗余。'],
    recentCommands: [
      { time: '08:16', description: 'EC 传感器离线恢复', status: '已完成' },
      { time: '07:40', description: '营养液补给 12 分钟', status: '已完成' },
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

export function createDefaultGreenhouseProfile(greenhouse) {
  return {
    location: '新接入棚室',
    area: '待完善',
    manager: '待分配',
    deviceHealth: '0/0在线',
    waterStrategy: '待配置',
    lastService: '尚未记录',
    targets: {
      temp: '待配置',
      humidity: '待配置',
      soilMoisture: '待配置',
      ec: '待配置',
    },
    notes: ['请先补充设备台账与控制策略。', '新增棚室后建议完成一次传感器校准。'],
    recentCommands: [{ time: '刚刚', description: '棚室已创建，等待配置控制策略', status: '待处理' }],
    devices: {
      irrigation: false,
      ventilation: 0,
      nutrientPump: false,
      fillLight: false,
      shadeScreen: 0,
    },
    trend: buildTrend(greenhouse),
  };
}

export function getInitialGreenhouseProfiles(greenhouses) {
  return greenhouses.reduce((result, greenhouse) => {
    const profile = greenhouseProfiles[greenhouse.id] ?? createDefaultGreenhouseProfile(greenhouse);
    result[greenhouse.id] = {
      ...profile,
      trend: profile.trend ?? buildTrend(greenhouse),
    };
    return result;
  }, {});
}
