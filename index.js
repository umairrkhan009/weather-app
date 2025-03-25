import bodyParser from "body-parser";
import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const GEO_API_URL = "https://photon.komoot.io/api/?q="
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?";
const configWeather = "&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,weather_code&hourly=is_day,temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code&timezone=auto";


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());


async function getWeatherData(longitude, latitude){
  
  try {
    const response = await axios.get(`${WEATHER_API_URL}&longitude=${longitude}&latitude=${latitude}${configWeather}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response? error.response.data : error.response.message);
  }
}

function iconChoose(isDay, weatherCode){
  let imgSrc;

  switch (weatherCode) {
    case 0: // Clear sky
      imgSrc = isDay ? "/images/clear-day.svg" : "/images/clear-night.svg";
      break;
    case 1: // Mainly clear
    case 2: // Partly cloudy
      imgSrc = isDay ? "/images/cloudy-1-day.svg" : "/images/cloudy-1-night.svg";
      break;
    case 3: // Overcast
      imgSrc = isDay ? "/images/cloudy-3-day.svg" : "/images/cloudy-3-night.svg";
      break;
    case 45: // Fog
    case 48: // Depositing rime fog
      imgSrc = isDay ? "/images/fog-day.svg" : "/images/fog-night.svg";
      break;
    case 51: // Drizzle: Light
    case 53: // Drizzle: Moderate
    case 55: // Drizzle: Dense
      imgSrc = isDay ? "/images/rainy-1-day.svg" : "/images/rainy-1-night.svg";
      break;
    case 56: // Freezing Drizzle: Light
    case 57: // Freezing Drizzle: Dense
    case 66: // Freezing Rain: Light
    case 67: // Freezing Rain: Heavy
      imgSrc = "/images/rain-and-sleet-mix.svg"; // Same for day and night
      break;
    case 61: // Rain: Slight
      imgSrc = isDay ? "/images/rainy-1-day.svg" : "/images/rainy-1-night.svg";
      break;
    case 63: // Rain: Moderate
      imgSrc = isDay ? "/images/rainy-2-day.svg" : "/images/rainy-2-night.svg";
      break;
    case 65: // Rain: Heavy
      imgSrc = isDay ? "/images/rainy-3-day.svg" : "/images/rainy-3-night.svg";
      break;
    case 71: // Snow fall: Slight
      imgSrc = isDay ? "/images/snowy-1-day.svg" : "/images/snowy-1-night.svg";
      break;
    case 73: // Snow fall: Moderate
      imgSrc = isDay ? "/images/snowy-2-day.svg" : "/images/snowy-2-night.svg";
      break;
    case 75: // Snow fall: Heavy
      imgSrc = isDay ? "/images/snowy-3-day.svg" : "/images/snowy-3-night.svg";
      break;
    case 77: // Snow grains
      imgSrc = "/images/snow-and-sleet-mix.svg"; // Same for day and night
      break;
    case 80: // Rain showers: Slight
      imgSrc = isDay ? "/images/rainy-1-day.svg" : "/images/rainy-1-night.svg";
      break;
    case 81: // Rain showers: Moderate
      imgSrc = isDay ? "/images/rainy-2-day.svg" : "/images/rainy-2-night.svg";
      break;
    case 82: // Rain showers: Violent
      imgSrc = isDay ? "/images/rainy-3-day.svg" : "/images/rainy-3-night.svg";
      break;
    case 85: // Snow showers: Slight
      imgSrc = isDay ? "/images/snowy-1-day.svg" : "/images/snowy-1-night.svg";
      break;
    case 86: // Snow showers: Heavy
      imgSrc = isDay ? "/images/snowy-3-day.svg" : "/images/snowy-3-night.svg";
      break;
    case 95: // Thunderstorm: Slight or moderate
      imgSrc = isDay ? "/images/scattered-thunderstorms-day.svg" : "/images/scattered-thunderstorms-night.svg";
      break;
    case 96: // Thunderstorm with slight hail
    case 99: // Thunderstorm with heavy hail
      imgSrc = "/images/severe-thunderstorm.svg"; // Same for day and night
      break;
    default:
      imgSrc = isDay ? "/images/cloudy-1-day.svg" : "/images/cloudy-1-night.svg"; // Fallback
      break;
  }
  return imgSrc;
}

function getHourlyIcon(hourly, index){
  const isDay = hourly[index].hourlyDN;
  const weatherCode = hourly[index].hourlyWeatherCode;

  let imgSrc = iconChoose(isDay, weatherCode);
  return `<img src = "${imgSrc}" height="65">`;
}

function getCurrentIcon(isDay, weatherCode){

  let imgSrc = iconChoose(isDay, weatherCode);
  return `<img src = "${imgSrc}" height="150">`;
}

function getWeeklyIcon(daily, index){
  const weatherCode = daily[index].dailyWeatherCode;

  let imgSrc = iconChoose(1, weatherCode);

  return `<img src = "${imgSrc}" height="65">`;
}

function extractWeatherData(result){


  const current = {
     currTemp :  result.current.temperature_2m,
     currHumidity : result.current.relative_humidity_2m,
     todaySunrise : result.daily.sunrise[0],
     todaySunset : result.daily.sunset[0],
     currWeatherCode: result.current.weather_code,
     precipitation: result.current.precipitation,
     rain: result.current.rain,
     isDay: result.current.is_day,
  }

  
  const daily = [0,1,2,3,4,5].map(per => ({
    date: result.daily.time[per],
    minTemp: result.daily.temperature_2m_min[per],
    maxTemp: result.daily.temperature_2m_max[per],
    dailyWeatherCode : result.daily.weather_code[per],
  }))

  const hourly = [6, 9, 12, 15, 18, 21].map(hour => ({
    hourlyWeatherCode: result.hourly.weather_code[hour],
    hourlyTemp: result.hourly.temperature_2m[hour],
    hourlyDN: result.hourly.is_day[hour],
    
  }));
 

  return { current, daily, hourly};
}


app.get("/", async (req, res) => {
  try {
    const location = req.query.location || "New Delhi"; 
    const longitude = req.query.long || 77.2245;
    const latitude = req.query.lat||28.6358;

    const weatherData = await getWeatherData(longitude, latitude);
    
    const {current, daily, hourly} = extractWeatherData(weatherData);

    res.render("index.ejs", {
      location,
      currTemp: current.currTemp,
      currHumidity: current.currHumidity,
      todayMinTemp: daily[0].minTemp,
      todayMaxTemp: daily[0].maxTemp,
      todaySunrise: current.todaySunrise,
      todaySunset: current.todaySunset,
      precipitation: current.precipitation,
      rain: current.rain,
      isDay: current.isDay,
      currWeatherCode: current.currWeatherCode,
      daily,
      hourly,
      getCurrentIcon: getCurrentIcon, 
      getHourlyIcon : getHourlyIcon,
      getWeeklyIcon: getWeeklyIcon
    })
    
  } catch (error) {
    console.log(error.response ? error.response.data : error.message);
  }
});

async function getCoordinates(location){
  try {
    const response = await axios.get(`${GEO_API_URL}${location}`);
    const result = response.data;
    const longitude = result.features[0].geometry.coordinates[0];
    const latitude = result.features[0].geometry.coordinates[1];
    return {longitude, latitude};

  } catch (error) {
    throw new Error("Error fetching coordinates.");
  }
}

app.get("/weather", async (req, res) => {
   const location = req.query.location;
  try {
    const {longitude, latitude} = await getCoordinates(location);
    res.redirect(`/?location=${location}&long=${longitude}&lat=${latitude}`);
  } catch (error) {
    console.log(error.message);
  }
})





app.listen(port, () => {
  console.log(`Successfully listening on ${port}`);
});
