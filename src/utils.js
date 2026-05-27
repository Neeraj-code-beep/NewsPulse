export function createUniqueIdentifier(newsItem) {
  // Implement your logic to create a unique identifier
  return `${newsItem.publishedAt}-${newsItem.url}`
}

export function convertISOStringToReadableTime(isoString) {
  const date = new Date(isoString)
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZoneName: "short",
  }
  const readableDate = date.toLocaleDateString("en-US", options)
  return readableDate
}
