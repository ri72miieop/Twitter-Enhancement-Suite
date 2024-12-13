import type { Tweet, User } from '../InterceptorModules/types';
import type * as Database from '~types/database-explicit-types';
import Dexie, { type EntityTable, type Transaction } from 'dexie';



export type TimedObject = {
  timestamp: string;
  type: string;
  item_id: string;
  originator_id: string;
  data:any
  user_id: string;
  
};


const indexDB = new Dexie('tes') as Dexie & {
 //tweets: EntityTable<
 //  TimedObject<Tweet>,
 //  'rest_id' // primary key "id" (for the typings only)
 //>;

  data: EntityTable<
    TimedObject,
    'item_id' // primary key "id" (for the typings only)
  >;

};

// Schema declaration:
indexDB.version(1).stores({
  data: 'item_id, originator_id, timestamp',
})


export { indexDB };
