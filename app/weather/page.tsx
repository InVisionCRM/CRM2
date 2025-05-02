import { WeatherWidget } from "@/components/weather/weather-widget"

export default function WeatherPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Weather Information</h1>
      <WeatherWidget />
    </div>
  )
}
