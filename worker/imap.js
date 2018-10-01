const {receive} = require('$interface/email');

let fails = 0;

function errorHandler () {
  f().then().catch(rejectionHandler);
}

function rejectionHandler() {
  fails += 1;
  if(fails > 3) {
    fails = 0;
    return setTimeout(errorHandler, 60 * 60);
  }
  return errorHandler();
}

function f() {
  const ImapClient = require('emailjs-imap-client').default;
  const {IMAPServerOptions} = require('$config/mail');
  const {server, port, config} = IMAPServerOptions;
  const client = new ImapClient(server, port, config);
  client.onerror = errorHandler;
  return client.connect().then(() =>
      client.selectMailbox('INBOX')
  ).then(()=>{
    const fetchAndDelete = (messages) => {
      messages.forEach(message => {
        try {
          const subject = message.envelope.subject;
          const from = message.envelope.from[0].address;
          receive(from, subject);
        } catch (e) {

        }
        client.deleteMessages('INBOX', ''+message.uid, {byUid: true}).then((...message) => { console.log('delete', message) });
      });
    };
    client.onupdate = function(path, type, value){
      if (type === 'expunge') {
        // IGNORE
      } else if (type === 'exists') {
        if(value === 0) setTimeout(client.onupdate, 1000, path, type, 1);
        client.listMessages('INBOX', '1:'+value, ['uid', 'flags', 'envelope']).then((messages) => {
          fetchAndDelete(messages);
        });
      } else if (type === 'fetch') {
        // IGNORE
      }
    };
    client.listMessages('INBOX', '1:*', ['uid', 'flags', 'envelope']).then((messages) => {
      fetchAndDelete(messages);
    });
  });
}

module.exports = (() => {
  f().then().catch(rejectionHandler);
  return undefined;
})();
