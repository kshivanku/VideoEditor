var query_field, submit, query;

function setup(){
  noCanvas();
  query_field = createInput("Enter youtube URL");
  submit = createButton("Submit");
  submit.mousePressed(query_submitted);
}

function query_submitted(){
  query = query_field.value();
  var id_start = query.indexOf("=");
  var id_end = query.length;
  var id = query.substring(id_start+1 , id_end);

  loadJSON("/download/"+id , gotData);
}

function gotData(data){
  console.log(data);
  createP(data.video_title);
  createImg(data.thumbnail);
  loadStrings("videos/" + data.video_number + ".srt", gotSubtitles);
}

function gotSubtitles(data){
  createP(data);
}
