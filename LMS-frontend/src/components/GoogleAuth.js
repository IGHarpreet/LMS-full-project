import React from "react";
import { GoogleLogin } from "react-google-login";

import axios from "axios";

const Googlelogin = () => {
  const responseSuccessGoogle = (response) => {
    // console.log(response);
    axios({
      method: "POST",
      url: `${process.env.REACT_APP_BASE_URL}/user/googlelogin`,
      data: { profileObj: response.profileObj },
    }).then((response) => {
      // console.log("Google Login Success", response);
    });
  };

  const responseErrorGoogle = (response) => {};

  return (
    <GoogleLogin
      clientId="782778790753-11hlt4rsr491dbmdaej4udve468rldgr.apps.googleusercontent.com"
      buttonText="Login with Google"
      onSuccess={responseSuccessGoogle}
      onFailure={responseErrorGoogle}
      cookiePolicy={"single_host_origin"}
    />
  );
};

export default Googlelogin;
