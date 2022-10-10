# WebDAV Manager, a lightweight JS WebDAV client

This is drop-in JS client that you can use to enhance the web interface of a WebDAV file server. Or you can use it on your computer to access any WebDAV server without installing anything.

## Features

* Create new directories
* Create and edit text file
* Delete files and directories
* Rename and move files and directories
* Upload files directly from browser
* Upload files using copy and paste!
* Upload files with drag and drop
* Preview of images, text, videos, audio, MarkDown and PDF
* MarkDown live preview when editing MarkDown files
* Download files
* Localization support

### Planned features

* [Resumable upload via TUS](https://tus.io/protocols/resumable-upload.html)

## Compatibility

This has been tested with:

* [KaraDAV](https://github.com/kd2org/karadav/)
* Apache 2.4 mod_dav

## Demo

## Install as the client for your WebDAV server

Just copy the `webdav.js`, `webdav.css` and `index.html` files to the root of your web server.

Edit the `index.html` file and change `data-webdav-url="/dav/"` to the actual web path of your WebDAV server. For example with ownCloud this might be `data-webdav-url="/owncloud/remote.php/webdav/"`.

### With Apache

Follow a [tutorial to setup WebDAV in your Apache](https://www.digitalocean.com/community/tutorials/how-to-configure-webdav-access-with-apache-on-ubuntu-18-04) and change the virtual host to something like that:

```
<VirtualHost *:80>
	ServerName webdav.localhost
	DocumentRoot /home/web/webdav-manager.js
	DAVLockDB /home/web/davlock.db

	# Actually store files in /home/web/data
	Alias /dav /home/web/data

	<Location />
		AuthType Basic
		AuthName "webdav"
		AuthUserFile /home/web/users.htpasswd
		Require valid-user
	</Location>
</VirtualHost>

<Directory /home/web/data>
	# Disable handlers
	<FilesMatch ".+\.*$">
		SetHandler !
	</FilesMatch>

	# Disable PHP
	<IfModule mod_php.c>
		php_flag engine off
	</IfModule>

	DAV On

	# Magic: use WebDAV manager for directory listings
	RewriteEngine On
	RewriteCond %{REQUEST_METHOD} GET
	RewriteRule .*\/$|^$ /
</Directory>
```

## Install as a local client

Just copy the `webdav.js`, `webdav.css` and `demo.html` pages to a directory on your computer, open `demo.html` with a web browser, then fill-in the server URL, user login and password, and you'll be connected :)

### CORS

For the client to work in this mode, your WebDAV server MUST set the following HTTP headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Authorization, *
Access-Control-Allow-Methods: GET,HEAD,PUT,DELETE,COPY,MOVE,PROPFIND,MKCOL,LOCK,UNLOCK
```

If your server doesn't set these headers, you won't be able to use this client, this is a security limitation of web browsers.

## License

This software is available as:

* GNU Affero GPL v3 (this repo)
* A commercial license to include in proprietary products

Contact us :)

## Authors

* BohwaZ <https://bohwaz.net/> 2022