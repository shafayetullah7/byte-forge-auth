import { User, UserLocalAuth } from 'src/drizzle/schema';

export type LocalUserAuth = { user: User; userLocalAuth: UserLocalAuth };
