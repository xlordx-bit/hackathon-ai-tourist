import React from 'react';

const WeatherCard = ({ weather, currentLocation }) => {
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

  const getWeatherDescription = (weathercode) => {
    if (weathercode >= 0 && weathercode <= 3) return "Clear sky";
    if (weathercode >= 45 && weathercode <= 48) return "Foggy";
    if (weathercode >= 51 && weathercode <= 67) return "Rainy";
    if (weathercode >= 71 && weathercode <= 77) return "Snowy";
    if (weathercode >= 80 && weathercode <= 82) return "Light rain";
    if (weathercode >= 85 && weathercode <= 86) return "Snow showers";
    if (weathercode >= 95 && weathercode <= 99) return "Thunderstorm";
    return "Partly cloudy";
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 30) return "text-red-600";
    if (temp >= 20) return "text-orange-600";
    if (temp >= 10) return "text-yellow-600";
    return "text-blue-600";
  };

  const getWindSpeedColor = (speed) => {
    if (speed >= 30) return "text-red-600";
    if (speed >= 20) return "text-orange-600";
    if (speed >= 10) return "text-yellow-600";
    return "text-green-600";
  };

  const getTravelAdvice = () => {
    if (!weather) return [];
    
    const advice = [];
    
    if (weather.temperature > 30) {
      advice.push({
        icon: "🌡️",
        text: "High temperature - Stay hydrated and avoid peak sun hours",
        color: "bg-red-100 text-red-700 border-red-200"
      });
    } else if (weather.temperature < 10) {
      advice.push({
        icon: "❄️",
        text: "Low temperature - Dress warmly and check for ice on roads",
        color: "bg-blue-100 text-blue-700 border-blue-200"
      });
    }
    
    if (weather.windspeed > 20) {
      advice.push({
        icon: "💨",
        text: "High winds - Be cautious while driving, especially on highways",
        color: "bg-orange-100 text-orange-700 border-orange-200"
      });
    }
    
    if (weather.weathercode >= 51 && weather.weathercode <= 67) {
      advice.push({
        icon: "🌧️",
        text: "Rainy conditions - Reduce speed and increase following distance",
        color: "bg-blue-100 text-blue-700 border-blue-200"
      });
    }
    
    if (weather.weathercode >= 71 && weather.weathercode <= 77) {
      advice.push({
        icon: "❄️",
        text: "Snowy conditions - Use winter tires and drive carefully",
        color: "bg-purple-100 text-purple-700 border-purple-200"
      });
    }
    
    return advice;
  };

  return (
    <div className="space-y-6">
      {/* Main Weather Card */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Current Weather</h3>
            <p className="text-blue-100">
              {currentLocation ? 
                `${currentLocation.lat.toFixed(2)}, ${currentLocation.lng.toFixed(2)}` : 
                "Location not available"
              }
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl">{getWeatherIcon(weather?.weathercode || 0)}</span>
          </div>
        </div>

        {weather ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className={`text-6xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                  {weather.temperature}°
                </span>
                <p className="text-blue-100 mt-2">{getWeatherDescription(weather.weathercode)}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💨</span>
                  <div>
                    <p className="text-lg font-semibold">{weather.windspeed} km/h</p>
                    <p className="text-blue-100 text-sm">Wind Speed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧭</span>
                  <div>
                    <p className="text-lg font-semibold">{weather.winddirection}°</p>
                    <p className="text-blue-100 text-sm">Wind Direction</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <span className="text-2xl mb-2 block">🌡️</span>
                <p className="text-sm text-blue-100">Temperature</p>
                <p className="text-xl font-bold">{weather.temperature}°C</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <span className="text-2xl mb-2 block">💨</span>
                <p className="text-sm text-blue-100">Wind</p>
                <p className={`text-xl font-bold ${getWindSpeedColor(weather.windspeed)}`}>
                  {weather.windspeed} km/h
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
                <span className="text-2xl mb-2 block">🧭</span>
                <p className="text-sm text-blue-100">Direction</p>
                <p className="text-xl font-bold">{weather.winddirection}°</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">🌤️</span>
            <p className="text-blue-100">Loading weather data...</p>
          </div>
        )}
      </div>

      {/* Weather Alerts & Travel Advice */}
      {weather && getTravelAdvice().length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-xl font-bold text-gray-800">Weather Alerts & Travel Advice</h3>
          </div>
          <div className="space-y-3">
            {getTravelAdvice().map((advice, index) => (
              <div key={index} className={`p-4 rounded-xl border ${advice.color}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{advice.icon}</span>
                  <p className="text-sm font-medium">{advice.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Forecast Placeholder */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📅</span>
          <h3 className="text-xl font-bold text-gray-800">5-Day Forecast</h3>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((day) => (
            <div key={day} className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-xl text-center border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">Day {day}</p>
              <span className="text-2xl mb-2 block">🌤️</span>
              <p className="text-sm font-semibold text-gray-800">22°</p>
              <p className="text-xs text-gray-600">15°</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          Detailed forecast coming soon...
        </p>
      </div>

      {/* Weather Tips */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💡</span>
          <h3 className="text-xl font-bold text-gray-800">Weather Tips</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-xl">🌅</span>
            <div>
              <p className="font-semibold text-gray-800">Best Travel Time</p>
              <p className="text-sm text-gray-600">Early morning or late afternoon for comfortable temperatures</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <span className="text-xl">🎒</span>
            <div>
              <p className="font-semibold text-gray-800">What to Pack</p>
              <p className="text-sm text-gray-600">Check weather before packing - layers work best</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
            <span className="text-xl">🚗</span>
            <div>
              <p className="font-semibold text-gray-800">Road Conditions</p>
              <p className="text-sm text-gray-600">Weather affects road safety - adjust driving accordingly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
