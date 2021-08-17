var listJson = {};
var thumbImage = '';

function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

async function asyncForEach(arr, callback, ms) {
    for (var item of arr) {
        await sleep(ms);
        callback(item);
    }
}

async function processSongs(json) {
    var songNum = json.songs.length;
    var curNum = songNum;
    var apiText = document.querySelector('#api');
    var progress = document.querySelector('#progress');
    var statusText = document.querySelector('#status');
    var submit = document.querySelector('#submit');
    var apiUrl = 'https://api.beatsaver.com/maps/hash/';
    var listPath = 'https://bsaber.com/PlaylistAPI/';

    var songList = [];
    var errors = [];
    var mappers = [];

    submit.classList.add('is-loading');

    await asyncForEach(json.songs, function (song) {
        var hash = song.hash.toLowerCase();

        curNum--;
        progress.value = Math.round((songNum - curNum) * 100 / songNum)
        statusText.value = 'Fetching info from BeatSaver [' + (songNum - curNum) + '/' + songNum + ']';

        fetch(apiUrl + hash, {
            headers: {
                'User-Agent': 'BSaberPlaylistFormatter (+https://github.com/n3tman/bplists)'
            }
        }).then(function (response) {
            if (!response.ok) {
                errors.push(hash);
            } else {
                return response.json();
            }
        }).then(function (data) {
            if (data) {
                var resultSong = {
                    'key': data.id,
                    'hash': hash,
                    'name': data.name,
                    'uploader': data.uploader.name
                }

                if (song.hasOwnProperty('customData')) {
                    resultSong.customData = song.customData;
                }

                songList.push(resultSong);

                if (!mappers.includes(data.uploader.name)) {
                    mappers.push(data.uploader.name);
                }
            } else {
                songList.push({
                    'name': '### ERROR ###',
                    'hash': hash
                });
            }

            if (curNum === 0) {
                if (errors.length === 0) {
                    statusText.value = 'Done! Sending formatted file back to you. Don\'t forget to copy API text below and paste it to the Discord.';
                } else {
                    statusText.style.color = '#c83838';
                    statusText.value = 'Done with errors. Some maps are probably unavailable. Hashes: ' + errors.join(', ');
                }

                document.querySelector('#mappers').value = mappers.length;

                var title = document.querySelector('#title').value.trim();
                var author = document.querySelector('#author').value.trim();
                var description = document.querySelector('#desc').value.trim();
                var date = document.querySelector('#date').value;
                var category = document.querySelector('#category').value;
                var image = listJson.hasOwnProperty('image') ? listJson.image : '';

                var fileName = date.substring(2) + '_' + slugify(title, {lower: true, strict: true}) +
                    '_' + slugify(author, {lower: true, strict: true}) + '.bplist';
                var fileUrl = listPath + fileName;

                var resultPlaylist = {
                    'playlistTitle': title,
                    'playlistAuthor': author,
                    'playlistDescription': description,
                    'syncURL': fileUrl,
                    'songs': songList,
                    'image': image
                }

                var blob = new Blob(
                    [JSON.stringify(resultPlaylist, null, 4)],
                    {type: 'text/plain;charset=utf-8'}
                );
                saveAs(blob, fileName);

                var apiJson = {
                    'playlistTitle': title,
                    'playlistAuthor': author,
                    'playlistDescription': description,
                    'playlistURL': fileUrl,
                    'playlistDate': date,
                    'playlistCategory': category,
                    'playlistSongCount': songNum,
                    'playlistMapperCount': mappers.length,
                    'image': thumbImage
                }

                apiText.value = JSON.stringify(apiJson, null, 4);

                submit.classList.remove('is-loading');

                apiText.scrollIntoView({behavior: 'smooth', block: 'end'});
            }
        });
    }, 2000);
}

function processPlaylist(json, name) {
    if (json.hasOwnProperty('image') && json.image.trim()) {
        document.querySelector('.dz-image > img').src = json.image;
    }
    if (json.hasOwnProperty('playlistTitle') && json.playlistTitle.trim()) {
        document.querySelector('#title').value = json.playlistTitle.trim();
    }
    if (json.hasOwnProperty('playlistAuthor') && json.playlistAuthor.trim()) {
        document.querySelector('#author').value = json.playlistAuthor.trim();
    }
    if (json.hasOwnProperty('playlistDescription') && json.playlistDescription.trim()) {
        document.querySelector('#desc').value = json.playlistDescription.trim();
    }

    var dateStr = name.match(/^((\d+)-\d+-\d+).*/);

    if (dateStr) {
        if (dateStr[2].length < 3) {
            dateStr[1] = '20' + dateStr[1];
        }
        date = new Date(dateStr[1])
    } else {
        date = new Date();
    }
    document.querySelector('#date').value = date.toISOString().substring(0, 10);

    if (json.hasOwnProperty('songs') && json.songs.length) {
        document.querySelector('#songs').value = json.songs.length;
    }

    listJson = json;
}

Dropzone.options.upload = {
    url: '/',
    init: function () {
        this.on('addedfile', function () {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
        this.on('removedfile', function () {
            document.querySelectorAll('input, textarea').forEach(function (item) {
                item.value = '';
            });
            document.querySelector('#category').value = 'Misc';
            document.querySelector('#progress').value = 0;
            document.querySelector('#status').removeAttribute('style');

            var thumbRemove = document.querySelector('.thumb .dz-remove');
            if (thumbRemove) {
                thumbRemove.click();
            }
        });
    },
    accept: function (file, done) {
        var reader = new FileReader();
        reader.addEventListener('load', function (event) {
            var result = event.target.result;
            var json = {};
            try {
                json = JSON.parse(result);
                processPlaylist(json, file.name);
            } catch (e) {
                done('Invalid playlist file');
            }
        });
        reader.readAsText(file);
    },
    maxFilesize: 1.2, // MB
    addRemoveLinks: true,
    thumbnailWidth: 200,
    thumbnailHeight: 200,
    dictDefaultMessage: 'Drop your <b>.bplist</b> here<br>(or click to choose a file)'
};

Dropzone.options.thumb = {
    url: '/',
    init: function () {
        this.on('addedfile', function () {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
    },
    accept: function (file, done) {
        var reader = new FileReader();
        reader.addEventListener('load', function () {
            thumbImage = reader.result;
        });
        reader.readAsDataURL(file);
    },
    acceptedFiles: 'image/*',
    maxFilesize: 0.04, // MB
    addRemoveLinks: true,
    dictDefaultMessage: 'Drop a small 300x300px cover image here<br>(or click to choose a file)'
};

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#form').addEventListener('submit', function (e) {
        e.preventDefault();

        var listFiles = document.querySelector('#upload').dropzone.files;
        var thumbFiles = document.querySelector('#thumb').dropzone.files;
        var statusText = document.querySelector('#status');

        if (listFiles.length === 0 || listFiles[0].status === 'error') {
            statusText.style.color = '#c83838';
            statusText.value = 'Error! Please select a valid .bplist first';
        } else if (thumbFiles.length === 0 || thumbFiles[0].status === 'error') {
            statusText.style.color = '#c83838';
            statusText.value = 'Error! Please select a small cover first (file size should be under 40 KB)';
        } else {
            statusText.removeAttribute('style');
            statusText.value = '';
            processSongs(listJson);
        }
    });
});
