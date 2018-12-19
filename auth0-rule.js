function (user, context, callback) {
  console.log("Rule starts");
  console.log(context.protocol);
  if (context.protocol === "redirect-callback") {
    // User was redirected to the /continue endpoint
    console.log("Back");
    // Was it an enrollment?
    if (context.request.query.enrolled) {
      // New enrollment, add to metadata
      console.log(`New user ${context.request.query.enrolled}`);
      user.user_metadata = user.user_metadata || {};
      user.user_metadata.voiceitId = context.request.query.enrolled;
      auth0.users.updateUserMetadata(user.user_id, user.user_metadata).then(function(){
        callback(null, user, context);
      });
      return callback(null, user, context);
    } else {
      // Logged in 
      // Validate the token
      let payload = jwt.verify(context.request.query.token, "auth0-voiceit-shared");
     
      if (payload.userAuthenticated) {
         return callback(null, user, context);
      } else {
        return callback(new UnauthorizedError("MFA with VoiceIt failed"));
      }
       
    }
  } else {
    console.log("Prepare redirect");
    const voiceitId = (user.user_metadata && user.user_metadata.voiceitId) ? user.user_metadata.voiceitId : null;
    const BASE = "https://auth0-playground.com/voiceit/";
    const page = voiceitId ? `2fa.html?userId=${voiceitId}` : "enroll.html";
    const redirectUrl = `${BASE}${page}`;
    context.redirect = {
      url: redirectUrl
    };
    return callback(null, user, context);
  }
  
}