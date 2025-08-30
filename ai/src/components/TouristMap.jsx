
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function decodePolyline(encoded) {
  if (!encoded) return [];
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

const TouristMap = ({ currentLocation, destination, routePath }) => {
  const center = currentLocation ? [currentLocation.lat, currentLocation.lng] : [28.6139, 77.2090];
  let route = [];
  if (routePath) {
    route = decodePolyline(routePath);
  } else if (currentLocation && destination) {
    route = [center, [destination.lat, destination.lng]];
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {currentLocation && <Marker position={center} />}
        {destination && <Marker position={[destination.lat, destination.lng]} />}
        {route.length > 1 && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </div>
  );
};

export default TouristMap;
