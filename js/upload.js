/**
 * upload.js
 *
 * handles large file uploading.
 */
'use strict';
'use strict';

//create global variable
var max_file_size_display = 0;
var adv_max_file_size_display = 0;
var default_action;
var default_url;
var blobSlice;
var requestFileSystem;
var up_plupload;
var msgProgLabel = document.createElement("label");
msgProgLabel.className = "pLabel";
var msgProgress = document.createElement("progress");
var msgProgressDiv = document.createElement("div");
msgProgressDiv.className = "progress";
msgProgressDiv.appendChild(msgProgLabel);
msgProgressDiv.appendChild(msgProgress);

//add setting to uploader
if (typeof wpUploaderInit === 'object')
	var plupload_defaults = wpUploaderInit;

if (typeof _wpPluploadSettings === 'object')
	var plupload_defaults = _wpPluploadSettings.defaults;

//This is to enable the ID3 tag reader for plupload files.
(function(ns) {
    ns["mOxieFileAPIReader"] = function(file) {
        return function(url, fncCallback, fncError) {
            var reader = new mOxie.FileReader();
            
            reader.onload = function(event) {
            	var base_pos = this.result.search(/;base64,/);
            	var result = this.result.slice(base_pos+8);
                var bin_file = new D(window.atob(result));  //D is BinaryFile in the src
                fncCallback(bin_file);
            };
            reader.readAsDataURL (file);
        }
    };
})(this);

var max_file_size = parseInt(plupload_defaults.max_file_size);
plupload_defaults.preinit = {
	PostInit: function(up) {
		var uploaddiv = jQuery('#plupload-upload-ui');
		if (uploaddiv.length != 0) {
			setResize( getUserSetting('upload_resize', false) );
	
			if ( up.features.dragdrop && ! jQuery(document.body).hasClass('mobile') ) {
				uploaddiv.addClass('drag-drop');
				jQuery('#drag-drop-area').bind('dragover.wp-uploader', function(){ // dragenter doesn't fire right :(
					uploaddiv.addClass('drag-over');
				}).bind('dragleave.wp-uploader, drop.wp-uploader', function(){
					uploaddiv.removeClass('drag-over');
				});
			} else {
				uploaddiv.removeClass('drag-drop');
				jQuery('#drag-drop-area').unbind('.wp-uploader');
			}
	
			if ( up.runtime == 'html4' )
				jQuery('.upload-flash-bypass').hide();
		}
		
		default_action = up.settings.multipart_params['action'];
		default_url = up.settings.url;
		up_plupload = up;
		jQuery('.drop-instructions').show();
		up.settings.drop_element[0].addEventListener('dragenter', function (e) {
			var dragdisplay = document.getElementsByClassName('uploader-window');
			if (dragdisplay.length>0) {
				dragdisplay[0].style.display = 'block';
				dragdisplay[0].style.opacity = 1;
				dragdisplay[0].addEventListener('dragleave', function (e) {
					dragdisplay[0].style.display = 'none';
					dragdisplay[0].style.opacity = 0;
				}, false);
				dragdisplay[0].addEventListener('drop', function (e) {
					dragdisplay[0].style.display = 'none';
					dragdisplay[0].style.opacity = 0;
				}, false);
			}
		}, false);

		//disable plupload image resize
		up.settings.resize = new Object;
		up.settings.resize.enabled = false;

		if (adv_uploader) {
			console.log(up);
			up.settings.chunk_size = max_file_size;
			up.settings.filters.max_file_size = adv_max_file_size;
		}
	},
	FilesAdded: function(up, files) {
		if (adv_uploader) {
			up.settings.url = ajaxurl;
			up.settings.multipart_params['destinations'] = JSON.stringify(destinations);
			up.settings.multipart_params['action'] = 'adv_upload_plupload';
			up.settings.multipart_params['security'] = security;

			if( typeof wpUploaderInit === 'object'  && typeof files[0].dest === 'undefined' ) {
				selectDestination (files, function () {
					up.trigger("FilesAdded", files);
				});
				return false;
			} else if (typeof files[0].dest === 'undefined' ) {
				for( var i=0; i<files.length; i++)
					files[i].dest = 0;
			}
		} else {
			up.settings.url = default_url;
			up.settings.max_retries = 0;
			delete up.settings.multipart_params['destinations'];
			up.settings.multipart_params['action'] = default_action;
			delete up.settings.multipart_params['security'];
		}
	},
	BeforeUpload: function(up, file) {
		if (adv_uploader) {
			up.settings.multipart_params['fileDest'] = file.dest;
			up.settings.multipart_params['album'] = file.album;
		}
	},
	FileUploaded: function( up, file, response ) {
		if (adv_uploader) {
			var uploadFileThumbs = function (dataURL, imageMeta, keys) {
				var fd = new FormData();
				fd.append('action', 'adv_file_upload_thumbs');
				fd.append('security', security);
				fd.append('filename', respObj.data.name);

				if (typeof _wpPluploadSettings === 'object')
					fd.append('post_id', wp.media.model.settings.post.id);
				fd.append('meta', JSON.stringify(imageMeta));
				fd.append('fileDest', file.dest);
				fd.append('album', file.album);
				fd.append('destinations', JSON.stringify(destinations));

				for (var index=0; index<keys.length; index++) {
					var key = keys[index];
					var binary = atob(dataURL[key].split(',')[1]);
					var array = [];
					for(var i = 0; i < binary.length; i++) {
						array.push(binary.charCodeAt(i));
					}
					
					var blob = new Blob([new Uint8Array(array)], {type: 'image/png'});
					fd.append('thumbs[]', blob, imageMeta[key].file);
				}
				
				//update display to show message
				var item = jQuery('#media-item-' + file.id);
				jQuery('.percent', item).html( 'Completing Upload' );
				
				//upload thumbs and add file to WP Libraray
				jQuery.ajax({	'type': "post",
						'url': ajaxurl,
						'data': fd,
						'enctype': 'multipart/form-data',
						'encoding': 'multipart/form-data',
						'cache': false,
						'processData': false,
						'contentType': false
				}).done(function (response) {
					if (typeof response === 'string' && response != '') {
						if (typeof _wpPluploadSettings === 'object')
							up.trigger("FileUploaded", file, {'response':response});
						else {
							try {
								var respObj = JSON.parse( response);
							} catch ( e ) {
								up.trigger("FileUploaded", file, {'response':'media-upload-error'});
								return;
							}
							
							//id only returned if add to Wordpress Library
							if( respObj.data.id == false ) {
								var id = respObj.data.id;
								jQuery('#media-item-' + file.id + ' .progress').remove();
								jQuery('#media-item-' + file.id + ' .original').remove();
								jQuery( '<img>' ).attr({
									src: respObj.data.url,
									class: 'pinkynail'
									}).appendTo( '#media-item-' + file.id );
								jQuery( '<div>' ).attr({
									class: 'filename new'
									}).html(respObj.data.name).appendTo( '#media-item-' + file.id );
							} else
								var id = respObj.data.id.toString();
							
							up.trigger("FileUploaded", file, {'response':id});
						}
					}
				});
			};

			try {
				var respObj = JSON.parse( response.response );
			} catch ( e ) {
				return;
			}

			if (respObj.success == 'file_complete') {
				//get file extension
				var ext = respObj.data.name.split('.').pop();

				//is image create thumbnail
				if(destinations[file.dest][4] &&  ext.match(/jpg|jpeg|png/i)) {
					//update display to show message
					var item = jQuery('#media-item-' + file.id);
					jQuery('.percent', item).html( 'Creating thumbs' );
					createThumbImage (file, respObj.data.name, uploadFileThumbs, respObj.data.file);
				//is pdf create thumbnail
				} else if(destinations[file.dest][4] &&  ext.match(/pdf/i)) {
					var item = jQuery('#media-item-' + file.id);
					jQuery('.percent', item).html( 'Creating thumbs' );
					pdf (respObj.data.file, respObj.data.name, uploadFileThumbs);
				} else
					uploadFileThumbs (null, null, new Array());

				return false;
			}
		};
	}
};

var registerLog = function (str, className) {
    jQuery('<div class="'+className+'">'+str+'</div>').appendTo('#log');
};

function toggle_loader (loader) {
	if (loader == 'default') {
		jQuery('#adv_upload').toggleClass('hidden', true);
		jQuery('#default_upload').toggleClass('hidden', false);
	} else {
		jQuery('#default_upload').toggleClass('hidden', true);
		jQuery('#adv_upload').toggleClass('hidden', false);
	}
	jQuery.ajax({'type' : "post",'url' : ajaxurl,'data' : {'action': "adv_file_upload_set_loader", 'loader': loader}});
}

//convert bytes to larges unit of wholenumbers
function convertBytes (num) {
	var units = 'Bytes';
	
	//convert to KBytes
	if ((num % 1024) == 0) {
		num = num / 1024;
		units = 'KB'
	}

	//convert to MBytes
	if (units == 'KB' && (num % 1024) == 0) {
		num  = num / 1024;
		units = 'MB'
	}

	//convert to GBytes
	if (units == 'MB' && (num % 1024) == 0) {
		num = num / 1024;
		units = 'GB'
	}
	
	return num  + units;
}

// do browser checks add listeners on document ready
jQuery(document).ready(function() {
	jQuery('.media-upload-form').on('click.uploader', function(e) {
		var target = jQuery(e.target);

		if ( target.is('.upload-flash-bypass a') || target.is('a.uploader-html') ) { // html4 uploader
			var max = jQuery('.max-upload-size').html();
			max = max.replace (adv_max_file_size_display, max_file_size_display);
			jQuery('.max-upload-size').html(max);
			jQuery('#adv_uploader_checkbox_p').hide();
		} else if ( target.is('.upload-html-bypass a') ) { // multi-file uploader
			jQuery('#adv_uploader_checkbox_p').show();
			if (adv_uploader) {
				var max = jQuery('.max-upload-size').html();
				max = max.replace (max_file_size_display, adv_max_file_size_display);
				jQuery('.max-upload-size').html(max);
			}
		}
	});

	//create checkbox for changing which uploader is used 
	if (adv_replace_default) {
		max_file_size_display = convertBytes (max_file_size);
		adv_max_file_size_display = convertBytes (adv_max_file_size);
		
		var checked = '';
		var max = max_file_size_display;
		if (adv_uploader) {
			checked = 'checked';
			max = adv_max_file_size_display;
		}
		
		var check_box = '<p id="adv_uploader_checkbox_p" style="cursor: pointer;">'
				+ '<input type="checkbox" id="adv_uploader_checkbox" style="margin-right: 5px;" '
				+ checked + '>Use advanced uploader</p>';
				
		var upload_js = document.getElementById('tmpl-uploader-inline');
		if (upload_js !== null) {
			var pPos = upload_js.innerHTML.lastIndexOf('</p>');
			var pattern = new RegExp(max_file_size_display,'i');
			var maxPos = upload_js.innerHTML.search(pattern);

			upload_js.innerHTML = upload_js.textContent.substring(0, maxPos)
				+ max + upload_js.innerHTML.substring(maxPos+max_file_size_display.length,pPos+4)
				+ check_box + upload_js.innerHTML.substring(pPos+4);
		}
		
		var upload = jQuery('.max-upload-size').html();
		if (typeof upload === 'string') {
			var pattern = new RegExp(max_file_size_display,'i');
			var maxPos = upload.search(pattern);
			jQuery('.max-upload-size').html(upload.substring(0, maxPos)
				+ max + upload.substring(maxPos+max_file_size_display.length))
				.after(check_box);
		}

		jQuery(document).on('click','#adv_uploader_checkbox_p',show_hide_uploader);
		jQuery(document).on('click','.media-menu-item',function (e) {
			if (e.target.textContent == 'Upload Files') 
				if ((!adv_uploader && jQuery('#adv_uploader_checkbox').attr('checked') == 'checked')
				    || (adv_uploader && jQuery('#adv_uploader_checkbox').attr('checked') == undefined))
					jQuery('#adv_uploader_checkbox_p').click();
		});
	}
});

function show_hide_uploader (e) {
	if (e.target.id.indexOf('adv_uploader_checkbox') == -1)
		return;

	if (e.target.type == 'checkbox')
		var adv_checkbox = e.target;
	else {
		var adv_checkbox = document.getElementById('adv_uploader_checkbox');
		if (adv_checkbox.checked) adv_checkbox.checked = false;
		else adv_checkbox.checked = true;
	}

	if (adv_checkbox.checked) {
		adv_uploader = true;
		up_plupload.settings.filters.max_file_size = adv_max_file_size;
		up_plupload.settings.chunk_size = max_file_size;			
		var max = jQuery('.max-upload-size').html();
		max = max.replace (max_file_size_display, adv_max_file_size_display);
		jQuery('.max-upload-size').html(max);
	} else {
		adv_uploader = false;
		up_plupload.settings.filters.max_file_size = max_file_size;
		up_plupload.settings.chunk_size = 0;			
		var max = jQuery('.max-upload-size').html();
		max = max.replace (adv_max_file_size_display, max_file_size_display);
		jQuery('.max-upload-size').html(max);
	}

	jQuery.ajax({'type' : "post",'url' : ajaxurl,'data' : {'action': "adv_file_upload_set_loader", 'loader': adv_uploader }});
}
				
var createThumbImage = function (file, name, callback, src) {
      var tempImg = new Image();
      tempImg.src = src;
      tempImg.onload = function() {
	    var tempW = tempImg.width;
	    var tempH = tempImg.height;
	    if (tempH > sizes['thumbnail']['height'] || tempW > sizes['thumbnail']['width']) {
	        var imageMeta = new Object();
	        var dataURL = new Object();
	        var keys = new Array();
	        var imageH = tempH;
	        var imageW = tempW;
	        var nameslist = '';

		for (var key in sizes) {
		    var tempH = imageH;
		    var tempW = imageW;
	            //get thumbnail size
	            var MAX_WIDTH = sizes[key]['width'];
	            var MAX_HEIGHT = sizes[key]['height'];

	            if (tempH > MAX_HEIGHT || tempW > MAX_WIDTH) {
		        if (tempW > imageH) {
		            if (tempW > MAX_WIDTH) {
		               tempH *= MAX_WIDTH / tempW;
		               tempW = MAX_WIDTH;
		            } 
		        } else {
		            if (tempH > MAX_HEIGHT) {
		               tempW *= MAX_HEIGHT / tempH;
		               tempH = MAX_HEIGHT;
		            }
		        }
		    
		        //round down image dimesions
		        tempW = Math.round(tempW);
		        tempH = Math.round(tempH);
		        
		        //set thumbnail filename
		        var filename = name.replace(/\.(jpg|jpeg|png)$/i, "-"+tempW+"x"+tempH+".png");
		        
		        if (nameslist.search(filename) == -1) {
		        	nameslist += filename + ';';
			        var canvas = document.createElement('canvas');
			        canvas.width = tempW;
			        canvas.height = tempH;
			        var ctx = canvas.getContext("2d");
			        ctx.drawImage(this, 0, 0, tempW, tempH);
	
			        keys.push(key);
			        dataURL[key] = canvas.toDataURL("image/png");
		        }
		        imageMeta[key] = new Object();
		        imageMeta[key].file = filename;
		        imageMeta[key].width = tempW;
		        imageMeta[key].height = tempH;
		    }
		}
	        callback (dataURL, imageMeta, keys);
	} else
	        callback (null, null, new Array());
    };
};

      
var pdf = function (file, name, callback) {
	//
	// Disable workers to avoid yet another cross-origin issue (workers need the URL of
	// the script to be loaded, and currently do not allow cross-origin scripts)
	//
	PDFJS.disableWorker = true;
	
	var pdfDoc = null;
	
	//
	// Get page info from document, resize canvas accordingly, and render page
	//
	function renderPage(num) {
		// Using promise to fetch the page
		pdfDoc.getPage(num).then(function(page) {
			var keys = new Array();
			for (var key in sizes)
				keys.push(key);
				
			createPDFthumb (page, '', keys, new Array(), new Object(), new Object());
		});
	}

	//
	// create thumbnail images
	//
	function createPDFthumb (page, nameslist, imageSizes, keys, imageMeta, dataURL) {
		var key = imageSizes.pop();
		var wScale = sizes[key]['width'] / page.getViewport(1.0).width;
		var hScale = sizes[key]['height'] / page.getViewport(1.0).height;
		var scale = wScale>hScale?hScale:wScale;
		var viewport = page.getViewport(scale);
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		canvas.height = viewport.height;
		canvas.width = viewport.width;
		
	        //set thumbnail filename
	        var filename = name+"-"+canvas.width+"x"+canvas.height+".png";

		imageMeta[key] = new Object();
		imageMeta[key].file = filename;
		imageMeta[key].width = canvas.width;
		imageMeta[key].height = canvas.height;
	        
	        if (nameslist.search(filename) == -1) {
	        	nameslist += filename + ';';
			// Render PDF page into canvas context
			var renderContext = {
				canvasContext: ctx,
				viewport: viewport
			};
	
			page.render(renderContext).then(function (){
				keys.push(key);
			        dataURL[key] = canvas.toDataURL("image/png");
				if (imageSizes.length > 0)
					createPDFthumb (page, nameslist, imageSizes, keys, imageMeta, dataURL);
				else {
					callback (dataURL, imageMeta, keys);
				}
			});
		} else {
			if (imageSizes.length > 0)
				createPDFthumb (page, nameslist, imageSizes, keys, imageMeta, dataURL);
			else {
				callback (dataURL, imageMeta, keys);
			}
		}
	}
	
	var parameters = {};
	// Read the local file into a Uint8Array.
	var fileReader = new FileReader();
	fileReader.onload = function webViewerChangeFileReaderOnload(evt) {
	    var buffer = evt.target.result;
	    parameters.data = new Uint8Array(buffer);
	    PDFJS.getDocument(parameters).then(function getPdfForm(_pdfDoc) {
		  pdfDoc = _pdfDoc;
		  renderPage(1);
  	    });
	};
	
	//fileReader.readAsArrayBuffer(file);		
	
	// Fetch the PDF document from the URL using promices
	PDFJS.getDocument(file).then(function getPdfForm(_pdfDoc) {
		  pdfDoc = _pdfDoc;
		  renderPage(1);
	});
};

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleDragEnter(evt) {
	evt.currentTarget.classList.add('drag-over');
}

function handleDragLeave(evt) {
	evt.currentTarget.classList.remove('drag-over');
}

function selectDestination (files, callback) {
	if (files.length == 0) {
	        return;
	}
    
	//destinations options
	var options = '<option value="">Select Destination</option>';
	var group = "";
	for (var i=0; i<destinations.length; i++) {
		if (group != destinations[i][2]) {
			if (group != "") {
				options += '</optgroup>'
			}
			options += '<optgroup label="' + destinations[i][2] + '">';
		}
		options += '<option value="' + i + '">' + destinations[i][0] + '</option>';
		group = destinations[i][2];
	}

	if (group != "") {
		options += '</optgroup>'
	}

	//category options
	var catOpt = '<option value="">Select category</option>';
	for (var i=0; i<categories.length; i++) {
		catOpt += '<option class="' + categories[i][2] + '" value="' + i + '">' + categories[i][1] + '</option>';
	}

	//content for popup
	if (files.length > 1)
		var content = '<p>Select destination for all files';
	else
		var content = '<p>Select destination for ' + files[0].name;
	content  += '<select id="dest">';
	content  += options;
	content  += '</select>';
	content  += '<span id="wg_" class="hide gallery_name"><input class="alignright" type=text />Gallery name: </span>';
	content  += '<select id="cat" class="hide">';
	content  += catOpt;
	content  += '</select>';
	content  += '</p>';
	if (files.length > 1) {
		content += '<div class="dashed"></div>';
		content += '<p>Or select destination for each file</p>';
		for (var i=0; i < files.length; i++) {
			content  += '<div class="option">' + files[i].name + '<select id="dest' + i + '" class="file" name="file' + i + '">';
			content  += options;
			content  += '</select>';
			content  += '<span id="wg_' + i + '" class="hide gallery_name"><input class="alignright" type=text />Gallery name:</span>';
			content  += '<select id="cat' + i + '" class="hide">';
			content  += catOpt;
			content  += '</select></div>';
		}
	}

	var dlg = jQuery("<div id='dest-popup' />")
	.html(content);
	
	var id3_tags = function (i) {
		var file = files[i].getSource();
		file.index = i;
		if( file.name.split('.').pop() == 'mp3' ) {
			ID3.loadTags(file.name, function() {
					var tags = ID3.getAllTags(file.name);
					files[file.index].album = tags.album;
					if( file.index<files.length-1 )
						id3_tags (file.index+1);
				}, {
				tags: ["album"],
				dataReader: mOxieFileAPIReader(file)
			});
		} else
			if( file.index<files.length-1 )
				id3_tags (file.index+1);
	};
	id3_tags (0);

	var select = function(e) {
		jQuery('#dest-popup .error').remove();
		var destall = jQuery('#dest :selected').val();
		var dests = jQuery('.file :selected');
		if( e.target.id == "dest" && destall.length == 0 )
			return false;
		else if (destall.length) {
			for (var i=0; i < files.length; i++)
				files[i].dest = destall;
			
			if( destinations[destall] && destinations[destall][2] == 'Category' ) {
				if( jQuery( "#adv_cat" ).val() == '' ) {
					jQuery( "<div>").attr({'id':'adv_err_cat','class':'clear alignright media-item error'})
						.html('You must enter an existing category')
						.insertAfter('#ac_cat');
					return false;
				}
				for (var i=0; i < files.length; i++)
					files[i].album = jQuery( "#adv_cat" ).val();
			} else if( destinations[destall] 
				&& destinations[destall][2] == 'Wordpress Gallery' 
				&& destinations[destall][3] == 'new' ) {
				if( jQuery( "#wg_ input" ).val() == '' ) {
					jQuery( "<div>").attr({'id':'adv_err_gal','class':'clear alignright media-item error'})
						.html('You must enter a name for the new gallery')
						.insertAfter('#wg_ input');
					return false;
				}
				jQuery.post(ajaxurl,
				{
					'action':'adv_file_upload_new_post',
					'security':security,
					'title':JSON.stringify(new Array(jQuery( "#wg_ input" ).val()))
				}, function( response ) {
					for (var i=0; i < files.length; i++)
						files[i].album = response[0].id;
					callback();
					dlg.dialog('close');
				}, "json");
				return false;
			}
			callback();
			dlg.dialog('close');
		} else if (dests.length) {
			var missingDest = false;
			var missingInfo = false;
			var newGalleries = new Object();
			for (var i=0; i < dests.length; i++) {
				var dest = dests[i].value;

				if (dest.length == 0) {
					jQuery( "<div>").attr({'class':'clear alignright media-item error'})
						.html('You must enter a destination')
						.insertAfter('#dest'+i);
					missingDest = true;
				} else {
					files[i].dest = dest;
					if( destinations[dest] && destinations[dest][2] == 'Category' ) {
						if( jQuery( "#adv_cat"+i ).val() == '' ) {
							jQuery( "<div>").attr({'id':'adv_err_cat'+i,'class':'clear alignright media-item error'})
								.html('You must enter an existing category')
								.insertAfter('#ac_cat'+i);
							missingInfo = true;
						}
						files[i].album = jQuery( "#adv_cat"+i ).val();
					} else if( destinations[dest] 
						&& destinations[dest][2] == 'Wordpress Gallery' 
						&& destinations[dest][3] == 'new' ) {
						if( jQuery( "#wg_"+i+" input" ).val() == '' ) {
							jQuery( "<div>").attr({'id':'adv_err_gal'+i,'class':'clear alignright media-item error'})
								.html('You must enter a name for the new gallery')
								.insertAfter('#wg_'+i+' input');
							missingInfo = true;
						}

						if( typeof newGalleries[jQuery( "#wg_"+i+" input" ).val()] === 'undefined')
							newGalleries[jQuery( "#wg_"+i+" input" ).val()] = i.toString();
						else
							newGalleries[jQuery( "#wg_"+i+" input" ).val()] += ',' + i.toString();
					} 
				}
			}
			
			if( missingDest ) {
				jQuery( "<div>").attr({'class':'clear alignright media-item error'})
					.html('You must enter a destination for all files')
					.insertAfter('#dest');
				return false;
			}
			if( missingInfo )
				return false;
				
			if( !jQuery.isEmptyObject( newGalleries ) ) {
				jQuery.post(ajaxurl,
				{
					'action':'adv_file_upload_new_post',
					'security':security,
					'title':JSON.stringify( Object.keys( newGalleries ) )
				}, function( response ) {
					for (var key in response) {
						var ids = newGalleries[response[key].title].split(",");
						for(var i = 0; i < ids.length; i++)
							files[ids[i]].album = response[key].id;
					}
					callback();
					dlg.dialog('close');
				}, "json");
				return false;
			} else {
				callback();
				dlg.dialog('close');
			}
		} else {
			jQuery( "<div>").attr({'class':'clear alignright media-item error'})
				.html('You must enter a destination')
				.insertAfter('#dest');
			return false;
		}
	};

	var addBoxCheck = function(e) {
		var id = e.target.id.match(/^dest(.*)/)[1];
		var catId = 'cat' + id;

		if( destinations[e.target.selectedIndex-1] && destinations[e.target.selectedIndex-1][2] == 'Category' ) {
   			jQuery( "#wg_" + id ).hide();
    			jQuery( "#adv_err_gal" + id ).remove();
			if( jQuery( "#ac_" + catId ).length == 0 ) {
    				jQuery( "#" + catId ).combobox({ desc: 'adv_' + catId, id: 'ac_' + catId });
		    		if (id == '')
					id = 0;
				if( files[id].album )
					jQuery( '#ac_' + catId + ' input' ).val(files[id].album);
    			} else
    				jQuery( "#ac_" + catId ).show();
		} else if( destinations[e.target.selectedIndex-1] 
			&& destinations[e.target.selectedIndex-1][2] == 'Wordpress Gallery' 
			&& destinations[e.target.selectedIndex-1][3] == 'new' ) {
    			jQuery( "#ac_" + catId ).hide();
    			jQuery( "#adv_err_" + catId ).remove();
   			jQuery( "#wg_" + id ).css( "display", "block");
		} else {
   			jQuery( "#wg_" + id ).hide();
    			jQuery( "#ac_" + catId ).hide();
    			jQuery( "#adv_err_" + catId ).remove();
    			jQuery( "#adv_err_gal" + id ).remove();
	  		if (id == '')
				select(e);
    		}
	};
	jQuery(document).on( 'change', '.ui-dialog select', addBoxCheck);

	dlg.dialog({
		'title' : 'Destination',
		'width' : 'auto',
		'modal' : true,
		'autoOpen' : false,
		'closeOnEscape' : true,
		'buttons' : [{
			'text' : 'Cancel',
			'class' : 'button-primary',
			'click' : function() {
				jQuery(this).dialog('close');
				}
		},{
			'text' : 'Select',
			'class' : 'button-primary',
			'click' : select
		}],
		'close' : function () {
			jQuery(document).off( 'change', '.ui-dialog select', addBoxCheck);
			jQuery('.ui-widget-overlay').remove();
			jQuery('.ui-dialog').remove();
			jQuery('.ui-autocomplete').remove();
		}});
	dlg.dialog('open');
}

(function( $ ) {
    $.widget( "custom.combobox", {
      _create: function() {
        this.wrapper = $( "<div>" )
          .addClass( "custom-combobox" )
          .attr('id', this.options.id)
          .insertAfter( this.element );
 
        this.element.hide();
        this._createAutocomplete();
        this._createShowAllButton();
      },
 
      _createAutocomplete: function() {
        var selected = this.element.children( ":selected" ),
          value = selected.val() ? selected.text() : "";
 
        this.input = $( "<input>" )
          .appendTo( this.wrapper )
          .attr('id', this.options.desc)
          .attr('name', this.options.desc)
          .val( value )
          .attr( "title", "" )
          .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-all" )
          .autocomplete({
            delay: 0,
            minLength: 0,
            source: $.proxy( this, "_source" )
          });
          
        this._on( this.input, {
          autocompleteselect: function( event, ui ) {
            ui.item.option.selected = true;
            this._trigger( "select", event, {
              item: ui.item.option
            });
          },
          autocompletechange: "_removeIfInvalid"
        });
      },
 
      _createShowAllButton: function() {
        var input = this.input,
          wasOpen = false;
 
        $( "<a>" )
          .attr( "tabIndex", -1 )
          .attr( "title", "Show All Items" )
          .height($('#'+this.options.desc).innerHeight()-6)
          .appendTo( this.wrapper )
          .button({
            icons: {
              primary: "ui-icon-triangle-1-s"
            },
            text: false
          })
          .removeClass( "ui-corner-all" )
          .addClass( "custom-combobox-toggle" )
          .mousedown(function() {
            wasOpen = input.autocomplete( "widget" ).is( ":visible" );
          })
          .click(function() {
            input.focus();
 
            // Close if already visible
            if ( wasOpen ) {
              return;
            }
 
            // Pass empty string as value to search for, displaying all results
            input.autocomplete( "search", "" );
          });
      },
 
      _source: function( request, response ) {
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        response( this.element.children( "option" ).map(function() {
          var text = $( this ).text();
          if ( this.value && ( !request.term || matcher.test(text) ) )
            return {
              label: text,
              value: text,
              option: this
            };
        }) );
      },
 
      _removeIfInvalid: function( event, ui ) {
 
        // Selected an item, nothing to do
        if ( ui.item ) {
          return;
        }
 
        // Search for a match (case-insensitive)
        var value = this.input.val(),
          valueLowerCase = value.toLowerCase(),
          valid = false;
        this.element.children( "option" ).each(function() {
          if ( $( this ).text().toLowerCase() === valueLowerCase ) {
            this.selected = valid = true;
            return false;
          }
        });
 
        // Found a match, nothing to do
        if ( valid ) {
          return;
        }
 
        // Remove invalid value
        this.input.val( "" );
        this.element.val( "" );
        this.input.data( "ui-autocomplete" ).term = "";
      },

      _destroy: function() {
        this.wrapper.remove();
        this.element.show();
      }
    });
  })( jQuery );