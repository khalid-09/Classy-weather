import { useEffect, useState } from 'react';

export default function App() {
  return (
    <div className="app">
      <Main />
    </div>
  );
}

function Main() {
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState('');
  const [location, setLocation] = useState(function () {
    return localStorage.getItem('location') || '';
  });
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

  return (
    <>
      <h1>Classy Weather</h1>
      <div>
        <input
          type="text"
          placeholder="Search from location..."
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
      </div>
      {/* <button>Get weather</button> */}
      {isLoading && <p className="loader">Loading...</p>}
      {weather.weathercode && (
        <Weather weather={weather} location={displayLocation} />
      )}
    </>
  );
}

function Weather({ weather, location }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  useEffect(
    function () {
      if (!location) return;
      document.title = `${location.split(' ').at(0)}'s Weather`;
      return () => (document.title = `Classy Weather`);
    },
    [location]
  );

  return (
    <div>
      <h2>Weather of {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? 'Today' : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], '☀️'],
    [[1], '🌤'],
    [[2], '⛅️'],
    [[3], '☁️'],
    [[45, 48], '🌫'],
    [[51, 56, 61, 66, 80], '🌦'],
    [[53, 55, 63, 65, 57, 67, 81, 82], '🌧'],
    [[71, 73, 75, 77, 85, 86], '🌨'],
    [[95], '🌩'],
    [[96, 99], '⛈'],
  ]);
  const arr = [...icons.keys()].find(key => key.includes(wmoCode));
  if (!arr) return 'NOT FOUND';
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(dateStr));
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}
