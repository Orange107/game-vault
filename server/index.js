import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const PORT = Number(process.env.PORT || 8787);
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'server/data/game-vault.db');
const BUILT_IN_PLATFORMS = ['PC', 'PS5', 'Xbox', 'Switch', 'Mobile', 'Web'];

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    heat INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    aliases TEXT NOT NULL DEFAULT '[]',
    thumbnail TEXT NOT NULL DEFAULT '',
    thumbnails TEXT NOT NULL DEFAULT '[]',
    game_url TEXT NOT NULL DEFAULT '',
    platform TEXT NOT NULL DEFAULT 'PC',
    rating INTEGER NOT NULL DEFAULT 80,
    stars INTEGER NOT NULL DEFAULT 4,
    synopsis TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    implementations TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const ensureTagHeatColumn = () => {
  const columns = db.prepare('PRAGMA table_info(tags)').all();
  const hasHeat = columns.some((column) => column.name === 'heat');
  const hasRating = columns.some((column) => column.name === 'rating');

  if (!hasHeat) {
    db.exec('ALTER TABLE tags ADD COLUMN heat INTEGER NOT NULL DEFAULT 0');
  }

  if (hasRating) {
    db.exec(`
      UPDATE tags
      SET heat = CASE
        WHEN rating > 10 THEN CAST(ROUND(rating / 10.0) AS INTEGER)
        WHEN rating < 0 THEN 0
        ELSE CAST(rating AS INTEGER)
      END
      WHERE heat = 0
    `);
  }
};

ensureTagHeatColumn();

const ensureGameAliasesColumn = () => {
  const columns = db.prepare('PRAGMA table_info(games)').all();
  const hasAliases = columns.some((column) => column.name === 'aliases');

  if (!hasAliases) {
    db.exec(`ALTER TABLE games ADD COLUMN aliases TEXT NOT NULL DEFAULT '[]'`);
  }
};

ensureGameAliasesColumn();

const parseJson = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeStringArray = (value) => {
  const seen = new Set();
  const list = Array.isArray(value) ? value : [];
  const normalized = [];

  list.forEach((item) => {
    const itemText = String(item || '').trim();
    if (!itemText || seen.has(itemText)) return;
    seen.add(itemText);
    normalized.push(itemText);
  });

  return normalized;
};

const getSettingArray = (key) => {
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key);
  return normalizeStringArray(parseJson(row?.value ?? '[]', []));
};

const setSettingArray = (key, list) => {
  const value = JSON.stringify(normalizeStringArray(list));
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
};

const mapTagRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  heat: Number(row.heat || 0),
});

const getTags = () =>
  db.prepare('SELECT id, name, description, heat FROM tags ORDER BY rowid DESC').all().map(mapTagRow);

const normalizePlatformList = (value) => {
  const list = Array.isArray(value) ? value : [value];
  const normalized = normalizeStringArray(list);
  return normalized.length > 0 ? normalized : ['PC'];
};

const parsePlatformField = (rawPlatform) => {
  const text = String(rawPlatform || '').trim();
  if (!text) return ['PC'];

  // Backward compatibility: previously this column stored a plain string.
  if (text.startsWith('[')) {
    return normalizePlatformList(parseJson(text, []));
  }

  // Backward compatibility: previous logic could persist "PC,PS5".
  if (text.includes(',') || text.includes('，')) {
    return normalizePlatformList(text.split(/[，,]/g).map((item) => item.trim()));
  }

  return normalizePlatformList([text]);
};

const mapGameRow = (row) => ({
  id: row.id,
  name: row.name,
  aliases: normalizeStringArray(parseJson(row.aliases, [])),
  thumbnail: row.thumbnail || '',
  thumbnails: normalizeStringArray(parseJson(row.thumbnails, [])),
  gameUrl: row.game_url || '',
  platform: parsePlatformField(row.platform),
  rating: Number(row.rating || 0),
  stars: Number(row.stars || 0),
  synopsis: row.synopsis || '',
  tags: normalizeStringArray(parseJson(row.tags, [])),
  implementations: parseJson(row.implementations, {}),
});

const getGames = () =>
  db
    .prepare(
      `SELECT id, name, aliases, thumbnail, thumbnails, game_url, platform, rating, stars, synopsis, tags, implementations
       FROM games
       ORDER BY rowid DESC`
    )
    .all()
    .map(mapGameRow);

const getGameById = (id) => {
  const row = db
    .prepare(
      `SELECT id, name, aliases, thumbnail, thumbnails, game_url, platform, rating, stars, synopsis, tags, implementations
       FROM games WHERE id = ?`
    )
    .get(id);
  return row ? mapGameRow(row) : null;
};

const normalizeImplementations = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const normalized = {};
  Object.entries(value).forEach(([tagId, content]) => {
    const key = String(tagId || '').trim();
    if (!key) return;
    normalized[key] = String(content ?? '');
  });
  return normalized;
};

const normalizeGame = (rawInput) => {
  const name = String(rawInput.name ?? '').trim();
  const aliases = normalizeStringArray(rawInput.aliases);
  const gameUrl = String(rawInput.gameUrl ?? '').trim();
  const platform = normalizePlatformList(rawInput.platform ?? ['PC']);
  const rating = clamp(Number(rawInput.rating ?? 80), 0, 100);
  const stars = clamp(Number(rawInput.stars ?? 4), 0, 5);
  const synopsis = String(rawInput.synopsis ?? '');
  const tags = normalizeStringArray(rawInput.tags);
  const thumbnails = normalizeStringArray(rawInput.thumbnails);
  const fallbackThumbnail = String(rawInput.thumbnail ?? '').trim();
  const thumbnail = thumbnails[0] || fallbackThumbnail;
  const normalizedThumbnails = thumbnails.length > 0 ? thumbnails : (thumbnail ? [thumbnail] : []);
  const implementations = normalizeImplementations(rawInput.implementations);

  return {
    name,
    aliases,
    thumbnail,
    thumbnails: normalizedThumbnails,
    gameUrl,
    platform,
    rating,
    stars,
    synopsis,
    tags,
    implementations,
  };
};

const saveGame = (game) => {
  db.prepare(
    `INSERT INTO games (
      id, name, aliases, thumbnail, thumbnails, game_url, platform, rating, stars, synopsis, tags, implementations
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      aliases = excluded.aliases,
      thumbnail = excluded.thumbnail,
      thumbnails = excluded.thumbnails,
      game_url = excluded.game_url,
      platform = excluded.platform,
      rating = excluded.rating,
      stars = excluded.stars,
      synopsis = excluded.synopsis,
      tags = excluded.tags,
      implementations = excluded.implementations`
  ).run(
    game.id,
    game.name,
    JSON.stringify(normalizeStringArray(game.aliases)),
    game.thumbnail,
    JSON.stringify(game.thumbnails),
    game.gameUrl,
    JSON.stringify(normalizePlatformList(game.platform)),
    game.rating,
    game.stars,
    game.synopsis,
    JSON.stringify(game.tags),
    JSON.stringify(game.implementations),
  );
};

const getStatePayload = () => ({
  tags: getTags(),
  games: getGames(),
  customPlatforms: getSettingArray('customPlatforms'),
  deletedPlatforms: getSettingArray('deletedPlatforms'),
});

const removeTagIdsFromGames = (tagIdSet) => {
  const games = getGames();
  games.forEach((game) => {
    const nextTags = game.tags.filter((tagId) => !tagIdSet.has(tagId));
    const nextImplementations = Object.fromEntries(
      Object.entries(game.implementations).filter(([tagId]) => !tagIdSet.has(tagId))
    );

    const tagsChanged = nextTags.length !== game.tags.length;
    const implementationsChanged = Object.keys(nextImplementations).length !== Object.keys(game.implementations).length;

    if (!tagsChanged && !implementationsChanged) return;
    saveGame({ ...game, tags: nextTags, implementations: nextImplementations });
  });
};

const replacePlatformInGames = (fromPlatform, toPlatform) => {
  const games = getGames();
  games.forEach((game) => {
    const currentPlatforms = normalizePlatformList(game.platform);
    const nextPlatforms = normalizePlatformList(
      currentPlatforms.map((platform) => (platform === fromPlatform ? toPlatform : platform))
    );

    if (JSON.stringify(currentPlatforms) === JSON.stringify(nextPlatforms)) return;
    saveGame({ ...game, platform: nextPlatforms });
  });
};

const ensureSeedData = () => {
  setSettingArray('customPlatforms', getSettingArray('customPlatforms'));
  setSettingArray('deletedPlatforms', getSettingArray('deletedPlatforms'));

  const tagCount = Number(db.prepare('SELECT COUNT(*) AS count FROM tags').get().count || 0);
  const gameCount = Number(db.prepare('SELECT COUNT(*) AS count FROM games').get().count || 0);

  if (tagCount > 0 || gameCount > 0) return;

  const seedTags = [
    {
      id: 'tag-1',
      name: '打击感',
      description: '强调命中反馈、音效与动作节奏。',
      heat: 9,
    },
    {
      id: 'tag-2',
      name: '非线性叙事',
      description: '通过碎片信息与多线结构推动叙事。',
      heat: 8,
    },
    {
      id: 'tag-3',
      name: '类银河恶魔城',
      description: '能力解锁驱动区域探索与地图回访。',
      heat: 9,
    },
    {
      id: 'tag-4',
      name: 'Rogue-like',
      description: '随机内容与重复游玩构成核心循环。',
      heat: 8,
    },
  ];

  const seedGames = [
    {
      id: 'game-1',
      name: 'Hades II',
      aliases: [],
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=225&fit=crop',
      thumbnails: ['https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=225&fit=crop'],
      gameUrl: '',
      platform: ['PC'],
      rating: 98,
      stars: 5,
      synopsis: '动作 Rogue-like 代表作续作。',
      tags: ['tag-4', 'tag-1'],
      implementations: {},
    },
    {
      id: 'game-2',
      name: 'Elden Ring',
      aliases: [],
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop',
      thumbnails: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop'],
      gameUrl: '',
      platform: ['PC'],
      rating: 96,
      stars: 5,
      synopsis: '开放探索和高强度战斗体验。',
      tags: ['tag-3', 'tag-2'],
      implementations: {},
    },
    {
      id: 'game-3',
      name: 'Hollow Knight',
      aliases: [],
      thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=225&fit=crop',
      thumbnails: ['https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400&h=225&fit=crop'],
      gameUrl: '',
      platform: ['Switch'],
      rating: 93,
      stars: 4,
      synopsis: '高质量地图探索与战斗节奏设计。',
      tags: ['tag-3', 'tag-1'],
      implementations: {},
    },
  ];

  const insertTag = db.prepare('INSERT INTO tags (id, name, description, heat) VALUES (?, ?, ?, ?)');
  const insertGame = db.prepare(
    `INSERT INTO games (
      id, name, aliases, thumbnail, thumbnails, game_url, platform, rating, stars, synopsis, tags, implementations
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.exec('BEGIN');
  try {
    seedTags.forEach((tag) => {
      insertTag.run(tag.id, tag.name, tag.description, tag.heat);
    });

    seedGames.forEach((game) => {
      insertGame.run(
        game.id,
        game.name,
        JSON.stringify(game.aliases),
        game.thumbnail,
        JSON.stringify(game.thumbnails),
        game.gameUrl,
        JSON.stringify(normalizePlatformList(game.platform)),
        game.rating,
        game.stars,
        game.synopsis,
        JSON.stringify(game.tags),
        JSON.stringify(game.implementations),
      );
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

ensureSeedData();

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
};

const sendText = (res, statusCode, text) => {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
};

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('请求体 JSON 格式错误'));
      }
    });
    req.on('error', reject);
  });

const contentTypeByExt = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const serveStaticFile = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': contentTypeByExt[ext] || 'application/octet-stream',
  });
  createReadStream(filePath).pipe(res);
};

const handleStaticRequest = (req, res, pathname) => {
  if (!existsSync(DIST_DIR)) {
    sendText(res, 200, 'API server is running. Build the frontend to serve static files.');
    return;
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const resolvedPath = path.resolve(DIST_DIR, requestedPath);

  if (!resolvedPath.startsWith(DIST_DIR)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  if (existsSync(resolvedPath)) {
    serveStaticFile(res, resolvedPath);
    return;
  }

  const fallbackPath = path.resolve(DIST_DIR, 'index.html');
  if (existsSync(fallbackPath)) {
    serveStaticFile(res, fallbackPath);
    return;
  }

  sendText(res, 404, 'Not Found');
};

const handleApiRequest = async (req, res, pathname) => {
  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/state' && req.method === 'GET') {
    sendJson(res, 200, getStatePayload());
    return;
  }

  if (pathname === '/api/tags' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const name = String(body.name ?? '').trim();
    const description = String(body.description ?? '');
    const heat = clamp(Number(body.heat ?? body.rating ?? 0), 0, 10);

    if (!name) {
      sendJson(res, 400, { error: '标签名称不能为空' });
      return;
    }

    const tag = {
      id: randomUUID(),
      name,
      description,
      heat,
    };
    db.prepare('INSERT INTO tags (id, name, description, heat) VALUES (?, ?, ?, ?)').run(
      tag.id,
      tag.name,
      tag.description,
      tag.heat,
    );
    sendJson(res, 201, { tag });
    return;
  }

  if (pathname === '/api/tags/batch-delete' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const ids = normalizeStringArray(body.ids);

    if (ids.length === 0) {
      sendJson(res, 200, { ok: true });
      return;
    }

    const deleteTagStmt = db.prepare('DELETE FROM tags WHERE id = ?');
    db.exec('BEGIN');
    try {
      ids.forEach((id) => deleteTagStmt.run(id));
      removeTagIdsFromGames(new Set(ids));
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    sendJson(res, 200, { ok: true });
    return;
  }

  const tagMatch = pathname.match(/^\/api\/tags\/([^/]+)$/);
  if (tagMatch) {
    const tagId = decodeURIComponent(tagMatch[1]);

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const name = String(body.name ?? '').trim();
      const description = String(body.description ?? '');
      const heat = clamp(Number(body.heat ?? body.rating ?? 0), 0, 10);

      if (!name) {
        sendJson(res, 400, { error: '标签名称不能为空' });
        return;
      }

      const result = db.prepare('UPDATE tags SET name = ?, description = ?, heat = ? WHERE id = ?').run(
        name,
        description,
        heat,
        tagId,
      );
      if (result.changes === 0) {
        sendJson(res, 404, { error: '标签不存在' });
        return;
      }

      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      const result = db.prepare('DELETE FROM tags WHERE id = ?').run(tagId);
      if (result.changes === 0) {
        sendJson(res, 404, { error: '标签不存在' });
        return;
      }

      removeTagIdsFromGames(new Set([tagId]));
      sendJson(res, 200, { ok: true });
      return;
    }
  }

  if (pathname === '/api/games' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const normalizedGame = normalizeGame(body);

    if (!normalizedGame.name) {
      sendJson(res, 400, { error: '游戏名称不能为空' });
      return;
    }

    const game = { ...normalizedGame, id: randomUUID() };
    saveGame(game);
    sendJson(res, 201, { game });
    return;
  }

  const gameImplementationMatch = pathname.match(/^\/api\/games\/([^/]+)\/implementation$/);
  if (gameImplementationMatch && req.method === 'PATCH') {
    const gameId = decodeURIComponent(gameImplementationMatch[1]);
    const currentGame = getGameById(gameId);
    if (!currentGame) {
      sendJson(res, 404, { error: '游戏不存在' });
      return;
    }

    const body = await readJsonBody(req);
    const tagId = String(body.tagId ?? '').trim();
    if (!tagId) {
      sendJson(res, 400, { error: 'tagId 不能为空' });
      return;
    }

    const nextImplementations = {
      ...currentGame.implementations,
      [tagId]: String(body.content ?? ''),
    };
    saveGame({ ...currentGame, implementations: nextImplementations });
    sendJson(res, 200, { ok: true });
    return;
  }

  const gameMatch = pathname.match(/^\/api\/games\/([^/]+)$/);
  if (gameMatch) {
    const gameId = decodeURIComponent(gameMatch[1]);

    if (req.method === 'PATCH') {
      const currentGame = getGameById(gameId);
      if (!currentGame) {
        sendJson(res, 404, { error: '游戏不存在' });
        return;
      }

      const body = await readJsonBody(req);
      const merged = {
        ...currentGame,
        ...body,
        aliases: Array.isArray(body.aliases) ? body.aliases : currentGame.aliases,
        tags: Array.isArray(body.tags) ? body.tags : currentGame.tags,
        thumbnails: Array.isArray(body.thumbnails) ? body.thumbnails : currentGame.thumbnails,
        implementations: body.implementations ?? currentGame.implementations,
      };
      const normalized = normalizeGame(merged);
      saveGame({ ...normalized, id: gameId });
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      const result = db.prepare('DELETE FROM games WHERE id = ?').run(gameId);
      if (result.changes === 0) {
        sendJson(res, 404, { error: '游戏不存在' });
        return;
      }
      sendJson(res, 200, { ok: true });
      return;
    }
  }

  if (pathname === '/api/platforms' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const name = String(body.name ?? '').trim();
    if (!name) {
      sendJson(res, 400, { error: '平台名称不能为空' });
      return;
    }

    const customPlatforms = getSettingArray('customPlatforms');
    const deletedPlatforms = getSettingArray('deletedPlatforms');
    const availableBuiltIns = BUILT_IN_PLATFORMS.filter((platform) => !deletedPlatforms.includes(platform));
    const allPlatforms = [...availableBuiltIns, ...customPlatforms];
    if (allPlatforms.includes(name)) {
      sendJson(res, 409, { error: '该平台已存在' });
      return;
    }

    customPlatforms.push(name);
    setSettingArray('customPlatforms', customPlatforms);
    sendJson(res, 201, { ok: true });
    return;
  }

  const platformMatch = pathname.match(/^\/api\/platforms\/([^/]+)$/);
  if (platformMatch) {
    const platformName = decodeURIComponent(platformMatch[1]);

    if (req.method === 'DELETE') {
      const customPlatforms = getSettingArray('customPlatforms');
      const deletedPlatforms = getSettingArray('deletedPlatforms');
      const isBuiltIn = BUILT_IN_PLATFORMS.includes(platformName);

      if (isBuiltIn && !deletedPlatforms.includes(platformName)) {
        deletedPlatforms.push(platformName);
      }

      const nextCustomPlatforms = customPlatforms.filter((platform) => platform !== platformName);

      setSettingArray('customPlatforms', nextCustomPlatforms);
      setSettingArray('deletedPlatforms', deletedPlatforms);
      replacePlatformInGames(platformName, 'PC');

      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const newName = String(body.newName ?? '').trim();
      if (!newName) {
        sendJson(res, 400, { error: '新平台名称不能为空' });
        return;
      }

      const customPlatforms = getSettingArray('customPlatforms');
      const deletedPlatforms = getSettingArray('deletedPlatforms');
      const availableBuiltIns = BUILT_IN_PLATFORMS.filter((platform) => !deletedPlatforms.includes(platform));
      const allPlatforms = [...availableBuiltIns, ...customPlatforms];

      if (newName !== platformName && allPlatforms.includes(newName)) {
        sendJson(res, 409, { error: '该平台名称已存在' });
        return;
      }

      const isBuiltIn = BUILT_IN_PLATFORMS.includes(platformName);
      if (isBuiltIn) {
        if (!deletedPlatforms.includes(platformName)) {
          deletedPlatforms.push(platformName);
        }
        if (!customPlatforms.includes(newName)) {
          customPlatforms.push(newName);
        }
      } else {
        const index = customPlatforms.findIndex((platform) => platform === platformName);
        if (index === -1) {
          sendJson(res, 404, { error: '平台不存在' });
          return;
        }
        customPlatforms[index] = newName;
      }

      setSettingArray('customPlatforms', customPlatforms);
      setSettingArray('deletedPlatforms', deletedPlatforms);
      replacePlatformInGames(platformName, newName);

      sendJson(res, 200, { ok: true });
      return;
    }
  }

  sendJson(res, 404, { error: '接口不存在' });
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname;

  try {
    if (pathname.startsWith('/api/')) {
      await handleApiRequest(req, res, pathname);
      return;
    }

    handleStaticRequest(req, res, pathname);
  } catch (error) {
    console.error('[server] request failed:', error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : '服务器错误' });
  }
});

server.listen(PORT, () => {
  console.log(`[server] running at http://localhost:${PORT}`);
  console.log(`[server] sqlite path: ${DB_PATH}`);
});
