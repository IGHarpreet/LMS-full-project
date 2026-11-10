import React from "react";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import { useState } from "react";

const Googlelogin = () => {
  const clientId =
    "317246931927-jcahmmoa74nit40ciubn481gkv9dnqpn.apps.googleusercontent.com";
  const [showLoginButton, setShowLoginButton] = useState(true);
  const [showLogoutButton, setShowLogoutButton] = useState(false);

  const onLoginSuccess = (res) => {
    console.log("Login Success", res.profileObj);
    setShowLoginButton(false);
    setShowLogoutButton(true);
  };

  const onFailureSuccess = (res) => {
    console.log("Login Failed:", res);
    setShowLoginButton(true);
    setShowLogoutButton(false);
  };

  const onSignoutSuccess = () => {
    alert("You have been signout successfully");
  };

  return (
    <div>
      {showLoginButton ? (
        <GoogleLogin
          clientId={clientId}
          buttonText="Sign in with Google"
          onSuccess={onLoginSuccess}
          onFailure={onFailureSuccess}
          cookiePolicy={"single_host_origin"}
        />
      ) : null}
      {showLogoutButton ? (
        <GoogleLogout
          clientId={clientId}
          buttonText="Logout"
          onLogoutSuccess={onSignoutSuccess}
        ></GoogleLogout>
      ) : null}
    </div>
  );
};

export default Googlelogin;
