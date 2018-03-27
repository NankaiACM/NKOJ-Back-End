module.exports = function mailTemplete (code, link, BASE_URL, hash, to) {
  var ret = `
    <!DOCTYPE html>
    <html>
    
    <head>
      <meta charset="UTF-8" />
      <title>
        验证邮件
      </title>
    </head>
    
    <body style="height:100%;width:100%;padding:0;margin:0;">
      <table style="background:#eaeced;" align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" bgcolor="#eaeced">
        <tr height="100" style="background:#eaeced;"></tr>
        <tr align="center">
          <td width="50"></td>
          <td align="center">
            <table border="0" style="width:100%;height:100%;border:0;padding:0;margin:0;max-width:600px;background:#fff;border-radius:3px;"
              align="center">
              <tbody align="center">
                <tr height="50"></tr>
                <tr>
                  <td>
                    <table>
                      <tr align="center">
                        <td width="25">
                        </td>
                        <td width="300">
                          <img width="300" style="width:300px;" src="http://7sbxv9.com1.z0.glb.clouddn.com/logo.png" alt="NKUOJ" title="NKUOJ" />
                        </td>
                        <td style="line-height:70px;font-size:30px;font-weight:200;color:#9c6190;">
                          验证你的邮件
                        </td>
                        <td width="25">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr height="50"></tr>
                <tr>
                  <td align="center">
                    <table width="85%" style="color:#7e8890;width:85%;font-weight:200;line-height:1.3em;">
                      <tr>
                        <td>
                          <p align="center">
                            现在验证你的邮件，开启你在NKUOJ的探索！
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr height="30"></tr>
                <tr align="center" height="52">
                  <td width="256" height="52" style="padding:14px 28px 14px 28px;width:200px;height:1.5em;background:#ffa7be;display:inline-block;line-height:1.5em;color:#fff;border-radius:3px;text-decoration:none;">
                    code:${code}
                  </td>
                </tr>
                <tr height="10"></tr>
                <tr align="center">
                  <td style="color:#7e8890;">
                    或者
                  </td>
                </tr>
                <tr height="10"></tr>
                <tr align="center" height="52">
                  <td width="256" height="52" style="background:#ff2b63;width:256px;display:inline-block;border-radius:3px;">
                    <a style="padding:14px 28px 14px 28px;width:200px;height:1.5em;background:#ff2b63;display:inline-block;line-height:1.5em;color:#fff;border-radius:3px;text-decoration:none;"
                      href="${link}">验证邮件地址</a>
                  </td>
                </tr>
                <tr height="30">
                  <td>
                  </td>
                </tr>
                <tr align="center">
                  <td style="font-weight: 500;color:#7e8890;">
                    注意：验证仅在十分钟内有效。
                  </td>
                </tr>
                <tr height="30">
                  <td>
                  </td>
                </tr>
              </tbody>
              <tfoot align="center">
                <tr align="center">
                  <td style="color:#ccc;">
                    -
                  </td>
                </tr>
                <tr height="25"></tr>
                <tr align="center">
                  <td style="font-weight:400;color:#7e8890;">
                    Copyright(c)2018 NKUOJ,All rights reserved.
                  </td>
                </tr>
                <tr align="center">
                  <td style="font-weight:400;color:#7e8890;">
                    <a style="color:#d498a7;" href="${BASE_URL}/api/u/unsubscribe/${hash}/${Buffer.from(to).toString('base64')}">Unsubscribe</a> from NKUOJ.
                  </td>
                </tr>
                <tr height="50"></tr>
              </tfoot>
            </table>
          </td>
          <td width="50"></td>
        </tr>
        <tr height="100" style="background:#eaeced;"></tr>
      </table>
    </body>
    
    </html>
    `;
  return ret;
}