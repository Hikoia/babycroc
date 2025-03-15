# 幸存者在线 - Survivors Online

一个基于 Survivors 游戏模板的多人在线版本，让玩家可以一起在同一地图上竞争生存。

## 功能特点

- RPG 风格的开场白介绍游戏背景
- 多人在线游戏体验
- 实时排行榜系统
- 保留原版游戏的武器和敌人系统
- 响应式设计，支持不同屏幕大小

## 本地开发运行

1. 安装依赖:

```bash
npm install
```

2. 启动开发服务器:

```bash
npm run dev
```

3. 打开浏览器访问:

```
http://localhost:3000
```

## 在线部署方法

### 方法 1: 使用 Heroku 部署

1. 安装 Heroku CLI 并登录

```bash
npm install -g heroku
heroku login
```

2. 创建一个 Heroku 应用

```bash
heroku create your-app-name
```

3. 部署代码

```bash
git add .
git commit -m "Ready for deployment"
git push heroku main
```

4. 打开应用

```bash
heroku open
```

### 方法 2: 使用 Vercel 部署

1. 安装 Vercel CLI

```bash
npm install -g vercel
```

2. 部署到 Vercel

```bash
vercel
```

按照提示完成部署流程。

### 方法 3: 使用 Netlify 部署

1. 安装 Netlify CLI

```bash
npm install -g netlify-cli
```

2. 部署到 Netlify

```bash
netlify deploy
```

按照提示完成部署流程。

## 数据库配置

默认情况下，游戏使用内存存储来保存排行榜数据。如果需要永久存储，建议配置 MongoDB:

1. 创建 MongoDB 数据库
2. 更新 server/index.js 中的连接配置:

```javascript
mongoose.connect("mongodb://your-mongodb-url/survivors", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Leaderboard = mongoose.model("Leaderboard", LeaderboardSchema);
```

3. 取消注释相关代码

## 游戏操作

- 使用方向键移动角色
- 自动攻击附近的敌人
- 收集经验值提升等级

## 许可证

[MIT](LICENSE)
