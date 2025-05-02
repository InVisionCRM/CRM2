declare module 'react-google-streetview' {
  import { FC } from 'react';

  export interface StreetViewPanoramaOptions {
    position: {
      lat: number;
      lng: number;
    };
    pov: {
      heading: number;
      pitch: number;
    };
    zoom: number;
    addressControl?: boolean;
    showRoadLabels?: boolean;
    zoomControl?: boolean;
  }

  export interface ReactStreetviewProps {
    apiKey: string;
    streetViewPanoramaOptions: StreetViewPanoramaOptions;
    className?: string;
  }

  const ReactStreetview: FC<ReactStreetviewProps>;
  export default ReactStreetview;
} 