exports.invitationToSystem = ({ inviter, institution, token }) => {
    const result = `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <style type="text/css">
            @font-face {
                font-family: "Inter";
                src: local("Inter"),
                    url(https://apis.kurious.rw/assets/fonts/Inter/Inter-VariableFont_slnt\,wght.ttf) format("truetype");
            }
    
            body {
                margin: 0;
                background-color: #ececec;
            }
    
            .logo {
                text-align: center;
                margin: 25px auto;
            }
    
            .content {
                /* width: 38%; */
                /* margin: auto; */
                background-color: white;
                padding: 49px 39px 0;
                height: 340px;
                max-width: 522px;
                border-radius: 0px;
                align-self: center;
    
            }
    
            .message {
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
            }
    
            .confirm {
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
            }
    
            button:focus {
                outline: none;
            }
    
            .text-center {
                text-align: center;
            }
    
            .thanks {
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
            }
    
            .footer {
                height: 66px;
                /* width: 43.8%; */
                /* margin: auto; */
                left: 0px;
                top: 476px;
                border-radius: 0px;
                background: #193074;
    
            }
    
            .ig_icon {
                height: 20px;
                width: 20px;
                left: 41px;
                top: 499px;
                border-radius: 0px;
    
            }
    
            .fb_icon {
                height: 20px;
                width: 11px;
                left: 87px;
                top: 499px;
                border-radius: 0px;
    
            }
    
            .twitter_icon {
                left: 87px;
            }
    
            .ig_icon,
            .fb_icon,
            .twitter_icon {
                margin: 24px 12px;
            }
    
            .flex {
                display: flex;
                justify-content: center;
            }
    
            @media screen and (max-width: 525px) {
    
                .message {
                    width: 260px;
                }
            }
        </style>
    </head>
    
    <body>
        <div class="logo">
            <img src="https://apis.kurious.rw/assets/images/image%204.png" alt="">
        </div>
        <div class="flex">
            <div class="">
                <div class="content">
                    <div class="message">
                        ${inviter} invited you in ${institution.name},<br>
                        on Kurious learn!
                        Please click the button below to finish setting up
                        your account.
                    </div>
                    <div class="text-center">
                        <a href="https://kurious.rw/auth/register?token=${token}" target="_blank"
                            rel="noopener noreferrer">
                            <button class="confirm">
                                CONFIRM
                            </button>
                        </a>
                    </div>
                    <div class="thanks">
                        Thanks,
                        Kurious learn team
                    </div>
                </div>
                <div class="footer">
                    <a href="https://twitter.com/kuriouslearnRw" target="_blank" rel="noopener noreferrer">
                        <img class="ig_icon" src="https://apis.kurious.rw/assets/images/ig.svg" alt="">
                        </a>
                    <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
                        <img class="fb_icon" src="https://apis.kurious.rw/assets/images/fb.svg" alt="">
                    </a>
                    <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
                        <img class="twitter_icon" src="https://apis.kurious.rw/assets/images/twitter.svg" alt="">
                    </a>
                </div>
            </div>
        </div>
    </body>
    
    </html>
    `;

    return result;
};

exports.invitationToSystem = ({ inviter, institution, token }) => {
    const result = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <!-- <link rel="stylesheet" href="https://apis.kurious.rw/assets/css/invitation_email.css"> -->
      </head>
    
      <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 35px auto 25px">
          <img src="https://apis.kurious.rw/assets/images/image%204.png" alt="" />
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
                  src="https://apis.kurious.rw/assets/images/ig.svg"
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
                  src="https://apis.kurious.rw/assets/images/fb.svg"
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
                  src="https://apis.kurious.rw/assets/images/twitter.svg"
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
