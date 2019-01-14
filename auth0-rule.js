function (user, context, callback) {
  if (context.protocol !== "redirect-callback") {
    let redirectUrl = "http://localhost:5000/2fa.html";

    // If the user is already enrolled, he should have a VoiceIt ID
    const voiceitId = (user.user_metadata && user.user_metadata.voiceitId) ? user.user_metadata.voiceitId : null;
    const params = voiceitId ? `userId=${voiceitId}` : "";
    redirectUrl += `?${params}`;

    context.redirect = {
      url: redirectUrl
    };

    callback(null, user, context);
  } else {
    if (context.request.query.enrolled) {
      user.user_metadata = user.user_metadata || {};
      user.user_metadata.voiceitId = context.request.query.enrolled;
      auth0.users.updateUserMetadata(user.user_id, user.user_metadata).then(function() {
        callback(null, user, context);
      });
    } else {
      let err = null;
      // Decode JWT
      let payload = jwt.verify(context.request.query.token, "auth0-voiceit-shared");

      if (!payload.userAuthenticated) {
        // 2FA failed
        err = new UnauthorizedError("MFA with VoiceIt failed");
      }
      callback(err, user, context);
    }
  }
}