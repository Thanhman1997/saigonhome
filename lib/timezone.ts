const PARTS_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>()

function getPartsFormatter(timeZone: string) {
  let formatter = PARTS_FORMATTER_CACHE.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
    PARTS_FORMATTER_CACHE.set(timeZone, formatter)
  }
  return formatter
}

function getOffsetMinutes(instant: Date, timeZone: string) {
  const parts = getPartsFormatter(timeZone).formatToParts(instant)
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]))
  const asUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second))
  return (asUtc - instant.getTime()) / 60000
}

export function zonedLocalDateTimeToUtc(date: string, time: string, timeZone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Invalid date or time")
  }

  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  const firstGuess = new Date(localAsUtc)
  const firstOffset = getOffsetMinutes(firstGuess, timeZone)
  const adjusted = new Date(localAsUtc - firstOffset * 60000)
  const secondOffset = getOffsetMinutes(adjusted, timeZone)
  return new Date(localAsUtc - secondOffset * 60000)
}
