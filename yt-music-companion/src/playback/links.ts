/**
 * YouTube Music links. On iPhone, https://music.youtube.com links are universal
 * links: tapping one (or a Shortcuts "Open URLs" action) opens the YouTube Music
 * app when it is installed, otherwise the website. Opening a link is the only
 * thing this server can do — it never knows whether playback actually started.
 */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const LIST_ID = /^[A-Za-z0-9_-]{2,64}$/;

export function trackLinks(videoId: string) {
  return {
    web: `https://music.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
    /** Start a radio (auto-continuing similar songs) from this track. */
    radio: `https://music.youtube.com/watch?v=${encodeURIComponent(videoId)}&list=RDAMVM${encodeURIComponent(videoId)}`,
  };
}

export function playlistLinks(playlistId: string) {
  return {
    web: `https://music.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`,
    play: `https://music.youtube.com/watch?list=${encodeURIComponent(playlistId)}`,
  };
}

export function searchLink(query: string) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * EXPERIMENTAL: an ad-hoc queue for tracks that were not saved as a playlist.
 * youtube.com/watch_videos builds a temporary list; it opens in YouTube (not
 * necessarily YouTube Music) and Google may change or remove it.
 */
export function adhocQueueLink(videoIds: string[]) {
  const ids = videoIds.filter((v) => VIDEO_ID.test(v)).slice(0, 50);
  return `https://www.youtube.com/watch_videos?video_ids=${ids.join(",")}`;
}

export function isVideoId(v: string) {
  return VIDEO_ID.test(v) || /^mock\d{7}$/.test(v);
}
export function isPlaylistId(v: string) {
  return LIST_ID.test(v);
}
