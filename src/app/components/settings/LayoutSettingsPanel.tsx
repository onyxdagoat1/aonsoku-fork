import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/components/ui/select'
import { Label } from '@/lib/components/ui/label'
import { Button } from '@/lib/components/ui/button'
import {
  useGridSize,
  useListDensity,
  useSidebarLayout,
  useLayoutActions,
  type GridSize,
  type ListDensity,
  type SidebarWidth,
} from '@/store/layout.store'
import { LayoutGrid, List, SidebarClose, RotateCcw } from 'lucide-react'

export function LayoutSettingsPanel() {
  const { size: gridSize, setSize: setGridSize } = useGridSize()
  const { density: listDensity, setDensity: setListDensity } = useListDensity()
  const { width: sidebarWidth, setWidth: setSidebarWidth } = useSidebarLayout()
  const { resetToDefaults } = useLayoutActions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Layout Density</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Grid Size Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="grid-size" className="text-sm font-medium">
            Grid View Size
          </Label>
        </div>
        <Select value={gridSize} onValueChange={(value) => setGridSize(value as GridSize)}>
          <SelectTrigger id="grid-size" className="w-full">
            <SelectValue placeholder="Select grid size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">
              <div className="flex flex-col">
                <span>Small</span>
                <span className="text-xs text-muted-foreground">
                  More items per row
                </span>
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex flex-col">
                <span>Medium</span>
                <span className="text-xs text-muted-foreground">
                  Balanced view (default)
                </span>
              </div>
            </SelectItem>
            <SelectItem value="large">
              <div className="flex flex-col">
                <span>Large</span>
                <span className="text-xs text-muted-foreground">
                  Larger cards, fewer per row
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List Density Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="list-density" className="text-sm font-medium">
            List View Density
          </Label>
        </div>
        <Select value={listDensity} onValueChange={(value) => setListDensity(value as ListDensity)}>
          <SelectTrigger id="list-density" className="w-full">
            <SelectValue placeholder="Select list density" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">
              <div className="flex flex-col">
                <span>Compact</span>
                <span className="text-xs text-muted-foreground">
                  More rows visible
                </span>
              </div>
            </SelectItem>
            <SelectItem value="comfortable">
              <div className="flex flex-col">
                <span>Comfortable</span>
                <span className="text-xs text-muted-foreground">
                  Balanced spacing (default)
                </span>
              </div>
            </SelectItem>
            <SelectItem value="spacious">
              <div className="flex flex-col">
                <span>Spacious</span>
                <span className="text-xs text-muted-foreground">
                  More breathing room
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sidebar Width Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SidebarClose className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="sidebar-width" className="text-sm font-medium">
            Sidebar Width
          </Label>
        </div>
        <Select value={sidebarWidth} onValueChange={(value) => setSidebarWidth(value as SidebarWidth)}>
          <SelectTrigger id="sidebar-width" className="w-full">
            <SelectValue placeholder="Select sidebar width" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="narrow">
              <div className="flex flex-col">
                <span>Narrow</span>
                <span className="text-xs text-muted-foreground">192px width</span>
              </div>
            </SelectItem>
            <SelectItem value="normal">
              <div className="flex flex-col">
                <span>Normal</span>
                <span className="text-xs text-muted-foreground">
                  256px width (default)
                </span>
              </div>
            </SelectItem>
            <SelectItem value="wide">
              <div className="flex flex-col">
                <span>Wide</span>
                <span className="text-xs text-muted-foreground">320px width</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> These settings adjust the spacing and sizing throughout
          the app. Changes are saved automatically and apply immediately.
        </p>
      </div>
    </div>
  )
}
