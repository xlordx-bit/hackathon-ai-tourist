import React, { useState, useEffect } from "react";
import axios from "axios";
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import LoadingSpinner from './LoadingSpinner';

const TouristDashboard = ({ onLogout }) => {
  const [wallet, setWallet] = useState(1000);
  const [weather, setWeather] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentName, setCurrentName] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [selectedMode, setSelectedMode] = useState("DRIVING");
  const [travelInfo, setTravelInfo] = useState({ 
    distance: "", 
    duration: "",
    mode: "DRIVING"
  });
  const [routeDetails, setRouteDetails] = useState({
    driving: { distance: "", duration: "" },
    walking: { distance: "", duration: "" },
    bicycling: { distance: "", duration: "" },
    transit: { distance: "", duration: "" }
  });
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routePath, setRoutePath] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [sosHistory, setSosHistory] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const findMyCoordinates = () => {
    setLoadingGeo(true);
    setShowLoading(true);
    setLoadingMessage("Getting your current location...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (res.data && res.data.address) {
              const locationName = 
                res.data.address.city ||
                res.data.address.town ||
                res.data.address.village ||
                res.data.address.county ||
                res.data.address.state;
              setCurrentName(locationName);
              
              // Get nearby places
              getNearbyPlaces(latitude, longitude);
            }
          } catch (e) {
            console.error("Error fetching reverse geocoding data", e);
          }
          setLoadingGeo(false);
          setShowLoading(false);
        },
        (err) => {
          console.error(err.message);
          setLoadingGeo(false);
          setShowLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLoadingGeo(false);
      setShowLoading(false);
    }
  };

  const getNearbyPlaces = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`
      );
      setWeather(response.data.current_weather);
      
      // Simulate nearby places data
      const places = [
        { name: "Tourist Information Center", type: "info", distance: "0.2 km" },
        { name: "Emergency Hospital", type: "hospital", distance: "1.5 km" },
        { name: "Police Station", type: "police", distance: "2.1 km" },
        { name: "Gas Station", type: "fuel", distance: "0.8 km" },
        { name: "Restaurant", type: "food", distance: "0.5 km" },
        { name: "Hotel", type: "accommodation", distance: "1.2 km" }
      ];
      setNearbyPlaces(places);
    } catch (error) {
      console.error("Error fetching nearby places:", error);
    }
  };

  useEffect(() => {
    findMyCoordinates();
  }, []);

  const geocodePlace = async (name) => {
    if (!name.trim()) {
      return;
    }

    setLoadingGeo(true);
    setShowLoading(true);
    setLoadingMessage(`Searching for: ${name}`);
    
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          name
        )}&limit=5&addressdetails=1`
      );
      
      if (res.data && res.data.length > 0) {
        const { lat, lon, display_name } = res.data[0];
        const newDestination = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setDestination(newDestination);
        setDestinationName(display_name);
        
        if (currentLocation) {
          calculateRoute(currentLocation, newDestination);
        }
      }
    } catch (e) {
      console.error("Error searching for location:", e);
    }
    setLoadingGeo(false);
    setShowLoading(false);
  };

  const calculateRoute = async (origin, dest) => {
    setIsCalculating(true);
    setShowLoading(true);
    setLoadingMessage("Calculating routes for all transportation modes...");
    
    const modes = ['driving', 'walking', 'bicycling', 'transit'];
    const newRouteDetails = { ...routeDetails };

    try {
      const routePromises = modes.map(async (mode) => {
        try {
          const response = await axios.get(
            `https://router.project-osrm.org/route/v1/${mode}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&steps=true&annotations=true`
          );

          if (response.data && response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const distance = (route.distance / 1000).toFixed(1);
            const duration = Math.round(route.duration / 60);
            
            if (mode === selectedMode.toLowerCase()) {
              setRoutePath(route.geometry);
            }
            
            return {
              mode,
              data: {
                distance: `${distance} km`,
                duration: `${duration} min`,
                geometry: route.geometry
              }
            };
          }
        } catch (error) {
          console.error(`Error calculating ${mode} route:`, error);
          return {
            mode,
            data: { distance: "N/A", duration: "N/A" }
          };
        }
      });

      const results = await Promise.all(routePromises);
      
      results.forEach(({ mode, data }) => {
        newRouteDetails[mode] = data;
      });

      setRouteDetails(newRouteDetails);
      
      const currentMode = selectedMode.toLowerCase();
      if (newRouteDetails[currentMode]) {
        setTravelInfo({
          distance: newRouteDetails[currentMode].distance,
          duration: newRouteDetails[currentMode].duration,
          mode: selectedMode
        });
        if (newRouteDetails[currentMode].geometry) {
          setRoutePath(newRouteDetails[currentMode].geometry);
        }
      }
    } catch (error) {
      console.error("Failed to calculate some routes:", error);
    }
    
    setIsCalculating(false);
    setShowLoading(false);
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    const modeKey = mode.toLowerCase();
    if (routeDetails[modeKey] && routeDetails[modeKey].distance !== "N/A") {
      setTravelInfo({
        distance: routeDetails[modeKey].distance,
        duration: routeDetails[modeKey].duration,
        mode: mode
      });
      if (routeDetails[modeKey].geometry) {
        setRoutePath(routeDetails[modeKey].geometry);
      }
    }
  };

  const handlePayParking = () => {
    if (wallet >= 50) {
      setWallet(wallet - 50);
    }
  };

  const handleSOS = (type) => {
    const sosData = {
      id: Date.now(),
      type,
      timestamp: new Date(),
      location: currentLocation,
      status: 'active'
    };
    
    setSosHistory(prev => [...prev, sosData]);
    setShowLoading(true);
    setLoadingMessage(`🚨 ${type} Emergency - Contacting services...`);
    
    // Simulate emergency response
    setTimeout(() => {
      setShowLoading(false);
      // Update SOS status
      setSosHistory(prev => 
        prev.map(sos => 
          sos.id === sosData.id 
            ? { ...sos, status: 'responded' }
            : sos
        )
      );
    }, 3000);
  };

  const getTravelTips = () => {
    const tips = [
      "Check weather before you travel.",
      "Carry water and snacks for long journeys.",
      "Follow traffic rules and road signs.",
      "Keep emergency contacts handy.",
      "Avoid night travel if possible.",
    ];

    if (weather) {
      if (weather.temperature > 30) {
        tips.push("🌡️ High temperature - Stay hydrated and avoid peak sun hours.");
      } else if (weather.temperature < 10) {
        tips.push("❄️ Low temperature - Dress warmly and check for ice on roads.");
      }
      
      if (weather.windspeed > 20) {
        tips.push("💨 High winds - Be cautious while driving, especially on highways.");
      }
    }

    if (travelInfo.distance && travelInfo.distance !== "N/A") {
      const distance = parseFloat(travelInfo.distance);
      if (distance > 50) {
        tips.push("🛣️ Long journey - Plan rest stops and fuel stations.");
      } else if (distance > 20) {
        tips.push("🚗 Medium journey - Check fuel and plan your route.");
      }
    }

    return tips;
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case "DRIVING": return "🚗";
      case "WALKING": return "🚶";
      case "BICYCLING": return "🚴";
      case "TRANSIT": return "🚌";
      default: return "🚗";
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case "DRIVING": return "bg-blue-500";
      case "WALKING": return "bg-green-500";
      case "BICYCLING": return "bg-orange-500";
      case "TRANSIT": return "bg-purple-500";
      default: return "bg-blue-500";
    }
  };

  const getMapUrl = () => {
    if (!currentLocation) return null;
    
    const center = destination || currentLocation;
    const markers = [];
    
    markers.push(`markers=color:red|label:Y|${currentLocation.lat},${currentLocation.lng}`);
    
    if (destination) {
      markers.push(`markers=color:green|label:D|${destination.lat},${destination.lng}`);
    }
    
    let path = "";
    if (currentLocation && destination) {
      path = `&path=color:0x0000ff|weight:5|${currentLocation.lat},${currentLocation.lng}|${destination.lat},${destination.lng}`;
    }
    
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=12&size=600x400&maptype=roadmap&${markers.join('&')}${path}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'demo'}`;
    
    return mapUrl;
  };

  const getWeatherIcon = (weathercode) => {
    if (weathercode >= 0 && weathercode <= 3) return "☀️";
    if (weathercode >= 45 && weathercode <= 48) return "🌫️";
    if (weathercode >= 51 && weathercode <= 67) return "🌧️";
    if (weathercode >= 71 && weathercode <= 77) return "❄️";
    if (weathercode >= 80 && weathercode <= 82) return "🌦️";
    if (weathercode >= 85 && weathercode <= 86) return "🌨️";
    if (weathercode >= 95 && weathercode <= 99) return "⛈️";
    return "🌤️";
  };

  const handleLogout = async () => {
    try {
      setShowLoading(true);
      setLoadingMessage("Logging out...");
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setShowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4">
      {showLoading && <LoadingSpinner message={loadingMessage} />}

      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🧳</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Tourist Safety Hub</h1>
                <p className="text-gray-600">Your complete travel companion</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Wallet & Weather */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Card */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-3xl shadow-xl p-6 text-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">💳 Tourist Smart Card</h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-10 bg-yellow-400 rounded-lg shadow-inner"></div>
                <div>
                  <p className="text-white/80 text-sm">Balance</p>
                  <p className="text-3xl font-extrabold">₹{wallet}</p>
                </div>
              </div>

              <div className="tracking-widest font-mono text-lg mb-4">
                1234 &nbsp; 5678 &nbsp; 9012 &nbsp; 3456
              </div>

              <div className="flex justify-between items-center text-sm mb-6">
                <div>
                  <p className="uppercase text-white/70 text-xs">Card Holder</p>
                  <p className="font-semibold">Tourist User</p>
                </div>
                <div className="text-right">
                  <p className="uppercase text-white/70 text-xs">Valid Thru</p>
                  <p className="font-semibold">12/30</p>
                </div>
              </div>

              <button
                onClick={handlePayParking}
                className="w-full bg-white/20 backdrop-blur-sm text-white py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200"
              >
                💳 Pay Parking ₹50
              </button>
            </div>

            {/* Weather Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌤️</span>
                <h3 className="text-xl font-bold text-gray-800">Weather</h3>
              </div>
              
              {weather ? (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold">Current</span>
                    <span className="text-2xl">{getWeatherIcon(weather.weathercode)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span>🌡️</span>
                      <span>{weather.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💨</span>
                      <span>{weather.windspeed} km/h</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-2xl">
                  <p className="text-gray-600">Loading weather...</p>
                </div>
              )}
            </div>

            {/* Nearby Places */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📍 Nearby Places</h3>
              <div className="space-y-3">
                {nearbyPlaces.map((place, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-800">{place.name}</p>
                      <p className="text-sm text-gray-600">{place.distance}</p>
                    </div>
                    <span className="text-2xl">
                      {place.type === 'hospital' ? '🏥' : 
                       place.type === 'police' ? '👮' : 
                       place.type === 'fuel' ? '⛽' : 
                       place.type === 'food' ? '🍽️' : 
                       place.type === 'accommodation' ? '🏨' : 'ℹ️'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Map & Route */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Planning */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🗺️</span>
                <h2 className="text-2xl font-bold text-gray-800">Route Planning</h2>
              </div>
              
              {/* Location Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Location
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => setCurrentName(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your location"
                    />
                    <button
                      className="bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                      onClick={findMyCoordinates}
                      disabled={loadingGeo}
                    >
                      📍
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={destinationName}
                      onChange={(e) => setDestinationName(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Where to?"
                    />
                    <button
                      className="bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-colors"
                      disabled={loadingGeo || isCalculating}
                      onClick={() => geocodePlace(destinationName)}
                    >
                      🚀
                    </button>
                  </div>
                </div>
              </div>

              {/* Map */}
              {currentLocation && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Interactive Map</h3>
                  <div className="bg-gray-100 rounded-2xl p-4 h-64 flex items-center justify-center relative">
                    {getMapUrl() ? (
                      <img 
                        src={getMapUrl()} 
                        alt="Route Map" 
                        className="w-full h-full object-cover rounded-xl shadow-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="hidden flex-col items-center justify-center text-gray-500 bg-white p-4 rounded-xl">
                      <span className="text-4xl mb-2">🗺️</span>
                      <p className="font-semibold">Interactive Map</p>
                      <p className="text-sm">Current: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</p>
                      {destination && (
                        <p className="text-sm">Destination: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transportation Modes */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Transportation Mode</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { mode: "DRIVING", label: "Car" },
                    { mode: "WALKING", label: "Walk" },
                    { mode: "BICYCLING", label: "Bike" },
                    { mode: "TRANSIT", label: "Transit" }
                  ].map(({ mode, label }) => (
                    <button
                      key={mode}
                      onClick={() => handleModeChange(mode)}
                      className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                        selectedMode === mode
                          ? `${getModeColor(mode)} text-white border-transparent shadow-lg transform scale-105`
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:scale-105"
                      }`}
                    >
                      <span className="text-2xl mb-2">{getModeIcon(mode)}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Route Information */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Route Information</h3>
                  <button
                    onClick={() => setShowRouteDetails(!showRouteDetails)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    {showRouteDetails ? "Hide Details" : "Show All Modes"}
                  </button>
                </div>
                
                <div className="bg-white p-4 rounded-xl border mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getModeIcon(selectedMode)}</span>
                    <span className="font-semibold capitalize">{selectedMode.toLowerCase()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>📏</span>
                      <span>{travelInfo.distance || "Set destination"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏱️</span>
                      <span>{travelInfo.duration || "Set destination"}</span>
                    </div>
                  </div>
                </div>

                {showRouteDetails && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(routeDetails).map(([mode, info]) => (
                      <div key={mode} className="bg-blue-50 p-3 rounded-xl border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getModeIcon(mode.toUpperCase())}</span>
                          <span className="text-sm font-medium capitalize">{mode}</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>📏 {info.distance || "N/A"}</div>
                          <div>⏱️ {info.duration || "N/A"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - SOS & Tips */}
          <div className="lg:col-span-1 space-y-6">
            {/* Emergency SOS */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🚨 Emergency SOS</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSOS("Fuel")}
                  className="flex flex-col items-center justify-center bg-yellow-100 text-yellow-700 p-4 rounded-2xl hover:bg-yellow-200 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-2xl mb-2">⛽</span>
                  <span className="text-sm font-medium">Fuel</span>
                </button>
                <button
                  onClick={() => handleSOS("Panic")}
                  className="flex flex-col items-center justify-center bg-red-100 text-red-700 p-4 rounded-2xl hover:bg-red-200 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-2xl mb-2">🚨</span>
                  <span className="text-sm font-medium">Panic</span>
                </button>
                <button
                  onClick={() => handleSOS("Health")}
                  className="flex flex-col items-center justify-center bg-green-100 text-green-700 p-4 rounded-2xl hover:bg-green-200 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-2xl mb-2">🏥</span>
                  <span className="text-sm font-medium">Health</span>
                </button>
                <button
                  onClick={() => handleSOS("Police")}
                  className="flex flex-col items-center justify-center bg-blue-100 text-blue-700 p-4 rounded-2xl hover:bg-blue-200 transition-all duration-200 transform hover:scale-105"
                >
                  <span className="text-2xl mb-2">👮</span>
                  <span className="text-sm font-medium">Police</span>
                </button>
              </div>
            </div>

            {/* SOS History */}
            {sosHistory.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 SOS History</h3>
                <div className="space-y-3">
                  {sosHistory.slice(-3).reverse().map((sos) => (
                    <div key={sos.id} className={`p-3 rounded-xl border ${
                      sos.status === 'active' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{sos.type}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          sos.status === 'active' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
                        }`}>
                          {sos.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {sos.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Tips */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Travel Tips</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {getTravelTips().map((tip, idx) => (
                  <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-xl">
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristDashboard;
