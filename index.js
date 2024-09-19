import bodyParser from "body-parser";
import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const GEO_API_URL = "https://photon.komoot.io/api/?q="
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?";
const configWeather = "&current=temperature_2m,relative_humidity_2m,is_day,rain,weather_code&hourly=is_day,temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code&timezone=auto";


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

function extractWeatherData(result){


  const current = {
     currTemp :  result.current.temperature_2m,
     currHumidity : result.current.relative_humidity_2m,
     todaySunrise : result.daily.sunrise[0],
     todaySunset : result.daily.sunset[0],
     currWeatherCode: result.current.weather_code,
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
    console.log(current);

    res.render("index.ejs", {
      location,
      currTemp: current.currTemp,
      currHumidity: current.currHumidity,
      todayMinTemp: daily[0].minTemp,
      todayMaxTemp: daily[0].maxTemp,
      todaySunrise: current.todaySunrise,
      todaySunset: current.todaySunset,
      rain: current.rain,
      isDay: current.isDay,
      currWeatherCode: current.currWeatherCode,
      daily,
      hourly,
    
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
