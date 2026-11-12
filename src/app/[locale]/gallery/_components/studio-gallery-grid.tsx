"use client"

import { useState } from "react"

import { PhotoLightbox } from "@/components/gallery/photo-lightbox"
import { cn } from "@/shared/cn"
import { Container, Section } from "@/components/layout/container"
import type { StudioGalleryImage } from "@/modules/media/gallery-preview"

/**
 * Columns never outnumber the photos, and the cap comes down from four to three.
 * The width cap on the sparse cases keeps a single uncropped portrait from
 * filling the page. Every tile lands between ~275px and ~380px wide.
 */
const MASONRY_BY_COUNT = [
  "columns-1 max-w-sm",
  "columns-2 max-w-2xl",
  "columns-2 sm:columns-3",
]

/**
 * StudioGalleryGrid — the /gallery page's full studio portfolio: every gallery
 * item, featured (slotted) ones first in slot order, then gallery-page-only
 * images newest first. Masonry at real aspect ratio (nothing cropped); clicking
 * a tile opens it full size in a lightbox, so the visitor stays on the gallery.
 */
export function StudioGalleryGrid({
  items,
}: {
  items: StudioGalleryImage[]
}) {
  const [active, setActive] = useState<StudioGalleryImage | null>(null)

  if (!items.length) {
    return null
  }

  return (
    <>
      <Section className="border-t border-border">
        <Container className="max-w-4xl space-y-6">
          <ul
            className={cn(
              "gap-3",
              MASONRY_BY_COUNT[
                Math.min(items.length, MASONRY_BY_COUNT.length) - 1
              ],
            )}
          >
            {items.map((item) => (
              <li
                key={item.id}
                className="mb-3 break-inside-avoid overflow-hidden rounded-sm border border-border bg-muted"
              >
                <button
                  type="button"
                  onClick={() => setActive(item)}
                  className="block w-full cursor-zoom-in outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {/* hasAssetUrl in getPublicGalleryItems guarantees a URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl!}
                    alt={item.captionEn ?? "Bella Nails gallery image"}
                    loading="lazy"
                    decoding="async"
                    className="w-full block"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <PhotoLightbox
        src={active?.imageUrl ?? null}
        alt={active?.captionEn ?? ""}
        onClose={() => setActive(null)}
      />
    </>
  )
}
