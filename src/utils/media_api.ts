import { r } from "~/utils"
import type {
  MediaItem,
  AlbumInfo,
  MediaConfig,
  MediaScanProgress,
  MediaListQuery,
  MediaType,
} from "~/types"
import type { Resp } from "~/types"

// ==================== 公开API ====================

/** 获取媒体列表 */
export const getMediaList = (query: MediaListQuery) =>
  r.get("/fs/media/list", { params: query }) as Promise<
    Resp<{ content: MediaItem[]; total: number }>
  >

/** 获取媒体详情 */
export const getMediaItem = (id: number) =>
  r.get(`/fs/media/item/${id}`) as Promise<Resp<MediaItem>>

/** 获取专辑列表 */
export const getAlbumList = (params: {
  page?: number
  page_size?: number
  keyword?: string
}) =>
  r.get("/fs/media/albums", { params }) as Promise<
    Resp<{ content: AlbumInfo[]; total: number }>
  >

/** 获取专辑曲目 */
export const getAlbumTracks = (albumName: string, albumArtist: string) =>
  r.get("/fs/media/album", {
    params: { album_name: albumName, album_artist: albumArtist },
  }) as Promise<Resp<MediaItem[]>>

/** 获取文件夹列表（目录浏览模式） */
export const getMediaFolders = (mediaType: MediaType) =>
  r.get("/fs/media/folders", { params: { media_type: mediaType } }) as Promise<
    Resp<string[]>
  >

// ==================== 管理API ====================

/** 获取所有媒体库配置 */
export const adminGetMediaConfigs = () =>
  r.get("/admin/media/config/list") as Promise<Resp<MediaConfig[]>>

/** 保存媒体库配置 */
export const adminSaveMediaConfig = (cfg: Partial<MediaConfig>) =>
  r.post("/admin/media/config/save", cfg) as Promise<Resp<null>>

/** 后台获取媒体条目列表 */
export const adminGetMediaItems = (params: {
  media_type?: MediaType
  page?: number
  page_size?: number
  keyword?: string
  order_by?: string
  order_dir?: string
}) =>
  r.get("/admin/media/items", { params }) as Promise<
    Resp<{ content: MediaItem[]; total: number }>
  >

/** 更新媒体条目 */
export const adminUpdateMediaItem = (
  item: Partial<MediaItem> & { id: number },
) => r.post("/admin/media/items/update", item) as Promise<Resp<null>>

/** 删除媒体条目 */
export const adminDeleteMediaItem = (id: number) =>
  r.post("/admin/media/items/delete", null, {
    params: { id },
  }) as Promise<Resp<null>>

/** 开始扫描 */
export const adminStartMediaScan = (mediaType: MediaType) =>
  r.post("/admin/media/scan/start", {
    media_type: mediaType,
  }) as Promise<Resp<null>>

/** 获取扫描进度 */
export const adminGetMediaScanProgress = (mediaType: MediaType) =>
  r.get("/admin/media/scan/progress", {
    params: { media_type: mediaType },
  }) as Promise<Resp<MediaScanProgress>>

/** 开始刮削 */
export const adminStartMediaScrape = (mediaType: MediaType, itemId?: number) =>
  r.post("/admin/media/scrape/start", {
    media_type: mediaType,
    item_id: itemId ?? 0,
  }) as Promise<Resp<null>>

/** 清空媒体数据库 */
export const adminClearMediaDB = (mediaType: MediaType) =>
  r.post("/admin/media/clear", null, {
    params: { media_type: mediaType },
  }) as Promise<Resp<null>>
