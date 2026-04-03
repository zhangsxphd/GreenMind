const demoAlerts = [
  {
    id: 1,
    type: '环境报警',
    level: '高',
    time: '10:23',
    content: 'A区番茄棚夜间湿度超过85%，灰霉病风险极高',
    resolved: false,
    status: 'active',
    greenhouseName: null,
    resolutionNote: null,
  },
  {
    id: 2,
    type: '水肥预警',
    level: '中',
    time: '09:15',
    content: 'B区黄瓜棚基质水分低于阈值(25%)',
    resolved: false,
    status: 'active',
    greenhouseName: null,
    resolutionNote: null,
  },
  {
    id: 3,
    type: '设备报警',
    level: '低',
    time: '08:00',
    content: 'C区草莓棚2号土壤EC传感器离线',
    resolved: true,
    status: 'resolved',
    greenhouseName: null,
    resolutionNote: '已完成传感器线路复位',
  },
  {
    id: 4,
    type: '环境报警',
    level: '中',
    time: '昨天 14:20',
    content: 'B区黄瓜棚温度连续2小时高于32℃',
    resolved: true,
    status: 'resolved',
    greenhouseName: null,
    resolutionNote: '已调整通风策略',
  },
  {
    id: 5,
    type: '水肥预警',
    level: '低',
    time: '昨天 09:00',
    content: 'C区草莓棚A液肥罐液位偏低',
    resolved: true,
    status: 'resolved',
    greenhouseName: null,
    resolutionNote: '已补充液肥库存',
  },
  {
    id: 6,
    type: '设备报警',
    level: '高',
    time: '前天 18:30',
    content: 'A区番茄棚主水泵电流异常',
    resolved: true,
    status: 'resolved',
    greenhouseName: null,
    resolutionNote: '已完成泵体检修',
  },
];

const demoAlertIds = new Set(demoAlerts.map((item) => item.id));

export function getDemoAlerts() {
  return demoAlerts.map((item) => ({ ...item }));
}

export function mergeAlertWithDemo(item) {
  const demo = demoAlerts.find((alert) => alert.id === item.id);

  if (!demo) {
    return item;
  }

  return {
    ...item,
    ...demo,
    resolved: item.resolved ?? demo.resolved,
    status: item.status ?? demo.status,
    resolutionNote: item.resolutionNote ?? demo.resolutionNote,
    greenhouseName: demo.greenhouseName,
  };
}

export function buildVisibleAlerts(items = []) {
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return demoAlerts.map((demo) => {
    const liveItem = itemMap.get(demo.id);
    return liveItem ? mergeAlertWithDemo(liveItem) : { ...demo };
  });
}

export function resolveDemoAlerts(items, targetIds, resolutionNote = '已在报警中心完成处置') {
  const idSet = new Set(targetIds);

  return items.map((item) => {
    if (!idSet.has(item.id)) {
      return item;
    }

    return {
      ...item,
      resolved: true,
      status: 'resolved',
      resolutionNote: item.resolutionNote ?? resolutionNote,
    };
  });
}

export function getDemoAlertIds() {
  return new Set(demoAlertIds);
}
