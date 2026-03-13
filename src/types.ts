export interface Tag {
  id: string;
  name: string;
  description: string;
}

export interface Game {
  id: string;
  name: string;
  aliases: string[];
  thumbnail: string;
  thumbnails?: string[];
  gameUrl?: string;
  platform: string[];
  rating: number;
  stars: number;
  synopsis: string;
  tags: string[];
  implementations: Record<string, string>;
}

export interface EditableGame {
  name: string;
  aliases: string[];
  thumbnail: string;
  thumbnails: string[];
  gameUrl?: string;
  platform: string[];
  rating: number;
  stars: number;
  synopsis: string;
  tags: string[];
}

export type Platform = 'PC' | 'PS5' | 'Xbox' | 'Switch' | 'Mobile' | 'Web';

export const PLATFORMS: Platform[] = ['PC', 'PS5', 'Xbox', 'Switch', 'Mobile', 'Web'];
