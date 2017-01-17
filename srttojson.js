var oneDigit = /^[0-9]+$/;
var twoTimeCodes = /\d{2}:\d{2}:\d{2},\d{2,3} --> \d{2}:\d{2}:\d{2},\d{2,3}/;
var words = /./;
var pstartsec;

var fs = require('fs');
var calcsecs = require("./calcsecs.js").calcsecs;

function srttojson(srtfile){
  var srtjson = [];
  var segment;
  srtFile = fs.readFileSync(srtfile).toString();
  var srtline = srtFile.split("\n");
  for (i = 0 ; i < srtline.length ; i++) {
    if(oneDigit.test(srtline[i])){
      if(segment){
        srtjson.push(segment);
      }
      segment = new Segment();
      segment.id = srtline[i];
    }
    else if(twoTimeCodes.test(srtline[i])){
      var timestamps = srtline[i].split(" --> ");
      segment.startsec = calcsecs(timestamps[0]);

      //ENDSECS ARE USUALLY NOT EQUAL TO TIMESTAMP[1], A BETTER NUMBER IS STARTSEC OF NEXT SEGMENT
      if (srtjson.length){
        var lastSegmentId= srtjson.length - 1;
        srtjson[lastSegmentId].endsec = segment.startsec;
        srtjson[lastSegmentId].duration = srtjson[lastSegmentId].endsec - srtjson[lastSegmentId].startsec;
      }
    }
    else if(words.test(srtline[i])){
      if(segment.content){
        segment.content = segment.content + srtline[i];
      }
      else {
        segment.content = srtline[i];
      }
    }
    //PUSHING THE LAST SEGMENT IF PROGRAM WILL EXIT THE LOOP AFTER THIS, ALSO IF THERE ARE NO NEXT SEGMENTS THEN TIMESTAMP[1] IS THE ENDSEC
    if (i == srtline.length-1){
      segment.endsec = calcsecs(timestamps[1]);
      segment.duration = segment.endsec - segment.startsec;
      srtjson.push(segment);
    }
  }
  console.log("srt is converted into json, now going for word level transcribing");
  var calcwordtime = require("./calcwordtime.js").calcwordtime;
  var srtwordjson = calcwordtime(srtjson);
  return srtwordjson;
}

function Segment(){
  this.id;
  this.startsec;
  this.endsec;
  this.duration;
  this.content;
  this.words = [];
}

module.exports.srttojson = srttojson;
