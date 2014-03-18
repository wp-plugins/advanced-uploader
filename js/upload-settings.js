/**
 * upload-settings.js
 *
 * handles settings for Advanced uploader.
 */

function removeButton (button) {
	num = button.id.match(/del_dest_(.*)/)[1];
	
	jQuery('#adv_file_upload_destination_'+num).remove();
}

function addButton (button) {
	index_field = jQuery('#index');
	var index = index_field.val();
	jQuery('<div/>',{
		id:'adv_file_upload_destination_'+index,
		style:'overflow:hidden;'
		}).appendTo('#adv_file_upload_destinations');
	jQuery('<input/>',{
		id:'adv_file_upload_destination_label_'+index,
		name:'adv_file_upload_destination['+index+'][label]',
		type:'text',
		style:'float:left;width:135px;'
		}).appendTo('#adv_file_upload_destination_'+index);
	jQuery('<input/>',{
		id:'adv_file_upload_destination_destination_'+index,
		name:'adv_file_upload_destination['+index+'][dest]',
		type:'text',
		style:'float:left;width:285px;'
		}).appendTo('#adv_file_upload_destination_'+index);
	jQuery('<input/>',{
		id:'adv_file_upload_destination_library_'+index,
		name:'adv_file_upload_destination['+index+'][library]',
		type:'checkbox',
		value:'1',
		style:'float:left;margin:5px;'
		}).appendTo('#adv_file_upload_destination_'+index);
	jQuery('<input/>',{
		id:'del_dest_'+index,
		name:'del_dest',
		type:'button',
		style:'width:2.5em;float:right;',
		class:'button button-primary',
		value:'-',
		onClick:'removeButton(this)'
		}).appendTo('#adv_file_upload_destination_'+index);
	index++;
	index_field.val(index);
}