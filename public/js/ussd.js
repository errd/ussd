$(function(){
    $(document).ready(function() {
        $('#codes-list').DataTable({
            "dom": "t<'dt-toolbar-footer'<'col-xs-6'i><'col-xs-6'p>>",
            "processing": true,
            "ajax": {
                url: '/codes',
                dataSrc: ''
            },
            "columns": [{
                "data": "code",
            },{
                "data": "val"
            },{
                "data": "status"
            },{
                "data": "updated"
            }]
        });

    });
});
