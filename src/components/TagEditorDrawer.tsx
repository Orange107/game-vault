import { useEffect, useState } from 'react';
import { Drawer, Input, Button, Space, Card, message } from 'antd';
import { useGameStore } from '../store';
import { TipTapEditor } from './TipTapEditor';

export const TagEditorDrawer = () => {
  const { leftDrawerOpen, editingTagId, tags, games, closeLeftDrawer, openRightDrawer, updateTag } =
    useGameStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const editingTag = tags.find((t) => t.id === editingTagId);
  const linkedGames = editingTag
    ? games.filter((g) => g.tags.includes(editingTag.id))
    : [];

  useEffect(() => {
    if (editingTag) {
      setName(editingTag.name);
      setDescription(editingTag.description);
    }
  }, [editingTag]);

  const handleSave = async () => {
    if (editingTagId) {
      try {
        await updateTag(editingTagId, name, description);
        message.success('标签保存成功');
        closeLeftDrawer();
      } catch (error) {
        message.error(error instanceof Error ? error.message : '标签保存失败');
      }
    }
  };

  return (
    <Drawer
      title={
        <span style={{ color: '#fff' }}>
          编辑标签 - <span style={{ color: '#6ee7b7' }}>{editingTag?.name}</span>
        </span>
      }
      placement="left"
      onClose={closeLeftDrawer}
      open={leftDrawerOpen}
      width={500}
      styles={{
        body: { background: '#27313d', color: '#fff' },
        header: { background: '#27313d', borderBottom: '1px solid #2d3741' },
      }}
      extra={
        <Space>
          <Button onClick={closeLeftDrawer} style={{ color: '#94a3b8' }}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            style={{ background: '#6ee7b7', borderColor: '#6ee7b7', color: '#12181d' }}
          >
            保存
          </Button>
        </Space>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label
            style={{
              color: '#94a3b8',
              fontSize: 12,
              marginBottom: 8,
              display: 'block',
            }}
          >
            标签名称
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: '#161d24',
              border: '1px solid #2d3741',
              color: '#fff',
            }}
          />
        </div>

        <div>
          <label
            style={{
              color: '#94a3b8',
              fontSize: 12,
              marginBottom: 8,
              display: 'block',
            }}
          >
            通用描述 (富文本)
          </label>
          <TipTapEditor
            content={description}
            onChange={setDescription}
            placeholder="输入标签描述，支持富文本格式..."
          />
        </div>

        {linkedGames.length > 0 && (
          <div>
            <label
              style={{
                color: '#94a3b8',
                fontSize: 12,
                marginBottom: 12,
                display: 'block',
              }}
            >
              关联游戏 ({linkedGames.length})
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {linkedGames.map((game) => (
                <Card
                  key={game.id}
                  size="small"
                  onClick={() => openRightDrawer(game.id)}
                  style={{
                    background: '#161d24',
                    border: '1px solid #2d3741',
                    cursor: 'pointer',
                  }}
                  bodyStyle={{ padding: 0 }}
                  hoverable
                >
                  <img
                    src={game.thumbnail}
                    alt={game.name}
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      padding: '6px 8px',
                      color: '#fff',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {game.name}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
