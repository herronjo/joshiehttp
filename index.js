var http = require("http");
var https = require('https');
var url = require("url");
var fs = require("fs-extra");
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
	var data = "";
	var tmp = url.split(":");
	var protocol = tmp[0];
	var options = new URL(url);
	if (headers == undefined) {headers = {};}
	options.headers = headers;
	if (protocol == "http"){
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function(body) {
				data = data+body;
			});
			res.on('end', function() {
				answ(data);
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
			res.setEncoding('utf8');
			res.on('data', function(body) {
				data = data+body;
			});
			res.on('end', function() {
				answ(data);
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
	var options = new URL(url);
	if (headers == undefined) {headers = {};}
	options.headers = headers;
	if (protocol == "http"){
		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function(body) {
				data = data+body;
			});
			res.on('end', function() {
				answ(data);
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
			res.setEncoding('utf8');
			res.on('data', function(body) {
				data = data+body;
			});
			res.on('end', function() {
				answ(data);
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
	if (params == "/") par = "/index.html"; else par = params;
	var dest = conf[req.headers.host.split(":")[0]];
	if (dest == undefined) {dest = conf["default"]}
	var ext = path.extname(par).toLowerCase();
	fs.appendFileSync("./log/log.txt", "[".concat(hour).concat(":").concat(minute).concat(":").concat(second).concat("] ").concat(req.connection.remoteAddress).concat(" : ").concat(req.method).concat(" : ").concat(req.headers.host).concat(req.url).concat("\n"));
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
			var data = "";
			req.on('data', function(body){
				data = data+body;
			});
			req.on('end', function(){
				post(dest["location"].concat(params3.path), data, req.headers, function(answ){
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
				if (ext == ".sjs") {
					res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
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
						execopts['env']['PATH'] = process.env['PATH'];
						execopts['env']['PWD'] = dest['location'];
						execopts['env']['REQIP'] = req.connection.remoteAddress;
						execopts['env']['HEADERS'] = JSON.stringify(req.headers);
						proc.exec("node " + dest["location"].concat(par), execopts, function(err, stdout, stderr) {
							if (!err) {
								res.write(stdout);
							} else {
								console.log(err);
							}
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
							execopts['env']['PATH'] = process.env['PATH'];
							execopts['env']['PWD'] = dest['location'];
							execopts['env']['REQIP'] = req.connection.remoteAddress;
							execopts['env']['HEADERS'] = JSON.stringify(req.headers);
							proc.exec("node " + dest["location"].concat(par), execopts, function(err, stdout, stderr) {
								if (!err) {
									res.write(stdout);
								} else {
									console.log(err);
								}
								res.end();
							});
						});
					}
				} else if (ext == ".jspt") {
					res.end("Under construction");
				} else if (ext == ".php" && dest["php_enabled"] != undefined) {
					if (req.method == "GET") {
						try {var parameters = req.url.split("?")[1].split("&").join(" ");} catch(err) {var parameters = ""}
						proc.exec("php " + dest["location"].concat(par) + ' "' + decodeURIComponent(parameters.replace(/Ã¯Â¿Â½/g, "'").replace(/Ã¯Â¿Â½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"')).replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
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
						proc.exec("php " + dest["location"].concat(par) + ' "' + parameters.replace(/Ã¯Â¿Â½/g, "'").replace(/Ã¯Â¿Â½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
							if (!err) {
								res.write(stdout);
								res.end();
							} else {
								console.log(err);
							}
						});	
					}  
				} else if (not_raw_download.indexOf(ext) == -1) {
					res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
					var stats = fs.statSync(dest["location"].concat(par));
					fs.open(dest["location"].concat(par), 'r', function(status, fd) {
						if (status) {console.log(status.message); return;}
						var buffer = new Buffer(stats.size);
						fs.read(fd, buffer, 0, stats.size, 0, function(err, num) {
							res.write(buffer);
							if(num == stats.size) {res.end();};
						});
					});
				} else {
					res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
					var data = fs.readFileSync(dest["location"].concat(par), 'utf8');
					res.end(data);
				}
			} else if (exists == 0) {
				var exists2 = fs.existsSync(dest["location"].concat("/404.html"));
				if (exists2) {
					res.writeHead(404);
					var data2 = fs.readFileSync(dest["location"].concat("/404.html"), 'utf8');
					res.end(data2);
				} else {
					res.writeHead(404);
					res.write("<!DOCTYPE html><html><head><title>Error 404. File not found!</title></head><body><h1>ERROR 404</h1>File ");
					res.write(par);
					res.write(" not found.<br/>------------------------<br/>JoshieHTTP/3.0.3_Linux<body></html>");
					res.end();
				}
			} else if (exists == 2) {
				res.writeHead(403);
				res.end("Access denied!");
			} else {
				var exists2 = fs.existsSync(dest["location"].concat("/500.html"));
				if (exists2) {
					var data2 = fs.readFileSync(dest["location"].concat("/500.html"), 'utf8');
					res.end(data2);
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
		if (params == "/") par = "/index.html"; else par = params;
		var dest = conf[req.headers.host.split(":")[0]];
		if (dest == undefined) {dest = conf["default"]}
		var ext = path.extname(par).toLowerCase();
		fs.appendFileSync("./log/log.txt", "[".concat(hour).concat(":").concat(minute).concat(":").concat(second).concat("] ").concat(req.connection.remoteAddress).concat(" : ").concat(req.method).concat(" : ").concat(req.headers.host).concat(req.url).concat("\n"));
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
				var data = "";
				req.on('data', function(body){
					data = data+body;
				});
				req.on('end', function(){
					post(dest["location"], data, req.headers, function(answ){
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
					if (ext == ".sjs") {
						res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
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
							execopts['env']['PATH'] = process.env['PATH'];
							execopts['env']['PWD'] = dest['location'];
							execopts['env']['REQIP'] = req.connection.remoteAddress;
							execopts['env']['HEADERS'] = JSON.stringify(req.headers);
							proc.exec("node " + dest["location"].concat(par), execopts, function(err, stdout, stderr) {
								if (!err) {
									res.write(stdout);
								} else {
									console.log(err);
								}
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
								execopts['env']['PATH'] = process.env['PATH'];
								execopts['env']['PWD'] = dest['location'];
								execopts['env']['REQIP'] = req.connection.remoteAddress;
								execopts['env']['HEADERS'] = JSON.stringify(req.headers);
								proc.exec("node " + dest["location"].concat(par), execopts, function(err, stdout, stderr) {
									if (!err) {
										res.write(stdout);
									} else {
										console.log(err);
									}
									res.end();
								});
							});
						}
					} else if (ext == ".jspt") {
						res.end("Under construction");
					} else if (ext == ".php" && dest["php_enabled"] != undefined) {
						if (req.method == "GET") {
							try {var parameters = req.url.split("?")[1].split("&").join(" ");} catch(err) {var parameters = ""}
							proc.exec("php " + dest["location"].concat(par) + ' "' + decodeURIComponent(parameters.replace(/Ã¯Â¿Â½/g, "'").replace(/Ã¯Â¿Â½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"')).replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
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
							proc.exec("php " + dest["location"].concat(par) + ' "' + parameters.replace(/Ã¯Â¿Â½/g, "'").replace(/Ã¯Â¿Â½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
								if (!err) {
									res.write(stdout);
									res.end();
								} else {
									console.log(err);
								}
							});	
						}  
					} else if (not_raw_download.indexOf(ext) == -1) {
						res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
						var stats = fs.statSync(dest["location"].concat(par));
						fs.open(dest["location"].concat(par), 'r', function(status, fd) {
							if (status) {console.log(status.message); return;}
							var buffer = new Buffer(stats.size);
							fs.read(fd, buffer, 0, stats.size, 0, function(err, num) {
								res.write(buffer);
								if(num == stats.size) {res.end();};
							});
						});
					} else {
						res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
						var data = fs.readFileSync(dest["location"].concat(par), 'utf8');
						res.end(data);
					}
				} else if (exists == 0) {
					var exists2 = fs.existsSync(dest["location"].concat("/404.html"));
					if (exists2) {
						res.writeHead(404);
						var data2 = fs.readFileSync(dest["location"].concat("/404.html"), 'utf8');
						res.end(data2);
					} else {
						res.writeHead(404);
						res.write("<!DOCTYPE html><html><head><title>Error 404. File not found!</title></head><body><h1>ERROR 404</h1>File ");
						res.write(par);
						res.write(" not found.<br/>------------------------<br/>JoshieHTTP/3.0.3_Linux<body></html>");
						res.end();
					}
				} else if (exists == 2) {
					res.writeHead(403);
					res.end("Access denied!");
				} else {
					var exists2 = fs.existsSync(dest["location"].concat("/500.html"));
					if (exists2) {
						var data2 = fs.readFileSync(dest["location"].concat("/500.html"), 'utf8');
						res.end(data2);
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

console.log("Started JoshieHTTPD/3.0.3_Linux");
