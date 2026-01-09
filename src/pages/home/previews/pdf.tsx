import EmbedPDF from "@embedpdf/snippet"
import { Box } from "@hope-ui/solid"
import { onMount } from "solid-js"
import { currentLang } from "~/app/i18n"
import { objStore } from "~/store"

const PDFViewer = () => {
  let ref: HTMLDivElement | undefined
  let instance: any

  onMount(() => {
    const src = objStore.raw_url
    if (ref && src) {
      instance = EmbedPDF.init({
        type: "container",
        target: ref,
        src,
        theme: { preference: "system" },
        i18n: {
          defaultLocale: currentLang(),
          fallbackLocale: "en",
        },
      })
    }
  })
  return <Box w="$full" h="60vh" ref={(el) => (ref = el)} />
}

export default PDFViewer
