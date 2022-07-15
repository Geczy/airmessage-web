import { ConversationItem } from "lib/data/blocks";

//The app-wide cache for locally-stored messages
const localMessageCache = new Map<number, ConversationItem[]>();
export default localMessageCache;
