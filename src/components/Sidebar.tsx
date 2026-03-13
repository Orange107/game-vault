import { useMemo, useState } from 'react';
import { Input, Button } from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    SettingOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined,
    BarChartOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import { useGameStore } from '../store';
import { PLATFORMS } from '../types';

interface SidebarProps {
    onAddTag: () => void;
    onOpenTagManager: () => void;
    isMobile: boolean;
    isOpen: boolean;
    topOffset: number;
}

export const Sidebar = ({
    onAddTag,
    onOpenTagManager,
    isMobile,
    isOpen,
    topOffset,
}: SidebarProps) => {
    const {
        tags,
        games,
        selectedTagId,
        selectTag,
        selectedPlatform,
        selectPlatform,
        openLeftDrawer,
        openPlatformDrawer,
        customPlatforms,
        deletedPlatforms,
    } = useGameStore();

    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<'name' | 'count'>('name');
    const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc'>('asc');
    const [countSortOrder, setCountSortOrder] = useState<'asc' | 'desc'>('desc');

    // 计算所有可用平台
    const availableBuiltIns = PLATFORMS.filter((p) => !deletedPlatforms.includes(p));
    const allPlatforms = [...availableBuiltIns, ...customPlatforms];

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
    );

    const tagGameCountMap = useMemo(() => {
        const countMap = new Map<string, number>();
        tags.forEach((tag) => countMap.set(tag.id, 0));

        games.forEach((game) => {
            game.tags.forEach((tagId) => {
                countMap.set(tagId, (countMap.get(tagId) || 0) + 1);
            });
        });

        return countMap;
    }, [games, tags]);

    const platformGameCountMap = useMemo(() => {
        const countMap = new Map<string, number>();
        allPlatforms.forEach((platform) => countMap.set(platform, 0));

        games.forEach((game) => {
            game.platform.forEach((platform) => {
                countMap.set(platform, (countMap.get(platform) || 0) + 1);
            });
        });

        return countMap;
    }, [allPlatforms, games]);

    const formatPlatformLabel = (name: string, count: number) =>
        count > 0 ? `${name}(${count})` : name;

    const sortedTags = useMemo(() => {
        const list = [...filteredTags];

        if (sortMode === 'count') {
            return list.sort((a, b) => {
                const countA = tagGameCountMap.get(a.id) || 0;
                const countB = tagGameCountMap.get(b.id) || 0;
                if (countSortOrder === 'asc') {
                    if (countA !== countB) return countA - countB;
                } else if (countA !== countB) {
                    return countB - countA;
                }
                return a.name.localeCompare(b.name);
            });
        }

        if (nameSortOrder === 'asc') {
            return list.sort((a, b) => a.name.localeCompare(b.name));
        }
        return list.sort((a, b) => b.name.localeCompare(a.name));
    }, [filteredTags, sortMode, nameSortOrder, countSortOrder, tagGameCountMap]);

    return (
        <div
            style={{
                width: 240,
                background: '#202934',
                borderRight: '1px solid #2d3741',
                height: `calc(100vh - ${topOffset}px)`,
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                left: 0,
                top: topOffset,
                zIndex: isMobile ? 90 : 10,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
                boxShadow: isMobile && isOpen ? '4px 0 20px rgba(0, 0, 0, 0.35)' : 'none',
            }}
        >
            {/* FILTERS & MANAGERS Section */}
            <div
                style={{
                    padding: '16px',
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                }}
            >
                <div
                    style={{
                        marginBottom: 20,
                    }}
                >
                    <span
                        style={{
                            color: '#94a3b8',
                            fontSize: 14,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                        }}
                    >
                        筛选与管理
                    </span>
                </div>

                {/* PLATFORM Filter */}
                <div style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            color: '#94a3b8',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>平台</span>
                        <SettingOutlined
                            style={{ fontSize: 12, cursor: 'pointer', color: '#64748b' }}
                            onClick={openPlatformDrawer}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => selectPlatform(null)}
                            style={{
                                border: selectedPlatform === null
                                    ? '1px solid rgba(110, 231, 183, 0.45)'
                                    : '1px solid #3a4655',
                                background: selectedPlatform === null
                                    ? 'rgba(110, 231, 183, 0.12)'
                                    : '#1b232d',
                                color: selectedPlatform === null ? '#6ee7b7' : '#cbd5e1',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 12,
                                cursor: 'pointer',
                                lineHeight: 1.2,
                            }}
                        >
                            {formatPlatformLabel('全部', games.length)}
                        </button>
                        {allPlatforms.map((platform) => {
                            const isActive = selectedPlatform === platform;
                            const platformGameCount = platformGameCountMap.get(platform) || 0;
                            return (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() => selectPlatform(isActive ? null : platform)}
                                    style={{
                                        border: isActive
                                            ? '1px solid rgba(110, 231, 183, 0.45)'
                                            : '1px solid #3a4655',
                                        background: isActive
                                            ? 'rgba(110, 231, 183, 0.12)'
                                            : '#1b232d',
                                        color: isActive ? '#6ee7b7' : '#cbd5e1',
                                        borderRadius: 6,
                                        padding: '5px 10px',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {formatPlatformLabel(platform, platformGameCount)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* TAGS Section */}
                <div>
                    <div
                        style={{
                            color: '#94a3b8',
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>标签</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button
                                type="text"
                                size="small"
                                icon={<PlusOutlined style={{ fontSize: 14 }} />}
                                onClick={onAddTag}
                                style={{
                                    color: '#6ee7b7',
                                    padding: '4px 8px',
                                    minWidth: 'auto',
                                    height: 'auto',
                                }}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={
                                    nameSortOrder === 'asc'
                                        ? <SortAscendingOutlined style={{ fontSize: 13 }} />
                                        : <SortDescendingOutlined style={{ fontSize: 13 }} />
                                }
                                onClick={() => {
                                    setSortMode('name');
                                    setNameSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
                                }}
                                style={{
                                    color: sortMode === 'name' ? '#6ee7b7' : '#64748b',
                                    padding: '4px 6px',
                                    minWidth: 'auto',
                                    height: 'auto',
                                }}
                                title={nameSortOrder === 'asc' ? '名称正序' : '名称倒序'}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<BarChartOutlined style={{ fontSize: 13 }} />}
                                onClick={() => {
                                    setSortMode('count');
                                    setCountSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
                                }}
                                style={{
                                    color: sortMode === 'count' ? '#6ee7b7' : '#64748b',
                                    padding: '4px 6px',
                                    minWidth: 'auto',
                                    height: 'auto',
                                }}
                                title={countSortOrder === 'asc' ? '关联数量正序' : '关联数量倒序'}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<TagsOutlined style={{ fontSize: 13 }} />}
                                onClick={onOpenTagManager}
                                style={{
                                    color: '#94a3b8',
                                    padding: '4px 6px',
                                    minWidth: 'auto',
                                    height: 'auto',
                                }}
                                title="管理标签"
                            />
                        </div>
                    </div>

                    <Input
                        prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        allowClear={{
                            clearIcon: <span style={{ color: '#64748b', fontSize: 16, lineHeight: 1 }}>×</span>,
                        }}
                        style={{
                            background: '#161d24',
                            border: '1px solid #2d3741',
                            color: '#fff',
                            borderRadius: 6,
                            marginBottom: 12,
                        }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {sortedTags.map((tag) => {
                            const isSelected = selectedTagId === tag.id;
                            const linkedGameCount = tagGameCountMap.get(tag.id) || 0;

                            return (
                                <div
                                    key={tag.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        background: isSelected ? 'rgba(110, 231, 183, 0.15)' : '#2d3742',
                                        border: isSelected ? '1px solid rgba(110, 231, 183, 0.3)' : '1px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onClick={() => selectTag(isSelected ? null : tag.id)}
                                >
                                    <span
                                        style={{
                                            color: isSelected ? '#6ee7b7' : '#cbd5e1',
                                            fontSize: 13,
                                            fontWeight: 500,
                                        }}
                                    >
                                        #{tag.name}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span
                                            style={{
                                                color: '#64748b',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                minWidth: 24,
                                                textAlign: 'right',
                                            }}
                                            title={`关联游戏 ${linkedGameCount} 个`}
                                        >
                                            {linkedGameCount}
                                        </span>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined style={{ fontSize: 12 }} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openLeftDrawer(tag.id);
                                            }}
                                            style={{
                                                color: '#64748b',
                                                padding: '0 4px',
                                                minWidth: 'auto',
                                                height: 'auto',
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div
                style={{
                    borderTop: '1px solid #2d3741',
                    minHeight: 44,
                    padding: '0 16px',
                    background: '#1b232d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <a
                    href="mailto:406787567@qq.com"
                    style={{
                        display: 'inline-block',
                        color: '#cbd5e1',
                        fontSize: 12,
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                    }}
                >
                    406787567@qq.com
                </a>
            </div>
        </div>
    );
};
