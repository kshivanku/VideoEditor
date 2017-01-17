var query_field, query, error;
var valid_url = /.*www\.youtube\.com\/watch\?v=\w+.*/;
var new_entry;
var new_video;
var videos = [];
var selected_clips = [];
var quickview;

function setup() {
    noCanvas();
    query_field = select("#url_input");
    error = select(".error");
    quickview = select("#quickview");
    quickview.mousePressed(generatevideo);
}

document.getElementById('url_input').onkeydown = function(e) {
    if (e.keyCode == 13) {
        query_submitted();
    }
    if (e.keyCode == 8) {
        error.html(" ");
    }
};

function query_submitted() {
    query = query_field.value();

    if (valid_url.test(query)) {
        //URL IS FOUND TO BE VALID

        //NO ERRORS, CLEAR TEXT FIELD
        error.html(" ");
        document.getElementById('url_input_form').reset();

        //CREATE A NEW ENTRY IN THE INDEX ELEMENT, SHOW LOADING TILL DATA COMES
        new_entry = createElement("li", "loading...");
        new_entry.parent("#loaded_videos");
        new_entry.style("background-image", "url(loading2.svg)");

        //TALK TO SERVER AND DOWNLOAD VIDEO FILES
        var id_start = query.indexOf("=");
        var id = query.substring(id_start + 1, id_start + 12);
        loadJSON("/download/" + id, gotData);
    } else {
        //URL IS FOUND TO BE INVALID, THROW ERROR
        error.html("Not a valid youtube link");
    }
}

function gotData(data) {
    //UPDATE THE VIDEOS ARRAY WITH INFORMATION FROM NEW VIDEO
    new_video = new Video();
    new_video.title = data.video_title;
    new_video.thumbnail = data.thumbnail;
    new_video.subtitle_file = "videos/" + data.video_number + ".srt";
    new_video.video_file = "videos/" + data.video_number + ".mp4";
    new_video.clips = data.srtjson;

    //PUSH THE NEW VIDEO IN THE VIDEO ARRAY
    videos.push(new_video);

    //UPDATE THE INFORMATION IN INDEX ELEMENT
    new_entry.html(new_video.title);
    new_entry.style("background-image", "url(" + new_video.thumbnail + ")");
    new_entry.mousePressed(show_video);
}

function Video() {
    this.title = "";
    this.thumbnail = "";
    this.subtitle_file = "";
    this.video_file = "";
    this.clips = [];
}

function show_video() {
    //FIND THE CORRESPONDING VIDEO IN VIDEO ARRAY BY MATCHING TITLES
    for (i = 0; i < videos.length; i++) {
        //SO WE CHECK THE TITLE OF VIDEO THAT WAS CLICKED ON WITH ALL THE VIDEO TITLES
        if (videos[i].title == this.elt.innerHTML) {
            //LOAD THE VIDEO IN VIDEO TAG
            var player = document.getElementById('videoPlayer');
            var mp4Vid = document.getElementById('mp4Source');
            player.pause();
            mp4Vid.src = videos[i].video_file;
            player.load();
            player.play();

            //DISPLAY HEADING
            var heading_tag = select('#video_name');
            heading_tag.html(videos[i].title);

            //DISPLAY SUBTITLES HEADING
            var subtitle_heading = select("#subtitle_heading");
            subtitle_heading.html("Subtitles:");

            //SHOW SUBTITLES
            displaysubs(videos[i]);

            //END LOOP
            return 1;
        }
    }
}

function displaysubs(videoObj) {
    var word;

    //CLEAR ANY PREVIOUSLY LOADED SUBTITLES
    $('#subtitle').empty();

    //DISPLAY SUBTITLES FOR THE SELECTED FILE
    for (i = 0; i < videoObj.clips.length; i++) {
      // console.log(videoObj.clips[i]);
      for (j = 0 ; j < videoObj.clips[i].words.length ; j++){
        word = createP(" ");
        word.parent("#subtitle");
        word.id(videoObj.clips[i].id + "." + j); //Giving a unique ID to each p element so that it can be identified when it is clicked upon.
        word.html(videoObj.clips[i].words[j].content);
        word.mousePressed(function(){
          var id = this.elt.id;
          var idar = id.split(".");
          for(i = 0 ; i < videoObj.clips.length; i++){
            if(videoObj.clips[i].id == idar[0]){
              console.log(videoObj.clips[i].words[idar[1]]);
              selected_clips.push(videoObj.clips[i].words[idar[1]]);
              this.style("color", "#FF8500");
              display_selectedclips();
              return 1;
            }
          }
        });
      }
    }
}

function display_selectedclips() {
    $("#sortable").empty();
    for (i = 0; i < selected_clips.length; i++) {
        var clip = createElement("li", "");
        clip.parent("#sortable");
        clip.id(selected_clips[i].id); //keeping the id of li and the corresponding clip object same
        clip.addClass('selected_clip'); //for selection later
        clip.html(selected_clips[i].content);
    }
}

$(function() {
    $("#sortable").sortable();
    $("#sortable").disableSelection();
});

function generatevideo() {

    //BEFORE WE CAN GENERATE THE VIDEO, WE NEED TO REARRANGE OUR SELECTED CLIPS ARRAY ACCORDING TO THE CHANGES USER MAY HAVE MADE
    var new_selected_clips = [];
    var liItem = $('#sortable li');

    // if (liItem.length) {
    //     loadanimation();
    // }
    for (i = 0; i < liItem.length; i++) {
        for (j = 0; j < selected_clips.length; j++) {
            //MATCHING THE IDS
            if (selected_clips[j].id == $(liItem[i])[0].id) {
                new_selected_clips.push(selected_clips[j]);
                j = selected_clips.length - 1; //JUST TO END THE LOOP
            }
        }
    }
    selected_clips = new_selected_clips;
    console.log("Selected Clips");
    console.log(selected_clips);

    //LOAD PREVIEW WITH POPCORN
    var clipsforpopcorn = [];
    for( i = 0 ; i < selected_clips.length ; i++ ){
      var clipentry = new Clippopcorn();
      clipentry.src = selected_clips[i].vidsource;
      //POPCORN JS DOES NOT ACCEPT DECIMAL VALUES
      clipentry.in = floor(selected_clips[i].startsec);
      clipentry.out = floor(selected_clips[i].endsec);
      clipsforpopcorn.push(clipentry);
    }
    //console.log(clipsforpopcorn);
    $('#mixedvideoplayer video').remove();
    createPopcornPreview(clipsforpopcorn);

    // sendjson(selected_clips);
}

function Clippopcorn() {
  this.src = "";
  this.in = 0;
  this.out = 0;
}

function createPopcornPreview(clipsforpopcorn){
  console.log("Popcorn ready clips");
  console.log(clipsforpopcorn);
  var sequence = Popcorn.sequence("mixedvideoplayer", clipsforpopcorn);
  // console.log(sequence);
  sequence.play();
}


// THIS METHOD WAS USED BEFORE POPCORN
/*
function loadanimation() {
    var player = document.getElementById('mixedvideo');
    var mp4Vid = document.getElementById('mixsource');
    player.pause();
    mp4Vid.src = 'loading.mp4';
    player.removeAttribute("controls");
    player.load();
    player.play();
}
function sendjson(selected_clips) {
    jQuery.ajax({
        type: 'POST',
        url: '/mix',
        data: {
            "selected_clips": selected_clips
        },
        success: function(data) {
            loadvideo(data);
        }
    });
}
function loadvideo(data) {
    var player = document.getElementById('mixedvideo');
    var mp4Vid = document.getElementById('mixsource');
    player.pause();
    mp4Vid.src = 'videos/finalvideo/final' + data + '.mp4';
    player.setAttribute("controls", "controls");
    player.load();
    player.play();
}
*/







/**/
