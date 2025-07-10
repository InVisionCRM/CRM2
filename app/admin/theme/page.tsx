import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Theme Test Page</h1>

      {/* Text Styles */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Text Styles</h2>
        <div className="space-y-2">
          <p className="text-foreground">Foreground Text (Default)</p>
          <p className="text-muted-foreground">Muted Foreground Text</p>
          <p className="text-primary">Primary Text</p>
          <p className="text-secondary-foreground">Secondary Foreground Text</p>
          <p className="text-accent-foreground">Accent Foreground Text</p>
          <p className="text-destructive">Destructive Text</p>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Cards</h2>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>This is a card description.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content. It uses the default card foreground color.</p>
          </CardContent>
          <CardFooter>
            <Button>Card Action</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Inputs and Selects */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Form Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="email" placeholder="Email (Input)" />
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Theme (Select)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Alerts</h2>
        <div className="space-y-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              This is a standard alert.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>
              This is a destructive alert.
            </AlertDescription>
          </Alert>
           <Alert variant="accent">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Accent!</AlertTitle>
            <AlertDescription>
              This is an accent alert.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    </div>
  )
} 