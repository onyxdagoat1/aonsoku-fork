import { Grid, List, Monitor, Sidebar } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { useLayoutStore } from '@/store/layout.store'

export function LayoutSettings() {
  const {
    gridSize,
    setGridSize,
    listDensity,
    setListDensity,
    sidebarCompact,
    setSidebarCompact,
  } = useLayoutStore((state) => ({
    gridSize: state.gridSize,
    setGridSize: state.setGridSize,
    listDensity: state.listDensity,
    setListDensity: state.setListDensity,
    sidebarCompact: state.sidebarCompact,
    setSidebarCompact: state.setSidebarCompact,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display & Appearance
          </CardTitle>
          <CardDescription>
            Customize how the application looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grid Size */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Grid className="w-4 h-4" /> Album Grid Size
              </Label>
              <p className="text-sm text-muted-foreground">
                Adjust the size of album and artist cards.
              </p>
            </div>
            <Select value={gridSize} onValueChange={setGridSize}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List Density */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <List className="w-4 h-4" /> List Density
              </Label>
              <p className="text-sm text-muted-foreground">
                Control the spacing in song lists and tables.
              </p>
            </div>
            <Select value={listDensity} onValueChange={setListDensity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sidebar Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Sidebar className="w-4 h-4" /> Compact Sidebar
              </Label>
              <p className="text-sm text-muted-foreground">
                Use a slimmer sidebar to maximize content area.
              </p>
            </div>
            <Switch
              checked={sidebarCompact}
              onCheckedChange={setSidebarCompact}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
