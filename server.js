var title, thumbnail;
var srt_converted = false;
var video_number = 0;
var srtjson
var operation_number = 0;

var express = require("express");
var app = express();
var server = app.listen(8000, function(){
  console.log("listening on port 8000");
});

var fs = require("fs");
var youtubedl = require("youtube-dl");
var ffmpeg = require('fluent-ffmpeg');
var bodyparser = require("body-parser");
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
  extented: true
}));
app.use(express.static("public"));


app.get("/download/:url", download_video);

function download_video(request, response) {
    var url = 'http://www.youtube.com/watch?v=' + request.params.url;
    var video = youtubedl(url);

    youtubedl.getInfo(url, function(err, info) {
        if (err) throw err;
        title = info.title;
        thumbnail = info.thumbnail;
        console.log("title: ", title);
        console.log("thumbnail: ", thumbnail);
    });

    video.pipe(fs.createWriteStream('public/videos/' + video_number + '.mp4'));
    video.on('info', function(info) {
        console.log('Download started');
        console.log('filename: ' + info._filename);
        console.log('size: ' + info.size);
    });

    var options = {
        auto: true,
        all: false,
        lang: 'en',
        cwd: 'public/videos',
    };
    youtubedl.getSubs(url, options, function(err, files) {
        if (err) throw err;
        console.log('subtitle files downloaded:', files);

        ffmpeg()
            .input('public/videos/' + files[0])
            .output('public/videos/' + video_number + '.srt')
            .on('end', function() {
                console.log('Finished processing');
                // VTT file is converted to SRT, now we have to get word level times
                getwordlevelsrt('public/videos/' + video_number + '.srt', video_number);
            })
            .on('progress', function(progress) {
              console.log('Processing: ' + progress.percent + '% done');
            })
            .run();

    });

    //It tries to send the response every second, so as soon as we have the title, thumbnails and srt convertion done, we send a response
    var intvl = setInterval(function() {
        if (title && thumbnail && srt_converted) {
            var reply = {
                video_title: title,
                thumbnail: thumbnail,
                video_number: video_number,
                srtjson: srtjson
            }
            video_number += 1;
            clearInterval(intvl);
            srt_converted = false;
            response.send(reply);
        }
    }, 1000);
}

function getwordlevelsrt(srtfile, video_num){
  var srttojson = require("./srttojson.js").srttojson;
  srtjson = srttojson(srtfile, video_num); //This will convert the srt file into a JSON object with word level transcription
  //Writing the JSON to a separate file
  var srtjson_string = JSON.stringify(srtjson, null, 2);
  fs.writeFile("wordlevelsrt.json", srtjson_string);

  //All the SRT related process is complete
  srt_converted = true;
}


/*
THIS CODE IS FOR WHEN WE WERE CUTTING INDIVIDUAL CLIPS AND COMBINING THEM, BEFORE POPCORN JS
app.post("/mix", makemix);
function makemix(request, response) {
    operation_number +=1;
    var videoNames = [];
    for(i = 0 ; i < request.body.selected_clips.length ; i++){
      ffmpeg()
        .input("public/" + request.body.selected_clips[i].sourcevideo)
        .setStartTime(request.body.selected_clips[i].starttime)
        .duration(request.body.selected_clips[i].duration)
        .output("public/videos/clips/output" + i + ".mp4")
        .on('end', function() {
          console.log('Finished processing');
          mergeclips(videoNames, response, operation_number);
        })
        .run();
        videoNames.push("public/videos/clips/output" + i + ".mp4");
    }
 }

 function mergeclips(videoNames, response, operation_number){
   var mergedVideo = ffmpeg();
   videoNames.forEach(function(videoName){
     mergedVideo = mergedVideo.addInput(videoName);
   });
   mergedVideo.mergeToFile('public/videos/finalvideo/final' + operation_number + '.mp4')
   .on('error', function(err) {
       console.log('Error ' + err.message);
   })
   .on('end', function() {
       console.log('Finished!');
       response.send(String(operation_number));
   });

 }
*/






/**/
