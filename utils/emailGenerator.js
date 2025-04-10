exports.submission_email = ({
                                user_name,
                                institution_name,
                                institution_email,
                                subscription,
                                token,
                                user_email,
                                user_phone,
                                max_users,
                            }) => {
    const result = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width"/>
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
        </div>
        <div class="flex">
            <div class="">
                <div
                        class="content"
                        style="
                                background-color: white;
                                border-top: 3px solid #193074;
                                padding: 69px 39px;
                                margin: auto;
                                max-width: 522px;
                                border-radius: 0px;
                                align-self: center;
                              "
                >
                    <div
                            class="message"
                            style="
                                  font-family: 'Inter', sans-serif;
                                  font-style: normal;
                                  font-weight: normal;
                                  font-size: 15px;
                                  line-height: 24px;
                                  color: #343434;
                                  width: 281px;
                                  margin-bottom: 10px;
                                "
                    >
                        User ${user_name}. <br/>
                        Registered a new college
                    </div>
                    <div
                            style="
                                  margin: auto;
                                  width: 311px;
                                  left: 265px;
                                  top: 235px;
                                "
                    >
                        <div
                                style="
                                    font-family: 'Inter', sans-serif;
                                    font-style: normal;
                                    font-weight: bold;
                                    font-size: 15px;
                                    line-height: 30px;
                                    color: #343434;
                                  "
                        >
                            Submission details are :
                        </div>
                        <div>
                                  <span
                                          style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                                  >Institution name</span
                                  >
                            :
                            <span
                                    style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                            >${institution_name}</span
                            >
                        </div>
                        <div>
                                  <span
                                          style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                                  >Institution email</span
                                  >
                            :
                            <span
                                    style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                            >${institution_email}</span
                            >
                        </div>
                        <div>
                                  <span
                                          style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                                  >User email</span
                                  >
                            :
                            <span
                                    style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                            >${user_email}</span
                            >
                        </div>
                        <div>
                                  <span
                                          style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                                  >User phone</span
                                  >
                            :
                            <span
                                    style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                            >${user_phone}</span
                            >
                        </div>
                        <div>
                                  <span
                                          style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                                  >Maximum users</span
                                  >
                            :
                            <span
                                    style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                            >${max_users}</span
                            >
                        </div>
                        <div>
                                  <span
                                          style="
                                      margin-right: 65px;
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                                  >Type</span
                                  >
                            :
                            <span
                                    style="
                                      font-family: 'Inter', sans-serif;
                                      font-style: normal;
                                      font-weight: normal;
                                      font-size: 14px;
                                      line-height: 30px;
                                      color: #343434;
                                    "
                            >${subscription}</span
                            >
                        </div>
                    </div>
                    <div class="text-center" style="text-align: center">
                        <a
                                href="https://${process.env.HOST}/api/user/accept/${token}"
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
                                      cursor: pointer;
                                      margin: 24px auto 0px;
                                      cursor: pointer;
                                    "
                                    onfocus="this.style.outline='none'"
                            >
                                Accept submission
                            </button>
                        </a>
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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

exports.marks_release_email = ({
                                   user_names,
                                   instructor_names,
                                   assignment_name,
                                   assignment_type,
                                   link,
                               }) => {
    const result = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                                max-width: 522px;
                                border-radius: 0px;
                                align-self: center;
                              "
                >
                    <div
                            class="message"
                            style="
                                  font-family: 'Inter', sans-serif;
                                  font-style: normal;
                                  font-weight: normal;
                                  font-size: 15px;
                                  line-height: 24px;
                                  color: #343434;
                                  width: 379px;
                                  left: 139px;
                                  top: 126px;
                                  margin-bottom: 10px;
                                "
                    >
                        Hi ${user_names}. <br>
                        Instructor ${instructor_names} released marks for ${assignment_type} ${assignment_name}. <br>
                        Click the button below to view your results. <br>
        
                    </div>
                    <div class="text-center" style="text-align: center">
                        <a
                                href="${link}"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <button
                                    class="confirm"
                                    style="
                                      height: 54px;
                                      width: 172px;
                                      border-radius: 10px;
                                      background: #193074;
                                      color: white;
                                      border: none;
                                      text-align: center;
                                      margin: 31px auto 4px;
                                      cursor: pointer;
                                    "
                                    onfocus="this.style.outline='none'"
                            >
                                VIEW RESULTS
                            </button>
                        </a>
                    </div>
                    <div
                            class="thanks"
                            style="
                                  font-family: 'Inter', sans-serif;
                                  font-size: 15px;
                                  font-style: normal;
                                  font-weight: 400;
                                  line-height: 24px;
                                  letter-spacing: 0em;
                                  text-align: left;
                                  margin: 50px 0 0;
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
                    <div
                            style="
                                  padding: 12px;
                                  text-align: center;
                                  font-family: 'Helvetica';
                                  font-style: normal;
                                  font-weight: 300;
                                  font-size: 10px;
                                  line-height: 30px;
                                  color: #343434;
                                "
                    >
                        Learn, Connect, Engage
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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

exports.assingment_expiration = ({
                                     user_names,
                                     assignment_name,
                                     link,
                                 }) => {
    const result = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width" />
                <style>
                    @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
                </style>
            </head>
            
            <body style="margin: 0; background-color: #ececec">
            <div class="logo" style="text-align: center; margin: 25px auto">
                <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                                            max-width: 522px;
                                            border-radius: 0px;
                                            align-self: center;
                                          "
                    >
                        <div
                                class="message"
                                style="
                                              font-family: 'Inter', sans-serif;
                                              font-style: normal;
                                              font-weight: normal;
                                              font-size: 15px;
                                              line-height: 24px;
                                              color: #343434;
                                              width: 379px;
                                              left: 139px;
                                              top: 126px;
                                              margin-bottom: 10px;
                                            "
                        >
                            Hi ${user_names}. <br>
                            Assignment ${assignment_name} will expire in 2 hours.
                            Click the button below to submit do the assignment. <br>
            
                        </div>
                        <div class="text-center" style="text-align: center">
                            <a
                                    href="${link}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                            >
                                <button
                                        class="confirm"
                                        style="
                                                  height: 54px;
                                                  width: 172px;
                                                  border-radius: 10px;
                                                  background: #193074;
                                                  color: white;
                                                  border: none;
                                                  text-align: center;
                                                  margin: 31px auto 4px;
                                                  cursor: pointer;
                                                "
                                        onfocus="this.style.outline='none'"
                                >
                                    ATTEMPT NOW
                                </button>
                            </a>
                        </div>
                        <div
                                class="thanks"
                                style="
                                              font-family: 'Inter', sans-serif;
                                              font-size: 15px;
                                              font-style: normal;
                                              font-weight: 400;
                                              line-height: 24px;
                                              letter-spacing: 0em;
                                              text-align: left;
                                              margin: 50px 0 0;
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
                        <div
                                style="
                                              padding: 12px;
                                              text-align: center;
                                              font-family: 'Helvetica';
                                              font-style: normal;
                                              font-weight: 300;
                                              font-size: 10px;
                                              line-height: 30px;
                                              color: #343434;
                                            "
                        >
                            Learn, Connect, Engage
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
                                href="#"
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
                                href="https://twitter.com/kuriouslearnRw"
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
    return result
}

exports.announcement_email = ({
                                  user_names,
                                  announcer,
                                  link,
                              }) => {
    const result = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                                        max-width: 522px;
                                        border-radius: 0px;
                                        align-self: center;
                                      "
                >
                    <div
                            class="message"
                            style="
                                          font-family: 'Inter', sans-serif;
                                          font-style: normal;
                                          font-weight: normal;
                                          font-size: 15px;
                                          line-height: 24px;
                                          color: #343434;
                                          width: 379px;
                                          left: 139px;
                                          top: 126px;
                                          margin-bottom: 10px;
                                        "
                    >
                        Hi ${user_names}. <br>
                        You have a new announcement from ${announcer}. <br>
                        Click the button below to view the announcement.
                    </div>
                    <div class="text-center" style="text-align: center">
                        <a
                                href="${link}"
                                target="_blank"
                                rel="noopener noreferrer"
                        >
                            <button
                                    class="confirm"
                                    style="
                                              height: 54px;
                                              width: 172px;
                                              border-radius: 10px;
                                              background: #193074;
                                              color: white;
                                              border: none;
                                              text-align: center;
                                              margin: 31px auto 4px;
                                              cursor: pointer;
                                            "
                                    onfocus="this.style.outline='none'"
                            >
                                VIEW ANNOUNCEMENT
                            </button>
                        </a>
                    </div>
                    <div
                            class="thanks"
                            style="
                                          font-family: 'Inter', sans-serif;
                                          font-size: 15px;
                                          font-style: normal;
                                          font-weight: 400;
                                          line-height: 24px;
                                          letter-spacing: 0em;
                                          text-align: left;
                                          margin: 50px 0 0;
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
                    <div
                            style="
                                          padding: 12px;
                                          text-align: center;
                                          font-family: 'Helvetica';
                                          font-style: normal;
                                          font-weight: 300;
                                          font-size: 10px;
                                          line-height: 30px;
                                          color: #343434;
                                        "
                    >
                        Learn, Connect, Engage
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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

exports.live_scheduled_email = ({
                                    user_names,
                                    instructor_names,
                                    course_name,
                                    chapter_name,
                                    date,
                                    time
                                }) => {
    const result = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                                max-width: 522px;
                                border-radius: 0px;
                                align-self: center;
                              "
                >
                    <div
                            class="message"
                            style="
                                  font-family: 'Inter', sans-serif;
                                  font-style: normal;
                                  font-weight: normal;
                                  font-size: 15px;
                                  line-height: 24px;
                                  color: #343434;
                                  width: 379px;
                                  left: 139px;
                                  top: 126px;
                                  margin-bottom: 10px;
                                "
                    >
                        Hi ${user_names}. <br>
                        Instructor ${instructor_names} scheduled a live session
                        on course ${course_name} chapter ${chapter_name}.
                        It will start ${date} at ${time}.
        
                    </div>
                    <div
                            class="thanks"
                            style="
                                  font-family: 'Inter', sans-serif;
                                  font-size: 15px;
                                  font-style: normal;
                                  font-weight: 400;
                                  line-height: 24px;
                                  letter-spacing: 0em;
                                  text-align: left;
                                  margin: 50px 0 0;
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
                    <div
                            style="
                                  padding: 12px;
                                  text-align: center;
                                  font-family: 'Helvetica';
                                  font-style: normal;
                                  font-weight: 300;
                                  font-size: 10px;
                                  line-height: 30px;
                                  color: #343434;
                                "
                    >
                        Learn, Connect, Engage
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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

exports.confirmation_email = ({
                                  user_name,
                                  institution_name,
                                  institution_email,
                                  subscription
                              }) => {
    const result = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width"/>
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                        max-width: 522px;
                        border-radius: 0px;
                        align-self: center;
                      "
                >
                    <div
                            class="message"
                            style="
                          font-family: 'Inter', sans-serif;
                          font-style: normal;
                          font-weight: normal;
                          font-size: 15px;
                          line-height: 24px;
                          color: #343434;
                          height: 78px;
                          width: 281px;
                          left: 139px;
                          top: 126px;
                          margin-bottom: 10px;
                        "
                    >
                        Dear ${user_name}. <br/>
                        Thank you for your interest in trying out kurious learn
                    </div>
                    <div
                            style="
                          margin: auto;
                          height: 139px;
                          width: 311px;
                          left: 265px;
                          top: 235px;
                        "
                    >
                        <div
                                style="
                            font-family: 'Inter', sans-serif;
                            font-style: normal;
                            font-weight: bold;
                            font-size: 15px;
                            line-height: 30px;
                            color: #343434;
                          "
                        >
                            Submission details are :
                        </div>
                        <div>
                          <span
                                  style="
                              font-family: 'Inter', sans-serif;
                              font-style: normal;
                              font-weight: normal;
                              font-size: 14px;
                              line-height: 30px;
                              color: #343434;
                            "
                          >Institution name</span
                          >
                            :
                            <span
                                    style="
                              font-family: 'Inter', sans-serif;
                              font-style: normal;
                              font-weight: normal;
                              font-size: 14px;
                              line-height: 30px;
                              color: #343434;
                            "
                            >${institution_name}</span
                            >
                        </div>
                        <div>
                          <span
                                  style="
                              font-family: 'Inter', sans-serif;
                              font-style: normal;
                              font-weight: normal;
                              font-size: 14px;
                              line-height: 30px;
                              color: #343434;
                            "
                          >Institution email</span
                          >
                            :
                            <span
                                    style="
                              font-family: 'Inter', sans-serif;
                              font-style: normal;
                              font-weight: normal;
                              font-size: 14px;
                              line-height: 30px;
                              color: #343434;
                            "
                            >${institution_email}</span
                            >
                        </div>
                        <div>
                          <span
                                  style="
                              margin-right: 65px;
                              font-family: 'Inter', sans-serif;
                              font-style: normal;
                              font-weight: normal;
                              font-size: 14px;
                              line-height: 30px;
                              color: #343434;
                            "
                          >Type</span
                          >
                            :
                            <span
                                    style="
                              font-family: 'Inter', sans-serif;
                              font-style: normal;
                              font-weight: normal;
                              font-size: 14px;
                              line-height: 30px;
                              color: #343434;
                            "
                            >${subscription}</span
                            >
                        </div>
                    </div>
                    <div style="
                        font-family: 'Inter', sans-serif;
                        font-style: normal;
                        font-weight: normal;
                        font-size: 15px;
                        line-height: 24px;
                        /* or 160% */
        
                        text-align: center;
        
                        color: #343434;
                    ">
                        Your request is being reviewed. You will get a comfirmation email within
                        24 hours. If you have an urgent request, call ${process.env.COMMUNICATION_TEAM_PHONE} or send an email to ${process.env.COMMUNICATION_TEAM_EMAIL}
                    </div>
                    <div
                            class="thanks"
                            style="
                          font-family: 'Inter', sans-serif;
                          font-size: 15px;
                          font-style: normal;
                          font-weight: 400;
                          line-height: 24px;
                          letter-spacing: 0em;
                          text-align: left;
                          margin: 50px 0 0;
                          height: 60px;
                          width: 126px;
                          left: 39px;
                          top: 328px;
                        "
                    >
                        Thanks,
                        <br/>
                        Kurious learn team
                    </div>
                    <div
                            style="
                          padding: 12px;
                          text-align: center;
                          font-family: 'Helvetica';
                          font-style: normal;
                          font-weight: 300;
                          font-size: 10px;
                          line-height: 30px;
                          color: #343434;
                        "
                    >
                        You can update the above details in your profile settings
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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

exports.confirm_email = ({
                             user_name,
                             token
                         }) => {
    const result = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</head>

<body style="margin: 0; background-color: #ececec">
<div class="logo" style="text-align: center; margin: 25px auto">
    <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                        max-width: 522px;
                        border-radius: 0px;
                        align-self: center;
                      "
        >
            <div
                    class="message"
                    style="
                          font-family: 'Inter', sans-serif;
                          font-style: normal;
                          font-weight: normal;
                          font-size: 15px;
                          line-height: 24px;
                          color: #343434;
                          height: 78px;
                          width: 379px;
                          left: 139px;
                          top: 126px;
                          margin-bottom: 10px;
                        "
            >
                Dear ${user_name}. <br />
                Click the button below to confirm your email address
            </div>
            <div class="text-center" style="text-align: center">
                <a
                        href="https://${process.env.HOST}/api/user/confirm/${token}"
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
                        CONFIRM EMAIL
                    </button>
                </a>
            </div>
            <div
                    class="thanks"
                    style="
                          font-family: 'Inter', sans-serif;
                          font-size: 15px;
                          font-style: normal;
                          font-weight: 400;
                          line-height: 24px;
                          letter-spacing: 0em;
                          text-align: left;
                          margin: 50px 0 0;
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
            <div
                    style="
                          padding: 12px;
                          text-align: center;
                          font-family: 'Helvetica';
                          font-style: normal;
                          font-weight: 300;
                          font-size: 10px;
                          line-height: 30px;
                          color: #343434;
                        "
            >
                Enjoy digitalised education
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
                    href="#"
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
                    href="https://twitter.com/kuriouslearnRw"
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

exports.confirm_account = ({
                               user_name,
                               token
                           }) => {
    const result = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                        max-width: 522px;
                        border-radius: 0px;
                        align-self: center;
                      "
                >
                    <div
                            class="message"
                            style="
                          font-family: 'Inter', sans-serif;
                          font-style: normal;
                          font-weight: normal;
                          font-size: 15px;
                          line-height: 24px;
                          color: #343434;
                          height: 78px;
                          width: 379px;
                          left: 139px;
                          top: 126px;
                          margin-bottom: 10px;
                        "
                    >
                        Dear ${user_name}. <br />
                        Your submission was accepted. <br>
                        Click the button below to complete your registration
                    </div>
                    <div class="text-center" style="text-align: center">
                        <a
                                href="https://${process.env.HOST}/api/user/confirm/${token}"
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
                                CONFIRM EMAIL
                            </button>
                        </a>
                    </div>
                    <div
                            class="thanks"
                            style="
                          font-family: 'Inter', sans-serif;
                          font-size: 15px;
                          font-style: normal;
                          font-weight: 400;
                          line-height: 24px;
                          letter-spacing: 0em;
                          text-align: left;
                          margin: 50px 0 0;
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
                    <div
                            style="
                          padding: 12px;
                          text-align: center;
                          font-family: 'Helvetica';
                          font-style: normal;
                          font-weight: 300;
                          font-size: 10px;
                          line-height: 30px;
                          color: #343434;
                        "
                    >
                        Enjoy digitalised education
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
        </style>
    </head>
  
    <body style="margin: 0; background-color: #ececec">
      <div class="logo" style="text-align: center; margin: 25px auto">
        <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
              min-height: 340px;
              max-width: 522px;
              border-radius: 0px;
              align-self: center;
            "
          >
            <div
              class="message"
              style="
                font-family: 'Inter', sans-serif;
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
                font-family: 'Inter', sans-serif;
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
              <a href="https://${process.env.FRONTEND_HOST}/reset_password?token=${token}&institution=${institution_name}" target="_blank" rel="noopener noreferrer">
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
                font-family: 'Inter', sans-serif;
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
              href="#"
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
              href="https://twitter.com/kuriouslearnRw"
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
        <style>
          @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
        </style>
    </head>
    
    <body style="margin: 0; background-color: #ececec">
      <div class="logo" style="text-align: center; margin: 25px auto">
        <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
      </div>
      <div class="flex">
        <div class="">
          <div class="content" style="
                background-color: white;
                border-top: 3px solid #193074;
                padding: 49px 39px 0;
                margin: auto;
                min-height: 340px;
                max-width: 522px;
                border-radius: 0px;
                align-self: center;
              ">
            <div class="message" style="
                  font-family: 'Inter', sans-serif;
                  font-size: 15px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 24px;
                  letter-spacing: 0em;
                  text-align: left;
                  min-height: 96px;
                  width: 379px;
                  left: 39px;
                  top: 99px;
                ">
              ${user_name} who is ${role_at_institution} at ${institution_name} Requested a callback us,<br />
              through <a href="https://kurious.rw">Kurious home page</a>.
            </div>
            <div class="text-center" style="text-align: center">
                <div class="confirm" style="
                      height: 54px;
                      width: 172px;
                      left: 0px;
                      top: 0px;
                      border-radius: 10px;
                      background: #193074;
                      color: white;
                      border: none;
                    display: flex;
                    justify-content: center;
                    margin: auto;
                    cursor: pointer;
                    align-items: center;
                    " onfocus="this.style.outline='none'">
                  ${phone_number}
                </div>
            </div>
            <div class="thanks" style="
                  font-family: 'Inter', sans-serif;
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
            <a href="#" target="_blank" rel="noopener noreferrer">
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
            <a href="https://twitter.com/kuriouslearnRw" target="_blank" rel="noopener noreferrer">
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
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width"/>
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
        </div>
        <div class="flex">
            <div class="">
                <div
                        class="content"
                        style="
                                background-color: white;
                                border-top: 3px solid #193074;
                                padding: 69px 39px 1px;
                                margin: auto;
                                max-width: 522px;
                                border-radius: 0px;
                                align-self: center;
                              "
                >
                    <div class="message" style="
                          font-family: 'Inter', sans-serif;
                          font-size: 15px;
                          font-style: normal;
                          font-weight: 400;
                          line-height: 24px;
                          letter-spacing: 0em;
                          text-align: left;
                          min-height: 96px;
                          width: 379px;
                          left: 39px;
                          top: 99px;
                        ">
                        ${user_name} Contacted us,<br />
                        through <a href="https://kurious.rw">Kurious home page</a>.
                    </div>
                    <div class="message" style="
                          font-family: 'Inter', sans-serif;
                          font-size: 15px;
                          font-style: normal;
                          font-weight: 400;
                          line-height: 24px;
                          letter-spacing: 0em;
                          text-align: left;
                          min-height: 96px;
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
                          font-family: 'Inter', sans-serif;
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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

exports.invitationToSystem = ({
                                  inviter,
                                  institution,
                                  token,
                                  user_group
                              }) => {
    const result = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
            <style>
                @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
            </style>
        </head>
        
        <body style="margin: 0; background-color: #ececec">
        <div class="logo" style="text-align: center; margin: 25px auto">
            <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                                min-height: 340px;
                                max-width: 522px;
                                border-radius: 0px;
                                align-self: center;
                              "
                >
                    <div
                            class="message"
                            style="
                                  font-family: 'Inter', sans-serif;
                                  font-size: 15px;
                                  font-style: normal;
                                  font-weight: 400;
                                  line-height: 24px;
                                  letter-spacing: 0em;
                                  text-align: left;
                                  min-height: 96px;
                                  width: 379px;
                                  left: 39px;
                                  top: 99px;
                                "
                    >
                        ${inviter} invited you in ${institution.name} ${user_group ? '- ' + user_group : ''},<br />
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
                                      margin: 20px auto 0px;
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
                                  font-family: 'Inter', sans-serif;
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
                            href="#"
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
                            href="https://twitter.com/kuriouslearnRw"
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
exports.invitationToUserGroup = ({
                                  user_names,
                                  user_group_name,
                                  user_type
                              }) => {
    const result = `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</head>

<body style="margin: 0; background-color: #ececec">
<div class="logo" style="text-align: center; margin: 25px auto">
    <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
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
                                min-height: 340px;
                                max-width: 522px;
                                border-radius: 0px;
                                align-self: center;
                              "
        >
            <div
                    class="message"
                    style="
                                  font-family: 'Inter', sans-serif;
                                  font-size: 15px;
                                  font-style: normal;
                                  font-weight: 400;
                                  line-height: 24px;
                                  letter-spacing: 0em;
                                  text-align: left;
                                  min-height: 96px;
                                  width: 465px;
                                  left: 39px;
                                  top: 99px;
                                "
            >
                Dear ${user_names} <br>
                You have you have been assigned to ${ user_type === 'INSTRUCTOR' ? 'teach': 'learn'} in :  ${user_group_name},student group. ${ user_type === 'INSTRUCTOR' ? 'You now have this group as a destination when you create courses': 'You can now access courses in this user group'}.
                <br>
                <br>
                Login to your kurious learn account to check more details.
                <br>
                Happy ${ user_type === 'INSTRUCTOR' ? 'teaching': 'learning'} !
            </div>
            <div
                    class="thanks"
                    style="
                                  font-family: 'Inter', sans-serif;
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
            >Kurious learn team
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
                    href="#"
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
                    href="https://twitter.com/kuriouslearnRw"
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
exports.userCourseEnroll = ({
  user_names,
  course_name,
  link
}) => {
  const result = `
      <!DOCTYPE html>
      <html lang="en">

      <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width" />
          <style>
              @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
          </style>
      </head>

      <body style="margin: 0; background-color: #ececec">
          <div class="logo" style="text-align: center; margin: 25px auto">
              <a href="https://kurious.rw"><img src="https://apis.kurious.rw/assets/images/logo.png" alt="" /></a>
          </div>
          <div class="flex">
              <div class="">
                  <div class="content" style="
                                                  background-color: white;
                                                  border-top: 3px solid #193074;
                                                  padding: 69px 39px 0;
                                                  margin: auto;
                                                  max-width: 522px;
                                                  border-radius: 0px;
                                                  align-self: center;
                                                ">
                      <div class="message" style="
                                                    font-family: 'Inter', sans-serif;
                                                    font-style: normal;
                                                    font-weight: normal;
                                                    font-size: 15px;
                                                    line-height: 24px;
                                                    color: #343434;
                                                    width: 379px;
                                                    left: 139px;
                                                    top: 126px;
                                                    margin-bottom: 10px;
                                                  ">
                          Hi ${user_names}. <br>
                          You have successfully enrolled in <br>
                          <b>${course_name}</b>. <br>
                          Click the button below to log into your account. <br>

                      </div>
                      <div class="text-center" style="text-align: center">
                          <a href="${link}" target="_blank" rel="noopener noreferrer">
                              <button class="confirm" style="
                                                        height: 54px;
                                                        width: 172px;
                                                        border-radius: 10px;
                                                        background: #193074;
                                                        color: white;
                                                        border: none;
                                                        text-align: center;
                                                        margin: 31px auto 4px;
                                                        cursor: pointer;
                                                      " onfocus="this.style.outline='none'">
                                  LOGIN
                              </button>
                          </a>
                      </div>
                      <div class="thanks" style="
                                                    font-family: 'Inter', sans-serif;
                                                    font-size: 15px;
                                                    font-style: normal;
                                                    font-weight: 400;
                                                    line-height: 24px;
                                                    letter-spacing: 0em;
                                                    text-align: left;
                                                    margin: 50px 0 0;
                                                    height: 60px;
                                                    width: 126px;
                                                    left: 39px;
                                                    top: 328px;
                                                  ">
                          Thanks,
                          <br />
                          Kurious learn team
                      </div>
                      <div style="
                                                    padding: 12px;
                                                    text-align: center;
                                                    font-family: 'Helvetica';
                                                    font-style: normal;
                                                    font-weight: 300;
                                                    font-size: 10px;
                                                    line-height: 30px;
                                                    color: #343434;
                                                  ">
                          Learn, Connect, Engage
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
                      <a href="#" target="_blank" rel="noopener noreferrer">
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
                      <a href="https://twitter.com/kuriouslearnRw" target="_blank" rel="noopener noreferrer">
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