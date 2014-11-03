test:
	./node_modules/.bin/mocha --reporter spec ./test/automated | bunyan -l 71 # hide debug logs

 .PHONY: test

