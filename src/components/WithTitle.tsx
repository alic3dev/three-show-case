let baseTitle: string = ''

export function WithTitle({
  children,
  title,
}: React.PropsWithChildren<{ title: string }>) {
  if (!baseTitle) baseTitle = document.title

  document.title = `${title} - ${baseTitle}`

  return children
}
