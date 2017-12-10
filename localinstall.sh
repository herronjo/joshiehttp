#!/bin/sh

UserExists()
{
	awk -F":" '{ print $1 }' /etc/passwd | grep -x $1 > /dev/null
	return $2
}

if [ -d "/var/www" ]
then
	echo " * Creating /var/www"
	mkdir /var/www
fi
if [ -d "/var/www/html" ]
then
	echo " * Creating /var/www/html"
	mkdir /var/www/html
fi
echo " * Moving files"
mv -f files/* /var/www/*
echo " * chmodding files"
chmod 660 /var/www/main.conf
chmod 555 /var/www/server.js
chmod 660 /var/www
chmod 550 /var/www/start.sh
chmod 550 /var/www/start-ssl.sh
UserExists secureweb
if [ $2 = 0 ]
then

else
	echo " * Creating 'secureweb' user"
	groupadd secureweb
	useradd -M -s /bin/sh -G secureweb secureweb
fi
echo " * chowning files"
chown -R secureweb:secureweb /var/www/html
echo " * Deleting temporary files"
rm -rf ~/.itmp
echo " * Done!"
echo "Go to /var/www and run ./start.sh (or ./start-ssl.sh if you've already set up ssl) to start the webserver! screen is recommended."
