import type { Tweet, User } from '../InterceptorModules/types';
import type * as Database from '~types/database-explicit-types';
import Dexie, { type EntityTable, type Transaction } from 'dexie';
import type { UserID, UserMinimal } from './dbUtils';

export type TimedObject = {
  timestamp: string;
  type: string;
  item_id: string;
  originator_id: string;
  data: any
  user_id: string;
};

export type TimedObjectWithCanSendToCA = TimedObject & {
  canSendToCA?: boolean;
  reason?: string;
  date_added: string;
}

export type TimedUserMention = UserID & {
  timestamp: string;
}

export type UserRelation = {
  id?: number;
  owner_id: string;
  user_id: string;
  updated_at: number;
}

export type UserProfile = {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_media_url?: string;
  header_media_url?: string;
  num_tweets?: number;
  num_following?: number;
  num_followers?: number;
  num_likes?: number;
  last_updated: number;
}

const indexDB = new Dexie('tes') as Dexie & {
  data: EntityTable<TimedObjectWithCanSendToCA, 'item_id'>;
  userMentions: EntityTable<TimedUserMention, 'id'>;
  profiles: EntityTable<UserProfile, 'user_id'>;
  moots: EntityTable<UserRelation, 'id'>;
  followers: EntityTable<UserRelation, 'id'>;
  follows: EntityTable<UserRelation, 'id'>;
};

// Schema declaration:
indexDB.version(1).stores({
  data: 'item_id, originator_id, timestamp, canSendToCA',
  userMentions: 'id,timestamp',
  profiles: 'user_id, username, updated_at',
  moots: '++id, owner_id, user_id,  updated_at',
  followers: '++id, owner_id, user_id,  updated_at',
  follows: '++id, owner_id, user_id,  updated_at'

})

export { indexDB };
