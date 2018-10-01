// Template File
module.exports = {
  transporter: {
    host: 'smtp.yourhost.com',
    secureConnection: true, // use SSL
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
      user: 'some user',
      pass: 'some pass'
    }
  },
  regMailOptions: {
    from: '"Display Name" <who@yourhost.com>',
    subject: 'Your Subject'
  },
  auth: {
    user: 'some user',
    pass: 'some pass'
  },
  requireTLS: true
};
