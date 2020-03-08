var http = require("http");
var https = require('https');
var url = require("url");
var fs = require("fs");
var path = require("path");
var proc = require('child_process');
var URL = url.URL;
var par = "";
var conf = [];
var not_raw_download = [".html",".txt",".htm"];

var readconf = function(config) {
	var content = fs.readFileSync(config);
	conf = JSON.parse(content);
};

function parseCookies (request) {
	var list = {};
	var rc = request.headers.cookie;
	rc && rc.split(';').forEach(function( cookie ) {
		var parts = cookie.split('=');
		list[parts.shift().trim()] = decodeURI(parts.join('='));
	});
	return list;
}

var get = function(url, headers, answ) {

	/* //new code, to be fixed
	if (headers == undefined) {headers = {};}
	var options = new URL(url);
	options.method = "POST";
	options.headers = headers;
	var protocol = options.protocol;
	*/

	var data = "";
	var tmp = url.split(":");
	var protocol = tmp[0];
	var hostnametmp = tmp[1].split("/");
	var hostname = hostnametmp[hostnametmp.length - 1];
	var porttmp = tmp[2].split("/");
	var port = porttmp[0];
	var path = tmp[2].split(port)[1];
	if (headers == undefined) {headers = {};}
	var options = {
		hostname: hostname,
		port: port,
		path: path,
		method: 'GET',
		headers: headers
	};
	if (protocol == "http"){
		var req = http.request(options, function(res) {
			data = [];
			//res.setEncoding('utf8');
			res.on('data', function(body) {
				data.push(body);
				//data = data+body;
			});
			res.on('end', function() {
				var buffer = Buffer.concat(data);
				answ(buffer);
				//answ(data);
			});
		});
		req.on('error', function(err) {
			if(err) {
				console.log(err);
			}
		});
		req.write("");
		req.end();
	}
	if (protocol == "https") {
		var reqs = https.request(options, function(res) {
			data = [];
			//res.setEncoding('utf8');
			res.on('data', function(body) {
				data.push(body);
				//data = data+body;
			});
			res.on('end', function() {
				var buffer = Buffer.concat(data);
				answ(buffer);
				//answ(data);
			});
		});
		reqs.on('error', function(err) {
			if(err) {
				console.log(err);
			}
		});
		reqs.write("");
		reqs.end();
	}
}

var post = function(url, stuff, headers, answ) {
	var data = "";
	var tmp = url.split(":");
	var protocol = tmp[0];
	var hostnametmp = tmp[1].split("/");
	var hostname = hostnametmp[hostnametmp.length - 1];
	var porttmp = tmp[2].split("/");
	var port = porttmp[0];
	var path = tmp[2].split(port)[1];
	if (headers == undefined) {headers = {};}
	var options = {
		hostname: hostname,
		port: port,
		path: path,
		method: 'POST',
		headers: headers
	};
	if (protocol == "http"){
		var req = http.request(options, function(res) {
			data = [];
			//res.setEncoding('utf8');
			res.on('data', function(body) {
				data.push(body);
				//data = data+body;
			});
			res.on('end', function() {
				var buffer = Buffer.concat(data);
				answ(buffer);
				//answ(data);
			});
		});
		req.on('error', function(err) {
			if(err) {
				console.log(err);
			}
		});
		req.write(stuff);
		req.end();
	}
	if (protocol == "https") {
		var reqs = https.request(options, function(res) {
			data = [];
			//res.setEncoding('utf8');
			res.on('data', function(body) {
				data.push(body);
				//data = data+body;
			});
			res.on('end', function() {
				var buffer = Buffer.concat(data);
				answ(buffer);
				//answ(data);
			});
		});
		reqs.on('error', function(err) {
			if(err) {
				console.log(err);
			}
		});
		reqs.write(stuff);
		reqs.end();
	}
};

var server = http.createServer(function(req, res) {
	if (process.argv.indexOf("--config") != -1) {
		readconf(process.argv[parseInt(process.argv.indexOf("--config"))+1]);
	} else if (process.argv.indexOf("-c") != -1) {
		readconf(process.argv[parseInt(process.argv.indexOf("-c"))+1]);
	} else {
		readconf("main.conf");
	}
	process.setgid("secureweb");
	process.setegid("secureweb");
	process.setuid("secureweb");
	process.seteuid("secureweb");
	var date = new Date();
	var hour = date.getHours();
	var minute = date.getMinutes();
	var second = date.getSeconds();
	var params = url.parse(req.url,true).pathname;
	var params2 = url.parse(req.url,true).query;
	var params3 = url.parse(req.url,true);
	headersts = {'Access-Control-Allow-Origin': '*'}
	if (params == "/") {par = "/index.html";headersts['content-type'] = "text/html";} else {par = params;}
	var dest = conf[req.headers.host.split(":")[0]];
	if (dest == undefined) {dest = conf["default"]}
	var ext = path.extname(par).toLowerCase();
	fs.appendFileSync("./log/log.txt", "[".concat(hour).concat(":").concat(minute).concat(":").concat(second).concat("] ").concat(req.connection.remoteAddress).concat(" : ").concat(req.method).concat(" : ").concat(req.headers.host).concat(req.url).concat("\n"));
	if (dest['nocache'] == true) {
		headersts['donotcache'] = true;
	}
	if (dest["type"] == "proxy") {
		if (req.method == "GET") {
			get(dest["location"].concat(params3.path), req.headers, function(answ){
				try {
					res.end(answ);
				} catch(err) {
					console.log(err);
				}
			});
		} else if (req.method == "POST") {
			//var data = "";
			var data = [];
			req.on('data', function(body){
				//data = data+body;
				data.push(body);
			});
			req.on('end', function(){
				var buffer = Buffer.concat(data);
				post(dest["location"].concat(params3.path), buffer, req.headers, function(answ){
					res.end(answ);
				});
			});
		} else {
			res.writeHead(405);
			res.end();
		}
	} else if (dest["type"] == "local") {
		fs.stat(dest["location"].concat(par), function(err, stats) {
			if (stats != undefined){
				if(stats.isDirectory()) {
					par = par + "/index.html";
				}
			}
			var exists = fs.existsSync(dest["location"].concat(par));
			if (exists == true) {exists = 1;} else {exists = 0;}
			if (exists == 1) {
				if (ext == ".sjs" && dest["nosjs"] != true) {
					//res.writeHead(200, headersts);
					if (req.method == "GET"){
						var parameters = {};
						try {parameters = url.parse(req.url,true).query} catch(err) {parameters = {}}
						var execopts = {
							maxBuffer: 100000000,
							env: {
								'PATH': process.env['PATH'],
								'COOKIES': req.headers.cookie
							}
						}
						var thing;
						for (thing in parameters) {
							execopts['env'][thing] = parameters[thing];
						}
						execopts['env']['METHOD'] = req.method;
						execopts['env']['PATH'] = process.env['PATH'];
						execopts['env']['PWD'] = dest['location'];
						execopts['env']['REQIP'] = req.connection.remoteAddress;
						execopts['env']['HEADERS'] = JSON.stringify(req.headers);
						var datats = "";
						var worker = proc.spawn("node", [dest["location"].concat(par)], execopts);
						worker.stdout.on('data', function(stdout) {
							if (stdout.includes("HEAD:")) {
								headersts[stdout.toString().split("HEAD:")[1].split(":")[0]] = stdout.toString().split("HEAD:")[1].split(":")[1].split("\n")[0];
							} else {
								datats = datats+stdout.toString();
							}
						});
						worker.on('close', function(code) {
							res.writeHead(200, headersts);
							res.write(datats);
							res.end();
						});
					} else if (req.method == "POST") {
						var data = "";
						req.on('data', function(body){
							data = data+body;
						});
						req.on('end', function(){
							var parameters = {};
							try {parameters = url.parse("?"+data,true).query;} catch(err) {parameters = {}}
							var execopts = {
								maxBuffer: 100000000,
								env: {
									'PATH': process.env['PATH'],
									'COOKIES': req.headers.cookie
								}
							}
							var thing;
							for (thing in parameters) {
								execopts['env'][thing] = parameters[thing];
							}
							execopts['env']['METHOD'] = req.method;
							execopts['env']['PATH'] = process.env['PATH'];
							execopts['env']['PWD'] = dest['location'];
							execopts['env']['REQIP'] = req.connection.remoteAddress;
							execopts['env']['HEADERS'] = JSON.stringify(req.headers);
							var datats = "";
							var worker = proc.spawn("node", [dest["location"].concat(par)], execopts);
							worker.stdout.on('data', function(stdout) {
								if (stdout.includes("HEAD:")) {
									headersts[stdout.toString().split("HEAD:")[1].split(":")[0]] = stdout.toString().split("HEAD:")[1].split(":")[1].split("\n")[0];
								} else {
									datats = datats+stdout.toString();
								}
							});
							worker.on('close', function(code) {
								res.writeHead(200, headersts);
								res.write(datats);
								res.end();
							});
						});
					}
				} else if (ext == ".jspt") {
					res.end("Under construction");
				} else if (ext == ".php" && dest["php_enabled"] != undefined) {
					if (req.method == "GET") {
						try {var parameters = req.url.split("?")[1].split("&").join(" ");} catch(err) {var parameters = ""}
						proc.exec("php " + dest["location"].concat(par) + ' "' + decodeURIComponent(parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"')).replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
							if (!err) {
								res.write(stdout);
								res.end();
							} else {
								console.log(err);
							}
						});
					} else if (req.method == "POST") {
						var data = "";
						req.on('data', function(body){
							data = data+body;
						});
						try {var parameters = data;} catch(err) {var parameters = ""}
						proc.exec("php " + dest["location"].concat(par) + ' "' + parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
							if (!err) {
								res.write(stdout);
								res.end();
							} else {
								console.log(err);
							}
						});
					}
				} else if (not_raw_download.indexOf(ext) == -1) {
					res.writeHead(200, headersts);
					fs.createReadStream(dest["location"].concat(par)).pipe(res);
				} else {
					res.writeHead(200, headersts);
					fs.createReadStream(dest["location"].concat(par), {encoding: "utf8"}).pipe(res);
				}
			} else if (exists == 0) {
				var exists2 = fs.existsSync(dest["location"].concat("/404.html"));
				if (exists2) {
					res.writeHead(404, headersts);
					fs.createReadStream(dest["location"].concat("/404.html"), {encoding: "utf8"}).pipe(res);
				} else {
					res.writeHead(404, headersts);
					res.write("<!DOCTYPE html><html><head><title>Error 404. File not found!</title></head><body><h1>ERROR 404</h1>File ");
					res.write(par);
					res.write(" not found.<br/>------------------------<br/>JoshieHTTP/3.0.4_Linux<body></html>");
					res.end();
				}
			} else if (exists == 2) {
				res.writeHead(403, headersts);
				res.end("Access denied!");
			} else {
				var exists2 = fs.existsSync(dest["location"].concat("/500.html"));
				if (exists2) {
					fs.createReadStream(dest["location"].concat("/500.html"), {encoding: "utf8"}).pipe(res);
				} else {
					res.end("Error 500: internal server error");
				}
			}
		});
	}
});

if (process.argv.indexOf("--https") != -1 || process.argv.indexOf("-s") != -1) {
	if (process.argv.indexOf("--config") != -1) {
		readconf(process.argv[parseInt(process.argv.indexOf("--config"))+1]);
	} else if (process.argv.indexOf("-c") != -1) {
		readconf(process.argv[parseInt(process.argv.indexOf("-c"))+1]);
	} else {
		readconf("main.conf");
	}
	var options = {
		key: fs.readFileSync('ssl/key.pem'),
		cert: fs.readFileSync('ssl/cert.pem')
	};
	var sserver = https.createServer(options, function(req, res) {
		process.setgid("secureweb");
		process.setegid("secureweb");
		process.setuid("secureweb");
		process.seteuid("secureweb");
		var date = new Date();
		var hour = date.getHours();
		var minute = date.getMinutes();
		var second = date.getSeconds();
		var params = url.parse(req.url,true).pathname;
		var params2 = url.parse(req.url,true).query;
		var params3 = url.parse(req.url,true);
		headersts = {'Access-Control-Allow-Origin': '*'}
		if (params == "/") {par = "/index.html";headersts['content-type'] = "text/html";} else {par = params;}
		var dest = conf[req.headers.host.split(":")[0]];
		if (dest == undefined) {dest = conf["default"]}
		var ext = path.extname(par).toLowerCase();
		fs.appendFileSync("./log/log.txt", "[".concat(hour).concat(":").concat(minute).concat(":").concat(second).concat("] ").concat(req.connection.remoteAddress).concat(" : ").concat(req.method).concat(" : ").concat(req.headers.host).concat(req.url).concat("\n"));
		if (dest['nocache'] == true) {
			headersts['donotcache'] = true;
		}
		if (dest["type"] == "proxy") {
			if (req.method == "GET") {
				get(dest["location"].concat(params3.path), req.headers, function(answ){
					try {
						res.end(answ);
					} catch(err) {
						console.log(err);
					}
				});
			} else if (req.method == "POST") {
				//var data = "";
				var data = [];
				req.on('data', function(body){
					//data = data+body;
					data.push(body);
				});
				req.on('end', function(){
					var buffer = Buffer.concat(data);
					post(dest["location"].concat(params3.path), buffer, req.headers, function(answ){
						res.end(answ);
					});
				});
			} else {
				res.writeHead(405);
				res.end();
			}
		} else if (dest["type"] == "local") {
			fs.stat(dest["location"].concat(par), function(err, stats) {
				if (stats != undefined){
					if(stats.isDirectory()) {
						par = par + "/index.html";
					}
				}
				var exists = fs.existsSync(dest["location"].concat(par));
				if (exists == true) {exists = 1;} else {exists = 0;}
				if (exists == 1) {
					if (ext == ".sjs" && dest["nosjs"] != true) {
						//res.writeHead(200, headersts);
						if (req.method == "GET"){
							var parameters = {};
							try {parameters = url.parse(req.url,true).query} catch(err) {parameters = {}}
							var execopts = {
								maxBuffer: 100000000,
								env: {
									'PATH': process.env['PATH'],
									'COOKIES': req.headers.cookie
								}
							}
							var thing;
							for (thing in parameters) {
								execopts['env'][thing] = parameters[thing];
							}
							execopts['env']['METHOD'] = req.method;
							execopts['env']['PATH'] = process.env['PATH'];
							execopts['env']['PWD'] = dest['location'];
							execopts['env']['REQIP'] = req.connection.remoteAddress;
							execopts['env']['HEADERS'] = JSON.stringify(req.headers);
							var datats = "";
							var worker = proc.spawn("node", [dest["location"].concat(par)], execopts);
							worker.stdout.on('data', function(stdout) {
								if (stdout.includes("HEAD:")) {
									headersts[stdout.toString().split("HEAD:")[1].split(":")[0]] = stdout.toString().split("HEAD:")[1].split(":")[1].split("\n")[0];
								} else {
									datats = datats+stdout.toString();
								}
							});
							worker.on('close', function(code) {
								res.writeHead(200, headersts);
								res.write(datats);
								res.end();
							});
						} else if (req.method == "POST") {
							var data = "";
							req.on('data', function(body){
								data = data+body;
							});
							req.on('end', function(){
								var parameters = {};
								try {parameters = url.parse("?"+data,true).query;} catch(err) {parameters = {}}
								var execopts = {
									maxBuffer: 100000000,
									env: {
										'PATH': process.env['PATH'],
										'COOKIES': req.headers.cookie
									}
								}
								var thing;
								for (thing in parameters) {
									execopts['env'][thing] = parameters[thing];
								}
								execopts['env']['METHOD'] = req.method;
								execopts['env']['PATH'] = process.env['PATH'];
								execopts['env']['PWD'] = dest['location'];
								execopts['env']['REQIP'] = req.connection.remoteAddress;
								execopts['env']['HEADERS'] = JSON.stringify(req.headers);
								var datats = "";
								var worker = proc.spawn("node", [dest["location"].concat(par)], execopts);
								worker.stdout.on('data', function(stdout) {
									if (stdout.includes("HEAD:")) {
										headersts[stdout.toString().split("HEAD:")[1].split(":")[0]] = stdout.toString().split("HEAD:")[1].split(":")[1].split("\n")[0];
									} else {
										datats = datats+stdout.toString();
									}
								});
								worker.on('close', function(code) {
									res.writeHead(200, headersts);
									res.write(datats);
									res.end();
								});
							});
						}
					} else if (ext == ".jspt") {
						res.end("Under construction");
					} else if (ext == ".php" && dest["php_enabled"] != undefined) {
						if (req.method == "GET") {
							try {var parameters = req.url.split("?")[1].split("&").join(" ");} catch(err) {var parameters = ""}
							proc.exec("php " + dest["location"].concat(par) + ' "' + decodeURIComponent(parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"')).replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
								if (!err) {
									res.write(stdout);
									res.end();
								} else {
									console.log(err);
								}
							});
						} else if (req.method == "POST") {
							var data = "";
							req.on('data', function(body){
								data = data+body;
							});
							try {var parameters = data;} catch(err) {var parameters = ""}
							proc.exec("php " + dest["location"].concat(par) + ' "' + parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
								if (!err) {
									res.write(stdout);
									res.end();
								} else {
									console.log(err);
								}
							});
						}
					} else if (not_raw_download.indexOf(ext) == -1) {
						res.writeHead(200, headersts);
						fs.createReadStream(dest["location"].concat(par)).pipe(res);
					} else {
						res.writeHead(200, headersts);
						fs.createReadStream(dest["location"].concat(par), {encoding: "utf8"}).pipe(res);
					}
				} else if (exists == 0) {
					var exists2 = fs.existsSync(dest["location"].concat("/404.html"));
					if (exists2) {
						res.writeHead(404, headersts);
						fs.createReadStream(dest["location"].concat("/404.html"), {encoding: "utf8"}).pipe(res);
					} else {
						res.writeHead(404, headersts);
						res.write("<!DOCTYPE html><html><head><title>Error 404. File not found!</title></head><body><h1>ERROR 404</h1>File ");
						res.write(par);
						res.write(" not found.<br/>------------------------<br/>JoshieHTTP/3.0.4_Linux<body></html>");
						res.end();
					}
				} else if (exists == 2) {
					res.writeHead(403, headersts);
					res.end("Access denied!");
				} else {
					var exists2 = fs.existsSync(dest["location"].concat("/500.html"));
					if (exists2) {
						fs.createReadStream(dest["location"].concat("/500.html"), {encoding: "utf8"}).pipe(res);
					} else {
						res.end("Error 500: internal server error");
					}
				}
			});
		}
	});
	if (process.argv.indexOf("--https") != -1) {
		sserver.listen(process.argv[parseInt(process.argv.indexOf("--https"))+1]);
	} else if (process.argv.indexOf("-s") != -1) {
		sserver.listen(process.argv[parseInt(process.argv.indexOf("-s"))+1]);
	}
}

if (process.argv.indexOf("--listen") != -1) {
	server.listen(process.argv[parseInt(process.argv.indexOf("--listen"))+1]);
} else if (process.argv.indexOf("-l") != -1) {
	server.listen(process.argv[parseInt(process.argv.indexOf("-l"))+1]);
} else {
	server.listen(8080);
}
if (process.argv.indexOf("--config") != -1) {
	readconf(process.argv[parseInt(process.argv.indexOf("--config"))+1]);
} else if (process.argv.indexOf("-c") != -1) {
	readconf(process.argv[parseInt(process.argv.indexOf("-c"))+1]);
} else {
	readconf("main.conf");
}

console.log("Started JoshieHTTPD/3.0.4_Linux");
