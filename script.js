var listJson = {};
var coverImage = '';
var thumbImage = '';
var $tagEditor;

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
    var mapArray;
    var isJson = json.songs && json.songs.length;
    var idTags = $tagEditor.tagEditor('getTags')[0].tags;
    var apiText = document.querySelector('#api');
    var progress = document.querySelector('#progress');
    var statusText = document.querySelector('#status');
    var submit = document.querySelector('#submit');
    var apiHashUrl = 'https://api.beatsaver.com/maps/hash/';
    var apiKeyUrl = 'https://api.beatsaver.com/maps/id/';
    var listPath = 'https://bsaber.com/PlaylistAPI/';

    var songList = [];
    var errors = [];
    var mappers = [];

    submit.classList.add('is-loading');

    if (!isJson || (isJson && (idTags.length !== json.songs.length))) {
        mapArray = idTags;
    } else {
        mapArray = json.songs;
    }

    var songNum = mapArray.length;
    var curNum = songNum;

    await asyncForEach(mapArray, function (song) {
        var hash = '';
        var key = '';
        var fetchUrl = '';

        curNum--;
        progress.value = Math.round((songNum - curNum) * 100 / songNum)
        statusText.value = 'Fetching info from BeatSaver [' + (songNum - curNum) + '/' + songNum + ']';

        if (song.hasOwnProperty('key')) {
            key = song.key.toLowerCase();
            fetchUrl = apiKeyUrl + key;
        } else if (song.hasOwnProperty('hash')) {
            hash = song.hash.toLowerCase();
            fetchUrl = apiHashUrl + hash;
        } else if (song.trim().length === 40) {
            hash = song.toLowerCase();
            fetchUrl = apiHashUrl + hash;
        } else if (song.trim().length) {
            key = song.toLowerCase();
            fetchUrl = apiKeyUrl + key;
        } else {
            errors.push('No key or hash');
            return true;
        }

        fetch(fetchUrl).then(function (response) {
            if (!response.ok) {
                errors.push(key ? key : hash);
            } else {
                return response.json();
            }
        }).then(function (data) {
            if (data) {
                var resultSong = {
                    'key': data.id,
                    'hash': data.versions[0].hash,
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
                    'key': key,
                    'hash': hash,
                    'name': '### ERROR ###'
                });
            }

            if (curNum === 0) {
                if (errors.length === 0) {
                    statusText.value = 'Done! Sending formatted file back to you. Don\'t forget to copy API text below and paste it to the Discord.';
                } else {
                    showSubmitError('Done with errors. Some maps are probably unavailable: ' + errors.join(', '))
                }

                document.querySelector('#mappers').value = mappers.length;

                var title = document.querySelector('#title').value.trim();
                var author = document.querySelector('#author').value.trim();
                var description = document.querySelector('#desc').value.trim();
                var date = document.querySelector('#date').value;
                var category = document.querySelector('#category').value;
                var image = listJson.hasOwnProperty('image') ? listJson.image : '';

                if (coverImage) {
                    image = coverImage;
                }

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
                saveAs(blob, fileName, true);

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

    listJson = json;

    json.songs.forEach(function (song) {
        if (song.hasOwnProperty('key')) {
            $tagEditor.tagEditor('addTag', song.key, true);
        } else if (song.hasOwnProperty('hash')) {
            $tagEditor.tagEditor('addTag', song.hash, true);
        }
    });
}

function clearTags() {
    var tags = $tagEditor.tagEditor('getTags')[0].tags;
    tags.forEach(function (tag) {
        $tagEditor.tagEditor('removeTag', tag, true);
    });
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

            var fileRemove = document.querySelectorAll('.dz-remove');
            fileRemove.forEach(function (button) {
                button.click();
            });

            clearTags();
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
    dictDefaultMessage: 'Drop your <b>.bplist</b> file here<br>or leave the field empty to create a list'
};

Dropzone.options.thumb = {
    url: '/',
    init: function () {
        this.on('addedfile', function () {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
        this.on('removedfile', function () {
            thumbImage = '';
        });
    },
    accept: function (file) {
        var reader = new FileReader();
        reader.addEventListener('load', function () {
            thumbImage = reader.result;
        });
        reader.readAsDataURL(file);
    },
    acceptedFiles: 'image/*',
    maxFilesize: 0.05, // MB
    addRemoveLinks: true,
    dictDefaultMessage: 'Drop a <b>small cover</b> image (max 50 KB)<br>or click here to choose a file'
};

Dropzone.options.cover = {
    url: '/',
    init: function () {
        this.on('addedfile', function () {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
        this.on('removedfile', function () {
            coverImage = '';
        });
    },
    accept: function (file) {
        var reader = new FileReader();
        reader.addEventListener('load', function () {
            coverImage = reader.result;
        });
        reader.readAsDataURL(file);
    },
    acceptedFiles: 'image/*',
    maxFilesize: 0.9, // MB
    addRemoveLinks: true,
    dictDefaultMessage: 'Drop a square <b>cover</b> image (max 900 KB)<br>or click here to choose a file'
};

function showSubmitError(message) {
    var statusText = document.querySelector('#status');
    if (message) {
        statusText.style.color = '#c83838';
        statusText.value = message;
    } else {
        statusText.removeAttribute('style');
        statusText.value = '';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#form').addEventListener('submit', function (e) {
        e.preventDefault();

        var listFiles = document.querySelector('#upload').dropzone.files;
        var coverFiles = document.querySelector('#cover').dropzone.files;

        if (listFiles.length > 0 && listFiles[0].status === 'error') {
            showSubmitError('Error! Please select a valid .bplist first');
        } else if ($tagEditor.tagEditor('getTags')[0].tags.length === 0) {
            showSubmitError('Error! Please add at least one map ID');
        } else if (coverFiles.length > 0 && coverFiles[0].status === 'error') {
            showSubmitError('Error! Please select a proper cover image (under 900 KB)');
        } else {
            showSubmitError('');
            processSongs(listJson);
        }
    });

    $tagEditor = $('#tags');
    $tagEditor.tagEditor({
        delimiter: ',; ',
        placeholder: 'Enter map keys (preferable) or hashes',
        animateDelete: 100,
        onChange: function(field, editor, tags) {
            document.querySelector('#songs').value = tags.length;
        },
        beforeTagSave: function(field, editor, tags, tag, val) {
            if (val.includes('bsaber.com') || val.includes('beatsaver.com')) {
                return val.replace(/http.*\/(\w+)\/?/, '$1');
            }
        },
    });

    $('#remove-all').click(function() {
        clearTags();
    });
});
