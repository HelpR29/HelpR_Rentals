/**
 * Address utilities for Winnipeg-focused rental platform
 */

export function formatWinnipegAddress(address: string): string {
  // If address already includes city/province, return as-is
  if (address.toLowerCase().includes('winnipeg') || address.toLowerCase().includes('manitoba')) {
    return address;
  }
  
  // Add Winnipeg, Manitoba context to the address
  return `${address}, Winnipeg, Manitoba, Canada`;
}

export function getWinnipegCoordinates(seed?: string): { lat: number; lng: number } {
  // Base Winnipeg coordinates
  const baseCoords = { lat: 49.8951, lng: -97.1384 };
  
  if (!seed) return baseCoords;
  
  // Generate consistent coordinates within Winnipeg area based on seed
  const seedValue = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    lat: baseCoords.lat + ((seedValue % 100) - 50) * 0.001, // Small variation within Winnipeg
    lng: baseCoords.lng + ((seedValue % 100) - 50) * 0.001
  };
}

export function isWinnipegAddress(address: string): boolean {
  const lowerAddress = address.toLowerCase();
  return lowerAddress.includes('winnipeg') || lowerAddress.includes('manitoba');
}

export function extractStreetAddress(fullAddress: string): string {
  // Extract just the street address part (before city)
  const parts = fullAddress.split(',');
  return parts[0].trim();
}
