// src/pages/manage/plugins/Plugins.tsx

import {
  Button,
  Grid,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  VStack,
  createDisclosure,
  FormControl,
  FormLabel,
} from "@hope-ui/solid"
import { createSignal, For, Show } from "solid-js"
// 引入上传图标
import { FaSolidArrowsRotate, FaSolidPlus, FaSolidUpload } from "solid-icons/fa"
import { useFetch, useT } from "~/hooks"
import { Plugin, Resp } from "~/types"
import { handleResp, notify, r } from "~/utils"
import { PluginGridItem } from "./Plugin"

const Plugins = () => {
  const t = useT()
  const { isOpen, onOpen, onClose } = createDisclosure()
  const [source, setSource] = createSignal("")
  const [installing, setInstalling] = createSignal(false)
  const [uploading, setUploading] = createSignal(false) // 新增：上传状态
  const [checkingAll, setCheckingAll] = createSignal(false)

  let fileInputRef: HTMLInputElement | undefined

  const [pluginsLoading, getPlugins] = useFetch(
    (): Promise<Resp<Plugin[]>> => r.get("/admin/plugin/list"),
  )
  const [plugins, setPlugins] = createSignal<Plugin[]>([])

  const refresh = async () => {
    const resp = await getPlugins()
    handleResp(resp, (data) => {
      setPlugins(data)
    })
  }

  refresh()

  const handleInstall = async (e: Event) => {
    e.preventDefault()
    if (!source()) return
    setInstalling(true)
    try {
      const resp: Resp<Plugin> = await r.post("/admin/plugin/install", {
        source: source(),
      })
      handleResp(resp, () => {
        notify.success(t("global.install_success"))
        refresh()
        onClose()
        setSource("")
      })
    } finally {
      setInstalling(false)
    }
  }

  // 新增：处理文件上传的函数
  const handleFileChange = async (e: Event) => {
    const target = e.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      // axios 会自动处理 FormData 的 Content-Type
      const resp: Resp<Plugin> = await r.post(
        "/admin/plugin/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      )
      handleResp(resp, () => {
        notify.success(t("global.install_success"))
        refresh()
      })
    } finally {
      setUploading(false)
      // 清空 input 的值，以便用户可以再次上传同一个文件
      if (fileInputRef) {
        fileInputRef.value = ""
      }
    }
  }

  const checkAllUpdates = async () => {
    setCheckingAll(true)
    try {
      const resp: Resp<Record<string, string>> = await r.get(
        "/admin/plugin/updates/check",
      )
      handleResp(resp, (data) => {
        const count = Object.keys(data).length
        if (count > 0) {
          notify.success(t("plugins.updates_found", { count }))
        } else {
          notify.info(t("plugins.all_up_to_date"))
        }
      })
    } finally {
      setCheckingAll(false)
    }
  }

  return (
    <VStack w="$full" p="$4" spacing="$4" alignItems="flex-start">
      <HStack w="$full" justifyContent="space-between">
        <Heading>{t("manage.sidemenu.plugins")}</Heading>
        <HStack spacing="$2">
          <Button
            leftIcon={<FaSolidArrowsRotate />}
            onClick={checkAllUpdates}
            loading={checkingAll()}
          >
            {t("plugins.check_all_for_updates")}
          </Button>
          {/* 新增：上传安装按钮 */}
          <Button
            leftIcon={<FaSolidUpload />}
            onClick={() => fileInputRef?.click()}
            loading={uploading()}
          >
            {t("plugins.upload_plugin")}
          </Button>
          <Button
            leftIcon={<FaSolidPlus />}
            colorScheme="accent"
            onClick={onOpen}
          >
            {t("plugins.install_plugin")}
          </Button>
        </HStack>
      </HStack>

      {/* 新增：隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        hidden
        onChange={handleFileChange}
      />

      <Show when={!pluginsLoading()} fallback={<Spinner size="lg" />}>
        <Grid
          w="$full"
          gap="$4"
          templateColumns={{
            "@initial": "1fr",
            "@lg": "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          <For each={plugins()}>
            {(plugin) => <PluginGridItem plugin={plugin} onRefetch={refresh} />}
          </For>
        </Grid>
      </Show>
      <Modal opened={isOpen()} onClose={onClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleInstall}>
          <ModalHeader>{t("plugins.install_plugin")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl required>
              <FormLabel>{t("plugins.plugin_source")}</FormLabel>
              <Input
                placeholder="https://github.com/user/my-openlist-plugin"
                value={source()}
                onInput={(e) => setSource(e.currentTarget.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>{t("global.cancel")}</Button>
            <Button
              type="submit"
              colorScheme="accent"
              ml="$3"
              loading={installing()}
            >
              {t("global.install")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default Plugins
