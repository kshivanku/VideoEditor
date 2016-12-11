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

    //LOAD SUBTITLES AND CUT CLIPS
    loadStrings(new_video.subtitle_file, cutClips);

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
        }
    }
}

function cutClips(data) {

    //HAVE TO SAVE THIS BECAUSE END TIME OF PREV CLIP HAS TO BE EDITIED TO START TIME OF THE NEXT
    var prevclip;

    //IN EACH ROUND OF FOR LOOP, START TIME, END TIME AND FULL CONTENT OF A CLIP IS SAVED IN THE CLIP OBJECT OF THE VIDEO
    for (i = 1; i < data.length; i++) {
        var newclip = new Clip();
        var starttime = "";
        var endtime = "";

        //VALUES ARE HARD CODED, MIGHT NOT WORK FOR SOME SRT's
        for (j = 0; j < data[i].length; j++) {
            if (j < 11) {
                if (j == 8) {
                    starttime += ".";
                } else {
                    starttime += data[i][j];
                }
            } else if (j > 16 && j < 29) {
                endtime += data[i][j];
            }
        }
        newclip.starttime = starttime;
        newclip.endtime = endtime;

        //HAVE TO DO THIS BECAUSE OF THE NATURE OF TIMING MENTIONED IN SRT FILES
        if (prevclip) {
            prevclip.endtime = newclip.starttime;
        }

        //COPY THE CONTENT, CAN BE IN MULTIPLE LINES
        i += 1;
        while (notanumber(data[i]) && i < data.length) {
            for (j = 0; j < data[i].length; j++) {
                newclip.clipcontent += data[i][j];
            }
            i += 1;
        }

        function notanumber(arr) {
            if (arr) {
                for (x = 0; x < arr.length; x++) {
                    if (!(Number(arr[x] + 1))) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        }

        //PUSH THE NEW CLIP IN THE CLIPS ARRAY OF NEW_VIDEO OBJECT
        new_video.clips.push(newclip);
        prevclip = newclip;
    }

    //SAVING THE VIDEO SOURCE WITH THE CLIP OBJECT AND CALCULATING DURATION
    for (i = 0; i < new_video.clips.length; i++) {
        new_video.clips[i].sourcevideo = new_video.video_file;
        new_video.clips[i].duration = calculateduration(new_video.clips[i].starttime, new_video.clips[i].endtime);
    }
}

//UNSCALABLE FUNCTION FOR CALCULATING DURATION
function calculateduration(starttime, endtime) {
    var totalstart = calculateStartTime(starttime);
    var totalend = calculateEndTime(endtime);
    var duration = totalend - totalstart;
    return String(duration);
}

function calculateStartTime(starttime){
  var starthour = Number(starttime[0] + starttime[1]) * 60 * 60;
  var startmins = Number(starttime[3] + starttime[4]) * 60;
  var startsecs = Number(starttime[6] + starttime[7] + "." + starttime[9] + starttime[10]);
  var totalstart = starthour + startmins + startsecs;
  return totalstart;
}

function calculateEndTime(endtime){
  var endhour = Number(endtime[0] + endtime[1]) * 60 * 60;
  var endmins = Number(endtime[3] + endtime[4]) * 60;
  var endsecs = Number(endtime[6] + endtime[7] + "." + endtime[9] + endtime[10]);
  var totalend = endhour + endmins + endsecs;
  return totalend;
}


function displaysubs(videoObj) {
    var clipindex;

    //CLEAR ANY PREVIOUSLY LOADED SUBTITLES
    $('#subtitle').empty();

    //DISPLAY SUBTITLES FOR THE SELECTED FILE
    for (i = 0; i < videoObj.clips.length; i++) {
        clipindex = createP("");
        clipindex.parent("#subtitle");
        clipindex.html(videoObj.clips[i].clipcontent);
        clipindex.mousePressed(saveclip);
    }
}

function Clip() {
    this.starttime = "";
    this.endtime = "";
    this.duration = "";
    this.clipcontent = "";
    this.sourcevideo = "";
}

function saveclip() {
    for (i = 0; i < videos.length; i++) {
        for (j = 0; j < videos[i].clips.length; j++) {
            //IDENTIFYING THE RIGHT CLIP BY MATCHING CONTENT, WILL NOT WORK FOR WORDS
            if (videos[i].clips[j].clipcontent == this.elt.innerHTML) {
                selected_clips.push(videos[i].clips[j]);
                console.log(videos[i].clips[j]);
                this.style("color", "#FF8500");
                display_selectedclips();
                return 1;
            }
        }
    }
}

function display_selectedclips() {
    $("#sortable").empty();
    for (i = 0; i < selected_clips.length; i++) {
        var clip = createElement("li", "");
        clip.parent("#sortable");
        clip.html(selected_clips[i].clipcontent);
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
            //AGAIN WE ARE MATCHING THE CONTENT, NOT SCALABLE
            if (selected_clips[j].clipcontent == liItem[i].innerHTML) {
                new_selected_clips.push(selected_clips[j]);
                j = selected_clips.length - 1; //JUST TO END THE LOOP
            }
        }
    }
    selected_clips = new_selected_clips;
    console.log(selected_clips);

    //LOAD PREVIEW WITH POPCORN
    var clipsforpopcorn = [];
    for( i = 0 ; i < selected_clips.length ; i++ ){
      var clipentry = new Clippopcorn();
      clipentry.src = selected_clips[i].sourcevideo;
      //POPCORN JS DOES NOT ACCEPT DECIMAL VALUES
      clipentry.in = floor(calculateStartTime(selected_clips[i].starttime) + 1);
      clipentry.out = floor(calculateEndTime(selected_clips[i].endtime) + 1);
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
  console.log(clipsforpopcorn);
  var sequence = Popcorn.sequence("mixedvideoplayer", clipsforpopcorn);
  // console.log(sequence);
  sequence.play();
}

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








/**/
