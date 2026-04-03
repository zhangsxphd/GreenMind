# 农棚智脑
## GreenMind

设施农业智能决策平台，一个基于 `React + Fastify + SQLite` 的前后端分离全栈项目。  
项目围绕设施农业场景，提供首页驾驶舱、棚室管理、报警中心、试验管理、数据分析、系统设置等模块，用于展示棚室运行状态、报警联动、决策建议和基础运维配置。

当前版本以“高保真原型恢复 + 可运行全栈骨架”为核心目标，优先保证：

- 界面与演示稿一致
- 示例数据可直接展示
- 关键交互可操作
- 后端服务、数据库和前端工程结构完整清晰
- 后续继续扩展时不需要推倒重来

## 项目亮点

- 前后端分离：
  - 前端使用 `Vite + React 18 + React Router + Tailwind CSS`
  - 后端使用 `Fastify + better-sqlite3 + SQLite`
- 支持真实本地数据库：
  - SQLite 建表、种子、重置、校验脚本已内置
- 支持演示态优先：
  - 首页、棚室管理、报警中心默认优先显示演示示例数据
  - 即使后端暂不可用，页面也不会空白
- 支持基础业务交互：
  - 首页决策执行/忽略
  - 棚室详细数据、设备控制、新增棚室
  - 报警处理、批量处理、导出记录
  - 系统设置多分区配置及持久化

## 技术栈

### 前端

- `Vite`
- `React 18`
- `react-router-dom`
- `axios`
- `Tailwind CSS`
- `lucide-react`

### 后端

- `Node.js`
- `Fastify`
- `@fastify/cors`
- `better-sqlite3`
- `SQLite`

## 功能模块

### 1. 首页

- KPI 总览
- 协同决策建议
- 实时风险预警
- 棚室实时监测快照
- 默认示例数据与演示稿一致

### 2. 棚室管理

- 棚室卡片示例数据展示
- 运行状态筛选
- 搜索棚室名称 / 作物
- 详细数据弹窗
- 设备控制弹窗
- 新增棚室
- 默认优先展示演示稿中的 `A区番茄棚 / B区黄瓜棚 / C区草莓棚`

### 3. 报警中心

- 分类筛选
- 报警列表展示
- 单条报警处理
- 批量标记已处理
- 导出 CSV 记录
- 默认展示 6 条演示报警数据

### 4. 数据分析

- 当前为前端静态演示页
- 保留原型中的多维分析视觉展示

### 5. 试验管理

- 当前为前端静态演示页
- 已恢复演示版默认试验数据

### 6. 系统设置

- 基本信息
- 报警规则
- 通知策略
- 集成中心
- 数据与安全
- 运维审计
- 该模块已接入后端与 SQLite 持久化

## 当前实现状态

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 首页 | 已完成 | 演示态优先，支持接口拉取与示例数据兜底 |
| 棚室管理 | 已完成 | 演示态优先，支持详情、控制、新增棚室 |
| 报警中心 | 已完成 | 演示态优先，支持处理、批量处理、导出 |
| 系统设置 | 已完成 | 已接入 Fastify + SQLite 持久化 |
| 数据分析 | 演示版 | 当前为静态原型页面 |
| 试验管理 | 演示版 | 当前为静态原型页面 |

## 项目结构

```text
GreenMind/
├── frontend/                     # React 前端
│   ├── src/
│   │   ├── components/           # 通用组件、布局组件
│   │   ├── config/               # 导航配置
│   │   ├── data/                 # 演示数据
│   │   ├── hooks/                # 全局 AppShell Hook
│   │   ├── layouts/              # 主布局
│   │   ├── lib/                  # Axios 实例
│   │   ├── pages/                # 页面模块
│   │   └── services/             # API 请求封装
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.cjs
│   └── vite.config.js
├── backend/                      # Fastify 后端
│   ├── data/                     # SQLite 数据文件
│   ├── src/
│   │   ├── database/             # 建库、种子、重置、校验
│   │   ├── repositories/         # 数据访问与业务逻辑
│   │   ├── routes/               # API 路由
│   │   ├── app.js                # Fastify 应用注册
│   │   └── server.js             # 服务入口
│   └── package.json
├── package.json                  # Monorepo workspace 根配置
└── README.md
```

## 前端路由

| 路由 | 页面 |
| --- | --- |
| `/` | 首页 |
| `/greenhouses` | 棚室管理 |
| `/alerts` | 报警中心 |
| `/analysis` | 数据分析 |
| `/research` | 试验管理 |
| `/settings` | 系统设置 |

## 后端接口概览

### 基础

- `GET /health`

### 仪表盘

- `GET /api/dashboard`

### 棚室管理

- `GET /api/greenhouses`
- `GET /api/greenhouses/:greenhouseId`
- `POST /api/greenhouses`
- `PUT /api/greenhouses/:greenhouseId/control`

### 报警中心

- `GET /api/alerts`
- `PUT /api/alerts/:alertId/resolve`
- `PUT /api/alerts/resolve-all`
- `POST /api/alerts/export`

### 决策中心

- `POST /api/decisions/:decisionId/approve`
- `POST /api/decisions/:decisionId/ignore`

### 用户

- `GET /api/users`

### 系统设置

- `GET /api/settings`
- `PUT /api/settings/basic`
- `PUT /api/settings/rules`
- `POST /api/settings/rules/simulate`
- `PUT /api/settings/notifications`
- `POST /api/settings/notifications/test`
- `PUT /api/settings/security`
- `POST /api/settings/security/backup`
- `POST /api/settings/security/rotate-token`
- `PUT /api/settings/ops`
- `POST /api/settings/ops/health-check`
- `POST /api/settings/export`
- `POST /api/settings/integrations/:integrationId/toggle`
- `POST /api/settings/integrations/:integrationId/test`
- `POST /api/settings/integrations/:integrationId/rotate-key`
- `POST /api/settings/snapshots`
- `POST /api/settings/snapshots/:snapshotId/restore`
- `POST /api/settings/logs/archive`

## 本地开发

### 环境要求

- Node.js 18+
- npm 9+
- macOS / Linux / Windows 均可

> 本项目当前在本机使用 `nvm` 管理 Node。  
> 如果你的 shell 没有自动加载 `nvm`，执行命令前请先运行：

```bash
source ~/.nvm/nvm.sh
```

### 1. 安装依赖

```bash
source ~/.nvm/nvm.sh
npm install
```

### 2. 启动前端

```bash
source ~/.nvm/nvm.sh
npm run dev:frontend
```

默认地址：

- 前端：[http://127.0.0.1:5173](http://127.0.0.1:5173)

### 3. 启动后端

```bash
source ~/.nvm/nvm.sh
npm run dev:backend
```

默认地址：

- 后端：[http://127.0.0.1:3001](http://127.0.0.1:3001)

健康检查：

- [http://127.0.0.1:3001/health](http://127.0.0.1:3001/health)

## 数据库说明

项目使用 `SQLite`，主要数据文件位于：

- `backend/data/smart-agri.db`

### 常用数据库脚本

初始化数据库：

```bash
source ~/.nvm/nvm.sh
npm run db:init --workspace backend
```

写入种子数据：

```bash
source ~/.nvm/nvm.sh
npm run db:seed --workspace backend
```

重置数据库：

```bash
source ~/.nvm/nvm.sh
npm run db:reset --workspace backend
```

校验数据库：

```bash
source ~/.nvm/nvm.sh
npm run db:verify --workspace backend
```

### 当前种子数据包含

- 园区
- 用户
- 棚室
- 棚室档案
- 传感快照
- 报警记录
- 决策建议
- 试验项目
- 系统设置相关配置

## 构建

前端构建：

```bash
source ~/.nvm/nvm.sh
npm run build:frontend
```

后端生产启动：

```bash
source ~/.nvm/nvm.sh
npm run start:backend
```

## 环境变量

### 前端

可选环境变量：

- `VITE_API_BASE_URL`

默认值：

```bash
http://127.0.0.1:3001/api
```

### 后端

可选环境变量：

- `PORT`
- `HOST`

默认值：

- `PORT=3001`
- `HOST=0.0.0.0`

## 演示数据策略

为了保证演示体验，当前项目对部分页面采用了“演示态优先”策略：

- 首页
- 棚室管理
- 报警中心

这意味着：

- 页面默认会优先展示和原型/演示稿一致的示例数据
- 当接口可用时，会在不破坏演示视觉的前提下融合后端数据
- 当接口不可用时，会自动回退到示例数据

这种策略适合当前“先还原界面，再逐步补全真实业务”的开发阶段。

## 适合继续扩展的方向

- 将试验管理改造成完整 CRUD
- 将数据分析改造成真实统计接口驱动
- 为棚室管理补独立详情页
- 增加角色权限管理
- 增加统一审计中心
- 增加图表库接入
- 增加 CI / 自动化构建流程

## 常见问题

### 1. 为什么页面有些地方显示的是示例数据？

这是当前版本的设计选择。  
首页、棚室管理、报警中心需要优先保持和演示稿一致，因此默认启用了示例数据优先展示。

### 2. 为什么命令前要先执行 `source ~/.nvm/nvm.sh`？

因为当前本机的 Node.js 是通过 `nvm` 安装的，如果 shell 没有自动加载 `nvm`，直接运行 `npm` 相关命令可能失败。

### 3. 数据库重置后数据去哪了？

重置命令会重新根据种子脚本写入初始数据。如果你手动新增的数据需要保留，建议先备份数据库文件。

### 4. 前端接口超时怎么办？

先确认后端是否已启动：

- [http://127.0.0.1:3001/health](http://127.0.0.1:3001/health)

如果后端未启动，首页、棚室管理、报警中心仍会回退到示例数据，但系统设置等依赖持久化的模块会受到影响。

## 开发说明

这个仓库当前更偏向“可持续迭代的高保真产品工程骨架”，而不是一次性演示页面。  
因此你会在仓库里同时看到：

- 原型级视觉页面
- 可运行的前后端服务
- SQLite 本地数据库
- 可复用的服务层
- 适合后续逐步演进的目录结构

如果你希望继续往生产级方向推进，建议按下面顺序扩展：

1. 完成试验管理后端接口与数据库设计
2. 将数据分析改为真实后端统计
3. 补权限、审计、日志与部署流程

## 仓库地址

- GitHub: [https://github.com/zhangsxphd/GreenMind](https://github.com/zhangsxphd/GreenMind)
