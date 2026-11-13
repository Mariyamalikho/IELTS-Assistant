import { useEffect } from "react"

export interface PageMetaProps {
  title: string
  description?: string
  canonicalPath?: string
}

export function PageMeta({ title, description, canonicalPath }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = `${title} | IELTS Assistant`
    document.title = fullTitle

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement("meta")
        metaDesc.setAttribute("name", "description")
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute("content", description)

      const ogDesc = document.querySelector('meta[property="og:description"]')
      if (ogDesc) {
        ogDesc.setAttribute("content", description)
      }

      const twitterDesc = document.querySelector('meta[name="twitter:description"]')
      if (twitterDesc) {
        twitterDesc.setAttribute("content", description)
      }
    }

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute("content", fullTitle)
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) {
      twitterTitle.setAttribute("content", fullTitle)
    }

    if (canonicalPath) {
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement("link")
        canonical.setAttribute("rel", "canonical")
        document.head.appendChild(canonical)
      }
      canonical.setAttribute("href", `https://ielts-assistant.vercel.app${canonicalPath}`)
    }
  }, [title, description, canonicalPath])

  return null
}
