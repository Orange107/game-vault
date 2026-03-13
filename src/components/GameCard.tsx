import { useEffect, useState } from 'react';
import { Rate } from 'antd';
import { motion } from 'framer-motion';
import type { Game, Tag as TagType } from '../types';
import { useGameStore } from '../store';

interface GameCardProps {
    game: Game;
}

export const GameCard = ({ game }: GameCardProps) => {
    const { tags, openRightDrawer, editingGameId } = useGameStore();
    const gameTags = tags.filter((t: TagType) => game.tags.includes(t.id));
    const isSelected = editingGameId === game.id;
    const [thumbnailLoadFailed, setThumbnailLoadFailed] = useState(false);

    useEffect(() => {
        setThumbnailLoadFailed(false);
    }, [game.thumbnail]);

    const thumbnailUrl = game.thumbnail.trim();
    const isValidImageUrl = (url: string) => {
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };
    const hasThumbnail = thumbnailUrl.length > 0;
    const formatInvalid = hasThumbnail && !isValidImageUrl(thumbnailUrl);
    const thumbnailInvalid = formatInvalid || thumbnailLoadFailed;

    return (
        <motion.div
            whileHover={{
                y: -4,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            }}
            transition={{
                duration: 0.2,
            }}
            style={{ cursor: 'pointer', width: '100%' }}
            onClick={() => openRightDrawer(game.id)}
        >
            <div
                style={{
                    width: '100%',
                    aspectRatio: '5/7',
                    background: '#293540',
                    border: '1px solid #2d3741',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: isSelected
                        ? 'inset 0 0 0 1px #6ee7b7, 0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 10,
                }}
            >
                {/* Thumbnail Container */}
                <div
                    style={{
                        width: '100%',
                        aspectRatio: '1.35',
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#1e262e',
                        marginBottom: 10,
                        position: 'relative',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            zIndex: 2,
                        }}
                    >
                        {game.platform.slice(0, 2).map((platform) => (
                            <span
                                key={platform}
                                style={{
                                    background: 'rgba(10, 14, 20, 0.75)',
                                    color: '#dbe4ef',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    border: '1px solid rgba(203, 213, 225, 0.35)',
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    whiteSpace: 'nowrap',
                                    backdropFilter: 'blur(2px)',
                                }}
                            >
                                {platform}
                            </span>
                        ))}
                        {game.platform.length > 2 && (
                            <span
                                style={{
                                    background: 'rgba(10, 14, 20, 0.75)',
                                    color: '#dbe4ef',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    border: '1px solid rgba(203, 213, 225, 0.35)',
                                    padding: '1px 4px',
                                    borderRadius: 4,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                +{game.platform.length - 2}
                            </span>
                        )}
                    </div>

                    {hasThumbnail && !thumbnailInvalid && (
                        <img
                            src={thumbnailUrl}
                            alt={game.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                            onError={() => {
                                setThumbnailLoadFailed(true);
                            }}
                        />
                    )}

                    {thumbnailInvalid && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                right: 6,
                                padding: '3px 6px',
                                borderRadius: 6,
                                background: 'rgba(239, 68, 68, 0.92)',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 600,
                                textAlign: 'center',
                            }}
                        >
                            无效缩略图
                        </div>
                    )}

                    {!hasThumbnail && (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b',
                                fontSize: 12,
                                userSelect: 'none',
                            }}
                        >
                            暂无缩略图
                        </div>
                    )}
                </div>

                {/* Game Name and Platform Row */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        marginBottom: 4,
                        minHeight: 20,
                    }}
                >
                    <span
                        style={{
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                        }}
                    >
                        {game.name}
                    </span>
                </div>

                {/* Rating + Stars */}
                <div
                    style={{
                        marginBottom: 8,
                        minHeight: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}
                >
                    <Rate
                        disabled
                        value={game.stars}
                        className="game-card-rate"
                        style={{ fontSize: 16, color: '#fbbf24', flexShrink: 0 }}
                    />
                    <span
                        style={{
                            color: '#cbd5e1',
                            fontSize: 12,
                            fontWeight: 600,
                            marginLeft: 'auto',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                            border: '1px solid #3d4850',
                            borderRadius: 4,
                            padding: '1px 6px',
                            lineHeight: 1.4,
                        }}
                    >
                        {game.rating}
                    </span>
                </div>

                {/* Tags - Inline layout */}
                {gameTags.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            alignContent: 'flex-start',
                            overflow: 'hidden',
                            minHeight: 22,
                            maxHeight: 44,
                        }}
                    >
                        {gameTags.slice(0, 3).map((tag: TagType) => (
                            <span
                                key={tag.id}
                                style={{
                                    background: '#3d4850',
                                    color: '#cbd5e1',
                                    fontSize: 11,
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%',
                                    flexShrink: 1,
                                }}
                                title={`#${tag.name}`}
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
