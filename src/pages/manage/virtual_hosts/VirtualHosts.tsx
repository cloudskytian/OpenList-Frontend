import {
  Box,
  Button,
  HStack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
} from "@hope-ui/solid"
import { createSignal, For } from "solid-js"
import {
  useFetch,
  useListFetch,
  useManageTitle,
  useRouter,
  useT,
} from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import { VirtualHost, PEmptyResp, PPageResp } from "~/types"
import { DeletePopover } from "../common/DeletePopover"
import { Wether } from "~/components"

const VirtualHosts = () => {
  const t = useT()
  useManageTitle("manage.sidemenu.virtual_hosts")
  const { to } = useRouter()
  const [getVhostsLoading, getVhosts] = useFetch(
    (): PPageResp<VirtualHost> => r.get("/admin/vhost/list"),
  )
  const [vhosts, setVhosts] = createSignal<VirtualHost[]>([])
  const refresh = async () => {
    const resp = await getVhosts()
    handleResp(resp, (data) => setVhosts(data.content))
  }
  refresh()

  const [deleting, deleteVhost] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/vhost/delete?id=${id}`),
  )
  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <HStack spacing="$2">
        <Button
          colorScheme="accent"
          loading={getVhostsLoading()}
          onClick={refresh}
        >
          {t("global.refresh")}
        </Button>
        <Button
          onClick={() => {
            to("/@manage/virtual_hosts/add")
          }}
        >
          {t("global.add")}
        </Button>
      </HStack>
      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <For each={["domain", "path", "enabled", "web_hosting"]}>
                {(title) => <Th>{t(`virtual_hosts.${title}`)}</Th>}
              </For>
              <Th>{t("global.operations")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <For each={vhosts()}>
              {(vhost) => (
                <Tr>
                  <Td>{vhost.domain}</Td>
                  <Td>{vhost.path}</Td>
                  <Td>
                    <Wether yes={vhost.enabled} />
                  </Td>
                  <Td>
                    <Wether yes={vhost.web_hosting} />
                  </Td>
                  <Td>
                    <HStack spacing="$2">
                      <Button
                        onClick={() => {
                          to(`/@manage/virtual_hosts/edit/${vhost.id}`)
                        }}
                      >
                        {t("global.edit")}
                      </Button>
                      <DeletePopover
                        name={vhost.domain}
                        loading={deleting() === vhost.id}
                        onClick={async () => {
                          const resp = await deleteVhost(vhost.id)
                          handleResp(resp, () => {
                            notify.success(t("global.delete_success"))
                            refresh()
                          })
                        }}
                      />
                    </HStack>
                  </Td>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
}

export default VirtualHosts
