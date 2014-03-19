=== Advanced uploader ===
Contributors: ojredmond
Tags: upload, thumbnail
Requires at least: 3.5
Tested up to: 3.8.1
Stable tag: 1.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

A replacement file uploader which can upload large files even on shared host and creates thumbnails in the browser including for pdf.

== Description ==

This Plugins extends the functionality provided by wordpress by enabling the following features.

* Upload large file by chunk them up,  this is use on shared hosts with http upload limit.
* Multiple upload directories.
* Creates thumbnails in browser instead of server.  This is to avoid memory limits on shared hosts.
* Creates thumbnails for PDF files using PDF.js.
* Add files straight to Wordpress Gallery.
* Add files straight to BWS Gallery.
* Select Category for files before uploading.  Will read MP3 tags to guess category. Can exclude categories from list e.g. Uncategorized.
* Can replace Default uploader.

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

1. This screen shot is for the settings page /assets/advanced-uploader - settings.png
2. This screen shot is for the destination selection page /assets/advanced-uploader - dest.png

== Changelog ==

= 1.0 =
* First version uploaded to wordpress library.

== Upgrade Notice ==

= 1.0 =
Readme file added.
