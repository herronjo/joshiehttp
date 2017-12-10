@ECHO OFF
IF EXIST C:\inetpub GOTO INETPUBEXIST
ECHO Making C:\inetpub
MKDIR C:\inetpub
:INETPUBEXIST
IF EXIST C:\inetpub\html GOTO HTMLEXIST
ECHO Making C:\inetpub\html
MKDIR C:\inetpub\html
:HTMLEXIST
ECHO Moving files
MOVE *.* C:\inetpub\*.*
ECHO Done! Run start.bat (or start-ssl.bat if you've already set up ssl) as an unprivelaged user and accept the Windows Firewall notification.
