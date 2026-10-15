import { PlaylistTrack } from '../data/playlistData';

/**
 * Industry-standard Fisher-Yates (Knuth) Shuffle Queue Generator
 * Pins the anchor track at index 0, and shuffles the remaining tracks with uniform randomness.
 */
export function buildFisherYatesQueue(tracks: PlaylistTrack[], anchorTrackId?: string): string[] {
  if (!tracks || tracks.length === 0) return [];
  if (tracks.length === 1) return [tracks[0].id];

  const anchorIdx = anchorTrackId
    ? tracks.findIndex((t) => t.id === anchorTrackId)
    : -1;
  const validAnchorId =
    anchorIdx >= 0
      ? tracks[anchorIdx].id
      : tracks[Math.floor(Math.random() * tracks.length)].id;
  const resolvedAnchorIdx = tracks.findIndex((t) => t.id === validAnchorId);
  const sequentialNextId =
    tracks[(resolvedAnchorIdx + 1) % tracks.length]?.id;

  const remaining = tracks
    .filter((t) => t.id !== validAnchorId)
    .map((t) => t.id);

  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = remaining[i];
    remaining[i] = remaining[j];
    remaining[j] = temp;
  }

  if (remaining.length >= 2 && remaining[0] === sequentialNextId) {
    const swapIdx = 1 + Math.floor(Math.random() * (remaining.length - 1));
    const temp = remaining[0];
    remaining[0] = remaining[swapIdx];
    remaining[swapIdx] = temp;
  }

  return [validAnchorId, ...remaining];
}
