
exports.reset_password = ({
  user_name,
  institution_name,
  token,
  // expiration_time,
}) => {
  const result = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
    </head>
  
    <body style="margin: 0; background-color: #ececec">
      <div class="logo" style="text-align: center; margin: 25px auto">
        <img src="https://apis.kurious.rw/assets/images/logo.png" alt="" />
      </div>
      <div class="flex">
        <div class="">
          <div
            class="content"
            style="
              background-color: white;
              border-top: 3px solid #193074;
              padding: 69px 39px 0;
              margin: auto;
              height: 340px;
              max-width: 522px;
              border-radius: 0px;
              align-self: center;
            "
          >
            <div
              class="message"
              style="
                font-family: Inter;
                font-style: normal;
                font-weight: normal;
                font-size: 20px;
                line-height: 24px;
                text-align: center;
                margin-bottom: 10px;
              "
            >
              Hi ${user_name},
            </div>
            <div
              style="
                font-family: Inter;
                font-style: normal;
                font-weight: normal;
                font-size: 15px;
                text-align: center;
                margin-bottom: 18px;
              "
            >
              You recently requested to reset your Kurious learn account password.
            </div>
            <div class="text-center" style="text-align: center">
              <a href="https://learn.kurious.rw/reset_password?token=${token}&institution=${institution_name}" target="_blank" rel="noopener noreferrer">
                <button
                  class="confirm"
                  style="
                    height: 54px;
                    width: 172px;
                    left: 0px;
                    top: 0px;
                    border-radius: 10px;
                    background: #193074;
                    color: white;
                    border: none;
                    text-align: center;
                    margin: 4px auto;
                    cursor: pointer;
                  "
                  onfocus="this.style.outline='none'"
                >
                Reset password
                </button>
              </a>
            </div>
            <div
              class="thanks"
              style="
                font-family: Inter;
                font-size: 15px;
                font-style: normal;
                font-weight: 400;
                line-height: 24px;
                letter-spacing: 0em;
                text-align: left;
                margin: 50px 0;
                height: 60px;
                width: 126px;
                left: 39px;
                top: 328px;
              "
            >
              Thanks,
              <br />
              Kurious learn team
            </div>
          </div>
          <div
            class="footer"
            style="
              height: 66px;
              left: 0px;
              top: 476px;
              border-radius: 0px;
              max-width: 600px;
              margin: auto;
              background: #193074;
            "
          >
            <a
              href="https://twitter.com/kuriouslearnRw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                class="ig_icon"
                style="
                  height: 20px;
                  width: 20px;
                  left: 41px;
                  top: 499px;
                  border-radius: 0px;
                  margin: 24px 12px;
                "
                src="https://apis.kurious.rw/assets/images/ig.png"
                alt=""
              />
            </a>
            <a
              href="https://kurious.rw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                class="fb_icon"
                style="
                  height: 20px;
                  width: 11px;
                  left: 87px;
                  top: 499px;
                  border-radius: 0px;
                  margin: 24px 12px;
                "
                src="https://apis.kurious.rw/assets/images/fb.png"
                alt=""
              />
            </a>
            <a
              href="https://kurious.rw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                class="twitter_icon"
                style="left: 87px; margin: 24px 12px"
                src="https://apis.kurious.rw/assets/images/twitter.png"
                alt=""
              />
            </a>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;

  return result;
};

exports.requestCallback = ({
  user_name,
  institution_name,
  role_at_institution,
  phone_number,
}) => {
  const result = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <!-- <link rel="stylesheet" href="https://apis.kurious.rw/assets/css/invitation_email.css"> -->
    </head>
    
    <body style="margin: 0; background-color: #ececec">
      <div class="logo" style="text-align: center; margin: 25px auto">
        <img src="https://apis.kurious.rw/assets/images/logo.png" alt="" />
      </div>
      <div class="flex">
        <div class="">
          <div class="content" style="
                background-color: white;
                border-top: 3px solid #193074;
                padding: 49px 39px 0;
                margin: auto;
                height: 340px;
                max-width: 522px;
                border-radius: 0px;
                align-self: center;
              ">
            <div class="message" style="
                  font-family: Inter;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  height: 96px;
                  width: 379px;
                  left: 39px;
                  top: 99px;
                ">
              ${user_name} who is ${role_at_institution} at ${institution_name} Requested a callback us,<br />
              through <a href="https://kurious.rw">Kurious home page</a>.
            </div>
            <div class="text-center" style="text-align: center">
              <a href="call:${phone_number}" target="_blank" rel="noopener noreferrer">
                <button class="confirm" style="
                      height: 54px;
                      width: 172px;
                      left: 0px;
                      top: 0px;
                      border-radius: 10px;
                      background: #193074;
                      color: white;
                      border: none;
                      text-align: center;
                      margin: 4px auto;
                      cursor: pointer;
                    " onfocus="this.style.outline='none'">
                  Call now
                </button>
              </a>
            </div>
            <div class="thanks" style="
                  font-family: Inter;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  margin: 50px 0;
                  height: 60px;
                  width: 126px;
                  left: 39px;
                  top: 328px;
                ">
              Thanks,
              <br> Kurious learn team
            </div>
          </div>
          <div class="footer" style="
                height: 66px;
                left: 0px;
                top: 476px;
                border-radius: 0px;
                max-width: 600px;
                margin: auto;
                background: #193074;
              ">
            <a href="https://twitter.com/kuriouslearnRw" target="_blank" rel="noopener noreferrer">
              <img class="ig_icon" style="
                    height: 20px;
                    width: 20px;
                    left: 41px;
                    top: 499px;
                    border-radius: 0px;
                    margin: 24px 12px;
                  " src="https://apis.kurious.rw/assets/images/ig.png" alt="" />
            </a>
            <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
              <img class="fb_icon" style="
                    height: 20px;
                    width: 11px;
                    left: 87px;
                    top: 499px;
                    border-radius: 0px;
                    margin: 24px 12px;
                  " src="https://apis.kurious.rw/assets/images/fb.png" alt="" />
            </a>
            <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
              <img class="twitter_icon" style="left: 87px; margin: 24px 12px"
                src="https://apis.kurious.rw/assets/images/twitter.png" alt="" />
            </a>
          </div>
        </div>
      </div>
    </body>
    
    </html>
  `;

  return result;
};

exports.contactUs = ({
  user_name,
  user_email,
  message,
}) => {
  const result = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <!-- <link rel="stylesheet" href="https://apis.kurious.rw/assets/css/invitation_email.css"> -->
    </head>
    
    <body style="margin: 0; background-color: #ececec">
      <div class="logo" style="text-align: center; margin: 25px auto">
        <img src="https://apis.kurious.rw/assets/images/logo.png" alt="" />
      </div>
      <div class="flex">
        <div class="">
          <div class="content" style="
                background-color: white;
                border-top: 3px solid #193074;
                padding: 49px 39px 0;
                margin: auto;
                height: 340px;
                max-width: 522px;
                border-radius: 0px;
                align-self: center;
              ">
            <div class="message" style="
                  font-family: Inter;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  height: 96px;
                  width: 379px;
                  left: 39px;
                  top: 99px;
                ">
              ${user_name} Contacted us,<br />
              through <a href="https://kurious.rw">Kurious home page</a>.
            </div>
            <div class="message" style="
                  font-family: Inter;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  height: 96px;
                  width: 379px;
                  left: 39px;
                  top: 99px;
            ">
              ${message}
            </div>
            <div class="text-center" style="text-align: center">
              <a href="mailto:${user_email}" target="_blank" rel="noopener noreferrer">
                <button class="confirm" style="
                      height: 54px;
                      width: 172px;
                      left: 0px;
                      top: 0px;
                      border-radius: 10px;
                      background: #193074;
                      color: white;
                      border: none;
                      text-align: center;
                      margin: 4px auto;
                      cursor: pointer;
                    " onfocus="this.style.outline='none'">
                  Reply
                </button>
              </a>
            </div>
            <div class="thanks" style="
                  font-family: Inter;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  margin: 50px 0;
                  height: 60px;
                  width: 126px;
                  left: 39px;
                  top: 328px;
                ">
              Thanks,
              <br> Kurious learn team
            </div>
          </div>
          <div class="footer" style="
                height: 66px;
                left: 0px;
                top: 476px;
                border-radius: 0px;
                max-width: 600px;
                margin: auto;
                background: #193074;
              ">
            <a href="https://twitter.com/kuriouslearnRw" target="_blank" rel="noopener noreferrer">
              <img class="ig_icon" style="
                    height: 20px;
                    width: 20px;
                    left: 41px;
                    top: 499px;
                    border-radius: 0px;
                    margin: 24px 12px;
                  " src="https://apis.kurious.rw/assets/images/ig.png" alt="" />
            </a>
            <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
              <img class="fb_icon" style="
                    height: 20px;
                    width: 11px;
                    left: 87px;
                    top: 499px;
                    border-radius: 0px;
                    margin: 24px 12px;
                  " src="https://apis.kurious.rw/assets/images/fb.png" alt="" />
            </a>
            <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
              <img class="twitter_icon" style="left: 87px; margin: 24px 12px"
                src="https://apis.kurious.rw/assets/images/twitter.png" alt="" />
            </a>
          </div>
        </div>
      </div>
    </body>
    
    </html>
  `;

  return result;
};

exports.invitationToSystem = ({
  inviter,
  institution,
  token
}) => {
  const result = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <!-- <link rel="stylesheet" href="https://apis.kurious.rw/assets/css/invitation_email.css"> -->
      </head>
    
      <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
          <img src="https://apis.kurious.rw/assets/images/logo.png" alt="" />
        </div>
        <div
          class="flex"
        >
          <div class="">
            <div
              class="content"
              style="
                background-color: white;
                padding: 49px 39px 0;
                border-top: 3px solid #193074;
                margin: auto;
                height: 340px;
                max-width: 522px;
                border-radius: 0px;
                align-self: center;
              "
            >
              <div
                class="message"
                style="
                  font-family: Inter;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  height: 96px;
                  width: 379px;
                  left: 39px;
                  top: 99px;
                "
              >
                ${inviter} invited you in ${institution.name},<br />
                on Kurious learn! Please click the button below to finish setting up
                your account.
              </div>
              <div class="text-center" style="text-align: center">
                <a
                  href="https://kurious.rw/auth/register?token=${token}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button
                    class="confirm"
                    style="
                      height: 54px;
                      width: 172px;
                      left: 0px;
                      top: 0px;
                      border-radius: 10px;
                      background: #193074;
                      color: white;
                      border: none;
                      text-align: center;
                      margin: 4px auto;
                      cursor: pointer;
                    "
                    onfocus="this.style.outline='none'"
                  >
                    CONFIRM
                  </button>
                </a>
              </div>
              <div
                class="thanks"
                style="
                  font-family: Inter;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  margin: 50px 0;
                  height: 60px;
                  width: 126px;
                  left: 39px;
                  top: 328px;
                "
              >
                Thanks,
                <br> Kurious learn team
              </div>
            </div>
            <div
              class="footer"
              style="
                height: 66px;
                left: 0px;
                top: 476px;
                max-width: 600px;
                margin: auto;
                border-radius: 0px;
                background: #193074;
              "
            >
              <a
                href="https://twitter.com/kuriouslearnRw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  class="ig_icon"
                  style="
                    height: 20px;
                    width: 20px;
                    left: 41px;
                    top: 499px;
                    border-radius: 0px;
                    margin: 24px 12px;
                  "
                  src="https://apis.kurious.rw/assets/images/ig.png"
                  alt=""
                />
              </a>
              <a
                href="https://kurious.rw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  class="fb_icon"
                  style="
                    height: 20px;
                    width: 11px;
                    left: 87px;
                    top: 499px;
                    border-radius: 0px;
                    margin: 24px 12px;
                  "
                  src="https://apis.kurious.rw/assets/images/fb.png"
                  alt=""
                />
              </a>
              <a
                href="https://kurious.rw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  class="twitter_icon"
                  style="left: 87px; margin: 24px 12px"
                  src="https://apis.kurious.rw/assets/images/twitter.png"
                  alt=""
                />
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
    
    `;

  return result;
};