$(function(){
    $(document).ready(function() {
        $('#codes-list').DataTable({
            "dom": "t<'dt-toolbar-footer'<'col-xs-6'i><'col-xs-6'p>>",
            "processing": true,
            "ajax": {
                url: '/ussd-codes',
                dataSrc: ''
            },
            "columns": [{
                "data": "code"
            },{
                "data": "val"
            },{
                "data": "status"
            },{
                "data": "updated"
            }]
        });
        $('#simcards-list').DataTable({
            "dom": "t<'dt-toolbar-footer'<'col-xs-6'i><'col-xs-6'p>>",
            "processing": true,
            "ajax": {
                url: '/sim-cards',
                dataSrc: ''
            },
            "columns": [{
                "data": "num"
            },{
                "data": "val"
            },{
                "data": "in_val"
            }]
        });
    });
});
