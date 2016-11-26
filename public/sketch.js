var query_field, submit, query, error;
var valid_url = /.*www\.youtube\.com\/watch\?v=\w+.*/;
var video_list = [];
var videos = [];
var i = 0;

function setup(){
  noCanvas();
  query_field = select("#url_input");
  error = select(".error");
}

document.getElementById('url_input').onkeydown = function(e){
   if(e.keyCode == 13){
     query_submitted();
   }
   if(e.keyCode == 8){
     error.html(" ");
   }
};

function query_submitted(){
  query = query_field.value();

  if (valid_url.test(query)){
    error.html(" ");
    document.getElementById('url_input_form').reset();
    var id_start = query.indexOf("=");
    var id_end = query.length;
    var id = query.substring(id_start+1 , id_start+12);
    i = video_list.length;
    video_list[i] = createElement("li","loading...");
    video_list[i].parent("#loaded_videos");
    video_list[i].style("background-image", "url(loading2.svg)");

    loadJSON("/download/"+id , gotData);
  }
  else {
    error.html("Not a valid youtube link");
  }
}

function gotData(data){
  var new_video = new Video();
  new_video.title = data.video_title;
  new_video.thumbnail = data.thumbnail;
  new_video.subtitle_file = "videos/" + data.video_number + ".srt";
  new_video.video_file = "videos/" + data.video_number + ".mp4";
  videos.push(new_video);
  video_list[i].html(new_video.title);
  video_list[i].style("background-image", "url(" + new_video.thumbnail + ")");
  video_list[i].mousePressed(show_video);
  console.log(video_list);
  console.log(videos);
}

function Video(){
  this.title = "";
  this.thumbnail = "";
  this.subtitle_file = "";
  this.video_file = "";
}

function show_video(){
  for(i = 0 ; i < videos.length ; i++){
    if(videos[i].title == this.elt.innerHTML){
      var player = document.getElementById('videoPlayer');
      var mp4Vid = document.getElementById('mp4Source');
      player.pause();
      mp4Vid.src = videos[i].video_file;
      player.load();
      player.play();
      var heading_tag = select('#video_name');
      heading_tag.html(videos[i].title);
      loadStrings(videos[i].subtitle_file, gotSubs);
    }
  }
}

function gotSubs(data){
  var subtitle_tag = select('#subtitle');
  subtitle_tag.html(data);
}
