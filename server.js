var title, thumbnail;
var srt_converted = false;
var video_number = 0;

var express = require("express");
var app = express();
var server = app.listen(8000);

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
                srt_converted = true;
            })
            .on('progress', function(progress) {
              console.log('Processing: ' + progress.percent + '% done');
            })
            .run();

    });
    var intvl = setInterval(function() {
        if (title && thumbnail && srt_converted) {
            var reply = {
                video_title: title,
                thumbnail: thumbnail,
                video_number: video_number
            }
            video_number += 1;
            clearInterval(intvl);
            srt_converted = false;
            response.send(reply);
        }
    }, 1000);
}

app.post("/mix", makemix);

function makemix(request, response) {

    var videoNames = [];
    for(i = 0 ; i < request.body.selected_clips.length ; i++){
      ffmpeg()
        .input("public/" + request.body.selected_clips[i].sourcevideo)
        .setStartTime(request.body.selected_clips[i].starttime)
        .duration(request.body.selected_clips[i].duration)
        .output("public/videos/clips/output" + i + ".mp4")
        .on('end', function() {
          console.log('Finished processing');
          mergeclips(videoNames);
        })
        .run();
        videoNames.push("public/videos/clips/output" + i + ".mp4");
    }
 }

 function mergeclips(videoNames){
   var mergedVideo = ffmpeg();
   videoNames.forEach(function(videoName){
     mergedVideo = mergedVideo.addInput(videoName);
   });
   mergedVideo.mergeToFile('public/videos/finalvideo/final.mp4')
   .on('error', function(err) {
       console.log('Error ' + err.message);
   })
   .on('end', function() {
       console.log('Finished!');
   });

 }








    /**/
