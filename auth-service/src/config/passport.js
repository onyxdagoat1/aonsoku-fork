const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const userModel = require('../models/user');

module.exports = (passport) => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with this Google ID
            let user = await userModel.findByGoogleId(profile.id);

            if (!user) {
              // Check if email already exists
              const email = profile.emails[0].value;
              user = await userModel.findByEmail(email);

              if (user) {
                // Link Google account to existing user
                user = await userModel.linkGoogleAccount(user.id, profile.id, profile.photos[0]?.value);
              } else {
                // Create new user
                user = await userModel.createFromOAuth({
                  email,
                  username: profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
                  googleId: profile.id,
                  avatarUrl: profile.photos[0]?.value,
                  displayName: profile.displayName
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  // Discord OAuth Strategy
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(
      new DiscordStrategy(
        {
          clientID: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
          callbackURL: process.env.DISCORD_CALLBACK_URL,
          scope: ['identify', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with this Discord ID
            let user = await userModel.findByDiscordId(profile.id);

            if (!user) {
              // Check if email already exists
              const email = profile.email;
              user = await userModel.findByEmail(email);

              if (user) {
                // Link Discord account to existing user
                const avatarUrl = profile.avatar
                  ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                  : null;
                user = await userModel.linkDiscordAccount(user.id, profile.id, avatarUrl);
              } else {
                // Create new user
                const avatarUrl = profile.avatar
                  ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                  : null;
                user = await userModel.createFromOAuth({
                  email,
                  username: profile.username + '_' + Date.now(),
                  discordId: profile.id,
                  avatarUrl,
                  displayName: profile.username
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }
};