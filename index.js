var http = require("http");
var https = require('https');
var url = require("url");
var fs = require("fs");
var path = require("path");
var proc = require('child_process');
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

var get = function(url, answ) {
    var data = "";
    if (url != undefined) {
        if (url.charAt(4) == "s") {
            try{
                https.get(url, function(response) {
                    response.setEncoding('utf8');
                    response.on('data', function(body) {
                        data = data + body;
                        response.on('end', function (){
                            answ(data);
                        });
                    });
                });
            } catch(err) {
                console.log("Oops!");
            }
        } else if (url.charAt(4) == ":") {
            try{
                http.get(url, function(response) {
                    response.setEncoding('utf8');
                    response.on('data', function(body) {
                        data = data + body;
                        response.on('end', function (){
                            answ(data);
                        });
                    });
                });
            } catch(err) {
                console.log("Oops!");
            }
        }
    }
};

var post = function(url, stuff, answ) {
    var data = "";
    var tmp = url.split(":");
    var protocol = tmp[0];
    var hostnametmp = tmp[1].split("/");
    var hostname = hostnametmp[hostnametmp.length - 1];
    var porttmp = tmp[2].split("/");
    var port = porttmp[0];
    var path = tmp[2].split(port)[1];
    var options = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'POST'
    };
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
                console.log("Oops!");
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
                console.log("Oops!");
            }
        });
        reqs.write(stuff);
        reqs.end();
    }
};

var server = http.createServer(function(req, res) {
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
            get(dest["location"].concat(params3.path), function(answ){
                try {
                    res.end(answ);
                } catch(err) {
                    console.log("Oops!");
                }
            });
        } else if (req.method == "POST") {
            var data = "";
            req.on('data', function(body){
                data = data+body;
            });
            req.on('end', function(){
                post(dest["location"], data, function(answ){
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
                    //var cookies = parseCookies(req);
                    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
                    if (req.method == "GET"){
                        try {var parameters = req.url.split("?")[1].split("&").join(" ");} catch(err) {var parameters = ""}
                        //var parameters = req.url;
                        //encodeURIComponent(parameters);
                        proc.exec("node " + dest["location"].concat(par) + ' "' + parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%E2%80%98/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"').replace(/&/g, "%2F") + "&ip=" + req.connection.remoteAddress + '"', function(err, stdout, stderr) {
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
                            try {var parameters = data;} catch(err) {var parameters = ""}
                            proc.exec("node " + dest["location"].concat(par) + ' "' + parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') + "&ip=" + req.connection.remoteAddress + '"', function(err, stdout, stderr) {
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
                    var data2 = fs.readFileSync(dest["location"].concat(par), 'utf8');
                    res.end(data2);
                } else {
                    res.writeHead(404);
                    res.write("<!DOCTYPE html><html><head><title>Error 404. File not found!</title></head><body><h1>ERROR 404</h1>File ");
                    res.write(par);
                    res.write(" not found.<br/>------------------------<br/>JoshieHTTP/2.3.1_Linux<body></html>");
                    res.end();
                }
            } else if (exists == 2) {
                res.writeHead(403);
                res.end("Access denied!");
            } else {
                res.writeHead(500);
                res.end("Error 500: internal server error.");
            }
        });
    }
});

if (process.argv.indexOf("--https") != -1 || process.argv.indexOf("-s") != -1) {
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
        var ext = path.extname(par);
        fs.appendFileSync("./log/log.txt", "[".concat(hour).concat(":").concat(minute).concat(":").concat(second).concat("] ").concat(req.connection.remoteAddress).concat(" : ").concat(req.method).concat(" : ").concat(req.headers.host).concat(req.url).concat("\n"));
        if (dest["type"] == "proxy") {
            if (req.method == "GET") {
                get(dest["location"].concat(params3.path), function(answ){
                    try {
                        res.end(answ);
                    } catch(err) {
                        console.log("Oops!");
                    }
                });
            } else if (req.method == "POST") {
                data = "";
                req.on('data', function(body){
                    data = data+body;
                });
                req.on('end', function(){
                    post(dest["location"], data, function(answ){
                        res.end(answ);
                    });
                });
            } else {
                req.writeHead(405);
                req.end();
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
                            try {var parameters = req.url.split("?")[1].split("&").join(" ");} catch(err) {var parameters = ""}
                            proc.exec("node " + dest["location"].concat(par) + ' "' + parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') + "&ip=" + req.connection.remoteAddress + '"', function(err, stdout, stderr) {
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
                                try {var parameters = data;} catch(err) {var parameters = ""}
                                proc.exec("node " + dest["location"].concat(par) + ' "' + parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') + "&ip=" + req.connection.remoteAddress + '"', function(err, stdout, stderr) {
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
                            proc.exec("php " + dest["location"].concat(par) + ' "' + parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"').replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
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
                            proc.exec("php " + dest["location"].concat(par) + ' "' + decodeURIComponent(parameters.replace(/ï¿½/g, "'").replace(/ï¿½/g, "'").replace(/%91/g, "'").replace(/%92/g, "'").replace(/%93/g, '"').replace(/%94/g, '"')).replace(/"/g, '\\"') +'"', function(err, stdout, stderr) {
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
                        var data2 = fs.readFileSync(dest["location"].concat(par), 'utf8');
                        res.end(data2);
                    } else {
                        res.writeHead(404);
                        res.write("<!DOCTYPE html><html><head><title>Error 404. File not found!</title></head><body><h1>ERROR 404</h1>File ");
                        res.write(par);
                        res.write(" not found.<br/>------------------------<br/>JoshieHTTP/2.3.1_Linux<body></html>");
                        res.end();
                    }
                } else if (exists == 2) {
                    res.writeHead(403);
                    res.end("Access denied!");
                } else {
                    res.writeHead(500);
                    res.end("Error 500: internal server error.");
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

console.log("Started JoshieHTTPD/2.3.1_Linux");
