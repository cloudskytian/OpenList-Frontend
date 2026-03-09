import { createSignal, createResource, Show, For, createEffect } from "solid-js"
import {
  adminGetMediaConfigs,
  adminSaveMediaConfig,
  adminGetMediaItems,
  adminUpdateMediaItem,
  adminDeleteMediaItem,
  adminStartMediaScan,
  adminStartMediaScrape,
  adminClearMediaDB,
  adminGetMediaScanProgress,
} from "~/utils/media_api"
import type { MediaType, MediaItem, MediaConfig } from "~/types"

// 别名，方便内部使用
const getMediaConfig = async (mt: MediaType) => {
  const resp = await adminGetMediaConfigs()
  if (resp.code === 200) {
    const found = (resp.data as MediaConfig[]).find((c) => c.media_type === mt)
    return { code: 200, data: found ?? null }
  }
  return { code: resp.code, data: null }
}
const saveMediaConfig = adminSaveMediaConfig
const listMediaItems = adminGetMediaItems
const updateMediaItem = adminUpdateMediaItem
const deleteMediaItem = adminDeleteMediaItem
const scanMedia = adminStartMediaScan
const scrapeMedia = adminStartMediaScrape
const clearMediaDB = adminClearMediaDB
const getMediaScanProgress = adminGetMediaScanProgress

// ==================== 通用媒体管理页 ====================
interface MediaManagePageProps {
  mediaType: MediaType
  title: string
  icon: string
}

export const MediaManagePage = (props: MediaManagePageProps) => {
  // 配置状态
  const [config, setConfig] = createSignal<MediaConfig>({
    media_type: props.mediaType,
    enabled: false,
    scan_path: "/",
    path_merge: false,
    last_scan_at: null,
    last_scrape_at: null,
  })
  const [configSaving, setConfigSaving] = createSignal(false)

  // 扫描/刮削状态
  const [scanning, setScanning] = createSignal(false)
  const [scraping, setScraping] = createSignal(false)
  const [progress, setProgress] = createSignal<{
    status: string
    current: number
    total: number
  } | null>(null)

  // 数据库管理状态
  const [page, setPage] = createSignal(1)
  const [editingItem, setEditingItem] = createSignal<MediaItem | null>(null)
  const [showEditModal, setShowEditModal] = createSignal(false)
  const pageSize = 20

  // 加载配置
  const [configData] = createResource(
    () => props.mediaType,
    async (mt) => {
      const resp = await getMediaConfig(mt)
      if (resp.code === 200 && resp.data) {
        setConfig(resp.data)
      }
      return resp.data
    },
  )

  // 加载媒体条目
  const [itemsData, { refetch: refetchItems }] = createResource(
    () => ({ media_type: props.mediaType, page: page(), page_size: pageSize }),
    async (params) => {
      const resp = await listMediaItems(params)
      if (resp.code === 200) return resp.data
      return { content: [], total: 0 }
    },
  )

  const items = () => (itemsData()?.content as MediaItem[]) ?? []
  const total = () => itemsData()?.total ?? 0
  const totalPages = () => Math.ceil(total() / pageSize)

  // 保存配置
  const handleSaveConfig = async () => {
    setConfigSaving(true)
    await saveMediaConfig(config())
    setConfigSaving(false)
  }

  // 立即扫描
  const handleScan = async () => {
    setScanning(true)
    setProgress({ status: "扫描中...", current: 0, total: 0 })
    await scanMedia(props.mediaType)
    // 轮询进度
    const timer = setInterval(async () => {
      const resp = await getMediaScanProgress(props.mediaType)
      if (resp.code === 200 && resp.data) {
        const d = resp.data
        setProgress({
          status: d.message || (d.running ? "扫描中..." : "完成"),
          current: d.done,
          total: d.total,
        })
        if (!d.running) {
          clearInterval(timer)
          setScanning(false)
          refetchItems()
        }
      }
    }, 1000)
  }

  // 立即刮削
  const handleScrape = async () => {
    setScraping(true)
    await scrapeMedia(props.mediaType)
    setScraping(false)
    refetchItems()
  }

  // 清空数据库
  const handleClear = async () => {
    if (!confirm(`确定要清空 ${props.title} 的所有数据吗？此操作不可恢复！`))
      return
    await clearMediaDB(props.mediaType)
    refetchItems()
  }

  // 保存编辑
  const handleSaveItem = async () => {
    if (!editingItem()) return
    await updateMediaItem(editingItem()!)
    setShowEditModal(false)
    setEditingItem(null)
    refetchItems()
  }

  // 删除条目
  const handleDeleteItem = async (id: number) => {
    if (!confirm("确定删除此条目？")) return
    await deleteMediaItem(id)
    refetchItems()
  }

  return (
    <div style={{ padding: "24px", "max-width": "1200px" }}>
      <h2
        style={{
          margin: "0 0 24px",
          "font-size": "20px",
          "font-weight": "600",
          color: "#1a202c",
        }}
      >
        {props.icon} {props.title}管理
      </h2>

      {/* 配置区域 */}
      <div
        style={{
          background: "white",
          "border-radius": "12px",
          padding: "20px",
          "margin-bottom": "24px",
          "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{ margin: "0 0 16px", "font-size": "15px", color: "#374151" }}
        >
          基础配置
        </h3>

        <div
          style={{
            display: "flex",
            "flex-wrap": "wrap",
            gap: "16px",
            "align-items": "center",
          }}
        >
          {/* 启用开关 */}
          <label
            style={{
              display: "flex",
              "align-items": "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <span style={{ "font-size": "14px", color: "#374151" }}>启用</span>
            <div
              onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
              style={{
                width: "44px",
                height: "24px",
                "border-radius": "12px",
                background: config().enabled ? "#6366f1" : "#d1d5db",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: config().enabled ? "22px" : "2px",
                  width: "20px",
                  height: "20px",
                  "border-radius": "50%",
                  background: "white",
                  transition: "left 0.2s",
                  "box-shadow": "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </label>

          {/* 扫描路径 */}
          <label
            style={{ display: "flex", "align-items": "center", gap: "8px" }}
          >
            <span
              style={{
                "font-size": "14px",
                color: "#374151",
                "white-space": "nowrap",
              }}
            >
              扫描路径
            </span>
            <input
              type="text"
              value={config().scan_path}
              onInput={(e) =>
                setConfig((c) => ({ ...c, scan_path: e.currentTarget.value }))
              }
              style={{
                border: "1px solid #d1d5db",
                "border-radius": "6px",
                padding: "6px 10px",
                "font-size": "13px",
                width: "200px",
                outline: "none",
              }}
            />
          </label>

          {/* 路径合并 */}
          <label
            style={{
              display: "flex",
              "align-items": "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <span style={{ "font-size": "14px", color: "#374151" }}>
              路径合并
            </span>
            <div
              onClick={() =>
                setConfig((c) => ({ ...c, path_merge: !c.path_merge }))
              }
              style={{
                width: "44px",
                height: "24px",
                "border-radius": "12px",
                background: config().path_merge ? "#6366f1" : "#d1d5db",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: config().path_merge ? "22px" : "2px",
                  width: "20px",
                  height: "20px",
                  "border-radius": "50%",
                  background: "white",
                  transition: "left 0.2s",
                  "box-shadow": "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </label>

          {/* 操作按钮（与控件同行） */}
          <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
            <button
              onClick={handleSaveConfig}
              disabled={configSaving()}
              style={manageBtnStyle("#6366f1")}
            >
              {configSaving() ? "保存中..." : "💾 保存配置"}
            </button>
            <button
              onClick={handleScan}
              disabled={scanning()}
              style={manageBtnStyle("#10b981")}
            >
              {scanning() ? "扫描中..." : "🔍 立即扫描"}
            </button>
            <button
              onClick={handleScrape}
              disabled={scraping()}
              style={manageBtnStyle("#f59e0b")}
            >
              {scraping() ? "刮削中..." : "✨ 立即刮削"}
            </button>
            <button onClick={handleClear} style={manageBtnStyle("#ef4444")}>
              🗑️ 清空数据库
            </button>
          </div>
        </div>

        {/* 进度显示 */}
        <Show when={progress()}>
          <div
            style={{
              "margin-top": "12px",
              padding: "10px 14px",
              background: "#f0fdf4",
              "border-radius": "8px",
              "font-size": "13px",
              color: "#166534",
              border: "1px solid #bbf7d0",
            }}
          >
            {progress()?.status}
            <Show when={(progress()?.total ?? 0) > 0}>
              {" "}
              ({progress()?.current} / {progress()?.total})
            </Show>
          </div>
        </Show>
      </div>

      {/* 数据库管理表格 */}
      <div
        style={{
          background: "white",
          "border-radius": "12px",
          "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{ padding: "16px 20px", "border-bottom": "1px solid #f1f5f9" }}
        >
          <h3 style={{ margin: "0", "font-size": "15px", color: "#374151" }}>
            数据库管理（共 {total()} 条）
          </h3>
        </div>

        <div style={{ "overflow-x": "auto" }}>
          <table
            style={{
              width: "100%",
              "border-collapse": "collapse",
              "font-size": "13px",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "文件路径",
                  "名称",
                  "封面",
                  "发布时间",
                  "评分",
                  "类型",
                  "作者/演员",
                  "隐藏",
                  "操作",
                ].map((h) => (
                  <th
                    style={{
                      padding: "10px 12px",
                      "text-align": "left",
                      color: "#6b7280",
                      "font-weight": "500",
                      "white-space": "nowrap",
                      "border-bottom": "1px solid #e2e8f0",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Show
                when={!itemsData.loading}
                fallback={
                  <tr>
                    <td
                      colspan="9"
                      style={{
                        "text-align": "center",
                        padding: "40px",
                        color: "#9ca3af",
                      }}
                    >
                      加载中...
                    </td>
                  </tr>
                }
              >
                <For each={items()}>
                  {(item) => (
                    <tr
                      style={{ "border-bottom": "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8fafc"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent"
                      }}
                    >
                      <td
                        style={{ padding: "10px 12px", "max-width": "200px" }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "white-space": "nowrap",
                            color: "#374151",
                          }}
                          title={item.file_path}
                        >
                          {item.file_path}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#374151" }}>
                        {item.scraped_name || item.file_name}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Show when={item.cover}>
                          <img
                            src={item.cover}
                            style={{
                              width: "32px",
                              height: "44px",
                              "object-fit": "cover",
                              "border-radius": "4px",
                            }}
                          />
                        </Show>
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "#6b7280",
                          "white-space": "nowrap",
                        }}
                      >
                        {item.release_date?.slice(0, 10)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                        {item.rating > 0 ? item.rating.toFixed(1) : "-"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                        {item.genre?.split(",")[0] || "-"}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "#6b7280",
                          "max-width": "120px",
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "white-space": "nowrap",
                          }}
                        >
                          {item.authors
                            ? JSON.parse(item.authors || "[]")
                                .slice(0, 2)
                                .join(", ")
                            : "-"}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div
                          onClick={async () => {
                            await updateMediaItem({
                              ...item,
                              hidden: !item.hidden,
                            })
                            refetchItems()
                          }}
                          style={{
                            width: "36px",
                            height: "20px",
                            "border-radius": "10px",
                            background: item.hidden ? "#6366f1" : "#d1d5db",
                            position: "relative",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "2px",
                              left: item.hidden ? "18px" : "2px",
                              width: "16px",
                              height: "16px",
                              "border-radius": "50%",
                              background: "white",
                              transition: "left 0.2s",
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setEditingItem({ ...item })
                              setShowEditModal(true)
                            }}
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              "border-radius": "4px",
                              color: "#3b82f6",
                              padding: "3px 8px",
                              "font-size": "12px",
                              cursor: "pointer",
                            }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              "border-radius": "4px",
                              color: "#ef4444",
                              padding: "3px 8px",
                              "font-size": "12px",
                              cursor: "pointer",
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <Show when={totalPages() > 1}>
          <div
            style={{
              display: "flex",
              "justify-content": "center",
              "align-items": "center",
              gap: "8px",
              padding: "16px",
              "border-top": "1px solid #f1f5f9",
            }}
          >
            <button
              disabled={page() <= 1}
              onClick={() => setPage(page() - 1)}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                "border-radius": "6px",
                color: "#374151",
                padding: "5px 12px",
                cursor: "pointer",
                "font-size": "13px",
              }}
            >
              上一页
            </button>
            <span style={{ color: "#6b7280", "font-size": "13px" }}>
              {page()} / {totalPages()}
            </span>
            <button
              disabled={page() >= totalPages()}
              onClick={() => setPage(page() + 1)}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                "border-radius": "6px",
                color: "#374151",
                padding: "5px 12px",
                cursor: "pointer",
                "font-size": "13px",
              }}
            >
              下一页
            </button>
          </div>
        </Show>
      </div>

      {/* 编辑弹窗 */}
      <Show when={showEditModal() && editingItem()}>
        <div
          style={{
            position: "fixed",
            inset: "0",
            background: "rgba(0,0,0,0.5)",
            "z-index": "500",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false)
          }}
        >
          <div
            style={{
              background: "white",
              "border-radius": "12px",
              padding: "24px",
              width: "560px",
              "max-width": "90vw",
              "max-height": "80vh",
              "overflow-y": "auto",
              "box-shadow": "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px",
                "font-size": "16px",
                color: "#111827",
              }}
            >
              编辑媒体信息
            </h3>

            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "14px",
              }}
            >
              {[
                { key: "scraped_name", label: "名称" },
                { key: "cover", label: "封面URL" },
                { key: "release_date", label: "发布时间" },
                { key: "genre", label: "类型（逗号分隔）" },
                { key: "authors", label: "作者/演员（JSON数组）" },
              ].map(({ key, label }) => (
                <div>
                  <label
                    style={{
                      display: "block",
                      "font-size": "12px",
                      color: "#6b7280",
                      "margin-bottom": "4px",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    type="text"
                    value={(editingItem() as any)?.[key] ?? ""}
                    onInput={(e) =>
                      setEditingItem((item) => ({
                        ...item!,
                        [key]: e.currentTarget.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      "border-radius": "6px",
                      padding: "7px 10px",
                      "font-size": "13px",
                      outline: "none",
                      "box-sizing": "border-box",
                    }}
                  />
                </div>
              ))}

              {/* 评分 */}
              <div>
                <label
                  style={{
                    display: "block",
                    "font-size": "12px",
                    color: "#6b7280",
                    "margin-bottom": "4px",
                  }}
                >
                  评分 (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={editingItem()?.rating ?? 0}
                  onInput={(e) =>
                    setEditingItem((item) => ({
                      ...item!,
                      rating: parseFloat(e.currentTarget.value),
                    }))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    "border-radius": "6px",
                    padding: "7px 10px",
                    "font-size": "13px",
                    outline: "none",
                    "box-sizing": "border-box",
                  }}
                />
              </div>

              {/* 简介 */}
              <div>
                <label
                  style={{
                    display: "block",
                    "font-size": "12px",
                    color: "#6b7280",
                    "margin-bottom": "4px",
                  }}
                >
                  简介
                </label>
                <textarea
                  value={editingItem()?.description ?? ""}
                  onInput={(e) =>
                    setEditingItem((item) => ({
                      ...item!,
                      description: e.currentTarget.value,
                    }))
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    "border-radius": "6px",
                    padding: "7px 10px",
                    "font-size": "13px",
                    outline: "none",
                    resize: "vertical",
                    "box-sizing": "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                "margin-top": "20px",
                "justify-content": "flex-end",
              }}
            >
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  "border-radius": "8px",
                  color: "#374151",
                  padding: "8px 18px",
                  cursor: "pointer",
                  "font-size": "14px",
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveItem}
                style={{
                  background: "#6366f1",
                  border: "none",
                  "border-radius": "8px",
                  color: "white",
                  padding: "8px 18px",
                  cursor: "pointer",
                  "font-size": "14px",
                  "font-weight": "500",
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

const manageBtnStyle = (color: string) => ({
  background: color,
  border: "none",
  "border-radius": "8px",
  color: "white",
  padding: "8px 16px",
  "font-size": "13px",
  "font-weight": "500",
  cursor: "pointer",
})

// ==================== 4个具体管理页 ====================

export const VideoManage = () => (
  <MediaManagePage mediaType="video" title="影视" icon="🎬" />
)

export const MusicManage = () => (
  <MediaManagePage mediaType="music" title="音乐" icon="🎵" />
)

export const ImageManage = () => (
  <MediaManagePage mediaType="image" title="图片" icon="🖼️" />
)

export const BookManage = () => (
  <MediaManagePage mediaType="book" title="书籍" icon="📚" />
)
