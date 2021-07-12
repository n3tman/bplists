$(function() {
    //
});

Dropzone.options.upload = {
    init: function() {
        this.on('addedfile', function (file) {
            if (this.files.length > 1) {
                this.removeFile(this.files[0]);
            }
        });
    },
    accept: function(file, done) {
        // console.log(file);
    },
    maxFilesize: 1.2, // MB
    addRemoveLinks: true
    // autoProcessQueue: false
};
