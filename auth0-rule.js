function (user, context, callback) {
  let err = null;

  // First time hitting this rule, prepare redirection
  if (context.protocol !== "redirect-callback") {
    // If the user is already enrolled, he should have a VoiceIt ID
    const voiceitId = (user.user_metadata && user.user_metadata.voiceitId) ? user.user_metadata.voiceitId : null;
    const BASE = "https://auth0-playground.com/voiceit";
    const page = "2fa.html";
    const params = voiceitId ? `userId=${voiceitId}` : "";
    const redirectUrl = `${BASE}/${page}?${params}`;

    context.redirect = {
      url: redirectUrl
    };
  }

  // Following an enrollment
  if (context.protocol === "redirect-callback" && context.request.query.enrolled) {
    user.user_metadata = user.user_metadata || {};
    user.user_metadata.voiceitId = context.request.query.enrolled;
    auth0.users.updateUserMetadata(user.user_id, user.user_metadata).then(function() {
      callback(err, user, context);
    });
  }

  // Following a 2FA with VoiceIt
  if (context.protocol === "redirect-callback") {
    // Decode JWT
    let payload = jwt.verify(context.request.query.token, "auth0-voiceit-shared");

    if (!payload.userAuthenticated) {
      // 2FA failed
      err = new UnauthorizedError("MFA with VoiceIt failed");
    }
  }

  return callback(err, user, context);
}