function calcsecs(timestamp){
  var timear = timestamp.split(":");
  var hours = Number(timear[0]) * 60 * 60;
  var minutes = Number(timear[1]) * 60;
  var secstring = timear[2].split(",");
  var seconds = Number(secstring[0] + "." + secstring[1]);
  var timeinsec = hours + minutes + seconds;
  return timeinsec;
}

module.exports.calcsecs = calcsecs;
