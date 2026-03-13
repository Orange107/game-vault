import { useState } from 'react';
import { Drawer, Input, Button, Badge, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useGameStore } from '../store';
import { PLATFORMS } from '../types';

export const PlatformEditorDrawer = () => {
  const {
    platformDrawerOpen,
    closePlatformDrawer,
    customPlatforms,
    deletedPlatforms,
    addPlatform,
    deletePlatform,
    updatePlatform,
    games,
  } = useGameStore();

  const [newPlatformName, setNewPlatformName] = useState('');
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // 计算所有可用平台（内置平台减去已删除的 + 自定义平台）
  const availableBuiltIns = PLATFORMS.filter((p) => !deletedPlatforms.includes(p));
  const allPlatforms = [...availableBuiltIns, ...customPlatforms];

  // 计算每个平台的游戏数量
  const getPlatformGameCount = (platform: string) => {
    return games.filter((g) => g.platform.includes(platform)).length;
  };

  const handleAddPlatform = async () => {
    const trimmed = newPlatformName.trim();
    if (!trimmed) {
      message.warning('请输入平台名称');
      return;
    }
    if (allPlatforms.includes(trimmed)) {
      message.warning('该平台已存在');
      return;
    }
    try {
      await addPlatform(trimmed);
      setNewPlatformName('');
      message.success('平台添加成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '平台添加失败');
    }
  };

  const handleDeleteClick = async (platform: string) => {
    const gameCount = getPlatformGameCount(platform);
    const confirmMessage = gameCount > 0
      ? `该平台有 ${gameCount} 个关联游戏，删除后这些游戏将被迁移至 PC 平台。确认删除吗？`
      : '确认删除该平台吗？';

    if (window.confirm(confirmMessage)) {
      try {
        await deletePlatform(platform);
        if (gameCount > 0) {
          message.info(`已将 ${gameCount} 个游戏的平台迁移至 PC`);
        }
        message.success('平台删除成功');
      } catch (error) {
        message.error(error instanceof Error ? error.message : '平台删除失败');
      }
    }
  };

  const startEdit = (platform: string) => {
    setEditingPlatform(platform);
    setEditValue(platform);
  };

  const cancelEdit = () => {
    setEditingPlatform(null);
    setEditValue('');
  };

  const saveEdit = async (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      message.warning('平台名称不能为空');
      return;
    }
    if (trimmed !== oldName && allPlatforms.includes(trimmed)) {
      message.warning('该平台名称已存在');
      return;
    }
    try {
      await updatePlatform(oldName, trimmed);
      setEditingPlatform(null);
      setEditValue('');
      message.success('平台名称修改成功');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '平台名称修改失败');
    }
  };

  const platformColors: Record<string, string> = {
    PC: '#3b82f6',
    PS5: '#003087',
    Xbox: '#107C10',
    Switch: '#E60012',
    Mobile: '#f59e0b',
    Web: '#8b5cf6',
  };

  return (
    <Drawer
      title={
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
          管理平台
        </span>
      }
      placement="left"
      onClose={closePlatformDrawer}
      open={platformDrawerOpen}
      width={300}
      styles={{
        body: { background: '#1e262e', color: '#fff', padding: '20px' },
        header: { background: '#1e262e', borderBottom: '1px solid #2d3741' },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 添加新平台 */}
        <div>
          <label
            style={{
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
              display: 'block',
            }}
          >
            添加新平台
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="输入平台名称..."
              value={newPlatformName}
              onChange={(e) => setNewPlatformName(e.target.value)}
              onPressEnter={handleAddPlatform}
              style={{
                flex: 1,
                background: '#161d24',
                border: '1px solid #2d3741',
                color: '#fff',
                borderRadius: 6,
                height: 40,
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPlatform}
              style={{
                background: '#6ee7b7',
                borderColor: '#6ee7b7',
                color: '#12181d',
                height: 40,
                width: 40,
                padding: 0,
              }}
            />
          </div>
        </div>

        {/* 平台列表 */}
        <div>
          <label
            style={{
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
              display: 'block',
            }}
          >
            所有平台 ({allPlatforms.length})
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allPlatforms.map((platform) => {
              const gameCount = getPlatformGameCount(platform);
              const isEditing = editingPlatform === platform;

              return (
                <div
                  key={platform}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#161d24',
                    borderRadius: 8,
                    border: '1px solid #2d3741',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    {/* 平台颜色标识 */}
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: platformColors[platform] || '#6ee7b7',
                      }}
                    />

                    {isEditing ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onPressEnter={() => saveEdit(platform)}
                        autoFocus
                        style={{
                          flex: 1,
                          background: '#1e262e',
                          border: '1px solid #6ee7b7',
                          color: '#fff',
                          borderRadius: 4,
                          height: 32,
                          fontSize: 14,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {platform}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge
                      count={gameCount}
                      style={{
                        background: gameCount > 0 ? '#3b82f6' : '#2d3741',
                        color: '#fff',
                      }}
                    />

                    {isEditing ? (
                      <>
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined style={{ color: '#6ee7b7' }} />}
                          onClick={() => saveEdit(platform)}
                          style={{ padding: '4px 8px' }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined style={{ color: '#ef4444' }} />}
                          onClick={cancelEdit}
                          style={{ padding: '4px 8px' }}
                        />
                      </>
                    ) : (
                      <>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => startEdit(platform)}
                          style={{
                            color: '#64748b',
                            padding: '4px 8px',
                          }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteClick(platform)}
                          style={{
                            color: '#ef4444',
                            padding: '4px 8px',
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 说明文字 */}
        <div
          style={{
            padding: 12,
            background: 'rgba(110, 231, 183, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(110, 231, 183, 0.2)',
          }}
        >
          <p style={{ margin: 0, color: '#6ee7b7', fontSize: 12, lineHeight: 1.6 }}>
            <strong>提示：</strong>
            <br />• 点击编辑图标可修改平台名称
            <br />• 删除平台时，关联游戏将自动迁移至 PC 平台
            <br />• 平台名称不能重复
          </p>
        </div>
      </div>
    </Drawer>
  );
};
