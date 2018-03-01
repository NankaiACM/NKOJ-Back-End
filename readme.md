### How To Install

+ install node 9.5.0+
+ run `npm install` on this folder
+ run `npm install pm2 -g` to install pm2 and save it globally
+ run `pm2 start bin/init --name api --watch` on this folder
+ run `pm2 monit` or `pm2 log api` to monitor its state

### Other DEPENDENCY This Project May Use

+ postgres 10
+ redis 4.0.8+
+ A valid RSA key for encrypt and decrypt sensitive data
+ gcc 6.4.0+

  ( Configure them at `/config` )


