export type SidebarSectionId = 'track' | 'symbol' | 'map' | 'export'

export type SidebarSection = {
  id: SidebarSectionId
  icon: string
  title: string
  description: string
  placeholder: string
}
