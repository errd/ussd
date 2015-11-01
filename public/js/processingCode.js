$(function(){
    $(document).ready(function()
    {
        $("#processing").click(function() {
            $.ajax({
                url: '/processing-code',
                cache: false,
                contentType: false,
                processData: false,
                type: 'GET',
                success: function (response) {
                    if (response.status == 'ok') {
                        console.log(response.text);
                    }
                    else {
                        console.log(response.errors);
                    }
                }
            });
        });

    });
});