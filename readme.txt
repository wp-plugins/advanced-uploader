=== Advanced uploader ===
Contributors: ojredmond
Tags: upload, thumbnail
Requires at least: 3.5
Tested up to: 4.0
Stable tag: 1.10
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

A replacement file uploader which can upload large files even on shared host and creates thumbnails in the browser, including for pdf.

== Description ==

This Plugins extends the functionality provided by wordpress by enabling the following features.

* Upload large file by chunking them up,  this is use on shared hosts with http upload limit.
* Multiple upload directories.
* Creates thumbnails in browser instead of server.  This is to avoid memory limits on shared hosts.
* Creates thumbnails for PDF files using PDF.js.
* Add files straight to Wordpress Gallery.
* Add files straight to BWS Gallery.
* Select Category for files before uploading.  Will read MP3 tags to guess category. Can exclude categories from list e.g. Uncategorized.
* Can replace the Default uploader.

The settings for this plugin are in Media Settings page.

This plugin requires a modern browser, e.g. IE8 will not work.

This plugin uses code from the following sources
* Plupload - multi-runtime File Uploader - v2.1.1 - Copyright 2013, Moxiecode Systems AB.  This is the software wordpress use for uploading, just using a newer version for extra features.
* PDF.JS - Copyright 2012 Mozilla Foundation - v0.8.377 - This is to create the PDF thumbnails.

== Installation ==

This section describes how to install the plugin and get it working.

1. Upload `advanced-file-uploader` to the `/wp-content/plugins/` directory
1. Activate the plugin through the 'Plugins' menu in WordPress
1. Go to Settings -> Media to configure

== Frequently Asked Questions ==

= How do i configure this plugin =

Go to Settings -> Media to configure.

== Screenshots ==

1. This screen shot is for the settings page
2. This screen shot is for the destination selection page

== Changelog ==
= 1.10 =
* fixed display issue with max upload file size for wordpress 4.0, format of size had changed.
= 1.9 =
* Made code more robost to allow to work on stricter php installations
* moved wp_register_script to admin_enqueue_scripts instead of admin_init
= 1.8 =
* fixed typo with missing $ in front of vairable name
= 1.7 =
* fixed bug with different server/php setting by making sure directory separator is present between dirctory and file name
= 1.6 =
* fixed bug with Firefox that caused a problem for some images to not upload the thumbnails
= 1.5 =
* fixed bug to allow add to library to work for non-default directory
= 1.4 =
* removed special character form pdf thumbnails in media libraray as it was causing errors
* add heading above thumbnail selection
= 1.3 =
* updated upload script to allow large uploads from editor
= 1.2 =
* fixed javascript bugs in 3.9
* removed replacing of plupload as use the same version.
= 1.1 =
* fixed dependance bug by adding jquery ui dialog dependance to upload script
= 1.0 =
* First version uploaded to wordpress library.

== Upgrade Notice ==
= 1.10 = fixed display issue with max upload file size for wordpress 4.0, format of size had changed.
= 1.9 = Made code more robost to allow to work on stricter php installations and removed some wordpress notices
= 1.8 = fixed typo with missing $ in front of vairable name
= 1.7 = fixed bug with different server/php setting by making sure directory separator is present between dirctory and file name
= 1.6 = fixed bug with Firefox that caused a problem for some images to not upload the thumbnails
= 1.5 = fixed bug to allow add to library to work for non-default directory
= 1.4 = fixed pdf thumbnail selection & add heading above thumbnail selection
= 1.3 = updated to allow large uploads from editor
= 1.2 = updated to work with wordpress 3.9
= 1.1 = fixed bug that stopped plugin working when not replacing default
= 1.0 = Readme file added.
