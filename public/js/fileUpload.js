function JSUploader() {

    this.uploadFile =  function(file, type) {
        file = {file: file, progressTotal: 0, progressDone: 0, element: null, valid: false};

        var url;
        var data = new FormData();
        data.append('uploadFile', file.file);

        if (type == "ussd") url = '/upload-ussd';
        else url = '/upload-phones';

        $.ajax({
            url: url,
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            success: function (response) {
                if (response.status == 'ok') {
                    console.log(response.text);
                    $('#ussd-list').DataTable().draw(false);
                }
                else {
                    console.log(response.errors);
                }
            },
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();

                if (xhr.upload) {
                    console.log('xhr upload');

                    xhr.upload.onprogress = function (e) {
                        file.progressDone = e.position || e.loaded;
                        file.progressTotal = e.totalSize || e.total;
                        //baseClass.updateFileProgress(index, file.progressDone, file.progressTotal, file.element);
                        //baseClass.totalProgressUpdated();
                        console.log('xhr.upload progress: ' + file.progressDone + ' / ' + file.progressTotal + ' = ' + (Math.floor(file.progressDone / file.progressTotal * 1000) / 10) + '%');
                    };
                }

                return xhr;
            }
        });
    };

    this.updateFileProgress = function(index, done, total, view) {
        var percent = (Math.floor(done/total*1000)/10);

        var progress = view.find('div.progress-bar');

        progress.width(percent + '%');
        progress.html(percent + '%');
    };

    this.updateTotalProgress = function(done, total) {
        var percent = (Math.floor(done/total*1000)/10);
        $('#progress').width(percent + '%');
        $('#progress').html(percent + '%');
    };

    this.totalProgressUpdated = function() {
        var done = 0.0;
        var total = 0.0;

        $.each(baseClass.allFiles, function(i, file) {
            done += file.progressDone;
            total += file.progressTotal;
        })

        baseClass.updateTotalProgress(done, total);
    };
}

$(function(){
    var uploader = new JSUploader();

    $(document).ready(function()
    {
        $("#addUssdFileButton").click(function() {
            $("#uploadUssdFiles").replaceWith($("#uploadUssdFiles").clone(true));
            $("#uploadUssdFiles").click();
        });

        $("#addPhonesFilesButton").click(function() {
            $("#uploadPhonesFiles").replaceWith($("#uploadPhonesFiles").clone(true));
            $("#uploadPhonesFiles").click();
        });

        $("#uploadUssdFiles").change(function() {
            if (this.files.length < 1) return;
            var file = this.files[0];
            uploader.uploadFile(file, "ussd");
        });

        $("#uploadPhonesFiles").change(function() {
            if (this.files.length < 1) return;
            var file = this.files[0];
            uploader.uploadFile(file, "phones");
        });
    });
});
