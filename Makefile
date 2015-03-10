.PHONY: build bundle watch minified jshint size

LICENSE = "/*! (C) Andrea Giammarchi */"

### (C) Andrea Giammarchi - WTFPL License

# default: lints the code and minifies it if everything is fine
build:
	make -s css
	make -s jshint
	make -s minified

# bundle: creates the browserified version of the project as js/bundle.max.js
bundle:
	sh utils/browserify.sh

css:
	cp src/css/*.css public/css

# watch: update the browserified version of the project as soon as file changes
watch:
	sh utils/watchify.sh

# minified: create the minifeid version of the project as js/bundle.js
minified:
	make -s bundle
	sh utils/uglifyjs.sh $(LICENSE)
	make -s size

# jshint: recursively checks for javascript files inside the src folder and lint them
jshint:
	sh utils/jshint.sh

# shows the resulting size before and after minifiaction
size:
	echo ""
	echo "[  bytes  ] < bundle.max.js"
	cat public/js/bundle.max.js | wc -c
	echo ""
	echo "[  bytes  ] < bundle.js"
	gzip -c public/js/bundle.js | wc -c
	echo ""
