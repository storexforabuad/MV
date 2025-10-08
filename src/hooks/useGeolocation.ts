
import { useState } from 'react';

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | Error | null;
  data: GeolocationCoordinates | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({ 
    loading: false, 
    error: null, 
    data: null 
  });

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      setState({ loading: false, error: new Error('Geolocation is not supported by your browser.'), data: null });
      return;
    }

    setState({ loading: true, error: null, data: null });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({ loading: false, error: null, data: position.coords });
      },
      (error) => {
        setState({ loading: false, error, data: null });
      }
    );
  };

  return { ...state, getGeolocation };
};
