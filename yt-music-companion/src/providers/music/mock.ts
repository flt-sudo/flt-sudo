import {
  type HistoryTrack,
  type MusicProvider,
  type PlaylistDetail,
  type PlaylistSummary,
  type Privacy,
  ProviderError,
  type ProviderStatus,
  type Track,
} from "./types.js";

/**
 * Deterministic, clearly fictional catalog for tests and offline demos.
 * MUSIC_PROVIDER=mock never touches YouTube; its ids are not real videos.
 */
interface MockTrack extends Track {
  tags: string[];
}

const RAW: Array<[string, string, string, number, string[]]> = [
  // [title, artist, album, durationS, tags]
  ["Velvet Hour", "Nova Lune", "Low Tide", 241, ["rnb", "slow", "romantic", "night"]],
  ["Glass Balcony", "Nova Lune", "Low Tide", 215, ["rnb", "romantic", "atmospheric"]],
  ["Biscayne Blue", "Coral Static", "Ocean Drive", 198, ["latin", "romantic", "miami", "warm"]],
  ["Neon Palms", "Coral Static", "Ocean Drive", 230, ["synthwave", "miami", "night", "driving"]],
  ["Midnight Causeway", "Arcade Saints", "Freeway", 276, ["synthwave", "driving", "night", "energetic"]],
  ["Taillight Prayer", "Arcade Saints", "Freeway", 254, ["synthwave", "driving", "atmospheric"]],
  ["Silk Static", "Mira Vey", "Soft Focus", 188, ["neo-soul", "intimate", "romantic"]],
  ["Candle Theory", "Mira Vey", "Soft Focus", 205, ["neo-soul", "intimate", "slow"]],
  ["Gold Leaf", "The Quiet Expensive", "Lacquer", 263, ["jazz", "intimate", "atmospheric", "expensive"]],
  ["Marble Room", "The Quiet Expensive", "Lacquer", 300, ["jazz", "atmospheric", "expensive", "night"]],
  ["Run It Up", "Kilo Bloom", "Pressure", 172, ["hip-hop", "energetic", "workout"]],
  ["Concrete Garden", "Kilo Bloom", "Pressure", 190, ["hip-hop", "energetic"]],
  ["Paper Moons", "Halcyon Drift", "Afterglow", 240, ["indie", "dreamy", "atmospheric"]],
  ["Slow Burn Avenue", "Halcyon Drift", "Afterglow", 222, ["indie", "romantic", "night"]],
  ["Sunrise Over Brickell", "Coral Static", "Ocean Drive", 210, ["latin", "miami", "uplifting"]],
  ["Warm Static", "Ivo Ren", "Room Tone", 233, ["electronic", "atmospheric", "chill"]],
  ["Afterhours Lobby", "Ivo Ren", "Room Tone", 287, ["electronic", "night", "expensive", "atmospheric"]],
  ["Heartline", "Sade Rivers", "Tender", 245, ["rnb", "romantic", "intimate"]],
  ["Bloom (Unavailable)", "Sade Rivers", "Tender", 230, ["rnb", "romantic"]],
  ["Pulse Theory", "Vanta Kids", "Overclock", 201, ["electronic", "energetic", "workout", "driving"]],
];

function makeCatalog(): MockTrack[] {
  return RAW.map(([title, artist, album, durationS, tags], i) => ({
    videoId: `mock${String(i).padStart(7, "0")}`,
    title,
    artists: [artist],
    album,
    durationS,
    isAvailable: !title.includes("Unavailable"),
    tags,
  }));
}

const strip = ({ tags: _t, ...t }: MockTrack): Track => t;

export class MockProvider implements MusicProvider {
  readonly name = "mock";
  readonly catalog = makeCatalog();
  private auth: string | null = null;
  private playlists = new Map<string, PlaylistDetail>();
  private lateNight: PlaylistDetail;
  calls: Array<{ method: string; args: unknown[] }> = [];

  constructor() {
    this.lateNight = { playlistId: "PLmocklatenight", title: "Late Night", description: "demo", trackCount: 3, tracks: [0, 9, 16].map((i) => strip(this.catalog[i]!)) };
  }

  async configure(auth: string | null) {
    this.auth = auth;
  }
  async status(): Promise<ProviderStatus> {
    return { provider: this.name, available: true, authenticated: !!this.auth, detail: "fictional demo catalog" };
  }
  async setupBrowserAuth(headersRaw: string) {
    if (!/cookie:/i.test(headersRaw)) throw new ProviderError("invalid_headers", "Headers must include a cookie line.");
    return JSON.stringify({ mock: true });
  }
  private requireAuth() {
    if (!this.auth) throw new ProviderError("not_authenticated", "YouTube Music account not connected");
  }

  async searchSongs(query: string, limit = 20) {
    this.calls.push({ method: "searchSongs", args: [query] });
    const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    const scored = this.catalog
      .map((t) => {
        const hay = `${t.title} ${t.artists.join(" ")} ${t.album} ${t.tags.join(" ")}`.toLowerCase();
        return { t, s: words.filter((w) => hay.includes(w)).length };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return scored.slice(0, limit).map((x) => strip(x.t));
  }
  async searchVideos(query: string, limit = 20) {
    return this.searchSongs(query, limit);
  }
  async radio(videoId: string, limit = 25) {
    this.calls.push({ method: "radio", args: [videoId] });
    const seed = this.catalog.find((t) => t.videoId === videoId);
    if (!seed) return [];
    return this.catalog
      .filter((t) => t.videoId !== videoId)
      .map((t) => ({ t, s: t.tags.filter((g) => seed.tags.includes(g)).length }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => strip(x.t));
  }
  async likedSongs() {
    this.requireAuth();
    return [0, 1, 6, 8, 17].map((i) => strip(this.catalog[i]!));
  }
  async librarySongs() {
    this.requireAuth();
    return [0, 1, 2, 4, 6, 8, 12, 17].map((i) => strip(this.catalog[i]!));
  }
  async libraryPlaylists(): Promise<PlaylistSummary[]> {
    this.requireAuth();
    const own = [...this.playlists.values()].map(({ tracks, ...p }) => ({ ...p, trackCount: tracks.length }));
    return [{ playlistId: "PLmocklatenight", title: "Late Night", trackCount: this.lateNight.tracks.length, description: "demo" }, ...own];
  }
  async playlist(playlistId: string): Promise<PlaylistDetail> {
    if (playlistId === "PLmocklatenight") return { ...this.lateNight, tracks: [...this.lateNight.tracks] };
    const p = this.playlists.get(playlistId);
    if (!p) throw new ProviderError("invalid_params", "playlist not found");
    return p;
  }
  async history(): Promise<HistoryTrack[]> {
    this.requireAuth();
    return [
      { ...strip(this.catalog[4]!), playedBucket: "Today" },
      { ...strip(this.catalog[0]!), playedBucket: "Today" },
      { ...strip(this.catalog[8]!), playedBucket: "Yesterday" },
    ];
  }
  async createPlaylist(title: string, description: string, _privacy: Privacy, videoIds: string[]) {
    this.requireAuth();
    this.calls.push({ method: "createPlaylist", args: [title, videoIds] });
    const playlistId = `PLmock${this.playlists.size + 1}`;
    const tracks = videoIds.map((id) => this.catalog.find((t) => t.videoId === id)).filter(Boolean).map((t) => strip(t!));
    this.playlists.set(playlistId, { playlistId, title, description, tracks, trackCount: tracks.length });
    return { playlistId };
  }
  async addPlaylistItems(playlistId: string, videoIds: string[]) {
    this.requireAuth();
    this.calls.push({ method: "addPlaylistItems", args: [playlistId, videoIds] });
    const p = playlistId === "PLmocklatenight" ? this.lateNight : this.playlists.get(playlistId);
    if (p) {
      for (const id of videoIds) {
        const t = this.catalog.find((c) => c.videoId === id);
        if (t) p.tracks.push(strip(t));
      }
    }
    return { added: videoIds.length };
  }
  async close() {}

  /** Mock-only: the hidden tags, used by the heuristic annotator in demo mode. */
  tagsFor(videoId: string): string[] {
    return this.catalog.find((t) => t.videoId === videoId)?.tags ?? [];
  }
}
