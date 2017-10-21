# JoshieHTTP
A webserver designed and programmed by a bored 15 year old that has nothing better to do.

# Running
Create the directory /var/www/html, or edit the `'default'` configuration location to point to another folder that already exists.

Create `index.html` in that folder and put whatever you want in it.

Run `./start.sh`

# Creating new domains in main.conf
The configuration file is a JSON file that contains the settings for every website you have running. If it's not found in there, the 'default' configuration is used.

To create a new site, append a comma to the end of the last entry in the main.conf, in between the curly brackets.

In quotes, type out the full domain name, with separate entries for with and without a www.

After the quote, type a : and then an open curly bracket.

In quotes, type "type", then a : and then in quotes "local"

Append a comma, then type in quotes "location", a :, and then in quotes the folder you wish the domain to point to.

Ex:

```JSON
{
  "default": {"type": "local", "location": "/var/www/html"},
  "www.example.com": {"type": "local", "location": "/var/www/html2"}
}
```

# Proxying a site or internal site
JoshieHTTPD supports proxying of external or internal sites, and ports.

Follow the above instructions to add a new site, but instead of the "type" being "local", change "local" to "proxy"

Then, instead of a folder for the location, put the URL of the place you would like to proxy to. _make sure that you put a http:// or a https:// in front of the URL_. If you would like to proxy a port, simply append a : and then the port in side of the quotes.

Ex:

```JSON
{
  "default": {"type": "proxy", "location": "http://www.example.com:80"},
  "api.example.com": {"type": "proxy", "location": "http://localhost:8080"}
}
```
