test:
	./node_modules/.bin/mocha --reporter spec ./test/automated 2>&1 | bunyan -l 71 # hide debug logs

 .PHONY: test

