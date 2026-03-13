import { useEffect, useMemo, useState } from 'react';
import { Drawer, Button, Space, Checkbox, Empty, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useGameStore } from '../store';

interface TagManagementDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const TagManagementDrawer = ({ open, onClose }: TagManagementDrawerProps) => {
  const { tags, games, deleteTags } = useGameStore();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedTagIds([]);
    }
  }, [open]);

  const usageCountMap = useMemo(() => {
    const countMap = new Map<string, number>();
    tags.forEach((tag) => countMap.set(tag.id, 0));

    games.forEach((game) => {
      game.tags.forEach((tagId) => {
        countMap.set(tagId, (countMap.get(tagId) || 0) + 1);
      });
    });

    return countMap;
  }, [games, tags]);

  const allSelected = tags.length > 0 && selectedTagIds.length === tags.length;
  const indeterminate = selectedTagIds.length > 0 && selectedTagIds.length < tags.length;

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedTagIds(tags.map((tag) => tag.id));
      return;
    }
    setSelectedTagIds([]);
  };

  const handleToggleTag = (tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTagIds((prev) => [...prev, tagId]);
      return;
    }

    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const handleBatchDelete = async () => {
    if (selectedTagIds.length === 0) {
      message.warning('请先选择要删除的标签');
      return;
    }

    const confirmDelete = window.confirm(
      `确认删除选中的 ${selectedTagIds.length} 个标签吗？这些标签会从所有游戏中移除。`
    );

    if (!confirmDelete) return;

    try {
      await deleteTags(selectedTagIds);
      message.success(`已删除 ${selectedTagIds.length} 个标签`);
      setSelectedTagIds([]);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量删除失败');
    }
  };

  return (
    <Drawer
      title={
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
          标签管理
        </span>
      }
      placement="left"
      open={open}
      onClose={onClose}
      width={560}
      styles={{
        body: { background: '#12181d', color: '#fff', padding: 20 },
        header: { background: '#1e262e', borderBottom: '1px solid #2d3741' },
      }}
      extra={
        <Space>
          <Button onClick={onClose} style={{ color: '#94a3b8' }}>
            关闭
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            disabled={selectedTagIds.length === 0}
          >
            批量删除 ({selectedTagIds.length})
          </Button>
        </Space>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#1e262e',
            border: '1px solid #2d3741',
            borderRadius: 8,
          }}
        >
          <Checkbox
            checked={allSelected}
            indeterminate={indeterminate}
            onChange={(event) => handleToggleAll(event.target.checked)}
            style={{ color: '#cbd5e1' }}
          >
            全选 ({tags.length})
          </Checkbox>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            已选 {selectedTagIds.length} 项
          </span>
        </div>

        {tags.length === 0 ? (
          <Empty
            description={<span style={{ color: '#94a3b8' }}>暂无标签</span>}
            style={{ marginTop: 80 }}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 8,
            }}
          >
            {tags.map((tag) => (
              <label
                key={tag.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 10px',
                  borderRadius: 8,
                  border: selectedTagIds.includes(tag.id)
                    ? '1px solid rgba(110, 231, 183, 0.5)'
                    : '1px solid #2d3741',
                  background: selectedTagIds.includes(tag.id)
                    ? 'rgba(110, 231, 183, 0.08)'
                    : '#1e262e',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                  <Checkbox
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={(event) => handleToggleTag(tag.id, event.target.checked)}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: '#e2e8f0',
                        fontWeight: 600,
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      #{tag.name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>
                      关联游戏 {usageCountMap.get(tag.id) || 0} 个
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
};
