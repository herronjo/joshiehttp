# JoshieHTTP
A webserver designed and programmed by a bored 15 year old that has nothing better to do.

# Table of contents 
[Running](#running)

[Adding sites](#creating-new-domains-in-mainconf)

[Proxying](#proxying-a-site-or-internal-site)

[Scripting](#scripting)

[SSL](#ssl)

# Running
Create the directory C:\inetpub\html, or edit the `'default'` configuration location to point to another folder that already exists.

Create `index.html` in that folder and put whatever you want in it.

Run `start.bat`

# Creating new domains in main.conf
The configuration file is a JSON file that contains the settings for every website you have running. If it's not found in there, the `'default'` configuration is used.

To create a new site, append a comma to the end of the last entry in the `main.conf`, in between the curly brackets.

In quotes, type out the full domain name, with separate entries for with and without a `www.`

After the quote, type a `:` and then an open curly bracket.

In quotes, type `"type"`, then a `:` and then in quotes `"local"`

Append a comma, then type in quotes `"location"`, a `:`, and then in quotes the folder you wish the domain to point to.

Ex:

```JSON
{
  "default": {"type": "local", "location": "C:\\inetpub\\html"},
  "www.example.com": {"type": "local", "location": "C:\\inetpub\\html2"}
}
```

# Proxying a site or internal site
JoshieHTTPD supports proxying of external or internal sites, and ports.

Follow the above instructions to add a new site, but instead of the "type" being "local", change "local" to "proxy"

Then, instead of a folder for the location, put the URL of the place you would like to proxy to. _make sure that you put a http:// or a https:// in front of the URL_. If you would like to proxy a port, simply append a : and then the port in side of the quotes.

Ex:

```JSON
{
  "default": {"type": "proxy", "location": "http://www.example.com"},
  "api.example.com": {"type": "proxy", "location": "http://localhost:8080"}
}
```

# Scripting
PHP, Ruby, Python, etc. is not supported in JoshieHTTP. Mainly because I didn't feel like adding them. Too much. So, to make up for that, I made the `.sjs` extension for scripting. It's just a .js file, but renamed. It runs in node.js, and all URL parameters are passed on as command line arguments to the script. You can go on from there, reading the arguments. It's all run server-side, and to send data back you just send it back in a `console.log();`. There's actually a lot you can do with this. Happy scripting!

Update: PHP support now added. Some (_most_) features don't work, since it's just called directly from the command line, but it's a start! Just make sure PHP is installed on your server. Just add ```"php_enabled"``` to your configuration file for the sites you want PHP on. Happy scripting!

_Coming soon:
JoshieScript in the .jspt format_

# SSL
If you wish for JoshieHTTP to run with SSL (who wouldn't?), create a directory named `ssl` in the same directory as `index.js`

In `ssl`, you need two files. `key.pem`, which is your private key, and `cert.pem`, which is your certificate file.

Then, run `start-ssl.bat`
