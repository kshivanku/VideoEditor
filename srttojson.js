var oneDigit = /^[0-9]+$/;
var twoTimeCodes = /\d{2}:\d{2}:\d{2},\d{2,3} --> \d{2}:\d{2}:\d{2},\d{2,3}/;
var words = /./;

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
      segment.endsec = calcsecs(timestamps[1]);
      segment.duration = segment.endsec - segment.startsec;
    }
    else if(words.test(srtline[i])){
      if(segment.content){
        segment.content = segment.content + srtline[i];
      }
      else {
        segment.content = srtline[i];
      }
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
