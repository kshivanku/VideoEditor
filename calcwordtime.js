function calcwordtime(srtjson){
  var splitfactor = /[\s\r]/;
  for( i = 0 ; i < srtjson.length ; i++){
    var wordarray = srtjson[i].content.split(splitfactor);
    var startsec = srtjson[i].startsec;
    var totalchars = calcchars(wordarray);
    for ( j = 0 ; j < wordarray.length ; j++){
      var word = new Word;
      word.content = wordarray[j];
      word.duration = (wordarray[j].length / totalchars) * srtjson[i].duration;
      word.startsec = startsec;
      word.endsec = startsec + word.duration;
      startsec = word.endsec;
      srtjson[i].words.push(word);
    }
  }
  console.log("word level transcribing is done");
  return srtjson;
}

function calcchars(wordarray){
  var totalc = 0;
  for(k = 0 ; k < wordarray.length ; k++){
    totalc += wordarray[k].length;
  }
  return totalc;
}

function Word(){
  this.startsec;
  this.endsec;
  this.duration;
  this.content;
}

module.exports.calcwordtime = calcwordtime;
