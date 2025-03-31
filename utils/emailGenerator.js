exports.invitationToSystem = ({ inviter, institution, token }) => {

    const result =     `
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
                        <a href="https://learn.kurious.rw/signup?token=${token}" target="_blank"
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
                        <svg class="ig_icon" width="22" height="22" viewBox="0 0 22 22" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M16 1H6C3.23858 1 1 3.23858 1 6V16C1 18.7614 3.23858 21 6 21H16C18.7614 21 21 18.7614 21 16V6C21 3.23858 18.7614 1 16 1Z"
                                stroke="#DEDEDE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                                d="M15.0002 10.3701C15.1236 11.2023 14.9815 12.0523 14.594 12.7991C14.2065 13.5459 13.5933 14.1515 12.8418 14.5297C12.0903 14.908 11.2386 15.0397 10.408 14.906C9.57732 14.7723 8.80996 14.3801 8.21503 13.7852C7.62011 13.1903 7.22793 12.4229 7.09426 11.5923C6.9606 10.7616 7.09226 9.90995 7.47052 9.15843C7.84878 8.40691 8.45438 7.7938 9.20118 7.4063C9.94798 7.0188 10.7979 6.87665 11.6302 7.00006C12.4791 7.12594 13.265 7.52152 13.8719 8.12836C14.4787 8.73521 14.8743 9.52113 15.0002 10.3701Z"
                                stroke="#DEDEDE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M16.5 5.5H16.51" stroke="#DEDEDE" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg></a>
                    <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
                        <svg class="fb_icon" width="13" height="22" viewBox="0 0 13 22" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 1H9C7.67392 1 6.40215 1.52678 5.46447 2.46447C4.52678 3.40215 4 4.67392 4 6V9H1V13H4V21H8V13H11L12 9H8V6C8 5.73478 8.10536 5.48043 8.29289 5.29289C8.48043 5.10536 8.73478 5 9 5H12V1Z"
                                stroke="#DEDEDE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </a>
                    <a href="https://kurious.rw" target="_blank" rel="noopener noreferrer">
                        <svg class="twitter_icon" width="24" height="21" viewBox="0 0 24 21" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M23 2.00005C22.0424 2.67552 20.9821 3.19216 19.86 3.53005C19.2577 2.83756 18.4573 2.34674 17.567 2.12397C16.6767 1.90121 15.7395 1.95724 14.8821 2.2845C14.0247 2.61176 13.2884 3.19445 12.773 3.95376C12.2575 4.71308 11.9877 5.61238 12 6.53005V7.53005C10.2426 7.57561 8.50127 7.18586 6.93101 6.39549C5.36074 5.60513 4.01032 4.43868 3 3.00005C3 3.00005 -1 12 8 16C5.94053 17.398 3.48716 18.099 1 18C10 23 21 18 21 6.50005C20.9991 6.2215 20.9723 5.94364 20.92 5.67005C21.9406 4.66354 22.6608 3.39276 23 2.00005V2.00005Z"
                                stroke="#DEDEDE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </body>
    
    </html>
    `

    return result

}