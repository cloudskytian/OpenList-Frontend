import {
  Button,
  Switch as HopeSwitch,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  VStack,
} from "@hope-ui/solid"
import { MaybeLoading, FolderChooseInput } from "~/components"
import { useFetch, useRouter, useT } from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import { VirtualHost, PEmptyResp, PResp } from "~/types"
import { createStore } from "solid-js/store"

const AddOrEdit = () => {
  const t = useT()
  const { params, back } = useRouter()
  const { id } = params
  const [vhost, setVhost] = createStore<VirtualHost>({
    id: 0,
    enabled: true,
    domain: "",
    path: "",
    web_hosting: false,
  })
  const [vhostLoading, loadVhost] = useFetch(
    (): PResp<VirtualHost> => r.get(`/admin/vhost/get?id=${id}`),
  )

  const initEdit = async () => {
    const resp = await loadVhost()
    handleResp<VirtualHost>(resp, setVhost)
  }
  if (id) {
    initEdit()
  }
  const [okLoading, ok] = useFetch((): PEmptyResp => {
    return r.post(`/admin/vhost/${id ? "update" : "create"}`, vhost)
  })
  return (
    <MaybeLoading loading={vhostLoading()}>
      <VStack w="$full" alignItems="start" spacing="$4">
        <Heading>{t(`global.${id ? "edit" : "add"}`)}</Heading>

        {/* 启用开关 */}
        <FormControl
          w="$full"
          display="flex"
          flexDirection="row"
          alignItems="center"
          gap="$3"
        >
          <FormLabel for="enabled" mb="0">
            {t("virtual_hosts.enabled")}
          </FormLabel>
          <HopeSwitch
            id="enabled"
            checked={vhost.enabled}
            onChange={(e: any) => setVhost("enabled", e.currentTarget.checked)}
          />
        </FormControl>

        {/* 域名 */}
        <FormControl w="$full" display="flex" flexDirection="column" required>
          <FormLabel for="domain">{t("virtual_hosts.domain")}</FormLabel>
          <Input
            id="domain"
            placeholder="example.com"
            value={vhost.domain}
            onInput={(e) => setVhost("domain", e.currentTarget.value)}
          />
          <FormHelperText>{t("virtual_hosts.domain_help")}</FormHelperText>
        </FormControl>

        {/* 路径 */}
        <FormControl w="$full" display="flex" flexDirection="column" required>
          <FormLabel for="path">{t("virtual_hosts.path")}</FormLabel>
          <FolderChooseInput
            id="path"
            value={vhost.path}
            onChange={(path) => setVhost("path", path)}
          />
          <FormHelperText>{t("virtual_hosts.path_help")}</FormHelperText>
        </FormControl>

        {/* Web 托管开关 */}
        <FormControl w="$full" display="flex" flexDirection="column">
          <FormControl
            display="flex"
            flexDirection="row"
            alignItems="center"
            gap="$3"
          >
            <FormLabel for="web_hosting" mb="0">
              {t("virtual_hosts.web_hosting")}
            </FormLabel>
            <HopeSwitch
              id="web_hosting"
              checked={vhost.web_hosting}
              onChange={(e: any) =>
                setVhost("web_hosting", e.currentTarget.checked)
              }
            />
          </FormControl>
          <FormHelperText>{t("virtual_hosts.web_hosting_help")}</FormHelperText>
        </FormControl>

        <Button
          loading={okLoading()}
          onClick={async () => {
            const resp = await ok()
            handleResp(resp, () => {
              notify.success(t("global.save_success"))
              back()
            })
          }}
        >
          {t(`global.${id ? "save" : "add"}`)}
        </Button>
      </VStack>
    </MaybeLoading>
  )
}

export default AddOrEdit
