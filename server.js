
const express = require('express');
const app = express();
const fs = require('fs');
const formidable = require('formidable');
const ExifImage = require('exif').ExifImage;

app.set('view engine', 'ejs');

app.use((req, res, next) => {
    if (req.path == "/upload" || req.path == "/display" || req.path == "/map") {
        next();
    } else {
        res.redirect('/upload');
    }

});

app.get("/upload", function (req, res) {
    let error = '';
    if (req.query.fail == 'type') {
        error = "Please upload image in JPEG/JPG/PNG type";
    }
    else if (req.query.fail == 'exif') {
        error = 'Unable to extract Makernote information as it dose not have Makernote information';
    }
    res.render('upload', { error: error });

});


app.post("/display", function (req, res) {
    if (req.method.toLowerCase() == "post") {
        // parse a file upload
        const form = new formidable.IncomingForm();
        const photo = {};
        form.parse(req, (err, fields, files) => {
            photo['title'] = fields.title;
            photo['description'] = fields.description;
            photo['mimetype'] == files.sampleFile.mimetype;

            var gps = true;

            fs.readFile(files.sampleFile.path, (err, data) => {
                photo['image'] = new Buffer.from(data).toString('base64');
                try {
                    new ExifImage({ image: files.sampleFile.path }, function (error, exifData) {
                        if (error) {
                            res.redirect('/upload?fail=exif');
                        }
                        else {
                            photo['make'] = exifData.image.Make;
                            photo['model'] = exifData.image.Model;
                            photo['created_on'] = exifData.exif.CreateDate;
                            photo['lon'] = getGps(exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef);
                            photo['lat'] = getGps(exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef);
                            if (photo.lat == '' || photo.lon == '')
                                gps = false;
                            res.render('display', { photo: photo, gps: gps });

                        }


                    });
                } catch (error) {
                    res.redirect('/upload?fail=exif');
                }

            });


        });
    }
});
app.get("/display", function (req, res) {
res.redirect('/upload');
});
app.get("/map", function (req, res) {
    res.render("map", { lon: req.query.lon, lat: req.query.lat });
});
function getGps(gps, ref) {
    if (gps == null || ref == null) {
        return '';
    } else {
        let temp = gps[0] + (gps[1] / 60) + (gps[2] / 3600);
        if (ref == "S" || ref == "W") {
            temp = temp * -1;
        }
        return temp;
    }
}
app.listen(process.env.PORT || 8099);
