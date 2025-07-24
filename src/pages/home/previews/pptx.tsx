import { objStore } from "~/store"
import { onCleanup, onMount } from "solid-js"
import { init } from "pptx-preview"

const Preview = () => {
  onMount(() => {
    //调用库的init方法生成一个预览器

    let ppt_preview: HTMLElement | null =
      document.getElementById("ppt-container")
    if (!ppt_preview) return
    let ppt_clients: DOMRect = ppt_preview.getBoundingClientRect()
    let ppt_viewers = init(ppt_preview, {
      width: Number(ppt_clients.width),
      height: Number(ppt_clients.height),
    })
    //获取文件或者读取文件
    fetch(objStore.raw_url)
      .then((response) => {
        return response.arrayBuffer()
      })
      .then((res) => {
        //调用预览器的preview方法
        ppt_viewers.preview(res).then(
          (r) =>
            function () {
              console.log(r)
            },
        )
      })
  })

  onCleanup(() => {})

  return (
    <div
      id="ppt-container"
      style={{
        position: "relative",
        width: "100%",
        height: "75vh",
        display: "flex",
        "justify-content": "center",
        "align-items": "center",
      }}
    ></div>
  )
}

export default Preview
