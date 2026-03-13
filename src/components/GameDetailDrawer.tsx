import { useEffect, useState } from 'react';
import { Drawer, Space, Button, message } from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useGameStore } from '../store';
import { PLATFORMS, type EditableGame } from '../types';
import { GameEditorForm } from './GameEditorForm';
import {
    getPrimaryThumbnail,
    resolveEditorThumbnails,
    sanitizeThumbnailUrls,
} from '../utils/thumbnails';

export const GameDetailDrawer = () => {
    const {
        rightDrawerOpen,
        editingGameId,
        tags,
        games,
        closeRightDrawer,
        updateGame,
        deleteGame,
        customPlatforms,
        deletedPlatforms,
    } = useGameStore();

    const [localGame, setLocalGame] = useState<EditableGame | null>(null);
    const [expandedTagId, setExpandedTagId] = useState<string | null>(null);

    const editingGame = games.find((g) => g.id === editingGameId);

    // 计算所有可用平台
    const availableBuiltIns = PLATFORMS.filter((p) => !deletedPlatforms.includes(p));
    const allPlatforms = [...availableBuiltIns, ...customPlatforms];

    useEffect(() => {
        if (editingGame) {
            setLocalGame({
                name: editingGame.name,
                aliases: [...editingGame.aliases],
                thumbnail: editingGame.thumbnail,
                thumbnails: resolveEditorThumbnails(
                    editingGame.thumbnail,
                    editingGame.thumbnails
                ),
                gameUrl: editingGame.gameUrl || '',
                platform: [...editingGame.platform],
                rating: editingGame.rating,
                stars: editingGame.stars,
                synopsis: editingGame.synopsis,
                tags: [...editingGame.tags],
            });
            setExpandedTagId(null);
        }
    }, [editingGame]);

    if (!localGame) return null;

    const handleSave = async () => {
        if (editingGameId) {
            const normalizedThumbnails = sanitizeThumbnailUrls(localGame.thumbnails);
            const thumbnail = getPrimaryThumbnail(normalizedThumbnails, localGame.thumbnail || '');
            const thumbnails =
                normalizedThumbnails.length > 0 ? normalizedThumbnails : [];

            try {
                await updateGame(editingGameId, {
                    name: localGame.name,
                    aliases: localGame.aliases,
                    platform: localGame.platform,
                    gameUrl: localGame.gameUrl,
                    rating: localGame.rating,
                    stars: localGame.stars,
                    synopsis: localGame.synopsis,
                    tags: localGame.tags,
                    thumbnail,
                    thumbnails,
                });
                message.success('游戏信息保存成功');
                closeRightDrawer();
            } catch (error) {
                message.error(error instanceof Error ? error.message : '游戏保存失败');
            }
        }
    };

    const handleDelete = async () => {
        if (editingGameId) {
            try {
                await deleteGame(editingGameId);
                message.success('游戏已删除');
                closeRightDrawer();
            } catch (error) {
                message.error(error instanceof Error ? error.message : '游戏删除失败');
            }
        }
    };

    const handleTagClick = (tagId: string) => {
        setExpandedTagId(expandedTagId === tagId ? null : tagId);
    };

    return (
        <Drawer
            title={
                <span style={{ color: '#fff' }}>
                    {localGame.name || '游戏详情'}
                </span>
            }
            placement="right"
            onClose={closeRightDrawer}
            open={rightDrawerOpen}
            width="min(420px, 100vw)"
            zIndex={1300}
            styles={{
                body: { background: '#12181d', color: '#fff', padding: 24, overflowY: 'auto' },
                header: { background: '#1e262e', borderBottom: '1px solid #2d3741' },
            }}
            extra={
                <Space>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                    >
                        删除
                    </Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        style={{ background: '#6ee7b7', borderColor: '#6ee7b7', color: '#12181d' }}
                    >
                        保存
                    </Button>
                </Space>
            }
        >
            <GameEditorForm
                value={localGame}
                onChange={setLocalGame}
                tags={tags}
                allPlatforms={allPlatforms}
                showTagInfo
                expandedTagId={expandedTagId}
                onTagClick={handleTagClick}
            />
        </Drawer>
    );
};
