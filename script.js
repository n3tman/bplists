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
    document.querySelector('#date').value = date.toISOString().substring(0,10);

    if (json.hasOwnProperty('songs') && json.songs.length) {
        document.querySelector('#songs').value = json.songs.length;
    }
}

Dropzone.options.upload = {
    url: '/',
    init: function() {
        this.on('addedfile', function () {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
        this.on('removedfile', function () {
            document.querySelectorAll('input, textarea').forEach(function(item) {
                item.value = '';
            });
            document.querySelector('#category').value = 'Misc';
        });
    },
    accept: function(file, done) {
        var reader = new FileReader();
        reader.addEventListener('load', function(event) {
            var result = event.target.result;
            var json = {};
            try {
                json = JSON.parse(result);
                processPlaylist(json, file.name);
            } catch(e) {
                done('Invalid playlist file');
            }
        });
        reader.readAsText(file);
    },
    maxFilesize: 1.2, // MB
    addRemoveLinks: true,
    thumbnailWidth: 200,
    thumbnailHeight: 200,
    dictDefaultMessage: 'Drop your <b>.bplist</b> here<br>(or click to choose a file)',
};

Dropzone.options.thumb = {
    url: '/',
    init: function() {
        this.on('addedfile', function () {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
    },
    accept: function(file, done) {
        // nothing
    },
    acceptedFiles: 'image/*',
    maxFilesize: 0.04, // MB
    addRemoveLinks: true,
    dictDefaultMessage: 'Drop a small 300x300px cover here<br>(or click to choose a file)',
};

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#form').addEventListener('submit', function(e) {
        e.preventDefault();

        var listFiles = document.querySelector('#upload').dropzone.files;
        var thumbFiles = document.querySelector('#thumb').dropzone.files;
        var apiText = document.querySelector('#api');

        if (listFiles.length === 0 || listFiles[0].status === 'error') {
            apiText.value = 'Error! Please select a valid .bplist first';
        } else if (thumbFiles.length === 0 || thumbFiles[0].status === 'error') {
            apiText.value = 'Error! Please select a small cover first (file size should be under 40 KB)';
        } else {
            console.log('all good!');
        }

        apiText.scrollIntoView({behavior: 'smooth', block: 'end'});
    });
});
