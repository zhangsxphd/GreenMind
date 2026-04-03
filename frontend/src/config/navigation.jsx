import {
  AlertTriangle,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  Settings,
  Sprout,
} from 'lucide-react';

export const navItems = [
  { path: '/', icon: LayoutDashboard, label: '首页', title: '首页', end: true },
  { path: '/greenhouses', icon: Sprout, label: '棚室管理', title: '棚室管理', end: false },
  { path: '/alerts', icon: AlertTriangle, label: '报警中心', title: '报警中心', end: false },
  { path: '/analysis', icon: LineChart, label: '数据分析', title: '数据分析', end: false },
  { path: '/research', icon: FlaskConical, label: '试验管理', title: '试验管理', end: false },
  { path: '/settings', icon: Settings, label: '系统设置', title: '系统设置', end: false },
];

export const pageTitleMap = Object.fromEntries(navItems.map((item) => [item.path, item.title]));
