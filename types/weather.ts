export interface WeatherLocation {
  id?: string
  name: string
  lat: number
  lon: number
  address?: string
  isCurrent?: boolean
  isJobSite?: boolean
  leadId?: string
}

export interface CurrentWeather {
  temp: number
  feels_like: number
  humidity: number
  wind_speed: number
  wind_deg: number
  weather: {
    id: number
    main: string
    description: string
    icon: string
  }[]
  uvi: number
  visibility: number
  pressure: number
  dt: number
}

export interface HourlyForecast {
  dt: number
  temp: number
  feels_like: number
  pressure: number
  humidity: number
  dew_point: number
  uvi: number
  clouds: number
  visibility: number
  wind_speed: number
  wind_deg: number
  wind_gust?: number
  weather: {
    id: number
    main: string
    description: string
    icon: string
  }[]
  pop: number
  rain?: {
    "1h": number
  }
}

export interface DailyForecast {
  dt: number
  sunrise: number
  sunset: number
  temp: {
    day: number
    min: number
    max: number
    night: number
    eve: number
    morn: number
  }
  feels_like: {
    day: number
    night: number
    eve: number
    morn: number
  }
  pressure: number
  humidity: number
  weather: {
    id: number
    main: string
    description: string
    icon: string
  }[]
  wind_speed: number
  wind_deg: number
  clouds: number
  pop: number
  rain?: number
  uvi: number
}

export interface WeatherAlert {
  sender_name: string
  event: string
  start: number
  end: number
  description: string
  tags: string[]
}

export interface WeatherData {
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  alerts?: WeatherAlert[]
  location: WeatherLocation
}

export interface RoofingCondition {
  condition: "ideal" | "acceptable" | "caution" | "not_recommended"
  label: string
  description: string
  icon: string
}
