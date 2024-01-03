import React, { useState, useEffect } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

function App() {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});
  const [savedLocation, setSavedLocation] = useState("");
  const [savedLocationsList, setSavedLocationsList] = useState([]);

  const fetchWeather = async (loc) => {
    if (loc.length < 2) return setWeather({});

    try {
      setIsLoading(true);
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${loc}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results[0];
      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.daily);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLocation(localStorage.getItem("location") || "");
    setSavedLocation(localStorage.getItem("savedLocation") || "");
    setSavedLocationsList(
      JSON.parse(localStorage.getItem("savedLocationsList")) || []
    );
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location);
      localStorage.setItem("location", location);
    }
  }, [location]);

  const handleLocationChange = (e) => setLocation(e.target.value);

  const handleSaveLocation = () => {
    if (location) {
      setSavedLocation(location);
      setSavedLocationsList((prevList) => [...prevList, location]);
      localStorage.setItem("savedLocation", location);
      localStorage.setItem(
        "savedLocationsList",
        JSON.stringify([...savedLocationsList, location])
      );
    }
  };

  // const handleUpdateLocation = () => {
  //   if (savedLocation) {
  //     setLocation(savedLocation);
  //   }
  // };

  const handleDeleteLocation = () => {
    const updatedLocationsList = savedLocationsList.filter(
      (loc) => loc !== savedLocation
    );
    setSavedLocationsList(updatedLocationsList);
    setSavedLocation("");
    localStorage.removeItem("savedLocation");
    localStorage.setItem(
      "savedLocationsList",
      JSON.stringify(updatedLocationsList)
    );
  };
  const handleRemoveLocation = (index) => {
    const updatedLocationsList = [...savedLocationsList];
    updatedLocationsList.splice(index, 1);
    setSavedLocationsList(updatedLocationsList);
    localStorage.setItem(
      "savedLocationsList",
      JSON.stringify(updatedLocationsList)
    );
  };
  return (
    <div className="app">
      <h1>ForeCastify</h1>
      <Input
        location={location}
        onChangeLocation={handleLocationChange}
        onSaveLocation={handleSaveLocation}
        // onUpdateLocation={handleUpdateLocation}
        onDeleteLocation={handleDeleteLocation}
        savedLocations={savedLocationsList}
        onRemoveLocation={handleRemoveLocation}
      />
      {isLoading && <p className="loader">Loading...</p>}
      {weather && weather.weathercode && (
        <Weather weather={weather} location={location} />
      )}
    </div>
  );
}

function Input({
  location,
  onChangeLocation,
  onSaveLocation,
  // onUpdateLocation,
  onDeleteLocation,
  savedLocations,
  onRemoveLocation,
}) {
  const handleRemoveLocation = (index) => {
    onRemoveLocation(index);
  };
  return (
    <div className="input-container">
      <div className="input-wrapper">
        <input
          type="text"
          placeholder="Search from Location"
          value={location}
          onChange={onChangeLocation}
        />
        <ul className="savedlocation">
          {savedLocations.map((loc, index) => (
            <>
              <li key={index}>{loc}</li>
              <span onClick={() => handleRemoveLocation(index)}> &#x2613;</span>
            </>
          ))}
        </ul>
      </div>
      <div className="button-container">
        <button onClick={onSaveLocation}>Add</button>
        {/* <button onClick={onUpdateLocation}>Update</button> */}
        <button onClick={onDeleteLocation}>Delete</button>
      </div>
    </div>
  );
}

function Weather({ weather, location }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;
  return (
    <>
      <h2>Weather {location}</h2>
      <ul className="weather">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max[i]}
            min={min[i]}
            code={codes[i]}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </>
  );
}

function Day({ min, max, date, code, isToday }) {
  return (
    <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : formatDay(date)}</p>
      <p>
        {Math.floor(min)}&deg; &mdash;<strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}

export default App;
