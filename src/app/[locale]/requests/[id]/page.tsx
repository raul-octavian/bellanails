import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { DesignReplyForm } from "@/app/[locale]/appointments/_components/design-reply-form"
import { Link } from "@/i18n/navigation"
import { routes } from "@/config/routes"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/modules/identity/server"
import { getMyDesignRequests } from "@/modules/design"
import { markDesignThreadsSeen } from "@/modules/design/request-actions"
import { pickLocalized } from "@/shared/localized"
import { formatStudioDayMonthYear } from "@/shared/studio-time"
import { formatPrice } from "@/shared/money"

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

export default async function RequestPage({
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

  const { requests } = await getMyDesignRequests()
  const request = requests.find((r) => r.id === id)
  if (!request) {
    notFound()
  }

  await markDesignThreadsSeen(request.lastActivityAt).catch(() => {
    /* a read-marker that doesn't stick is not worth telling anyone about */
  })

  const topicLabel = t(`topic.${request.topic}`)

  return (
    <main className="flex flex-1 flex-col">
      <section data-slot="section" className="py-16 sm:py-24">
        <div data-slot="container" className="mx-auto w-full px-6 sm:px-8 max-w-4xl">
          <div className="flex justify-end pb-4">
            <Link href={routes.appointments}>
              <Button size="sm" variant="outline">
                {t("backToMySpace")}
              </Button>
            </Link>
          </div>
          <div className="grid gap-x-16 gap-y-8 pb-8 md:grid-cols-[1fr_19rem] md:items-end">
            <div className="space-y-6">
              <p
                data-slot="typography"
                className="font-functional text-[11px] leading-[1.1] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
              >
                {t("pageEyebrow")}
              </p>
            </div>
          </div>
          <div className="space-y-6 border border-border p-4 bg-muted rounded-lg">
            <div className="rounded-lg bg-muted">
              <p className="font-functional text-xs uppercase tracking-widest-lux text-muted-foreground mb-1">
                {t("topicHeading")}
              </p>
              <p className="text-sm text-foreground">{topicLabel}</p>
              <p className="font-functional text-[0.625rem] uppercase tracking-widest-lux text-muted-foreground mt-2">
                {formatStudioDayMonthYear(
                  Date.parse(request.createdAt),
                  locale,
                )}
              </p>
            </div>

            {request.offer ? (
              <div className="rounded-lg border border-border bg-secondary/10 p-4">
                <p className="font-functional text-xs uppercase tracking-widest-lux text-muted-foreground mb-1">
                  {t("offerHeading") ?? "Your offer"}
                </p>
                <p className="text-base font-medium text-foreground mb-1">
                  {pickLocalized(
                    locale,
                    request.offer.nameEn,
                    request.offer.nameDk,
                  )}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("offerSummary", {
                    mins: request.offer.durationMins,
                    price: formatPrice(request.offer.priceCents, locale),
                  })} ·{" "}
                  {t("offerHolds", {
                    date: formatStudioDayMonthYear(
                      Date.parse(request.offer.expiresAt),
                      locale,
                    ),
                  })}
                </p>
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/offer/${request.offer.id}`} />}
                >
                  {t("viewOffer") ?? "View offer"}
                </Button>
              </div>
            ) : null}

            <h3
              data-slot="typography"
              className="font-functional text-[11px] leading-[1.1] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
            >
              {t("threadHeading") ?? "Conversation"}
            </h3>

            <ul className="space-y-3">
              {request.messages.map((message) => (
                <li key={message.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-functional text-xs uppercase tracking-widest-lux text-muted-foreground">
                      {message.author === "artist"
                        ? t("authorArtist") ?? "Bella"
                        : t("authorClient") ?? "You"}
                    </span>
                    <span className="font-functional text-[0.625rem] uppercase tracking-widest-lux text-muted-foreground">
                      {formatStudioDayMonthYear(
                        Date.parse(message.createdAt),
                        locale,
                      )}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-foreground">
                    {message.body}
                  </p>
                </li>
              ))}
            </ul>

            {request.refs.length ? (
              <div className="space-y-2">
                <h3
                  data-slot="typography"
                  className="font-functional text-[11px] leading-[1.1] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {t("photosHeading") ?? "Photos"}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {request.refs.map((ref) => (
                    <li key={ref.id}>
                      <Image
                        src={ref.url}
                        alt={t("photoAlt") ?? "Reference photo"}
                        className="size-16 rounded-sm border border-border object-cover"
                        width={16}
                        height={16}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="pt-2">
              <DesignReplyForm
                requestId={request.id}
                refCount={request.refCount}
              />
            </div>


          </div>
        </div>
      </section>
    </main>
  )
}