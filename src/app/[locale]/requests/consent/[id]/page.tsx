import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { MediaReleaseCards } from "@/app/[locale]/appointments/_components/media-release-cards"
import { ConsentCentre } from "@/app/[locale]/appointments/_components/consent-centre"
import { Link } from "@/i18n/navigation"
import { routes } from "@/config/routes"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/modules/identity/server"
import { getMySpace } from "@/modules/clients"
import { getConsentRequest } from "@/modules/media"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(["da", "en"], locale)) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: "designRequests" })

  return {
    title: t("pageTitle"),
    description: "",
    robots: { index: false, follow: false },
  }
}

export default async function ConsentRequestPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  if (!hasLocale(["da", "en"], locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: "designRequests" })
  const user = await getCurrentUser()
  if (!user) {
    notFound()
  }

  const space = await getMySpace(user.id)
  
  const request = await getConsentRequest(id, user.id)
  if (!request) {
    notFound()
  }

  const targetCard =
    request.kind === "release"
      ? space.permissions.find((c) => c.bookingId === request.bookingId)
      : null

  const mediaCountByBooking: Record<string, number> = {}
  for (const item of space.media) {
    if (!item.bookingId) {
      continue
    }
    mediaCountByBooking[item.bookingId] =
      (mediaCountByBooking[item.bookingId] ?? 0) + 1
  }

  return (
    <main className="flex flex-1 flex-col">
      <section data-slot="section" className="py-16 sm:py-24">
        <div data-slot="container" className="mx-auto w-full px-6 sm:px-8 max-w-4xl">
          <div className="flex justify-end pb-4">
            <Link href={{ pathname: routes.appointments, query: { tab: "permissions" } }}>
              <Button size="sm" variant="outline">
                {t("backToMySpace")}
              </Button>
            </Link>
          </div>
          <div className="space-y-6">
            {targetCard ? (
              <MediaReleaseCards
                cards={[targetCard]}
                mediaCountByBooking={mediaCountByBooking}
              />
            ) : (
              <ConsentCentre dataConsents={space.dataConsents} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
