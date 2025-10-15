// src/pages/manage/plugins/Plugin.tsx

import {
  Button,
  GridItem,
  Heading,
  HStack,
  Tag,
  Text,
  VStack,
} from "@hope-ui/solid"
import { createSignal } from "solid-js"
import { useT } from "~/hooks"
import { Plugin, Resp } from "~/types"
import { handleResp, notify, r } from "~/utils"
import { DeletePopover } from "../common/DeletePopover"

export const PluginGridItem = (props: {
  plugin: Plugin
  onRefetch: () => void
}) => {
  const t = useT()
  const [checking, setChecking] = createSignal(false)
  const [updating, setUpdating] = createSignal(false)
  const [uninstalling, setUninstalling] = createSignal(false)

  const checkUpdate = async () => {
    setChecking(true)
    try {
      const resp: Resp<{ new_version?: string }> = await r.post(
        "/admin/plugin/updates/check_one",
        { id: props.plugin.id },
      )
      handleResp(resp, (data) => {
        if (data.new_version) {
          notify.success(
            t("plugins.update_available", { version: data.new_version }),
          )
        } else {
          notify.info(t("plugins.no_update_available"))
        }
      })
    } finally {
      setChecking(false)
    }
  }

  const updatePlugin = async () => {
    setUpdating(true)
    try {
      const resp: Resp<Plugin> = await r.post("/admin/plugin/update", {
        id: props.plugin.id,
      })
      handleResp(resp, () => {
        notify.success(t("plugins.update_success"))
        props.onRefetch()
      })
    } finally {
      setUpdating(false)
    }
  }

  const uninstallPlugin = async () => {
    setUninstalling(true)
    try {
      const resp: Resp<string> = await r.post("/admin/plugin/uninstall", {
        id: props.plugin.id,
      })
      handleResp(resp, () => {
        notify.success(t("global.delete_success"))
        props.onRefetch()
      })
    } finally {
      setUninstalling(false)
    }
  }

  return (
    <GridItem
      w="$full"
      bgColor="$neutral1"
      borderWidth="1px"
      borderColor="$neutral6"
      rounded="$lg"
      _hover={{
        boxShadow: "$md",
      }}
    >
      <VStack w="$full" p="$4" spacing="$3" alignItems="flex-start">
        <HStack w="$full" justifyContent="space-between" alignItems="center">
          <Heading size="lg">{props.plugin.name}</Heading>
          <Tag
            colorScheme={
              props.plugin.status === "active" ? "success" : "danger"
            }
          >
            {props.plugin.status}
          </Tag>
        </HStack>
        <VStack spacing="$1" alignItems="flex-start" color="$neutral11">
          <Text>ID: {props.plugin.id}</Text>
          <Text>
            {t("plugins.version")}: {props.plugin.version}
          </Text>
          <Text>
            {t("plugins.author")}: {props.plugin.author}
          </Text>
          {/* 2. 添加描述，并使用 CSS 截断长文本 */}
          <Text
            title={props.plugin.description}
            css={{
              display: "-webkit-box",
              "-webkit-line-clamp": "2",
              "-webkit-box-orient": "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {props.plugin.description}
          </Text>
        </VStack>
        <HStack spacing="$2" wrap="wrap">
          <Button
            colorScheme="accent"
            onClick={checkUpdate}
            loading={checking()}
          >
            {t("plugins.check_for_updates")}
          </Button>
          <Button
            colorScheme="primary"
            onClick={updatePlugin}
            loading={updating()}
          >
            {t("plugins.update")}
          </Button>
          {/* 1. 修正 DeletePopover 的用法 */}
          <DeletePopover
            name={t("plugins.uninstall")}
            loading={uninstalling()}
            onClick={uninstallPlugin}
          />
        </HStack>
        {props.plugin.message && (
          <Text
            color="$danger9"
            style={{ "white-space": "pre-wrap", "font-size": "0.875rem" }}
          >
            {props.plugin.message}
          </Text>
        )}
      </VStack>
    </GridItem>
  )
}
