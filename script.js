Dropzone.options.upload = {
    url: '/',
    init: function() {
        this.on('addedfile', function () {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
    },
    accept: function(file, done) {
        var reader = new FileReader();
        reader.addEventListener('load', function(event) {
            var result = event.target.result;
            var json = {};
            try {
                json = JSON.parse(result);
                if (json.hasOwnProperty('image') && json.image.trim()) {
                    document.querySelector('.dz-image > img').src = json.image;
                }
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
        console.log(file);
    },
    acceptedFiles: 'image/*',
    maxFilesize: 0.04, // MB
    addRemoveLinks: true,
    dictDefaultMessage: 'Drop a small 300x300px cover here<br>(or click to choose a file)',
};

