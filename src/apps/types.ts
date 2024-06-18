export type AppComponent = () => React.ReactElement

export interface App {
  Component: AppComponent
  displayName: string
}
