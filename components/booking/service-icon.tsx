type ServiceIconProps = {
  slug: string
  icon: string
}

const flagClassName = "h-4 w-6 shrink-0 overflow-hidden rounded-[2px] sm:h-5 sm:w-7"

export function ServiceIcon({ slug, icon }: ServiceIconProps) {
  if (slug === "thai") {
    return (
      <svg viewBox="0 0 30 20" className={flagClassName} aria-hidden="true">
        <rect width="30" height="20" fill="#A51931" />
        <rect y="3.33" width="30" height="3.34" fill="#F4F5F8" />
        <rect y="6.67" width="30" height="6.66" fill="#2D2A4A" />
        <rect y="13.33" width="30" height="3.34" fill="#F4F5F8" />
      </svg>
    )
  }

  if (slug === "vietnamese") {
    return (
      <svg viewBox="0 0 30 20" className={flagClassName} aria-hidden="true">
        <rect width="30" height="20" fill="#DA251D" />
        <polygon points="15,3.5 16.6,8.1 21.5,8.2 17.6,11.1 19.1,15.8 15,13 10.9,15.8 12.4,11.1 8.5,8.2 13.4,8.1" fill="#FFDE00" />
      </svg>
    )
  }

  if (slug === "swedish") {
    return (
      <svg viewBox="0 0 30 20" className={flagClassName} aria-hidden="true">
        <rect width="30" height="20" fill="#006AA7" />
        <path d="M9.25 0h3.75v8h17v4h-17v8H9.25v-8H0V8h9.25z" fill="#FECC00" />
      </svg>
    )
  }

  return <span className="shrink-0 text-base leading-4 sm:text-xl sm:leading-5" aria-hidden="true">{icon}</span>
}
