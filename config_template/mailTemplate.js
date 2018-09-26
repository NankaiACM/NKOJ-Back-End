// Template File
module.exports = function mailTemplete(link, BASE_URL, to) {
  return `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <title> 验证邮件 </title>
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
                      <img width="300" style="width:300px;" src="data:image/png;base64,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" alt="NKOJ" title="NKUOJ" />
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
                        现在验证你的邮件，开启你在NKOJ的探索！
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr height="30"></tr>
            <tr align="center" height="52">
              <td width="256" height="52" style="padding:14px 28px 14px 28px;width:200px;height:1.5em;background:#ffa7be;display:inline-block;line-height:1.5em;color:#fff;border-radius:3px;text-decoration:none;">
                <a style="padding:14px 28px 14px 28px;width:200px;height:1.5em;background:#ff2b63;display:inline-block;line-height:1.5em;color:#fff;border-radius:3px;text-decoration:none;"
                  href="${link}">验证邮件地址</a>
              </td>
            </tr>
            <tr height="10"></tr>
            <tr align="center">
              <td style="color:#7e8890;">
                或者使用这个链接：
              </td>
            </tr>
            <tr height="10"></tr>
            <tr align="center" height="52">
              <td>${link}</td>
            </tr>
            <tr height="30">
              <td>
              </td>
            </tr>
            <tr align="center">
              <td style="font-weight: 500;color:#7e8890;">
                注意：验证仅在1小时内有效。
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
                Copyright(c)2018 NKOJ,All rights reserved.
              </td>
            </tr>
            <tr align="center">
              <td style="font-weight:400;color:#7e8890;">
              <!--TODO:-->
                <a style="color:#d498a7;" href="${BASE_URL}/api/u/unsubscribe/${to}">Unsubscribe</a> from NKOJ.
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
};
