const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const { findUserById, findOrCreateOAuthUser } = require('../models/user');

/**
 * Configure Passport strategies
 */
function configurePassport(db) {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await findUserById(db, id);
      done(null, user);
    } catch (error) {
      done(error);
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
            const email = profile.emails[0].value;
            const userData = {
              google_id: profile.id,
              email,
              username: email.split('@')[0] + '_google',
              avatar_url: profile.photos[0]?.value,
              display_name: profile.displayName,
              is_verified: true
            };

            const user = await findOrCreateOAuthUser(db, 'google', userData);
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
    console.log('✓ Google OAuth strategy configured');
  } else {
    console.log('⚠ Google OAuth not configured (missing credentials)');
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
            const userData = {
              discord_id: profile.id,
              email: profile.email,
              username: profile.username,
              avatar_url: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
              display_name: profile.username,
              is_verified: profile.verified
            };

            const user = await findOrCreateOAuthUser(db, 'discord', userData);
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
    console.log('✓ Discord OAuth strategy configured');
  } else {
    console.log('⚠ Discord OAuth not configured (missing credentials)');
  }

  return passport;
}

module.exports = { configurePassport };
