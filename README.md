# Game Vault

游戏灵感库网站，前端使用 React + Vite，后端使用 Node.js + SQLite（数据保存在服务器）。

## 环境要求

- 本地开发建议 Node.js `16+`
- 生产环境推荐 Docker（不受宿主机 Node 版本限制）

## 目录结构

- `src/`：前端代码
- `server/index.js`：后端 API 与静态文件服务
- `server/data/game-vault.db`：SQLite 数据库文件（启动后自动创建）

## 本地开发

1. 启动后端

```bash
npm run dev:server
```

2. 启动前端（新终端）

```bash
npm run dev
```

前端开发服务器会把 `/api` 请求代理到 `http://localhost:8787`。

## 构建与部署

1. 构建前端

```bash
npm run build
```

2. 启动服务（API + 静态站点）

```bash
npm run start
```

默认端口：`8787`。  
可通过环境变量修改：

```bash
PORT=3000 DB_PATH=/var/data/game-vault.db npm run start
```

## API 概览

- `GET /api/state`
- `POST /api/tags`
- `PUT /api/tags/:id`
- `DELETE /api/tags/:id`
- `POST /api/tags/batch-delete`
- `POST /api/games`
- `PATCH /api/games/:id`
- `DELETE /api/games/:id`
- `PATCH /api/games/:id/implementation`
- `POST /api/platforms`
- `PUT /api/platforms/:name`
- `DELETE /api/platforms/:name`

## Docker 运行

```bash
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f gamenote
```

停止：

```bash
docker compose down
```

数据库文件会持久化在项目目录下的 `data/game-vault.db`。
