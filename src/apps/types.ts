export type AppComponent = () => React.ReactElement

export interface App {
  component: AppComponent
  displayName: string
}
