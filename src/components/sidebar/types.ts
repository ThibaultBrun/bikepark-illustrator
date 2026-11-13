export type SidebarSectionId = 'track' | 'symbol' | 'module3d' | 'map' | 'export' | 'help' | 'locate' | 'print'

export type SidebarSection = {
  id: SidebarSectionId
  icon: string
  title: string
  description: string
  placeholder: string
}
