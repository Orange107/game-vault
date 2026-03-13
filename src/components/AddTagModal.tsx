import { Drawer, Input, Button, Space, message, type InputRef } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store';
import { TipTapEditor } from './TipTapEditor';

interface AddTagModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddTagModal = ({ open, onClose }: AddTagModalProps) => {
  const { addTag } = useGameStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nameInputRef = useRef<InputRef | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      nameInputRef.current?.focus({ cursor: 'end' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    try {
      await addTag(name.trim(), description);
      message.success('标签添加成功');
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '标签添加失败');
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Drawer
      title={
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
          添加新标签
        </span>
      }
      placement="left"
      onClose={handleCancel}
      open={open}
      width={560}
      styles={{
        body: { background: '#27313d', color: '#fff', padding: '20px' },
        header: { background: '#27313d', borderBottom: '1px solid #2d3741' },
      }}
      extra={
        <Space>
          <Button onClick={handleCancel} style={{ color: '#94a3b8' }}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ background: '#6ee7b7', borderColor: '#6ee7b7', color: '#12181d' }}
          >
            添加
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
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如: 打击感"
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
            标签描述 (富文本)
          </label>
          <TipTapEditor
            content={description}
            onChange={setDescription}
            placeholder="描述这个玩法的通用理论..."
          />
        </div>
      </div>
    </Drawer>
  );
};
