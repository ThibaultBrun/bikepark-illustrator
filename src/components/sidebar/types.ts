export type SidebarSectionId = 'track' | 'symbol' | 'map' | 'export' | 'help' | 'locate' | 'print'

export type SidebarSection = {
  id: SidebarSectionId
  icon: string
  title: string
  description: string
  placeholder: string
}
