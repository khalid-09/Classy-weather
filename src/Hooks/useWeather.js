import { useEffect, useState } from 'react';

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

export function useWeather(location) {
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState('');
  const [weather, setWeather] = useState({});

  useEffect(
    function () {
      const geoController = new AbortController();
      const weatherController = new AbortController();
      async function fetchWeather() {
        try {
          setIsLoading(true);
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
            { signal: geoController.signal }
          );
          const geoData = await geoRes.json();

          if (!geoData.results) throw new Error('Location not found');

          const { latitude, longitude, timezone, name, country_code } =
            geoData.results.at(0);
          setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
            { signal: weatherController.signal }
          );
          const weatherData = await weatherRes.json();
          setWeather(weatherData.daily);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error(err);
          }
        } finally {
          setIsLoading(false);
        }
      }
      localStorage.setItem('location', location);
      if (location.length < 2) return setWeather({});
      fetchWeather();

      return () => {
        geoController.abort();
        weatherController.abort();
      };
    },
    [location]
  );

  return { isLoading, displayLocation, weather };
}
