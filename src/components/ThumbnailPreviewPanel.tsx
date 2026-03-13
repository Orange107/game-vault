import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';

interface ThumbnailPreviewPanelProps {
  name: string;
  thumbnails: string[];
  onThumbnailsChange: (thumbnails: string[]) => void;
}

export const ThumbnailPreviewPanel = ({
  name,
  thumbnails,
  onThumbnailsChange,
}: ThumbnailPreviewPanelProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingUrl, setEditingUrl] = useState('');
  const [brokenSlideKeys, setBrokenSlideKeys] = useState<Set<string>>(new Set());

  const editableThumbnails = thumbnails;

  const isValidImageUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (editableThumbnails.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex > editableThumbnails.length - 1) {
      setActiveIndex(editableThumbnails.length - 1);
    }
  }, [activeIndex, editableThumbnails.length]);

  const previewSlides = useMemo(() => {
    return editableThumbnails.map((thumbnail, index) => {
      const raw = thumbnail.trim();
      const key = `${index}:${raw}`;
      const hasUrl = raw.length > 0;
      const formatInvalid = hasUrl && !isValidImageUrl(raw);
      const src = hasUrl && !formatInvalid ? raw : '';
      return { key, src, hasUrl, formatInvalid };
    });
  }, [editableThumbnails]);

  useEffect(() => {
    const currentKeys = new Set(previewSlides.map((slide) => slide.key));
    setBrokenSlideKeys((previousKeys) => {
      let changed = false;
      const nextKeys = new Set<string>();

      previousKeys.forEach((key) => {
        if (currentKeys.has(key)) {
          nextKeys.add(key);
        } else {
          changed = true;
        }
      });

      return changed ? nextKeys : previousKeys;
    });
  }, [previewSlides]);

  const slideCount = previewSlides.length;
  const hasMultipleSlides = slideCount > 1;
  const activeSlideItem = previewSlides[activeIndex];
  const activeSlide = activeSlideItem
    ? brokenSlideKeys.has(activeSlideItem.key)
      ? ''
      : activeSlideItem.src
    : '';
  const activeSlideInvalid = !!activeSlideItem
    && (
      (activeSlideItem.hasUrl && activeSlideItem.formatInvalid)
      || brokenSlideKeys.has(activeSlideItem.key)
    );

  useEffect(() => {
    if (!fullscreenOpen) {
      setFullscreenScale(1);
      return;
    }
    setFullscreenScale(1);
  }, [fullscreenOpen, activeSlideItem?.key]);

  const openEditor = (index: number) => {
    setEditingIndex(index);
    setEditingUrl(editableThumbnails[index] || '');
    setEditorOpen(true);
  };

  const handleAddThumbnail = () => {
    setEditingIndex(null);
    setEditingUrl('');
    setEditorOpen(true);
  };

  const handleSaveThumbnail = () => {
    const trimmedUrl = editingUrl.trim();

    if (!trimmedUrl) {
      message.warning('缩略图 URL 不能为空');
      return;
    }

    if (editingIndex === null) {
      const next = [...editableThumbnails, trimmedUrl];
      onThumbnailsChange(next);
      setActiveIndex(next.length - 1);
      setEditorOpen(false);
      return;
    }

    const next = [...editableThumbnails];
    next[editingIndex] = trimmedUrl;
    onThumbnailsChange(next);
    setEditorOpen(false);
  };

  const handleDeleteThumbnail = () => {
    if (editingIndex === null) return;
    const next = editableThumbnails.filter((_, index) => index !== editingIndex);
    onThumbnailsChange(next);
    setActiveIndex((prevIndex) =>
      next.length === 0
        ? 0
        : prevIndex > editingIndex
          ? prevIndex - 1
          : Math.min(prevIndex, next.length - 1)
    );
    setEditorOpen(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #2d3741',
        background: '#161d24',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: activeSlide ? 'zoom-in' : 'default',
      }}
        onClick={() => {
          if (activeSlide && activeSlideItem?.hasUrl) {
            setFullscreenOpen(true);
          }
        }}
      >
        {activeSlide ? (
          <img
            src={activeSlide}
            alt={name || '游戏缩略图'}
            style={{
              height: '100%',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            onError={() => {
              if (activeSlideItem) {
                setBrokenSlideKeys((previousKeys) => {
                  const nextKeys = new Set(previousKeys);
                  nextKeys.add(activeSlideItem.key);
                  return nextKeys;
                });
              }
            }}
          />
        ) : !activeSlideInvalid ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: 13,
              userSelect: 'none',
            }}
          >
            暂无缩略图
          </div>
        ) : null}

        {activeSlideInvalid && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: 8,
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.92)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            无效缩略图
          </div>
        )}

        {hasMultipleSlides && (
          <>
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((prevIndex) => (prevIndex - 1 + slideCount) % slideCount);
              }}
              style={{
                position: 'absolute',
                left: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#fff',
                background: 'rgba(0, 0, 0, 0.35)',
                border: 'none',
              }}
            />
            <Button
              type="text"
              icon={<RightOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((prevIndex) => (prevIndex + 1) % slideCount);
              }}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#fff',
                background: 'rgba(0, 0, 0, 0.35)',
                border: 'none',
              }}
            />
          </>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        {previewSlides.map((slide, index) => {
                  const slideSrc = brokenSlideKeys.has(slide.key)
            ? ''
            : slide.src;
          const slideInvalid = slide.formatInvalid || brokenSlideKeys.has(slide.key);

          return (
          <div
            key={slide.key}
            style={{
              width: 92,
              height: 56,
              flex: '0 0 auto',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 6,
                border:
                  activeIndex === index
                    ? '1px solid #6ee7b7'
                    : '1px solid #2d3741',
                overflow: 'hidden',
                padding: 0,
                cursor: 'pointer',
                background: '#161d24',
              }}
            >
              {slideSrc && (
                <img
                  src={slideSrc}
                  alt={`缩略图 ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => {
                    setBrokenSlideKeys((previousKeys) => {
                      const nextKeys = new Set(previousKeys);
                      nextKeys.add(slide.key);
                      return nextKeys;
                    });
                  }}
                />
              )}

              {slideInvalid && (
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    right: 2,
                    padding: '2px 4px',
                    borderRadius: 4,
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  无效缩略图
                </div>
              )}
            </button>

            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  openEditor(index);
              }}
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 18,
                height: 18,
                minWidth: 18,
                padding: 0,
                borderRadius: 9,
                background: 'rgba(0, 0, 0, 0.55)',
                color: '#fff',
                border: 'none',
              }}
              />
          </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddThumbnail}
          style={{
            width: 92,
            height: 56,
            flex: '0 0 auto',
            borderRadius: 6,
            border: '1px dashed #475569',
            background: '#161d24',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusOutlined />
        </button>
      </div>

      <Modal
        open={editorOpen}
        title={editingIndex === null ? '添加缩略图' : '缩略图设置'}
        onCancel={() => setEditorOpen(false)}
        footer={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div>
              {editingIndex !== null && (
                <Button danger icon={<DeleteOutlined />} onClick={handleDeleteThumbnail}>
                  删除
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setEditorOpen(false)}>取消</Button>
              <Button type="primary" onClick={handleSaveThumbnail}>
                {editingIndex === null ? '创建' : '保存'}
              </Button>
            </div>
          </div>
        }
        width={480}
        styles={{
          body: { paddingTop: 12 },
          mask: { background: 'rgba(0, 0, 0, 0.72)' },
        }}
      >
        <Input
          value={editingUrl}
          onChange={(event) => setEditingUrl(event.target.value)}
          placeholder="https://..."
        />
      </Modal>

      <Modal
        open={fullscreenOpen}
        onCancel={() => setFullscreenOpen(false)}
        footer={null}
        centered
        mask
        width="84vw"
        styles={{
          mask: { background: 'rgba(12, 16, 22, 0.62)' },
          body: { padding: 0, background: 'transparent' },
        }}
      >
        <div
          onWheel={(event) => {
            if (!activeSlide) return;
            event.preventDefault();
            const step = 0.12;
            const minScale = 0.5;
            const maxScale = 5;
            setFullscreenScale((previousScale) => {
              const nextScale =
                event.deltaY < 0 ? previousScale + step : previousScale - step;
              return Math.min(maxScale, Math.max(minScale, nextScale));
            });
          }}
          style={{
            width: '100%',
            height: '80vh',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activeSlide && (
            <img
              src={activeSlide}
              alt={name || '游戏缩略图全屏预览'}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${fullscreenScale})`,
                transformOrigin: 'center center',
                transition: 'transform 80ms linear',
                userSelect: 'none',
              }}
              onError={() => {
                if (activeSlideItem) {
                  setBrokenSlideKeys((previousKeys) => {
                    const nextKeys = new Set(previousKeys);
                    nextKeys.add(activeSlideItem.key);
                    return nextKeys;
                  });
                }
              }}
            />
          )}

          {activeSlideInvalid && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.92)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              无效缩略图
            </div>
          )}

          {hasMultipleSlides && (
            <>
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() =>
                  setActiveIndex((prevIndex) => (prevIndex - 1 + slideCount) % slideCount)
                }
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fff',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: 'none',
                }}
              />
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={() =>
                  setActiveIndex((prevIndex) => (prevIndex + 1) % slideCount)
                }
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fff',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: 'none',
                }}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
