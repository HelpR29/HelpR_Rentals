import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;

/**
 * Returns a singleton instance of the Google Maps Loader.
 * This ensures the loader is initialized only once with all necessary libraries.
 */
export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key',
      version: 'weekly',
      libraries: ['places', 'geometry'], // Load all required libraries upfront
    });
  }
  return loaderInstance;
};
