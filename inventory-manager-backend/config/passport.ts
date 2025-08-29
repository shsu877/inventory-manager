import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models';

interface JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

export default (passport: any) => {
  passport.use(
    new JwtStrategy(opts, async (payload: JwtPayload, done) => {
      try {
        const user = await User.findById(payload.userId);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};