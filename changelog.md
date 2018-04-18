# Changelog
2.0 - Initial creation (there was stuff before this)

Raw format download (fixes file encoding breaking stuff)

SSL added

.sjs added

Configuration file stuff

etc.

2.1 - Addition of 'POST' method for .sjs

Security stuff

Fixed stuff involving URL parameters and .sjs files

etc.

2.2 - Addition of PHP support

That's it

2.3 - Linux security enhancements

Made it switch to an unprivileged user after starting. That's it.

2.3.1 - Fixed some issues regarding URL encoding

Fixed some issues where I accidentally made it parse URLs preemptively before running sjs files.

3.0.0 - Changed how arguments are passed to .sjs files

Changed it so arguments are passed through environment variables instead of command line parameters, and allowed cookies to be passed to the script.

3.0.1 - Fixed potential exploit involving PATH environment variable in sjs, now sjs files execute in the working directory they're located in.
