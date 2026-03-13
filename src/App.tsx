import { useEffect, useRef, useState } from 'react';
import { ConfigProvider, theme, Empty, Input, Button, Space } from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { GameCard } from './components/GameCard';
import { TagEditorDrawer } from './components/TagEditorDrawer';
import { GameDetailDrawer } from './components/GameDetailDrawer';
import { AddGameModal } from './components/AddGameModal';
import { AddTagModal } from './components/AddTagModal';
import { PlatformEditorDrawer } from './components/PlatformEditorDrawer';
import { TagManagementDrawer } from './components/TagManagementDrawer';
import { useGameStore } from './store';

const MOBILE_BREAKPOINT = 992;
const DESKTOP_SIDEBAR_WIDTH = 240;

function App() {
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addTagModalOpen, setAddTagModalOpen] = useState(false);
    const [tagManagerOpen, setTagManagerOpen] = useState(false);
    const [sortBy, setSortBy] = useState<'评分' | '名称' | '热度'>('评分');
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
    );
    const [sidebarOpen, setSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= MOBILE_BREAKPOINT : true
    );
    const [headerHeight, setHeaderHeight] = useState(64);
    const wasMobileRef = useRef(isMobile);
    const headerRef = useRef<HTMLElement | null>(null);
    const {
        getFilteredGames,
        leftDrawerOpen,
        rightDrawerOpen,
        platformDrawerOpen,
        searchQuery,
        setSearchQuery,
        selectedPlatform,
        selectedTagId,
        initialize,
    } = useGameStore();
    const filteredGames = getFilteredGames();

    useEffect(() => {
        initialize().catch(() => {
            // store.error is set in refreshData; swallow here to avoid unhandled rejection
        });
    }, [initialize]);

    useEffect(() => {
        const handleResize = () => {
            const nextMobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(nextMobile);

            if (nextMobile !== wasMobileRef.current) {
                setSidebarOpen(!nextMobile);
                wasMobileRef.current = nextMobile;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const updateHeaderHeight = () => {
            const measuredHeight = headerRef.current?.getBoundingClientRect().height ?? 64;
            setHeaderHeight(Math.round(measuredHeight));
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
            resizeObserver = new ResizeObserver(() => updateHeaderHeight());
            resizeObserver.observe(headerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateHeaderHeight);
            resizeObserver?.disconnect();
        };
    }, [isMobile]);

    const sortedGames = [...filteredGames].sort((a, b) => {
        if (sortBy === '评分') return b.rating - a.rating;
        if (sortBy === '名称') return a.name.localeCompare(b.name);
        if (sortBy === '热度') return b.stars - a.stars;
        return 0;
    });
    const hasGlobalMask = leftDrawerOpen || rightDrawerOpen || platformDrawerOpen || addModalOpen;

    const mainMarginLeft = !isMobile && sidebarOpen ? DESKTOP_SIDEBAR_WIDTH : 0;
    const sidebarTopOffset = isMobile ? Math.max(0, headerHeight - 1) : headerHeight;

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#6ee7b7',
                    colorBgContainer: '#1e262e',
                    colorBgElevated: '#1e262e',
                    colorBorder: '#2d3741',
                    colorText: '#ffffff',
                    colorTextSecondary: '#94a3b8',
                    borderRadius: 6,
                },
                components: {
                    Drawer: {
                        colorBgElevated: '#1e262e',
                    },
                    Modal: {
                        colorBgElevated: '#1e262e',
                    },
                    Select: {
                        colorBgContainer: '#161d24',
                        colorBgElevated: '#161d24',
                    },
                    Input: {
                        colorBgContainer: '#161d24',
                    },
                    Slider: {
                        colorPrimary: '#6ee7b7',
                    },
                    Collapse: {
                        colorBgContainer: 'transparent',
                    },
                },
            }}
        >
            <div
                style={{
                    minHeight: '100vh',
                    background: '#12181d',
                    color: '#fff',
                }}
            >
                <AnimatePresence>
                    {hasGlobalMask && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0)',
                                zIndex: 50,
                            }}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isMobile && sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.35 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                position: 'fixed',
                                top: sidebarTopOffset,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.55)',
                                zIndex: 85,
                            }}
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Top Header Bar - 高度 64px */}
                <header
                    ref={headerRef}
                    style={{
                        minHeight: 64,
                        height: isMobile ? 'auto' : 64,
                        background: '#26313f',
                        borderBottom: '1px solid #2d3741',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: isMobile ? 'wrap' : 'nowrap',
                        gap: isMobile ? 10 : 0,
                        padding: isMobile ? '10px 12px 12px' : '0 24px',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 220,
                        overflow: 'visible',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            minWidth: 0,
                            flex: isMobile ? 1 : '0 0 auto',
                        }}
                    >
                        <Button
                            type="text"
                            icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                            onClick={() => setSidebarOpen((previous) => !previous)}
                            style={{
                                color: '#cbd5e1',
                                border: '1px solid #3b4756',
                                borderRadius: 6,
                                width: 34,
                                height: 34,
                                minWidth: 34,
                                padding: 0,
                                flexShrink: 0,
                            }}
                        />
                        {/* Left: Logo */}
                        <h1
                            style={{
                                margin: 0,
                                fontSize: isMobile ? 16 : 20,
                                fontWeight: 700,
                                color: '#ffffff',
                                letterSpacing: '-0.5px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{ color: '#cbd5e1', display: 'inline-flex', flexShrink: 0 }}
                            >
                                <svg
                                    width={isMobile ? '20' : '22'}
                                    height={isMobile ? '20' : '22'}
                                    viewBox="0 0 64 64"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle cx="20" cy="18" r="7" stroke="currentColor" strokeWidth="3" />
                                    <circle cx="44" cy="18" r="7" stroke="currentColor" strokeWidth="3" />
                                    <rect
                                        x="12"
                                        y="20"
                                        width="40"
                                        height="30"
                                        rx="15"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    <circle cx="24" cy="32" r="2" fill="currentColor" />
                                    <circle cx="40" cy="32" r="2" fill="currentColor" />
                                    <path
                                        d="M24 40C27 43 37 43 40 40"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                            PopoFrog's Game Note
                        </h1>
                    </div>

                    {/* Center: Search Bar - 宽度 400px */}
                    <div
                        style={{
                            flex: isMobile ? '1 0 100%' : 1,
                            display: 'flex',
                            justifyContent: 'center',
                            order: isMobile ? 3 : 2,
                        }}
                    >
                        <Input
                            prefix={<SearchOutlined style={{ color: '#64748b', fontSize: 16, marginLeft: 4 }} />}
                            placeholder="搜索游戏或别名..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear={{
                                clearIcon: <span style={{ color: '#64748b', fontSize: 16, lineHeight: 1 }}>×</span>,
                            }}
                            style={{
                                width: isMobile ? '100%' : 520,
                                background: '#16202d',
                                border: '1px solid #2d3741',
                                color: '#fff',
                                borderRadius: 6,
                                height: 40,
                                paddingLeft: 8,
                            }}
                        />
                    </div>

                    {/* Right: Add Button + User */}
                    <Space
                        size={isMobile ? 8 : 16}
                        align="center"
                        style={{
                            width: isMobile ? 'auto' : 200,
                            justifyContent: 'flex-end',
                            order: 2,
                            marginLeft: isMobile ? 'auto' : 0,
                        }}
                    >
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setAddModalOpen(true)}
                            style={{
                                background: '#6ee7b7',
                                borderColor: '#6ee7b7',
                                color: '#12181d',
                                fontWeight: 600,
                                height: 36,
                                padding: isMobile ? '0 12px' : '0 16px',
                                borderRadius: 6,
                                fontSize: 14,
                            }}
                        >
                            {isMobile ? '添加' : '添加游戏'}
                        </Button>
                        {!isMobile && (
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 6,
                                    background: '#161d24',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    border: '1px solid #2d3741',
                                }}
                            >
                                <UserOutlined style={{ fontSize: 18 }} />
                            </div>
                        )}
                    </Space>
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: '#000',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                        }}
                    />
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: -8,
                            height: 8,
                            pointerEvents: 'none',
                            background:
                                'linear-gradient(180deg, rgba(32, 32, 32, 0.62) 0%, rgba(32, 32, 32, 0.22) 42%, rgba(32, 32, 32, 0) 100%)',
                            opacity: hasGlobalMask ? 0 : 1,
                            transition: 'opacity 0.2s ease',
                        }}
                    />
                </header>

                <Sidebar
                    onAddTag={() => setAddTagModalOpen(true)}
                    onOpenTagManager={() => setTagManagerOpen(true)}
                    isMobile={isMobile}
                    isOpen={sidebarOpen}
                    topOffset={sidebarTopOffset}
                />

                <main
                    style={{
                        marginLeft: mainMarginLeft,
                        minHeight: '100vh',
                        paddingTop: headerHeight,
                        transition: 'margin-left 0.25s ease',
                    }}
                >
                    {/* Game List Container */}
                    <div
                        style={{
                            margin: isMobile ? '12px' : '24px',
                            padding: isMobile ? 12 : 20,
                            background: '#202934',
                            borderRadius: 12,
                            border: '1px solid #2d3741',
                        }}
                    >
                        {/* Game List Header */}
                        <div
                            style={{
                                marginBottom: isMobile ? 14 : 20,
                                display: 'flex',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                justifyContent: 'space-between',
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: isMobile ? 10 : 0,
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: isMobile ? 18 : 22,
                                    fontWeight: 600,
                                    color: '#ffffff',
                                }}
                            >
                                游戏列表
                            </h2>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ color: '#94a3b8', fontSize: 14 }}>排序：</span>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 4,
                                        padding: 2,
                                        borderRadius: 10,
                                        border: '1px solid #4b5a6d',
                                        background: '#47586c',
                                    }}
                                >
                                    {(['评分', '名称', '热度'] as const).map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setSortBy(option)}
                                            style={{
                                                padding: '4px 11px',
                                                minHeight: 28,
                                                borderRadius: 7,
                                                border: '1px solid transparent',
                                                background: sortBy === option ? '#273240' : 'transparent',
                                                color: sortBy === option ? '#f8fafc' : '#d7e0ea',
                                                fontWeight: sortBy === option ? 700 : 500,
                                                fontSize: 14,
                                                lineHeight: 1,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Game Grid */}
                        {sortedGames.length === 0 ? (
                            <Empty
                                description={
                                    <span style={{ color: '#94a3b8' }}>
                                        暂无游戏
                                    </span>
                                }
                                style={{
                                    marginTop: 100,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 136 : 168}px, 1fr))`,
                                    gap: isMobile ? 12 : 20,
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${sortBy}-${selectedPlatform || 'all'}-${selectedTagId || 'all'}-${searchQuery}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            display: 'contents',
                                        }}
                                    >
                                        {sortedGames.map((game, index) => (
                                            <motion.div
                                                key={game.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: index * 0.03,
                                                    ease: [0.25, 0.1, 0.25, 1],
                                                }}
                                            >
                                                <GameCard game={game} />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </main>

                <TagEditorDrawer />
                <PlatformEditorDrawer />
                <GameDetailDrawer />
                <AddGameModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
                <AddTagModal open={addTagModalOpen} onClose={() => setAddTagModalOpen(false)} />
                <TagManagementDrawer open={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
            </div>
        </ConfigProvider>
    );
}

export default App;
